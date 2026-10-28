/**
 * Teaching model for the tls chapter. Four bodies cross one wire, in order:
 * the client's hello, the server's hello, one finished step, then one
 * application body. Handshake bodies are steps the other side can read.
 * The application body is sealed: what is on the wire is not the plaintext,
 * and the plaintext exists only inside the receiver.
 *
 * Not a trace, and not the key schedule or the AEAD construction.
 *
 * 1. Inputs: `checkName` is whether the client checks that the server is the
 *    expected one. The check does not change the flights.
 * 2. State at time t (ticks): the one current body, its place, how far it is
 *    along this trip, whether it is sealed, what the wire carries, and whether
 *    the plaintext is inside the receiver. Also whether the handshake has
 *    finished and whether the name has been checked.
 * 3. Rules: body i leaves at i × (FLIGHT + REST) and arrives FLIGHT ticks
 *    later. The next body does not leave during the rest. Only the application
 *    body is sealed. While it is sealed and not yet at the receiver, the
 *    plaintext is not inside. The name becomes checked at the server hello's
 *    arrival, and only when `checkName` is true.
 * 4. Equations: depart(i) = i × (FLIGHT + REST). arrive(i) = depart(i) + FLIGHT.
 *    along = time in flight / FLIGHT while on the wire. wire is the step name
 *    when not sealed, and the token `sealed` when sealed. That token is not
 *    PLAINTEXT.
 * 5. Assumptions: four bodies, one finished step, FLIGHT and REST ticks, the
 *    name check at the server hello's arrival, one application byte. All of
 *    those durations are assumed.
 * 6. Outputs: the body, handshakeDone, nameChecked, the outcome, and the
 *    event sentences.
 * 7. Boundaries: t before the first send; the instant a body arrives; the
 *    check skipped; the check kept.
 * 8. Deterministic.
 * 9. Limits: no second Finished, no Certificate or CertificateVerify message,
 *    no 0-RTT early data, no record fragmentation, no cipher arithmetic.
 * 10. Tests: src/lib/learn/tls-model.test.ts.
 */

/** Ticks for one body to cross the wire. Assumed. Not a measured round trip. */
export const FLIGHT = 4;
/**
 * Ticks a body waits at the far machine before the next body leaves. Assumed.
 */
export const REST = 2;
/** The Learn tab checks the name. */
export const LEARN_CHECKS = true;
/**
 * The application's byte, as this model names it. It is never the wire body.
 * Assumed label, not a measured record.
 */
export const PLAINTEXT = 'application byte';

export const ORDER = ['clientHello', 'serverHello', 'finished', 'application'] as const;
export type StepId = (typeof ORDER)[number];
export type Place = 'sender' | 'wire' | 'receiver';
export type Side = 'client' | 'server';
/** What an observer can take from the body. `sealed` is not PLAINTEXT. */
export type WireBody = StepId | 'sealed';
export type Outcome = 'checked' | 'unchecked';

export type Body = {
    step: StepId;
    from: Side;
    place: Place;
    /** 0 at the sending end of this trip, 1 at the receiving end. */
    along: number;
    /** True only for the application body. */
    sealed: boolean;
    /** The handshake step, or `sealed`. Never PLAINTEXT. */
    wire: WireBody;
    /** True only when a sealed body has arrived. The plaintext is inside there. */
    plaintextInside: boolean;
};

export type Frame = {
    t: number;
    body: Body;
    /** Handshake steps that have already arrived. */
    read: StepId[];
    handshakeDone: boolean;
    /** True after the server hello has arrived, and only if this run checks. */
    nameChecked: boolean;
    checkName: boolean;
};

export type Event = {
    t: number;
    step: StepId;
    kind: 'leave' | 'arrive';
    said: string;
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
    checked: 'The sealed body arrived, and the name was checked',
    unchecked: 'The sealed body arrived, and the name was not checked',
};

function assertInputs(checkName: boolean, t: number): void {
    if (typeof checkName !== 'boolean') throw new Error('checkName must be a boolean');
    if (!Number.isFinite(t)) throw new Error('t must be a finite number of ticks');
}

export function departTime(step: StepId): number {
    return ORDER.indexOf(step) * (FLIGHT + REST);
}

export function arriveTime(step: StepId): number {
    return departTime(step) + FLIGHT;
}

/** Tick when the sealed body has arrived. */
export function endTime(): number {
    return arriveTime('application');
}

