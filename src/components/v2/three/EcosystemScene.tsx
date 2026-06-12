'use client';

/* eslint-disable react/no-unknown-property -- react-three-fiber JSX uses three.js properties unknown to eslint-plugin-react */

import React from 'react';

import { useFrame } from '@react-three/fiber';
import type { MotionValue } from 'motion/react';
import * as THREE from 'three';

/** Group origin — below the career constellation so the camera keeps descending. */
const ECO_CENTER = new THREE.Vector3(0, -38, 0);
const SATELLITE_COUNT = 56;
const FLOW_COUNT = 96;

type Satellite = THREE.Vector3;

/** Fibonacci-ish shells, sorted inner→outer so drawRange reveal reads as growth. */
function buildSatellites(): Satellite[] {
    const sats: Satellite[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < SATELLITE_COUNT; i += 1) {
        const frac = (i + 0.5) / SATELLITE_COUNT;
        const radius = 3.2 + frac * 4.2;
        const inclination = Math.acos(1 - 2 * frac);
        const azimuth = golden * i;
        sats.push(
            new THREE.Vector3(
                radius * Math.sin(inclination) * Math.cos(azimuth),
                radius * Math.cos(inclination) * 0.7,
                radius * Math.sin(inclination) * Math.sin(azimuth)
            )
        );
    }
    return sats;
}

type FlowSeed = { satIndex: number; t0: number; speed: number };

/**
 * Layer C — the open-source ecosystem. Eidos as a radiant core; adoption as
 * satellite shells that materialize with scroll (geometry drawRange — no
 * per-object React state); downloads as particles streaming outward from the
 * core. The whole system slowly orbits, and scroll adds rotation, so the
 * ecosystem visibly evolves while the visitor moves through the chapter.
 */
export function EcosystemScene({
    progress,
    range,
}: {
    progress: MotionValue<number>;
    range: [number, number];
}): React.JSX.Element {
    const satellites = React.useMemo(buildSatellites, []);

    const groupRef = React.useRef<THREE.Group>(null);
    const orbitRef = React.useRef<THREE.Group>(null);
    const coreRef = React.useRef<THREE.Mesh>(null);
    const satPointsRef = React.useRef<THREE.Points>(null);
    const linesRef = React.useRef<THREE.LineSegments>(null);
    const flowRef = React.useRef<THREE.Points>(null);

    const satPositions = React.useMemo(() => {
        const arr = new Float32Array(SATELLITE_COUNT * 3);
        satellites.forEach((s, i) => s.toArray(arr, i * 3));
        return arr;
    }, [satellites]);

    const linePositions = React.useMemo(() => {
        const arr = new Float32Array(SATELLITE_COUNT * 2 * 3);
        satellites.forEach((s, i) => {
            arr.set([0, 0, 0], i * 6);
            s.toArray(arr, i * 6 + 3);
        });
        return arr;
    }, [satellites]);

    const flows = React.useMemo<FlowSeed[]>(
        () =>
            Array.from({ length: FLOW_COUNT }, (_, i) => ({
                // sorted by satellite so drawRange hides flows to unrevealed satellites
                satIndex: Math.floor((i / FLOW_COUNT) * SATELLITE_COUNT),
                t0: Math.random(),
                speed: 0.12 + Math.random() * 0.2,
            })),
        []
    );
    const flowPositions = React.useMemo(() => new Float32Array(FLOW_COUNT * 3), []);
    const tmp = React.useMemo(() => new THREE.Vector3(), []);

    useFrame((state) => {
        const [start, end] = range;
        const g = progress.get();
        const inWindow = g > start - 0.05 && g < end + 0.05;
        if (groupRef.current) groupRef.current.visible = inWindow;
        if (!inWindow) return;

        const m = Math.min(1, Math.max(0, (g - start) / (end - start)));
        const elapsed = state.clock.elapsedTime;

        // camera settles on the ecosystem; pointer keeps depth alive
        const cam = state.camera;
        const targetY = ECO_CENTER.y + 1.5 + state.pointer.y * 0.9;
        cam.position.x = THREE.MathUtils.lerp(cam.position.x, state.pointer.x * 1.3, 0.06);
        cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY, 0.08);
        cam.position.z = 12;
        // x=0 like the career rig — the group's +x shift places the core beside the text column
        cam.lookAt(0, ECO_CENTER.y, 0);

        // growth: reveal satellites/links/flows by scroll, never by time
        const revealed = Math.max(2, Math.round(SATELLITE_COUNT * Math.min(1, m * 1.5)));
        satPointsRef.current?.geometry.setDrawRange(0, revealed);
        linesRef.current?.geometry.setDrawRange(0, revealed * 2);

        if (orbitRef.current) {
            orbitRef.current.rotation.y = elapsed * 0.05 + m * 1.4;
        }
        if (coreRef.current) {
            coreRef.current.scale.setScalar(1 + Math.sin(elapsed * 2.4) * 0.06 + m * 0.25);
        }

        let visibleFlows = 0;
        for (let i = 0; i < flows.length; i += 1) {
            const f = flows[i];
            if (f.satIndex >= revealed) break;
            visibleFlows = i + 1;
            const t = (f.t0 + elapsed * f.speed) % 1;
            tmp.copy(satellites[f.satIndex]).multiplyScalar(t);
            flowPositions[i * 3] = tmp.x;
            flowPositions[i * 3 + 1] = tmp.y;
            flowPositions[i * 3 + 2] = tmp.z;
        }
        if (flowRef.current) {
            flowRef.current.geometry.setDrawRange(0, visibleFlows);
            const attr = flowRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
            attr.needsUpdate = true;
        }
    });

    return (
        // outer group = world placement (right of text column, below career arc);
        // orbit group rotates around its own origin where all contents are centered
        <group ref={groupRef} position={[ECO_CENTER.x + 2.4, ECO_CENTER.y, ECO_CENTER.z]}>
            <group ref={orbitRef}>
                <group>
                    <mesh ref={coreRef}>
                        <sphereGeometry args={[0.55, 24, 24]} />
                        <meshBasicMaterial
                            color="#fbbf24"
                            transparent
                            opacity={0.9}
                            blending={THREE.AdditiveBlending}
                            depthWrite={false}
                        />
                    </mesh>

                    <points ref={satPointsRef}>
                        <bufferGeometry>
                            <bufferAttribute attach="attributes-position" args={[satPositions, 3]} />
                        </bufferGeometry>
                        <pointsMaterial
                            color="#fcd34d"
                            size={0.16}
                            sizeAttenuation
                            transparent
                            opacity={0.9}
                            blending={THREE.AdditiveBlending}
                            depthWrite={false}
                        />
                    </points>

                    <lineSegments ref={linesRef}>
                        <bufferGeometry>
                            <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
                        </bufferGeometry>
                        <lineBasicMaterial
                            color="#f59e0b"
                            transparent
                            opacity={0.16}
                            blending={THREE.AdditiveBlending}
                            depthWrite={false}
                        />
                    </lineSegments>

                    <points ref={flowRef}>
                        <bufferGeometry>
                            <bufferAttribute attach="attributes-position" args={[flowPositions, 3]} />
                        </bufferGeometry>
                        <pointsMaterial
                            color="#fef3c7"
                            size={0.09}
                            sizeAttenuation
                            transparent
                            opacity={0.85}
                            blending={THREE.AdditiveBlending}
                            depthWrite={false}
                        />
                    </points>
                </group>
            </group>
        </group>
    );
}
