/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable consistent-return */
'use client';

import { useEffect, useRef } from 'react';

/* ── Scene atmosphere definitions (matches PROJECTS order) ─────────
   Risk Engine → Maps → Realtime → Spatial → MCP UI → PWA Builds   */
const SCENES = [
    // 0 Risk Engine — authority, precision, blue/purple financial data
    {
        c1: [122, 162, 255] as [number, number, number],
        c2: [182, 144, 255] as [number, number, number],
        b: [
            [0.15, 0.2],
            [0.85, 0.8],
            [0.5, 0.45],
        ] as [number, number][],
        pdx: 1.2,
        pdy: -0.12,
        spd: 1.4,
        spread: 0.18,
    },
    // 1 Serviceability Maps — spatial, open, cyan geographic scale
    {
        c1: [126, 229, 255] as [number, number, number],
        c2: [122, 162, 255] as [number, number, number],
        b: [
            [0.72, 0.28],
            [0.28, 0.72],
            [0.5, 0.5],
        ] as [number, number][],
        pdx: 0.28,
        pdy: 0.55,
        spd: 0.65,
        spread: 0.7,
    },
    // 2 Realtime — urgency, alive, green signals bursting outward
    {
        c1: [110, 231, 167] as [number, number, number],
        c2: [126, 229, 255] as [number, number, number],
        b: [
            [0.5, 0.5],
            [0.5, 0.5],
            [0.5, 0.5],
        ] as [number, number][],
        pdx: 0,
        pdy: 0,
        spd: 1.9,
        spread: 1.0, // burst mode
    },
    // 3 Spatial — analytical, scanning left→right, warm orange
    {
        c1: [255, 176, 112] as [number, number, number],
        c2: [255, 138, 138] as [number, number, number],
        b: [
            [0.08, 0.5],
            [0.92, 0.5],
            [0.5, 0.5],
        ] as [number, number][],
        pdx: 1.55,
        pdy: 0.0,
        spd: 1.1,
        spread: 0.12,
    },
    // 4 MCP UI — connective, diagonal bridge, purple/blue
    {
        c1: [182, 144, 255] as [number, number, number],
        c2: [122, 162, 255] as [number, number, number],
        b: [
            [0.5, 0.22],
            [0.5, 0.78],
            [0.3, 0.5],
        ] as [number, number][],
        pdx: 0.85,
        pdy: 0.5,
        spd: 0.9,
        spread: 0.45,
    },
    // 5 PWA Builds — performance, vertical speed, orange warm
    {
        c1: [255, 176, 112] as [number, number, number],
        c2: [255, 138, 138] as [number, number, number],
        b: [
            [0.22, 0.06],
            [0.78, 0.94],
            [0.5, 0.5],
        ] as [number, number][],
        pdx: 0.12,
        pdy: 1.7,
        spd: 1.65,
        spread: 0.14,
    },
];

const N = 60; // particle count

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    angle: number;
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}
function clamp(v: number, lo: number, hi: number) {
    return v < lo ? lo : v > hi ? hi : v;
}
function smooth(t: number) {
    const c = clamp(t, 0, 1);
    return c * c * (3 - 2 * c);
}
function lerpRgb(a: [number, number, number], b: [number, number, number], t: number) {
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)] as [number, number, number];
}

