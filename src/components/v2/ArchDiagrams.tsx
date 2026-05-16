'use client';

import { useEffect, useRef } from 'react';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── Shared constants ──────────────────────────────────────────── */
function rgb(hex: string, a: number): string {
    const n = parseInt(hex.replace('#', ''), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
const W06 = 'rgba(255,255,255,0.06)';
const W10 = 'rgba(255,255,255,0.10)';
const W20 = 'rgba(255,255,255,0.20)';
const W40 = 'rgba(255,255,255,0.40)';
const MONO = "var(--font-jetbrains-mono,'JetBrains Mono',monospace)";

/* ═══════════════════════════════════════════════════════════════
   1. RISK ENGINE — transaction evaluation pipeline
   ═══════════════════════════════════════════════════════════════ */
export function RiskEngineDiagram({ accent }: { accent: string }) {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ctx = gsap.context(() => {
            gsap.set(el, { visibility: 'visible' });
            gsap.set(['.re-tx', '.re-engine', '.re-rule', '.re-conn', '.re-dec', '.re-meta'], {
                opacity: 0,
            });
            gsap.set('.re-pkt', { opacity: 0, attr: { cx: 50, cy: 100 } });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
                defaults: { ease: 'power3.out' },
            });

            tl.to('.re-engine', { opacity: 1, duration: 0.5 })
                .to('.re-tx', { opacity: 1, duration: 0.4 }, '-=0.2')
                .to('.re-rule', { opacity: 1, stagger: 0.1, duration: 0.35 }, '-=0.1')
                .to('.re-conn', { opacity: 1, stagger: 0.06, duration: 0.3 }, '-=0.2')
                .to('.re-dec', { opacity: 1, stagger: 0.1, duration: 0.35 }, '-=0.1')
                // Packet traversal
                .to('.re-pkt', { opacity: 1, duration: 0.1 }, '+=0.15')
                .to('.re-pkt', { attr: { cx: 118, cy: 100 }, duration: 0.65, ease: 'power2.inOut' })
                .to(
                    '.re-rule',
                    {
                        attr: { fill: rgb(accent, 0.85) },
                        stagger: 0.09,
                        duration: 0.14,
                        ease: 'none',
                    },
                    '-=0.1'
                )
                .to('.re-rule', { attr: { fill: W40 }, stagger: 0.09, duration: 0.2, ease: 'none' }, '+=0.05')
                .to('.re-pkt', { attr: { cx: 293, cy: 86 }, duration: 0.42, ease: 'power2.in' })
                .to(
                    '#re-block',
                    {
                        attr: { fill: rgb(accent, 0.16), stroke: rgb(accent, 0.5) },
                        duration: 0.3,
                    },
                    '-=0.1'
                )
                .to('.re-pkt', { opacity: 0, scale: 1.8, transformOrigin: '293px 86px', duration: 0.22 })
                .to('.re-meta', { opacity: 1, stagger: 0.07, duration: 0.3 })
                .call(() => {
                    // Flowing dashes idle
                    el.querySelectorAll<SVGElement>('.re-flow').forEach((line, i) => {
                        gsap.to(line, {
                            strokeDashoffset: -60,
                            duration: 1.6 + i * 0.2,
                            repeat: -1,
                            ease: 'none',
                        });
                    });
                    gsap.to('#re-block', {
                        attr: { stroke: rgb(accent, 0.6) },
                        duration: 1.4,
                        repeat: -1,
                        yoyo: true,
                        ease: 'power1.inOut',
                    });
                });
        }, el);
        return () => ctx.revert();
    }, [accent]);

    return (
        <svg
            ref={ref}
            viewBox="0 0 360 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%', visibility: 'hidden', overflow: 'visible' }}
            aria-hidden="true"
        >
            {/* TX source */}
            <g className="re-tx">
                <circle
                    cx="50"
                    cy="100"
                    r="24"
                    fill={rgb(accent, 0.07)}
                    stroke={rgb(accent, 0.22)}
                    strokeWidth="1"
                />
                <text x="50" y="97" textAnchor="middle" fontSize="9" fill={W40} fontFamily={MONO}>
                    TX
                </text>
                <text x="50" y="111" textAnchor="middle" fontSize="7" fill={W20} fontFamily={MONO}>
                    ~M/mo
                </text>
            </g>

            {/* TX → Engine lines */}
            <line className="re-conn" x1="74" y1="100" x2="116" y2="100" stroke={W10} strokeWidth="1" />
            <line
                className="re-conn re-flow"
                x1="74"
                y1="100"
                x2="116"
                y2="100"
                stroke={rgb(accent, 0.5)}
                strokeWidth="1.5"
                strokeDasharray="3 7"
                strokeDashoffset="0"
            />

            {/* Rule Engine rect */}
            <g className="re-engine">
                <rect
                    x="116"
                    y="50"
                    width="142"
                    height="100"
                    rx="10"
                    fill={W06}
                    stroke={W10}
                    strokeWidth="1"
                />
                <text
                    x="187"
                    y="68"
                    textAnchor="middle"
                    fontSize="7.5"
                    fill={W20}
                    fontFamily={MONO}
                    letterSpacing="0.1em"
                >
                    RULE ENGINE
                </text>
                <line x1="126" y1="75" x2="248" y2="75" stroke={W10} strokeWidth="0.5" />
            </g>

            {/* Rule conditions */}
            <text className="re-rule" x="128" y="92" fontSize="8.5" fill={W40} fontFamily={MONO}>
                amount {'>'} ₹10K
            </text>
            <text className="re-rule" x="128" y="107" fontSize="8.5" fill={W40} fontFamily={MONO}>
                country ∈ flag
            </text>
            <text className="re-rule" x="128" y="122" fontSize="8.5" fill={W40} fontFamily={MONO}>
                device = unknown
            </text>

            {/* Engine → decisions */}
            <line className="re-conn" x1="258" y1="100" x2="292" y2="86" stroke={W10} strokeWidth="1" />
            <line
                className="re-conn re-flow"
                x1="258"
                y1="100"
                x2="292"
                y2="86"
                stroke={rgb(accent, 0.45)}
                strokeWidth="1.5"
                strokeDasharray="3 7"
            />
            <line className="re-conn" x1="258" y1="100" x2="292" y2="118" stroke={W10} strokeWidth="1" />
            <line
                className="re-conn re-flow"
                x1="258"
                y1="100"
                x2="292"
                y2="118"
                stroke={W10}
                strokeWidth="1"
                strokeDasharray="2 10"
            />

            {/* BLOCK */}
            <g className="re-dec">
                <rect
                    id="re-block"
                    x="292"
                    y="72"
                    width="64"
                    height="28"
                    rx="5"
                    fill={rgb(accent, 0.08)}
                    stroke={rgb(accent, 0.28)}
                    strokeWidth="1"
                />
                <text x="324" y="90" textAnchor="middle" fontSize="9" fill={accent} fontFamily={MONO}>
                    BLOCK
                </text>
            </g>

            {/* PASS */}
            <g className="re-dec">
                <rect x="292" y="108" width="64" height="28" rx="5" fill={W06} stroke={W10} strokeWidth="1" />
                <text x="324" y="126" textAnchor="middle" fontSize="9" fill={W20} fontFamily={MONO}>
                    PASS
                </text>
            </g>

            {/* Meta */}
            <text className="re-meta" x="22" y="158" fontSize="8" fill={rgb(accent, 0.7)} fontFamily={MONO}>
                &lt;120ms
            </text>
            <text className="re-meta" x="22" y="170" fontSize="7" fill={W20} fontFamily={MONO}>
                p99 decision
            </text>
            <text
                className="re-meta"
                x="356"
                y="158"
                textAnchor="end"
                fontSize="8"
                fill={rgb(accent, 0.7)}
                fontFamily={MONO}
            >
                99.97%
            </text>
            <text
                className="re-meta"
                x="356"
                y="170"
                textAnchor="end"
                fontSize="7"
                fill={W20}
                fontFamily={MONO}
            >
                uptime
            </text>

            {/* Animated packet */}
            <circle className="re-pkt" cx="50" cy="100" r="4" fill={accent} />
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════════
   2. SERVICEABILITY MAPS — polygon zone assignment
   ═══════════════════════════════════════════════════════════════ */
export function MapsDiagram({ accent, accent2 }: { accent: string; accent2: string }) {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ctx = gsap.context(() => {
            gsap.set(el, { visibility: 'visible' });
            gsap.set(['.mp-outer', '.mp-mid', '.mp-inner', '.mp-label', '.mp-badge', '.mp-pin-line'], {
                opacity: 0,
            });
            gsap.set('.mp-pin-dot', { opacity: 0, scale: 0, transformOrigin: '180px 98px' });
            gsap.set('.mp-pin-line', { attr: { y2: 28 } });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
                defaults: { ease: 'power3.out' },
            });

            tl.to('.mp-outer', { opacity: 1, duration: 0.5 })
                .to('.mp-mid', { opacity: 1, duration: 0.45 }, '-=0.1')
                .to('.mp-inner', { opacity: 1, duration: 0.4 }, '-=0.1')
                .to('.mp-label', { opacity: 1, stagger: 0.1, duration: 0.35 }, '-=0.1')
                // Pin drops
                .to('.mp-pin-line', { opacity: 0.6, duration: 0.1 })
                .to('.mp-pin-line', { attr: { y2: 98 }, duration: 0.5, ease: 'power2.in' })
                .to('.mp-pin-dot', { opacity: 1, scale: 1, duration: 0.32, ease: 'back.out(1.5)' }, '-=0.1')
                // Inner zone highlights on hit
                .to('.mp-inner', {
                    attr: { fill: rgb(accent, 0.1), stroke: rgb(accent, 0.55) },
                    duration: 0.35,
                })
                .to('.mp-badge', { opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' })
                .call(() => {
                    gsap.to('.mp-inner', {
                        attr: { stroke: rgb(accent, 0.55) },
                        duration: 1.5,
                        repeat: -1,
                        yoyo: true,
                        ease: 'power1.inOut',
                    });
                    gsap.to('.mp-mid', {
                        attr: { stroke: rgb(accent2, 0.35) },
                        duration: 2.2,
                        repeat: -1,
                        yoyo: true,
                        ease: 'power1.inOut',
                        delay: 0.6,
                    });
                    gsap.to('.mp-pin-dot', {
                        attr: { r: 7 },
                        duration: 1.2,
                        repeat: -1,
                        yoyo: true,
                        ease: 'power1.inOut',
                    });
                });
        }, el);
        return () => ctx.revert();
    }, [accent, accent2]);

    return (
        <svg
            ref={ref}
            viewBox="0 0 360 200"
            fill="none"
            style={{ width: '100%', height: '100%', visibility: 'hidden', overflow: 'visible' }}
            aria-hidden="true"
        >
            {/* Zones */}
            <rect
                className="mp-outer"
                x="16"
                y="26"
                width="328"
                height="148"
                rx="12"
                fill={W06}
                stroke={W10}
                strokeWidth="1"
            />
            <rect
                className="mp-mid"
                x="50"
                y="50"
                width="260"
                height="100"
                rx="9"
                fill="rgba(255,255,255,0.03)"
                stroke={rgb(accent2, 0.18)}
                strokeWidth="1"
            />
            <rect
                className="mp-inner"
                x="84"
                y="72"
                width="192"
                height="52"
                rx="7"
                fill="rgba(255,255,255,0.03)"
                stroke={rgb(accent, 0.16)}
                strokeWidth="1"
            />

            {/* Zone labels */}
            <text className="mp-label" x="28" y="44" fontSize="7.5" fill={W20} fontFamily={MONO}>
                STANDARD
            </text>
            <text
                className="mp-label"
                x="62"
                y="67"
                fontSize="7.5"
                fill={rgb(accent2, 0.6)}
                fontFamily={MONO}
            >
                1-HOUR
            </text>
            <text
                className="mp-label"
                x="96"
                y="89"
                fontSize="7.5"
                fill={rgb(accent, 0.75)}
                fontFamily={MONO}
            >
                15-MIN
            </text>

            {/* SLA values */}
            <text
                className="mp-label"
                x="344"
                y="44"
                textAnchor="end"
                fontSize="7.5"
                fill={W20}
                fontFamily={MONO}
            >
                120+ cities
            </text>

            {/* Pin */}
            <line
                className="mp-pin-line"
                x1="180"
                y1="28"
                x2="180"
                y2="98"
                stroke={rgb(accent, 0.5)}
                strokeWidth="1.5"
                strokeDasharray="3 3"
            />
            <circle className="mp-pin-dot" cx="180" cy="98" r="5" fill={accent} />

            {/* Badge */}
            <g className="mp-badge" style={{ transform: 'translateY(6px)' }}>
                <rect
                    x="106"
                    y="146"
                    width="148"
                    height="28"
                    rx="6"
                    fill={rgb(accent, 0.1)}
                    stroke={rgb(accent, 0.32)}
                    strokeWidth="1"
                />
                <text x="180" y="164" textAnchor="middle" fontSize="9" fill={accent} fontFamily={MONO}>
                    ✓ 15-MIN DELIVERY
                </text>
            </g>
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════════
   3. REALTIME NOTIFICATIONS — Redis pub/sub fanout
   ═══════════════════════════════════════════════════════════════ */
export function RealtimeDiagram({ accent, accent2 }: { accent: string; accent2: string }) {
    const ref = useRef<SVGSVGElement>(null);

    // Endpoint positions (cx, cy) relative to center (180, 95)
    const endpoints = [
        { x: 62, y: 38, label: 'OPS' },
        { x: 298, y: 38, label: 'CX' },
        { x: 44, y: 158, label: 'RIDER' },
        { x: 316, y: 158, label: 'EMAIL' },
    ];

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ctx = gsap.context(() => {
            gsap.set(el, { visibility: 'visible' });
            gsap.set(['.rt-center', '.rt-conn', '.rt-node', '.rt-label', '.rt-meta', '.rt-pkt'], {
                opacity: 0,
            });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
                defaults: { ease: 'power3.out' },
            });

            tl.to('.rt-center', { opacity: 1, duration: 0.5 })
                .to('.rt-conn', { opacity: 1, stagger: 0.08, duration: 0.4 }, '-=0.1')
                .to('.rt-node', { opacity: 1, stagger: 0.08, duration: 0.35 }, '-=0.2')
                .to('.rt-label', { opacity: 1, stagger: 0.06, duration: 0.3 }, '-=0.2')
                .to('.rt-meta', { opacity: 1, stagger: 0.1, duration: 0.3 }, '-=0.1')
                // Packets fire outward
                .call(() => {
                    const pkts = el.querySelectorAll<SVGElement>('.rt-pkt');
                    pkts.forEach((pkt, i) => {
                        const ep = endpoints[i];
                        gsap.to(pkt, {
                            opacity: 1,
                            attr: { cx: ep.x, cy: ep.y },
                            duration: 0.55,
                            ease: 'power2.in',
                            delay: i * 0.07,
                            onComplete: () => {
                                // Node pulse on receipt
                                const nodeEl = el.querySelector<SVGElement>(`#rt-node-${i}`);
                                if (nodeEl)
                                    gsap.fromTo(
                                        nodeEl,
                                        { attr: { r: 18 } },
                                        {
                                            attr: { r: 22 },
                                            duration: 0.2,
                                            yoyo: true,
                                            repeat: 1,
                                            ease: 'power2.out',
                                        }
                                    );
                                gsap.to(pkt, { opacity: 0, duration: 0.15 });
                            },
                        });
                    });
                    // Repeating pulse loop
                    setTimeout(() => {
                        const loopFn = () => {
                            if (!el.isConnected) return;
                            pkts.forEach((pkt, i) => {
                                const ep = endpoints[i];
                                gsap.set(pkt, { attr: { cx: 180, cy: 95 }, opacity: 0 });
                                gsap.to(pkt, {
                                    opacity: 0.9,
                                    attr: { cx: ep.x, cy: ep.y },
                                    duration: 0.6,
                                    ease: 'power2.in',
                                    delay: i * 0.09 + 0.1,
                                    onComplete: () => gsap.to(pkt, { opacity: 0, duration: 0.15 }),
                                });
                            });
                            setTimeout(loopFn, 2400);
                        };
                        setTimeout(loopFn, 800);
                    }, 600);
                });
        }, el);
        return () => ctx.revert();
    }, [accent, accent2]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <svg
            ref={ref}
            viewBox="0 0 360 200"
            fill="none"
            style={{ width: '100%', height: '100%', visibility: 'hidden', overflow: 'visible' }}
            aria-hidden="true"
        >
            {/* Connection lines */}
            {endpoints.map((ep, i) => (
                <g key={i}>
                    <line
                        x1="180"
                        y1="95"
                        x2={ep.x}
                        y2={ep.y}
                        className="rt-conn"
                        stroke={W10}
                        strokeWidth="1"
                    />
                    <line
                        x1="180"
                        y1="95"
                        x2={ep.x}
                        y2={ep.y}
                        className="rt-conn"
                        stroke={rgb(accent, 0.25)}
                        strokeWidth="1"
                        strokeDasharray="2 8"
                    />
                </g>
            ))}

            {/* Endpoint nodes */}
            {endpoints.map((ep, i) => (
                <g key={i}>
                    <circle
                        id={`rt-node-${i}`}
                        className="rt-node"
                        cx={ep.x}
                        cy={ep.y}
                        r="18"
                        fill={W06}
                        stroke={W10}
                        strokeWidth="1"
                    />
                    <text
                        className="rt-label"
                        x={ep.x}
                        y={ep.y + 4}
                        textAnchor="middle"
                        fontSize="8"
                        fill={W40}
                        fontFamily={MONO}
                    >
                        {ep.label}
                    </text>
                </g>
            ))}

            {/* Center node — Redis */}
            <g className="rt-center">
                <circle
                    cx="180"
                    cy="95"
                    r="28"
                    fill={rgb(accent, 0.08)}
                    stroke={rgb(accent, 0.3)}
                    strokeWidth="1.5"
                />
                <text x="180" y="92" textAnchor="middle" fontSize="9" fill={accent} fontFamily={MONO}>
                    REDIS
                </text>
                <text x="180" y="104" textAnchor="middle" fontSize="7.5" fill={W20} fontFamily={MONO}>
                    pub/sub
                </text>
            </g>

            {/* Packet dots */}
            {endpoints.map((_, i) => (
                <circle key={i} className="rt-pkt" cx="180" cy="95" r="3.5" fill={accent} />
            ))}

            {/* Meta */}
            <text
                className="rt-meta"
                x="180"
                y="186"
                textAnchor="middle"
                fontSize="8"
                fill={rgb(accent, 0.7)}
                fontFamily={MONO}
            >
                &lt; 2s signal latency · 4 channels
            </text>
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════════
   4. SPATIAL — dev-time CI scanner
   ═══════════════════════════════════════════════════════════════ */
