import { describe, expect, it } from 'vitest';

import {
    ARRIVAL_LABEL,
    HOP,
    LEARN_TRIP,
    MODEL_STOPS_UNSOLICITED,
    NAT_ADDRESS,
    OUTSIDE_ADDRESS,
    PRIVATE_ADDRESS,
    PUBLIC_ADDRESS,
    TRIPS,
    arrivalOf,
    endTime,
    events,
    frameAt,
    type Trip,
} from './cloud-networking-model';

describe('cloud networking', () => {
    it('uses documentation addresses and one RFC 1918 address, and an assumed hop', () => {
        expect(HOP).toBe(4);
        expect(LEARN_TRIP).toBe('private');
        expect(MODEL_STOPS_UNSOLICITED).toBe(true);
        expect(OUTSIDE_ADDRESS).toBe('203.0.113.5');
        expect(PUBLIC_ADDRESS).toBe('192.0.2.10');
        expect(PRIVATE_ADDRESS).toBe('192.168.2.10');
        expect(NAT_ADDRESS).toBe('198.51.100.10');
        expect(endTime('public')).toBe(HOP);
        expect(endTime('private')).toBe(HOP);
        expect(endTime('nat')).toBe(4 * HOP);
    });

    it('gives the same frame for the same trip and time', () => {
        for (const trip of TRIPS) {
            expect(frameAt(trip, HOP / 2)).toEqual(frameAt(trip, HOP / 2));
            const times = events(trip).map((event) => event.t);
            expect(times).toEqual([...times].sort((a, b) => a - b));
            expect(new Set(times).size).toBe(times.length);
        }
    });

    it('rejects a trip that is not one of the three, and a time that is not finite', () => {
        expect(() => frameAt('east' as unknown as Trip, 0)).toThrow(/trip/);
        expect(() => events('east' as unknown as Trip)).toThrow(/trip/);
        expect(() => arrivalOf(1 as unknown as Trip)).toThrow(/trip/);
        expect(() => frameAt('public', Number.NaN)).toThrow(/finite/);
        expect(() => frameAt('private', Number.POSITIVE_INFINITY)).toThrow(/finite/);
    });

    it('lets an outside body reach the public machine and stops the same kind of body at the boundary', () => {
        expect(arrivalOf('public')).toBe('arrives');
        expect(arrivalOf('private')).toBe('stops');
        expect(frameAt('public', 0)).toMatchObject({
            place: 'outside',
            from: 'outside',
            along: 0,
            arrived: false,
        });
        expect(frameAt('private', 0)).toMatchObject({
            place: 'outside',
            from: 'outside',
            along: 0,
            arrived: false,
        });
        expect(frameAt('public', HOP / 2)).toMatchObject({
            place: 'public subnet',
            from: 'outside',
            along: 0.5,
            arrived: false,
        });
        expect(frameAt('private', HOP / 2)).toMatchObject({
            place: 'stopped at the boundary',
            from: 'outside',
            along: 0.5,
            arrived: false,
        });
        expect(frameAt('public', HOP)).toMatchObject({
            place: 'public subnet',
            from: 'public subnet',
            along: 1,
            arrived: true,
        });
        expect(frameAt('private', HOP)).toMatchObject({
            place: 'stopped at the boundary',
            from: 'stopped at the boundary',
            along: 1,
            arrived: false,
        });
        for (let step = 0; step <= HOP; step += 0.5) {
            const frame = frameAt('private', step);
            expect(frame.place === 'outside' || frame.place === 'stopped at the boundary').toBe(true);
            expect(frame.place).not.toBe('private subnet');
            expect(frame.place).not.toBe('through the NAT');
            expect(frame.arrived).toBe(false);
        }
        expect(events('private').map((event) => event.place)).toEqual(['outside', 'stopped at the boundary']);
        expect(events('private').at(-1)?.said).toContain('stopped at the boundary');
        expect(events('private').at(-1)?.said).toContain('does not arrive');
        expect(events('private').at(-1)?.said).toContain(PRIVATE_ADDRESS);
        expect(events('public').at(-1)?.said).toContain(PUBLIC_ADDRESS);
    });

    it('takes the private machine out through one NAT door and brings the reply back through it', () => {
        expect(arrivalOf('nat')).toBe('arrives');
        expect(events('nat').map((event) => [event.t, event.place])).toEqual([
            [0, 'private subnet'],
            [HOP, 'through the NAT'],
            [2 * HOP, 'outside'],
            [3 * HOP, 'through the NAT'],
            [4 * HOP, 'private subnet'],
        ]);
        expect(events('nat').filter((event) => event.place === 'through the NAT')).toHaveLength(2);
        expect(frameAt('nat', HOP / 2)).toMatchObject({
            place: 'through the NAT',
            from: 'private subnet',
            along: 0.5,
            arrived: false,
        });
        expect(frameAt('nat', 2 * HOP + HOP / 2)).toMatchObject({
            place: 'through the NAT',
            from: 'outside',
            along: 0.5,
            arrived: false,
        });
        expect(frameAt('nat', 4 * HOP)).toMatchObject({
            place: 'private subnet',
            from: 'private subnet',
            along: 1,
            arrived: true,
        });
        expect(events('nat')[1]?.said).toContain(NAT_ADDRESS);
        expect(events('nat').at(-1)?.said).toContain('same door');
        expect(frameAt('nat', 0).arrived).toBe(false);
        for (const event of events('nat')) {
            expect(frameAt('nat', event.t).place).toBe(event.place);
        }
    });

    it('clamps time and keeps every event on the frame at that tick', () => {
        expect(frameAt('public', -4)).toMatchObject({ t: 0, place: 'outside', arrived: false });
        expect(frameAt('public', 100)).toEqual(frameAt('public', endTime('public')));
        expect(frameAt('private', 100).place).toBe('stopped at the boundary');
        expect(frameAt('private', 100).arrived).toBe(false);
        for (const trip of TRIPS) {
            for (const event of events(trip)) {
                expect(frameAt(trip, event.t).place).toBe(event.place);
            }
        }
        expect(ARRIVAL_LABEL.arrives).toBe('It arrives');
        expect(ARRIVAL_LABEL.stops).toBe('It stops short');
    });
});
