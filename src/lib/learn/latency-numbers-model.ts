/**
 * Teaching model for orders of magnitude of latency. One carriage. Its place
 * on the bench is the base-10 logarithm of one operation's duration in
 * nanoseconds. A disk seek is not a small step past a memory fetch: the stops
 * are orders apart.
 *
 * Durations quoted from Peter Norvig, "Teach Yourself Programming in Ten Years",
 * section Answers, "Approximate timing for various operations on a typical PC"
 * (https://norvig.com/21-days.html, read 2026-10-29). The SSD duration is the
 * integer `getSSDLatency` returns when the year is greater than 2014 in Colin
 * Scott's interactive_latency.html (raw file read 2026-10-29). That integer is
 * his script constant, not a row in Norvig's table and not a measurement from
 * the paper named in the comment above the formula. The formula was not run.
 *
 * 1. Inputs: two operations on this bench.
 * 2. State: each operation's duration in nanoseconds, and its magnitude.
 * 3. Rules: magnitude is log10 of the nanoseconds. The farther stop is the
 *    larger magnitude. A gap of at least one order (a factor of ten) means the
 *    farther duration dominates the sum of the pair.
 * 4. Equations: magnitude = log10(durationNs). Place = X0 + magnitude * PITCH.
 *    Orders between two stops = the absolute difference of their magnitudes.
 *    Factor = the farther duration divided by the nearer. If the factor is at
 *    least 10, the farther duration is at least 10/11 of the sum.
 * 5. Assumptions: Norvig calls the table approximate timings for a typical PC
 *    and the fetched page does not date it. The SSD figure is Scott's constant
 *    for a year after 2014, not a lab measurement made for this chapter.
 * 6. Outputs: the magnitude, the carriage place, the farther operation, the
 *    orders between them, and whether that gap dominates.
 * 7. Boundaries: a gap under one order does not dominate. Two copies of the
 *    same operation are not a pair. A non-positive duration has no magnitude.
 * 8. Deterministic. log10 is the common logarithm.
 * 9. Limits: not a trace of a running machine. Not Scott's year-by-year
 *    formulas (those were not evaluated). Not a queue, not a percentile, and
 *    not Little's law. The instruction, branch, L2 fetch, and mutex are in the
 *    Answers table and are not stops on this bench.
 */

export const INSTRUCTION_NS = 1;
export const L1_NS = 0.5;
export const BRANCH_NS = 5;
export const L2_NS = 7;
export const MUTEX_NS = 25;
export const MEMORY_NS = 100;
export const NET_NS = 20_000;
export const MEM_READ_NS = 250_000;
export const SEEK_NS = 8_000_000;
export const DISK_READ_NS = 20_000_000;
export const WAN_NS = 150_000_000;
/** The same row writes "150 milliseconds = 150,000,000 nanosec". */
export const WAN_MS = 150;
/** `return 16000` in getSSDLatency when year > 2014. Metric treats it as nanoseconds. */
export const SSD_NS = 16_000;

/** World units per order of magnitude. One pitch is a factor of ten in nanoseconds. */
export const PITCH = 28;
/** World x at magnitude 0, which is 1 nanosecond: the table's typical instruction. */
export const X0 = 48;
/**
 * The shared clock does not run below 0. Clock 0 is magnitude -1, the left post
 * of the drawing. That post is not a duration from either text.
 */
export const CLOCK_SHIFT = -1;
/** A gap of one order is a factor of ten. */
export const DOMINANT_ORDERS = 1;

export const OP_IDS = ['l1', 'memory', 'memRead', 'ssd', 'seek', 'diskRead', 'net', 'wan'] as const;
export type OpId = (typeof OP_IDS)[number];
export type Origin = 'answers' | 'script';

export type Operation = {
    id: OpId;
    /** Wording from the text the duration was read from. */
    name: string;
    durationNs: number;
    origin: Origin;
};

