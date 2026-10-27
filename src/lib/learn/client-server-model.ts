/**
 * Teaching model for the client-server chapter (docs/system-design/chapters/client-server.md, "Visual" step 5): one
 * request-response exchange that can go wrong in four ways, with an optional single retry. Pure functions of the
 * inputs; the figure only reads them. A teaching model, not a benchmark: at most one retry, which always arrives and
 * gets its response in time; the server carries out a request completely or not at all; nobody else changes the
 * order meanwhile; the keyed server records each key together with its result; no proxies.
 */

export type Method = 'GET' | 'PUT' | 'POST' | 'POST_KEY';

export type Fault = 'none' | 'requestLost' | 'responseLost' | 'responseLate';

export type Inputs = { method: Method; fault: Fault; retry: boolean };

/** What the server did with one attempt. */
export type Outcome = 'read' | 'set quantity' | 'created order' | 'replayed' | 'conflict' | 'not reached';

export type Attempt = {
    /** 1 for the first send, 2 for the retry. */
    n: 1 | 2;
    reached: boolean;
    outcome: Outcome;
    /** The response the server sent, if it sent one (e.g. "201 Created"); null when the request never arrived. */
    response: string | null;
    /** What the client saw: the response, or that none came before it gave up. */
    clientSaw: string;
};

export type EventKind =
    | 'request'
    | 'request-lost'
    | 'server'
    | 'response'
    | 'response-lost'
    | 'response-late'
    | 'client';

/** One step of the stepper: who acts, and what happened, in words. */
export type Event = { attempt: 1 | 2; kind: EventKind; text: string };

export type Result = {
    attempts: Attempt[];
    events: Event[];
    /** How many times a request reached the server (0–2). */
    reached: number;
    /** Orders created by this exchange (0–2). */
    newOrders: number;
    /** Orders on the server afterwards, including order 42 (1–3). */
    totalOrders: number;
    /** Order 42's quantity afterwards (1 or 2). */
    quantity: number;
};

export const METHODS: Method[] = ['GET', 'PUT', 'POST', 'POST_KEY'];
export const FAULTS: Fault[] = ['none', 'requestLost', 'responseLost', 'responseLate'];

/** The request line each method sends, as the figure shows it. */
export const REQUEST_LINE: Record<Method, string> = {
    GET: 'GET /orders/42',
    PUT: 'PUT /orders/42 (quantity 2)',
    POST: 'POST /orders',
    POST_KEY: 'POST /orders with Idempotency-Key',
};

export const NO_RESPONSE = 'no response before its timeout';

/** State before the exchange: order 42 exists with quantity 1. */
const START = { orders: 1, quantity: 1 } as const;

type Server = { orders: number; quantity: number; keySeen: boolean; keyResult: string | null };

/**
 * Carry out one arriving request. `originalBusy` is true when a keyed retry arrives while the first attempt with the
 * same key is still being processed.
 */
function serve(method: Method, s: Server, originalBusy: boolean): { outcome: Outcome; response: string } {
    if (method === 'GET') return { outcome: 'read', response: '200 OK' };
    if (method === 'PUT') {
        s.quantity = 2;
        return { outcome: 'set quantity', response: '200 OK' };
    }
    if (method === 'POST_KEY' && s.keySeen) {
        if (originalBusy) return { outcome: 'conflict', response: '409 Conflict' };
        return { outcome: 'replayed', response: s.keyResult ?? '' };
    }
    s.orders += 1;
    const response = `201 Created, Location /orders/${41 + s.orders}`;
    if (method === 'POST_KEY') {
        s.keySeen = true;
        s.keyResult = response;
    }
    return { outcome: 'created order', response };
}

/** In the late case the first request is still being processed when the client gives up; it finishes last. */
const START_TEXT: Record<Outcome, string> = {
    read: 'starts reading order 42 (slowly)',
    'set quantity': 'starts setting order 42 to quantity 2 (slowly)',
    'created order': 'starts creating a new order (slowly)',
    replayed: '',
    conflict: '',
    'not reached': '',
};

const SERVER_TEXT: Record<Outcome, string> = {
    read: 'reads order 42 and changes nothing',
    'set quantity': 'sets order 42 to quantity 2',
    'created order': 'creates a new order',
    replayed:
        'has seen this key and finished it, so it answers consistently with the original (here: the stored result) and creates nothing',
    conflict: 'has seen this key and the first request is still being processed, so it refuses the copy',
    'not reached': 'receives nothing',
};

