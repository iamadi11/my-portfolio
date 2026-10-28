import { describe, expect, it } from 'vitest';

import {
    BODY_COUNT,
    BODY_MS,
    EXTRA_MS,
    SHOULDER_MS,
    TAIL_MS,
    callOf,
    countAbove,
    formatMs,
    formatRank,
    gauge,
    marksOf,
    percentile,
    samplesOf,
    sortSamples,
} from './percentile-model';

/** Order statistics from NIST/SEMATECH e-Handbook 7.2.6.2, the resistivity example. */
const NIST_OHM_CM = [
    95.061, 95.0925, 95.1065, 95.1195, 95.1442, 95.1567, 95.1591, 95.1682, 95.1772, 95.1937, 95.1959, 95.199,
];

describe('percentiles', () => {
    it('sorts a known list into order statistics and does not modify the input', () => {
        const input = [TAIL_MS, BODY_MS, SHOULDER_MS, BODY_MS];
        const copy = [...input];
        expect(sortSamples(input)).toEqual([BODY_MS, BODY_MS, SHOULDER_MS, TAIL_MS]);
        expect(input).toEqual(copy);
    });

    it('sorts the assumed durations: 98 short, then 40 ms, then 200 ms', () => {
        const sorted = sortSamples(samplesOf(false));
        expect(sorted).toHaveLength(BODY_COUNT + 2);
        expect(sorted.slice(0, BODY_COUNT).every((sample) => sample === BODY_MS)).toBe(true);
        expect(sorted[BODY_COUNT]).toBe(SHOULDER_MS);
        expect(sorted[BODY_COUNT + 1]).toBe(TAIL_MS);
    });

    it('implements the NIST 7.2.6.2 default (R6), including the published 90th percentile', () => {
        const got = percentile(NIST_OHM_CM, 0.9);
        const y11 = 95.1959;
        const y12 = 95.199;
        expect(got.n).toBe(12);
        expect(got.rank).toBeCloseTo(0.9 * 13, 8);
        expect(got.k).toBe(11);
        expect(got.d).toBeCloseTo(0.7, 8);
        expect(got.valueMs).toBeCloseTo(y11 + 0.7 * (y12 - y11), 8);
        expect(got.valueMs).toBeCloseTo(95.1981, 4);
        expect(NIST_OHM_CM[0]).toBe(95.061);
    });

    it('uses the first sample when the rank is below 1, and the last when the rank passes N', () => {
        const samples = [30, 10, 20];
        const low = percentile(samples, 0.2);
        expect(low.rank).toBeCloseTo(0.8, 8);
        expect(low.k).toBe(0);
        expect(low.valueMs).toBe(10);
        const high = percentile(samples, 0.8);
        expect(high.rank).toBeCloseTo(3.2, 8);
        expect(high.k).toBe(3);
        expect(high.valueMs).toBe(30);
        expect(samples).toEqual([30, 10, 20]);
    });

    it('reads p50 and p99 from the assumed list', () => {
        const samples = samplesOf(false);
        const p50 = percentile(samples, 0.5);
        const p99 = percentile(samples, 0.99);
        expect(p50.rank).toBeCloseTo(50.5, 8);
        expect(p50.k).toBe(50);
        expect(p50.d).toBeCloseTo(0.5, 8);
        expect(p50.valueMs).toBe(BODY_MS);
        expect(countAbove(samples, p50.valueMs)).toBe(2);
        expect(p99.rank).toBeCloseTo(99.99, 8);
        expect(p99.k).toBe(99);
        expect(p99.valueMs).toBeCloseTo(SHOULDER_MS + 0.99 * (TAIL_MS - SHOULDER_MS), 8);
        expect(p99.valueMs).toBeCloseTo(198.4, 8);
        expect(countAbove(samples, p99.valueMs)).toBe(1);
        expect(formatMs(p50.valueMs)).toBe('20 ms');
        expect(formatMs(p99.valueMs)).toBe('198.4 ms');
        expect(formatRank(p50.rank)).toBe('50.5');
        expect(formatRank(p99.rank)).toBe('99.99');
    });

    it('moves p99 and not p50 when one very slow sample is added', () => {
        const before = samplesOf(false);
        const after = samplesOf(true);
        expect(sortSamples(after)).toHaveLength(101);
        expect(sortSamples(after)[100]).toBe(EXTRA_MS);
        const p50Before = percentile(before, 0.5);
        const p50After = percentile(after, 0.5);
        const p99Before = percentile(before, 0.99);
        const p99After = percentile(after, 0.99);
        expect(p50After.rank).toBeCloseTo(51, 8);
        expect(p50After.valueMs).toBe(p50Before.valueMs);
        expect(p50After.valueMs).toBe(BODY_MS);
        expect(p99After.rank).toBeCloseTo(100.98, 8);
        expect(p99After.k).toBe(100);
        expect(p99After.valueMs).toBeCloseTo(TAIL_MS + 0.98 * (EXTRA_MS - TAIL_MS), 8);
        expect(p99After.valueMs).toBeCloseTo(788, 8);
        expect(p99After.valueMs).toBeGreaterThan(p99Before.valueMs);
        expect(countAbove(after, p50After.valueMs)).toBe(3);
        expect(countAbove(after, p99After.valueMs)).toBe(1);
        expect(formatMs(p99After.valueMs)).toBe('788 ms');
        expect(formatRank(p99After.rank)).toBe('100.98');
    });

    it('rejects an empty list, a non-finite sample, and a p that is not a fraction in (0, 1)', () => {
        expect(() => percentile([], 0.5)).toThrow(/at least one/);
        expect(() => percentile([Number.NaN], 0.5)).toThrow(/finite/);
        expect(() => percentile([10, 20], 0)).toThrow(/between 0 and 1/);
        expect(() => percentile([10, 20], 1)).toThrow(/between 0 and 1/);
    });

    it('places the learn stops on the median and the 99th percentile', () => {
        const run = gauge({ p: 0.99, extra: false });
        expect(marksOf(run, true)).toEqual([run.median.rank, run.high.rank]);
        expect(marksOf(run, false)).toEqual([run.high.rank]);
        expect(gauge({ p: 0.5, extra: true }).chosen.valueMs).toBe(BODY_MS);
        expect(callOf({ p: 0.5, extra: true })).toBe('short');
        expect(callOf({ p: 0.99, extra: false })).toBe('end');
        expect(callOf({ p: 0.99, extra: true })).toBe('end');
    });
});
