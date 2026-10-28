import { describe, expect, it } from 'vitest';

import {
    BYTES_EACH,
    FALL_AT,
    FALL_DROP,
    FIRST_SETTLE,
    FLIGHT,
    LEARN_LOST,
    RESEND_AFTER,
    SEGMENT_COUNT,
    SEND_EVERY,
    byteRange,
    endTime,
    events,
    frameAt,
    outcomeOf,
    readCount,
    sendTime,
    settle,
} from './tcp-model';

const INPUTS: (number | null)[] = [null, 1, 2, 3, 4, 5];

describe('tcp stream', () => {
    it('uses the assumed counts the page names', () => {
        expect(SEGMENT_COUNT).toBe(5);
        expect(BYTES_EACH).toBe(100);
        expect(SEND_EVERY).toBe(5);
        expect(FLIGHT).toBe(4);
        expect(FALL_AT + FALL_DROP).toBe(FLIGHT);
        expect(FALL_AT / FLIGHT).toBe(0.5);
        expect(RESEND_AFTER).toBe(26);
        expect(LEARN_LOST).toBe(3);
        expect(FIRST_SETTLE).toBe(sendTime(SEGMENT_COUNT) + FLIGHT);
        expect(FIRST_SETTLE).toBeLessThan(RESEND_AFTER);
    });

    it('labels each segment with 100 assumed data bytes, counting from 0', () => {
        expect(byteRange(1)).toEqual([0, 99]);
        expect(byteRange(3)).toEqual([200, 299]);
        expect(byteRange(5)).toEqual([400, 499]);
    });

    it.each(INPUTS)('same inputs and time, same frame (%j)', (lost) => {
        expect(frameAt(lost, 7.5)).toEqual(frameAt(lost, 7.5));
        const times = events(lost).map((event) => event.t);
        expect(times).toEqual([...times].sort((a, b) => a - b));
        expect(new Set(times).size).toBe(times.length);
    });

    it('rejects a segment number outside 1..5', () => {
        expect(() => frameAt(0, 0)).toThrow(/lost/);
        expect(() => frameAt(6, 0)).toThrow(/lost/);
        expect(() => events(1.5)).toThrow(/lost/);
    });

    it('keeps a copy on the wire at along = time in flight / FLIGHT', () => {
        const send = sendTime(2);
        const frame = frameAt(null, send + 1);
        const body = frame.bodies.find((item) => item.segment === 2);
        expect(body).toMatchObject({ place: 'wire', along: 1 / FLIGHT, drop: 0, read: false, copy: 'first' });
        expect(frameAt(null, send - 0.25).bodies.find((item) => item.segment === 2)?.place).toBe('sender');
    });

    it('reads each segment as it arrives when nothing is lost, and never sends twice', () => {
        expect(outcomeOf(null)).toBe('straight');
        expect(settle(null)).toEqual({ readCount: 5, held: [] });
        for (let segment = 1; segment <= SEGMENT_COUNT; segment++) {
            const arrive = sendTime(segment) + FLIGHT;
            expect(readCount(null, arrive)).toBe(segment);
            expect(readCount(null, arrive - 0.25)).toBe(segment - 1);
        }
        expect(frameAt(null, endTime(null)).bodies.every((body) => body.copy === 'first')).toBe(true);
        expect(events(null).some((event) => event.said.includes('sent again'))).toBe(false);
    });

    it('drops the lost copy at halfway and leaves it on the floor', () => {
        const send = sendTime(LEARN_LOST);
        const mid = frameAt(LEARN_LOST, send + FALL_AT + FALL_DROP / 2);
        const falling = mid.bodies.find((body) => body.segment === LEARN_LOST && body.copy === 'first');
        expect(falling).toMatchObject({ place: 'lost', along: 0.5, drop: 0.5, read: false });
        const down = frameAt(LEARN_LOST, send + FLIGHT);
        expect(
            down.bodies.find((body) => body.segment === LEARN_LOST && body.copy === 'first')
        ).toMatchObject({
            place: 'lost',
            drop: 1,
            read: false,
        });
        expect(
            events(LEARN_LOST).some((event) => event.t === send + FLIGHT && event.said.includes('falls'))
        ).toBe(true);
    });

    it('holds bytes past the gap until the same bytes are sent again', () => {
        expect(LEARN_LOST).toBe(3);
        expect(outcomeOf(LEARN_LOST)).toBe('holds');
        expect(settle(LEARN_LOST)).toEqual({ readCount: 2, held: [4, 5] });
        const waiting = frameAt(LEARN_LOST, FIRST_SETTLE);
        expect(waiting.bodies.find((body) => body.segment === 4)).toMatchObject({
            place: 'receiver',
            read: false,
        });
        expect(waiting.bodies.some((body) => body.copy === 'again')).toBe(false);
        expect(waiting.readCount).toBe(2);

        const resend = sendTime(LEARN_LOST) + RESEND_AFTER;
        const leaving = frameAt(LEARN_LOST, resend);
        expect(leaving.bodies.find((body) => body.copy === 'again')).toMatchObject({
            segment: 3,
            place: 'wire',
            along: 0,
            read: false,
        });
        expect(leaving.readCount).toBe(2);

        const done = frameAt(LEARN_LOST, endTime(LEARN_LOST));
        expect(done.readCount).toBe(5);
        expect(done.held).toEqual([]);
        expect(done.bodies.find((body) => body.copy === 'again')).toMatchObject({
            segment: 3,
            place: 'receiver',
            read: true,
        });
        expect(done.bodies.find((body) => body.segment === 3 && body.copy === 'first')?.read).toBe(false);
        expect(events(LEARN_LOST).some((event) => event.said.includes('gap is filled'))).toBe(true);
    });

    it('reads nothing until a lost first segment returns, and holds the other four', () => {
        expect(outcomeOf(1)).toBe('holds');
        expect(settle(1)).toEqual({ readCount: 0, held: [2, 3, 4, 5] });
        expect(frameAt(1, FIRST_SETTLE).bodies.every((body) => body.read === false)).toBe(true);
        expect(frameAt(1, endTime(1)).readCount).toBe(5);
    });

    it('loses the last segment without holding anything past a gap', () => {
        expect(outcomeOf(5)).toBe('tail');
        expect(settle(5)).toEqual({ readCount: 4, held: [] });
        const frame = frameAt(5, FIRST_SETTLE);
        expect(frame.bodies.find((body) => body.segment === 5 && body.copy === 'first')?.place).toBe('lost');
        expect(frame.bodies.filter((body) => body.read).map((body) => body.segment)).toEqual([1, 2, 3, 4]);
    });

    it('never reads a segment while an earlier one is missing', () => {
        for (const lost of INPUTS) {
            let previous = 0;
            for (let t = 0; t <= endTime(lost); t += 0.5) {
                const frame = frameAt(lost, t);
                expect(frame.readCount).toBeGreaterThanOrEqual(previous);
                previous = frame.readCount;
                const read = [
                    ...new Set(frame.bodies.filter((body) => body.read).map((body) => body.segment)),
                ].sort((a, b) => a - b);
                expect(read).toEqual(Array.from({ length: frame.readCount }, (_, index) => index + 1));
                for (const body of frame.bodies) {
                    expect(body.along).toBeGreaterThanOrEqual(0);
                    expect(body.along).toBeLessThanOrEqual(1);
                    expect(body.drop).toBeGreaterThanOrEqual(0);
                    expect(body.drop).toBeLessThanOrEqual(1);
                    if (body.read) expect(body.place).toBe('receiver');
                    if (body.place === 'lost') expect(body.read).toBe(false);
                }
                for (const segment of frame.held) {
                    expect(segment).toBeGreaterThan(frame.readCount);
                    expect(
                        frame.bodies.find((body) => body.segment === segment && body.place === 'receiver')
                            ?.read
                    ).toBe(false);
                }
            }
        }
    });
});
