import { describe, expect, it } from 'vitest';

import {
    CATEGORIES,
    COUNT,
    EVENTS,
    FAIL_AT,
    positionAt,
    REROUTE_AT,
    RTO,
    SERVICES,
    simulate,
    TRANSPORTS,
    type Inputs,
} from './network-model';

const all: Inputs[] = EVENTS.flatMap((event) =>
    TRANSPORTS.flatMap((transport) => SERVICES.map((service) => ({ event, transport, service })))
);
const run = (event: Inputs['event'], transport: Inputs['transport'], service: Inputs['service'] = 1) =>
    simulate({ event, transport, service });
const order = (r: ReturnType<typeof simulate>) => r.reads.map((x) => x.n);

describe('invariants (A3)', () => {
    it.each(all.map((i) => [i.event, i.transport, i.service] as const))(
        '%s over %s (service %i): conservation, causality, bounds, determinism',
        (event, transport, service) => {
            const r = simulate({ event, transport, service });
            for (const c of r.copies) {
                // Each copy either reaches H or is lost; never both.
                const reached = c.hops.at(-1)?.node === 'H';
                expect(reached !== (c.lost !== null)).toBe(true);
                // Causality: hop times never go backwards; a copy never arrives before it is sent.
                for (let i = 1; i < c.hops.length; i++)
                    expect(c.hops[i].at).toBeGreaterThan(c.hops[i - 1].at);
                expect(c.waited).toBeGreaterThanOrEqual(0);
            }
            expect(r.maxQueue).toBeGreaterThanOrEqual(0);
            expect(CATEGORIES).toContain(r.category);
            for (const x of r.reads) expect(x.held).toBeGreaterThanOrEqual(0);
            expect(r.end).toBeGreaterThan(r.lastRead);
            expect(simulate({ event, transport, service })).toEqual(r);
        }
    );

    it('TCP always reads 1–5 once each, in order', () => {
        for (const i of all.filter((x) => x.transport === 'TCP'))
            expect(order(simulate(i))).toEqual([1, 2, 3, 4, 5]);
    });

    it('UDP reads exactly what arrives, when it arrives, and never resends', () => {
        for (const i of all.filter((x) => x.transport === 'UDP')) {
            const r = simulate(i);
            expect(r.copies.some((c) => c.resend)).toBe(false);
            expect(order(r)).toEqual(r.arrivalOrder);
            expect(r.reads.every((x) => x.held === 0)).toBe(true);
        }
    });

    it('sends five packets, two ticks apart', () => {
        const r = run('none', 'UDP');
        expect(r.copies.map((c) => c.sent)).toEqual([0, 2, 4, 6, 8]);
        expect(COUNT).toBe(5);
    });
});

