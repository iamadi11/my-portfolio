import { describe, expect, it } from 'vitest';

import { filmDuration, sampleFilm, type LessonFilmData } from './film-model';
import {
    SECURITY_MODELS,
    isSecurityMechanism,
    simulateSecurity,
    type SecurityMechanism,
} from './security-models';

const metric = (kind: SecurityMechanism, amount: number, alternative: boolean, label: string) =>
    simulateSecurity(kind, { amount, alternative }).metrics.find((item) => item.label === label)?.value;

const filmFor = (kind: SecurityMechanism, amount: number, alternative: boolean): LessonFilmData => ({
    id: kind,
    question: 'Predict the security boundary',
    takeaway: 'Interpret the actual trace',
    sourceHref: '/learn/sources',
    nodes: ['c', 'a', 'b', 'd'].map((id, i) => ({
        id,
        kind: 'server',
        label: id,
        x: i * 200,
        y: 200,
    })),
    links: [
        ['a', 'b'],
        ['b', 'd'],
    ],
    beats: simulateSecurity(kind, { amount, alternative }).beats,
});

describe('security boundary companions', () => {
    it('accepts a matching token under either purpose without confusing identity with API permission', () => {
        expect(metric('tokenPurpose', 1, false, 'API permissions granted')).toBe('1');
        expect(metric('tokenPurpose', 1, false, 'Identity results accepted by client')).toBe('0');
        expect(metric('tokenPurpose', 1, true, 'API permissions granted')).toBe('0');
        expect(metric('tokenPurpose', 1, true, 'Identity results accepted by client')).toBe('1');
        for (const alternative of [false, true]) {
            expect(simulateSecurity('tokenPurpose', { amount: 1, alternative }).outcome).toBe(
                'Token accepted for this purpose'
            );
            for (const amount of [2, 3, 4]) {
                expect(simulateSecurity('tokenPurpose', { amount, alternative }).outcome).toBe(
                    'Token rejected for this purpose'
                );
                expect(metric('tokenPurpose', amount, alternative, 'API permissions granted')).toBe('0');
                expect(
                    metric('tokenPurpose', amount, alternative, 'Identity results accepted by client')
                ).toBe('0');
            }
        }
    });

    it('distinguishes audience, context and token-purpose rejection while keeping cryptography an assumption', () => {
        const captions = (amount: number, alternative: boolean) =>
            simulateSecurity('tokenPurpose', { amount, alternative })
                .beats.map((b) => b.caption)
                .join(' ');
        expect(captions(2, false)).toContain('another recipient');
        expect(captions(3, false)).toContain('lacks profile:read');
        expect(captions(3, true)).toContain('nonce differs');
        expect(captions(4, false)).toContain('even if a recipient value happens to match');
        expect(captions(4, true)).toContain('even if a recipient value happens to match');
        expect(simulateSecurity('tokenPurpose', { amount: 1, alternative: false }).explanation).toContain(
            'OAuth tokens need not be JWTs'
        );
    });

    it('preserves every untrusted fragment as text at the ordinary text sink', () => {
        for (const amount of [1, 3, 8]) {
            expect(metric('xssContext', amount, true, 'Fragments interpreted as markup')).toBe('0');
            expect(metric('xssContext', amount, true, 'Fragments rendered as plain text')).toBe(
                String(amount)
            );
            expect(metric('xssContext', amount, false, 'Fragments interpreted as markup')).toBe(
                String(amount)
            );
            expect(metric('xssContext', amount, false, 'Fragments rendered as plain text')).toBe('0');
            const safe = filmFor('xssContext', amount, true);
            expect(sampleFilm(safe, filmDuration(safe)).values.d).toBe('literal <em>hello</em>');
        }
        expect(simulateSecurity('xssContext', { amount: 3, alternative: false }).explanation).toContain(
            'does not assert that every innerHTML string executes JavaScript'
        );
    });

    it('does not change state for forged missing/wrong CSRF tokens when validation is enabled', () => {
        for (const amount of [2, 3]) {
            expect(metric('csrf', amount, false, 'Session cookie present')).toBe('1');
            expect(metric('csrf', amount, false, 'Forged changes applied')).toBe('1');
            expect(metric('csrf', amount, true, 'Protected state changes')).toBe('0');
            expect(metric('csrf', amount, true, 'Forged changes applied')).toBe('0');
            const rejected = filmFor('csrf', amount, true);
            for (let t = 0; t <= filmDuration(rejected); t += 0.1)
                expect(sampleFilm(rejected, t).counts.d).toBe(0);
        }
    });

    it('accepts a legitimate matching CSRF token and rejects absent authentication under either policy', () => {
        for (const alternative of [false, true]) {
            expect(metric('csrf', 1, alternative, 'Protected state changes')).toBe('1');
            expect(metric('csrf', 1, alternative, 'Forged changes applied')).toBe('0');
            expect(metric('csrf', 4, alternative, 'Protected state changes')).toBe('0');
            expect(metric('csrf', 4, alternative, 'Session cookie present')).toBe('0');
        }
    });

    it('makes every allowed case selectable and seekable without implying refusal is packet loss', () => {
        for (const kind of Object.keys(SECURITY_MODELS) as SecurityMechanism[]) {
            const spec = SECURITY_MODELS[kind];
            const min = simulateSecurity(kind, { amount: spec.min, alternative: false });
            const max = simulateSecurity(kind, { amount: spec.max, alternative: false });
            expect(min).not.toEqual(max);
            for (let amount = spec.min; amount <= spec.max; amount++)
                for (const alternative of [false, true]) {
                    const input = { amount, alternative };
                    const trace = simulateSecurity(kind, input);
                    expect(spec.predictions).toContain(trace.outcome);
                    expect(simulateSecurity(kind, input)).toEqual(trace);
                    expect(trace.beats.every((beat) => !beat.lost)).toBe(true);
                    const film = filmFor(kind, amount, alternative);
                    const end = sampleFilm(film, filmDuration(film));
                    expect(Object.values(end.counts).every((n) => Number.isInteger(n) && n >= 0)).toBe(true);
                    for (const beat of trace.beats)
                        for (const endpoint of [beat.from, beat.to].filter(Boolean))
                            expect(film.nodes.some((node) => node.id === endpoint)).toBe(true);
                }
            expect(simulateSecurity(kind, { amount: NaN, alternative: false })).toEqual(
                simulateSecurity(kind, { amount: spec.initial, alternative: false })
            );
            expect(simulateSecurity(kind, { amount: -100, alternative: true })).toEqual(
                simulateSecurity(kind, { amount: spec.min, alternative: true })
            );
            expect(simulateSecurity(kind, { amount: 100, alternative: true })).toEqual(
                simulateSecurity(kind, { amount: spec.max, alternative: true })
            );
        }
        expect(isSecurityMechanism('tokenPurpose')).toBe(true);
        expect(isSecurityMechanism('csrf')).toBe(true);
        expect(isSecurityMechanism('toString')).toBe(false);
        expect(isSecurityMechanism('__proto__')).toBe(false);
        expect(isSecurityMechanism('random-packet-animation')).toBe(false);
    });
});