export function SpatialDiagram({ accent, accent2 }: { accent: string; accent2: string }) {
    const ref = useRef<SVGSVGElement>(null);

    const codeLines = [
        { y: 40, w: 90 },
        { y: 55, w: 120 },
        { y: 70, w: 70 },
        { y: 85, w: 110, issue: true },
        { y: 100, w: 80 },
        { y: 115, w: 130, issue: true },
        { y: 130, w: 60 },
        { y: 145, w: 100 },
    ];

    const reports = [
        { y: 68, label: 'layout thrash', color: accent2 },
        { y: 86, label: 'render hot-path', color: accent2 },
        { y: 104, label: 'CI · PASS ✓', color: accent },
    ];

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ctx = gsap.context(() => {
            gsap.set(el, { visibility: 'visible' });
            gsap.set(['.sp-code', '.sp-beam', '.sp-report', '.sp-meta', '.sp-badge'], { opacity: 0 });
            gsap.set('.sp-beam', { attr: { x: 12 } });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
                defaults: { ease: 'power3.out' },
            });

            tl
                // Code lines appear
                .to('.sp-code', { opacity: 1, stagger: 0.05, duration: 0.3 })
                // Scan beam sweeps across
                .to('.sp-beam', { opacity: 0.8, duration: 0.2 }, '-=0.1')
                .to('.sp-beam', { attr: { x: 310 }, duration: 1.1, ease: 'power1.inOut' })
                // Issue highlights appear mid-scan
                .to('#sp-issue-0', { opacity: 1, duration: 0.25 }, '-=0.7')
                .to('#sp-issue-1', { opacity: 1, duration: 0.25 }, '-=0.4')
                // Reports build up
                .to('.sp-beam', { opacity: 0, duration: 0.3 })
                .to('.sp-report', { opacity: 1, stagger: 0.15, duration: 0.35 }, '-=0.2')
                .to(
                    '.sp-badge',
                    {
                        opacity: 1,
                        scale: 1,
                        transformOrigin: '286px 105px',
                        duration: 0.4,
                        ease: 'back.out(1.3)',
                    },
                    '-=0.1'
                )
                .to('.sp-meta', { opacity: 1, duration: 0.3 })
                .call(() => {
                    // Badge gentle pulse
                    gsap.to('.sp-badge', {
                        attr: { stroke: rgb(accent, 0.65) },
                        duration: 1.5,
                        repeat: -1,
                        yoyo: true,
                        ease: 'power1.inOut',
                    });
                });
        }, el);
        return () => ctx.revert();
    }, [accent, accent2]);

    return (
        <svg
            ref={ref}
            viewBox="0 0 360 200"
            fill="none"
            style={{ width: '100%', height: '100%', visibility: 'hidden', overflow: 'visible' }}
            aria-hidden="true"
        >
            {/* Code block frame */}
            <rect x="12" y="28" width="155" height="150" rx="8" fill={W06} stroke={W10} strokeWidth="1" />
            <text x="20" y="42" fontSize="7" fill={W20} fontFamily={MONO} letterSpacing="0.1em">
                COMPONENT.TSX
            </text>
            <line x1="12" y1="48" x2="167" y2="48" stroke={W10} strokeWidth="0.5" />

            {/* Code lines */}
            {codeLines.map((line, i) => (
                <rect
                    key={i}
                    className="sp-code"
                    x="22"
                    y={line.y + 14}
                    width={line.w}
                    height="6"
                    rx="2"
                    fill={line.issue ? rgb(accent2, 0.25) : W10}
                />
            ))}

            {/* Issue highlights */}
            <rect
                id="sp-issue-0"
                className="sp-code"
                x="20"
                y={codeLines[3].y + 12}
                width={codeLines[3].w + 4}
                height="10"
                rx="2"
                fill={rgb(accent2, 0.18)}
                stroke={rgb(accent2, 0.45)}
                strokeWidth="0.5"
                opacity="0"
            />
            <rect
                id="sp-issue-1"
                className="sp-code"
                x="20"
                y={codeLines[5].y + 12}
                width={codeLines[5].w + 4}
                height="10"
                rx="2"
                fill={rgb(accent2, 0.18)}
                stroke={rgb(accent2, 0.45)}
                strokeWidth="0.5"
                opacity="0"
            />

            {/* Scan beam */}
            <rect className="sp-beam" x="12" y="28" width="2" height="150" rx="1" fill={rgb(accent, 0.7)} />

            {/* Report area */}
            <rect x="182" y="28" width="166" height="150" rx="8" fill={W06} stroke={W10} strokeWidth="1" />
            <text x="190" y="42" fontSize="7" fill={W20} fontFamily={MONO} letterSpacing="0.1em">
                ANALYSIS
            </text>
            <line x1="182" y1="48" x2="348" y2="48" stroke={W10} strokeWidth="0.5" />

            {/* Report entries */}
            {reports.map((r, i) => (
                <g key={i} className="sp-report">
                    <circle cx="194" cy={r.y} r="3" fill={rgb(r.color, 0.8)} />
                    <text x="202" y={r.y + 4} fontSize="8.5" fill={W40} fontFamily={MONO}>
                        {r.label}
                    </text>
                </g>
            ))}

            {/* CI Pass badge */}
            <g className="sp-badge" style={{ transform: 'scale(0.85)' }}>
                <rect
                    x="192"
                    y="118"
                    width="148"
                    height="28"
                    rx="6"
                    fill={rgb(accent, 0.1)}
                    stroke={rgb(accent, 0.35)}
                    strokeWidth="1"
                />
                <text x="266" y="136" textAnchor="middle" fontSize="9" fill={accent} fontFamily={MONO}>
                    CI PASS · 0 regressions
                </text>
            </g>

            {/* Meta */}
            <text className="sp-meta" x="182" y="186" fontSize="7.5" fill={W20} fontFamily={MONO}>
                dev-time · zero prod overhead · strict TS
            </text>
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════════
   5. MCP UI — schema-to-component protocol bridge
   ═══════════════════════════════════════════════════════════════ */
export function MCPDiagram({ accent, accent2 }: { accent: string; accent2: string }) {
    const ref = useRef<SVGSVGElement>(null);

    const jsonLines = [
        { key: '"type"', val: '"form"', y: 62 },
        { key: '"tool"', val: '"analytics"', y: 78 },
        { key: '"fields"', val: '[...]', y: 94 },
        { key: '"data"', val: '{...}', y: 110 },
        { key: '"chart"', val: '"bar"', y: 126 },
    ];

    const components = [
        { label: 'FORM', y: 62, icon: '▭', color: accent },
        { label: 'CHART', y: 100, icon: '▲', color: accent2 },
        { label: 'TABLE', y: 138, icon: '≡', color: accent },
    ];

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ctx = gsap.context(() => {
            gsap.set(el, { visibility: 'visible' });
            gsap.set(['.mc-frame', '.mc-json', '.mc-arrow', '.mc-comp', '.mc-pkt', '.mc-meta'], {
                opacity: 0,
            });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
                defaults: { ease: 'power3.out' },
            });

            tl.to('.mc-frame', { opacity: 1, stagger: 0.1, duration: 0.4 })
                .to('.mc-json', { opacity: 1, stagger: 0.08, duration: 0.3 }, '-=0.1')
                .to('.mc-arrow', { opacity: 1, duration: 0.3 }, '-=0.1')
                // Packets travel arrow
                .call(() => {
                    const pkts = el.querySelectorAll<SVGElement>('.mc-pkt');
                    pkts.forEach((pkt, i) => {
                        gsap.set(pkt, { attr: { cx: 174, cy: 100 }, opacity: 0 });
                        gsap.to(pkt, {
                            opacity: 1,
                            attr: { cx: 200, cy: 100 },
                            duration: 0.45,
                            ease: 'power2.inOut',
                            delay: 0.4 + i * 0.18,
                            onComplete: () => gsap.to(pkt, { opacity: 0, duration: 0.1 }),
                        });
                    });
                })
                // Components appear
                .to('.mc-comp', { opacity: 1, x: 0, stagger: 0.12, duration: 0.4 }, '+=0.2')
                .to('.mc-meta', { opacity: 1, duration: 0.3 })
                .call(() => {
                    // Arrow flow idle
                    el.querySelectorAll<SVGElement>('.mc-flow').forEach((line, i) => {
                        gsap.to(line, {
                            strokeDashoffset: -50,
                            duration: 1.4 + i * 0.15,
                            repeat: -1,
                            ease: 'none',
                        });
                    });
                    // Component pulse
                    el.querySelectorAll<SVGElement>('.mc-comp-rect').forEach((rect, i) => {
                        gsap.to(rect, {
                            attr: { stroke: rgb(i % 2 === 0 ? accent : accent2, 0.55) },
                            duration: 1.6 + i * 0.3,
                            repeat: -1,
                            yoyo: true,
                            ease: 'power1.inOut',
                            delay: i * 0.4,
                        });
                    });
                });
        }, el);
        return () => ctx.revert();
    }, [accent, accent2]);

    return (
        <svg
            ref={ref}
            viewBox="0 0 360 200"
            fill="none"
            style={{ width: '100%', height: '100%', visibility: 'hidden', overflow: 'visible' }}
            aria-hidden="true"
        >
            {/* JSON frame */}
            <rect
                className="mc-frame"
                x="12"
                y="30"
                width="158"
                height="140"
                rx="8"
                fill={W06}
                stroke={W10}
                strokeWidth="1"
            />
            <text x="20" y="44" fontSize="7" fill={W20} fontFamily={MONO} letterSpacing="0.1em">
                MCP TOOL RESULT
            </text>
            <text x="20" y="56" fontSize="8" fill={W10} fontFamily={MONO}>
                {'{'}
            </text>
            <text x="152" y="164" fontSize="8" fill={W10} fontFamily={MONO}>
                {'}'}
            </text>

            {/* JSON lines */}
            {jsonLines.map((line, i) => (
                <g key={i} className="mc-json">
                    <text x="28" y={line.y} fontSize="8.5" fill={rgb(accent2, 0.7)} fontFamily={MONO}>
                        {line.key}
                    </text>
                    <text x="78" y={line.y} fontSize="8.5" fill={W40} fontFamily={MONO}>
                        : {line.val}
                    </text>
                </g>
            ))}

            {/* Transform arrow */}
            <g className="mc-arrow">
                <line x1="174" y1="100" x2="200" y2="100" stroke={W10} strokeWidth="1.5" />
                <line
                    className="mc-flow"
                    x1="174"
                    y1="100"
                    x2="200"
                    y2="100"
                    stroke={rgb(accent, 0.6)}
                    strokeWidth="2"
                    strokeDasharray="3 6"
                    strokeDashoffset="0"
                />
                <polygon points="200,96 208,100 200,104" fill={rgb(accent, 0.7)} />
                <text x="191" y="88" textAnchor="middle" fontSize="7" fill={W20} fontFamily={MONO}>
                    map
                </text>
            </g>

            {/* Component frame */}
            <rect
                className="mc-frame"
                x="210"
                y="30"
                width="138"
                height="140"
                rx="8"
                fill={W06}
                stroke={W10}
                strokeWidth="1"
            />
            <text x="218" y="44" fontSize="7" fill={W20} fontFamily={MONO} letterSpacing="0.1em">
                UI COMPONENTS
            </text>

            {/* Components */}
            {components.map((c, i) => (
                <g key={i} className="mc-comp" style={{ transform: 'translateX(8px)' }}>
                    <rect
                        className="mc-comp-rect"
                        x="220"
                        y={c.y - 12}
                        width="120"
                        height="26"
                        rx="5"
                        fill={rgb(c.color, 0.08)}
                        stroke={rgb(c.color, 0.28)}
                        strokeWidth="1"
                    />
                    <text x="234" y={c.y + 4} fontSize="9" fill={c.color} fontFamily={MONO}>
                        {c.icon} {c.label}
                    </text>
                </g>
            ))}

            {/* Packets */}
            {[0, 1, 2].map((i) => (
                <circle key={i} className="mc-pkt" cx="174" cy="100" r="3" fill={accent} />
            ))}

            {/* Meta */}
            <text
                className="mc-meta"
                x="180"
                y="186"
                textAnchor="middle"
                fontSize="7.5"
                fill={W20}
                fontFamily={MONO}
            >
                Vite · Express · schema-first descriptors
            </text>
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════════
   6. PWA BUILD PIPELINE — parallel build with cache
   ═══════════════════════════════════════════════════════════════ */
export function PWADiagram({ accent, accent2 }: { accent: string; accent2: string }) {
    const ref = useRef<SVGSVGElement>(null);

    const pipelines = [
        { label: 'src/app', y: 56, fullWidth: 196, color: accent, steps: ['COMPILE', 'BUNDLE'] },
        { label: 'shared', y: 98, cacheHit: true, color: accent2 },
        { label: 'packages', y: 140, fullWidth: 196, color: accent, steps: ['LINT', 'BUNDLE'] },
    ];

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ctx = gsap.context(() => {
            gsap.set(el, { visibility: 'visible' });
            gsap.set(
                ['.pw-label', '.pw-track', '.pw-step', '.pw-cache', '.pw-check', '.pw-meta', '.pw-timer'],
                {
                    opacity: 0,
                }
            );
            gsap.set('.pw-bar', { scaleX: 0, transformOrigin: 'left center' });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
                defaults: { ease: 'power3.out' },
            });

            tl.to('.pw-track', { opacity: 1, stagger: 0.1, duration: 0.4 })
                .to('.pw-label', { opacity: 1, stagger: 0.08, duration: 0.3 }, '-=0.2')
                // Pipeline bars animate
                .to('#pw-bar-0', { scaleX: 1, opacity: 1, duration: 1.1, ease: 'power2.inOut' }, '-=0.1')
                .to('#pw-bar-2', { scaleX: 1, opacity: 1, duration: 1.1, ease: 'power2.inOut' }, '-=1.05')
                // Cache hit on middle bar
                .to('#pw-bar-1', { scaleX: 0.22, opacity: 1, duration: 0.3, ease: 'power3.out' }, '-=0.8')
                .to(
                    '.pw-cache',
                    { opacity: 1, scale: 1, transformOrigin: 'center', duration: 0.4, ease: 'back.out(1.3)' },
                    '-=0.2'
                )
                // Step labels
                .to('.pw-step', { opacity: 1, stagger: 0.05, duration: 0.25 }, '-=0.3')
                // Checkmarks
                .to('.pw-check', { opacity: 1, stagger: 0.08, duration: 0.3 }, '-=0.1')
                // Timer reveal
                .to('.pw-timer', { opacity: 1, duration: 0.4 })
                .to('.pw-meta', { opacity: 1, duration: 0.3 })
                .call(() => {
                    // Shimmer on active bars
                    el.querySelectorAll<SVGElement>('.pw-bar-shimmer').forEach((s, i) => {
                        gsap.fromTo(
                            s,
                            { x: -180 },
                            { x: 180, duration: 2.5, repeat: -1, ease: 'power1.inOut', delay: i * 0.6 }
                        );
                    });
                });
        }, el);
        return () => ctx.revert();
    }, [accent, accent2]);

    return (
        <svg
            ref={ref}
            viewBox="0 0 360 200"
            fill="none"
            style={{ width: '100%', height: '100%', visibility: 'hidden', overflow: 'visible' }}
            aria-hidden="true"
        >
            {/* Source labels */}
            {pipelines.map((p, i) => (
                <text
                    key={i}
                    className="pw-label"
                    x="10"
                    y={p.y + 5}
                    fontSize="8.5"
                    fill={W40}
                    fontFamily={MONO}
                >
                    {p.label}
                </text>
            ))}

            {/* Pipeline tracks */}
            {pipelines.map((p, i) => (
                <rect
                    key={i}
                    className="pw-track"
                    x="72"
                    y={p.y - 10}
                    width="218"
                    height="20"
                    rx="4"
                    fill={W06}
                    stroke={W10}
                    strokeWidth="1"
                />
            ))}

            {/* Progress bars */}
            {/* Bar 0: src/app — full */}
            <rect
                id="pw-bar-0"
                className="pw-bar"
                x="72"
                y={pipelines[0].y - 10}
                width="218"
                height="20"
                rx="4"
                fill={rgb(accent, 0.2)}
            />
            <clipPath id="pw-clip-0">
                <rect x="72" y={pipelines[0].y - 10} width="218" height="20" rx="4" />
            </clipPath>
            <rect
                className="pw-bar-shimmer"
                x="72"
                y={pipelines[0].y - 10}
                width="40"
                height="20"
                fill="rgba(255,255,255,0.06)"
                clipPath="url(#pw-clip-0)"
            />

            {/* Bar 1: shared — cache hit (short) */}
            <rect
                id="pw-bar-1"
                className="pw-bar"
                x="72"
                y={pipelines[1].y - 10}
                width="218"
                height="20"
                rx="4"
                fill={rgb(accent2, 0.2)}
            />

            {/* Bar 2: packages — full */}
            <rect
                id="pw-bar-2"
                className="pw-bar"
                x="72"
                y={pipelines[2].y - 10}
                width="218"
                height="20"
                rx="4"
                fill={rgb(accent, 0.2)}
            />
            <clipPath id="pw-clip-2">
                <rect x="72" y={pipelines[2].y - 10} width="218" height="20" rx="4" />
            </clipPath>
            <rect
                className="pw-bar-shimmer"
                x="72"
                y={pipelines[2].y - 10}
                width="40"
                height="20"
                fill="rgba(255,255,255,0.06)"
                clipPath="url(#pw-clip-2)"
            />

            {/* Step labels inside bars */}
            <text
                className="pw-step"
                x="110"
                y={pipelines[0].y + 5}
                fontSize="7.5"
                fill={W40}
                fontFamily={MONO}
            >
                COMPILE
            </text>
            <text
                className="pw-step"
                x="192"
                y={pipelines[0].y + 5}
                fontSize="7.5"
                fill={W40}
                fontFamily={MONO}
            >
                BUNDLE
            </text>
            <text
                className="pw-step"
                x="110"
                y={pipelines[2].y + 5}
                fontSize="7.5"
                fill={W40}
                fontFamily={MONO}
            >
                LINT
            </text>
            <text
                className="pw-step"
                x="192"
                y={pipelines[2].y + 5}
                fontSize="7.5"
                fill={W40}
                fontFamily={MONO}
            >
                BUNDLE
            </text>

            {/* Cache hit badge */}
            <g className="pw-cache" style={{ transform: 'scale(0.8)' }}>
                <rect
                    x="115"
                    y={pipelines[1].y - 10}
                    width="96"
                    height="20"
                    rx="4"
                    fill={rgb(accent2, 0.15)}
                    stroke={rgb(accent2, 0.4)}
                    strokeWidth="1"
                />
                <text
                    x="163"
                    y={pipelines[1].y + 5}
                    textAnchor="middle"
                    fontSize="8"
                    fill={accent2}
                    fontFamily={MONO}
                >
                    CACHE HIT ✓
                </text>
            </g>

            {/* Checkmarks */}
            {pipelines.map((p, i) => (
                <text
                    key={i}
                    className="pw-check"
                    x="298"
                    y={p.y + 5}
                    fontSize="9"
                    fill={i === 1 ? accent2 : accent}
                    fontFamily={MONO}
                >
                    ✓
                </text>
            ))}

            {/* Build timer */}
            <g className="pw-timer">
                <rect
                    x="72"
                    y="165"
                    width="218"
                    height="24"
                    rx="6"
                    fill={W06}
                    stroke={rgb(accent, 0.2)}
                    strokeWidth="1"
                />
                <text x="181" y="181" textAnchor="middle" fontSize="10" fill={W40} fontFamily={MONO}>
                    15:00
                </text>
                <text x="230" y="181" fontSize="8" fill={W20} fontFamily={MONO}>
                    →
                </text>
                <text x="248" y="181" fontSize="10" fill={accent} fontFamily={MONO}>
                    03:00
                </text>
                <text x="290" y="178" fontSize="7.5" fill={rgb(accent, 0.7)} fontFamily={MONO}>
                    −80%
                </text>
            </g>

            {/* Meta */}
            <text
                className="pw-meta"
                x="180"
                y="196"
                textAnchor="middle"
                fontSize="7.5"
                fill={W20}
                fontFamily={MONO}
            >
                Webpack 5 · Turborepo · remote cache
            </text>
        </svg>
    );
}
