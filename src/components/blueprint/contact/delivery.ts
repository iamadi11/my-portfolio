/** Eidos queue status describes execution, not whether the contact API accepted a message. */
export type ContactReceipt = { ok: true; id: string; duplicate?: boolean } | { ok: false; error: string };

export type ContactState =
    | { s: 'idle' }
    | { s: 'sending'; key?: string }
    | { s: 'queued'; key: string }
    | { s: 'delivered'; key?: string; id: string; duplicate?: boolean }
    | { s: 'rejected'; error: string }
    | { s: 'unconfirmed'; key?: string };

type QueueItem = {
    actionName: string;
    idempotencyKey: string;
    status: 'pending' | 'replaying' | 'succeeded' | 'failed';
};

const RECEIPTS = 'bp-contact-receipts';
const memory = new Map<string, ContactReceipt>();

function isReceipt(value: unknown): value is ContactReceipt {
    if (!value || typeof value !== 'object') return false;
    const receipt = value as Record<string, unknown>;
    return receipt.ok === true
        ? typeof receipt.id === 'string' && receipt.id.length > 0
        : receipt.ok === false && typeof receipt.error === 'string';
}

/** Store only the last 12 outcomes, never message text/email. Memory still works when storage is denied. */
export function recordContactReceipt(key: string, receipt: ContactReceipt): void {
    memory.set(key, receipt);
    while (memory.size > 12) memory.delete(memory.keys().next().value!);
    try {
        const saved = JSON.parse(localStorage.getItem(RECEIPTS) ?? '[]') as unknown;
        const entries = Array.isArray(saved)
            ? saved.filter(
                  (entry): entry is [string, ContactReceipt] =>
                      Array.isArray(entry) && typeof entry[0] === 'string' && isReceipt(entry[1])
              )
            : [];
        localStorage.setItem(
            RECEIPTS,
            JSON.stringify([...entries.filter(([id]) => id !== key), [key, receipt]].slice(-12))
        );
    } catch {
        /* An observed response remains available in this tab. */
    }
}

export function readContactReceipt(key: string): ContactReceipt | undefined {
    try {
        const saved = JSON.parse(localStorage.getItem(RECEIPTS) ?? '[]') as unknown;
        if (Array.isArray(saved)) {
            const entry = saved.find((item) => Array.isArray(item) && item[0] === key);
            if (entry && isReceipt(entry[1])) return entry[1];
        }
    } catch {
        /* Use the current tab's observed response if storage is unavailable. */
    }
    return memory.get(key);
}

/** Missing/finished queue entries alone are never evidence of delivery. */
export function contactDelivery(
    items: readonly QueueItem[],
    key: string | undefined,
    receipt: ContactReceipt | undefined
): ContactState {
    if (receipt) {
        return receipt.ok
            ? { s: 'delivered', key, id: receipt.id, duplicate: receipt.duplicate }
            : { s: 'rejected', error: receipt.error };
    }
    const item = items.find((entry) => entry.actionName === 'contactMessage' && entry.idempotencyKey === key);
    if (item?.status === 'pending') return { s: 'queued', key: item.idempotencyKey };
    if (item?.status === 'replaying') return { s: 'sending', key: item.idempotencyKey };
    return { s: 'unconfirmed', key };
}
