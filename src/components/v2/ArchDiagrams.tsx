'use client';

import { useEffect, useRef, useState } from 'react';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── Shared panel primitives ─────────────────────────────────────── */
const PANEL: React.CSSProperties = {
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(8,10,20,0.90)',
    overflow: 'hidden',
    fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)",
};
const BAR: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.015)',
    fontSize: 10,
    letterSpacing: '0.12em',
};
const LBL: React.CSSProperties = {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 9,
    letterSpacing: '0.12em',
};
const SEP: React.CSSProperties = { borderTop: '1px solid rgba(255,255,255,0.05)' };

function Pip({ color, glow }: { color: string; glow?: boolean }) {
    return (
        <span
            style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: color,
                display: 'inline-block',
                ...(glow ? { boxShadow: `0 0 7px ${color}` } : {}),
            }}
        />
    );
}

/* ═══════════════════════════════════════════════════════════════════
   1. RISK ENGINE — live transaction risk feed
   ═══════════════════════════════════════════════════════════════════ */
const TXN_POOL = [
    { id: 'TXN-9847', amt: '₹12,400', score: 0.82, pass: false },
    { id: 'TXN-9846', amt: '₹850', score: 0.21, pass: true },
    { id: 'TXN-9845', amt: '₹45,000', score: 0.94, pass: false },
    { id: 'TXN-9844', amt: '₹2,100', score: 0.34, pass: true },
    { id: 'TXN-9848', amt: '₹3,200', score: 0.28, pass: true },
    { id: 'TXN-9849', amt: '₹88,000', score: 0.96, pass: false },
    { id: 'TXN-9850', amt: '₹1,500', score: 0.15, pass: true },
    { id: 'TXN-9851', amt: '₹9,800', score: 0.71, pass: false },
];

