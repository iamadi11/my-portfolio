import { describe, expect, it } from 'vitest';

import {
    FLIGHT,
    GAP,
    LEARN_MODE,
    LOSS,
    LOST_STREAM,
    MODE_LABEL,
    OUTCOME_LABEL,
    endTime,
    events,
    frameAt,
    outcomeOf,
    settle,
    summary,
    type Mode,
} from './udp-quic-model';

const MODES: Mode[] = ['byte', 'perStream'];

describe('udp-quic streams', () => {
    it('labels the durations and the lost packet as the assumed values', () => {
        expect(FLIGHT).toBe(6);
        expect(GAP).toBe(4);
        expect(LOSS).toBe(2);
        expect(LOST_STREAM).toBe(0);
        expect(LEARN_MODE).toBe('perStream');
        expect(LOSS).toBeLessThan(FLIGHT);
        expect(LOSS).toBeLessThan(GAP);
        expect(endTime()).toBe(GAP + FLIGHT);
    });

    it.each(MODES)('same inputs and time, same frame (%s)', (mode) => {
        expect(frameAt(mode, 5)).toEqual(frameAt(mode, 5));
        const times = events(mode).map((event) => event.t);
        expect(times).toEqual([...times].sort((a, b) => a - b));
        expect(new Set(times).size).toBe(times.length);
        expect(times).toEqual([0, LOSS, GAP, endTime()]);
    });

    it('rejects a mode that is not a case and a time that is not finite', () => {
        expect(() => frameAt('tcp' as unknown as Mode, 0)).toThrow(/mode/);
        expect(() => events('both' as unknown as Mode)).toThrow(/mode/);
        expect(() => outcomeOf(1 as unknown as Mode)).toThrow(/mode/);
        expect(() => frameAt('byte', Number.NaN)).toThrow(/finite/);
        expect(() => frameAt('perStream', Number.POSITIVE_INFINITY)).toThrow(/finite/);
    });

    it('loses only the earlier stream, and holds it from the loss tick', () => {
        for (const mode of MODES) {
            const before = frameAt(mode, LOSS - 0.5).bodies[0];
            expect(before).toMatchObject({
                stream: 0,
                place: 'wire',
                along: (LOSS - 0.5) / FLIGHT,
                lost: true,
            });
            const at = frameAt(mode, LOSS).bodies[0];
            expect(at).toMatchObject({ stream: 0, place: 'held', along: LOSS / FLIGHT, lost: true });
            expect(frameAt(mode, endTime()).bodies[0].place).toBe('held');
            expect(frameAt(mode, endTime()).bodies[1].lost).toBe(false);
            expect(frameAt(mode, endTime()).bodies[1].stream).toBe(1);
        }
    });

    it('holds the later body on one byte stream and delivers it on a stream each', () => {
        const byte = settle('byte');
        const each = settle('perStream');
        expect(byte).toEqual({ earlier: 'held', later: 'held', laterStalls: true, outcome: 'stalls' });
        expect(each).toEqual({
            earlier: 'held',
            later: 'delivered',
            laterStalls: false,
            outcome: 'passes',
        });
        expect(outcomeOf('byte')).toBe('stalls');
        expect(outcomeOf('perStream')).toBe('passes');
        expect(MODE_LABEL.byte).not.toBe(MODE_LABEL.perStream);
        expect(OUTCOME_LABEL.stalls).not.toBe(OUTCOME_LABEL.passes);
    });

    it('never puts the later byte-stream body on the wire', () => {
        const samples = [0, GAP - 0.25, GAP, GAP + FLIGHT / 2, endTime(), endTime() + 3];
        for (const t of samples) {
            const later = frameAt('byte', t).bodies[1];
            expect(later.place).not.toBe('wire');
            expect(later.place).not.toBe('delivered');
            if (t + 1e-9 >= GAP) expect(later.place).toBe('held');
            else expect(later.place).toBe('sender');
        }
    });

    it('keeps the later per-stream body on the shared path until it is delivered', () => {
        expect(frameAt('perStream', GAP - 0.25).bodies[1].place).toBe('sender');
        const depart = frameAt('perStream', GAP).bodies[1];
        expect(depart).toMatchObject({ stream: 1, place: 'wire', along: 0, lost: false });
        const mid = GAP + FLIGHT / 2;
        expect(frameAt('perStream', mid).bodies[1]).toMatchObject({
            place: 'wire',
            along: 0.5,
            stream: 1,
        });
        expect(frameAt('perStream', mid).bodies[0].place).toBe('held');
        expect(frameAt('perStream', endTime() - 0.25).bodies[1].place).toBe('wire');
        expect(frameAt('perStream', endTime()).bodies[1]).toMatchObject({
            place: 'delivered',
            along: 1,
            stream: 1,
        });
        expect(frameAt('perStream', endTime()).laterStalls).toBe(false);
        expect(frameAt('byte', mid).laterStalls).toBe(true);
    });

    it('uses the event place the frame has at that tick', () => {
        for (const mode of MODES) {
            for (const event of events(mode)) {
                const body = frameAt(mode, event.t).bodies.find((item) => item.stream === event.stream);
                expect(body?.place).toBe(event.place);
            }
        }
        expect(events('byte').map((event) => event.said)).toEqual([
            'The earlier stream is on the wire.',
            'The earlier packet is lost. That stream is held.',
            'The later stream is held.',
            'The later stream is still held.',
        ]);
        expect(events('perStream').map((event) => event.place)).toEqual([
            'wire',
            'held',
            'wire',
            'delivered',
        ]);
        expect(summary('byte')).toMatch(/held/);
        expect(summary('byte')).not.toMatch(/delivered/);
        expect(summary('perStream')).toMatch(/delivered/);
        expect(summary('perStream')).toMatch(/earlier stream/);
    });

    it('starts both bodies at the sender before the run', () => {
        for (const mode of MODES) {
            const frame = frameAt(mode, -1);
            expect(frame.bodies.map((body) => body.place)).toEqual(['sender', 'sender']);
            expect(frame.laterStalls).toBe(false);
        }
    });
});