export function outcomeOf(checkName: boolean): Outcome {
    if (typeof checkName !== 'boolean') throw new Error('checkName must be a boolean');
    return checkName ? 'checked' : 'unchecked';
}

function stepAt(t: number): StepId {
    let step: StepId = ORDER[0];
    for (const candidate of ORDER) {
        if (t + 1e-9 >= departTime(candidate)) step = candidate;
    }
    return step;
}

function fromOf(step: StepId): Side {
    return step === 'serverHello' ? 'server' : 'client';
}

/** The wire carries the step, or a seal. The seal is not the plaintext. */
export function wireOf(step: StepId): WireBody {
    return step === 'application' ? 'sealed' : step;
}

/**
 * Sealed means the wire body is not the plaintext, and the plaintext is inside
 * the receiver only after that body has arrived.
 */
export function wireHidesPlaintext(body: Body): boolean {
    const wire: string = body.wire;
    if (wire === PLAINTEXT) return false;
    if (body.sealed) {
        return body.wire === 'sealed' && (body.place === 'receiver') === body.plaintextInside;
    }
    return body.wire === body.step && body.plaintextInside === false;
}

function bodyAt(t: number): Body {
    const step = stepAt(t);
    const from = fromOf(step);
    const sealed = step === 'application';
    const wire = wireOf(step);
    const depart = departTime(step);
    if (t < depart) {
        return { step, from, place: 'sender', along: 0, sealed, wire, plaintextInside: false };
    }
    const fly = t - depart;
    if (fly < FLIGHT) {
        return {
            step,
            from,
            place: 'wire',
            along: fly / FLIGHT,
            sealed,
            wire,
            plaintextInside: false,
        };
    }
    return {
        step,
        from,
        place: 'receiver',
        along: 1,
        sealed,
        wire,
        plaintextInside: sealed,
    };
}

/** The body, the check, and the handshake flag at time t. Pure. */
export function frameAt(checkName: boolean, t: number): Frame {
    assertInputs(checkName, t);
    const read = ORDER.filter((step) => step !== 'application' && t + 1e-9 >= arriveTime(step));
    return {
        t,
        body: bodyAt(t),
        read,
        handshakeDone: t + 1e-9 >= arriveTime('finished'),
        nameChecked: checkName && t + 1e-9 >= arriveTime('serverHello'),
        checkName,
    };
}

export function settle(checkName: boolean): {
    sealedArrived: boolean;
    plaintextInside: boolean;
    nameChecked: boolean;
    outcome: Outcome;
} {
    const frame = frameAt(checkName, endTime());
    return {
        sealedArrived: frame.body.sealed && frame.body.place === 'receiver',
        plaintextInside: frame.body.plaintextInside,
        nameChecked: frame.nameChecked,
        outcome: outcomeOf(checkName),
    };
}

function leaveSaid(step: StepId): string {
    if (step === 'clientHello') {
        return "The client's hello leaves. The body is a handshake step, and it is not sealed.";
    }
    if (step === 'serverHello') {
        return "The server's hello leaves. The body is a handshake step, and it is not sealed.";
    }
    if (step === 'finished') {
        return 'The finished step leaves. The other side can read it as a handshake step. The application body has not left.';
    }
    return 'The application body leaves. It is sealed. The body on the wire is not the plaintext.';
}

function arriveSaid(step: StepId, checkName: boolean): string {
    if (step === 'clientHello') {
        return "The client's hello reaches the server, which can read it as a step.";
    }
    if (step === 'serverHello') {
        return checkName
            ? "The server's hello reaches the client. The client checks that this server is the expected one."
            : "The server's hello reaches the client. The client does not check that this server is the expected one.";
    }
    if (step === 'finished') {
        return 'The finished step reaches the server. The handshake in this model is finished.';
    }
    return checkName
        ? 'The sealed body reaches the server. The plaintext is only inside the receiver. The name was checked.'
        : 'The sealed body reaches the server. The plaintext is only inside the receiver. The name was not checked.';
}

/** One sentence per departure and arrival. Times are strictly increasing. */
export function events(checkName: boolean): Event[] {
    if (typeof checkName !== 'boolean') throw new Error('checkName must be a boolean');
    const out: Event[] = [];
    for (const step of ORDER) {
        out.push({ t: departTime(step), step, kind: 'leave', said: leaveSaid(step) });
        out.push({ t: arriveTime(step), step, kind: 'arrive', said: arriveSaid(step, checkName) });
    }
    return out;
}
