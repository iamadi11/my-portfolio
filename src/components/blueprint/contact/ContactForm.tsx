'use client';

import React, { useEffect, useRef, useState } from 'react';

import { contactDelivery, readContactReceipt, type ContactState as State } from './delivery';
import type { Payload } from './send';

import './contact-form.css';

/**
 * "Send a message" on the contact sheet, delivered by Eidos (the owner's library). Write it on a train with no
 * signal and press Send: the message is kept on this device for replay with the same idempotency key. The API
 * deduplicates that key for seven days. The drawing shows the observed progress: FORM → QUEUE → SERVER.
 * Eidos (`./send`) is loaded on the first focus of the form, so it costs nothing until someone writes.
 */

type SendModule = typeof import('./send');
let mod: Promise<SendModule> | null = null;
const load = (): Promise<SendModule> => (mod ??= import('./send'));

const STATUS: Record<State['s'], string> = {
    idle: '',
    sending: 'Sending…',
    queued: 'The message is saved on this device and waiting to retry. Keep this page available when you reconnect.',
    delivered: 'Message stored by the server. Thank you, I will reply by email.',
    rejected: '',
    unconfirmed: 'Delivery could not be confirmed. Check your connection before sending again.',
};

function short(key?: string): string {
    return key ? `${key.slice(0, 8)}…` : '—';
}

/** FORM → QUEUE (IndexedDB) → SERVER, drawn in the sheet's language; the step the message is at is filled. */
function Sequence({ st }: { st: State }): React.JSX.Element {
    const at = st.s === 'queued' ? 1 : st.s === 'delivered' ? 2 : st.s === 'sending' ? 0 : -1;
    const key = 'key' in st ? st.key : undefined;
    const box = (i: number, x: number, title: string, sub: string): React.JSX.Element => (
        <g className={['cf-step', at === i && 'is-at', at > i && 'is-past'].filter(Boolean).join(' ')}>
            <rect x={x} y={20} width={150} height={52} rx={4} />
            {i === 1 && st.s === 'queued' ? (
                <rect x={x} y={20} width={150} height={52} rx={4} className="cf-held" />
            ) : null}
            <text x={x + 75} y={43} textAnchor="middle" className="cf-t">
                {title}
            </text>
            <text x={x + 75} y={59} textAnchor="middle" className="cf-s">
                {sub}
            </text>
        </g>
    );
    return (
        <svg className="bp-svg cf-seq" viewBox="0 0 560 128" aria-hidden="true">
            <defs>
                <marker
                    id="cf-ar"
                    viewBox="0 0 10 10"
                    refX={10}
                    refY={5}
                    markerWidth={7}
                    markerHeight={7}
                    orient="auto"
                >
                    <path d="M0,1.7 L10,5 L0,8.3 z" className="arrow" />
                </marker>
                <pattern
                    id="cf-ha"
                    width={5}
                    height={5}
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                >
                    <line x1={0} y1={0} x2={0} y2={5} className="hl" />
                </pattern>
            </defs>
            {box(0, 0, 'Form', 'this page')}
            {box(1, 205, 'Queue', 'IndexedDB')}
            {box(2, 410, 'Server', '/api/contact')}
            <line
                x1={152}
                y1={46}
                x2={203}
                y2={46}
                className={['cf-arrow', at >= 1 && 'is-on'].filter(Boolean).join(' ')}
                markerEnd="url(#cf-ar)"
            />
            <line
                x1={357}
                y1={46}
                x2={408}
                y2={46}
                className={['cf-arrow', at >= 2 && 'is-on'].filter(Boolean).join(' ')}
                markerEnd="url(#cf-ar)"
            />
            <text x={0} y={100} className="cf-s">
                Idempotency-Key {short(key)}
            </text>
            <text x={560} y={100} textAnchor="end" className="cf-s">
                {st.s === 'queued'
                    ? 'Waiting · saved for replay'
                    : st.s === 'delivered'
                      ? st.duplicate
                          ? 'Retry recognised by server'
                          : 'Accepted by server'
                      : 'At-least-once · deduplicated by key'}
            </text>
        </svg>
    );
}

