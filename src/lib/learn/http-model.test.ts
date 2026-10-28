import { describe, expect, it } from 'vitest';

import {
    APPLY_AT,
    LEARN_EXISTS,
    LEARN_METHOD,
    METHODS,
    RESPONSE_AT,
    apply,
    endTime,
    events,
    finishedPlate,
    frameAt,
    outcomeOf,
    summary,
    type Method,
} from './http-model';

const CASES: [Method, boolean][] = METHODS.flatMap((method) => [
    [method, true] as [Method, boolean],
    [method, false] as [Method, boolean],
]);

describe('http exchange', () => {
    it('plays a GET that finds the representation', () => {
        expect(LEARN_METHOD).toBe('GET');
        expect(LEARN_EXISTS).toBe(true);
        expect(apply(LEARN_METHOD, LEARN_EXISTS)).toEqual({
            status: 200,
            changed: false,
            stored: true,
            action: 'retrieve',
            plate: 'original',
        });
    });

    it('retrieves with GET, replaces with PUT, and processes with POST', () => {
        expect(apply('GET', true)).toMatchObject({
            status: 200,
            changed: false,
            stored: true,
            action: 'retrieve',
        });
        expect(apply('GET', false)).toMatchObject({
            status: 404,
            changed: false,
            stored: false,
            action: 'missing',
        });
        expect(apply('PUT', true)).toMatchObject({
            status: 200,
            changed: true,
            stored: true,
            action: 'replace',
        });
        expect(apply('PUT', false)).toMatchObject({
            status: 201,
            changed: true,
            stored: true,
            action: 'create',
        });
        expect(apply('POST', true)).toMatchObject({
            status: 200,
            changed: true,
            stored: true,
            action: 'process',
        });
        expect(apply('POST', false)).toMatchObject({
            status: 201,
            changed: true,
            stored: true,
            action: 'create',
        });
    });

    it('keeps a safe method from changing the stored representation', () => {
        for (const exists of [true, false]) {
            const result = apply('GET', exists);
            expect(result.changed).toBe(false);
            expect(result.stored).toBe(exists);
            expect(frameAt('GET', exists, RESPONSE_AT).plate).toBe(exists ? 'original' : 'empty');
        }
    });

    it('uses 404 only when GET finds nothing, and 201 only when something is created', () => {
        expect(apply('GET', false).status).toBe(404);
        expect(apply('PUT', false).status).toBe(201);
        expect(apply('POST', false).status).toBe(201);
        for (const method of METHODS) {
            expect(apply(method, true).status).toBe(200);
            expect(apply(method, true).status).not.toBe(404);
        }
    });

    it('puts the enclosed representation in the slot for PUT, and this resource’s processing for POST', () => {
        expect(finishedPlate('PUT', true)).toBe('replaced');
        expect(finishedPlate('PUT', false)).toBe('replaced');
        expect(finishedPlate('POST', true)).toBe('processed');
        expect(finishedPlate('POST', false)).toBe('processed');
        expect(finishedPlate('GET', true)).toBe('original');
        expect(finishedPlate('GET', false)).toBe('empty');
    });

    it.each(CASES)('same inputs and time, same frame (%s, exists=%s)', (method, exists) => {
        expect(frameAt(method, exists, 0.5)).toEqual(frameAt(method, exists, 0.5));
        const times = events(method, exists).map((event) => event.t);
        expect(times).toEqual([0, APPLY_AT, RESPONSE_AT]);
        expect(endTime()).toBe(RESPONSE_AT);
        expect(outcomeOf(method, exists)).toBe(
            `${method.toLowerCase()}-${apply(method, exists).status}` as ReturnType<typeof outcomeOf>
        );
    });

    it('keeps the message at the client, then the server, then the client', () => {
        const early = frameAt('PUT', false, APPLY_AT - 0.25);
        expect(early).toMatchObject({
            place: 'client',
            role: 'request',
            status: null,
            changed: false,
            stored: false,
            action: null,
            plate: 'empty',
        });
        const atServer = frameAt('PUT', false, APPLY_AT);
        expect(atServer).toMatchObject({
            place: 'server',
            role: 'request',
            status: 201,
            changed: true,
            stored: true,
            plate: 'replaced',
        });
        const back = frameAt('PUT', false, RESPONSE_AT);
        expect(back).toMatchObject({
            place: 'client',
            role: 'response',
            status: 201,
            changed: true,
            stored: true,
        });
        expect(frameAt('GET', true, 0).plate).toBe('original');
        expect(frameAt('GET', true, APPLY_AT).changed).toBe(false);
    });

    it('states the receiver’s action in the server stop and the summary', () => {
        expect(events('GET', true)[1].said).toContain('GET retrieves');
        expect(events('GET', true)[1].said).toContain('200');
        expect(events('GET', false)[1].said).toContain('404');
        expect(events('PUT', true)[1].said).toContain('replaces');
        expect(events('PUT', false)[2].said).toContain('201');
        expect(events('POST', true)[1].said).toContain('process');
        expect(events('POST', false)[1].said).toContain('201');
        expect(summary('GET', true)).toContain('did not change');
        expect(summary('POST', false)).toContain('201');
        expect(summary('PUT', true)).toContain('replaced');
        for (const [method, exists] of CASES) {
            const said = events(method, exists)
                .map((event) => event.said)
                .join(' ');
            expect(said).toContain('header fields');
            expect(said).not.toMatch(/Example-Field|X-Custom|Cookie|Authorization/);
            expect(summary(method, exists)).toContain(String(apply(method, exists).status));
        }
    });

    it('rejects a method or a target flag outside the model', () => {
        expect(() => apply('HEAD' as Method, true)).toThrow(/method/);
        expect(() => apply('GET', 'yes' as unknown as boolean)).toThrow(/exists/);
        expect(() => frameAt('TRACE' as Method, false, 0)).toThrow(/method/);
    });
});
