import { describe, expect, it } from 'vitest';

import {
    exchange,
    FAULTS,
    METHODS,
    NO_RESPONSE,
    predictions,
    type Fault,
    type Inputs,
    type Method,
} from './client-server-model';

const run = (method: Method, fault: Fault, retry = false) => exchange({ method, fault, retry });

describe('what the client can see (chapter: question 5, question 7 step 7)', () => {
    it.each(METHODS)(
        '%s: without a retry, a lost request, a lost response and a late response look the same',
        (m) => {
            const seen = (['requestLost', 'responseLost', 'responseLate'] as Fault[]).map(
                (f) => run(m, f).attempts[0].clientSaw
            );
            expect(seen).toEqual([NO_RESPONSE, NO_RESPONSE, NO_RESPONSE]);
        }
    );

    it('but the server did different things: nothing, or the full request', () => {
        expect(run('POST', 'requestLost').newOrders).toBe(0);
        expect(run('POST', 'responseLost').newOrders).toBe(1);
        expect(run('POST', 'responseLate').newOrders).toBe(1);
    });

    it('with nothing going wrong, the client sees the response and no retry is sent', () => {
        const r = run('POST', 'none', true);
        expect(r.attempts).toHaveLength(1);
        expect(r.attempts[0].clientSaw).toBe('201 Created, Location /orders/43');
    });
});

describe('retrying (question 7 steps 8-9, worked example, figure predictions)', () => {
    it.each(['responseLost', 'responseLate'] as Fault[])(
        'POST with %s and a retry creates a second order',
        (f) => {
            const r = run('POST', f, true);
            expect(r.newOrders).toBe(2);
            expect(r.totalOrders).toBe(3);
            expect(r.attempts[1].clientSaw).toBe('201 Created, Location /orders/44');
        }
    );

    it('POST after a lost request: the retry is the first to arrive, so one order', () => {
        expect(run('POST', 'requestLost', true).newOrders).toBe(1);
    });

    it('POST with a key, response lost: the retry gets the original result replayed and creates nothing', () => {
        const r = run('POST_KEY', 'responseLost', true);
        expect(r.newOrders).toBe(1);
        expect(r.attempts[1].outcome).toBe('replayed');
        expect(r.attempts[1].clientSaw).toBe(r.attempts[0].response);
    });

    it('POST with a key, response late: the retry arrives while the first is in progress and gets 409 Conflict', () => {
        const r = run('POST_KEY', 'responseLate', true);
        expect(r.newOrders).toBe(1);
        expect(r.attempts[1].clientSaw).toBe('409 Conflict');
    });

    it('POST with a key, request lost: the retry is the first time the key is seen, so it creates one order', () => {
        const r = run('POST_KEY', 'requestLost', true);
        expect(r.newOrders).toBe(1);
        expect(r.attempts[1].outcome).toBe('created order');
    });

    it.each(FAULTS)('PUT (%s): quantity is 2 whenever it reached the server, once or twice', (f) => {
        for (const retry of [false, true]) {
            const r = run('PUT', f, retry);
            expect(r.quantity).toBe(r.reached > 0 ? 2 : 1);
            expect(r.newOrders).toBe(0);
        }
    });

    it.each(FAULTS)('GET (%s) never changes the state', (f) => {
        for (const retry of [false, true]) {
            const r = run('GET', f, retry);
            expect([r.newOrders, r.totalOrders, r.quantity]).toEqual([0, 1, 1]);
        }
    });
});

describe('event order in the late case (the first request is still in progress when the retry arrives)', () => {
    it.each(METHODS)(
        '%s: the first request starts, the client gives up, the retry runs, then the first finishes',
        (m) => {
            const ev = exchange({ method: m, fault: 'responseLate', retry: true }).events;
            const at = (attempt: number, kind: string): number =>
                ev.findIndex((e) => e.attempt === attempt && e.kind === kind);
            const started = at(1, 'server');
            const gaveUp = at(1, 'client');
            const retried = at(2, 'server');
            const finished = at(1, 'response-late');
            expect(ev[started].text).toMatch(/starts/);
            expect(started).toBeLessThan(gaveUp);
            expect(gaveUp).toBeLessThan(retried);
            expect(retried).toBeLessThan(finished);
            expect(finished).toBe(ev.length - 1);
        }
    );

    it('without a retry, the late response is still told after the client gave up', () => {
        const ev = exchange({ method: 'POST', fault: 'responseLate', retry: false }).events;
        expect(ev.map((e) => e.kind)).toEqual(['request', 'server', 'client', 'response-late']);
    });

    it('nothing before the retry says the first request has finished', () => {
        const ev = exchange({ method: 'POST_KEY', fault: 'responseLate', retry: true }).events;
        const beforeRetry = ev.slice(
            0,
            ev.findIndex((e) => e.attempt === 2)
        );
        expect(beforeRetry.some((e) => /creates a new order|201/.test(e.text))).toBe(false);
    });
});

describe('invariants over every case (4 methods × 4 faults × 2)', () => {
    const cases: Inputs[] = METHODS.flatMap((method) =>
        FAULTS.flatMap((fault) => [false, true].map((retry) => ({ method, fault, retry })))
    );

    it('covers 32 cases', () => expect(cases).toHaveLength(32));

    it.each(cases)('$method / $fault / retry $retry stays in bounds and adds up', (c) => {
        const r = exchange(c);
        expect(r.reached).toBeGreaterThanOrEqual(0);
        expect(r.reached).toBeLessThanOrEqual(2);
        expect(r.reached).toBe(r.attempts.filter((a) => a.reached).length);
        expect(r.newOrders).toBeGreaterThanOrEqual(0);
        expect(r.newOrders).toBeLessThanOrEqual(2);
        expect(r.totalOrders).toBe(1 + r.newOrders);
        expect([1, 2]).toContain(r.quantity);
        expect(r.newOrders).toBeLessThanOrEqual(r.reached);
        // A retry is sent only after the first attempt showed nothing.
        expect(r.attempts.length).toBe(c.retry && c.fault !== 'none' ? 2 : 1);
        expect(r.events.every((e) => e.text.length > 0)).toBe(true);
    });

    it('is deterministic', () => {
        for (const c of cases) expect(exchange(c)).toEqual(exchange(c));
    });
});

describe('prediction questions', () => {
    it('answers come from the model and are among the choices', () => {
        const p = predictions();
        expect(p.map((q) => q.answer)).toEqual(['2', '1', '409 Conflict']);
        for (const q of p) expect(q.choices).toContain(q.answer);
        const [a, b, c] = p.map((q) => exchange(q.case));
        expect(String(a.newOrders)).toBe(p[0].answer);
        expect(String(b.newOrders)).toBe(p[1].answer);
        expect(c.attempts[1].response).toBe(p[2].answer);
    });
});
