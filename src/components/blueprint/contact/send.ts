import { type ActionContext, action, eidosQueue, initEidos, replayQueue } from '@sweidos/eidos';

import { type ContactReceipt, recordContactReceipt } from './delivery';

/**
 * The contact form's write, made with the owner's own library (Eidos, `@sweidos/eidos`): `neverLose` keeps the
 * message in IndexedDB for replay, retrying with the same idempotency key. The API deduplicates that key for seven
 * days. Permanent rejection stops replay; exhaustion is not delivery. Defined at module scope for reload replay.
 * Loaded lazily: on the
 * first interaction with the form, or on idle when a previous visit left a message queued.
 */

export type Payload = { name: string; email: string; message: string; website: string };

/** What the server answered: stored (maybe as a recognised retry), or rejected as invalid. */
type Sent = ContactReceipt;

/** Set while a message is queued, so the next visit loads this module and delivers it. */
// Read through the form's dynamic import():
// fallow-ignore-next-line unused-export
export const QUEUED_FLAG = 'bp-contact-queued';

// In production the site's service worker (`/sw.js`) also hosts Eidos' worker (background sync, online tracking,
// replay). In development the plain Eidos worker is used instead, so no page caching gets in the way of hot reload.
initEidos({ swPath: process.env.NODE_ENV === 'production' ? '/sw.js' : '/eidos-sw.js' }).catch(() => {});
// Belt and braces: Eidos tracks connectivity once its worker is registered; if that ever fails, the page itself
// still replays the queue when the browser says it is back online.
if (typeof window !== 'undefined')
    window.addEventListener('online', () => window.setTimeout(() => void replayQueue(), 800));

// Read through the form's dynamic import():
// fallow-ignore-next-line unused-export
export const sendMessage = action<[Payload], Sent>(
    async (p: Payload, ctx: ActionContext): Promise<Sent> => {
        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Idempotency-Key': ctx.idempotencyKey },
            body: JSON.stringify(p),
            signal: ctx.signal,
        });
        // Permanent 4xx: don't retry invalid input forever. Timeouts/rate limits and 5xx/network can retry.
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            const rejected: Sent = {
                ok: false,
                error: typeof body.error === 'string' ? body.error : `Rejected (${res.status})`,
            };
            recordContactReceipt(ctx.idempotencyKey, rejected);
            return rejected;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { id?: unknown; duplicate?: unknown };
        if (typeof body.id !== 'string' || !body.id) throw new Error('Missing contact acknowledgement');
        const accepted: Sent = { ok: true, id: body.id, duplicate: body.duplicate === true };
        // A replay that resolves {ok:false} is still "succeeded" in Eidos. Keep the API outcome before its
        // queue entry changes or disappears, so foreground/reloaded forms can report the actual result.
        recordContactReceipt(ctx.idempotencyKey, accepted);
        return accepted;
    },
    { reliability: 'neverLose', name: 'contactMessage' }
);

// Read through the form's dynamic import():
// fallow-ignore-next-line unused-export
export { eidosQueue };
