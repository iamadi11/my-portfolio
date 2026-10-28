import { describe, expect, it } from 'vitest';

import {
    FLIGHT,
    HOLD_LABEL,
    LEARN_VERSION,
    LOSS,
    LOST,
    SEND,
    VERSION_LABEL,
    VERSIONS,
    endTime,
    events,
    frameAt,
    heldCount,
    lossyLinkFavours,
    settle,
    summary,
    type BodyId,
    type Version,
} from './http-versions-model';

const places = (version: Version, t: number): string[] =>
    frameAt(version, t).bodies.map((body) => body.place);

describe('http version holds', () => {
    it('labels the durations and the lost carrier as the assumed values', () => {
        expect(FLIGHT).toBe(8);
        expect(SEND).toEqual([0, 2, 4]);
        expect(LOSS).toBe(5);
        expect(LOST).toBe(1);
        expect(LEARN_VERSION).toBe('h3');
        expect(LOSS).toBeGreaterThan(SEND[2]);
        expect(LOSS).toBeLessThan(SEND[0] + FLIGHT);
        expect(endTime('h1')).toBe(SEND[0] + FLIGHT);
        expect(endTime('h2')).toBe(LOSS);
        expect(endTime('h3')).toBe(SEND[2] + FLIGHT);
    });

    it.each(VERSIONS)('same inputs and time, same frame (%s)', (version) => {
        expect(frameAt(version, 3)).toEqual(frameAt(version, 3));
        const times = events(version).map((event) => event.t);
        expect(times).toEqual([...times].sort((a, b) => a - b));
        expect(new Set(times).size).toBe(times.length);
        expect(times[0]).toBe(0);
        expect(times).toContain(LOSS);
        expect(times.at(-1)).toBe(endTime(version));
    });

    it('rejects a version that is not a case and a time that is not finite', () => {
        expect(() => frameAt('tcp' as unknown as Version, 0)).toThrow(/version/);
        expect(() => events('both' as unknown as Version)).toThrow(/version/);
        expect(() => heldCount(1 as unknown as Version)).toThrow(/version/);
        expect(() => endTime('h4' as unknown as Version)).toThrow(/version/);
        expect(() => summary('quic' as unknown as Version)).toThrow(/version/);
        expect(() => frameAt('h3', Number.NaN)).toThrow(/finite/);
        expect(() => frameAt('h1', Number.POSITIVE_INFINITY)).toThrow(/finite/);
    });

    it('keeps the three versions identical until the loss', () => {
        const before = LOSS - 0.1;
        const h1 = frameAt('h1', before);
        expect(frameAt('h2', before).bodies).toEqual(h1.bodies);
        expect(frameAt('h3', before).bodies).toEqual(h1.bodies);
        expect(places('h3', before)).toEqual(['wire', 'wire', 'wire']);
        expect(h1.bodies[0]).toMatchObject({ id: 0, along: before / FLIGHT, lost: false });
        expect(h1.bodies[1]).toMatchObject({
            id: 1,
            along: (before - SEND[1]) / FLIGHT,
            lost: true,
        });
        expect(h1.bodies[2]).toMatchObject({
            id: 2,
            along: (before - SEND[2]) / FLIGHT,
            lost: false,
        });
        expect(h1.held).toBe(0);
    });

    it('produces three different holds from the same loss', () => {
        expect(places('h1', LOSS)).toEqual(['wire', 'held', 'held']);
        expect(places('h2', LOSS)).toEqual(['held', 'held', 'held']);
        expect(places('h3', LOSS)).toEqual(['wire', 'held', 'wire']);
        expect(settle('h1')).toEqual({ places: ['delivered', 'held', 'held'], held: 2 });
        expect(settle('h2')).toEqual({ places: ['held', 'held', 'held'], held: 3 });
        expect(settle('h3')).toEqual({ places: ['delivered', 'held', 'delivered'], held: 1 });
        expect(heldCount('h1')).toBe(2);
        expect(heldCount('h2')).toBe(3);
        expect(heldCount('h3')).toBe(1);
        expect(new Set(VERSIONS.map((version) => heldCount(version))).size).toBe(3);
        expect(lossyLinkFavours()).toBe('h3');
        expect(VERSION_LABEL.h1).not.toBe(VERSION_LABEL.h2);
        expect(HOLD_LABEL[1]).not.toBe(HOLD_LABEL[3]);
    });

    it('holds only the middle carrier, and keeps that body held', () => {
        for (const version of VERSIONS) {
            const at = frameAt(version, LOSS);
            expect(at.bodies.filter((body) => body.lost).map((body) => body.id)).toEqual([LOST]);
            expect(at.bodies[LOST]).toMatchObject({
                place: 'held',
                along: (LOSS - SEND[LOST]) / FLIGHT,
                lost: true,
            });
            expect(frameAt(version, endTime(version) + 4).bodies[LOST].place).toBe('held');
            const ahead = frameAt(version, LOSS - 0.5).bodies[LOST];
            expect(ahead.place).toBe('wire');
            expect(ahead.along).toBeCloseTo((LOSS - 0.5 - SEND[LOST]) / FLIGHT);
        }
    });

    it('delivers the earliest HTTP/1.1 body and holds the one after the gap', () => {
        expect(frameAt('h1', 1).bodies[0]).toMatchObject({ place: 'wire', along: 1 / FLIGHT });
        expect(frameAt('h1', LOSS).bodies[0]).toMatchObject({ place: 'wire', along: LOSS / FLIGHT });
        expect(frameAt('h1', endTime('h1')).bodies[0]).toMatchObject({ place: 'delivered', along: 1 });
        for (const t of [LOSS, endTime('h1'), endTime('h1') + 3]) {
            expect(frameAt('h1', t).bodies[2].place).toBe('held');
            expect(frameAt('h1', t).bodies[2].place).not.toBe('delivered');
        }
        expect(frameAt('h1', SEND[2] - 0.25).bodies[2].place).toBe('waiting');
        expect(summary('h1')).toMatch(/Two responses stay held/);
        expect(summary('h1')).toMatch(/delivered/);
    });

    it('holds every HTTP/2 body that was on the connection', () => {
        expect(frameAt('h2', LOSS - 0.25).bodies.map((body) => body.place)).toEqual(['wire', 'wire', 'wire']);
        const held = frameAt('h2', LOSS);
        expect(held.bodies.map((body) => body.place)).toEqual(['held', 'held', 'held']);
        expect(held.bodies[0].along).toBeCloseTo(LOSS / FLIGHT);
        expect(held.bodies[2].along).toBeCloseTo((LOSS - SEND[2]) / FLIGHT);
        expect(frameAt('h2', endTime('h2') + 6).bodies.every((body) => body.place === 'held')).toBe(true);
        expect(summary('h2')).toMatch(/Three responses stay held/);
        expect(summary('h2')).not.toMatch(/delivered/);
    });

    it('delivers the two HTTP/3 bodies that were not in the lost packet', () => {
        expect(frameAt('h3', SEND[2]).bodies[2]).toMatchObject({ place: 'wire', along: 0, lost: false });
        const mid = SEND[2] + FLIGHT / 2;
        expect(frameAt('h3', mid).bodies[2]).toMatchObject({ place: 'wire', along: 0.5 });
        expect(frameAt('h3', mid).bodies[0].place).toBe('delivered');
        expect(frameAt('h3', mid).bodies[1].place).toBe('held');
        expect(frameAt('h3', endTime('h3')).bodies[2]).toMatchObject({ place: 'delivered', along: 1 });
        expect(frameAt('h3', endTime('h3') - 0.25).bodies[2].place).toBe('wire');
        expect(frameAt('h3', endTime('h3')).held).toBe(1);
        expect(summary('h3')).toMatch(/One response stays held/);
        expect(summary('h3')).toMatch(/other two are delivered/);
    });

    it('uses the event place the frame has at that tick', () => {
        for (const version of VERSIONS) {
            for (const event of events(version)) {
                const body = frameAt(version, event.t).bodies.find((item) => item.id === event.id);
                expect(body?.place).toBe(event.place);
            }
        }
        expect(events('h3').map((event) => event.t)).toEqual([
            0,
            2,
            4,
            LOSS,
            SEND[0] + FLIGHT,
            endTime('h3'),
        ]);
        expect(events('h3').map((event) => event.place)).toEqual([
            'wire',
            'wire',
            'wire',
            'held',
            'delivered',
            'delivered',
        ]);
        const loss = events('h2').find((event) => event.t === LOSS);
        expect(loss?.place).toBe('held');
        expect(frameAt('h2', LOSS).held).toBe(3);
        expect(frameAt('h1', LOSS).bodies[0].place).toBe('wire');
        expect(frameAt('h1', LOSS).bodies[2].place).toBe('held');
        expect(events('h1').at(-1)?.said).toMatch(/Two responses stay held/);
        expect(events('h3').at(-1)?.said).toMatch(/One response stays held/);
    });

    it('starts every response waiting before the run', () => {
        for (const version of VERSIONS) {
            const frame = frameAt(version, -1);
            expect(frame.bodies.map((body) => body.place)).toEqual(['waiting', 'waiting', 'waiting']);
            expect(frame.held).toBe(0);
            for (const id of [0, 1, 2] as BodyId[]) {
                expect(frameAt(version, SEND[id] - 0.01).bodies[id].place).toBe('waiting');
                expect(frameAt(version, SEND[id]).bodies[id].place).toBe('wire');
            }
        }
    });
});
