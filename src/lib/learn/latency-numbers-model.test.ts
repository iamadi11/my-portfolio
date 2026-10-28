import { describe, expect, it } from 'vitest';

import {
    BRANCH_NS,
    CLOCK_SHIFT,
    DISK_READ_NS,
    DOMINANT_ORDERS,
    INSTRUCTION_NS,
    L1_NS,
    L2_NS,
    MEM_READ_NS,
    MEMORY_NS,
    MUTEX_NS,
    NET_NS,
    PITCH,
    SEEK_NS,
    SSD_NS,
    WAN_MS,
    WAN_NS,
    X0,
    carriageX,
    clockOf,
    dominates,
    factor,
    formatFactor,
    formatMagnitude,
    formatNs,
    labMarks,
    learnMarks,
    magnitude,
    magnitudeFromClock,
    operation,
    pairOf,
    tour,
    xAtClock,
    xOfMagnitude,
} from './latency-numbers-model';

describe('latency numbers', () => {
    it('quotes the Answers table and the script constant, and keeps the unused rows off the tour', () => {
        expect(operation('l1')).toMatchObject({
            durationNs: L1_NS,
            origin: 'answers',
            name: 'fetch from L1 cache memory',
        });
        expect(operation('memory').durationNs).toBe(100);
        expect(operation('net').durationNs).toBe(20_000);
        expect(operation('memRead').durationNs).toBe(250_000);
        expect(operation('seek').durationNs).toBe(8_000_000);
        expect(operation('diskRead').durationNs).toBe(20_000_000);
        expect(operation('wan').durationNs).toBe(150_000_000);
        expect(WAN_NS).toBe(WAN_MS * 1_000_000);
        expect(operation('ssd')).toMatchObject({
            durationNs: 16_000,
            origin: 'script',
            name: 'SSD random read',
        });
        const stopped = new Set(tour().map((op) => op.durationNs));
        expect(stopped.has(INSTRUCTION_NS)).toBe(false);
        expect(stopped.has(BRANCH_NS)).toBe(false);
        expect(stopped.has(L2_NS)).toBe(false);
        expect(stopped.has(MUTEX_NS)).toBe(false);
        expect(L1_NS).toBe(0.5);
        expect(BRANCH_NS).toBe(5);
        expect(L2_NS).toBe(7);
        expect(MUTEX_NS).toBe(25);
    });

    it('sets magnitude to log10 of the nanoseconds, with 1 ns at 0 and 100 ns at 2', () => {
        expect(magnitude(INSTRUCTION_NS)).toBe(0);
        expect(magnitude(MEMORY_NS)).toBe(2);
        expect(magnitude(L1_NS)).toBeCloseTo(Math.log10(0.5), 10);
        expect(magnitude(SSD_NS)).toBeCloseTo(Math.log10(16_000), 10);
        expect(magnitude(SEEK_NS)).toBeCloseTo(Math.log10(8_000_000), 10);
        expect(magnitude(WAN_NS)).toBeCloseTo(Math.log10(150_000_000), 10);
        expect(() => magnitude(0)).toThrow(/positive/);
        expect(() => magnitude(-5)).toThrow(/positive/);
    });

    it('places the carriage at X0 plus the magnitude times the pitch', () => {
        for (const ns of [L1_NS, MEMORY_NS, SSD_NS, NET_NS, MEM_READ_NS, SEEK_NS, DISK_READ_NS, WAN_NS]) {
            const value = magnitude(ns);
            expect(carriageX(ns)).toBeCloseTo(X0 + value * PITCH, 8);
            expect(xOfMagnitude(value)).toBeCloseTo(carriageX(ns), 8);
            expect(xAtClock(clockOf(ns))).toBeCloseTo(carriageX(ns), 8);
            expect(magnitudeFromClock(clockOf(ns))).toBeCloseTo(value, 10);
        }
        expect(magnitudeFromClock(0)).toBe(CLOCK_SHIFT);
        const gap = carriageX(SEEK_NS) - carriageX(MEMORY_NS);
        expect(gap / PITCH).toBeCloseTo(Math.log10(SEEK_NS / MEMORY_NS), 8);
    });

    it('sorts the learn walk from the L1 fetch out to the US–Europe packet', () => {
        const ids = tour().map((op) => op.id);
        expect(ids).toEqual(['l1', 'memory', 'ssd', 'net', 'memRead', 'seek', 'diskRead', 'wan']);
        const marks = learnMarks();
        expect(marks).toHaveLength(8);
        for (let i = 1; i < marks.length; i += 1) expect(marks[i]).toBeGreaterThan(marks[i - 1]);
        expect(marks[0]).toBeCloseTo(clockOf(L1_NS), 10);
        expect(marks[marks.length - 1]).toBeCloseTo(clockOf(WAN_NS), 10);
    });

    it('puts the disk seek 80,000 times, and about 4.903 orders, past main memory', () => {
        const pair = pairOf('memory', 'seek');
        expect(pair.far.id).toBe('seek');
        expect(pair.near.id).toBe('memory');
        expect(factor(MEMORY_NS, SEEK_NS)).toBe(80_000);
        expect(pair.orders).toBeCloseTo(Math.log10(80_000), 10);
        expect(pair.orders).toBeGreaterThanOrEqual(DOMINANT_ORDERS);
        expect(dominates(pair.orders)).toBe(true);
        expect(formatMagnitude(pair.orders)).toBe('4.903');
        expect(formatFactor(80_000)).toBe('80,000');
        expect(formatNs(SEEK_NS)).toBe('8,000,000 ns');
        expect(formatNs(WAN_NS)).toBe('150,000,000 ns (150 milliseconds)');
    });

    it('puts the 2K send just farther than the SSD constant, under one order', () => {
        const pair = pairOf('ssd', 'net');
        expect(pair.far.id).toBe('net');
        expect(pair.near.id).toBe('ssd');
        expect(factor(SSD_NS, NET_NS)).toBe(1.25);
        expect(pair.orders).toBeCloseTo(Math.log10(1.25), 10);
        expect(dominates(pair.orders)).toBe(false);
        expect(formatMagnitude(pair.orders)).toBe('0.097');
        expect(labMarks('ssd', 'net')[0]).toBeCloseTo(clockOf(SSD_NS), 10);
        expect(labMarks('net', 'ssd')[1]).toBeCloseTo(clockOf(NET_NS), 10);
    });

    it('ranks the packet past the seek, and keeps the sequential disk read in the same order as the seek', () => {
        const packet = pairOf('seek', 'wan');
        expect(packet.far.id).toBe('wan');
        expect(factor(SEEK_NS, WAN_NS)).toBe(18.75);
        expect(dominates(packet.orders)).toBe(true);
        const disk = pairOf('seek', 'diskRead');
        expect(disk.far.id).toBe('diskRead');
        expect(factor(SEEK_NS, DISK_READ_NS)).toBe(2.5);
        expect(dominates(disk.orders)).toBe(false);
        expect(dominates(1)).toBe(true);
        expect(dominates(0.999)).toBe(false);
    });

    it('rejects a pair of the same operation', () => {
        expect(() => pairOf('memory', 'memory')).toThrow(/two different/);
        expect(pairOf('wan', 'l1').far.id).toBe('wan');
    });
});
