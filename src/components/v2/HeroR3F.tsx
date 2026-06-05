/* eslint-disable react/no-unknown-property */
'use client';

import { useEffect, useMemo, useRef } from 'react';

import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 160;
const MAX_CONN_SQ = 3.24; // 1.8²

function NetworkScene(): JSX.Element {
    const groupRef = useRef<THREE.Group>(null);
    const mouseTarget = useRef({ x: 0, y: 0 });
    const mouseCur = useRef({ x: 0, y: 0 });

    const particleGeo = useMemo(() => {
        const pos = new Float32Array(PARTICLE_COUNT * 3);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 14;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return geo;
    }, []);

    const lineGeo = useMemo(() => {
        const pos = particleGeo.attributes.position.array as Float32Array;
        const pts: number[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const dx = pos[i * 3] - pos[j * 3];
                const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
                const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
                if (dx * dx + dy * dy + dz * dz < MAX_CONN_SQ) {
                    pts.push(
                        pos[i * 3],
                        pos[i * 3 + 1],
                        pos[i * 3 + 2],
                        pos[j * 3],
                        pos[j * 3 + 1],
                        pos[j * 3 + 2]
                    );
                }
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
        return geo;
    }, [particleGeo]);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            mouseTarget.current.x = (e.clientX / window.innerWidth - 0.5) * 1.4;
            mouseTarget.current.y = -(e.clientY / window.innerHeight - 0.5) * 0.8;
        };
        window.addEventListener('mousemove', onMove, { passive: true });
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        const t = clock.getElapsedTime();
        mouseCur.current.x += (mouseTarget.current.x - mouseCur.current.x) * 0.045;
        mouseCur.current.y += (mouseTarget.current.y - mouseCur.current.y) * 0.045;
        groupRef.current.rotation.y = t * 0.018 + mouseCur.current.x * 0.14;
        groupRef.current.rotation.x = mouseCur.current.y * 0.07 + Math.sin(t * 0.08) * 0.015;
    });

    return (
        <group ref={groupRef}>
            <points geometry={particleGeo}>
                <pointsMaterial color="#5578ff" size={0.065} transparent opacity={0.7} sizeAttenuation />
            </points>
            <lineSegments geometry={lineGeo}>
                <lineBasicMaterial color="#3348bb" transparent opacity={0.14} />
            </lineSegments>
        </group>
    );
}

export default function HeroR3F(): JSX.Element {
    return (
        <Canvas
            camera={{ position: [0, 0, 9], fov: 55 }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            dpr={[1, 1.5]}
            gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        >
            <NetworkScene />
        </Canvas>
    );
}
