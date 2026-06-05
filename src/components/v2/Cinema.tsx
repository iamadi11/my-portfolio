'use client';

import { useEffect, useRef, useState, ReactNode, useCallback } from 'react';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   Morphing Line Sculpture — organic breathing rings + cursor
   ============================================================ */
function noise(x: number, y: number, t: number): number {
    return (
        Math.sin(x * 0.72 + t * 0.3) * Math.cos(y * 0.58 - t * 0.2) +
        Math.sin((x + y) * 0.48 + t * 0.14) * 0.55 +
        Math.cos(x * 0.3 - y * 0.68 + t * 0.1) * 0.32 +
        Math.sin(x * 1.1 - y * 0.4 + t * 0.22) * 0.18
    );
}

export function MorphingCanvas({
    speed = 'slow',
    accentRGB = [201, 162, 39],
}: {
    speed?: 'normal' | 'slow' | 'off';
    accentRGB?: [number, number, number];
}): JSX.Element {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || speed === 'off') return () => {};
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

        const ctx = canvas.getContext('2d');
        if (!ctx) return () => {};

        const dpr = Math.min(2, window.devicePixelRatio || 1);
        let w = 0,
            h = 0,
            raf = 0,
            running = true;
        const speedMul = speed === 'slow' ? 0.35 : 1;
        const [cr, cg, cb] = accentRGB;

        const resize = () => {
            const r = canvas.getBoundingClientRect();
            w = r.width;
            h = r.height;
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            mouse.current.x = mouse.current.tx = w * 0.58;
            mouse.current.y = mouse.current.ty = h * 0.46;
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        const onMove = (e: MouseEvent) => {
            const r = canvas.getBoundingClientRect();
            mouse.current.tx = e.clientX - r.left;
            mouse.current.ty = e.clientY - r.top;
        };
        const onLeave = () => {
            mouse.current.tx = w * 0.58;
            mouse.current.ty = h * 0.46;
        };
        window.addEventListener('mousemove', onMove, { passive: true });
        canvas.addEventListener('mouseleave', onLeave);

        const RINGS = 22;
        const PTS = 200;
        let time = Math.random() * 50;

        const frame = () => {
            if (!running) return;
            raf = requestAnimationFrame(frame);
            time += 0.0035 * speedMul;

            const m = mouse.current;
            m.x += (m.tx - m.x) * 0.035;
            m.y += (m.ty - m.y) * 0.035;

            ctx.clearRect(0, 0, w, h);

            const cx = w < 640 ? w * 0.5 : w * 0.58;
            const cy = h * 0.46;
            const maxR = Math.min(w, h) * 0.38;

            for (let ring = 0; ring < RINGS; ring++) {
                const ringRatio = ring / RINGS;
                const baseR = 18 + ringRatio * maxR;
                const alpha = (1 - ringRatio * 0.7) * 0.13 + 0.015;
                const noiseAmp = 12 + ringRatio * 28;

                ctx.beginPath();
                for (let i = 0; i <= PTS; i++) {
                    const a = (i / PTS) * Math.PI * 2;
                    const nx = Math.cos(a) * 2.2 + ring * 0.22;
                    const ny = Math.sin(a) * 2.2 + ring * 0.22;
                    const n = noise(nx, ny, time + ring * 0.06);
                    const r = baseR + n * noiseAmp;

                    let px = cx + Math.cos(a) * r;
                    let py = cy + Math.sin(a) * r;

                    const dx = px - m.x;
                    const dy = py - m.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const push = Math.max(0, 1 - dist / 220) * 35;
                    if (push > 0.5) {
                        const pa = Math.atan2(dy, dx);
                        px += Math.cos(pa) * push;
                        py += Math.sin(pa) * push;
                    }

                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
                ctx.lineWidth = 0.6 + (1 - ringRatio) * 0.5;
                ctx.stroke();
            }

            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.3);
            grd.addColorStop(0, `rgba(${cr},${cg},${cb},0.045)`);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, w, h);
        };

        raf = requestAnimationFrame(frame);

        return () => {
            running = false;
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener('mousemove', onMove);
            canvas.removeEventListener('mouseleave', onLeave);
        };
    }, [speed, accentRGB[0], accentRGB[1], accentRGB[2]]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
            aria-hidden="true"
        />
    );
}

/* ============================================================
   Magnetic button — velocity-aware hover offset
   ============================================================ */