/** The first send: what reached the server, what it did, and the events up to the client's view (late reply aside). */
function firstAttempt(method: Method, fault: Fault, s: Server, events: Event[]): Attempt {
    const line = REQUEST_LINE[method];
    if (fault === 'requestLost') {
        events.push({
            attempt: 1,
            kind: 'request-lost',
            text: `Client sends ${line}; the request is lost on the way.`,
        });
        return { n: 1, reached: false, outcome: 'not reached', response: null, clientSaw: NO_RESPONSE };
    }
    events.push({ attempt: 1, kind: 'request', text: `Client sends ${line}; it reaches the server.` });
    const r = serve(method, s, false);
    // In the late case the server only starts here; its finish is told last, after any retry.
    const text = fault === 'responseLate' ? START_TEXT[r.outcome] : SERVER_TEXT[r.outcome];
    events.push({ attempt: 1, kind: 'server', text: `Server ${text}.` });
    if (fault === 'none')
        events.push({ attempt: 1, kind: 'response', text: `Response ${r.response} reaches the client.` });
    if (fault === 'responseLost')
        events.push({
            attempt: 1,
            kind: 'response-lost',
            text: `Response ${r.response} is lost on the way back.`,
        });
    return {
        n: 1,
        reached: true,
        outcome: r.outcome,
        response: r.response,
        clientSaw: fault === 'none' ? r.response : NO_RESPONSE,
    };
}

/** The retry: it always arrives and its answer arrives in time; in the late case the first is still running. */
function retryAttempt(method: Method, fault: Fault, s: Server, events: Event[]): Attempt {
    events.push({
        attempt: 2,
        kind: 'request',
        text: `Client sends the same ${REQUEST_LINE[method]} again; it reaches the server.`,
    });
    const r = serve(method, s, fault === 'responseLate');
    events.push({ attempt: 2, kind: 'server', text: `Server ${SERVER_TEXT[r.outcome]}.` });
    events.push({ attempt: 2, kind: 'response', text: `Response ${r.response} reaches the client.` });
    events.push({ attempt: 2, kind: 'client', text: `Client saw ${r.response}.` });
    return { n: 2, reached: true, outcome: r.outcome, response: r.response, clientSaw: r.response };
}

export function exchange(input: Inputs): Result {
    const { method, fault, retry } = input;
    const s: Server = { orders: START.orders, quantity: START.quantity, keySeen: false, keyResult: null };
    const events: Event[] = [];
    const first = firstAttempt(method, fault, s, events);
    const attempts: Attempt[] = [first];
    const noResponse = first.clientSaw === NO_RESPONSE;
    const still = fault === 'responseLate' ? ' (the server is still working)' : '';
    events.push({
        attempt: 1,
        kind: 'client',
        text: noResponse
            ? `Client saw ${NO_RESPONSE}${still}. From its side, a lost request, a lost response and a late response look the same.`
            : `Client saw ${first.clientSaw}.`,
    });
    // Retry: only when chosen and the first attempt showed nothing.
    if (retry && noResponse) attempts.push(retryAttempt(method, fault, s, events));
    // The late case ends with the first request finishing, after the client stopped waiting (and after any retry).
    if (fault === 'responseLate')
        events.push({
            attempt: 1,
            kind: 'response-late',
            text: `The first request finishes: the server ${SERVER_TEXT[first.outcome]}; its ${first.response} reaches a client that has stopped waiting.`,
        });
    return {
        attempts,
        events,
        reached: attempts.filter((a) => a.reached).length,
        newOrders: s.orders - START.orders,
        totalOrders: s.orders,
        quantity: s.quantity,
    };
}

/** The figure's three prediction questions, each a case of the model; answers are read from `exchange`. */
export type Prediction = {
    id: 'A' | 'B' | 'C';
    case: Inputs;
    ask: string;
    choices: string[];
    answer: string;
};

export function predictions(): Prediction[] {
    const a = exchange({ method: 'POST', fault: 'responseLost', retry: true });
    const b = exchange({ method: 'POST_KEY', fault: 'responseLost', retry: true });
    const c = exchange({ method: 'POST_KEY', fault: 'responseLate', retry: true });
    const reply = (r: Result): string => (r.attempts[1]?.response ?? '').split(',')[0];
    return [
        {
            id: 'A',
            case: { method: 'POST', fault: 'responseLost', retry: true },
            ask: 'POST /orders. The response is lost, so the app sends the same request again. How many new orders exist afterwards?',
            choices: ['0', '1', '2'],
            answer: String(a.newOrders),
        },
        {
            id: 'B',
            case: { method: 'POST_KEY', fault: 'responseLost', retry: true },
            ask: 'The same, but the request carries an Idempotency-Key that the server honours, and the retry repeats the key. How many new orders?',
            choices: ['0', '1', '2'],
            answer: String(b.newOrders),
        },
        {
            id: 'C',
            case: { method: 'POST_KEY', fault: 'responseLate', retry: true },
            ask: 'With the key again, but this time the response was late: the retry arrives while the first request is still being processed. What does the retry get back?',
            choices: ['201 Created', '409 Conflict', 'No response'],
            answer: reply(c),
        },
    ];
}