export function CinematicUniverse() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const threadRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);
    const sfRef = useRef(0); // current sceneFloat (smoothed)
    const sfTargetRef = useRef(0); // raw sceneFloat from scroll
    const velRef = useRef(0); // scroll velocity magnitude
    const lastScrollRef = useRef(0);
    const particlesRef = useRef<Particle[]>([]);
    const sceneLayoutRef = useRef<{ top: number; h: number }[]>([]);
    const sizeRef = useRef({ W: 0, H: 0, dpr: 1 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const thread = threadRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        /* ── Resize ─────────────────────────────────────────────── */
        function resize() {
            const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
            const W = window.innerWidth;
            const H = window.innerHeight;
            sizeRef.current = { W, H, dpr };
            canvas!.width = W * dpr;
            canvas!.height = H * dpr;
            canvas!.style.width = W + 'px';
            canvas!.style.height = H + 'px';
            ctx!.scale(dpr, dpr);
        }

        /* ── Cache scene positions ───────────────────────────────── */
        function cacheLayout() {
            const els = document.querySelectorAll<HTMLElement>('.v2-project-scene');
            sceneLayoutRef.current = Array.from(els).map((el) => ({
                top: el.offsetTop,
                h: el.offsetHeight,
            }));
        }

        /* ── Compute scene float from scrollTop ─────────────────── */
        function toSceneFloat(scrollTop: number): number {
            const layout = sceneLayoutRef.current;
            if (!layout.length) return 0;
            for (let i = 0; i < layout.length; i++) {
                const { top, h } = layout[i];
                if (scrollTop < top + h) {
                    return i + clamp((scrollTop - top) / h, 0, 1);
                }
            }
            return layout.length - 1;
        }

        /* ── Interpolate atmosphere at sceneFloat ───────────────── */
        function atmosphere(sf: number) {
            const i0 = Math.floor(clamp(sf, 0, SCENES.length - 1));
            const i1 = Math.min(i0 + 1, SCENES.length - 1);
            const t = smooth(sf - i0);
            const a = SCENES[i0];
            const b = SCENES[i1];
            return {
                c1: lerpRgb(a.c1, b.c1, t),
                c2: lerpRgb(a.c2, b.c2, t),
                b0: [lerp(a.b[0][0], b.b[0][0], t), lerp(a.b[0][1], b.b[0][1], t)],
                b1: [lerp(a.b[1][0], b.b[1][0], t), lerp(a.b[1][1], b.b[1][1], t)],
                b2: [lerp(a.b[2][0], b.b[2][0], t), lerp(a.b[2][1], b.b[2][1], t)],
                pdx: lerp(a.pdx, b.pdx, t),
                pdy: lerp(a.pdy, b.pdy, t),
                spd: lerp(a.spd, b.spd, t),
                spread: lerp(a.spread, b.spread, t),
                burst: a.pdx === 0 && a.pdy === 0 && t < 0.5,
            };
        }

        /* ── Draw one radial blob ───────────────────────────────── */
        function blob(cx: number, cy: number, r: number, rgb: [number, number, number], alpha: number) {
            const g = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`);
            g.addColorStop(0.45, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * 0.35})`);
            g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
            ctx!.fillStyle = g;
            ctx!.beginPath();
            ctx!.arc(cx, cy, r, 0, Math.PI * 2);
            ctx!.fill();
        }

        /* ── Init particles ─────────────────────────────────────── */
        function initParticles(W: number, H: number) {
            particlesRef.current = Array.from({ length: N }, () => ({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                size: 0.7 + Math.random() * 1.2,
                life: Math.random(),
                maxLife: 0.55 + Math.random() * 0.45,
                angle: Math.random() * Math.PI * 2,
            }));
        }

        /* ── Main render loop ───────────────────────────────────── */
        let last = 0;
        function render(now: number) {
            rafRef.current = requestAnimationFrame(render);
            const dt = clamp((now - last) / 16.67, 0.1, 3);
            last = now;

            const { W, H } = sizeRef.current;

            // Smooth scene float toward target
            sfRef.current = lerp(sfRef.current, sfTargetRef.current, 0.045 * dt);
            const sf = sfRef.current;

            const atm = atmosphere(sf);
            const velBoost = clamp(velRef.current * 0.012, 0, 1.4); // scroll speed → intensity

            ctx!.clearRect(0, 0, W, H);

            /* ─ Blobs ─ */
            const br = W * 0.52;
            const bAlpha = 0.055 + velBoost * 0.025;
            blob(atm.b0[0] * W, atm.b0[1] * H, br, atm.c1, bAlpha);
            blob(atm.b1[0] * W, atm.b1[1] * H, br * 0.82, atm.c2, bAlpha * 0.85);
            blob(atm.b2[0] * W, atm.b2[1] * H, br * 0.6, atm.c1, bAlpha * 0.5);

            /* ─ Scan line for Spatial (scene 3) ─ */
            const spatialT = clamp(1 - Math.abs(sf - 3) * 2.5, 0, 1);
            if (spatialT > 0) {
                const { c1 } = atm;
                ctx!.save();
                ctx!.globalAlpha = spatialT * 0.04;
                for (let y = 0; y < H; y += 28) {
                    ctx!.fillStyle = `rgb(${c1[0]},${c1[1]},${c1[2]})`;
                    ctx!.fillRect(0, y, W, 1);
                }
                ctx!.restore();
            }

            /* ─ Particles ─ */
            const pRgb = atm.c1;
            particlesRef.current.forEach((p) => {
                p.life += 0.0038 * dt;
                if (p.life > p.maxLife) {
                    p.life = 0;
                    if (atm.burst) {
                        // Burst: respawn near center
                        p.x = W * 0.5 + (Math.random() - 0.5) * W * 0.25;
                        p.y = H * 0.5 + (Math.random() - 0.5) * H * 0.25;
                        p.angle = Math.random() * Math.PI * 2;
                        const spd = (1.2 + Math.random() * 1.8) * atm.spd * 0.45;
                        p.vx = Math.cos(p.angle) * spd;
                        p.vy = Math.sin(p.angle) * spd;
                    } else {
                        // Stream: respawn on the entering edge
                        const rx = Math.abs(atm.pdx);
                        const ry = Math.abs(atm.pdy);
                        if (rx > ry) {
                            p.x = atm.pdx > 0 ? -8 : W + 8;
                            p.y = Math.random() * H;
                        } else {
                            p.x = Math.random() * W;
                            p.y = atm.pdy > 0 ? -8 : H + 8;
                        }
                        const jitter = (Math.random() - 0.5) * atm.spread;
                        p.vx = (atm.pdx + (ry > rx ? jitter : 0)) * atm.spd;
                        p.vy = (atm.pdy + (rx > ry ? jitter : 0)) * atm.spd;
                    }
                }

                // Smoothly steer toward target velocity
                if (!atm.burst) {
                    const jitter = (Math.random() - 0.5) * 0.06;
                    p.vx = lerp(p.vx, (atm.pdx + jitter) * atm.spd, 0.025 * dt);
                    p.vy = lerp(p.vy, (atm.pdy + jitter) * atm.spd, 0.025 * dt);
                }

                const boost = 1 + velBoost * 0.5;
                p.x += p.vx * dt * boost;
                p.y += p.vy * dt * boost;

                // Wrap
                if (p.x < -20) p.x = W + 20;
                if (p.x > W + 20) p.x = -20;
                if (p.y < -20) p.y = H + 20;
                if (p.y > H + 20) p.y = -20;

                // Life alpha
                const lt = p.life / p.maxLife;
                const fadeA = lt < 0.2 ? lt / 0.2 : lt > 0.75 ? (1 - lt) / 0.25 : 1;
                const a = fadeA * (0.28 + velBoost * 0.14);

                ctx!.save();
                ctx!.globalAlpha = a;
                ctx!.fillStyle = `rgb(${pRgb[0]},${pRgb[1]},${pRgb[2]})`;
                ctx!.beginPath();
                ctx!.arc(p.x, p.y, p.size * (1 + velBoost * 0.3), 0, Math.PI * 2);
                ctx!.fill();
                ctx!.restore();
            });

            /* ─ Progress thread ─ */
            if (thread && sceneLayoutRef.current.length) {
                const layout = sceneLayoutRef.current;
                const totalH = layout[layout.length - 1].top + layout[layout.length - 1].h - layout[0].top;
                const root = document.querySelector('.v2-root');
                const scrollTop = root ? (root as HTMLElement).scrollTop : 0;
                const progress = clamp((scrollTop - layout[0].top) / totalH, 0, 1);
                thread.style.height = `${progress * 100}%`;
                thread.style.opacity = progress > 0.01 ? '1' : '0';
                const { c1 } = atm;
                thread.style.background = `rgb(${c1[0]},${c1[1]},${c1[2]})`;
            }

            // Decay velocity
            velRef.current *= 0.85;
        }

        /* ── Scroll listener ─────────────────────────────────────── */
        const root = document.querySelector('.v2-root');
        function onScroll() {
            if (!root) return;
            const st = (root as HTMLElement).scrollTop;
            velRef.current = Math.abs(st - lastScrollRef.current);
            lastScrollRef.current = st;
            sfTargetRef.current = toSceneFloat(st);
        }
        root?.addEventListener('scroll', onScroll, { passive: true });

        /* ── Init ────────────────────────────────────────────────── */
        resize();
        cacheLayout();
        initParticles(sizeRef.current.W, sizeRef.current.H);
        onScroll();
        sfRef.current = sfTargetRef.current;

        const ro = new ResizeObserver(() => {
            resize();
            cacheLayout();
        });
        ro.observe(document.documentElement);

        rafRef.current = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(rafRef.current);
            root?.removeEventListener('scroll', onScroll);
            ro.disconnect();
        };
    }, []);

    return (
        <>
            {/* Atmospheric canvas — fixed, behind scene backgrounds (z-0, DOM before .v2-ps-bg) */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
                aria-hidden="true"
            />

            {/* Progress thread — thin left-edge indicator */}
            <div
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: 2,
                    height: '100dvh',
                    zIndex: 2,
                    pointerEvents: 'none',
                    background: 'rgba(255,255,255,0.06)',
                }}
                aria-hidden="true"
            >
                <div
                    ref={threadRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '0%',
                        transition: 'height 0.25s linear, background 0.8s ease, opacity 0.4s',
                        borderRadius: '0 0 1px 1px',
                        boxShadow: '1px 0 6px currentColor',
                    }}
                />
            </div>
        </>
    );
}
