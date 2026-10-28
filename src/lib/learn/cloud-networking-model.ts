/**
 * Teaching model for the cloud-networking chapter. One packet body. Its place
 * is outside, the public subnet, stopped at the boundary, through the NAT, or
 * the private subnet.
 *
 * Not a trace, and not a cloud vendor's route table.
 *
 * 1. Inputs: `trip` is which machine the body is aimed at. `public` aims at
 *    the public-subnet machine from outside. `private` aims at the private
 *    machine from outside. `nat` starts at the private machine and goes out
 *    through the one door; the reply comes back through that door. `t` is
 *    ticks, zero or greater.
 * 2. State: the body's place, the station it left (`from`), and `along`
 *    (0 at `from`, 1 at `place`). `arrived` is true only when the trip has
 *    ended at the machine it was for.
 * 3. Rules: each hop lasts HOP ticks. An outside body aimed at the public
 *    machine ends in the public subnet. The same kind of body aimed at the
 *    private machine ends stopped at the boundary and never enters the
 *    private subnet. The private machine reaches outside only through the
 *    NAT, and the reply returns through that same place. No static inbound
 *    map is configured.
 * 4. Equations: hop i arrives at (i + 1) × HOP. along = (t − left) / HOP
 *    while a hop is unfinished. end(`public`) = end(`private`) = HOP.
 *    end(`nat`) = 4 × HOP.
 * 5. Assumptions: HOP ticks, one door, one body, the four addresses below.
 *    The hop is not a measured round trip. Letting the body arrive at
 *    PUBLIC_ADDRESS is this model's rule about the open yard. RFC 5737 says
 *    that documentation block should not appear on the public Internet.
 *    Stopping the unsolicited private packet at this boundary is also this
 *    model's rule: RFC 1918 says such packets should not be forwarded across
 *    inter-enterprise links, and RFC 3022 allows a static inbound map, which
 *    this model does not draw.
 * 6. Outputs: the place, along, arrived, and the event sentences.
 * 7. Boundaries: t before zero, t after the end, the instant a hop finishes,
 *    the private trip (never the private subnet), the NAT reply.
 * 8. Deterministic.
 * 9. Limits: no second NAT, no port translation, no static inbound map, no
 *    path between the two subnets, no vendor route table.
 * 10. Tests: src/lib/learn/cloud-networking-model.test.ts.
 */

/** Ticks for one hop. Assumed. Not a measured round trip. */
export const HOP = 4;

/** Learn watches the outside body aimed at the private machine. */
export const LEARN_TRIP = 'private';

/**
 * Street host. RFC 5737 §3 TEST-NET-3 (203.0.113.0/24), a documentation
 * address. Not a measured public endpoint.
 */
export const OUTSIDE_ADDRESS = '203.0.113.5';
/**
 * Machine in the public subnet. RFC 5737 §3 TEST-NET-1 (192.0.2.0/24).
 * A documentation stand-in for the globally unique address RFC 1918 §3
 * requires of a public host. This model lets a body aimed here arrive.
 */
export const PUBLIC_ADDRESS = '192.0.2.10';
/**
 * Machine in the private subnet. Inside RFC 1918 §3 192.168.0.0/16.
 */
export const PRIVATE_ADDRESS = '192.168.2.10';
/**
 * Address the one NAT door shows on the outside of an outbound trip.
 * RFC 5737 §3 TEST-NET-2 (198.51.100.0/24). A documentation stand-in, not
 * an address copied from the examples in RFC 3022.
 */
export const NAT_ADDRESS = '198.51.100.10';

/**
 * RFC 3022 §2 allows an inbound session with a static map. This model has
 * none, so an unsolicited packet aimed at the private machine stops.
 */
export const MODEL_STOPS_UNSOLICITED = true;

export const TRIPS = ['public', 'private', 'nat'] as const;
export type Trip = (typeof TRIPS)[number];

export const PLACES = [
    'outside',
    'public subnet',
    'stopped at the boundary',
    'through the NAT',
    'private subnet',
] as const;
export type Place = (typeof PLACES)[number];

export const ARRIVALS = ['arrives', 'stops'] as const;
export type Arrival = (typeof ARRIVALS)[number];

export const TRIP_LABEL: Record<Trip, string> = {
    public: 'Public machine',
    private: 'Private machine',
    nat: 'Private machine going out through NAT',
};

export const ARRIVAL_LABEL: Record<Arrival, string> = {
    arrives: 'It arrives',
    stops: 'It stops short',
};

