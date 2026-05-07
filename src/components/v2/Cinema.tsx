'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

/* ============================================================
   Cinematic canvas hero — drifting orbs + light streaks
   ============================================================ */
export function CinematicHero({ palette = ['#7aa2ff', '#b690ff', '#7ee5ff'] }: { palette?: string[] }) {
    const ref = useRef<HTMLCanvasElement>(null);
    const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
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

        const streaks = Array.from({ length: 24 }, (_, i) => ({
            x: Math.random(),
            y: Math.random(),
            v: 0.0002 + Math.random() * 0.0006,
            len: 60 + Math.random() * 200,
            alpha: 0.08 + Math.random() * 0.18,
            color: palette[i % palette.length],
            angle: -0.25 + Math.random() * 0.1,
        }));

        const orbs = Array.from({ length: 5 }, (_, i) => ({
            x: 0.2 + Math.random() * 0.6,
            y: 0.3 + Math.random() * 0.4,
            r: 100 + Math.random() * 160,
            color: palette[i % palette.length],
            vx: (Math.random() - 0.5) * 0.00006,
            vy: (Math.random() - 0.5) * 0.00006,
        }));

        const frame = () => {
            mouse.current.x += (mouse.current.tx - mouse.current.x) * 0.06;
            mouse.current.y += (mouse.current.ty - mouse.current.y) * 0.06;
            ctx.clearRect(0, 0, w, h);

            for (const o of orbs) {
                o.x += o.vx;
                o.y += o.vy;
                if (o.x < 0.1 || o.x > 0.9) o.vx *= -1;
                if (o.y < 0.1 || o.y > 0.9) o.vy *= -1;
                const cx = o.x * w + mouse.current.x * 30;
                const cy = o.y * h + mouse.current.y * 30;
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, o.r);
                g.addColorStop(0, o.color + '99');
                g.addColorStop(0.5, o.color + '33');
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, w, h);
            }

            for (const s of streaks) {
                s.x += s.v;
                if (s.x > 1.1) s.x = -0.2;
                const sx = s.x * w,
                    sy = s.y * h;
                const ex = sx + Math.cos(s.angle) * s.len;
                const ey = sy + Math.sin(s.angle) * s.len;
                const g = ctx.createLinearGradient(sx, sy, ex, ey);
                g.addColorStop(0, 'transparent');
                g.addColorStop(0.5, s.color);
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
   Marquee ticker
   ============================================================ */
export function Marquee({ items }: { items: string[] }) {
    const arr = [...items, ...items, ...items];
    return (
        <div className="v2-marquee-wrap">
            <div className="v2-marquee-track">
                {arr.map((it, i) => (
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
}) {
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
   Reveal on scroll
   ============================================================ */
export function Reveal({
    children,
    delay = 0,
    ...rest
}: {
    children: ReactNode;
    delay?: number;
    [key: string]: unknown;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            (es) => {
                es.forEach((e) => {
                    if (e.isIntersecting) {
                        setTimeout(() => el.classList.add('in'), delay);
                        obs.disconnect();
                    }
                });
            },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [delay]);

    return (
        <div ref={ref} className="v2-reveal" {...rest}>
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
}) {
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
