import { describe, expect, it } from 'vitest';

import { journalEvent, newJournal } from './mutation-bench';

describe('illustrative mutation journal', () => {
    it('preserves operation identities during an interruption and moves each once on reconnect', () => {
        let state = journalEvent(journalEvent(newJournal(), 'write'), 'write');
        expect(state.pending).toEqual([1, 2]);
        state = journalEvent(state, 'network');
        expect(state.accepted).toEqual([1, 2]);
        expect(state.pending).toEqual([]);
        state = journalEvent(journalEvent(state, 'network'), 'network');
        expect(state.accepted).toEqual([1, 2]);
    });
    it('keeps a bounded ledger, partitions all created writes and resets the demonstration', () => {
        let state = newJournal();
        for (let i = 0; i < 20; i++) {
            state = journalEvent(state, i % 3 === 0 ? 'network' : 'write');
            expect(new Set([...state.pending, ...state.accepted]).size).toBe(state.next - 1);
            expect(state.pending.length + state.accepted.length).toBe(state.next - 1);
            expect(state.next).toBeLessThanOrEqual(7);
        }
        expect(journalEvent(state, 'reset')).toEqual(newJournal());
    });
});
