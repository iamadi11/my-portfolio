'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';

/** Core Web Vitals of this page, observed in the visitor's own browser. One observer set, many readers. */

/** null = not supported here; inp 0 = listening, no interaction yet. */
type Snapshot = { lcp: number | null; cls: number | null; inp: number | null };
type LayoutShift = PerformanceEntry & { value: number; hadRecentInput: boolean };
type EventTiming = PerformanceEntry & { interactionId?: number };

let snapshot: Snapshot = { lcp: null, cls: null, inp: null };
const listeners = new Set<() => void>();
let started = false;

function emit(next: Partial<Snapshot>): void {
    snapshot = { ...snapshot, ...next };
    listeners.forEach((listener) => listener());
}

function observe(type: string, onEntries: (entries: PerformanceEntry[]) => void, extra = {}): boolean {
    if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return false;
    new PerformanceObserver((list) => onEntries(list.getEntries())).observe({
        type,
        buffered: true,
        ...extra,
    });
    return true;
}

function start(): void {
    if (started || typeof PerformanceObserver === 'undefined') return;
    started = true;

    observe('largest-contentful-paint', (entries) => {
        const last = entries.at(-1);
        if (last) emit({ lcp: last.startTime });
    });

    // CLS = the largest session window (gaps < 1s, window < 5s), as defined by web.dev.
    let session = 0;
    let first = 0;
    let previous = 0;
    let worst = 0;
    const shifts = observe('layout-shift', (entries) => {
        for (const entry of entries as LayoutShift[]) {
            if (entry.hadRecentInput) continue;
            const joins = session > 0 && entry.startTime - previous < 1000 && entry.startTime - first < 5000;
            session = joins ? session + entry.value : entry.value;
            if (!joins) first = entry.startTime;
            previous = entry.startTime;
            worst = Math.max(worst, session);
        }
        emit({ cls: worst });
    });
    if (shifts && snapshot.cls === null) emit({ cls: 0 });

    // INP is the worst interaction while there are fewer than 50 of them, which covers a portfolio visit.
    const events = observe(
        'event',
        (entries) => {
            let slowest = snapshot.inp ?? 0;
            for (const entry of entries as EventTiming[]) {
                if (entry.interactionId) slowest = Math.max(slowest, entry.duration);
            }
            if (slowest > 0) emit({ inp: slowest });
        },
        { durationThreshold: 16 }
    );
    if (events && snapshot.inp === null) emit({ inp: 0 });
}

function subscribe(listener: () => void): () => void {
    start();
    listeners.add(listener);
    return () => listeners.delete(listener);
}

const EMPTY: Snapshot = { lcp: null, cls: null, inp: null };

type Rating = 'good' | 'fair' | 'poor';
const rate = (value: number, good: number, poor: number): Rating =>
    value <= good ? 'good' : value <= poor ? 'fair' : 'poor';

function readings(
    s: Snapshot,
    waiting: string
): Array<{ key: string; value: string; rating: Rating | null }> {
    return [
        {
            key: 'LCP',
            value: s.lcp === null ? '—' : `${(s.lcp / 1000).toFixed(2)}s`,
            rating: s.lcp === null ? null : rate(s.lcp, 2500, 4000),
        },
        {
            key: 'CLS',
            value: s.cls === null ? '—' : s.cls.toFixed(3),
            rating: s.cls === null ? null : rate(s.cls, 0.1, 0.25),
        },
        {
            key: 'INP',
            value: s.inp === null ? '—' : s.inp === 0 ? waiting : `${Math.round(s.inp)}ms`,
            rating: s.inp ? rate(s.inp, 200, 500) : null,
        },
    ];
}

export function Vitals({ variant }: { variant: 'dock' | 'full' }): React.JSX.Element {
    const s = useSyncExternalStore(
        subscribe,
        () => snapshot,
        () => EMPTY
    );
    return (
        <dl className={`ins-vitals ins-vitals-${variant}`}>
            {readings(s, variant === 'full' ? 'waiting for your first tap' : 'idle').map((r) => (
                <div key={r.key} data-rating={r.rating ?? undefined}>
                    <dt>{r.key}</dt>
                    <dd>
                        {r.value}
                        {variant === 'full' && r.rating && <span className="ins-rating"> {r.rating}</span>}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

/** Local time where the person is. Rendered after mount so the server and client agree. */
export function LocalTime({ timeZone }: { timeZone: string }): React.JSX.Element {
    const [now, setNow] = useState<string | null>(null);
    useEffect(() => {
        const clock = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone,
            timeZoneName: 'short',
        });
        const tick = (): void => setNow(clock.format(new Date()));
        tick();
        const id = window.setInterval(tick, 20_000);
        return () => window.clearInterval(id);
    }, [timeZone]);
    return <time className="ins-time">{now ?? '--:--'}</time>;
}
