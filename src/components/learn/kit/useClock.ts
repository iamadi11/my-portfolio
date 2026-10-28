'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A figure's clock (references/motion.md in the course skill): time `t` in model units, Play/Pause, Previous/Next
 * between event marks, Reset. Each frame advances `t` by real time × `rate`, with `dt` clamped to 1/30 s, and stops
 * at `end`. Under reduced motion there is no continuous time: Play jumps from mark to mark, holding each. The loop
 * runs only while playing.
 */
export function useClock({ marks, end, rate = 1.2 }: { marks: number[]; end: number; rate?: number }): {
    t: number;
    playing: boolean;
    reduced: boolean;
    play: () => void;
    pause: () => void;
    reset: () => void;
    restart: () => void;
    next: () => void;
    prev: () => void;
    seek: (t: number) => void;
    /** Index of the last mark at or before `t` (-1 before the first). */
    at: number;
} {
    const [t, setT] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [reduced, setReduced] = useState(false);
    const tRef = useRef(0);
    tRef.current = t;
    useEffect(() => {
        const m = window.matchMedia('(prefers-reduced-motion: reduce)');
        const on = (): void => setReduced(m.matches);
        on();
        m.addEventListener('change', on);
        return (): void => m.removeEventListener('change', on);
    }, []);
    useEffect(() => {
        if (!playing) return undefined;
        if (reduced) {
            // Stepped play: hold each mark, then jump to the next.
            const id = window.setInterval(() => {
                const nextMark = marks.find((m) => m > tRef.current + 1e-6);
                if (nextMark === undefined) {
                    setPlaying(false);
                    return;
                }
                setT(nextMark);
            }, 900);
            return (): void => window.clearInterval(id);
        }
        let frame = 0;
        let last = 0;
        const tick = (now: number): void => {
            const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 0;
            last = now;
            const nt = Math.min(end, tRef.current + dt * rate);
            setT(nt);
            if (nt >= end) {
                setPlaying(false);
                return;
            }
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return (): void => cancelAnimationFrame(frame);
    }, [playing, reduced, marks, end, rate]);
    const at = marks.reduce((k, m, i) => (m <= t + 1e-6 ? i : k), -1);
    const play = useCallback(() => {
        if (tRef.current >= end - 1e-6) setT(0);
        setPlaying(true);
    }, [end]);
    const pause = useCallback(() => setPlaying(false), []);
    const reset = useCallback(() => {
        setPlaying(false);
        setT(0);
    }, []);
    const restart = useCallback(() => {
        setT(0);
        setPlaying(true);
    }, []);
    const next = useCallback(() => {
        setPlaying(false);
        const m = marks.find((x) => x > tRef.current + 1e-6);
        setT(m ?? end);
    }, [marks, end]);
    const prev = useCallback(() => {
        setPlaying(false);
        const m = [...marks].reverse().find((x) => x < tRef.current - 1e-6);
        setT(m ?? 0);
    }, [marks]);
    const seek = useCallback(
        (to: number) => {
            setPlaying(false);
            setT(Math.max(0, Math.min(end, to)));
        },
        [end]
    );
    return { t, playing, reduced, play, pause, reset, restart, next, prev, seek, at };
}
