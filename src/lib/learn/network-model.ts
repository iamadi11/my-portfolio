/**
 * Teaching model for the ip-and-ports chapter, asset A3 (docs/system-design/chapters/ip-and-ports.md, "Asset plan"):
 * five datagrams cross a small network of four routers with two paths, and the receiving host's application reads
 * them over UDP or TCP. Deterministic, discrete time in ticks (an assumed unit, not to scale).
 *
 * Model document (course skill, scientific-modeling.md):
 * 1. Inputs: `event` (none | reroute | linkFail | congestion), `transport` (UDP | TCP), `service` (ticks the
 *    congested link needs per packet, 1–3; used only for congestion).
 * 2. State: each copy's hop times; R2's FIFO queue; R1's current route; what the application has read.
 * 3. Rules: S sends packet n at tick 2(n−1). Each link adds its delay (`LINKS`). R1 forwards on its current route
 *    (`routeAt`). R2 forwards one packet at a time on R2–R4 (FIFO; the next starts when the previous has gone).
 *    A link failure makes R2 drop what reaches it from `FAIL_AT` on, until R1 moves to the lower path at
 *    `REROUTE_AT`. UDP hands each copy to the application on arrival. TCP keeps the first copy of each packet,
 *    reads in order, and resends a packet `RTO` ticks after sending it if it was lost.
 * 4. Equations: arrival = send + Σ link delays + queue wait; R2 departure_k = max(arrival_k, departure_{k−1}) +
 *    service (a deterministic D/D/1 queue).
 * 5. Assumptions: one event per run; links never corrupt or duplicate; routers have no other traffic; routing
 *    reconverges in a fixed 3 ticks; TCP's timer is fixed and longer than any delay here (real TCP adapts it);
 *    acknowledgements, windows and connection set-up are left to the tcp chapter.
 * 6. Outputs: copies with hops and loss, the reads, the arrival order, the category, the last read, the largest queue.
 * 7. Boundaries: service 1 or 2 (no queue builds: packets arrive every 2 ticks), service 3 (the queue grows).
 * 8. Deterministic: same inputs, same run.
 * 9. Limits: not a model of real router timing, loss rates or TCP behaviour beyond resend-and-reorder.
 */

export type NetEvent = 'none' | 'reroute' | 'linkFail' | 'congestion';
export type Transport = 'UDP' | 'TCP';
export type Node = 'S' | 'R1' | 'R2' | 'R3' | 'R4' | 'H';

export const EVENTS: NetEvent[] = ['none', 'reroute', 'linkFail', 'congestion'];
export const TRANSPORTS: Transport[] = ['UDP', 'TCP'];
export const SERVICES = [1, 2, 3] as const;
export type Service = (typeof SERVICES)[number];

export const COUNT = 5;
const SEND_GAP = 2;
/** Upper path S–R1–R2–R4–H and lower path S–R1–R3–R4–H. */
const UPPER: Node[] = ['S', 'R1', 'R2', 'R4', 'H'];
const LOWER: Node[] = ['S', 'R1', 'R3', 'R4', 'H'];
/** Link delays in ticks. The lower path is longer: 7 ticks against 4. */
export const LINKS: Record<string, number> = {
    'S-R1': 1,
    'R1-R2': 1,
    'R2-R4': 1,
    'R4-H': 1,
    'R1-R3': 3,
    'R3-R4': 2,
};
/** Reroute: R1 sends on the lower path until this tick, then on the upper path (a routing update). */
const SWITCH_AT = 3;
/** Link failure: R2–R4 fails at this tick; R1 moves to the lower path when routing reconverges. */
export const FAIL_AT = 4;
export const REROUTE_AT = 7;
/** TCP resends a packet this many ticks after sending it, if it was lost. */
export const RTO = 12;

export type Hop = { node: Node; at: number };
export type Copy = {
    n: number;
    sent: number;
    resend: boolean;
    hops: Hop[];
    /** Where and when it was dropped, or null if it arrived at H. */
    lost: Hop | null;
    /** Ticks spent waiting in R2's queue. */
    waited: number;
};
export type Read = { n: number; at: number; held: number };
export type Category = 'all in order' | 'all, out of order' | 'some missing';
export const CATEGORIES: Category[] = ['all in order', 'all, out of order', 'some missing'];

export type Run = {
    copies: Copy[];
    reads: Read[];
    /** Packet numbers in the order they reached H (first copies and later copies alike). */
    arrivalOrder: number[];
    category: Category;
    lastRead: number;
    maxQueue: number;
    /** The time after which nothing moves. */
    end: number;
};

export type Inputs = { event: NetEvent; transport: Transport; service: Service };

const link = (a: Node, b: Node): number => LINKS[`${a}-${b}`] ?? LINKS[`${b}-${a}`];

/** The path R1 forwards on, at the tick a packet reaches R1. */
export function routeAt(event: NetEvent, t: number): Node[] {
    if (event === 'reroute') return t < SWITCH_AT ? LOWER : UPPER;
    if (event === 'linkFail') return t < REROUTE_AT ? UPPER : LOWER;
    return UPPER;
}

