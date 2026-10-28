/**
 * Teaching model for percentiles. A fixed list of durations, sorted. A percentile
 * is a rank in that list. The median can sit among the short durations while a
 * high rank sits at the slow end.
 *
 * Definition implemented: NIST/SEMATECH e-Handbook 7.2.6.2, the default estimate
 * on that page (the page identifies it as Hyndman and Fan's R6). Not nearest-rank.
 * For N finite samples and a fraction p strictly between 0 and 1:
 *   rank = p (N + 1) = k + d, k an integer, d the fractional part in [0, 1).
 *   If k = 0, the value is the first order statistic Y[1].
 *   If k >= N, the value is the last order statistic Y[N].
 *   Otherwise the value is Y[k] + d (Y[k + 1] - Y[k]).
 * That section calls the 50th percentile the median.
 *
 * 1. Inputs: the fraction p (0.50 or 0.99 on the bench) and whether the extra
 *    slow sample is included.
 * 2. State: the sorted durations, in milliseconds, and the rank of each percentile.
 * 3. Rules: sort ascending. Read the value at the rank above. Count samples
 *    strictly greater than that value.
 * 4. Equations: rank = p (N + 1). Value as the three cases above. N is the count
 *    of samples. p is a fraction, not a percent. Durations are milliseconds.
 * 5. Assumptions: 98 samples at 20 ms, one at 40 ms, one at 200 ms. The optional
 *    extra sample is 800 ms. Assumed, not a trace, not a measurement from the paper.
 * 6. Outputs: the sorted list, the rank, the value, and the count above that value.
 * 7. Boundaries: on this list the 50th percentile stays 20 ms when the 800 ms
 *    sample is added. The 99th percentile moves. For a short list, a high p can
 *    clamp to the last sample (k >= N).
 * 8. Deterministic. Sort is numeric ascending. Ties keep their relative order.
 * 9. Limits: not every percentile formula (the handbook lists others, including
 *    the elementary nearest-rank method). Not a queue. Not a fan-out across servers.
 *    Not latency versus throughput.
 */

export const BODY_COUNT = 98;
export const BODY_MS = 20;
export const SHOULDER_MS = 40;
export const TAIL_MS = 200;
export const EXTRA_MS = 800;

export const PERCENTILE_CHOICES = [0.5, 0.99] as const;
export type PercentChoice = (typeof PERCENTILE_CHOICES)[number];
export type Inputs = { p: PercentChoice; extra: boolean };
export type Call = 'short' | 'end';

/** Learn plays the list that already has one slow tail, and no extra sample. */
export const LEARN_INPUTS: Inputs = { p: 0.99, extra: false };

export type Percentile = {
    /** Fraction strictly between 0 and 1. 0.5 is the median. */
    p: number;
    /** How many samples went into the rank. */
    n: number;
    /** p (N + 1). The finger's place. May fall between two samples. */
    rank: number;
    /** Integer part of the rank. */
    k: number;
    /** Fractional part of the rank, in [0, 1). */
    d: number;
    /** The percentile, in milliseconds. */
    valueMs: number;
};

export type Run = {
    samples: number[];
    p: PercentChoice;
    extra: boolean;
    median: Percentile;
    high: Percentile;
    chosen: Percentile;
    aboveMedian: number;
    aboveHigh: number;
    aboveChosen: number;
};

export function samplesOf(extra: boolean): number[] {
    const out = Array.from({ length: BODY_COUNT }, () => BODY_MS);
    out.push(SHOULDER_MS, TAIL_MS);
    if (extra) out.push(EXTRA_MS);
    return out;
}

/** Ascending order statistics. Does not modify the input. */
export function sortSamples(samples: readonly number[]): number[] {
    return [...samples].sort((a, b) => a - b);
}

export function percentile(samples: readonly number[], p: number): Percentile {
    if (!Number.isFinite(p) || p <= 0 || p >= 1) {
        throw new Error('p must be a fraction between 0 and 1');
    }
    if (samples.some((sample) => !Number.isFinite(sample))) {
        throw new Error('samples must be finite milliseconds');
    }
    const sorted = sortSamples(samples);
    const n = sorted.length;
    if (n === 0) throw new Error('percentile needs at least one sample');
    const rank = p * (n + 1);
    const k = Math.floor(rank);
    const d = rank - k;
    let valueMs: number;
    if (k <= 0) valueMs = sorted[0];
    else if (k >= n) valueMs = sorted[n - 1];
    else valueMs = sorted[k - 1] + d * (sorted[k] - sorted[k - 1]);
    return { p, n, rank, k, d, valueMs };
}

/** Samples strictly slower than the percentile value. */
export function countAbove(samples: readonly number[], valueMs: number): number {
    return samples.reduce((count, sample) => (sample > valueMs ? count + 1 : count), 0);
}

function isChoice(p: number): p is PercentChoice {
    return (PERCENTILE_CHOICES as readonly number[]).includes(p);
}

export function gauge(inputs: Inputs): Run {
    if (!isChoice(inputs.p)) throw new Error('p must be 0.5 or 0.99');
    const samples = sortSamples(samplesOf(inputs.extra));
    const median = percentile(samples, 0.5);
    const high = percentile(samples, 0.99);
    const chosen = inputs.p === 0.5 ? median : high;
    return {
        samples,
        p: inputs.p,
        extra: inputs.extra,
        median,
        high,
        chosen,
        aboveMedian: countAbove(samples, median.valueMs),
        aboveHigh: countAbove(samples, high.valueMs),
        aboveChosen: countAbove(samples, chosen.valueMs),
    };
}

/** Ranks the finger stops on. Learn visits the median, then the 99th percentile. */
export function marksOf(run: Run, learn: boolean): number[] {
    return learn ? [run.median.rank, run.high.rank] : [run.chosen.rank];
}

/** The finger stops in the short pins only for the median. */
export function callOf(inputs: Inputs): Call {
    return inputs.p === 0.5 ? 'short' : 'end';
}

export function formatMs(valueMs: number): string {
    const rounded = Math.round(valueMs * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return `${text} ms`;
}

export function formatRank(rank: number): string {
    const rounded = Math.round(rank * 100) / 100;
    if (Number.isInteger(rounded)) return String(rounded);
    const text = rounded.toFixed(2);
    return text.endsWith('0') ? rounded.toFixed(1) : text;
}