export function RiskEngineDiagram({ accent }: { accent: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [rows, setRows] = useState(TXN_POOL.slice(0, 4));
    const cursor = useRef(4);
    const active = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const ctx = gsap.context(() => {
            const rows$ = el.querySelectorAll<HTMLElement>('[data-txn]');
            const stats$ = el.querySelectorAll<HTMLElement>('[data-stat]');
            gsap.set(el, { opacity: 0, y: 16 });
            gsap.set([...rows$, ...stats$], { opacity: 0, x: 10 });

            gsap.timeline({
                scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
                defaults: { ease: 'power2.out' },
            })
                .to(el, { opacity: 1, y: 0, duration: 0.5 })
                .to(rows$, { opacity: 1, x: 0, duration: 0.3, stagger: 0.08 }, '-=0.2')
                .to(stats$, { opacity: 1, x: 0, duration: 0.3, stagger: 0.06 }, '-=0.1')
                .call(() => {
                    active.current = true;
                });
        }, el);

        const t = setInterval(() => {
            if (!active.current) return;
            setRows((p) => {
                const next = TXN_POOL[cursor.current % TXN_POOL.length];
                cursor.current++;
                return [next, ...p.slice(0, 3)];
            });
        }, 2000);

        return () => {
            ctx.revert();
            clearInterval(t);
        };
    }, []);

    function riskColor(s: number) {
        return s > 0.75 ? '#f87171' : s > 0.5 ? '#fb923c' : '#4ade80';
    }

    return (
        <div ref={ref} style={{ ...PANEL, opacity: 0 }}>
            <div style={BAR}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Pip color={accent} glow />
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>RISK ENGINE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Pip color="#4ade80" glow />
                    <span style={{ color: '#4ade80', fontSize: 9 }}>LIVE</span>
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '88px 1fr 60px 48px',
                    gap: '0 6px',
                    padding: '5px 12px',
                    ...LBL,
                }}
            >
                <span>ID</span>
                <span>AMOUNT</span>
                <span>RISK</span>
                <span>STATUS</span>
            </div>

            {rows.map((r) => (
                <div
                    key={r.id}
                    data-txn
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '88px 1fr 60px 48px',
                        gap: '0 6px',
                        padding: '7px 12px',
                        alignItems: 'center',
                        ...SEP,
                        transition: 'opacity 0.35s',
                    }}
                >
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>{r.id}</span>
                    <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 11 }}>{r.amt}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                        {[0.2, 0.4, 0.6, 0.8, 1.0].map((t, i) => (
                            <div
                                key={i}
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: 1.5,
                                    background: r.score >= t ? riskColor(r.score) : 'rgba(255,255,255,0.1)',
                                    transition: 'background 0.3s',
                                }}
                            />
                        ))}
                    </div>
                    <span
                        style={{
                            fontSize: 8,
                            padding: '2px 5px',
                            borderRadius: 3,
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            background: r.pass ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                            color: r.pass ? '#4ade80' : '#f87171',
                            border: `1px solid ${r.pass ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
                        }}
                    >
                        {r.pass ? 'PASS' : 'BLOCK'}
                    </span>
                </div>
            ))}

            <div
                style={{
                    display: 'flex',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.015)',
                }}
            >
                {[
                    { v: '1,247', k: 'BLOCKED', c: '#f87171' },
                    { v: '₹2.3M', k: 'SAVED', c: '#4ade80' },
                    { v: '99.97%', k: 'UPTIME', c: accent },
                ].map((s) => (
                    <div
                        key={s.k}
                        data-stat
                        style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderLeft: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <div style={{ color: s.c, fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{s.v}</div>
                        <div style={{ ...LBL, marginTop: 3 }}>{s.k}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   2. SERVICEABILITY MAPS — delivery zone selector UI
   ═══════════════════════════════════════════════════════════════════ */
export function MapsDiagram({ accent, accent2 }: { accent: string; accent2?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [phase, setPhase] = useState<'idle' | 'checking' | 'done'>('idle');
    const a2 = accent2 ?? accent;

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const ctx = gsap.context(() => {
            const zones$ = el.querySelectorAll<HTMLElement>('[data-zone]');
            const pin$ = el.querySelector<HTMLElement>('[data-pin]');
            const result$ = el.querySelector<HTMLElement>('[data-result]');
            gsap.set(el, { opacity: 0, y: 14 });
            gsap.set(zones$, { opacity: 0, scale: 0.88, transformOrigin: 'center' });
            gsap.set([pin$, result$], { opacity: 0, y: 10 });

            gsap.timeline({
                scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
                defaults: { ease: 'power2.out' },
            })
                .to(el, { opacity: 1, y: 0, duration: 0.5 })
                .to(zones$, { opacity: 1, scale: 1, duration: 0.45, stagger: 0.1 }, '-=0.15')
                .call(() => setPhase('checking'))
                .to(pin$, { opacity: 1, y: 0, duration: 0.4 }, '+=0.3')
                .call(() => setPhase('done'))
                .to(result$, { opacity: 1, y: 0, duration: 0.45 }, '+=0.2');
        }, el);

        return () => ctx.revert();
    }, []);

    const zones = [
        {
            label: 'STANDARD',
            color: 'rgba(255,255,255,0.06)',
            border: 'rgba(255,255,255,0.12)',
            time: '2-4 hr',
        },
        {
            label: '1-HOUR',
            color: `rgba(${parseInt(a2.slice(1, 3), 16)},${parseInt(a2.slice(3, 5), 16)},${parseInt(a2.slice(5, 7), 16)},0.07)`,
            border: `${a2}44`,
            time: '45-90 min',
        },
        {
            label: '15-MIN',
            color: `rgba(${parseInt(accent.slice(1, 3), 16)},${parseInt(accent.slice(3, 5), 16)},${parseInt(accent.slice(5, 7), 16)},0.12)`,
            border: `${accent}55`,
            time: '12-20 min',
        },
    ];

    return (
        <div ref={ref} style={{ ...PANEL, opacity: 0 }}>
            <div style={BAR}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Pip color={accent} glow />
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>SERVICEABILITY CHECK</span>
                </div>
                <span style={{ ...LBL }}>TATA 1MG</span>
            </div>

            {/* Address input */}
            <div
                style={{
                    padding: '9px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                }}
            >
                <span style={{ fontSize: 13 }}>📍</span>
                <div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
                        Indiranagar, Bengaluru
                    </div>
                    <div style={{ ...LBL, marginTop: 1 }}>560 038 · Karnataka</div>
                </div>
                <div
                    style={{
                        marginLeft: 'auto',
                        fontSize: 8,
                        padding: '2px 7px',
                        borderRadius: 3,
                        background:
                            phase === 'checking'
                                ? `${accent}22`
                                : phase === 'done'
                                  ? 'rgba(74,222,128,0.12)'
                                  : 'rgba(255,255,255,0.06)',
                        color: phase === 'done' ? '#4ade80' : 'rgba(255,255,255,0.4)',
                        border: `1px solid ${phase === 'done' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        letterSpacing: '0.08em',
                        transition: 'all 0.4s',
                    }}
                >
                    {phase === 'idle' ? 'READY' : phase === 'checking' ? 'CHECKING…' : '✓ VERIFIED'}
                </div>
            </div>

            {/* Zone map */}
            <div style={{ padding: '14px 12px', position: 'relative' }}>
                <svg viewBox="0 0 280 130" style={{ width: '100%', height: 'auto', display: 'block' }}>
                    {/* Nested zone rectangles */}
                    {zones.map((z, i) => {
                        const pad = i * 22;
                        return (
                            <g key={z.label} data-zone>
                                <rect
                                    x={pad}
                                    y={pad * 0.5}
                                    width={280 - pad * 2}
                                    height={130 - pad}
                                    rx={8}
                                    fill={z.color}
                                    stroke={z.border}
                                    strokeWidth="1"
                                />
                                <text
                                    x={pad + 8}
                                    y={pad * 0.5 + 14}
                                    fill={i === 0 ? 'rgba(255,255,255,0.35)' : i === 1 ? a2 : accent}
                                    fontSize="7.5"
                                    fontFamily="var(--font-jetbrains-mono,'JetBrains Mono',monospace)"
                                    letterSpacing="0.1em"
                                >
                                    {z.label}
                                </text>
                                <text
                                    x={pad + 8}
                                    y={pad * 0.5 + 25}
                                    fill="rgba(255,255,255,0.28)"
                                    fontSize="6.5"
                                    fontFamily="var(--font-jetbrains-mono,'JetBrains Mono',monospace)"
                                >
                                    {z.time}
                                </text>
                            </g>
                        );
                    })}
                    {/* Pin drop */}
                    <g data-pin>
                        <circle
                            cx="140"
                            cy="75"
                            r="14"
                            fill={`${accent}22`}
                            stroke={`${accent}55`}
                            strokeWidth="1"
                        />
                        <circle cx="140" cy="75" r="5" fill={accent} />
                        <circle
                            cx="140"
                            cy="75"
                            r="9"
                            fill="none"
                            stroke={accent}
                            strokeWidth="1"
                            opacity="0.5"
                        />
                        <line
                            x1="140"
                            y1="80"
                            x2="140"
                            y2="92"
                            stroke={accent}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </g>
                </svg>
            </div>

            {/* Result */}
            <div
                data-result
                style={{
                    margin: '0 12px 12px',
                    padding: '8px 10px',
                    borderRadius: 7,
                    background: `${accent}12`,
                    border: `1px solid ${accent}30`,
                    opacity: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div>
                    <div style={{ color: accent, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em' }}>
                        ✓ 15-MIN DELIVERY ZONE
                    </div>
                    <div style={{ ...LBL, marginTop: 2 }}>Est. 12-18 min · 3 slots available</div>
                </div>
                <div
                    style={{
                        fontSize: 8,
                        padding: '3px 7px',
                        borderRadius: 3,
                        background: `${accent}20`,
                        color: accent,
                        letterSpacing: '0.06em',
                    }}
                >
                    SERVICEABLE
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   3. REALTIME NOTIFICATIONS — pub/sub hub with live feed
   ═══════════════════════════════════════════════════════════════════ */
const CHANNELS = [
    { name: 'OPS', badge: 3, color: '#f87171' },
    { name: 'CX', badge: 1, color: '#fb923c' },
    { name: 'RIDER', badge: 4, color: '#4ade80' },
    { name: 'EMAIL', badge: 0, color: 'rgba(255,255,255,0.3)' },
];
const FEED_POOL = [
    { ch: 'OPS', msg: 'Order #4892 dispatched — rider assigned', time: '0s' },
    { ch: 'RIDER', msg: 'Zone D capacity at 94% — rerouting', time: '1s' },
    { ch: 'CX', msg: 'Delay notification sent — CS-1247', time: '3s' },
    { ch: 'EMAIL', msg: '2,847 campaign emails delivered', time: '5s' },
    { ch: 'OPS', msg: 'Payment confirmed #TXN-9845 ₹1,200', time: '6s' },
    { ch: 'RIDER', msg: 'ETA recalculated — 8 min · Jayanagar', time: '8s' },
    { ch: 'OPS', msg: 'SLA breach risk — order #4901 → alert', time: '11s' },
];

export function RealtimeDiagram({ accent, accent2 }: { accent: string; accent2?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [feed, setFeed] = useState(FEED_POOL.slice(0, 3));
    const cursor = useRef(3);
    const active = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const ctx = gsap.context(() => {
            const sidebar$ = el.querySelectorAll<HTMLElement>('[data-ch]');
            const msgs$ = el.querySelectorAll<HTMLElement>('[data-msg]');
            gsap.set(el, { opacity: 0, y: 14 });
            gsap.set(sidebar$, { opacity: 0, x: -10 });
            gsap.set(msgs$, { opacity: 0, x: 10 });

            gsap.timeline({
                scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
                defaults: { ease: 'power2.out' },
            })
                .to(el, { opacity: 1, y: 0, duration: 0.5 })
                .to(sidebar$, { opacity: 1, x: 0, duration: 0.3, stagger: 0.08 }, '-=0.2')
                .to(msgs$, { opacity: 1, x: 0, duration: 0.28, stagger: 0.07 }, '-=0.15')
                .call(() => {
                    active.current = true;
                });
        }, el);

        const t = setInterval(() => {
            if (!active.current) return;
            setFeed((p) => {
                const next = FEED_POOL[cursor.current % FEED_POOL.length];
                cursor.current++;
                return [next, ...p.slice(0, 3)];
            });
        }, 1600);

        return () => {
            ctx.revert();
            clearInterval(t);
        };
    }, []);

    const chColor = (name: string) => CHANNELS.find((c) => c.name === name)?.color ?? accent;

    return (
        <div ref={ref} style={{ ...PANEL, opacity: 0 }}>
            <div style={BAR}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Pip color={accent} glow />
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>NOTIFICATION HUB</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Pip color={accent2 ?? accent} glow />
                    <span style={{ color: accent2 ?? accent, fontSize: 9 }}>LIVE</span>
                </div>
            </div>

            <div style={{ display: 'flex', height: 188 }}>
                {/* Channel sidebar */}
                <div
                    style={{
                        width: 72,
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        padding: '4px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0,
                        flexShrink: 0,
                    }}
                >
                    <div style={{ ...LBL, padding: '4px 10px 8px', fontSize: 8 }}>CHANNELS</div>
                    {CHANNELS.map((c) => (
                        <div
                            key={c.name}
                            data-ch
                            style={{
                                padding: '7px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                            }}
                        >
                            <span
                                style={{
                                    color: c.badge > 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)',
                                    fontSize: 9,
                                    letterSpacing: '0.08em',
                                }}
                            >
                                {c.name}
                            </span>
                            {c.badge > 0 && (
                                <span
                                    style={{
                                        fontSize: 8,
                                        minWidth: 16,
                                        height: 14,
                                        borderRadius: 7,
                                        background: c.color + '25',
                                        color: c.color,
                                        border: `1px solid ${c.color}44`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {c.badge}
                                </span>
                            )}
                        </div>
                    ))}
                    {/* Redis sub line */}
                    <div
                        style={{
                            marginTop: 'auto',
                            padding: '6px 8px',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <div style={{ ...LBL, fontSize: 7.5 }}>REDIS</div>
                        <div style={{ color: '#4ade80', fontSize: 7.5 }}>pub/sub ●</div>
                    </div>
                </div>

                {/* Live feed */}
                <div
                    style={{
                        flex: 1,
                        overflow: 'hidden',
                        padding: '4px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0,
                    }}
                >
                    <div style={{ ...LBL, padding: '4px 10px 8px', fontSize: 8 }}>LIVE FEED</div>
                    {feed.map((m, i) => (
                        <div
                            key={`${m.ch}-${m.msg.slice(0, 12)}-${cursor.current - feed.length + i}`}
                            data-msg
                            style={{
                                padding: '6px 10px',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                transition: 'opacity 0.35s',
                                opacity: i === 0 ? 1 : 1,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                <span
                                    style={{
                                        fontSize: 7.5,
                                        padding: '1px 5px',
                                        borderRadius: 2,
                                        background: chColor(m.ch) + '18',
                                        color: chColor(m.ch),
                                        letterSpacing: '0.08em',
                                    }}
                                >
                                    {m.ch}
                                </span>
                                <span style={{ ...LBL, fontSize: 7.5 }}>{m.time} ago</span>
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9.5, lineHeight: 1.35 }}>
                                {m.msg}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   4. SPATIAL — code analysis + CI pipeline
   ═══════════════════════════════════════════════════════════════════ */
const CODE_LINES = [
    { n: 44, code: 'export async function submitOrder(', indent: 0, hl: false },
    { n: 45, code: '  payload: OrderPayload', indent: 0, hl: false },
    { n: 46, code: ') {', indent: 0, hl: false },
    { n: 47, code: '  const data = fetch(endpoint,', indent: 0, hl: true },
    { n: 48, code: '    { method: "POST", body }', indent: 0, hl: true },
    { n: 49, code: '  )', indent: 0, hl: false },
    { n: 50, code: '  return data.json()', indent: 0, hl: false },
    { n: 51, code: '}', indent: 0, hl: false },
];

export function SpatialDiagram({ accent, accent2 }: { accent: string; accent2?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [ciState, setCiState] = useState<'running' | 'pass'>('running');

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const ctx = gsap.context(() => {
            const lines$ = el.querySelectorAll<HTMLElement>('[data-ln]');
            const issue$ = el.querySelector<HTMLElement>('[data-issue]');
            const ci$ = el.querySelector<HTMLElement>('[data-ci]');
            gsap.set(el, { opacity: 0, y: 14 });
            gsap.set(lines$, { opacity: 0 });
            gsap.set([issue$, ci$], { opacity: 0, y: 6 });

            gsap.timeline({
                scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
                defaults: { ease: 'power2.out' },
            })
                .to(el, { opacity: 1, y: 0, duration: 0.5 })
                .to(lines$, { opacity: 1, duration: 0.22, stagger: 0.055 }, '-=0.2')
                .to(issue$, { opacity: 1, y: 0, duration: 0.4 }, '-=0.1')
                .call(() => setCiState('pass'))
                .to(ci$, { opacity: 1, y: 0, duration: 0.4 }, '+=0.3');
        }, el);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={ref} style={{ ...PANEL, opacity: 0 }}>
            <div style={BAR}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Pip color={accent} glow />
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>SPATIAL ANALYSIS</span>
                </div>
                <div
                    data-ci
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        opacity: 0,
                        fontSize: 9,
                        padding: '2px 7px',
                        borderRadius: 3,
                        background: ciState === 'pass' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.06)',
                        color: ciState === 'pass' ? '#4ade80' : 'rgba(255,255,255,0.4)',
                        border: `1px solid ${ciState === 'pass' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        transition: 'all 0.4s',
                        letterSpacing: '0.08em',
                    }}
                >
                    {ciState === 'pass' ? '✓ CI PASS' : '⟳ RUNNING'}
                </div>
            </div>

            {/* File tree */}
            <div
                style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    gap: 16,
                }}
            >
                {['useForm.ts ●', 'api.ts', 'types.ts'].map((f, i) => (
                    <span
                        key={i}
                        style={{
                            fontSize: 9,
                            color: i === 0 ? accent : 'rgba(255,255,255,0.4)',
                            letterSpacing: '0.04em',
                        }}
                    >
                        {f}
                    </span>
                ))}
            </div>

            {/* Code panel */}
            <div style={{ padding: '8px 0', background: 'rgba(0,0,0,0.25)' }}>
                {CODE_LINES.map((l) => (
                    <div
                        key={l.n}
                        data-ln
                        style={{
                            display: 'flex',
                            gap: 8,
                            padding: '1.5px 12px',
                            background: l.hl ? `${accent}10` : 'transparent',
                            borderLeft: l.hl ? `2px solid ${accent}` : '2px solid transparent',
                        }}
                    >
                        <span style={{ ...LBL, fontSize: 9, width: 18, textAlign: 'right', flexShrink: 0 }}>
                            {l.n}
                        </span>
                        <span
                            style={{
                                fontSize: 9.5,
                                color: l.hl ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)',
                                whiteSpace: 'pre',
                            }}
                        >
                            {l.code}
                        </span>
                    </div>
                ))}
            </div>

            {/* Issue banner */}
            <div
                data-issue
                style={{
                    margin: '8px 10px',
                    padding: '7px 10px',
                    borderRadius: 6,
                    background: `${accent2 ?? accent}12`,
                    border: `1px solid ${accent2 ?? accent}30`,
                    opacity: 0,
                }}
            >
                <div
                    style={{
                        color: accent2 ?? accent,
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        marginBottom: 3,
                    }}
                >
                    ⚠ UNHANDLED PROMISE · line 47–48
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>
                    fetch() not awaited — add await or .catch() handler
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   5. MCP UI — schema-to-component live bridge
   ═══════════════════════════════════════════════════════════════════ */
const SCHEMA_LINES = [
    '{ "type": "form",',
    '  "title": "Checkout",',
    '  "fields": [',
    '    { "id": "name",',
    '      "type": "text" },',
    '    { "id": "card",',
    '      "type": "card" },',
    '    { "id": "submit" }',
    '  ]',
    '}',
];

const COMPONENTS = [
    { label: 'TextInput', sub: 'name · required', ready: true },
    { label: 'CardField', sub: 'card · secure input', ready: true },
    { label: 'SubmitBtn', sub: 'primary · full-width', ready: true },
];

export function MCPDiagram({ accent, accent2 }: { accent: string; accent2?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const ctx = gsap.context(() => {
            const schema$ = el.querySelectorAll<HTMLElement>('[data-sl]');
            const arrow$ = el.querySelector<HTMLElement>('[data-arrow]');
            const comps$ = el.querySelectorAll<HTMLElement>('[data-comp]');
            gsap.set(el, { opacity: 0, y: 14 });
            gsap.set(schema$, { opacity: 0, x: -8 });
            gsap.set(arrow$, { opacity: 0, scaleX: 0, transformOrigin: 'left center' });
            gsap.set(comps$, { opacity: 0, x: 12 });

            gsap.timeline({
                scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
                defaults: { ease: 'power2.out' },
            })
                .to(el, { opacity: 1, y: 0, duration: 0.5 })
                .to(schema$, { opacity: 1, x: 0, duration: 0.22, stagger: 0.045 }, '-=0.2')
                .to(arrow$, { opacity: 1, scaleX: 1, duration: 0.55, ease: 'power3.inOut' }, '-=0.05')
                .call(() => setProgress(100))
                .to(comps$, { opacity: 1, x: 0, duration: 0.35, stagger: 0.12 }, '-=0.1');
        }, el);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={ref} style={{ ...PANEL, opacity: 0 }}>
            <div style={BAR}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Pip color={accent} glow />
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>MCP BRIDGE</span>
                </div>
                <span style={{ ...LBL, fontSize: 9 }}>SCHEMA → COMPONENT</span>
            </div>

            <div style={{ display: 'flex', gap: 0, minHeight: 200 }}>
                {/* JSON schema */}
                <div
                    style={{
                        flex: '0 0 42%',
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        padding: '10px 0',
                        background: 'rgba(0,0,0,0.2)',
                    }}
                >
                    <div style={{ ...LBL, padding: '0 10px 6px', fontSize: 8 }}>JSON SCHEMA</div>
                    {SCHEMA_LINES.map((l, i) => (
                        <div
                            key={i}
                            data-sl
                            style={{
                                padding: '1px 10px',
                                fontSize: 8.5,
                                color: 'rgba(255,255,255,0.5)',
                                whiteSpace: 'pre',
                                lineHeight: 1.6,
                            }}
                        >
                            {l}
                        </div>
                    ))}
                </div>

                {/* Transform arrow */}
                <div
                    style={{
                        flex: '0 0 12%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                    }}
                >
                    <div data-arrow style={{ opacity: 0, textAlign: 'center' }}>
                        <svg width="24" height="40" viewBox="0 0 24 40">
                            <path
                                d="M12 4 L12 32 M6 26 L12 36 L18 26"
                                stroke={accent}
                                strokeWidth="1.5"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray="4 3"
                            />
                        </svg>
                        <div
                            style={{
                                fontSize: 7,
                                color: accent,
                                letterSpacing: '0.06em',
                                marginTop: 2,
                                textAlign: 'center',
                            }}
                        >
                            {progress}%
                        </div>
                    </div>
                </div>

                {/* Components */}
                <div style={{ flex: 1, padding: '10px 0' }}>
                    <div style={{ ...LBL, padding: '0 10px 6px', fontSize: 8 }}>RENDERED</div>
                    {COMPONENTS.map((c) => (
                        <div
                            key={c.label}
                            data-comp
                            style={{
                                margin: '0 8px 6px',
                                padding: '6px 9px',
                                borderRadius: 6,
                                border: `1px solid ${accent}30`,
                                background: `${accent}0a`,
                            }}
                        >
                            <div
                                style={{
                                    color: 'rgba(255,255,255,0.85)',
                                    fontSize: 9.5,
                                    fontWeight: 600,
                                    letterSpacing: '0.04em',
                                }}
                            >
                                {c.label}
                            </div>
                            <div style={{ ...LBL, marginTop: 2 }}>{c.sub}</div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    marginTop: 4,
                                }}
                            >
                                <Pip color={accent} />
                                <span style={{ color: accent, fontSize: 8 }}>ready</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    padding: '6px 12px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.015)',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                }}
            >
                <div style={{ color: accent, fontSize: 11, fontWeight: 600 }}>3</div>
                <div style={{ ...LBL }}>COMPONENTS GENERATED</div>
                <div style={{ marginLeft: 'auto', color: accent2 ?? accent, fontSize: 9 }}>
                    0 errors · 0 warnings
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   6. PWA BUILDS — parallel pipeline dashboard
   ═══════════════════════════════════════════════════════════════════ */
const TRACKS = [
    { name: 'COMPILE', pct: 100, time: '8s', cached: false, color: '' },
    { name: 'ASSETS', pct: 44, time: '3s', cached: true, color: '' },
    { name: 'BUNDLE', pct: 100, time: '4s', cached: false, color: '' },
    { name: 'TYPES', pct: 100, time: '2s', cached: false, color: '' },
];

export function PWADiagram({ accent, accent2 }: { accent: string; accent2?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const ctx = gsap.context(() => {
            const tracks$ = el.querySelectorAll<HTMLElement>('[data-track]');
            const bars$ = el.querySelectorAll<HTMLElement>('[data-bar]');
            const footer$ = el.querySelector<HTMLElement>('[data-footer]');
            gsap.set(el, { opacity: 0, y: 14 });
            gsap.set(tracks$, { opacity: 0, x: -10 });
            gsap.set(footer$, { opacity: 0, y: 8 });

            const tl = gsap
                .timeline({
                    scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
                    defaults: { ease: 'power2.out' },
                })
                .to(el, { opacity: 1, y: 0, duration: 0.5 })
                .to(tracks$, { opacity: 1, x: 0, duration: 0.3, stagger: 0.07 }, '-=0.2');

            bars$.forEach((bar, i) => {
                const track = TRACKS[i];
                if (!track) return;
                const targetW = track.cached ? '44%' : '100%';
                tl.fromTo(
                    bar,
                    { width: '0%' },
                    {
                        width: targetW,
                        duration: track.cached ? 0.25 : 0.7,
                        ease: track.cached ? 'power2.out' : 'power3.inOut',
                    },
                    i === 0 ? '-=0.15' : `-=${0.5 - i * 0.1}`
                );
            });

            tl.call(() => setDone(true)).to(footer$, { opacity: 1, y: 0, duration: 0.4 }, '+=0.1');
        }, el);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={ref} style={{ ...PANEL, opacity: 0 }}>
            <div style={BAR}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Pip color={accent} glow />
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>BUILD PIPELINE</span>
                </div>
                <div
                    style={{
                        fontSize: 9,
                        padding: '2px 7px',
                        borderRadius: 3,
                        background: done ? 'rgba(74,222,128,0.12)' : `${accent}18`,
                        color: done ? '#4ade80' : accent,
                        border: `1px solid ${done ? 'rgba(74,222,128,0.3)' : `${accent}30`}`,
                        letterSpacing: '0.08em',
                        transition: 'all 0.4s',
                    }}
                >
                    {done ? '✓ DONE' : '⟳ RUNNING'}
                </div>
            </div>

            {/* Tracks */}
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TRACKS.map((track, i) => (
                    <div key={track.name} data-track style={{ opacity: 0 }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 5,
                                alignItems: 'center',
                            }}
                        >
                            <span
                                style={{
                                    color: 'rgba(255,255,255,0.6)',
                                    fontSize: 9,
                                    letterSpacing: '0.1em',
                                }}
                            >
                                {track.name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {track.cached && (
                                    <span
                                        style={{
                                            fontSize: 7.5,
                                            padding: '1px 5px',
                                            borderRadius: 3,
                                            background: `${accent2 ?? accent}20`,
                                            color: accent2 ?? accent,
                                            border: `1px solid ${accent2 ?? accent}35`,
                                            letterSpacing: '0.06em',
                                        }}
                                    >
                                        CACHE HIT
                                    </span>
                                )}
                                <span style={{ ...LBL, fontSize: 9 }}>{track.time}</span>
                            </div>
                        </div>
                        {/* Track bar */}
                        <div
                            style={{
                                height: 6,
                                borderRadius: 3,
                                background: 'rgba(255,255,255,0.07)',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            <div
                                data-bar
                                style={{
                                    height: '100%',
                                    borderRadius: 3,
                                    width: '0%',
                                    background: track.cached
                                        ? `linear-gradient(90deg, ${accent2 ?? accent}, ${accent})`
                                        : i % 2 === 0
                                          ? accent
                                          : `linear-gradient(90deg, ${accent}, ${accent2 ?? accent})`,
                                    boxShadow: `0 0 8px ${accent}55`,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div
                data-footer
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.015)',
                    opacity: 0,
                }}
            >
                <div>
                    <div style={{ color: '#4ade80', fontSize: 13, fontWeight: 600, lineHeight: 1 }}>
                        3m 02s
                    </div>
                    <div style={{ ...LBL, marginTop: 2 }}>TOTAL BUILD</div>
                </div>
                <div>
                    <div
                        style={{
                            color: accent,
                            fontSize: 13,
                            fontWeight: 600,
                            lineHeight: 1,
                            textAlign: 'right',
                        }}
                    >
                        −80%
                    </div>
                    <div style={{ ...LBL, marginTop: 2 }}>vs BASELINE</div>
                </div>
                <div>
                    <div
                        style={{
                            color: 'rgba(255,255,255,0.75)',
                            fontSize: 13,
                            fontWeight: 600,
                            lineHeight: 1,
                            textAlign: 'right',
                        }}
                    >
                        14→9
                    </div>
                    <div style={{ ...LBL, marginTop: 2 }}>CHUNKS</div>
                </div>
            </div>
        </div>
    );
}
