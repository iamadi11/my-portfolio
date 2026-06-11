'use client';

import React from 'react';

import { useMotionValue, useMotionValueEvent, type MotionValue } from 'motion/react';

import { useJourney } from './JourneyProvider';

export type SceneState = 'before' | 'entering' | 'active' | 'leaving' | 'after';

/** Fraction of a scene's own range used for enter/leave transition bands. */
const TRANSITION_BAND = 0.15;

function toState(local: number): SceneState {
    if (local <= 0) return 'before';
    if (local < TRANSITION_BAND) return 'entering';
    if (local <= 1 - TRANSITION_BAND) return 'active';
    if (local < 1) return 'leaving';
    return 'after';
}

/**
 * Single source of truth for scene animation. `local` maps the container
 * scroll progress into this scene's viewport-traversal range, clamped to
 * [0, 1]. `state` is a discrete lifecycle value for mount/unmount decisions
 * (e.g. Layer C canvases mount on `entering`, unmount on `after`). Recomputes
 * on scroll and whenever the provider re-measures ranges (registration,
 * resize) — so a scene visible at load is correct before any scrolling.
 */
export function useSceneProgress(sceneId: string): {
    local: MotionValue<number>;
    global: MotionValue<number>;
    state: SceneState;
} {
    const { scrollProgress, getRange, version } = useJourney();
    const local = useMotionValue(0);
    const [state, setState] = React.useState<SceneState>('before');

    const compute = React.useCallback(
        (value: number) => {
            const range = getRange(sceneId);
            if (!range || range.end <= range.start) return 0;
            const mapped = (value - range.start) / (range.end - range.start);
            return Math.min(1, Math.max(0, mapped));
        },
        [getRange, sceneId]
    );

    useMotionValueEvent(scrollProgress, 'change', (value) => {
        local.set(compute(value));
    });

    React.useEffect(() => {
        local.set(compute(scrollProgress.get()));
    }, [version, compute, local, scrollProgress]);

    useMotionValueEvent(local, 'change', (value) => {
        setState((prev) => {
            const next = toState(value);
            return prev === next ? prev : next;
        });
    });

    return { local, global: scrollProgress, state };
}
