'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

/* ============================================================
   1. Risk Engine — live transaction stream + editable rules
   ============================================================ */
interface Rule {
    id: number;
    field: 'amount' | 'country' | 'velocity';
    op: '>' | '<' | '=';
    value: string | number;
    action: 'flag' | 'block';
    enabled: boolean;
}

interface Tx {
    id: number;
    amount: number;
    country: string;
    velocity: number;
    ts: string;
    action: 'pass' | 'flag' | 'block';
    rule: number | null;
}

function RiskEnginePOC() {
    const [rules, setRules] = useState<Rule[]>([
        { id: 1, field: 'amount', op: '>', value: 5000, action: 'flag', enabled: true },
        { id: 2, field: 'country', op: '=', value: 'NG', action: 'block', enabled: true },
        { id: 3, field: 'velocity', op: '>', value: 5, action: 'flag', enabled: true },
    ]);
    const [txs, setTxs] = useState<Tx[]>([]);
    const [paused, setPaused] = useState(false);
    const [stats, setStats] = useState({ total: 0, flagged: 0, blocked: 0 });
    const idRef = useRef(0);

    useEffect(() => {
        if (paused) return () => {};
        const countries = ['IN', 'US', 'GB', 'DE', 'NG', 'BR', 'SG', 'JP'];
        const interval = setInterval(() => {
            const tx: Omit<Tx, 'action' | 'rule'> = {
                id: ++idRef.current,
                amount: Math.floor(Math.random() * 9000) + 100,
                country: countries[Math.floor(Math.random() * countries.length)],
                velocity: Math.floor(Math.random() * 9) + 1,
                ts: new Date().toLocaleTimeString([], { hour12: false }),
            };
            let action: Tx['action'] = 'pass';
            let triggered: number | null = null;
            for (const r of rules) {
                if (!r.enabled) continue;
                const v = tx[r.field as keyof typeof tx] as number | string;
                const match =
                    r.op === '>'
                        ? (v as number) > Number(r.value)
                        : r.op === '<'
                          ? (v as number) < Number(r.value)
                          : String(v) === String(r.value);
                if (match) {
                    if (r.action === 'block') {
                        action = 'block';
                        triggered = r.id;
                        break;
                    }
                    if (r.action === 'flag' && (action as string) !== 'block') {
                        action = 'flag';
                        triggered = r.id;
                    }
                }
            }
            const full: Tx = { ...tx, action, rule: triggered };
            setTxs((prev) => [full, ...prev].slice(0, 20));
            setStats((s) => ({
                total: s.total + 1,
                flagged: s.flagged + (action === 'flag' ? 1 : 0),
                blocked: s.blocked + (action === 'block' ? 1 : 0),
            }));
        }, 700);
        return () => clearInterval(interval);
    }, [paused, rules]);

    const colors: Record<Tx['action'], string> = {
        pass: 'var(--v2-good)',
        flag: 'var(--v2-warn)',
        block: 'var(--v2-bad)',
    };

    return (
        <div className="v2-poc-split-grid">
            {/* Rules editor */}
            <div className="v2-poc-panel">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                    }}
                >
                    <span className="v2-poc-label" style={{ margin: 0 }}>
                        RULES · {rules.filter((r) => r.enabled).length}/{rules.length} ACTIVE
                    </span>
                    <button
                        className="v2-btn v2-btn-ghost"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => setPaused((p) => !p)}
                    >
                        {paused ? '▶ resume' : '❚❚ pause'}
                    </button>
                </div>
                {rules.map((r) => (
                    <div
                        key={r.id}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '20px 1fr 30px 60px 60px',
                            gap: 6,
                            alignItems: 'center',
                            padding: '6px 0',
                            borderBottom: '1px solid var(--v2-line)',
                            opacity: r.enabled ? 1 : 0.4,
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={r.enabled}
                            onChange={() =>
                                setRules((rs) =>
                                    rs.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x))
                                )
                            }
                            style={{ accentColor: 'var(--v2-accent)' }}
                        />
                        <select
                            value={r.field}
                            className="v2-poc-select"
                            onChange={(e) =>
                                setRules((rs) =>
                                    rs.map((x) =>
                                        x.id === r.id ? { ...x, field: e.target.value as Rule['field'] } : x
                                    )
                                )
                            }
                        >
                            <option value="amount">amount</option>
                            <option value="country">country</option>
                            <option value="velocity">velocity</option>
                        </select>
                        <select
                            value={r.op}
                            className="v2-poc-select"
                            onChange={(e) =>
                                setRules((rs) =>
                                    rs.map((x) =>
                                        x.id === r.id ? { ...x, op: e.target.value as Rule['op'] } : x
                                    )
                                )
                            }
                        >
                            <option value=">">&gt;</option>
                            <option value="<">&lt;</option>
                            <option value="=">=</option>
                        </select>
                        <input
                            value={r.value}
                            className="v2-poc-input-sm"
                            onChange={(e) =>
                                setRules((rs) =>
                                    rs.map((x) => (x.id === r.id ? { ...x, value: e.target.value } : x))
                                )
                            }
                        />
                        <select
                            value={r.action}
                            className="v2-poc-select"
                            style={{ color: colors[r.action] }}
                            onChange={(e) =>
                                setRules((rs) =>
                                    rs.map((x) =>
                                        x.id === r.id ? { ...x, action: e.target.value as Rule['action'] } : x
                                    )
                                )
                            }
                        >
                            <option value="flag">flag</option>
                            <option value="block">block</option>
                        </select>
                    </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
                    {(
                        [
                            ['total', stats.total, 'var(--v2-ink)'],
                            ['flagged', stats.flagged, 'var(--v2-warn)'],
                            ['blocked', stats.blocked, 'var(--v2-bad)'],
                        ] as [string, number, string][]
                    ).map(([k, v, c]) => (
                        <div
                            key={k}
                            style={{
                                padding: '8px 10px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 8,
                                border: '1px solid var(--v2-line)',
                            }}
                        >
                            <div
                                className="v2-mono"
                                style={{
                                    fontSize: 9.5,
                                    color: 'var(--v2-ink-3)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {k}
                            </div>
                            <div className="v2-display" style={{ fontSize: 18, fontWeight: 600, color: c }}>
                                {v}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Transaction stream */}
            <div className="v2-poc-stream">
                <span className="v2-poc-label">LIVE STREAM</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {txs.length === 0 && (
                        <div style={{ color: 'var(--v2-ink-3)', fontSize: 12, padding: 12 }}>
                            Waiting for transactions…
                        </div>
                    )}
                    {txs.map((tx) => (
                        <div
                            key={tx.id}
                            className="v2-mono v2-tx-row"
                            style={{
                                fontSize: 11,
                                padding: '6px 8px',
                                borderRadius: 6,
                                background:
                                    tx.action === 'block'
                                        ? 'rgba(255,107,122,0.08)'
                                        : tx.action === 'flag'
                                          ? 'rgba(255,176,112,0.06)'
                                          : 'rgba(255,255,255,0.02)',
                                borderLeft: `2px solid ${colors[tx.action]}`,
                                animation: 'v2TxIn .35s cubic-bezier(.2,.8,.2,1)',
                            }}
                        >
                            <span style={{ color: 'var(--v2-ink-3)' }}>{tx.ts}</span>
                            <span style={{ color: 'var(--v2-ink-2)' }}>
                                #{String(tx.id).padStart(4, '0')}
                            </span>
                            <span>{tx.country}</span>
                            <span style={{ color: 'var(--v2-ink-2)' }}>v{tx.velocity}</span>
                            <span>${tx.amount}</span>
                            <span style={{ color: colors[tx.action], textAlign: 'right', fontWeight: 600 }}>
                                {tx.action.toUpperCase()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   2. Maps — polygon zones with point-in-polygon test
   ============================================================ */
function MapsPOC() {
    const [tier, setTier] = useState('1h');
    const [pin, setPin] = useState({ x: 200, y: 150 });
    const ref = useRef<HTMLDivElement>(null);

    const polygons = useMemo(
        () => ({
            '15m': [
                [160, 90],
                [260, 80],
                [300, 140],
                [270, 200],
                [180, 200],
                [140, 150],
            ] as [number, number][],
            '1h': [
                [100, 60],
                [330, 50],
                [370, 160],
                [330, 230],
                [150, 240],
                [80, 170],
            ] as [number, number][],
            std: [
                [40, 40],
                [400, 30],
                [450, 180],
                [400, 270],
                [100, 290],
                [20, 200],
            ] as [number, number][],
        }),
        []
    );

    const pointInPoly = (pt: [number, number], poly: [number, number][]) => {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const [xi, yi] = poly[i],
                [xj, yj] = poly[j];
            const intersect =
                yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    };

    const result = useMemo(() => {
        if (pointInPoly([pin.x, pin.y], polygons['15m']))
            return { label: '15-MIN EXPRESS', color: 'var(--v2-good)' };
        if (pointInPoly([pin.x, pin.y], polygons['1h']))
            return { label: '1-HOUR DELIVERY', color: 'var(--v2-accent)' };
        if (pointInPoly([pin.x, pin.y], polygons['std']))
            return { label: 'STANDARD', color: 'var(--v2-warn)' };
        return { label: 'OUT OF SERVICE', color: 'var(--v2-bad)' };
    }, [pin, polygons]);

    const onMove = (e: React.MouseEvent | React.TouchEvent) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const t = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
        setPin({ x: ((t.clientX - r.left) / r.width) * 480, y: ((t.clientY - r.top) / r.height) * 320 });
    };

    const tiers = [
        { key: '15m', color: '#6ee7a7', label: '15-min express' },
        { key: '1h', color: '#7aa2ff', label: '1-hr delivery' },
        { key: 'std', color: '#ffb070', label: 'Standard' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {tiers.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTier(t.key)}
                        className="v2-btn"
                        style={{
                            padding: '6px 10px',
                            fontSize: 11,
                            borderColor: tier === t.key ? t.color : 'var(--v2-line-2)',
                            background: tier === t.key ? t.color + '22' : 'rgba(255,255,255,0.04)',
                        }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                background: t.color,
                                display: 'inline-block',
                                marginRight: 6,
                            }}
                        />
                        {t.label}
                    </button>
                ))}
                <span
                    className="v2-mono v2-chip"
                    style={{
                        marginLeft: 'auto',
                        background: result.color + '22',
                        borderColor: result.color,
                        color: result.color,
                    }}
                >
                    {result.label}
                </span>
            </div>
            <div
                ref={ref}
                onMouseMove={(e) => e.buttons === 1 && onMove(e)}
                onMouseDown={onMove}
                onTouchMove={onMove}
                onTouchStart={onMove}
                style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '480/320',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--v2-line)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    cursor: 'crosshair',
                    touchAction: 'none',
                }}
            >
                <svg
                    viewBox="0 0 480 320"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                >
                    <defs>
                        <pattern id="mp-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                            <path
                                d="M 32 0 L 0 0 0 32"
                                fill="none"
                                stroke="rgba(255,255,255,0.04)"
                                strokeWidth="1"
                            />
                        </pattern>
                    </defs>
                    <rect width="480" height="320" fill="url(#mp-grid)" />
                    {tiers
                        .slice()
                        .reverse()
                        .map((t) => (
                            <g
                                key={t.key}
                                style={{ opacity: tier === t.key ? 1 : 0.3, transition: 'opacity .3s' }}
                            >
                                <polygon
                                    points={(polygons as Record<string, [number, number][]>)[t.key]
                                        .map((p) => p.join(','))
                                        .join(' ')}
                                    fill={t.color + '22'}
                                    stroke={t.color}
                                    strokeWidth="1.4"
                                />
                            </g>
                        ))}
                    {[
                        [200, 140],
                        [330, 180],
                    ].map((h, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <g key={i}>
                            <circle cx={h[0]} cy={h[1]} r="20" fill="rgba(255,255,255,0.05)">
                                <animate
                                    attributeName="r"
                                    values="20;30;20"
                                    dur="2.4s"
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="opacity"
                                    values="0.5;0;0.5"
                                    dur="2.4s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                            <circle cx={h[0]} cy={h[1]} r="3" fill="white" />
                        </g>
                    ))}
                    <g transform={`translate(${pin.x},${pin.y})`}>
                        <circle r="14" fill={result.color + '33'} />
                        <circle r="6" fill={result.color} stroke="white" strokeWidth="1.5" />
                        <line x1="-10" y1="0" x2="10" y2="0" stroke="white" strokeWidth="1" opacity="0.6" />
                        <line x1="0" y1="-10" x2="0" y2="10" stroke="white" strokeWidth="1" opacity="0.6" />
                    </g>
                </svg>
            </div>
        </div>
    );
}

/* ============================================================
   3. Pulse — realtime SSE/WebPush simulation
   ============================================================ */
interface LogEntry {
    id: number;
    ts: string;
    type: string;
    ch: string;
    sev: string;
    lat: number;
}

function PulsePOC() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [connected, setConnected] = useState(true);
    const [latency, setLatency] = useState(0);
    const idRef = useRef(0);

    useEffect(() => {
        if (!connected) return () => {};
        const events = [
            { type: 'order.placed', ch: 'sse', sev: 'info' },
            { type: 'rider.assigned', ch: 'webpush', sev: 'info' },
            { type: 'sla.warn', ch: 'sse', sev: 'warn' },
            { type: 'order.delivered', ch: 'sse', sev: 'good' },
            { type: 'sla.breach', ch: 'webpush', sev: 'bad' },
            { type: 'cache.invalidate', ch: 'redis', sev: 'info' },
        ];
        const interval = setInterval(() => {
            const e = events[Math.floor(Math.random() * events.length)];
            const lat = 600 + Math.floor(Math.random() * 1400);
            setLatency(lat);
            setLogs((prev) =>
                [
                    {
                        id: ++idRef.current,
                        ts: new Date().toLocaleTimeString([], { hour12: false }),
                        type: e.type,
                        ch: e.ch,
                        sev: e.sev,
                        lat,
                    },
                    ...prev,
                ].slice(0, 16)
            );
        }, 1100);
        return () => clearInterval(interval);
    }, [connected]);

    const sevColor: Record<string, string> = {
        info: 'var(--v2-accent)',
        warn: 'var(--v2-warn)',
        good: 'var(--v2-good)',
        bad: 'var(--v2-bad)',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                    className="v2-btn"
                    onClick={() => setConnected((c) => !c)}
                    style={{
                        padding: '6px 10px',
                        fontSize: 11,
                        background: connected ? 'rgba(110,231,167,0.1)' : 'rgba(255,107,122,0.1)',
                        borderColor: connected ? 'var(--v2-good)' : 'var(--v2-bad)',
                        color: connected ? 'var(--v2-good)' : 'var(--v2-bad)',
                    }}
                >
                    {connected ? '● connected' : '○ disconnected'}
                </button>
                {['SSE', 'WebPush', 'Redis'].map((ch) => (
                    <span key={ch} className="v2-mono v2-chip">
                        {ch}
                    </span>
                ))}
                <span
                    className="v2-mono"
                    style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--v2-ink-3)' }}
                >
                    latency:{' '}
                    <span style={{ color: latency < 1200 ? 'var(--v2-good)' : 'var(--v2-warn)' }}>
                        {latency}ms
                    </span>
                </span>
            </div>
            <div className="v2-poc-stream">
                {logs.length === 0 && (
                    <div style={{ color: 'var(--v2-ink-3)', fontSize: 12, padding: 14 }}>
                        Waiting for events…
                    </div>
                )}
                {logs.map((l) => (
                    <div
                        key={l.id}
                        className="v2-mono v2-pulse-row"
                        style={{
                            animation: 'v2PulseIn .4s cubic-bezier(.2,.8,.2,1)',
                        }}
                    >
                        <span style={{ color: 'var(--v2-ink-3)' }}>{l.ts}</span>
                        <span style={{ color: 'var(--v2-ink-2)' }}>{l.ch}</span>
                        <span style={{ color: sevColor[l.sev] }}>● {l.type}</span>
                        <span style={{ color: 'var(--v2-ink-3)', textAlign: 'right' }}>{l.lat}ms</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ============================================================
   4. Spatial — synthetic frame profiler
   ============================================================ */
interface PerfIssue {
    id: number;
    file: string;
    line: number;
    kind: string;
    dur: string;
}

function SpatialPOC() {
    const [running, setRunning] = useState(true);
    const [frames, setFrames] = useState<number[]>([]);
    const [issues, setIssues] = useState<PerfIssue[]>([]);
    const [budget, setBudget] = useState(16.7);
    const nRef = useRef(0);

    useEffect(() => {
        if (!running) return () => {};
        const interval = setInterval(() => {
            const n = ++nRef.current;
            const base = 8 + Math.sin(n * 0.3) * 2;
            const spike = n % 11 === 0 ? 24 + Math.random() * 12 : 0;
            const dur = base + spike + Math.random() * 3;
            setFrames((prev) => [...prev.slice(-39), dur]);
            if (dur > budget && spike) {
                setIssues((prev) =>
                    [
                        {
                            id: n,
                            file: ['Card.tsx', 'Modal.tsx', 'Drawer.tsx', 'List.tsx'][n % 4],
                            line: 30 + (n % 200),
                            kind: ['layout-thrash', 'sync-paint', 'heavy-render'][n % 3],
                            dur: dur.toFixed(1),
                        },
                        ...prev,
                    ].slice(0, 5)
                );
            }
        }, 220);
        return () => clearInterval(interval);
    }, [running, budget]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                    className="v2-btn"
                    onClick={() => setRunning((r) => !r)}
                    style={{ padding: '6px 10px', fontSize: 11 }}
                >
                    {running ? '❚❚ pause profiler' : '▶ run profiler'}
                </button>
                <span className="v2-mono" style={{ fontSize: 11, color: 'var(--v2-ink-3)' }}>
                    budget
                </span>
                <input
                    type="range"
                    min="8"
                    max="33"
                    step="0.5"
                    value={budget}
                    onChange={(e) => setBudget(+e.target.value)}
                    style={{ accentColor: 'var(--v2-accent)' }}
                />
                <span className="v2-mono" style={{ fontSize: 11 }}>
                    {budget.toFixed(1)}ms
                </span>
            </div>
            {/* Frame chart */}
            <div
                className="v2-poc-stream"
                style={{ height: 160, padding: 12, position: 'relative', minHeight: 0 }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: '100%' }}>
                    {/* eslint-disable react/no-array-index-key */}
                    {frames.map((f, i) => {
                        const over = f > budget;
                        const height = Math.min(100, (f / 35) * 100);
                        return (
                            <div
                                key={i}
                                style={{
                                    flex: 1,
                                    height: height + '%',
                                    background: over ? 'var(--v2-bad)' : 'var(--v2-accent)',
                                    opacity: 0.4 + (i / frames.length) * 0.6,
                                    borderRadius: 2,
                                    transition: 'height .2s',
                                }}
                                title={f.toFixed(1) + 'ms'}
                            />
                        );
                    })}
                    {/* eslint-enable react/no-array-index-key */}
                </div>
                <div
                    style={{
                        position: 'absolute',
                        left: 12,
                        right: 12,
                        top: `calc(100% - 12px - ${Math.min(100, (budget / 35) * 100)}%)`,
                        borderTop: '1px dashed var(--v2-ink-3)',
                    }}
                >
                    <span
                        className="v2-mono"
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: -16,
                            fontSize: 9,
                            color: 'var(--v2-ink-3)',
                        }}
                    >
                        budget
                    </span>
                </div>
            </div>
            {/* Issues */}
            <div className="v2-poc-panel">
                <span className="v2-poc-label">DETECTED · {issues.length}</span>
                {issues.length === 0 && (
                    <div style={{ color: 'var(--v2-ink-3)', fontSize: 12 }}>
                        No issues yet — tighten the budget.
                    </div>
                )}
                {issues.map((i) => (
                    <div
                        key={i.id}
                        className="v2-mono"
                        style={{
                            display: 'flex',
                            gap: 12,
                            fontSize: 11,
                            padding: '4px 0',
                            color: 'var(--v2-ink-2)',
                        }}
                    >
                        <span style={{ color: 'var(--v2-bad)' }}>{i.kind}</span>
                        <span>
                            {i.file}:<span style={{ color: 'var(--v2-accent)' }}>{i.line}</span>
                        </span>
                        <span style={{ marginLeft: 'auto', color: 'var(--v2-warn)' }}>{i.dur}ms</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ============================================================
   5. MCP UI — schema-driven dynamic UI generator
   ============================================================ */
type SchemaKey = 'form' | 'chart' | 'grid' | 'table';

function McpRender({ schema }: { schema: Record<string, unknown> }) {
    if (schema.kind === 'form') {
        const fields = schema.fields as { name: string; type: string; label: string; options?: string[] }[];
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {fields.map((f) => (
                    <label key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span className="v2-mono" style={{ fontSize: 10, color: 'var(--v2-ink-3)' }}>
                            {f.label}
                        </span>
                        {f.type === 'select' ? (
                            <select className="v2-poc-select">
                                {(f.options || []).map((o) => (
                                    <option key={o}>{o}</option>
                                ))}
                            </select>
                        ) : (
                            <input type={f.type} className="v2-poc-input-sm" placeholder={f.label} />
                        )}
                    </label>
                ))}
                <button
                    className="v2-btn v2-btn-primary"
                    style={{ marginTop: 6, fontSize: 12, padding: '8px 12px' }}
                >
                    submit
                </button>
            </div>
        );
    }
    if (schema.kind === 'chart') {
        const data = schema.data as number[];
        return (
            <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{schema.title as string}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140 }}>
                    {/* eslint-disable react/no-array-index-key */}
                    {data.map((v, i) => (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                height: v * 100 + '%',
                                background: 'linear-gradient(180deg, var(--v2-accent), var(--v2-accent-2))',
                                borderRadius: 2,
                                opacity: 0.7,
                            }}
                        />
                    ))}
                    {/* eslint-enable react/no-array-index-key */}
                </div>
            </div>
        );
    }
    if (schema.kind === 'grid') {
        const tiles = schema.tiles as { l: string; v: string }[];
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {/* eslint-disable react/no-array-index-key */}
                {tiles.map((t, i) => (
                    <div
                        key={i}
                        style={{
                            padding: 12,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--v2-line)',
                            borderRadius: 8,
                        }}
                    >
                        <div className="v2-mono" style={{ fontSize: 10, color: 'var(--v2-ink-3)' }}>
                            {t.l}
                        </div>
                        <div
                            className="v2-display"
                            style={{ fontSize: 22, fontWeight: 600, color: 'var(--v2-accent)' }}
                        >
                            {t.v}
                        </div>
                    </div>
                ))}
                {/* eslint-enable react/no-array-index-key */}
            </div>
        );
    }
    if (schema.kind === 'table') {
        const headers = schema.headers as string[];
        const rows = schema.rows as string[][];
        return (
            <table className="v2-mono" style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {headers.map((h) => (
                            <th
                                key={h}
                                style={{
                                    textAlign: 'left',
                                    padding: '6px 8px',
                                    color: 'var(--v2-ink-3)',
                                    borderBottom: '1px solid var(--v2-line)',
                                }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* eslint-disable react/no-array-index-key */}
                    {rows.map((r, i) => (
                        <tr key={i}>
                            {r.map((c, j) => (
                                <td
                                    key={j}
                                    style={{
                                        padding: '6px 8px',
                                        color: 'var(--v2-ink-2)',
                                        borderBottom: '1px solid var(--v2-line)',
                                    }}
                                >
                                    {c}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {/* eslint-enable react/no-array-index-key */}
                </tbody>
            </table>
        );
    }
    return null;
}

function McpPOC() {
    const [schema, setSchema] = useState<SchemaKey>('chart');
    const schemas: Record<SchemaKey, object> = {
        form: {
            kind: 'form',
            fields: [
                { name: 'merchant_id', type: 'text', label: 'Merchant ID' },
                { name: 'amount', type: 'number', label: 'Amount (USD)' },
                { name: 'priority', type: 'select', label: 'Priority', options: ['low', 'high'] },
            ],
        },
        chart: {
            kind: 'chart',
            title: 'Risk score (last 24h)',
            data: Array.from({ length: 24 }, () => Math.random()),
        },
        grid: {
            kind: 'grid',
            tiles: [
                { l: 'Total Tx', v: '1.2M' },
                { l: 'Flagged', v: '342' },
                { l: 'p99', v: '118ms' },
                { l: 'Uptime', v: '99.97%' },
            ],
        },
        table: {
            kind: 'table',
            headers: ['ID', 'Merchant', 'Status'],
            rows: [
                ['#1042', 'Acme', 'approved'],
                ['#1043', 'Globex', 'flagged'],
                ['#1044', 'Initech', 'approved'],
            ],
        },
    };
    const cur = schemas[schema] as Record<string, unknown>;

    return (
        <div className="v2-poc-split-grid">
            <div className="v2-poc-stream" style={{ minHeight: 0 }}>
                <span className="v2-poc-label">SCHEMA · MCP RESPONSE</span>
                <pre
                    className="v2-mono"
                    style={{ fontSize: 11, color: 'var(--v2-ink-2)', margin: 0, whiteSpace: 'pre-wrap' }}
                >
                    {JSON.stringify(cur, null, 2)}
                </pre>
                <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                    {(Object.keys(schemas) as SchemaKey[]).map((k) => (
                        <button
                            key={k}
                            className="v2-btn v2-btn-ghost"
                            onClick={() => setSchema(k)}
                            style={{
                                padding: '4px 8px',
                                fontSize: 10,
                                borderColor: schema === k ? 'var(--v2-accent)' : 'var(--v2-line)',
                                background: schema === k ? 'rgba(122,162,255,0.1)' : 'transparent',
                                color: schema === k ? 'var(--v2-accent)' : 'var(--v2-ink-2)',
                            }}
                        >
                            {k}
                        </button>
                    ))}
                </div>
            </div>
            <div className="v2-poc-panel" style={{ minHeight: 240 }}>
                <span className="v2-poc-label" style={{ color: 'var(--v2-accent)' }}>
                    RENDERED UI
                </span>
                <McpRender schema={cur} />
            </div>
        </div>
    );
}

/* ============================================================
   6. Pipeline — build pipeline with cache simulation
   ============================================================ */
interface Stage {
    name: string;
    dur: number;
    done: boolean;
    hit: boolean;
}

function PipelinePOC() {
    const [running, setRunning] = useState(false);
    const [cacheMode, setCacheMode] = useState<'cold' | 'warm'>('warm');
    const [stages, setStages] = useState<Stage[]>([
        { name: 'install', dur: 0, done: false, hit: false },
        { name: 'lint', dur: 0, done: false, hit: false },
        { name: 'typecheck', dur: 0, done: false, hit: false },
        { name: 'build', dur: 0, done: false, hit: false },
        { name: 'test', dur: 0, done: false, hit: false },
        { name: 'deploy', dur: 0, done: false, hit: false },
    ]);

    const run = () => {
        setRunning(true);
        const cold = [42, 18, 14, 92, 38, 22];
        const warm = [12, 4, 3, 18, 9, 12];
        const hitMap =
            cacheMode === 'warm'
                ? [true, true, true, true, true, false]
                : [false, false, false, false, false, false];
        const durs = cacheMode === 'warm' ? warm : cold;
        setStages((s) => s.map((st, i) => ({ ...st, dur: 0, done: false, hit: hitMap[i] })));
        let i = 0;
        const next = () => {
            if (i >= durs.length) {
                setRunning(false);
                return;
            }
            const target = durs[i];
            const t0 = performance.now();
            const tick = () => {
                const d = Math.min(target, (performance.now() - t0) / 30);
                setStages((s) => s.map((st, idx) => (idx === i ? { ...st, dur: d } : st)));
                if (d < target) requestAnimationFrame(tick);
                else {
                    setStages((s) =>
                        s.map((st, idx) => (idx === i ? { ...st, dur: target, done: true } : st))
                    );
                    i++;
                    setTimeout(next, 60);
                }
            };
            tick();
        };
        next();
    };

    const total = stages.reduce((a, b) => a + b.dur, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                    className="v2-btn v2-btn-primary"
                    onClick={run}
                    disabled={running}
                    style={{ padding: '6px 12px', fontSize: 12, opacity: running ? 0.6 : 1 }}
                >
                    {running ? '⟳ running…' : '▶ run pipeline'}
                </button>
                <div style={{ display: 'flex', gap: 4 }}>
                    {(['cold', 'warm'] as const).map((m) => (
                        <button
                            key={m}
                            className="v2-btn v2-btn-ghost"
                            onClick={() => setCacheMode(m)}
                            style={{
                                padding: '6px 10px',
                                fontSize: 11,
                                borderColor: cacheMode === m ? 'var(--v2-accent)' : 'var(--v2-line)',
                                background: cacheMode === m ? 'rgba(122,162,255,0.1)' : 'transparent',
                                color: cacheMode === m ? 'var(--v2-accent)' : 'var(--v2-ink-2)',
                            }}
                        >
                            {m} cache
                        </button>
                    ))}
                </div>
                <span
                    className="v2-mono"
                    style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--v2-ink-2)' }}
                >
                    total:{' '}
                    <span
                        style={{
                            color:
                                total < 60
                                    ? 'var(--v2-good)'
                                    : total < 120
                                      ? 'var(--v2-warn)'
                                      : 'var(--v2-bad)',
                            fontWeight: 600,
                        }}
                    >
                        {total.toFixed(1)}s
                    </span>
                </span>
            </div>
            <div className="v2-poc-stream" style={{ minHeight: 0, padding: 14 }}>
                {/* eslint-disable react/no-array-index-key */}
                {stages.map((s, idx) => {
                    const max = cacheMode === 'cold' ? 100 : 30;
                    const pct = Math.min(100, (s.dur / max) * 100);
                    return (
                        <div
                            key={idx}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '90px 1fr 60px 50px',
                                gap: 10,
                                alignItems: 'center',
                                marginBottom: 8,
                            }}
                        >
                            <span className="v2-mono" style={{ fontSize: 11 }}>
                                {s.name}
                            </span>
                            <div
                                style={{
                                    height: 18,
                                    background: 'rgba(255,255,255,0.04)',
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    position: 'relative',
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        width: pct + '%',
                                        background: s.hit
                                            ? 'linear-gradient(90deg,var(--v2-good),var(--v2-accent-3))'
                                            : 'linear-gradient(90deg,var(--v2-accent),var(--v2-accent-2))',
                                        transition: 'width .15s',
                                    }}
                                />
                                {!s.done && s.dur > 0 && (
                                    <div
                                        className="v2-shimmer"
                                        style={{ position: 'absolute', inset: 0, opacity: 0.5 }}
                                    />
                                )}
                            </div>
                            <span className="v2-mono" style={{ fontSize: 11, color: 'var(--v2-ink-2)' }}>
                                {s.dur.toFixed(1)}s
                            </span>
                            <span
                                className="v2-mono"
                                style={{ fontSize: 9, color: s.hit ? 'var(--v2-good)' : 'var(--v2-ink-3)' }}
                            >
                                {s.hit ? '✓ HIT' : '— MISS'}
                            </span>
                        </div>
                    );
                })}
                {/* eslint-enable react/no-array-index-key */}
            </div>
        </div>
    );
}

/* ============================================================
   Dispatcher
   ============================================================ */
const POC_MAP: Record<string, React.FC> = {
    risk: RiskEnginePOC,
    maps: MapsPOC,
    pulse: PulsePOC,
    spatial: SpatialPOC,
    mcp: McpPOC,
    pipeline: PipelinePOC,
};

export function ProjectPOC({ pocKey }: { pocKey: string }): JSX.Element | null {
    const C = POC_MAP[pocKey];
    if (!C) return null;
    return <C />;
}
