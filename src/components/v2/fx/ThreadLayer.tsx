'use client';

import React from 'react';

import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react';

import { scenePalettes } from './palettes';
import { useJourney } from '../core/JourneyProvider';
import { useSceneProgress } from '../core/useSceneProgress';

/**
 * Layer 3 — the journey thread. A single glowing line that draws itself as
 * the story progresses; one node per scene ignites when its chapter becomes
 * active. SVG stroke animation only — transform/paint-light, no layout.
 */
function ThreadNode({
    sceneId,
    index,
    count,
}: {
    sceneId: string;
    index: number;
    count: number;
}): React.JSX.Element {
    const { local } = useSceneProgress(sceneId);
    const palette = scenePalettes[index % scenePalettes.length];
    const y = 40 + (index / (count - 1)) * 920;

    const ignite = useTransform(local, [0, 0.3, 0.85, 1], [0.15, 1, 1, 0.45]);
    const halo = useTransform(local, [0, 0.3, 0.85, 1], [0, 0.5, 0.5, 0.1]);
    const haloScale = useTransform(local, [0, 0.3], [0.6, 1.6]);

    return (
        <g>
            <motion.circle
                cx={32}
                cy={y}
                r={9}
                fill={palette.accent}
                style={{
                    opacity: halo,
                    scale: haloScale,
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                }}
                filter="blur(6px)"
            />
            <motion.circle cx={32} cy={y} r={3.5} fill={palette.accent} style={{ opacity: ignite }} />
        </g>
    );
}

export function ThreadLayer({ sceneIds }: { sceneIds: string[] }): React.JSX.Element {
    const { scrollProgress } = useJourney();
    const reduce = useReducedMotion() === true;
    const drawn = useSpring(scrollProgress, { stiffness: 90, damping: 24, mass: 0.4 });
    const pathLength = useTransform(drawn, [0, 0.96], [0.04, 1]);

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-y-0 left-1 w-12 sm:left-[4vw] sm:w-16"
        >
            <svg className="size-full" viewBox="0 0 64 960" preserveAspectRatio="none" fill="none">
                {/* dormant track */}
                <path
                    d="M32 0 V960"
                    stroke="rgba(148,163,184,0.12)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                />
                {/* lit thread */}
                <motion.path
                    d="M32 0 V960"
                    stroke="url(#thread-gradient)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    style={{ pathLength: reduce ? 1 : pathLength }}
                />
                <defs>
                    <linearGradient
                        id="thread-gradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="960"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0" stopColor="#22d3ee" />
                        <stop offset="0.5" stopColor="#a78bfa" />
                        <stop offset="1" stopColor="#fbbf24" />
                    </linearGradient>
                </defs>
                {sceneIds.map((id, i) => (
                    <ThreadNode key={id} sceneId={id} index={i} count={sceneIds.length} />
                ))}
            </svg>
        </div>
    );
}
