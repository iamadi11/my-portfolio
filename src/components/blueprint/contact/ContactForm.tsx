'use client';

import React, { useEffect, useRef, useState } from 'react';

import type { Payload } from './send';

import './contact-form.css';

/**
 * "Send a message" on the contact sheet, delivered by Eidos (the owner's library). Write it on a train with no
 * signal and press Send: the message is kept on this device and goes out when the connection is back, once, under
 * its idempotency key. The drawing beside the form shows the visitor's own message moving: FORM → QUEUE → SERVER.
 * Eidos (`./send`) is loaded on the first focus of the form, so it costs nothing until someone writes.
 */

type State =
    | { s: 'idle' }
    | { s: 'sending'; key?: string }
    | { s: 'queued'; key: string }
    | { s: 'delivered'; key?: string; id: string; duplicate?: boolean }
    | { s: 'rejected'; error: string };

type SendModule = typeof import('./send');
let mod: Promise<SendModule> | null = null;
const load = (): Promise<SendModule> => (mod ??= import('./send'));

const STATUS: Record<State['s'], string> = {
    idle: '',
    sending: 'Sending…',
    queued: 'You are offline. The message is saved on this device and will be sent when you are back online.',
    delivered: 'Delivered. Thank you, I will reply by email.',
    rejected: '',
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
                    ? 'Offline · held, replays on reconnect'
                    : st.s === 'delivered'
                      ? st.duplicate
                          ? 'Retry recognised · stored once'
                          : 'Stored once'
                      : 'At-least-once · deduplicated by key'}
            </text>
        </svg>
    );
}

export default function ContactForm(): React.JSX.Element {
    const [st, setSt] = useState<State>({ s: 'idle' });
    const watching = useRef<(() => void) | undefined>(undefined);

    /** Follow a queued message through Eidos' queue until it is delivered. */
    const watch = (m: SendModule, key?: string): void => {
        watching.current?.();
        watching.current = m.eidosQueue.subscribe((items) => {
            const mine = items.filter((it) => it.actionName === 'contactMessage');
            const item = key ? mine.find((it) => it.idempotencyKey === key) : mine[0];
            if (!item || item.status === 'succeeded') {
                if (mine.every((it) => it.status === 'succeeded')) {
                    try {
                        localStorage.removeItem(m.QUEUED_FLAG);
                    } catch {}
                    setSt((p) =>
                        p.s === 'queued' || p.s === 'sending' ? { s: 'delivered', key: p.key, id: '' } : p
                    );
                }
                return;
            }
            if (item.status === 'replaying') setSt({ s: 'sending', key: item.idempotencyKey });
            else if (item.status === 'pending') setSt({ s: 'queued', key: item.idempotencyKey });
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
        let flag = false;
        try {
            flag = localStorage.getItem('bp-contact-queued') === '1';
        } catch {}
        if (!flag) return () => watching.current?.();
        const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
        idle(() => load().then((m) => watch(m)));
        return () => watching.current?.();
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
        const r = await m.sendMessage(p);
        if ('queued' in r) {
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

    const busy = st.s === 'sending';
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
                <p className="cf-note">Works offline: it is sent when you are back online.</p>
            </div>
            <p className="cf-status" role="status" aria-live="polite">
                {st.s === 'rejected' ? st.error : STATUS[st.s]}
            </p>
        </form>
    );
}
