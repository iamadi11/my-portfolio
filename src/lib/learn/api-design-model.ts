/**
 * Teaching model for one caller and one contract plate.
 *
 * RFC 9110, read from rfc-editor.org on 2026-10-29. A request message has a
 * method and a request target, and may have header fields (§3.4). Response
 * control data includes a status code (§6.2). The client examines that status
 * to see whether its intention was carried out (§1.3). The method is the
 * primary source of request semantics (§9.1). GET asks for a current
 * representation, usually answered 200 (§9.3.1, §15.3.1). The 2xx class means
 * the request was received, understood, and accepted (§15.3). A method that is
 * recognized but not allowed for the target resource should be answered 405
 * (§9.1). 405 means that method is known by the origin server but not
 * supported by the target resource (§15.5.6). 405 is a 4xx client error
 * (§15, §15.5), not a success. A recipient has to interpret the element by
 * those semantics (§2.4).
 *
 * This plate is not a company's API. `item` is a teaching label for the target
 * resource (§3.1, §7.1), not a product URI.
 *
 * 1. Inputs: an offer, `match` or `break`. A claim is a method, a target, and
 *    a status.
 * 2. State: whether the method, the target, and the assigned status agree.
 *    The body's place is `accepted` or `refused`.
 * 3. Rules: the place is accepted only when all three agree. GET on `item` is
 *    assigned 200. Any other method on `item` is assigned 405, the client
 *    error this plate names. A different target is assigned 404. The plate
 *    never assigns 200 to a broken part.
 * 4. Equations: none. The place is a boolean conjunction of the three parts.
 * 5. Assumptions: this plate allows only GET. The matching call finds a
 *    current representation. Neither fact was measured.
 * 6. Outputs: `judge(offer)`, including `place`. That place is the moving
 *    mark. Deleting the body deletes the lesson.
 * 7. Boundaries: the learn offer is accepted, status 200. The break offer is
 *    refused, status 405. A claim of 200 on POST does not agree.
 * 8. Deterministic. The same offer always returns the same place.
 * 9. Limits: one caller, one target label, no header field, no protocol
 *    version, no product. 404 is assigned for a different target and is not
 *    the offer the figure plays. Allow, required on a 405 response, is not
 *    a drawn value.
 */

export const CONTRACT_METHOD = 'GET' as const;
export const CONTRACT_TARGET = 'item' as const;
export const SUCCESS_STATUS = 200;
export const NOT_FOUND = 404;
export const NAMED_ERROR = 405;

export const OFFERS = ['match', 'break'] as const;
export type Offer = (typeof OFFERS)[number];

export const METHODS = ['GET', 'POST'] as const;
export type Method = (typeof METHODS)[number];

export const TARGETS = ['item', 'other'] as const;
export type Target = (typeof TARGETS)[number];

export const STATUSES = [SUCCESS_STATUS, NOT_FOUND, NAMED_ERROR] as const;
export type Status = (typeof STATUSES)[number];

export type Place = 'accepted' | 'refused';

export type Claim = {
    method: Method;
    target: Target;
    status: Status;
};

export type Agreement = {
    method: boolean;
    target: boolean;
    /** True when `status` is the status this plate assigns to that method and target. */
    error: boolean;
    /** Accepted only when method, target, and error all agree. */
    place: Place;
};

export type Broken = 'method' | 'target' | 'error' | null;

export type Judgement = {
    offer: Offer;
    method: Method;
    target: Target;
    status: Status;
    matches: boolean;
    broken: Broken;
    /** The model field. The body sits here once the plate has answered. */
    place: Place;
};

/** Status this plate assigns. 200 only when the method and the target both match. */
export function assignedStatus(method: Method, target: Target): Status {
    if (method !== CONTRACT_METHOD) return NAMED_ERROR;
    if (target !== CONTRACT_TARGET) return NOT_FOUND;
    return SUCCESS_STATUS;
}

/** A call agrees with the contract only when all three promised parts agree. */
export function agrees(claim: Claim): Agreement {
    const method = claim.method === CONTRACT_METHOD;
    const target = claim.target === CONTRACT_TARGET;
    const error = claim.status === assignedStatus(claim.method, claim.target);
    return {
        method,
        target,
        error,
        place: method && target && error ? 'accepted' : 'refused',
    };
}

/**
 * The two calls the figure plays. `match` is GET on `item`, assigned 200.
 * `break` is POST on `item`. The plate assigns 405, not 200.
 */
export function judge(offer: Offer): Judgement {
    const method: Method = offer === 'match' ? CONTRACT_METHOD : 'POST';
    const target: Target = CONTRACT_TARGET;
    const status = assignedStatus(method, target);
    const agreed = agrees({ method, target, status });
    let broken: Broken = null;
    if (!agreed.method) broken = 'method';
    else if (!agreed.target) broken = 'target';
    else if (!agreed.error) broken = 'error';
    return {
        offer,
        method,
        target,
        status,
        matches: agreed.place === 'accepted',
        broken,
        place: agreed.place,
    };
}

export function guessOf(offer: Offer): Place {
    return judge(offer).place;
}

/** Learn and lab share one clock: the body is with the caller, then at its place. */
export const MARKS = [0, 1] as const;
export const END = 1;

export function readout(judgement: Judgement, t: number): string {
    if (!Number.isFinite(t) || t < 0 || t > END) throw new Error('t is from 0 to 1');
    if (t <= 0) return 'The body is still with the caller.';
    if (t < END) return 'The body is moving.';
    if (judgement.place === 'accepted') {
        return `The body is seated. The call was accepted. Status ${judgement.status}. The caller can see the body in the seat.`;
    }
    const named = judgement.status === NAMED_ERROR ? ', the error this plate names' : '';
    return `The body is not seated. The call was refused. Status ${judgement.status}${named}. The caller sees the body off the seat, not a success.`;
}

/** Lab result after the body has arrived. Not the step line. */
export function outcome(offer: Offer): string {
    const got = judge(offer);
    if (got.place === 'accepted') {
        return `${got.method} on ${got.target} agrees with this plate. The body is accepted. Status ${got.status}.`;
    }
    return `${got.method} on ${got.target} breaks the promised method. The body is refused. Status ${got.status}, not ${SUCCESS_STATUS}.`;
}