export default function ContactForm(): React.JSX.Element {
    const [st, setSt] = useState<State>({ s: 'idle' });
    const watching = useRef<(() => void) | undefined>(undefined);

    /** Follow one logical message; only an API receipt can establish acceptance/rejection. */
    const watch = (m: SendModule, key?: string): void => {
        watching.current?.();
        let trackedKey = key;
        watching.current = m.eidosQueue.subscribe((items) => {
            const mine = items.filter((it) => it.actionName === 'contactMessage');
            trackedKey ??= mine.find(
                (it) => it.status === 'pending' || it.status === 'replaying'
            )?.idempotencyKey;
            const next = contactDelivery(
                items,
                trackedKey,
                trackedKey ? readContactReceipt(trackedKey) : undefined
            );
            if (next.s === 'delivered' || next.s === 'rejected') {
                try {
                    if (localStorage.getItem(m.QUEUED_FLAG) === trackedKey)
                        localStorage.removeItem(m.QUEUED_FLAG);
                } catch {}
            }
            setSt(next);
        });
    };

    // Load the sender while the visitor is (most likely) still online: as the form comes near. A visitor who loses
    // signal before reaching it can then still queue a message.
    const formRef = useRef<HTMLFormElement>(null);
    useEffect(() => {
        const el = formRef.current;
        const io = new IntersectionObserver(
            (es) => {
                if (es.some((e) => e.isIntersecting)) {
                    io.disconnect();
                    void load().catch(() => (mod = null));
                }
            },
            { rootMargin: '600px 0px' }
        );
        if (el) io.observe(el);
        return () => io.disconnect();
    }, []);

    // A message queued on a previous visit: load Eidos when the browser is idle and let it finish the job.
    useEffect(() => {
        let flag: string | null = null;
        try {
            flag = localStorage.getItem('bp-contact-queued');
        } catch {}
        if (!flag) return () => watching.current?.();
        let cancelled = false;
        const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
        idle(() => {
            void load()
                .then((m) => {
                    if (!cancelled) watch(m, flag === '1' ? undefined : (flag ?? undefined));
                })
                .catch(() => {
                    mod = null;
                    if (!cancelled) setSt({ s: 'unconfirmed' });
                });
        });
        return () => {
            cancelled = true;
            watching.current?.();
        };
    }, []);

    const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        const p: Payload = {
            name: String(f.get('name') ?? ''),
            email: String(f.get('email') ?? ''),
            message: String(f.get('message') ?? ''),
            website: String(f.get('website') ?? ''),
        };
        watching.current?.();
        watching.current = undefined;
        setSt({ s: 'sending' });
        let m: SendModule;
        try {
            m = await load();
        } catch {
            // Offline before the sender could load: nothing is lost, the text stays in the form.
            mod = null;
            setSt({
                s: 'rejected',
                error: 'You are offline and the sender has not loaded yet. Your text is still in the form: press Send again once you are back online.',
            });
            return;
        }
        try {
            localStorage.setItem(m.QUEUED_FLAG, '1');
        } catch {}
        let r: Awaited<ReturnType<SendModule['sendMessage']>>;
        try {
            r = await m.sendMessage(p);
        } catch {
            setSt({ s: 'unconfirmed' });
            return;
        }
        if ('queued' in r) {
            try {
                localStorage.setItem(m.QUEUED_FLAG, r.idempotencyKey);
            } catch {}
            setSt({ s: 'queued', key: r.idempotencyKey });
            watch(m, r.idempotencyKey);
            return;
        }
        try {
            localStorage.removeItem(m.QUEUED_FLAG);
        } catch {}
        if (r.ok) {
            setSt({ s: 'delivered', id: r.id, duplicate: r.duplicate });
            form.reset();
        } else setSt({ s: 'rejected', error: r.error });
    };

    const busy = st.s === 'sending' || st.s === 'queued';
    return (
        <form
            ref={formRef}
            className="cf"
            onSubmit={submit}
            onFocus={() => void load().catch(() => (mod = null))}
        >
            <div className="cf-fields">
                <label className="cf-f">
                    <span className="cf-l">Name (optional)</span>
                    <input name="name" autoComplete="name" maxLength={100} />
                </label>
                <label className="cf-f">
                    <span className="cf-l">Email to reply to</span>
                    <input name="email" type="email" required autoComplete="email" maxLength={320} />
                </label>
                <label className="cf-f cf-msg">
                    <span className="cf-l">Message</span>
                    <textarea name="message" required minLength={10} maxLength={4000} rows={5} />
                </label>
                {/* Left empty by people; bots fill it. */}
                <label className="cf-trap" aria-hidden="true">
                    Website
                    <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
            </div>
            <Sequence st={st} />
            <div className="cf-act">
                <button type="submit" className="cf-btn" disabled={busy} aria-busy={busy}>
                    Send message <span aria-hidden="true">→</span>
                </button>
                <p className="cf-note">Offline messages are saved on this device for replay.</p>
            </div>
            <p className="cf-status" role="status" aria-live="polite">
                {st.s === 'rejected' ? st.error : STATUS[st.s]}
            </p>
        </form>
    );
}
