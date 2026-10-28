import { describe, expect, it } from 'vitest';

import {
    CONTRACT_METHOD,
    CONTRACT_TARGET,
    END,
    MARKS,
    NAMED_ERROR,
    NOT_FOUND,
    SUCCESS_STATUS,
    agrees,
    assignedStatus,
    guessOf,
    judge,
    outcome,
    readout,
} from './api-design-model';

describe('api design contract', () => {
    it('accepts a call only when the method, the target, and the assigned status all agree', () => {
        const got = agrees({ method: 'GET', target: 'item', status: SUCCESS_STATUS });
        expect(got.method).toBe(true);
        expect(got.target).toBe(true);
        expect(got.error).toBe(true);
        expect(got.place).toBe('accepted');
        expect(CONTRACT_METHOD).toBe('GET');
        expect(CONTRACT_TARGET).toBe('item');
    });

    it('the learn call matches the contract and the body is accepted', () => {
        const got = judge('match');
        expect(got.method).toBe('GET');
        expect(got.target).toBe('item');
        expect(got.status).toBe(SUCCESS_STATUS);
        expect(got.status).toBe(200);
        expect(got.matches).toBe(true);
        expect(got.broken).toBe(null);
        expect(got.place).toBe('accepted');
        expect(guessOf('match')).toBe('accepted');
    });

    it('a call that breaks the method is refused with 405, not 200', () => {
        const hoped = agrees({ method: 'POST', target: 'item', status: SUCCESS_STATUS });
        expect(hoped.method).toBe(false);
        expect(hoped.target).toBe(true);
        expect(hoped.error).toBe(false);
        expect(hoped.place).toBe('refused');
        expect(assignedStatus('POST', 'item')).toBe(NAMED_ERROR);

        const got = judge('break');
        expect(got.method).toBe('POST');
        expect(got.target).toBe('item');
        expect(got.status).toBe(405);
        expect(got.status).toBe(NAMED_ERROR);
        expect(got.status).not.toBe(SUCCESS_STATUS);
        expect(got.matches).toBe(false);
        expect(got.broken).toBe('method');
        expect(got.place).toBe('refused');
        expect(guessOf('break')).toBe('refused');
    });

    it('the named error on a disallowed method still leaves the body refused', () => {
        const got = agrees({ method: 'POST', target: 'item', status: NAMED_ERROR });
        expect(got.error).toBe(true);
        expect(got.method).toBe(false);
        expect(got.place).toBe('refused');
    });

    it('a different target is assigned 404 and the body is refused', () => {
        expect(assignedStatus('GET', 'other')).toBe(NOT_FOUND);
        expect(assignedStatus('GET', 'other')).toBe(404);
        const named = agrees({ method: 'GET', target: 'other', status: NOT_FOUND });
        expect(named.method).toBe(true);
        expect(named.target).toBe(false);
        expect(named.error).toBe(true);
        expect(named.place).toBe('refused');
        expect(agrees({ method: 'GET', target: 'other', status: SUCCESS_STATUS }).place).toBe('refused');
    });

    it('claiming 405 for a matching GET breaks the error part and is refused', () => {
        const got = agrees({ method: 'GET', target: 'item', status: NAMED_ERROR });
        expect(got.method).toBe(true);
        expect(got.target).toBe(true);
        expect(got.error).toBe(false);
        expect(got.place).toBe('refused');
        expect(assignedStatus('GET', 'item')).toBe(SUCCESS_STATUS);
    });

    it('200 is assigned only when the body would be accepted', () => {
        const match = judge('match');
        const broken = judge('break');
        expect(match.place).not.toBe(broken.place);
        expect(match.status).toBe(200);
        expect(broken.status).toBe(405);
        expect(match.place === 'accepted').toBe(match.status === 200);
        expect(broken.place === 'accepted').toBe(false);
    });

    it('the same offer always returns the same place', () => {
        expect(judge('match')).toEqual(judge('match'));
        expect(judge('break')).toEqual(judge('break'));
    });

    it('the readout names the place only once the body has arrived', () => {
        const match = judge('match');
        const broken = judge('break');
        expect(MARKS).toEqual([0, 1]);
        expect(END).toBe(1);
        expect(readout(match, 0)).toBe('The body is still with the caller.');
        expect(readout(match, 0)).not.toContain('seated');
        expect(readout(match, 0.5)).toBe('The body is moving.');
        expect(readout(broken, 0.5)).not.toContain('405');
        expect(readout(match, 1)).toContain('The body is seated');
        expect(readout(match, 1)).toContain('accepted');
        expect(readout(match, 1)).toContain('200');
        expect(readout(broken, 1)).toContain('The body is not seated');
        expect(readout(broken, 1)).toContain('refused');
        expect(readout(broken, 1)).toContain('405');
        expect(readout(broken, 1)).toContain('not a success');
        expect(readout(broken, 1)).not.toContain('The body is seated');
    });

    it('the lab result names the offer after the body has a place', () => {
        expect(outcome('match')).toContain('GET on item');
        expect(outcome('match')).toContain('accepted');
        expect(outcome('match')).toContain('200');
        expect(outcome('break')).toContain('POST on item');
        expect(outcome('break')).toContain('refused');
        expect(outcome('break')).toContain('405');
        expect(outcome('break')).toContain('not 200');
        expect(outcome('match')).not.toBe(readout(judge('match'), 1));
    });

    it('rejects a clock value outside the run', () => {
        const match = judge('match');
        expect(() => readout(match, -0.01)).toThrow(/t is from 0 to 1/);
        expect(() => readout(match, 1.01)).toThrow(/t is from 0 to 1/);
    });
});
