import { beforeEach, describe, expect, it, vi } from 'vitest';

import { contactDelivery, readContactReceipt, recordContactReceipt } from './delivery';

describe('contact replay acknowledgement', () => {
    beforeEach(() => {
        const values = new Map<string, string>();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
        });
    });

    it('does not treat a resolved action or a disappearing queue item as API acceptance', () => {
        for (const status of ['succeeded', 'failed'] as const)
            expect(
                contactDelivery(
                    [{ actionName: 'contactMessage', idempotencyKey: 'k', status }],
                    'k',
                    undefined
                )
            ).toEqual({ s: 'unconfirmed', key: 'k' });
        expect(contactDelivery([], 'k', undefined)).toEqual({ s: 'unconfirmed', key: 'k' });
    });

    it('preserves a terminal rejection after Eidos has removed the item', () => {
        recordContactReceipt('rejected-key', { ok: false, error: 'Invalid email' });
        expect(contactDelivery([], 'rejected-key', readContactReceipt('rejected-key'))).toEqual({
            s: 'rejected',
            error: 'Invalid email',
        });
    });

    it('requires the matching key and actual acceptance before announcing stored delivery', () => {
        recordContactReceipt('accepted-key', { ok: true, id: 'server-id', duplicate: true });
        expect(contactDelivery([], 'accepted-key', readContactReceipt('accepted-key'))).toEqual({
            s: 'delivered',
            key: 'accepted-key',
            id: 'server-id',
            duplicate: true,
        });
        expect(contactDelivery([], 'another-key', readContactReceipt('another-key')).s).toBe('unconfirmed');
        expect(
            contactDelivery(
                [{ actionName: 'otherAction', idempotencyKey: 'k', status: 'pending' }],
                'k',
                undefined
            ).s
        ).toBe('unconfirmed');
    });

    it('reports pending/replaying accurately and bounds saved receipts without message content', () => {
        for (const [status, state] of [
            ['pending', 'queued'],
            ['replaying', 'sending'],
        ] as const)
            expect(
                contactDelivery(
                    [{ actionName: 'contactMessage', idempotencyKey: 'k', status }],
                    'k',
                    undefined
                ).s
            ).toBe(state);
        for (let i = 0; i < 20; i++) recordContactReceipt(`bounded-${i}`, { ok: true, id: `id-${i}` });
        const saved = JSON.parse(localStorage.getItem('bp-contact-receipts')!);
        expect(saved).toHaveLength(12);
        expect(saved[0][0]).toBe('bounded-8');
        expect(Object.keys(saved[0][1])).toEqual(['ok', 'id']);
    });

    it('retains observed outcomes in memory if storage is unavailable or corrupt', () => {
        vi.stubGlobal('localStorage', {
            getItem: () => {
                throw Error('blocked');
            },
            setItem: () => {
                throw Error('blocked');
            },
        });
        recordContactReceipt('memory-only-key', { ok: true, id: 'memory-id' });
        expect(readContactReceipt('memory-only-key')).toEqual({ ok: true, id: 'memory-id' });
        vi.stubGlobal('localStorage', { getItem: () => '{broken' });
        expect(readContactReceipt('unknown')).toBeUndefined();
    });
});
