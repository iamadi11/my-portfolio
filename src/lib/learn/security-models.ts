import type { ExperimentInput, MechanismDefinition, Trace } from './experiment-model';
import type { FilmBeat } from './film-model';

const definition = (
    label: string,
    modes: [string, string],
    predictions: [string, string],
    roles: [string, string, string],
    initial: number,
    max: number,
    kinds: MechanismDefinition['kinds']
): MechanismDefinition => ({ label, modes, predictions, roles, min: 1, max, initial, kinds });

/** Small teaching models, never authentication/encoding/CSRF protection for the host application. */
export const SECURITY_MODELS = {
    tokenPurpose: definition(
        'Token case: 1 valid, 2 wrong audience, 3 scope/nonce mismatch, 4 wrong token kind',
        ['API validates access token', 'Client validates OIDC ID token'],
        ['Token rejected for this purpose', 'Token accepted for this purpose'],
        ['Trusted issuer', 'Purpose-specific validator', 'Validated result'],
        2,
        4,
        ['server', 'server', 'store']
    ),
    xssContext: definition(
        'Untrusted comment fragments',
        ['Insert untrusted HTML without sanitization', 'Write plain text to ordinary element'],
        ['Untrusted markup interpreted', 'Untrusted content stays text'],
        ['Untrusted comments', 'Rendering sink', 'Browser content'],
        3,
        8,
        ['store', 'server', 'computer']
    ),
    csrf: definition(
        'POST case: 1 valid token, 2 missing token, 3 wrong token, 4 no session cookie',
        ['Trust session cookie alone', 'Check session and synchronizer token'],
        ['State unchanged', 'State changed'],
        ['Browser request', 'Server request checks', 'Account settings'],
        2,
        4,
        ['computer', 'server', 'store']
    ),
};

export type SecurityMechanism = keyof typeof SECURITY_MODELS;
export const isSecurityMechanism = (kind: string): kind is SecurityMechanism =>
    Object.hasOwn(SECURITY_MODELS, kind);

export const SECURITY_SOURCES = {
    oidc: {
        url: 'https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation',
        section: '2; 3.1.3.7 audience and requested nonce validation',
        read: '2026-10-30',
    },
    oauth: {
        url: 'https://www.rfc-editor.org/rfc/rfc6749.html#section-1.4',
        section: '1.4 access tokens; 3.3 scope',
        read: '2026-10-30',
    },
    accessJwt: {
        url: 'https://www.rfc-editor.org/rfc/rfc9068.html#section-4',
        section: '2 explicit access-token type; 4 resource audience and validation',
        read: '2026-10-30',
    },
    xss: {
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
        section: 'HTML sanitization; Safe Sinks; Dangerous Contexts',
        read: '2026-10-30',
    },
    csrf: {
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html',
        section: 'Introduction; Synchronizer Token Pattern; SameSite defense in depth',
        read: '2026-10-30',
    },
};

