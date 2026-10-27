'use client';

import React, { useEffect, useState } from 'react';

import { SHEETS } from './sheets';

/**
 * Live stamp in the nav: how many people are reading the drawing set right now, and how many are on the sheet in
 * view. Reports every 25 s while the tab is visible (`/api/presence`), leaves on pagehide. Renders nothing until the
 * first answer, so it never shows a made-up number.
 */
const BEAT = 25_000;

function sessionId(): string {
    try {
        const k = 'bp-sid';
        const have = sessionStorage.getItem(k);
        if (have) return have;
        const id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) =>
            b.toString(16).padStart(2, '0')
        ).join('');
        sessionStorage.setItem(k, id);
        return id;
    } catch {
        return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) =>
            b.toString(16).padStart(2, '0')
        ).join('');
    }
}

export default function Readers(): React.JSX.Element | null {
    const [n, setN] = useState<{ total: number; here: number; sheet: number } | null>(null);

    useEffect(() => {
        const sid = sessionId();
        let sheet: string = SHEETS[0].id;
        let timer = 0;
        let stopped = false;

        const send = async (): Promise<void> => {
            window.clearTimeout(timer);
            if (stopped || document.visibilityState !== 'visible') return;
            try {
                const res = await fetch('/api/presence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sid, sheet }),
                });
                if (res.status === 200) {
                    const d = (await res.json()) as { total: number; sheets: Record<string, number> };
                    const s = SHEETS.find((x) => x.id === sheet)!;
                    setN({ total: d.total, here: d.sheets[sheet] ?? 0, sheet: s.n });
                }
            } catch {
                /* offline: keep the last known stamp */
            }
            if (!stopped) timer = window.setTimeout(send, BEAT);
        };

        // The sheet in view is the one crossing the middle of the viewport.
        const io = new IntersectionObserver(
            (entries) => {
                const hit = entries.find((e) => e.isIntersecting);
                if (hit && hit.target.id !== sheet) {
                    sheet = hit.target.id;
                    window.clearTimeout(timer);
                    timer = window.setTimeout(send, 1200);
                }
            },
            { rootMargin: '-50% 0px -50% 0px' }
        );
        SHEETS.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) io.observe(el);
        });
        const leave = (): void => {
            navigator.sendBeacon?.(
                '/api/presence',
                new Blob([JSON.stringify({ sid, leave: true })], { type: 'application/json' })
            );
        };
        const vis = (): void => {
            if (document.visibilityState === 'visible') send();
            else window.clearTimeout(timer);
        };
        document.addEventListener('visibilitychange', vis);
        window.addEventListener('pagehide', leave);
        // First report once the page is idle: the stamp never competes with the first paint.
        const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
        idle(() => void send(), { timeout: 4000 });
        return () => {
            stopped = true;
            window.clearTimeout(timer);
            io.disconnect();
            document.removeEventListener('visibilitychange', vis);
            window.removeEventListener('pagehide', leave);
        };
    }, []);

    if (!n || n.total < 1) return null;
    return (
        <p className="nav-readers" title="People reading this drawing set now (updated every 25 s)">
            <span className="nav-readers-dot" aria-hidden="true" />
            {n.total} reading now
            <span className="nav-readers-sheet">
                {' '}
                · sheet {n.sheet}: {n.here}
            </span>
        </p>
    );
}
