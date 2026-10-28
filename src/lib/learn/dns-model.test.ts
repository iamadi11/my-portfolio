import { describe, expect, it } from 'vitest';

import { EXAMPLE_ADDRESS, outcomeOf, queriesAt, resolve, type Inputs } from './dns-model';

const cases: Inputs[] = [
    { cached: true, exists: true },
    { cached: true, exists: false },
    { cached: false, exists: true },
    { cached: false, exists: false },
];

describe('dns resolve', () => {
    it.each(cases)('same inputs, same run (%j)', (inputs) => {
        expect(resolve(inputs)).toEqual(resolve(inputs));
    });

    it('a stored answer never visits root, the TLD, or the authoritative server', () => {
        for (const exists of [true, false]) {
            const run = resolve({ cached: true, exists });
            expect(run.queries).toBe(0);
            expect(run.address).toBe(EXAMPLE_ADDRESS);
            expect(run.visits).toEqual(['client', 'resolver']);
            expect(run.steps.map((s) => s.at)).not.toContain('root');
            expect(outcomeOf(run)).toBe('stored');
        }
    });

    it('a miss asks root, then the TLD, then the authoritative server, and returns the address', () => {
        const run = resolve({ cached: false, exists: true });
        expect(run.queries).toBe(3);
        expect(run.steps.map((s) => s.at)).toEqual(['client', 'resolver', 'root', 'tld', 'auth', 'client']);
        expect(run.address).toBe(EXAMPLE_ADDRESS);
        expect(outcomeOf(run)).toBe('walk');
        expect(queriesAt(run, 0)).toBe(0);
        expect(queriesAt(run, run.steps.length - 1)).toBe(3);
    });

    it('a miss for a missing name still asks all three, then returns no address', () => {
        const run = resolve({ cached: false, exists: false });
        expect(run.queries).toBe(3);
        expect(run.address).toBeNull();
        expect(run.steps.at(-1)?.kind).toBe('name-error');
        expect(run.steps.find((s) => s.at === 'auth')?.kind).toBe('name-error');
        expect(outcomeOf(run)).toBe('missing');
    });

    it('the walk order is root before the TLD before the authoritative server', () => {
        const at = resolve({ cached: false, exists: true }).steps.map((s) => s.at);
        expect(at.indexOf('root')).toBeLessThan(at.indexOf('tld'));
        expect(at.indexOf('tld')).toBeLessThan(at.indexOf('auth'));
    });
});
