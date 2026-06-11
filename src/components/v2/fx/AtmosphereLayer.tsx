'use client';

import React from 'react';

import { motion, useTransform } from 'motion/react';

import { scenePalettes } from './palettes';
import { useJourney } from '../core/JourneyProvider';

/**
 * Layer 5/6 — background atmosphere. One static gradient slab per scene,
 * crossfaded by opacity (composited — no per-frame paint) as global scroll
 * progress moves through uniform scene slots. At most two slabs are non-zero
 * at any moment; browsers skip painting the rest.
 */
function GradientSlab({ index, count }: { index: number; count: number }): React.JSX.Element {
    const { scrollProgress } = useJourney();
    const palette = scenePalettes[index % scenePalettes.length];
    const step = 1 / (count - 1);
    const slot = index * step;

    const opacity = useTransform(
        scrollProgress,
        index === 0 ? [0, step] : index === count - 1 ? [1 - step, 1] : [slot - step, slot, slot + step],
        index === 0 ? [1, 0] : index === count - 1 ? [0, 1] : [0, 1, 0]
    );

    return (
        <motion.div
            className="absolute inset-0"
            style={{
                opacity,
                backgroundColor: palette.bg,
                backgroundImage: `radial-gradient(90% 70% at 72% 18%, ${palette.glow}, transparent 62%), radial-gradient(70% 55% at 18% 85%, ${palette.glow}, transparent 60%)`,
            }}
        />
    );
}

export function AtmosphereLayer({ count }: { count: number }): React.JSX.Element {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0">
            {Array.from({ length: count }, (_, i) => (
                <GradientSlab
                    key={scenePalettes[i % scenePalettes.length].accent + i}
                    index={i}
                    count={count}
                />
            ))}
            {/* vignette for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
        </div>
    );
}
