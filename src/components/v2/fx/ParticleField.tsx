'use client';

import React from 'react';

import { useReducedMotion } from 'motion/react';

import { scenePalettes } from './palettes';
import { useJourney } from '../core/JourneyProvider';

type Particle = {
    x: number;
    y: number;
    r: number;
    speed: number;
    drift: number;
    phase: number;
    depth: number;
    alpha: number;
};

const PARTICLE_COUNT = 56;
const MAX_DPR = 1.5;

function parseRgb(rgb: string): [number, number, number] {
    const [r, g, b] = rgb.split(',').map(Number);
    return [r, g, b];
}

const accents = scenePalettes.map((p) => parseRgb(p.accentRgb));

/**
 * Layer 1 — foreground particle drift. Single rAF loop on one 2D canvas,
 * DPR-clamped, paused when the tab is hidden. Particle tint interpolates
 * between adjacent scene accents as the journey progresses; pointer position
 * shifts particles by depth for genuine parallax. Skipped entirely under
 * prefers-reduced-motion.
 */
export function ParticleField(): React.JSX.Element | null {
    const { scrollProgress } = useJourney();
    const reduce = useReducedMotion() === true;
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (reduce) return undefined;
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;

        let width = 0;
        let height = 0;
        let raf = 0;
        let running = true;
        const pointer = { x: 0.5, y: 0.5 };

        const resize = (): void => {
            const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();

        const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: Math.random(),
            y: Math.random(),
            r: 0.6 + Math.random() * 1.4,
            speed: 0.012 + Math.random() * 0.035,
            drift: (Math.random() - 0.5) * 0.012,
            phase: Math.random() * Math.PI * 2,
            depth: 0.25 + Math.random() * 0.75,
            alpha: 0.08 + Math.random() * 0.2,
        }));

        const onPointer = (e: PointerEvent): void => {
            pointer.x = e.clientX / width;
            pointer.y = e.clientY / height;
        };

        const tick = (now: number): void => {
            if (!running) return;
            ctx.clearRect(0, 0, width, height);

            const p = scrollProgress.get();
            const slot = Math.min(accents.length - 1.001, Math.max(0, p * (accents.length - 1)));
            const i0 = Math.floor(slot);
            const t = slot - i0;
            const [r0, g0, b0] = accents[i0];
            const [r1, g1, b1] = accents[i0 + 1];
            const r = Math.round(r0 + (r1 - r0) * t);
            const g = Math.round(g0 + (g1 - g0) * t);
            const b = Math.round(b0 + (b1 - b0) * t);

            const px = (pointer.x - 0.5) * 2;
            const py = (pointer.y - 0.5) * 2;

            for (const part of particles) {
                part.y -= part.speed / 60;
                part.x += part.drift / 60 + Math.sin(now / 4000 + part.phase) * 0.00018;
                if (part.y < -0.05) {
                    part.y = 1.05;
                    part.x = Math.random();
                }
                const ox = px * part.depth * -18;
                const oy = py * part.depth * -12;
                ctx.globalAlpha = part.alpha * part.depth;
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.beginPath();
                ctx.arc(part.x * width + ox, part.y * height + oy, part.r * part.depth, 0, Math.PI * 2);
                ctx.fill();
            }
            raf = requestAnimationFrame(tick);
        };

        const onVisibility = (): void => {
            running = !document.hidden;
            if (running) raf = requestAnimationFrame(tick);
            else cancelAnimationFrame(raf);
        };

        raf = requestAnimationFrame(tick);
        window.addEventListener('resize', resize);
        window.addEventListener('pointermove', onPointer, { passive: true });
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            running = false;
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
            window.removeEventListener('pointermove', onPointer);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [reduce, scrollProgress]);

    if (reduce) return null;

    return (
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 size-full" />
    );
}
