/**
 * Teaching model for the tcp chapter. Five data segments cross one wire. At most one
 * first copy is lost. The sender puts those same bytes on the wire again after a fixed
 * wait. The receiver hands the application only the prefix with no gap.
 *
 * Not a trace, and not the retransmission timeout algorithm in RFC 6298 (named from
 * RFC 9293 §3.8.1, not read here).
 *
 * 1. Inputs: `lost` is null, or a segment number 1 through 5 whose first copy falls off
 *    the wire. One lost segment per run.
 * 2. State at time t (ticks): each copy's place, how far it is along the wire, how far
 *    a lost copy has dropped, and whether the application has read that segment.
 * 3. Rules: segment n is sent at (n−1) × SEND_EVERY. A copy that is not lost reaches the
 *    receiver FLIGHT ticks later. A lost first copy leaves the wire at FALL_AT and is on
 *    the floor at FALL_AT + FALL_DROP. That segment is sent again RESEND_AFTER ticks
 *    after its own send. The application has read the longest prefix of segments that
 *    have arrived. A later arrival is held, not read, while that prefix is short.
 * 4. Equations: send(n) = (n−1) × SEND_EVERY. Arrive = send + FLIGHT, or send +
 *    RESEND_AFTER + FLIGHT for the second copy. along = time in flight / FLIGHT while
 *    on the wire, frozen at FALL_AT / FLIGHT once falling. drop = 0 on the wire and
 *    reaches 1 at the end of FALL_DROP. readCount = max k such that segments 1..k have
 *    arrived.
 * 5. Assumptions: five segments, 100 data bytes each, the tick lengths above, one wire,
 *    one loss, no second loss of the resend. The connection is already open. Byte
 *    numbers count data from 0. They are not the sequence number on the wire: RFC 9293
 *    §3.1 numbers the first data octet as ISN+1.
 * 6. Outputs: the bodies, readCount, the held segment numbers, and the event sentences.
 * 7. Boundaries: nothing lost; the first segment lost (the application reads nothing
 *    until the resend); the last segment lost (nothing sits past a gap); t before the
 *    first send.
 * 8. Deterministic.
 * 9. Limits: no handshake (§3.5), no acknowledgments, no congestion window (§3.8.2),
 *    no computed RTO (§3.8.1), no checksum failure, no duplicate that arrives late.
 * 10. Tests: src/lib/learn/tcp-model.test.ts.
 */

/** How many data segments this run sends. Assumed. */
export const SEGMENT_COUNT = 5;
/** Data bytes in each segment. Assumed. Not a measured maximum segment size. */
export const BYTES_EACH = 100;
/** Ticks between the send of segment n and segment n+1. Assumed. */
export const SEND_EVERY = 5;
/** Ticks for a copy to cross the one wire. Assumed. */
export const FLIGHT = 4;
/**
 * Ticks after send when a lost first copy starts to leave the wire.
 * Assumed: halfway, so FALL_AT / FLIGHT is 1/2.
 */
export const FALL_AT = 2;
/** Ticks a lost copy takes to reach the floor. The rest of the flight. Assumed. */
export const FALL_DROP = FLIGHT - FALL_AT;
/**
 * Ticks after a segment is sent before that same segment is sent again, if its first
 * copy was lost. Assumed. Not the computed retransmission timeout (RFC 9293 §3.8.1).
 */
export const RESEND_AFTER = 26;
/** The Learn tab drops this segment. */
export const LEARN_LOST = 3;
/**
 * Tick when every first copy has arrived or finished falling.
 * Equal to send(SEGMENT_COUNT) + FLIGHT. No resend has left yet.
 */
export const FIRST_SETTLE = (SEGMENT_COUNT - 1) * SEND_EVERY + FLIGHT;

export type Outcome = 'straight' | 'holds' | 'tail';
export type Place = 'sender' | 'wire' | 'lost' | 'receiver';
export type Copy = 'first' | 'again';

export type Body = {
    segment: number;
    copy: Copy;
    place: Place;
    /** 0 at the sender end of the wire, 1 at the receiver end. */
    along: number;
    /** 0 on the wire, 1 on the floor. Only a lost first copy leaves 0. */
    drop: number;
    /** The application has read this segment's bytes. */
    read: boolean;
};

export type Frame = {
    t: number;
    bodies: Body[];
    /** How many leading segments the application has read. */
    readCount: number;
    /** Segments at the receiver that the application has not read. */
    held: number[];
};

export type Event = { t: number; said: string };

export const OUTCOME_LABEL: Record<Outcome, string> = {
    straight: 'All five are read as they arrive, and nothing is sent again',
    holds: 'Bytes after the missing segment wait unread until it is sent again',
    tail: 'Only the last segment is missing, so nothing is waiting past a gap',
};

function assertLost(lost: number | null): void {
    if (lost === null) return;
    if (!Number.isInteger(lost) || lost < 1 || lost > SEGMENT_COUNT) {
        throw new Error(`lost must be null or an integer from 1 to ${SEGMENT_COUNT}`);
    }
}

/** Tick when segment n (1-based) first leaves the sender. */
export function sendTime(segment: number): number {
    return (segment - 1) * SEND_EVERY;
}

