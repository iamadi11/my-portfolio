import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readContactReceipt, type ContactReceipt } from './delivery';
import type { Payload } from './send';

const sender = vi.hoisted(() => ({
    run: undefined as
        | ((payload: Payload, ctx: { idempotencyKey: string; attempt: number }) => Promise<ContactReceipt>)
        | undefined,
}));
vi.mock('@sweidos/eidos', () => ({
    action: (fn: typeof sender.run) => {
        sender.run = fn;
        return fn;
    },
    initEidos: async () => {},
    eidosQueue: {},
    replayQueue: async () => {},
}));

describe('contact sender records the API outcome for offline replay', () => {
    beforeEach(async () => {
        await import('./send');
        const values = new Map<string, string>();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
        });
    });

    const payload = { name: '', email: 'learner@example.com', message: 'Hello there!', website: '' };
    it('records a rejection even though the action resolves, and forwards the stable key', async () => {
        const fetcher = vi.fn(async () => Response.json({ error: 'Invalid email' }, { status: 422 }));
        vi.stubGlobal('fetch', fetcher);
        const result = await sender.run!(payload, { idempotencyKey: 'replay-reject', attempt: 2 });
        expect(result).toEqual({ ok: false, error: 'Invalid email' });
        expect(readContactReceipt('replay-reject')).toEqual(result);
        expect(fetcher.mock.calls[0]).toEqual([
            '/api/contact',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'replay-reject' },
            }),
        ]);
    });

    it('records server-acknowledged acceptance and duplicate recognition', async () => {
        vi.stubGlobal('fetch', async () => Response.json({ id: 'confirmed', duplicate: true }));
        const result = await sender.run!(payload, { idempotencyKey: 'replay-accept', attempt: 1 });
        expect(result).toEqual({ ok: true, id: 'confirmed', duplicate: true });
        expect(readContactReceipt('replay-accept')).toEqual(result);
    });

    it('leaves transient failures and malformed success responses retryable, never acknowledged', async () => {
        for (const status of [408, 429, 503]) {
            vi.stubGlobal('fetch', async () => Response.json({ error: 'Try later' }, { status }));
            const key = `retry-${status}`;
            await expect(sender.run!(payload, { idempotencyKey: key, attempt: 1 })).rejects.toThrow(
                `HTTP ${status}`
            );
            expect(readContactReceipt(key)).toBeUndefined();
        }
        vi.stubGlobal('fetch', async () => Response.json({}));
        await expect(
            sender.run!(payload, { idempotencyKey: 'malformed-success', attempt: 0 })
        ).rejects.toThrow('Missing contact acknowledgement');
        expect(readContactReceipt('malformed-success')).toBeUndefined();
    });
});
