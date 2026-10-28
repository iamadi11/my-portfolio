/**
 * Teaching model for the udp-quic chapter. Two bodies share one path.
 * The earlier packet is the one that is lost. On one ordered byte stream
 * the later body is held. On a stream each, the later body is delivered
 * while the earlier body stays held.
 *
 * Not a packet trace, and not the retransmission of the lost data.
 *
 * 1. Inputs: `mode` is `byte` (one ordered byte stream) or `perStream`
 *    (each body is its own stream). The lost packet does not change with mode.
 * 2. State at time t (ticks): each body's stream and place. Place is
 *    sender, wire, held, or delivered. `along` is the fraction of the
 *    shared path while the place is wire.
 * 3. Rules: the earlier body is on the wire until LOSS, then held. The
 *    later body leaves at GAP. In `byte` it is held and is never delivered.
 *    In `perStream` it crosses in FLIGHT ticks and is delivered. A body
 *    on the wire is on the one shared path, whichever stream it is.
 * 4. Equations: earlier leaves at 0 and is held at LOSS.
 *    later leaves at GAP. perStream arrives at GAP + FLIGHT.
 *    along = time on the wire / FLIGHT, and only while place is wire.
 * 5. Assumptions: FLIGHT, GAP, LOSS, and that the lost packet is the
 *    earlier stream alone. None of those is a measured loss or a duration
 *    from the specification.
 * 6. Outputs: the two bodies, whether the later stream stalls, the
 *    outcome, and the event sentences.
 * 7. Boundaries: t before the first send; the loss tick; the later
 *    departure; the per-stream delivery; the byte-stream hold.
 * 8. Deterministic.
 * 9. Limits: one byte on each body, so a second byte of the lost stream
 *    is not in the run. A packet that carried both streams is not in the
 *    run. The new frame that would carry the lost data again is not in
 *    the run. No handshake.
 * 10. Tests: src/lib/learn/udp-quic-model.test.ts.
 */

/** Ticks for a delivered body to cross the shared path. Assumed. */
export const FLIGHT = 6;
/** Ticks after the earlier body leaves before the later body leaves. Assumed. */
export const GAP = 4;
/**
 * Tick when the earlier packet is lost, while it is still on the wire.
 * Assumed. Not a measured loss time.
 */
export const LOSS = 2;
/** The earlier stream is the packet this run loses. Assumed. */
export const LOST_STREAM = 0;
/** The Learn tab runs one stream each. */
export const LEARN_MODE = 'perStream';

export const MODES = ['byte', 'perStream'] as const;
export type Mode = (typeof MODES)[number];
export const STREAMS = [0, 1] as const;
export type StreamId = (typeof STREAMS)[number];
export type Place = 'sender' | 'wire' | 'held' | 'delivered';
export type Outcome = 'stalls' | 'passes';

export type Body = {
    /** Which stream this body belongs to. 0 is the earlier stream. */
    stream: StreamId;
    /**
     * Where this body is. This, with `stream`, is the field the figure
     * moves. Held is not delivered. Wire is the shared path.
     */
    place: Place;
    /** 0 at the near end of this crossing, 1 at the far end. Only while on the wire. */
    along: number;
    /** True only for the packet this run loses. */
    lost: boolean;
};

export type Frame = {
    t: number;
    mode: Mode;
    bodies: [Body, Body];
    /** True once the later body is held. */
    laterStalls: boolean;
};

export type Event = {
    t: number;
    stream: StreamId;
    place: Place;
    said: string;
};

export const MODE_LABEL: Record<Mode, string> = {
    byte: 'One byte stream',
    perStream: 'One stream each',
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
    stalls: 'The later stream stalls',
    passes: 'The later stream still arrives',
};

function assertMode(mode: Mode): void {
    if (mode !== 'byte' && mode !== 'perStream') throw new Error('mode must be byte or perStream');
}

function assertTime(t: number): void {
    if (!Number.isFinite(t)) throw new Error('t must be a finite number of ticks');
}

/** Tick when a delivered later body has arrived. */
export function endTime(): number {
    return GAP + FLIGHT;
}

export function outcomeOf(mode: Mode): Outcome {
    assertMode(mode);
    return mode === 'byte' ? 'stalls' : 'passes';
}

function earlierAt(t: number): Body {
    const stream: StreamId = 0;
    if (t < 0) return { stream, place: 'sender', along: 0, lost: true };
    if (t + 1e-9 < LOSS) return { stream, place: 'wire', along: t / FLIGHT, lost: true };
    return { stream, place: 'held', along: LOSS / FLIGHT, lost: true };
}

function laterAt(mode: Mode, t: number): Body {
    const stream: StreamId = 1;
    if (t + 1e-9 < GAP) return { stream, place: 'sender', along: 0, lost: false };
    if (mode === 'byte') return { stream, place: 'held', along: 0, lost: false };
    const fly = t - GAP;
    if (fly + 1e-9 < FLIGHT) return { stream, place: 'wire', along: fly / FLIGHT, lost: false };
    return { stream, place: 'delivered', along: 1, lost: false };
}

/** Both bodies at time t. Pure. */
export function frameAt(mode: Mode, t: number): Frame {
    assertMode(mode);
    assertTime(t);
    const bodies: [Body, Body] = [earlierAt(t), laterAt(mode, t)];
    return {
        t,
        mode,
        bodies,
        laterStalls: bodies[1].place === 'held',
    };
}

export function settle(mode: Mode): {
    earlier: Place;
    later: Place;
    laterStalls: boolean;
    outcome: Outcome;
} {
    const frame = frameAt(mode, endTime());
    return {
        earlier: frame.bodies[0].place,
        later: frame.bodies[1].place,
        laterStalls: frame.laterStalls,
        outcome: outcomeOf(mode),
    };
}

export function summary(mode: Mode): string {
    const end = settle(mode);
    if (end.outcome === 'stalls') {
        return 'The later stream is held. One ordered byte stream does not deliver past the missing byte.';
    }
    return 'The later stream is delivered. The lost packet held only the earlier stream.';
}

/** Leave, loss, the later departure, and the end. Times are the model's. */
export function events(mode: Mode): Event[] {
    assertMode(mode);
    const later = frameAt(mode, GAP).bodies[1];
    const done = frameAt(mode, endTime()).bodies[1];
    return [
        { t: 0, stream: 0, place: 'wire', said: 'The earlier stream is on the wire.' },
        { t: LOSS, stream: 0, place: 'held', said: 'The earlier packet is lost. That stream is held.' },
        {
            t: GAP,
            stream: 1,
            place: later.place,
            said: later.place === 'held' ? 'The later stream is held.' : 'The later stream is on the wire.',
        },
        {
            t: endTime(),
            stream: 1,
            place: done.place,
            said:
                done.place === 'delivered'
                    ? 'The later stream is delivered.'
                    : 'The later stream is still held.',
        },
    ];
}
