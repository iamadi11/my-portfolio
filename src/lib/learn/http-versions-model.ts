/**
 * Teaching model for the http-versions chapter. Three responses come
 * back. One carrier is lost. HTTP/1.1, HTTP/2, and HTTP/3 hold a
 * different set.
 *
 * Not a packet trace, and not a retransmission.
 *
 * 1. Inputs: `version` is `h1` (one ordered connection), `h2` (streams
 *    on one TCP connection), or `h3` (one stream each). The lost
 *    carrier does not change with the version.
 * 2. State at time t (ticks): each response's place. Place is waiting,
 *    wire, held, or delivered. `along` is the fraction of that crossing
 *    while the place is wire, and the fraction where a held body left
 *    the wire.
 * 3. Rules: each body leaves at SEND[id]. The middle body's carrier is
 *    lost at LOSS. On h1 the lost body and every later body are held,
 *    and an earlier body keeps going. On h2 every body still on the
 *    connection is held. On h3 only the lost body is held.
 * 4. Equations: a delivered body arrives at SEND[id] + FLIGHT.
 *    along = time on the wire / FLIGHT while place is wire.
 *    A body held from the loss keeps along = (LOSS − SEND[id]) / FLIGHT
 *    when it had already left, and 0 when it had not.
 * 5. Assumptions: FLIGHT, SEND, LOSS, and that the lost carrier is the
 *    middle response. None of those is a measured loss or a duration
 *    from a specification. LOSS is before any body finishes, so all
 *    three are still out when the carrier fails.
 * 6. Outputs: the three bodies, how many stay held, and the event
 *    sentences.
 * 7. Boundaries: t before the first send; each departure; the loss;
 *    each delivery the version still allows.
 * 8. Deterministic.
 * 9. Limits: one response per body, so a second byte of the lost
 *    response is not in the run. The packet that would carry the lost
 *    response again is not in the run. No handshake. HTTP/1.1's extra
 *    connections are not in the run.
 * 10. Tests: src/lib/learn/http-versions-model.test.ts.
 */

/** Ticks a delivered body spends on the path. Assumed. */
export const FLIGHT = 8;
/** Departure ticks for the earliest, middle, and latest response. Assumed. */
export const SEND = [0, 2, 4] as const;
/**
 * Tick when the middle response's carrier is lost.
 * Assumed. Not a measured loss time. It is after every departure and
 * before any delivery, so all three responses are still out.
 */
export const LOSS = 5;
/** The middle response is the carrier this run loses. Assumed. */
export const LOST = 1;
/** The Learn tab runs HTTP/3. */
export const LEARN_VERSION = 'h3';

export const VERSIONS = ['h1', 'h2', 'h3'] as const;
export type Version = (typeof VERSIONS)[number];
export const BODIES = [0, 1, 2] as const;
export type BodyId = (typeof BODIES)[number];
export type Place = 'waiting' | 'wire' | 'held' | 'delivered';
export const HOLDS = [1, 2, 3] as const;
export type Hold = (typeof HOLDS)[number];

export type Body = {
    /** 0 earliest, 1 middle, 2 latest. 1 is the lost carrier. */
    id: BodyId;
    /**
     * Where this response is. This is the field the figure moves.
     * Held is not delivered. Wire is the path for this version.
     */
    place: Place;
    /** 0 at the near end of this crossing, 1 at the far end. Only while on the wire, or frozen at the hold. */
    along: number;
    /** True only for the carrier this run loses. */
    lost: boolean;
};

export type Frame = {
    t: number;
    version: Version;
    bodies: [Body, Body, Body];
    /** How many responses have place held at this tick. */
    held: number;
};

export type Event = {
    t: number;
    id: BodyId;
    place: Place;
    said: string;
};

export const VERSION_LABEL: Record<Version, string> = {
    h1: 'HTTP/1.1',
    h2: 'HTTP/2',
    h3: 'HTTP/3',
};

export const HOLD_LABEL: Record<Hold, string> = {
    1: 'One stays held',
    2: 'Two stay held',
    3: 'Three stay held',
};

function assertVersion(version: Version): void {
    if (version !== 'h1' && version !== 'h2' && version !== 'h3') {
        throw new Error('version must be h1, h2, or h3');
    }
}

function assertTime(t: number): void {
    if (!Number.isFinite(t)) throw new Error('t must be a finite number of ticks');
}

function isHold(n: number): n is Hold {
    return n === 1 || n === 2 || n === 3;
}