export function MagBtn({
    children,
    className = '',
    onClick,
    href,
    target,
    rel,
    style,
    'aria-label': ariaLabel,
}: {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    href?: string;
    target?: string;
    rel?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}): JSX.Element {
    const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
    const [off, setOff] = useState({ x: 0, y: 0 });

    const onMove = (e: React.MouseEvent) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        setOff({
            x: (e.clientX - r.left - r.width / 2) * 0.22,
            y: (e.clientY - r.top - r.height / 2) * 0.22,
        });
    };
    const onLeave = () => setOff({ x: 0, y: 0 });

    const s: React.CSSProperties = {
        ...style,
        transform: `translate(${off.x}px,${off.y}px)`,
        transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
    };

    if (href) {
        return (
            <a
                ref={ref as React.RefObject<HTMLAnchorElement>}
                href={href}
                target={target}
                rel={rel}
                className={className}
                style={s}
                onMouseMove={onMove}
                onMouseLeave={onLeave}
                aria-label={ariaLabel}
            >
                {children}
            </a>
        );
    }
    return (
        <button
            ref={ref as React.RefObject<HTMLButtonElement>}
            className={className}
            style={s}
            onClick={onClick}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            aria-label={ariaLabel}
        >
            {children}
        </button>
    );
}

/* ============================================================
   Cinematic canvas hero — reactive orbs + light streaks
   ============================================================ */
export function CinematicHero({
    palette = ['#7aa2ff', '#b690ff', '#7ee5ff'],
}: {
    palette?: string[];
}): JSX.Element {
    const ref = useRef<HTMLCanvasElement>(null);
    const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return () => {};
        const ctx = canvas.getContext('2d');
        if (!ctx) return () => {};
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        let w = 0,
            h = 0,
            raf = 0;

        const resize = () => {
            const r = canvas.getBoundingClientRect();
            w = r.width;
            h = r.height;
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        const onMove = (e: MouseEvent) => {
            const r = canvas.getBoundingClientRect();
            mouse.current.tx = (e.clientX - r.left) / r.width - 0.5;
            mouse.current.ty = (e.clientY - r.top) / r.height - 0.5;
        };
        window.addEventListener('mousemove', onMove);

        const streaks = Array.from({ length: 28 }, (_, i) => ({
            x: Math.random(),
            y: Math.random(),
            v: 0.0002 + Math.random() * 0.0005,
            len: 80 + Math.random() * 240,
            alpha: 0.06 + Math.random() * 0.14,
            color: palette[i % palette.length],
            angle: -0.22 + Math.random() * 0.08,
        }));

        const orbs = Array.from({ length: 6 }, (_, i) => ({
            x: 0.15 + Math.random() * 0.7,
            y: 0.25 + Math.random() * 0.5,
            r: 80 + Math.random() * 200,
            color: palette[i % palette.length],
            vx: (Math.random() - 0.5) * 0.00005,
            vy: (Math.random() - 0.5) * 0.00005,
        }));

        const frame = () => {
            mouse.current.x += (mouse.current.tx - mouse.current.x) * 0.055;
            mouse.current.y += (mouse.current.ty - mouse.current.y) * 0.055;
            ctx.clearRect(0, 0, w, h);

            for (const o of orbs) {
                o.x += o.vx + mouse.current.x * 0.00004;
                o.y += o.vy + mouse.current.y * 0.00004;
                if (o.x < 0.05 || o.x > 0.95) o.vx *= -1;
                if (o.y < 0.05 || o.y > 0.95) o.vy *= -1;
                const cx = o.x * w + mouse.current.x * 50;
                const cy = o.y * h + mouse.current.y * 35;
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, o.r);
                g.addColorStop(0, o.color + 'aa');
                g.addColorStop(0.4, o.color + '44');
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, w, h);
            }

            for (const s of streaks) {
                s.x += s.v;
                if (s.x > 1.15) s.x = -0.25;
                const sx = s.x * w + mouse.current.x * 20;
                const sy = s.y * h + mouse.current.y * 15;
                const ex = sx + Math.cos(s.angle) * s.len;
                const ey = sy + Math.sin(s.angle) * s.len;
                const g = ctx.createLinearGradient(sx, sy, ex, ey);
                g.addColorStop(0, 'transparent');
                g.addColorStop(0.45, s.color);
                g.addColorStop(1, 'transparent');
                ctx.strokeStyle = g;
                ctx.globalAlpha = s.alpha;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener('mousemove', onMove);
        };
    }, [palette.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

    return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

/* ============================================================
   Kinetic title — GSAP split-text entrance
   ============================================================ */
export function KineticTitle({
    text,
    delay = 0,
    className = '',
    stagger = 0.032,
    duration = 0.75,
}: {
    text: string;
    delay?: number;
    className?: string;
    stagger?: number;
    duration?: number;
}): JSX.Element {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return () => {};
        const chars = el.querySelectorAll<HTMLSpanElement>('.v2-kin-char');
        const ctx = gsap.context(() => {
            gsap.fromTo(
                chars,
                { y: '105%', rotateX: -25, opacity: 0 },
                {
                    y: 0,
                    rotateX: 0,
                    opacity: 1,
                    duration,
                    ease: 'power4.out',
                    stagger,
                    delay,
                }
            );
        }, el);
        return () => ctx.revert();
    }, [delay, stagger, duration]);

    const words = text.split(' ');
    return (
        <span ref={ref} className={className} style={{ perspective: 800 }}>
            {words.map((word, wi) => (
                <span
                    key={wi} // eslint-disable-line react/no-array-index-key
                    style={{ display: 'inline-block', marginRight: '0.22em' }}
                >
                    <span className="v2-kin-word">
                        {Array.from(word).map((char, ci) => (
                            <span
                                key={ci} // eslint-disable-line react/no-array-index-key
                                className="v2-kin-char"
                            >
                                {char}
                            </span>
                        ))}
                    </span>
                </span>
            ))}
        </span>
    );
}

