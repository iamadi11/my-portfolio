'use client';

/* eslint-disable react/no-unknown-property -- react-three-fiber JSX uses three.js properties unknown to eslint-plugin-react */

import React from 'react';

import { Canvas } from '@react-three/fiber';
import type { MotionValue } from 'motion/react';

import { EcosystemScene } from './EcosystemScene';
import { NetworkScene } from './NetworkScene';

/**
 * The single WebGL context of the experience (lazy chunk). Hosts every 3D
 * scene as a visibility-gated group — scenes hide themselves and skip their
 * frame work outside their scroll window, so adjacent chapters never pay for
 * each other. Mounted by CinematicHome only while some 3D window is near.
 */
export default function JourneyCanvas({
    progress,
    networkRange,
    ecosystemRange,
}: {
    progress: MotionValue<number>;
    networkRange: [number, number];
    ecosystemRange: [number, number];
}): React.JSX.Element {
    return (
        <Canvas
            dpr={[1, 1.5]}
            gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
            camera={{ fov: 55, near: 0.1, far: 60, position: [0, 3, 12] }}
        >
            <fog attach="fog" args={['#04050a', 10, 34]} />
            <NetworkScene progress={progress} range={networkRange} />
            <EcosystemScene progress={progress} range={ecosystemRange} />
        </Canvas>
    );
}
