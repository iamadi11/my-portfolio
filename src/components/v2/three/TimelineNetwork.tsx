'use client';

import React from 'react';

import { Canvas } from '@react-three/fiber';
import type { MotionValue } from 'motion/react';

import { NetworkScene } from './NetworkScene';

/**
 * Lazy-loaded WebGL layer (the only canvas context in the experience).
 * Mounted by CinematicHome only while the career chapters are near the
 * viewport — see NetworkLayer's mount window.
 */
export default function TimelineNetwork({
    progress,
    range,
}: {
    progress: MotionValue<number>;
    range: [number, number];
}): React.JSX.Element {
    return (
        <Canvas
            dpr={[1, 1.5]}
            gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
            camera={{ fov: 55, near: 0.1, far: 60, position: [0, 3, 12] }}
        >
            <NetworkScene progress={progress} range={range} />
        </Canvas>
    );
}
