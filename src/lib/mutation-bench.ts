/** Illustrative in-memory journal. No network, browser persistence or production guarantee. */
export type Journal = { online: boolean; next: number; pending: number[]; accepted: number[] };
export const newJournal = (): Journal => ({ online: false, next: 1, pending: [], accepted: [] });
export function journalEvent(state: Journal, action: 'write' | 'network' | 'reset'): Journal {
    if (action === 'reset') return newJournal();
    if (action === 'network')
        return state.online
            ? { ...state, online: false }
            : { ...state, online: true, pending: [], accepted: [...state.accepted, ...state.pending] };
    if (state.next > 6) return state;
    return {
        ...state,
        next: state.next + 1,
        pending: state.online ? state.pending : [...state.pending, state.next],
        accepted: state.online ? [...state.accepted, state.next] : state.accepted,
    };
}
