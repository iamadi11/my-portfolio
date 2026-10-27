import { describe, expect, it } from 'vitest';

import {
    DEFAULTS,
    formatShare,
    RANGES,
    steps,
    summarize,
    type Inputs,
    type VisitType,
    PREDICT_RTT_MS,
} from './web-request-model';

const at = (visit: VisitType, over: Partial<Inputs> = {}): Inputs => ({ ...DEFAULTS, visit, ...over });

describe('numbers the chapter text quotes (worked example and exercise)', () => {
    it('first visit at the defaults: 200 ms, 150 ms network, 75.0%', () => {
        const s = summarize(at('first'));
        expect(s.totalMs).toBe(200);
        expect(s.networkMs).toBe(150);
        expect(s.serverMs).toBe(50);
        expect(formatShare(s.networkShare)).toBe('75.0%');
    });

    it('repeat visit on a warm connection: 90 ms, 44.4%', () => {
        const s = summarize(at('warm'));
        expect(s.totalMs).toBe(90);
        expect(formatShare(s.networkShare)).toBe('44.4%');
    });

    it('fresh cached copy: 0 ms and "no network used"', () => {
        const s = summarize(at('cached'));
        expect(s.totalMs).toBe(0);
        expect(s.networkShare).toBeNull();
        expect(formatShare(s.networkShare)).toBe('no network used');
    });

    it('exercise: a 120 ms round trip gives 440 ms, 390 ms network (88.6%); 30 ms gives 170 ms', () => {
        const far = summarize(at('first', { rttMs: 120 }));
        expect(far.totalMs).toBe(440);
        expect(far.networkMs).toBe(390);
        expect(formatShare(far.networkShare)).toBe('88.6%');
        expect(summarize(at('first', { rttMs: 120, serverMs: 25 })).totalMs).toBe(415);
        expect(summarize(at('first', { rttMs: 30 })).totalMs).toBe(170);
    });
});

describe('model rules (spec "Visual" step 5)', () => {
    it('first visit: DNS, then one round trip each for TCP, TLS and the request, plus server time', () => {
        expect(steps(at('first')).map((s) => [s.id, s.networkMs, s.serverMs, s.skipped])).toEqual([
            ['dns', 30, 0, null],
            ['tcp', 40, 0, null],
            ['tls', 40, 0, null],
            ['request', 40, 50, null],
        ]);
    });

    it('warm visit skips DNS, TCP and TLS with the reason, and keeps the request', () => {
        expect(steps(at('warm')).map((s) => s.skipped)).toEqual([
            'connection reused',
            'connection reused',
            'connection reused',
            null,
        ]);
    });

    it('each extra millisecond of round trip adds 3 ms to a first visit and 1 ms to a warm one', () => {
        const d = (v: VisitType): number =>
            summarize(at(v, { rttMs: 101 })).totalMs - summarize(at(v, { rttMs: 100 })).totalMs;
        expect(d('first')).toBe(3);
        expect(d('warm')).toBe(1);
        expect(d('cached')).toBe(0);
    });

    it('with every input at its minimum, only three minimum round trips remain (inputs are clamped)', () => {
        const s = summarize(at('first', { rttMs: 0, dnsMs: 0, serverMs: 0 }));
        expect(s.totalMs).toBe(3 * RANGES.rttMs.min);
    });

    it('the predict-then-run answer (repeat visit at 80 ms) is not already shown at the defaults', () => {
        const asked = summarize({ ...DEFAULTS, visit: 'warm', rttMs: PREDICT_RTT_MS }).totalMs;
        expect(asked).toBe(130);
        // Numbers the figure shows before any input: each step, the first-visit total and its parts.
        const shown = summarize(DEFAULTS);
        const visible = [...shown.steps.map((x) => x.networkMs + x.serverMs), shown.totalMs, shown.networkMs];
        expect(visible).not.toContain(asked);
    });

    it('every value the chapter asks the learner to set is reachable on its slider', () => {
        const reachable = (r: { min: number; max: number; step: number }, v: number): boolean =>
            v >= r.min && v <= r.max && (v - r.min) % r.step === 0;
        // Worked example (40/30/50) and exercise (120 and 30 ms round trips; server time halved to 25 ms).
        for (const v of [40, 120, 30, PREDICT_RTT_MS]) expect(reachable(RANGES.rttMs, v)).toBe(true);
        expect(reachable(RANGES.dnsMs, 30)).toBe(true);
        for (const v of [50, 25]) expect(reachable(RANGES.serverMs, v)).toBe(true);
    });
});

describe('invariants over the whole control range', () => {
    /** Minimum, a middle value the slider can reach, and maximum. */
    const grid = (r: { min: number; max: number; step: number }): number[] => [
        r.min,
        r.min + Math.round((r.max - r.min) / 2 / r.step) * r.step,
        r.max,
    ];
    const visits: VisitType[] = ['first', 'warm', 'cached'];

    const cases: Inputs[] = visits.flatMap((visit) =>
        grid(RANGES.rttMs).flatMap((rttMs) =>
            grid(RANGES.dnsMs).flatMap((dnsMs) =>
                grid(RANGES.serverMs).map((serverMs) => ({ visit, rttMs, dnsMs, serverMs }))
            )
        )
    );

    it.each(cases)(
        'totals are the sum of the steps; nothing is negative or NaN; shares in [0, 1] (%o)',
        (input) => {
            const s = summarize(input);
            expect(s.totalMs).toBe(s.steps.reduce((t, x) => t + x.networkMs + x.serverMs, 0));
            const values = [
                s.totalMs,
                s.networkMs,
                s.serverMs,
                ...s.steps.flatMap((x) => [x.networkMs, x.serverMs]),
            ];
            expect(values.every((v) => Number.isFinite(v) && v >= 0)).toBe(true);
            if (s.networkShare !== null) expect(Number.isFinite(s.networkShare)).toBe(true);
            expect(s.networkShare === null || (s.networkShare >= 0 && s.networkShare <= 1)).toBe(true);
        }
    );

    it('inputs outside the ranges or not numbers are clamped, never passed through', () => {
        const s = summarize({ visit: 'first', rttMs: Number.NaN, dnsMs: -50, serverMs: 10_000 });
        expect(s.steps.map((x) => x.networkMs + x.serverMs)).toEqual([0, 5, 5, 5 + 500]);
    });

    it('is deterministic: the same inputs give the same result', () => {
        expect(summarize(at('first', { rttMs: 75 }))).toEqual(summarize(at('first', { rttMs: 75 })));
    });
});