/** Hop times up to R2 (or the whole lower path), before R2's queue is applied. */
function launch(n: number, sent: number, resend: boolean, event: NetEvent): Copy {
    const r1 = sent + link('S', 'R1');
    const path = routeAt(event, r1);
    const hops: Hop[] = [
        { node: 'S', at: sent },
        { node: 'R1', at: r1 },
    ];
    let t = r1;
    for (let i = 2; i < path.length; i++) {
        t += link(path[i - 1], path[i]);
        hops.push({ node: path[i], at: t });
        if (path[i] === 'R2') break; // R2's forwarding depends on its queue and the failure: resolved in `simulate`.
    }
    return { n, sent, resend, hops, lost: null, waited: 0 };
}

/** Moves every copy waiting at R2 through its queue (FIFO by arrival, then by packet number) or drops it; returns
 * the largest number of packets waiting at R2 at once (not counting the one being sent). */
function throughR2(copies: Copy[], event: NetEvent, service: Service): number {
    const atR2 = copies
        .filter((c) => c.hops.at(-1)?.node === 'R2' && c.lost === null)
        .sort((a, b) => a.hops.at(-1)!.at - b.hops.at(-1)!.at || a.n - b.n);
    const svc = event === 'congestion' ? service : link('R2', 'R4');
    let free = -Infinity;
    const waits: { arrive: number; start: number }[] = [];
    for (const c of atR2) {
        const arrive = c.hops.at(-1)!.at;
        if (event === 'linkFail' && arrive >= FAIL_AT) {
            c.lost = { node: 'R2', at: arrive };
            continue;
        }
        const start = Math.max(arrive, free);
        c.waited = start - arrive;
        free = start + svc;
        waits.push({ arrive, start });
        c.hops.push({ node: 'R4', at: free }, { node: 'H', at: free + link('R4', 'H') });
    }
    return Math.max(
        0,
        ...waits.map(({ arrive: t }) => waits.filter((w) => w.arrive <= t && w.start > t).length)
    );
}

const arrivedAt = (c: Copy): number | null =>
    c.lost === null ? (c.hops.at(-1)?.node === 'H' ? c.hops.at(-1)!.at : null) : null;

/** What the application reads: UDP hands each copy over as it arrives; TCP reads each packet once, in order, holding
 * any that arrive ahead of a gap. */
function readsOf(arrivals: Copy[], transport: Transport): Read[] {
    if (transport === 'UDP') return arrivals.map((c) => ({ n: c.n, at: arrivedAt(c)!, held: 0 }));
    const first = new Map<number, number>();
    for (const c of arrivals) if (!first.has(c.n)) first.set(c.n, arrivedAt(c)!);
    const reads: Read[] = [];
    let prev = -Infinity;
    for (let n = 1; n <= COUNT && first.has(n); n++) {
        const got = first.get(n)!;
        const at = Math.max(got, prev);
        reads.push({ n, at, held: at - got });
        prev = at;
    }
    return reads;
}

function categoryOf(ns: number[]): Category {
    if (new Set(ns).size < COUNT) return 'some missing';
    return ns.every((n, i) => i === 0 || n > ns[i - 1]) ? 'all in order' : 'all, out of order';
}

export function simulate({ event, transport, service }: Inputs): Run {
    const copies: Copy[] = [];
    for (let n = 1; n <= COUNT; n++) copies.push(launch(n, (n - 1) * SEND_GAP, false, event));
    let maxQueue = throughR2(copies, event, service);
    if (transport === 'TCP') {
        // Resend every lost packet once its timer runs out; one round is enough here (resends take the lower path).
        const lost = copies.filter((c) => c.lost !== null);
        const resends = lost.map((c) => launch(c.n, c.sent + RTO, true, event));
        if (resends.some((c) => c.hops.at(-1)?.node === 'R2'))
            maxQueue = Math.max(maxQueue, throughR2(resends, event, service));
        copies.push(...resends);
    }
    const arrivals = copies
        .filter((c) => arrivedAt(c) !== null)
        .sort((a, b) => arrivedAt(a)! - arrivedAt(b)! || a.sent - b.sent);
    const reads = readsOf(arrivals, transport);
    const category = categoryOf(reads.map((r) => r.n));
    const times = copies.flatMap((c) => [...c.hops.map((h) => h.at), c.lost?.at ?? 0]);
    return {
        copies,
        reads,
        arrivalOrder: arrivals.map((c) => c.n),
        category,
        lastRead: reads.length ? Math.max(...reads.map((r) => r.at)) : 0,
        maxQueue,
        end: Math.max(...times) + 1,
    };
}

/** Where a copy is at time t: between two hops (with progress 0–1), waiting at a node, gone, or lost. */
export function positionAt(
    c: Copy,
    t: number
): { from: Node; to: Node; p: number } | { at: Node; waiting: boolean } | null {
    if (t < c.sent) return null;
    for (let i = 1; i < c.hops.length; i++) {
        const a = c.hops[i - 1];
        const b = c.hops[i];
        // R2's queue: the copy waits at R2 until its turn, then crosses R2–R4.
        const depart = a.node === 'R2' ? a.at + c.waited : a.at;
        if (t < depart) return { at: a.node, waiting: true };
        if (t < b.at) return { from: a.node, to: b.node, p: (t - depart) / (b.at - depart) };
    }
    const last = c.hops.at(-1)!;
    if (c.lost && t < c.lost.at + 1) return { at: c.lost.node, waiting: false };
    if (!c.lost && last.node === 'H' && t < last.at + 0.6) return { at: 'H', waiting: false };
    return null;
}