/* ============================================================
   Kinetic line — single line slide-up reveal
   ============================================================ */
export function KineticLine({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}): JSX.Element {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return () => {};
        const ctx = gsap.context(() => {
            gsap.fromTo(
                el,
                { y: 32, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay }
            );
        }, el);
        return () => ctx.revert();
    }, [delay]);

    return (
        <span
            ref={ref}
            className={`v2-kin-line-wrap ${className}`}
            style={{ display: 'block', overflow: 'hidden' }}
        >
            {children}
        </span>
    );
}

/* ============================================================
   Tech orbit — animated concentric rings
   ============================================================ */
const INNER_NODES = [
    { label: 'TypeScript', color: '#3b82f6' },
    { label: 'Next.js', color: '#f0f0f0' },
    { label: 'GSAP', color: '#88ce02' },
    { label: 'Zustand', color: '#7aa2ff' },
];

const OUTER_NODES = [
    { label: 'Webpack', color: '#8DD6F9' },
    { label: 'Redis', color: '#ff6b7a' },
    { label: 'Node.js', color: '#6ee7a7' },
    { label: 'Tailwind', color: '#38bdf8' },
    { label: 'Turborepo', color: '#b690ff' },
    { label: 'PWA', color: '#ffb070' },
];

export function TechOrbit(): JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState<string | null>(null);

    const handleEnter = useCallback((label: string) => setHovered(label), []);
    const handleLeave = useCallback(() => setHovered(null), []);

    return (
        <div ref={containerRef} className="v2-orbit-system" aria-label="Technology ecosystem">
            {/* Orbit rings (decorative) */}
            <div className="v2-orbit-ring-track v2-orbit-ring-track-1" />
            <div className="v2-orbit-ring-track v2-orbit-ring-track-2" />

            {/* Core */}
            <div className="v2-orbit-core">
                <span className="v2-orbit-core-label">React</span>
                <div className="v2-orbit-core-glow" />
            </div>

            {/* Inner ring — rotates clockwise */}
            <div className="v2-orbit-ring v2-orbit-ring-1">
                {INNER_NODES.map((node, i) => {
                    const angle = (360 / INNER_NODES.length) * i - 90;
                    const rad = (angle * Math.PI) / 180;
                    const r = 110;
                    const x = Math.cos(rad) * r;
                    const y = Math.sin(rad) * r;
                    return (
                        <button
                            key={node.label}
                            className={`v2-orbit-node v2-orbit-node-inner${hovered === node.label ? 'hovered' : ''}`}
                            style={
                                {
                                    '--node-color': node.color,
                                    transform: `translate(${x}px, ${y}px)`,
                                } as React.CSSProperties
                            }
                            onMouseEnter={() => handleEnter(node.label)}
                            onMouseLeave={handleLeave}
                            aria-label={node.label}
                        >
                            {node.label}
                        </button>
                    );
                })}
            </div>

            {/* Outer ring — rotates counter-clockwise */}
            <div className="v2-orbit-ring v2-orbit-ring-2">
                {OUTER_NODES.map((node, i) => {
                    const angle = (360 / OUTER_NODES.length) * i - 90;
                    const rad = (angle * Math.PI) / 180;
                    const r = 195;
                    const x = Math.cos(rad) * r;
                    const y = Math.sin(rad) * r;
                    return (
                        <button
                            key={node.label}
                            className={`v2-orbit-node v2-orbit-node-outer${hovered === node.label ? 'hovered' : ''}`}
                            style={
                                {
                                    '--node-color': node.color,
                                    transform: `translate(${x}px, ${y}px)`,
                                } as React.CSSProperties
                            }
                            onMouseEnter={() => handleEnter(node.label)}
                            onMouseLeave={handleLeave}
                            aria-label={node.label}
                        >
                            {node.label}
                        </button>
                    );
                })}
            </div>

            {/* Tooltip */}
            {hovered && (
                <div className="v2-orbit-tooltip" role="status">
                    <span style={{ color: 'var(--node-color, var(--v2-accent))' }}>{hovered}</span>
                </div>
            )}
        </div>
    );
}