/** Inclusive data-byte offsets for segment n, counting from 0. Assumed label, not a sequence number. */
export function byteRange(segment: number): [number, number] {
    const from = (segment - 1) * BYTES_EACH;
    return [from, from + BYTES_EACH - 1];
}

function hasArrived(segment: number, lost: number | null, t: number): boolean {
    const send = sendTime(segment);
    if (lost === segment) return t >= send + RESEND_AFTER + FLIGHT;
    return t >= send + FLIGHT;
}

/** Longest prefix of segments that have arrived by t. */
export function readCount(lost: number | null, t: number): number {
    assertLost(lost);
    let n = 0;
    for (let segment = 1; segment <= SEGMENT_COUNT; segment++) {
        if (!hasArrived(segment, lost, t)) break;
        n += 1;
    }
    return n;
}

/** Segments that have arrived and are past the first missing one. */
export function heldAt(lost: number | null, t: number): number[] {
    const read = readCount(lost, t);
    const held: number[] = [];
    for (let segment = read + 1; segment <= SEGMENT_COUNT; segment++) {
        if (hasArrived(segment, lost, t)) held.push(segment);
    }
    return held;
}

function bodyAt(segment: number, lost: number | null, t: number, copy: Copy): Body | null {
    if (copy === 'again' && lost !== segment) return null;
    const send = sendTime(segment) + (copy === 'again' ? RESEND_AFTER : 0);
    if (copy === 'again' && t < send) return null;
    const read = segment <= readCount(lost, t);
    if (copy === 'first' && t < send) {
        return { segment, copy, place: 'sender', along: 0, drop: 0, read: false };
    }
    const fly = t - send;
    if (copy === 'first' && lost === segment) {
        if (fly < FALL_AT) {
            return { segment, copy, place: 'wire', along: fly / FLIGHT, drop: 0, read: false };
        }
        const drop = Math.min(1, (fly - FALL_AT) / FALL_DROP);
        return { segment, copy, place: 'lost', along: FALL_AT / FLIGHT, drop, read: false };
    }
    if (fly < FLIGHT) {
        return { segment, copy, place: 'wire', along: fly / FLIGHT, drop: 0, read: false };
    }
    return { segment, copy, place: 'receiver', along: 1, drop: 0, read };
}

/** Bodies, lamps, and held segments at time t. Pure: same inputs, same frame. */
export function frameAt(lost: number | null, t: number): Frame {
    assertLost(lost);
    const bodies: Body[] = [];
    for (let segment = 1; segment <= SEGMENT_COUNT; segment++) {
        const first = bodyAt(segment, lost, t, 'first');
        if (first) bodies.push(first);
        const again = bodyAt(segment, lost, t, 'again');
        if (again) bodies.push(again);
    }
    return { t, bodies, readCount: readCount(lost, t), held: heldAt(lost, t) };
}

function arrivalSaid(segment: number, lost: number | null): string {
    const t = sendTime(segment) + (lost === segment ? RESEND_AFTER + FLIGHT : FLIGHT);
    const now = readCount(lost, t);
    const before = readCount(lost, t - 1e-6);
    const [from, to] = byteRange(segment);
    if (now > before + 1) {
        return `Segment ${segment} reaches the receiver. The gap is filled, so the application reads through byte ${byteRange(now)[1]}.`;
    }
    if (segment === now) {
        return `Segment ${segment} reaches the receiver. The application reads bytes ${from}-${to}.`;
    }
    return `Segment ${segment} reaches the receiver and waits. The application does not read bytes ${from}-${to}, because an earlier segment is missing.`;
}

/** One sentence per model event. Times are strictly increasing for every legal input. */
export function events(lost: number | null): Event[] {
    assertLost(lost);
    const out: Event[] = [];
    for (let segment = 1; segment <= SEGMENT_COUNT; segment++) {
        const send = sendTime(segment);
        const [from, to] = byteRange(segment);
        const bytes = `${from}-${to}`;
        out.push({ t: send, said: `Segment ${segment} leaves the sender. Bytes ${bytes}.` });
        if (lost === segment) {
            out.push({
                t: send + FALL_AT + FALL_DROP,
                said: `Segment ${segment} falls off the wire. The receiver does not have bytes ${bytes}.`,
            });
            out.push({
                t: send + RESEND_AFTER,
                said: `Segment ${segment} is sent again. Same bytes ${bytes}.`,
            });
            out.push({ t: send + RESEND_AFTER + FLIGHT, said: arrivalSaid(segment, lost) });
        } else {
            out.push({ t: send + FLIGHT, said: arrivalSaid(segment, lost) });
        }
    }
    out.sort((a, b) => a.t - b.t);
    return out;
}

export function endTime(lost: number | null): number {
    const list = events(lost);
    return list[list.length - 1].t;
}

/** What the application has read at the end of every first trip, before any resend. */
export function settle(lost: number | null): { readCount: number; held: number[] } {
    const frame = frameAt(lost, FIRST_SETTLE);
    return { readCount: frame.readCount, held: frame.held };
}

export function outcomeOf(lost: number | null): Outcome {
    assertLost(lost);
    if (lost === null) return 'straight';
    if (lost === SEGMENT_COUNT) return 'tail';
    return 'holds';
}
