/**
 * Teaching model for the ip-and-ports chapter, asset A3 (docs/system-design/chapters/ip-and-ports.md, "Asset plan"):
 * five datagrams cross a network that may lose, delay or duplicate one of them, and the receiving application reads
 * them over UDP or TCP. Deterministic; time is counted in ticks, an assumed unit that is not to scale. A teaching
 * model, not a benchmark: one event per run; data is never corrupted; TCP's resend waits a fixed 7 ticks (real TCP
 * adapts its timer), and its acknowledgements, windows and connection set-up are left to the tcp chapter.
 */

export type Event = 'none' | 'lose3' | 'delay2' | 'dup4';
export type Transport = 'UDP' | 'TCP';

export const EVENTS: Event[] = ['none', 'lose3', 'delay2', 'dup4'];
export const TRANSPORTS: Transport[] = ['UDP', 'TCP'];

export const COUNT = 5;
/** Ticks from send to arrival. */
const TRAVEL = 2;
/** Extra ticks for the delayed datagram. */
const EXTRA_DELAY = 2;
/**
 * Ticks after the first send at which TCP resends a segment it has heard nothing about (assumed; see the header).
 * Longer than the delayed segment's round trip (4 ticks there, an acknowledgement 2 ticks back), so a segment that
 * is only late is never resent in this model; real TCP can resend a late segment when its timer is shorter.
 */
const RESEND_AFTER = 7;
/** Ticks between the first copy of the duplicated datagram and its second copy, made by the network (not sent). */
const DUP_GAP = 2;
/** Width of the timeline the figure draws. */
export const LAST_TICK = 14;

/** One datagram (or TCP segment) on the wire: sent at `sent`, arrived at `arrived`, or lost (`arrived` null). */
export type Copy = { n: number; sent: number; arrived: number | null; resend: boolean; duplicate: boolean };
/** One read by the application: datagram/segment `n` at tick `at`, after waiting `held` ticks in the host. */
export type Read = { n: number; at: number; held: number };

/** What the application ended up with, in the words the prediction uses. */
export type Category = 'all in order' | 'all, out of order' | 'one missing' | 'one twice';
export const CATEGORIES: Category[] = ['all in order', 'all, out of order', 'one missing', 'one twice'];

export type Run = {
    copies: Copy[];
    reads: Read[];
    /** Copies the host threw away because their data had already arrived (TCP only). */
    discarded: Copy[];
    category: Category;
    lastRead: number;
};

const sentAt = (n: number): number => n - 1;

/** Every copy the network carries, in send order. */
function wire(event: Event, transport: Transport): Copy[] {
    const copies: Copy[] = [];
    for (let n = 1; n <= COUNT; n++) {
        const sent = sentAt(n);
        const base = { n, sent, resend: false, duplicate: false };
        if (event === 'lose3' && n === 3) {
            copies.push({ ...base, arrived: null });
            // UDP never resends; TCP notices nothing arrived and sends the segment again.
            if (transport === 'TCP')
                copies.push({
                    ...base,
                    sent: sent + RESEND_AFTER,
                    arrived: sent + RESEND_AFTER + TRAVEL,
                    resend: true,
                });
        } else if (event === 'delay2' && n === 2)
            copies.push({ ...base, arrived: sent + TRAVEL + EXTRA_DELAY });
        else {
            copies.push({ ...base, arrived: sent + TRAVEL });
            if (event === 'dup4' && n === 4)
                copies.push({ ...base, arrived: sent + TRAVEL + DUP_GAP, duplicate: true });
        }
    }
    return copies;
}

/** Arrived copies in arrival order (ties keep send order). */
const arrivals = (copies: Copy[]): Copy[] =>
    copies.filter((c) => c.arrived !== null).sort((a, b) => (a.arrived as number) - (b.arrived as number));

function categorize(reads: Read[]): Category {
    const ns = reads.map((r) => r.n);
    if (ns.length > new Set(ns).size) return 'one twice';
    if (new Set(ns).size < COUNT) return 'one missing';
    return ns.every((n, i) => i === 0 || n > ns[i - 1]) ? 'all in order' : 'all, out of order';
}

export function simulate(event: Event, transport: Transport): Run {
    const copies = wire(event, transport);
    const arrived = arrivals(copies);
    const reads: Read[] = [];
    const discarded: Copy[] = [];
    if (transport === 'UDP') {
        // UDP hands each datagram to the application as it arrives: gaps, reordering and repeats pass straight through.
        for (const c of arrived) reads.push({ n: c.n, at: c.arrived as number, held: 0 });
    } else {
        // TCP keeps the first copy of each segment, throws later copies away, and releases segment k only after k−1.
        const first = new Map<number, number>();
        for (const c of arrived)
            if (first.has(c.n)) discarded.push(c);
            else first.set(c.n, c.arrived as number);
        let prev = -Infinity;
        for (let n = 1; n <= COUNT; n++) {
            const got = first.get(n) as number;
            const at = Math.max(got, prev);
            reads.push({ n, at, held: at - got });
            prev = at;
        }
    }
    return {
        copies,
        reads,
        discarded,
        category: categorize(reads),
        lastRead: Math.max(...reads.map((r) => r.at)),
    };
}
