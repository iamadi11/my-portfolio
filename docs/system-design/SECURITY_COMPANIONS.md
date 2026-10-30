# Security companions

Implemented 2026-10-30 in `src/lib/learn/security-models.ts`; these are pure teaching models, not security controls for this website. Existing credential and SQL-injection models remain separate.

| Mechanism | Beginner question | Changed input | Comparison and observable result |
| --- | --- | --- | --- |
| `tokenPurpose` | Does a valid token prove both who I am and what an API lets me do? | Four token cases: matching; another audience; missing scope/wrong requested nonce; wrong token purpose | API access-token validation versus client ID-token validation. The accepted result is scoped API permission or an authentication result, never an automatic conversion between them. |
| `xssContext` | Why can displaying a comment change the page structure? | One to eight untrusted fragments | Unsanitized HTML parsing versus an ordinary element’s text sink. Exact fragment counts and literal text differ; no exploit executes. |
| `csrf` | Can another site cause a browser to change my account while I am signed in? | Legitimate matching token; forged missing token; forged wrong token; no session cookie | Cookie-only acceptance versus server-side synchronizer-token validation before mutation. Accepted changes are counted; rejected requests keep protected state unchanged. |

The numeric case labels are categorical selectors, not severity scores. Their full mapping appears in the control label. Both policies receive the same chosen case. Valid tokens/legitimate requests pass under either applicable policy; absence of authentication fails under both. Verdicts follow state, not the selected alternative.

The trace uses `a`, `b`, `d` for state-owning components and the shared observer `c`. It drives captions, packets, values and counts. Application refusal is neither transport loss nor a broken component. A rejected mutation produces no database-write packet.

## Boundaries

- Token issuance, redirects, consent, PKCE, signatures, issuer discovery, expiry and replay storage are assumed or omitted. The model isolates purpose/recipient/context checks. The access-token example uses the RFC 9068 JWT profile; OAuth does not require JWT tokens. The ID-token scenario explicitly sent a nonce, so a matching nonce is required. These checks are not complete protocol validation.
- The XSS example uses harmless `<em>hello</em>` as data. Parsing untrusted markup shows a trust boundary; it does not prove every `innerHTML` string executes script. The safe sink is `textContent` on an ordinary element, not a script/style element. URLs, attributes, script contexts and intended rich HTML require their own handling; intentional HTML needs maintained sanitization.
- CSRF cases 2/3 assume a cookie policy that permits the cross-site POST to carry the session cookie. Case 4 supplies none. The synchronizer token is explicitly submitted and matched against the server session; secure generation and session binding are assumptions. SameSite, origin/Fetch Metadata checks and XSS defenses have separate responsibilities.

## Primary sources read

Opened via web on **2026-10-30**; examples and model cases are authored simplifications.

- [OpenID Connect Core 1.0, errata set 2](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation), §2 and §3.1.3.7: client audience, requested nonce and identity result.
- [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749.html#section-1.4), §1.4 and §3.3: access token and scope. This is a purpose distinction, not a recommended implementation of historical grant flows.
- [RFC 9068](https://www.rfc-editor.org/rfc/rfc9068.html#section-4), §2 and §4: explicit JWT access-token typing, resource audience and validation requirements.
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), Safe Sinks, Dangerous Contexts and HTML Sanitization: context-appropriate handling.
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), Synchronizer Token Pattern and SameSite defense in depth: validate before protected changes.

## Verification

`security-models.test.ts`: six tests pass. They cover matching and wrong-purpose tokens, audience/context counterexamples, identity-versus-API permission, exact rendered fragment counts, forged-request state invariants, legitimate and unauthenticated cases under both policies, finite inputs, deterministic seeks and invalid-input clamping. They do not establish real cryptographic security or rendered accessibility. Course integration and browser acceptance are recorded by the main mission report.
