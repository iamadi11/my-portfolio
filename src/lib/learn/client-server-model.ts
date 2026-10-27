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

const SERVER_TEXT: Record<Outcome, string> = {
    read: 'reads order 42 and changes nothing',
    'set quantity': 'sets order 42 to quantity 2',
    'created order': 'creates a new order',
    replayed: 'has seen this key and its finished result, so it sends that result again and creates nothing',
    conflict: 'has seen this key and the first request is still being processed, so it refuses the copy',
    'not reached': 'receives nothing',
};

export function exchange(input: Inputs): Result {
    const { method, fault, retry } = input;
    const s: Server = { orders: START.orders, quantity: START.quantity, keySeen: false, keyResult: null };
    const attempts: Attempt[] = [];
    const events: Event[] = [];
    const line = REQUEST_LINE[method];

    // First attempt.
    if (fault === 'requestLost') {
        events.push({
            attempt: 1,
            kind: 'request-lost',
            text: `Client sends ${line}; the request is lost on the way.`,
        });
        attempts.push({
            n: 1,
            reached: false,
            outcome: 'not reached',
            response: null,
            clientSaw: NO_RESPONSE,
        });
    } else {
        events.push({ attempt: 1, kind: 'request', text: `Client sends ${line}; it reaches the server.` });
        const r = serve(method, s, false);
        events.push({ attempt: 1, kind: 'server', text: `Server ${SERVER_TEXT[r.outcome]}.` });
        const saw = fault === 'none' ? r.response : NO_RESPONSE;
        events.push(
            fault === 'none'
                ? { attempt: 1, kind: 'response', text: `Response ${r.response} reaches the client.` }
                : fault === 'responseLost'
                  ? {
                        attempt: 1,
                        kind: 'response-lost',
                        text: `Response ${r.response} is lost on the way back.`,
                    }
                  : {
                        attempt: 1,
                        kind: 'response-late',
                        text: `The server is still working when the client stops waiting; its ${r.response} comes too late.`,
                    }
        );
        attempts.push({ n: 1, reached: true, outcome: r.outcome, response: r.response, clientSaw: saw });
    }
    const first = attempts[0];
    events.push({
        attempt: 1,
        kind: 'client',
        text:
            first.clientSaw === NO_RESPONSE
                ? `Client saw ${NO_RESPONSE}. From its side, a lost request, a lost response and a late response look the same.`
                : `Client saw ${first.clientSaw}.`,
    });

    // Retry: only when chosen and the first attempt showed nothing.
    if (retry && first.clientSaw === NO_RESPONSE) {
        events.push({
            attempt: 2,
            kind: 'request',
            text: `Client sends the same ${line} again; it reaches the server.`,
        });
        const r = serve(method, s, fault === 'responseLate');
        events.push({ attempt: 2, kind: 'server', text: `Server ${SERVER_TEXT[r.outcome]}.` });
        events.push({ attempt: 2, kind: 'response', text: `Response ${r.response} reaches the client.` });
        attempts.push({
            n: 2,
            reached: true,
            outcome: r.outcome,
            response: r.response,
            clientSaw: r.response,
        });
        events.push({ attempt: 2, kind: 'client', text: `Client saw ${r.response}.` });
    }

    const newOrders = s.orders - START.orders;
    return {
        attempts,
        events,
        reached: attempts.filter((a) => a.reached).length,
        newOrders,
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
