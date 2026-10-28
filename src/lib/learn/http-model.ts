/**
 * Teaching model for the http chapter. One resource. A request is a method, a target,
 * and header fields. A response is a status code and header fields. The message is
 * either at the client or at the server. What the server does is `apply`.
 *
 * Not a trace, and not every status a real server may choose. Where RFC 9110 allows
 * more than one success status, this resource picks one and the spec says which.
 *
 * 1. Inputs: `method` is GET, PUT, or POST. `exists` is whether the target has a
 *    current representation before the request.
 * 2. State: the message's place (client or server), its role (request or response),
 *    the status once the server has applied the method, whether the stored
 *    representation changed, and which plate is in the slot.
 * 3. Rules: GET retrieves. A representation that is there comes back as 200 and the
 *    stored representation is unchanged. No current representation is 404, and still
 *    nothing is stored. PUT replaces the target's state with the enclosed
 *    representation: 200 when one was already there (this resource sends 200, not
 *    204), 201 when the PUT creates one. POST asks this resource to process the
 *    request: 200 when a representation was already there and processing changes it,
 *    201 when that processing creates one.
 * 4. Equations: none. The result is the table in `apply`. Place is client before
 *    APPLY_AT, server from APPLY_AT until RESPONSE_AT, then client again.
 * 5. Assumptions: this one resource succeeds. It has no second representation, no
 *    content negotiation, and no loss. APPLY_AT and RESPONSE_AT are event indexes,
 *    not durations from the specification. The choice of 200 rather than 204 on a
 *    successful PUT that modifies an existing representation is this resource's
 *    choice. POST's status is this resource's processing result, not every POST.
 * 6. Outputs: status, changed, stored, place, role, and plate.
 * 7. Boundaries: each method with the slot full and with the slot empty; time before
 *    the server applies the method; time after the response is back at the client.
 * 8. Deterministic.
 * 9. Limits: no lost request or lost response, no retry, no TLS, no header-field
 *    values, no 204 drawn, no HEAD, DELETE, or other methods. A 404 here means no
 *    current representation was found. The status also allows a server that will not
 *    disclose that one exists. A safe method can still have side effects the client
 *    did not request, such as a log line. This picture's "unchanged" is the stored
 *    representation.
 * 10. Tests: src/lib/learn/http-model.test.ts.
 */

export const METHODS = ['GET', 'PUT', 'POST'] as const;
export type Method = (typeof METHODS)[number];

/** Status codes this resource sends. Each one is defined in RFC 9110. */
export type Status = 200 | 201 | 404;

export type Place = 'client' | 'server';
export type Role = 'request' | 'response';

/**
 * What the slot shows. `original` is the representation that was already there.
 * `replaced` is the enclosed representation now stored (PUT). `processed` is the
 * result of this resource's own processing (POST). `empty` means nothing is stored.
 */
export type Plate = 'empty' | 'original' | 'replaced' | 'processed';

export type Action = 'retrieve' | 'missing' | 'replace' | 'create' | 'process';

export type Outcome = 'get-200' | 'get-404' | 'put-200' | 'put-201' | 'post-200' | 'post-201';

/**
 * Event index when the request is at the server and the method has been applied.
 * Not a duration from RFC 9110.
 */
export const APPLY_AT = 1;
/**
 * Event index when the response is back at the client.
 * Not a duration from RFC 9110.
 */
export const RESPONSE_AT = 2;

/** Learn plays a GET that finds a current representation. */
export const LEARN_METHOD: Method = 'GET';
export const LEARN_EXISTS = true;

export type Result = {
    status: Status;
    /** The stored representation changed. */
    changed: boolean;
    /** A representation is stored after the method is applied. */
    stored: boolean;
    action: Action;
    plate: Plate;
};

export type Frame = {
    t: number;
    place: Place;
    role: Role;
    /** Null until the server has applied the method. */
    status: Status | null;
    changed: boolean;
    stored: boolean;
    /** Null until the server has applied the method. */
    action: Action | null;
    plate: Plate;
};

export type Event = { t: number; said: string };

export const OUTCOME_LABEL: Record<Outcome, string> = {
    'get-200': '200, and the plate stays',
    'get-404': '404, and the slot stays empty',
    'put-200': '200, and the plate is replaced',
    'put-201': '201, and PUT stores a new plate',
    'post-200': '200, and processing changes the plate',
    'post-201': '201, and processing stores a new plate',
};

function assertMethod(method: Method): void {
    if (!METHODS.includes(method)) throw new Error('method must be GET, PUT, or POST');
}

function assertExists(exists: boolean): void {
    if (typeof exists !== 'boolean') throw new Error('exists must be a boolean');
}