/** Tick when this version has reached its last place change. */
export function endTime(version: Version): number {
    assertVersion(version);
    if (version === 'h2') return LOSS;
    if (version === 'h1') return SEND[0] + FLIGHT;
    return SEND[2] + FLIGHT;
}

function holdAlong(id: BodyId): number {
    const start = SEND[id];
    if (start + 1e-9 >= LOSS) return 0;
    return (LOSS - start) / FLIGHT;
}

/**
 * True when this version will not deliver the body once the carrier
 * is lost. h2 holds every body on the one connection. h1 holds the
 * lost body and every later body. h3 holds only the lost body.
 */
function blocked(version: Version, id: BodyId): boolean {
    if (version === 'h2') return true;
    if (id === LOST) return true;
    return version === 'h1' && id > LOST;
}

function bodyAt(version: Version, id: BodyId, t: number): Body {
    const lost = id === LOST;
    if (t + 1e-9 < SEND[id]) return { id, place: 'waiting', along: 0, lost };
    if (blocked(version, id)) {
        if (t + 1e-9 < LOSS) {
            return { id, place: 'wire', along: (t - SEND[id]) / FLIGHT, lost };
        }
        return { id, place: 'held', along: holdAlong(id), lost };
    }
    const fly = t - SEND[id];
    if (fly + 1e-9 < FLIGHT) return { id, place: 'wire', along: fly / FLIGHT, lost };
    return { id, place: 'delivered', along: 1, lost };
}

/** All three responses at time t. Pure. */
export function frameAt(version: Version, t: number): Frame {
    assertVersion(version);
    assertTime(t);
    const bodies: [Body, Body, Body] = [bodyAt(version, 0, t), bodyAt(version, 1, t), bodyAt(version, 2, t)];
    return {
        t,
        version,
        bodies,
        held: bodies.filter((body) => body.place === 'held').length,
    };
}

export function settle(version: Version): { places: [Place, Place, Place]; held: Hold } {
    const frame = frameAt(version, endTime(version));
    if (!isHold(frame.held)) throw new Error('held count');
    return {
        places: [frame.bodies[0].place, frame.bodies[1].place, frame.bodies[2].place],
        held: frame.held,
    };
}

/** How many responses stay held once this version has finished. */
export function heldCount(version: Version): Hold {
    return settle(version).held;
}

/** The version this loss leaves with the fewest responses held. */
export function lossyLinkFavours(): Version {
    return VERSIONS.reduce((best, version) => (heldCount(version) < heldCount(best) ? version : best));
}

export function summary(version: Version): string {
    assertVersion(version);
    if (version === 'h1') {
        return 'Two responses stay held. The earliest one is delivered. On one ordered connection the lost response holds the one after it.';
    }
    if (version === 'h2') {
        return 'Three responses stay held. One lost packet on the shared TCP connection stalls every stream that was still on it.';
    }
    return 'One response stays held. The other two are delivered. The loss holds only the stream that was in the lost packet.';
}

const ROLE = ['earliest', 'middle', 'latest'] as const;

function departure(id: BodyId): Event {
    return {
        t: SEND[id],
        id,
        place: 'wire',
        said: `The ${ROLE[id]} response is on the wire.`,
    };
}

/** Departures, the loss, and each delivery this version still allows. */
export function events(version: Version): Event[] {
    assertVersion(version);
    const left: Event[] = [departure(0), departure(1), departure(2)];
    if (version === 'h1') {
        return [
            ...left,
            {
                t: LOSS,
                id: LOST,
                place: 'held',
                said: 'The middle response is lost. The latest response is held. The earliest response is still on the wire.',
            },
            {
                t: endTime(version),
                id: 0,
                place: 'delivered',
                said: 'The earliest response is delivered. Two responses stay held.',
            },
        ];
    }
    if (version === 'h2') {
        return [
            ...left,
            {
                t: LOSS,
                id: LOST,
                place: 'held',
                said: 'The lost packet holds every response on this connection.',
            },
        ];
    }
    return [
        ...left,
        {
            t: LOSS,
            id: LOST,
            place: 'held',
            said: 'The lost packet holds the middle response. The other two are still on the wire.',
        },
        {
            t: SEND[0] + FLIGHT,
            id: 0,
            place: 'delivered',
            said: 'The earliest response is delivered. The latest response is still on the wire.',
        },
        {
            t: endTime(version),
            id: 2,
            place: 'delivered',
            said: 'The latest response is delivered. One response stays held.',
        },
    ];
}
