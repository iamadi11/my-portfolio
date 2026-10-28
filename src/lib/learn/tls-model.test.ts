import { describe, expect, it } from 'vitest';

import {
    FLIGHT,
    LEARN_CHECKS,
    ORDER,
    PLAINTEXT,
    REST,
    arriveTime,
    departTime,
    endTime,
    events,
    frameAt,
    outcomeOf,
    settle,
    wireHidesPlaintext,
} from './tls-model';

describe('tls handshake', () => {
    it('labels every duration as the assumed ticks the page names', () => {
        expect(FLIGHT).toBe(4);
        expect(REST).toBe(2);
        expect(LEARN_CHECKS).toBe(true);
        expect(departTime('clientHello')).toBe(0);
        expect(departTime('serverHello')).toBe(FLIGHT + REST);
        expect(departTime('finished')).toBe(2 * (FLIGHT + REST));
        expect(departTime('application')).toBe(3 * (FLIGHT + REST));
        expect(arriveTime('application')).toBe(endTime());
        expect(endTime()).toBe(3 * (FLIGHT + REST) + FLIGHT);
    });

    it.each([true, false])('same inputs and time, same frame (checkName %s)', (checkName) => {
        expect(frameAt(checkName, 9)).toEqual(frameAt(checkName, 9));
        const times = events(checkName).map((event) => event.t);
        expect(times).toEqual([...times].sort((a, b) => a - b));
        expect(new Set(times).size).toBe(times.length);
    });

    it('rejects a check that is not a boolean and a time that is not finite', () => {
        expect(() => frameAt('yes' as unknown as boolean, 0)).toThrow(/checkName/);
        expect(() => events(1 as unknown as boolean)).toThrow(/checkName/);
        expect(() => frameAt(true, Number.NaN)).toThrow(/finite/);
    });

    it('sends client hello, server hello, finished, then the application body', () => {
        const kinds = events(true).map((event) => `${event.step}:${event.kind}`);
        expect(kinds).toEqual([
            'clientHello:leave',
            'clientHello:arrive',
            'serverHello:leave',
            'serverHello:arrive',
            'finished:leave',
            'finished:arrive',
            'application:leave',
            'application:arrive',
        ]);
        expect(events(false).map((event) => [event.t, event.step, event.kind])).toEqual(
            events(true).map((event) => [event.t, event.step, event.kind])
        );
        const finishedArrive = arriveTime('finished');
        const applicationLeave = departTime('application');
        expect(applicationLeave).toBeGreaterThan(finishedArrive);
        expect(frameAt(true, finishedArrive - 0.25).body.step).toBe('finished');
        expect(frameAt(true, finishedArrive - 0.25).handshakeDone).toBe(false);
        expect(frameAt(true, finishedArrive).handshakeDone).toBe(true);
        expect(frameAt(true, finishedArrive).body.step).toBe('finished');
        expect(frameAt(true, applicationLeave).body.step).toBe('application');
    });

    it('keeps a body on the wire at along = time in flight / FLIGHT', () => {
        const send = departTime('serverHello');
        expect(frameAt(true, send + 1).body).toMatchObject({
            step: 'serverHello',
            from: 'server',
            place: 'wire',
            along: 1 / FLIGHT,
            sealed: false,
            wire: 'serverHello',
            plaintextInside: false,
        });
        expect(frameAt(true, send - 0.25).body).toMatchObject({
            step: 'clientHello',
            place: 'receiver',
            along: 1,
            sealed: false,
        });
    });

    it('reads each handshake body as a step and does not seal it', () => {
        for (const step of ORDER) {
            if (step === 'application') continue;
            const frame = frameAt(true, arriveTime(step));
            expect(frame.body).toMatchObject({
                step,
                place: 'receiver',
                sealed: false,
                wire: step,
                plaintextInside: false,
            });
            expect(frame.read).toContain(step);
        }
        expect(frameAt(true, arriveTime('finished')).read).toEqual([
            'clientHello',
            'serverHello',
            'finished',
        ]);
    });

    it('sealed means the wire body is not the plaintext', () => {
        expect(PLAINTEXT).toBe('application byte');
        for (const checkName of [true, false]) {
            for (let t = -1; t <= endTime(); t += 0.5) {
                const body = frameAt(checkName, t).body;
                expect(wireHidesPlaintext(body)).toBe(true);
                expect(body.wire).not.toBe(PLAINTEXT);
                if (body.sealed) {
                    expect(body.step).toBe('application');
                    expect(body.wire).toBe('sealed');
                    expect(body.place === 'receiver').toBe(body.plaintextInside);
                } else {
                    expect(body.wire).toBe(body.step);
                    expect(body.plaintextInside).toBe(false);
                }
            }
        }
        const midway = frameAt(true, departTime('application') + FLIGHT / 2).body;
        expect(midway).toMatchObject({
            place: 'wire',
            along: 0.5,
            sealed: true,
            wire: 'sealed',
            plaintextInside: false,
        });
        const inside = frameAt(false, endTime()).body;
        expect(inside).toMatchObject({
            place: 'receiver',
            along: 1,
            sealed: true,
            wire: 'sealed',
            plaintextInside: true,
        });
    });

    it('still delivers the sealed body when the name check is skipped', () => {
        expect(outcomeOf(true)).toBe('checked');
        expect(outcomeOf(false)).toBe('unchecked');
        expect(settle(true)).toEqual({
            sealedArrived: true,
            plaintextInside: true,
            nameChecked: true,
            outcome: 'checked',
        });
        expect(settle(false)).toEqual({
            sealedArrived: true,
            plaintextInside: true,
            nameChecked: false,
            outcome: 'unchecked',
        });
        const serverArrives = arriveTime('serverHello');
        expect(frameAt(true, serverArrives - 0.25).nameChecked).toBe(false);
        expect(frameAt(true, serverArrives).nameChecked).toBe(true);
        for (let t = 0; t <= endTime(); t += 0.5) {
            expect(frameAt(false, t).body).toEqual(frameAt(true, t).body);
            expect(frameAt(false, t).handshakeDone).toBe(frameAt(true, t).handshakeDone);
            expect(frameAt(false, t).nameChecked).toBe(false);
        }
        const skipped = events(false).find(
            (event) => event.step === 'application' && event.kind === 'arrive'
        );
        const checked = events(true).find((event) => event.step === 'application' && event.kind === 'arrive');
        expect(skipped?.said).toContain('The name was not checked.');
        expect(checked?.said).toContain('The name was checked.');
        expect(checked?.said).not.toContain('not checked');
    });
});