describe('numbers quoted on the page', () => {
    it('nothing goes wrong: arrivals 4, 6, 8, 10, 12, in order, both transports', () => {
        for (const t of TRANSPORTS) {
            const r = run('none', t);
            expect(r.reads.map((x) => x.at)).toEqual([4, 6, 8, 10, 12]);
            expect(r.category).toBe('all in order');
        }
    });

    it('route change: 2 overtakes 1 (UDP reads 2 1 3 4 5); TCP holds 2 until 1 arrives at tick 7', () => {
        const u = run('reroute', 'UDP');
        expect(order(u)).toEqual([2, 1, 3, 4, 5]);
        expect(u.reads.slice(0, 2).map((x) => x.at)).toEqual([6, 7]);
        expect(u.category).toBe('all, out of order');
        const t = run('reroute', 'TCP');
        expect(t.reads.slice(0, 2)).toEqual([
            { n: 1, at: 7, held: 0 },
            { n: 2, at: 7, held: 1 },
        ]);
        // Packet 1 took the long lower path, 2 the short upper one.
        expect(t.copies[0].hops.map((h) => h.node)).toEqual(['S', 'R1', 'R3', 'R4', 'H']);
        expect(t.copies[1].hops.map((h) => h.node)).toEqual(['S', 'R1', 'R2', 'R4', 'H']);
    });

    it('link failure: R2 drops 2 and 3; UDP reads 1 4 5; TCP resends both and reads all five, last at tick 23', () => {
        const u = run('linkFail', 'UDP');
        expect(order(u)).toEqual([1, 4, 5]);
        expect(u.category).toBe('some missing');
        expect(u.copies.filter((c) => c.lost).map((c) => [c.n, c.lost!.node, c.lost!.at])).toEqual([
            [2, 'R2', FAIL_AT],
            [3, 'R2', 6],
        ]);
        const t = run('linkFail', 'TCP');
        expect(t.copies.filter((c) => c.resend).map((c) => [c.n, c.sent, c.hops.at(-1)!.at])).toEqual([
            [2, 2 + RTO, 21],
            [3, 4 + RTO, 23],
        ]);
        expect(t.lastRead).toBe(23);
        expect(t.reads.find((x) => x.n === 4)).toEqual({ n: 4, at: 23, held: 10 });
    });

    it('rerouting happens only after reconvergence: packets reaching R1 from tick 7 take the lower path', () => {
        const r = run('linkFail', 'UDP');
        expect(r.copies[3].hops[1].at).toBe(REROUTE_AT);
        expect(r.copies[3].hops.map((h) => h.node)).toContain('R3');
    });

    it('congestion: service 1 or 2 builds no queue; service 3 grows it to 2 and delays every later packet, in order', () => {
        expect(run('congestion', 'UDP', 1).maxQueue).toBe(0);
        expect(run('congestion', 'UDP', 2).maxQueue).toBe(0);
        const r = run('congestion', 'UDP', 3);
        expect(r.maxQueue).toBe(2);
        expect(r.reads.map((x) => x.at)).toEqual([6, 9, 12, 15, 18]);
        expect(r.copies.map((c) => c.waited)).toEqual([0, 1, 2, 3, 4]);
        expect(r.category).toBe('all in order');
    });
});

describe('misconception guards', () => {
    it('congestion delays but never reorders or loses (FIFO on one path)', () => {
        for (const service of SERVICES) {
            const r = run('congestion', 'UDP', service);
            expect(order(r)).toEqual([1, 2, 3, 4, 5]);
        }
    });

    it('the network still loses packets under TCP: TCP recovers in the end hosts', () => {
        expect(run('linkFail', 'TCP').copies.some((c) => c.lost !== null)).toBe(true);
    });

    it('no packet is resent unless it was lost (the timer is longer than any delay here)', () => {
        for (const i of all.filter((x) => x.transport === 'TCP')) {
            const r = simulate(i);
            const lost = new Set(r.copies.filter((c) => c.lost).map((c) => c.n));
            for (const c of r.copies.filter((x) => x.resend)) expect(lost.has(c.n)).toBe(true);
            for (const c of r.copies.filter((x) => !x.resend && !x.lost))
                expect(c.hops.at(-1)!.at - c.sent).toBeLessThan(RTO);
        }
    });
});

describe('the animation reads the same events', () => {
    it('a copy is on its link between its hop times, waits in the queue, and is gone after arriving', () => {
        const r = run('congestion', 'UDP', 3);
        const p2 = r.copies[1]; // reaches R2 at 4, waits 1, leaves at 5, reaches R4 at 8
        expect(positionAt(p2, 1)).toBeNull();
        expect(positionAt(p2, 4.5)).toEqual({ at: 'R2', waiting: true });
        expect(positionAt(p2, 6.5)).toEqual({ from: 'R2', to: 'R4', p: 0.5 });
        expect(positionAt(p2, 20)).toBeNull();
    });

    it('a lost copy stops at the router that dropped it and stays there for the rest of the run', () => {
        const r = run('linkFail', 'UDP');
        const p3 = r.copies[2];
        expect(positionAt(p3, 5.9)).toMatchObject({ from: 'R1', to: 'R2' });
        expect(positionAt(p3, 6.2)).toEqual({ at: 'R2', waiting: false });
        expect(positionAt(p3, r.end)).toEqual({ at: 'R2', waiting: false });
    });
});