/* ============================================================
   Marquee ticker
   ============================================================ */
export function Marquee({ items }: { items: string[] }): JSX.Element {
    const arr = [...items, ...items, ...items];
    return (
        <div className="v2-marquee-wrap">
            <div className="v2-marquee-track">
                {arr.map((it, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <span key={i} className="v2-marquee-item">
                        <span className="v2-marquee-dot" />
                        {it}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ============================================================
   Animated counter (counts up on first intersect)
   ============================================================ */
export function Counter({
    to,
    suffix = '',
    duration = 1400,
    decimals = 0,
}: {
    to: number;
    suffix?: string;
    duration?: number;
    decimals?: number;
}): JSX.Element {
    const [val, setVal] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let started = false;
        let raf: number;
        const obs = new IntersectionObserver(
            (es) => {
                es.forEach((e) => {
                    if (e.isIntersecting && !started) {
                        started = true;
                        const t0 = performance.now();
                        const tick = (now: number) => {
                            const p = Math.min(1, (now - t0) / duration);
                            const eased = 1 - Math.pow(1 - p, 3);
                            setVal(eased * to);
                            if (p < 1) raf = requestAnimationFrame(tick);
                        };
                        raf = requestAnimationFrame(tick);
                    }
                });
            },
            { threshold: 0.4 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => {
            obs.disconnect();
            cancelAnimationFrame(raf);
        };
    }, [to, duration]);

    return (
        <span ref={ref}>
            {val.toFixed(decimals)}
            {suffix}
        </span>
    );
}

/* ============================================================
   Reveal on scroll — GSAP-powered
   ============================================================ */
export function Reveal({
    children,
    delay = 0,
    y = 24,
    ...rest
}: {
    children: ReactNode;
    delay?: number;
    y?: number;
    [key: string]: unknown;
}): JSX.Element {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return () => {};

        const ctx = gsap.context(() => {
            gsap.fromTo(
                el,
                { opacity: 0, y },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.75,
                    ease: 'power3.out',
                    delay: delay / 1000,
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 88%',
                        toggleActions: 'play none none none',
                        // scroller default set globally by ScrollSetup
                    },
                }
            );
        });
        return () => ctx.revert();
    }, [delay, y]);

    return (
        <div ref={ref} style={{ opacity: 0 }} {...rest}>
            {children}
        </div>
    );
}

/* ============================================================
   Section header
   ============================================================ */
export function SectionHeader({
    kicker,
    title,
    subtitle,
    right,
}: {
    kicker: string;
    title: string;
    subtitle?: string;
    right?: ReactNode;
}): JSX.Element {
    return (
        <div className="v2-sec-head">
            <div>
                <div className="v2-sec-kicker">{kicker}</div>
                <h2 className="v2-sec-h2">{title}</h2>
                {subtitle && <div className="v2-sec-sub">{subtitle}</div>}
            </div>
            {right}
        </div>
    );
}
