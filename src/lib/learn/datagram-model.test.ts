import { describe, expect, it } from 'vitest';

import { CATEGORIES, COUNT, EVENTS, LAST_TICK, simulate, TRANSPORTS } from './datagram-model';

const order = (e: Parameters<typeof simulate>[0], t: Parameters<typeof simulate>[1]) =>
    simulate(e, t).reads.map((r) => r.n);

describe('invariants (A3)', () => {
    it.each(EVENTS.flatMap((e) => TRANSPORTS.map((t) => [e, t] as const)))(
        '%s over %s: every sent copy is read, lost or discarded; nothing runs past the timeline',
        (e, t) => {
            const r = simulate(e, t);
            const lost = r.copies.filter((c) => c.arrived === null).length;
            expect(r.reads.length + lost + r.discarded.length).toBe(r.copies.length);
            for (const c of r.copies) if (c.arrived !== null) expect(c.arrived).toBeGreaterThan(c.sent);
            for (const x of r.reads) expect(x.held).toBeGreaterThanOrEqual(0);
            expect(r.lastRead).toBeLessThanOrEqual(LAST_TICK);
            expect(CATEGORIES).toContain(r.category);
            expect(simulate(e, t)).toEqual(r);
        }
    );

    it('TCP always reads 1 to 5, once each, in order', () => {
        for (const e of EVENTS) expect(order(e, 'TCP')).toEqual([1, 2, 3, 4, 5]);
        for (const e of EVENTS) expect(simulate(e, 'TCP').category).toBe('all in order');
    });

    it('UDP reads exactly what arrives, in arrival order, without waiting', () => {
        for (const e of EVENTS) {
            const r = simulate(e, 'UDP');
            const arrived = r.copies
                .filter((c) => c.arrived !== null)
                .sort((a, b) => a.arrived! - b.arrived!);
            expect(r.reads.map((x) => [x.n, x.at])).toEqual(arrived.map((c) => [c.n, c.arrived]));
            expect(r.reads.every((x) => x.held === 0)).toBe(true);
            expect(r.discarded).toEqual([]);
        }
    });

    it('nothing goes wrong: both read 1–5 at ticks 2–6', () => {
        for (const t of TRANSPORTS) {
            expect(simulate('none', t).reads.map((r) => r.at)).toEqual([2, 3, 4, 5, 6]);
            expect(simulate('none', t).category).toBe('all in order');
        }
    });

    it('sends five, numbered from 1', () => {
        expect(COUNT).toBe(5);
    });
});

describe('numbers quoted on the page', () => {
    it('lose 3: UDP reads 1 2 4 5, last at tick 6; TCP resends and its last read is at tick 10', () => {
        expect(order('lose3', 'UDP')).toEqual([1, 2, 4, 5]);
        expect(simulate('lose3', 'UDP').lastRead).toBe(6);
        expect(simulate('lose3', 'UDP').category).toBe('one missing');
        const t = simulate('lose3', 'TCP');
        expect(t.copies.filter((c) => c.resend)).toEqual([
            { n: 3, sent: 8, arrived: 10, resend: true, duplicate: false },
        ]);
        expect(t.lastRead).toBe(10);
        expect(t.reads.find((r) => r.n === 4)?.held).toBe(5);
    });

    it('delay 2: UDP reads 1 3 4 5 2; TCP holds 3–5 until 2 arrives at tick 7', () => {
        expect(order('delay2', 'UDP')).toEqual([1, 3, 4, 5, 2]);
        expect(simulate('delay2', 'UDP').category).toBe('all, out of order');
        const t = simulate('delay2', 'TCP');
        expect(t.reads.map((r) => r.at)).toEqual([2, 7, 7, 7, 7]);
        expect(t.lastRead).toBe(7);
    });

    it('duplicate 4: UDP reads 1 2 3 4 5 4; TCP discards the copy', () => {
        expect(order('dup4', 'UDP')).toEqual([1, 2, 3, 4, 5, 4]);
        expect(simulate('dup4', 'UDP').category).toBe('one twice');
        expect(simulate('dup4', 'TCP').discarded.map((c) => c.n)).toEqual([4]);
    });

    it('UDP never resends', () => {
        for (const e of EVENTS) expect(simulate(e, 'UDP').copies.some((c) => c.resend)).toBe(false);
    });
});
