'use client';

import React from 'react';

import { motion, useTransform } from 'motion/react';
import Link from 'next/link';

import { JourneyProvider } from './core/JourneyProvider';
import { Scene } from './core/Scene';
import { SceneContent } from './core/SceneContent';
import { useSceneProgress } from './core/useSceneProgress';
import { journeyScenes } from './data';
import { AtmosphereLayer } from './fx/AtmosphereLayer';
import { ParticleField } from './fx/ParticleField';
import { ThreadLayer } from './fx/ThreadLayer';

const sceneIds = journeyScenes.map((s) => s.id);

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