export type Frame = {
    t: number;
    trip: Trip;
    /**
     * Station of this hop. While the hop is unfinished this is where the
     * body is going, and `along` is the fraction from `from`. At a finished
     * hop, `along` is 1 and `from` equals `place`.
     */
    place: Place;
    from: Place;
    along: number;
    /** True only when the trip has ended at the machine it was for. */
    arrived: boolean;
};

export type Event = {
    t: number;
    place: Place;
    said: string;
};

type Leg = { to: Place; arrive: number };

function assertTrip(trip: Trip): void {
    if (trip !== 'public' && trip !== 'private' && trip !== 'nat') {
        throw new Error('trip must be public, private, or nat');
    }
}

function startOf(trip: Trip): Place {
    return trip === 'nat' ? 'private subnet' : 'outside';
}

function legsOf(trip: Trip): Leg[] {
    if (trip === 'public') return [{ to: 'public subnet', arrive: HOP }];
    if (trip === 'private') return [{ to: 'stopped at the boundary', arrive: HOP }];
    return [
        { to: 'through the NAT', arrive: HOP },
        { to: 'outside', arrive: 2 * HOP },
        { to: 'through the NAT', arrive: 3 * HOP },
        { to: 'private subnet', arrive: 4 * HOP },
    ];
}

export function endTime(trip: Trip): number {
    assertTrip(trip);
    const legs = legsOf(trip);
    const last = legs[legs.length - 1];
    if (!last) throw new Error('a trip has a leg');
    return last.arrive;
}

export function arrivalOf(trip: Trip): Arrival {
    assertTrip(trip);
    return trip === 'private' ? 'stops' : 'arrives';
}

export function frameAt(trip: Trip, t: number): Frame {
    assertTrip(trip);
    if (!Number.isFinite(t)) throw new Error('t must be a finite number of ticks');
    const start = startOf(trip);
    const legs = legsOf(trip);
    const end = endTime(trip);
    const time = Math.min(Math.max(t, 0), end);
    if (time <= 0) {
        return { t: time, trip, place: start, from: start, along: 0, arrived: false };
    }
    let from: Place = start;
    let left = 0;
    for (const leg of legs) {
        if (time + 1e-9 < leg.arrive) {
            return {
                t: time,
                trip,
                place: leg.to,
                from,
                along: (time - left) / (leg.arrive - left),
                arrived: false,
            };
        }
        if (time <= leg.arrive + 1e-9) {
            const done = leg.arrive === end;
            return {
                t: time,
                trip,
                place: leg.to,
                from: leg.to,
                along: 1,
                arrived: done && arrivalOf(trip) === 'arrives',
            };
        }
        from = leg.to;
        left = leg.arrive;
    }
    return {
        t: time,
        trip,
        place: from,
        from,
        along: 1,
        arrived: arrivalOf(trip) === 'arrives',
    };
}

export function events(trip: Trip): Event[] {
    assertTrip(trip);
    if (trip === 'public') {
        return [
            {
                t: 0,
                place: 'outside',
                said: `The body is outside, aimed at the public machine ${PUBLIC_ADDRESS}.`,
            },
            {
                t: HOP,
                place: 'public subnet',
                said: `The body is in the public subnet, at ${PUBLIC_ADDRESS}. It arrived.`,
            },
        ];
    }
    if (trip === 'private') {
        return [
            {
                t: 0,
                place: 'outside',
                said: `The body is outside, aimed at the private machine ${PRIVATE_ADDRESS}.`,
            },
            {
                t: HOP,
                place: 'stopped at the boundary',
                said: `The body is stopped at the boundary. It does not arrive at ${PRIVATE_ADDRESS}.`,
            },
        ];
    }
    return [
        {
            t: 0,
            place: 'private subnet',
            said: `The body is in the private subnet, at ${PRIVATE_ADDRESS}.`,
        },
        {
            t: HOP,
            place: 'through the NAT',
            said: `The body is through the NAT door. Outside, this model shows ${NAT_ADDRESS}.`,
        },
        {
            t: 2 * HOP,
            place: 'outside',
            said: `The body is outside. The reply comes back through the same door, ${NAT_ADDRESS}.`,
        },
        {
            t: 3 * HOP,
            place: 'through the NAT',
            said: 'The reply is through the NAT door.',
        },
        {
            t: 4 * HOP,
            place: 'private subnet',
            said: `The reply is in the private subnet, at ${PRIVATE_ADDRESS}. It arrived through the same door.`,
        },
    ];
}
