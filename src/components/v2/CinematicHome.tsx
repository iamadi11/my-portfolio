'use client';

import React from 'react';

import { motion, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import { JourneyProvider, useJourney } from './core/JourneyProvider';
import { Scene } from './core/Scene';
import { SceneContent } from './core/SceneContent';
import { useSceneProgress } from './core/useSceneProgress';
import { journeyScenes } from './data';
import { AtmosphereLayer } from './fx/AtmosphereLayer';
import { ParticleField } from './fx/ParticleField';
import { ThreadLayer } from './fx/ThreadLayer';

const JourneyCanvas = dynamic(() => import('./three/JourneyCanvas'), { ssr: false });

const sceneIds = journeyScenes.map((s) => s.id);

const SCENE_STEP = 1 / (journeyScenes.length - 1);
/** Career chapters (scenes 1–4). */
const NETWORK_RANGE: [number, number] = [SCENE_STEP * 0.55, SCENE_STEP * 4 + SCENE_STEP * 0.45];
/** Open-source ecosystem (scene 5). */
const ECOSYSTEM_RANGE: [number, number] = [SCENE_STEP * 4.55, SCENE_STEP * 5.45];
/** Canvas mounts across the union of all 3D windows (hysteresis beyond the fades). */
const CANVAS_RANGE: [number, number] = [NETWORK_RANGE[0] - 0.04, ECOSYSTEM_RANGE[1] + 0.04];

/**
 * V2 cinematic experience. Full-viewport overlay with its own scroll
 * container, so the classic site chrome (header/footer) stays untouched
 * underneath — zero changes to existing components. JourneyProvider discovers
 * this container as the scroll parent automatically.
 */
export default function CinematicHome(): React.JSX.Element {
    return (
        <div className="fixed inset-0 z-[120] overflow-y-auto overscroll-y-contain bg-[#04050a] text-white">
            <JourneyProvider>
                <AtmosphereLayer count={journeyScenes.length} />
                <CanvasLayer />
                <ParticleField />
                <ThreadLayer sceneIds={sceneIds} />

                <Link
                    href="/"
                    className="fixed right-4 top-4 z-20 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-xs text-zinc-400 backdrop-blur transition-colors hover:text-white"
                >
                    classic site →
                </Link>

                <div className="relative z-10">
                    {journeyScenes.map((scene, index) => (
                        <Scene
                            key={scene.id}
                            id={scene.id}
                            label={scene.label}
                            className={
                                index === 0
                                    ? 'flex min-h-svh items-center px-6 pl-14 sm:px-[12vw]'
                                    : 'flex min-h-[115svh] items-center px-6 pl-14 sm:px-[12vw]'
                            }
                        >
                            <SceneContent scene={scene} index={index} />
                        </Scene>
                    ))}
                </div>

                <ScrollHint />
            </JourneyProvider>
        </div>
    );
}

/**
 * Mounts the single WebGL canvas only while a 3D window (career network or
 * ecosystem) is near the viewport — hysteresis slightly wider than the
 * opacity fades, so it never pops. Keeps hero LCP canvas-free and tears the
 * GL context down outside the 3D arc. The DOM opacity dips to 0 in the gap
 * between the two windows, covering the camera jump.
 */
function CanvasLayer(): React.JSX.Element | null {
    const { scrollProgress } = useJourney();
    const reduce = useReducedMotion() === true;
    const [active, setActive] = React.useState(false);

    useMotionValueEvent(scrollProgress, 'change', (v) => {
        const on = v > CANVAS_RANGE[0] && v < CANVAS_RANGE[1];
        setActive((prev) => (prev === on ? prev : on));
    });

    const opacity = useTransform(
        scrollProgress,
        [
            NETWORK_RANGE[0],
            NETWORK_RANGE[0] + 0.05,
            NETWORK_RANGE[1] - 0.05,
            NETWORK_RANGE[1],
            ECOSYSTEM_RANGE[0],
            ECOSYSTEM_RANGE[0] + 0.04,
            ECOSYSTEM_RANGE[1] - 0.04,
            ECOSYSTEM_RANGE[1],
        ],
        [0, 1, 1, 0, 0, 1, 1, 0]
    );

    if (reduce) return null;

    return (
        <motion.div
            aria-hidden="true"
            data-layer="journey-canvas"
            data-active={active ? '1' : '0'}
            style={{ opacity }}
            className="pointer-events-none fixed inset-0"
        >
            {active ? (
                <JourneyCanvas
                    progress={scrollProgress}
                    networkRange={NETWORK_RANGE}
                    ecosystemRange={ECOSYSTEM_RANGE}
                />
            ) : null}
        </motion.div>
    );
}

/** Hero-only scroll cue — fades out as the journey begins. */
function ScrollHint(): React.JSX.Element {
    const { local } = useSceneProgress('origin');
    const opacity = useTransform(local, [0.5, 0.68], [1, 0]);

    return (
        <motion.div
            aria-hidden="true"
            style={{ opacity }}
            className="pointer-events-none fixed bottom-8 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-500"
        >
            {/* pulse on the inner span — keyframe animation on the outer node would override the scroll-driven inline opacity */}
            <span className="block animate-pulse">scroll</span>
        </motion.div>
    );
}
