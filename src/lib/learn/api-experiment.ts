export type ApiLessonId = 'rest' | 'rpc' | 'graphql' | 'realtime';
export type ExperimentResult = {
    answer: string;
    reason: string;
    value: string;
    count: number;
    failed: boolean;
};
/** Deliberately small semantic models; these make no real network requests. */
export function experiment(id: ApiLessonId, variant: string, amount: number): ExperimentResult {
    const n = Math.max(1, Math.min(5, Math.floor(Number.isFinite(amount) ? amount : 1)));
    switch (id) {
        case 'rest': {
            const post = variant === 'POST';
            return {
                answer: post && n > 1 ? 'Several notes' : 'One note',
                reason: post
                    ? 'In this API, each POST creates a note. Repeating creation can produce duplicates.'
                    : 'Repeated PUT to /notes/7 replaces the same resource. The intended final state is one note.',
                value: post ? `${n} notes created` : '1 note replaced',
                count: post ? n : 1,
                failed: false,
            };
        }
        case 'rpc': {
            const expired = n > Number(variant);
            return {
                answer: expired ? 'Deadline exceeded' : 'Response received',
                reason: expired
                    ? 'The assumed service time exceeds the deadline. The caller stops waiting; server work may already have happened.'
                    : 'In this teaching run the reply arrives within the deadline. Real calls can still fail for other reasons.',
                value: expired ? 'deadline exceeded' : 'Stock { count: 3 }',
                count: expired ? 0 : 3,
                failed: expired,
            };
        }
        case 'graphql': {
            const nested = variant === 'nested';
            return {
                answer: nested ? 'Name and posts' : 'Name only',
                reason: nested
                    ? 'The selected nested fields appear in the result. This naive resolver performs a separate post lookup per user; batching can change that.'
                    : 'The result contains only the selected name field. It does not automatically return every schema field.',
                value: nested ? `name + ${n} post lookups` : 'name only',
                count: nested ? n : 1,
                failed: false,
            };
        }
        case 'realtime': {
            const both = variant === 'both';
            return {
                answer: both ? 'WebSocket' : 'SSE',
                reason: both
                    ? 'This exercise needs messages in both directions on one open connection. WebSocket fits that requirement.'
                    : 'For a server-to-browser event feed, SSE is a suitable option. It is not the only possible design.',
                value: both ? 'client ↔ server' : 'server → client',
                count: 1,
                failed: false,
            };
        }
    }
    throw new Error(`Unknown API lesson: ${id}`);
}
