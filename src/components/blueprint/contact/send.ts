import { type ActionContext, action, eidosQueue, initEidos, replayQueue } from '@sweidos/eidos';

/**
 * The contact form's write, made with the owner's own library (Eidos, `@sweidos/eidos`): `neverLose` keeps the
 * message in IndexedDB until `/api/contact` accepts it, retrying with the same idempotency key so the server stores
 * it once. Defined at module scope (Eidos needs this to replay queued items after a reload). Loaded lazily: on the
 * first interaction with the form, or on idle when a previous visit left a message queued.
 */

export type Payload = { name: string; email: string; message: string; website: string };

/** What the server answered: stored (maybe as a recognised retry), or rejected as invalid. */
type Sent = { ok: true; id: string; duplicate?: boolean } | { ok: false; error: string };

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
        // 4xx: the message itself is wrong; don't retry it forever. 5xx / network: throw, Eidos keeps it.
        if (res.status >= 400 && res.status < 500) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            return { ok: false, error: body.error ?? `Rejected (${res.status})` };
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { ok: true, ...((await res.json()) as { id: string; duplicate?: boolean }) };
    },
    { reliability: 'neverLose', name: 'contactMessage' }
);

// Read through the form's dynamic import():
// fallow-ignore-next-line unused-export
export { eidosQueue };