export function simulateSecurity(kind: SecurityMechanism, input: ExperimentInput): Trace {
    const spec = SECURITY_MODELS[kind];
    const n = Math.max(
        spec.min,
        Math.min(spec.max, Math.floor(Number.isFinite(input.amount) ? input.amount : spec.initial))
    );
    const alt = input.alternative === true;
    const beats: FilmBeat[] = [];
    const add = (beat: FilmBeat): void => {
        beats.push(beat);
    };
    if (kind === 'tokenPurpose') {
        // Assumed authentic, unexpired tokens. Case 4 swaps purposes while preserving a matching audience,
        // so type/purpose rejection cannot be mistaken for only an audience check.
        const expectedKind = alt ? 'ID token' : 'access token';
        const tokenKind = n === 4 ? (alt ? 'access token' : 'ID token') : expectedKind;
        const expectedAudience = alt ? 'web-client' : 'profile-api';
        const audience = n === 2 ? 'another-recipient' : expectedAudience;
        const scope = n === 3 ? 'profile:write' : 'profile:read';
        const nonce = n === 3 ? 'another-login' : 'login-7';
        const accepted = tokenKind === expectedKind && audience === expectedAudience && n !== 3;
        add({
            title: 'Two tokens have different jobs',
            caption: alt
                ? 'An ID token reports authentication to its client. It is not a general API access credential.'
                : 'An access token authorizes access to a resource under its scope and validation rules.',
            values: { a: 'issuer, signature and expiry assumed valid', b: `expects ${expectedKind}` },
        });
        add({
            title: 'Present the token for a declared purpose',
            caption: alt
                ? `The client expects audience web-client and the nonce login-7 from this authentication request. Case ${n} is selected.`
                : `The API expects audience profile-api and permission profile:read. Case ${n} is selected.`,
            from: 'a',
            to: 'b',
            packet: tokenKind,
            values: {
                a: `${tokenKind}; aud=${audience}`,
                b: alt ? `nonce=${nonce}` : `scope=${scope}`,
            },
        });
        add({
            title: 'Validate purpose and context',
            caption: accepted
                ? 'The token matches this purpose, recipient and required context. Other security checks remain explicit assumptions.'
                : n === 4
                  ? 'A token for another purpose is rejected, even if a recipient value happens to match.'
                  : n === 2
                    ? 'The token names another recipient. This validator rejects it.'
                    : alt
                      ? 'The nonce differs from the value sent for this login. The client rejects the ID token.'
                      : 'The token lacks profile:read. The API refuses the requested action.',
            states: { b: 'done' },
            values: { b: accepted ? 'context matched' : 'context rejected' },
        });
        add({
            title: 'Observe only the validated result',
            caption: accepted
                ? alt
                    ? 'The client can use the validated authentication result. This does not grant profile-api access.'
                    : 'This assumed-valid access token meets the API permission required in this model.'
                : 'No identity result or API permission is accepted from this token in this run.',
            ...(accepted ? { from: 'b', to: 'd', packet: alt ? 'Identity result' : 'Scoped access' } : {}),
            values: {
                d: accepted ? (alt ? 'identity result only' : 'profile:read permitted') : 'not accepted',
            },
            counts: { d: accepted ? 1 : 0 },
        });
        return {
            beats,
            outcome: spec.predictions[accepted ? 1 : 0],
            metrics: [
                { label: 'Accepted tokens for this purpose', value: accepted ? '1' : '0' },
                { label: 'API permissions granted', value: accepted && !alt ? '1' : '0' },
                { label: 'Identity results accepted by client', value: accepted && alt ? '1' : '0' },
            ],
            explanation:
                'OAuth access tokens and OIDC ID tokens serve different recipients and purposes. This access-token example assumes the RFC 9068 JWT profile; OAuth tokens need not be JWTs. Issuance, redirects, PKCE, cryptography, expiry, issuer discovery and replay storage are not simulated. The nonce was sent in this modeled authentication request, so its matching check is required. Use maintained libraries and complete protocol validation in real applications.',
        };
    }
    if (kind === 'xssContext') {
        add({
            title: 'Treat comments as untrusted data',
            caption: `${n} comment fragments contain harmless illustrative markup: <em>hello</em>. No exploit code is executed by this model.`,
            values: {
                a: '<em>hello</em>',
                b: alt ? 'ordinary element textContent' : 'unsanitized innerHTML',
            },
            counts: { a: n, d: 0 },
        });
        add({
            title: 'Choose the browser interpretation boundary',
            caption: alt
                ? 'An ordinary element receives the string through textContent; its characters become text, not HTML structure.'
                : 'Unsanitized innerHTML sends untrusted strings into HTML parsing. Content may influence page structure and introduce an XSS risk.',
            from: 'a',
            to: 'b',
            packet: 'Untrusted text',
            counts: { b: n },
        });
        add({
            title: 'Inspect what the sink produces',
            caption: alt
                ? 'The page displays literal angle brackets and tag text. No markup was interpreted at this sink.'
                : 'The example markup becomes emphasized content. Interpretation is demonstrated; successful script execution is not claimed.',
            from: 'b',
            to: 'd',
            packet: alt ? 'Text nodes' : 'Parsed markup',
            values: { d: alt ? 'literal <em>hello</em>' : 'emphasis element containing hello' },
            counts: { d: n },
        });
        return {
            beats,
            outcome: spec.predictions[alt ? 1 : 0],
            metrics: [
                { label: 'Fragments interpreted as markup', value: alt ? '0' : String(n) },
                { label: 'Fragments rendered as plain text', value: alt ? String(n) : '0' },
            ],
            explanation:
                'Untrusted data needs handling appropriate to its output context. This comparison covers plain text in an ordinary HTML element only, not script/style/URL contexts. If users must author HTML, use a maintained sanitizer and preserve its result. Parsing markup demonstrates a dangerous trust boundary; it does not assert that every innerHTML string executes JavaScript. No HTML is injected or executed by this teaching model.',
        };
    }
    // Authenticated state-changing POST. In cases 2/3 cross-site cookies are deliberately allowed by
    // the scenario's cookie policy. Case 4 supplies no credential, so neither policy changes state.
    const cookie = n !== 4;
    const tokenMatches = n === 1;
    const accepted = cookie && (!alt || tokenMatches);
    add({
        title: 'A browser prepares a state-changing POST',
        caption:
            n === 1
                ? 'The legitimate page sends the session cookie and its matching synchronizer token.'
                : n === 4
                  ? 'A forged cross-site POST has no session cookie in this scenario.'
                  : 'Another site causes a POST. Assume the browser cookie policy allows the session cookie to accompany this request.',
        values: { a: cookie ? 'session cookie attached' : 'no session cookie', d: 'setting unchanged' },
        counts: { d: 0 },
    });
    add({
        title: 'Receive credentials and submitted token',
        caption: `Case ${n}: submitted token is ${n === 1 ? 'matching' : n === 3 ? 'incorrect' : 'missing'}. A session cookie alone does not establish intent.`,
        from: 'a',
        to: 'b',
        packet: 'POST with request metadata',
        values: { b: alt ? 'require session + token' : 'require session only' },
    });
    add({
        title: 'Check before changing application state',
        caption: !cookie
            ? 'No authenticated session is present. The action is refused under either policy.'
            : alt && !tokenMatches
              ? 'The token is absent or does not match the server session. Reject before applying the change.'
              : alt
                ? 'The authenticated session and explicitly submitted token match this request.'
                : 'The server trusts the cookie alone, including the forged requests in cases 2 and 3.',
        values: { b: accepted ? 'action admitted' : 'action rejected' },
        states: { b: 'done' },
    });
    add({
        title: accepted ? 'Apply the setting change' : 'Keep the previous setting',
        caption: accepted
            ? 'The application applies one setting change. For a forged request, this is an unwanted authenticated action.'
            : 'No protected state change occurred. Rejecting a request is not packet loss or server failure.',
        ...(accepted ? { from: 'b', to: 'd', packet: 'Apply setting change' } : {}),
        values: { d: accepted ? 'setting changed' : 'setting unchanged' },
        counts: { d: accepted ? 1 : 0 },
    });
    return {
        beats,
        outcome: spec.predictions[accepted ? 1 : 0],
        metrics: [
            { label: 'Session cookie present', value: cookie ? '1' : '0' },
            { label: 'Protected state changes', value: accepted ? '1' : '0' },
            { label: 'Forged changes applied', value: accepted && n !== 1 ? '1' : '0' },
        ],
        explanation:
            'This synchronizer-token example validates a submitted token against server session state before a protected POST. Cookies may accompany cross-site requests depending on request and cookie policies; case 4 has no cookie. SameSite and origin/Fetch Metadata checks provide other defenses under their assumptions. Tokens require secure generation and session binding; XSS can undermine CSRF defenses. The code models decisions only and implements no real session or protection.',
    };
}