/** What this resource does with one method and one slot. */
export function apply(method: Method, exists: boolean): Result {
    assertMethod(method);
    assertExists(exists);
    if (method === 'GET') {
        if (exists) {
            return { status: 200, changed: false, stored: true, action: 'retrieve', plate: 'original' };
        }
        return { status: 404, changed: false, stored: false, action: 'missing', plate: 'empty' };
    }
    if (method === 'PUT') {
        if (exists) {
            return { status: 200, changed: true, stored: true, action: 'replace', plate: 'replaced' };
        }
        return { status: 201, changed: true, stored: true, action: 'create', plate: 'replaced' };
    }
    if (exists) {
        return { status: 200, changed: true, stored: true, action: 'process', plate: 'processed' };
    }
    return { status: 201, changed: true, stored: true, action: 'create', plate: 'processed' };
}

export function outcomeOf(method: Method, exists: boolean): Outcome {
    const result = apply(method, exists);
    if (method === 'GET') return result.status === 200 ? 'get-200' : 'get-404';
    if (method === 'PUT') return result.status === 200 ? 'put-200' : 'put-201';
    return result.status === 200 ? 'post-200' : 'post-201';
}

export function frameAt(method: Method, exists: boolean, t: number): Frame {
    assertMethod(method);
    assertExists(exists);
    const before = t < APPLY_AT;
    if (before) {
        return {
            t,
            place: 'client',
            role: 'request',
            status: null,
            changed: false,
            stored: exists,
            action: null,
            plate: exists ? 'original' : 'empty',
        };
    }
    const result = apply(method, exists);
    const back = t >= RESPONSE_AT;
    return {
        t,
        place: back ? 'client' : 'server',
        role: back ? 'response' : 'request',
        status: result.status,
        changed: result.changed,
        stored: result.stored,
        action: result.action,
        plate: result.plate,
    };
}

function appliedSaid(method: Method, result: Result): string {
    if (method === 'GET' && result.action === 'retrieve') {
        return 'The request is at the server. GET retrieves the current representation. The plate stays. Status 200.';
    }
    if (method === 'GET' && result.action === 'missing') {
        return 'The request is at the server. GET finds no current representation. The slot stays empty. Status 404.';
    }
    if (method === 'PUT' && result.action === 'replace') {
        return 'The request is at the server. PUT replaces the stored representation. Status 200.';
    }
    if (method === 'PUT' && result.action === 'create') {
        return 'The request is at the server. PUT creates a representation where none was stored. Status 201.';
    }
    if (method === 'POST' && result.action === 'process') {
        return 'The request is at the server. POST asks this resource to process the request. The stored representation changes. Status 200.';
    }
    return 'The request is at the server. POST asks this resource to process the request, and that processing creates a representation. Status 201.';
}

/** The three stops: request at the client, request at the server, response at the client. */
export function events(method: Method, exists: boolean): Event[] {
    const result = apply(method, exists);
    const slot = exists ? 'The slot holds a representation.' : 'The slot is empty.';
    const after = result.changed
        ? 'The stored representation changed.'
        : 'The stored representation did not change.';
    return [
        {
            t: 0,
            said: `The request is at the client: ${method}, the target, and header fields. ${slot}`,
        },
        { t: APPLY_AT, said: appliedSaid(method, result) },
        {
            t: RESPONSE_AT,
            said: `The response is at the client: status ${result.status} and header fields. ${after}`,
        },
    ];
}

/** One or two sentences for the lab, after the run. The status and the change come from `apply`. */
export function summary(method: Method, exists: boolean): string {
    const result = apply(method, exists);
    if (method === 'GET' && result.action === 'retrieve') {
        return 'Status 200. GET retrieved the current representation, and the stored representation did not change.';
    }
    if (method === 'GET' && result.action === 'missing') {
        return 'Status 404. GET found no current representation, and nothing is stored.';
    }
    if (method === 'PUT' && result.action === 'replace') {
        return 'Status 200. PUT replaced the stored representation with the enclosed one.';
    }
    if (method === 'PUT' && result.action === 'create') {
        return 'Status 201. PUT created a representation in the empty slot.';
    }
    if (method === 'POST' && result.action === 'process') {
        return 'Status 200. POST asked this resource to process the request, and the stored representation changed.';
    }
    return 'Status 201. POST asked this resource to process the request, and that processing created a representation.';
}

export function endTime(): number {
    return RESPONSE_AT;
}

/** The plate in the slot after the method has been applied. */
export function finishedPlate(method: Method, exists: boolean): Plate {
    return apply(method, exists).plate;
}
