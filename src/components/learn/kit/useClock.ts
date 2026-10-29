'use client';

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';

import { createAnimatedPlayback } from '@/lib/learn/animated-playback';
import { startStaticPlayback } from '@/lib/learn/static-playback';

gsap.registerPlugin(useGSAP);

/**
 * A figure's clock (references/motion.md in the course skill): time `t` in model units, Play/Pause, Previous/Next
 * between event marks, Reset. A scoped GSAP timeline advances `t` by real time × `rate`, and stops
 * at `end`. Under reduced motion there is no continuous time: Play jumps from mark to mark, holding each. The loop
 * runs only while playing and while `target` (the figure) is on screen: scrolled away, time holds and resumes when
 * it returns.
 */
export function useClock({
    marks,
    end,
    rate = 1.2,
    target,
    stepMode = false,
    stepDurations,
}: {
    marks: number[];
    end: number;
    rate?: number;
    target?: RefObject<Element | null>;
    stepMode?: boolean;
    stepDurations?: number[];
}): {
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
    const [systemReduced, setReduced] = useState(false);
    const reduced = systemReduced || stepMode;
    const [visible, setVisible] = useState(true);
    const firstMark = marks[0] ?? 0;
    const markKey = marks.join(',');
    const durationKey = stepDurations?.join(',') ?? '';
    const [onScreen, setOnScreen] = useState(true);
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
        const change = (): void => setVisible(!document.hidden);
        change();
        document.addEventListener('visibilitychange', change);
        return () => document.removeEventListener('visibilitychange', change);
    }, []);
    useEffect(() => {
        const el = target?.current;
        if (!el || typeof IntersectionObserver === 'undefined') return undefined;
        const io = new IntersectionObserver((entries) => setOnScreen(entries.at(-1)?.isIntersecting ?? true));
        io.observe(el);
        return (): void => io.disconnect();
    }, [target]);
    useGSAP(
        (context) => {
            if (!playing || !onScreen || !visible) return undefined;
            if (reduced) {
                const steps = markKey.split(',').map(Number);
                const durations = durationKey ? durationKey.split(',').map(Number) : [];
                return startStaticPlayback({
                    marks: steps,
                    durations,
                    end,
                    rate,
                    read: () => tRef.current,
                    tick: (time) => {
                        tRef.current = time;
                        setT(time);
                    },
                    done: () => setPlaying(false),
                    schedule: (callback, milliseconds) => window.setTimeout(callback, milliseconds),
                    cancel: (timer) => window.clearTimeout(timer),
                });
            }
            const playback = createAnimatedPlayback(context, {
                start: tRef.current,
                end,
                rate,
                tick: (time) => {
                    tRef.current = time;
                    setT(time);
                },
                done: () => setPlaying(false),
            });
            return playback.dispose;
        },
        {
            dependencies: [playing, onScreen, visible, reduced, markKey, durationKey, end, rate],
            scope: target,
            revertOnUpdate: true,
        }
    );
    const at = marks.reduce((k, m, i) => (m <= t + 1e-6 ? i : k), -1);
    const play = useCallback(() => {
        if (tRef.current >= end - 1e-6) {
            tRef.current = reduced ? firstMark : 0;
            setT(tRef.current);
        }
        setPlaying(true);
    }, [end, reduced, firstMark]);
    const pause = useCallback(() => setPlaying(false), []);
    const reset = useCallback(() => {
        setPlaying(false);
        setT(0);
    }, []);
    const restart = useCallback(() => {
        tRef.current = reduced ? firstMark : 0;
        setT(tRef.current);
        setPlaying(true);
    }, [reduced, firstMark]);
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