export const OPERATIONS: readonly Operation[] = [
    { id: 'l1', name: 'fetch from L1 cache memory', durationNs: L1_NS, origin: 'answers' },
    { id: 'memory', name: 'fetch from main memory', durationNs: MEMORY_NS, origin: 'answers' },
    { id: 'memRead', name: 'read 1MB sequentially from memory', durationNs: MEM_READ_NS, origin: 'answers' },
    { id: 'ssd', name: 'SSD random read', durationNs: SSD_NS, origin: 'script' },
    { id: 'seek', name: 'fetch from new disk location (seek)', durationNs: SEEK_NS, origin: 'answers' },
    { id: 'diskRead', name: 'read 1MB sequentially from disk', durationNs: DISK_READ_NS, origin: 'answers' },
    { id: 'net', name: 'send 2K bytes over 1Gbps network', durationNs: NET_NS, origin: 'answers' },
    { id: 'wan', name: 'send packet US to Europe and back', durationNs: WAN_NS, origin: 'answers' },
];

export type Pair = {
    near: Operation;
    far: Operation;
    /** far.magnitude - near.magnitude. Equals log10(far duration / near duration). */
    orders: number;
};

const BY_ID = new Map(OPERATIONS.map((op) => [op.id, op]));

export function operation(id: OpId): Operation {
    const found = BY_ID.get(id);
    if (!found) throw new Error(`unknown operation ${id}`);
    return found;
}

/** Stops in increasing duration. The learn walk follows this order. */
export function tour(): Operation[] {
    return [...OPERATIONS].sort((a, b) => a.durationNs - b.durationNs);
}

/** Order of magnitude: log10 of the duration in nanoseconds. */
export function magnitude(durationNs: number): number {
    if (!Number.isFinite(durationNs) || durationNs <= 0) {
        throw new Error('duration must be a positive finite number of nanoseconds');
    }
    return Math.log10(durationNs);
}

/** The carriage's world x. Equals X0 + magnitude * PITCH. */
export function carriageX(durationNs: number): number {
    return X0 + magnitude(durationNs) * PITCH;
}

export function xOfMagnitude(value: number): number {
    if (!Number.isFinite(value)) throw new Error('magnitude must be finite');
    return X0 + value * PITCH;
}

/** Clock time for a duration. Clock 0 is the left post, magnitude -1. */
export function clockOf(durationNs: number): number {
    return magnitude(durationNs) - CLOCK_SHIFT;
}

export function magnitudeFromClock(t: number): number {
    if (!Number.isFinite(t)) throw new Error('clock time must be finite');
    return t + CLOCK_SHIFT;
}

export function xAtClock(t: number): number {
    return xOfMagnitude(magnitudeFromClock(t));
}

export function pairOf(a: OpId, b: OpId): Pair {
    if (a === b) throw new Error('pick two different operations');
    const left = operation(a);
    const right = operation(b);
    const near = left.durationNs <= right.durationNs ? left : right;
    const far = near.id === left.id ? right : left;
    return {
        near,
        far,
        orders: magnitude(far.durationNs) - magnitude(near.durationNs),
    };
}

export function factor(nearNs: number, farNs: number): number {
    if (!(nearNs > 0) || !(farNs > 0)) throw new Error('durations must be positive');
    return farNs / nearNs;
}

/**
 * True when the farther duration is at least ten times the nearer.
 * Then it is at least 10/11 of the sum of the two.
 */
export function dominates(orders: number): boolean {
    if (!Number.isFinite(orders) || orders < 0)
        throw new Error('orders must be a non-negative finite number');
    return orders >= DOMINANT_ORDERS;
}

export function learnMarks(): number[] {
    return tour().map((op) => clockOf(op.durationNs));
}

export function labMarks(a: OpId, b: OpId): number[] {
    const pair = pairOf(a, b);
    return [clockOf(pair.near.durationNs), clockOf(pair.far.durationNs)];
}

export function formatMagnitude(value: number): string {
    if (!Number.isFinite(value)) throw new Error('magnitude must be finite');
    const rounded = Math.round(value * 1000) / 1000;
    return rounded
        .toFixed(3)
        .replace(/(\.\d*?)0+$/, '$1')
        .replace(/\.$/, '');
}

export function formatNs(durationNs: number): string {
    const text = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(durationNs);
    if (durationNs === WAN_NS) return `${text} ns (150 milliseconds)`;
    return `${text} ns`;
}

export function formatFactor(value: number): string {
    if (!Number.isFinite(value)) throw new Error('factor must be finite');
    if (Number.isInteger(value)) return new Intl.NumberFormat('en-US').format(value);
    const rounded = Math.round(value * 100) / 100;
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(rounded);
}
