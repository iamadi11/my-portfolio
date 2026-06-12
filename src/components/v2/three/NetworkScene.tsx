'use client';

/* eslint-disable react/no-unknown-property -- react-three-fiber JSX uses three.js properties (attach/args/depthWrite/...) unknown to eslint-plugin-react */

import React from 'react';

import { useFrame } from '@react-three/fiber';
import type { MotionValue } from 'motion/react';
import * as THREE from 'three';

import { scenePalettes } from '../fx/palettes';

/** Career-era scenes (root → tata1mg → moresand → cashfree) drive the network. */
const CAREER_PALETTE_INDICES = [1, 2, 3, 4];
const NODE_SPACING = 9;
/** Branch filaments per node — mirrors fact counts per chapter in data.ts. */
const BRANCH_COUNTS = [2, 4, 2, 3];
const PARTICLE_COUNT = 144;
const LINE_SEGMENTS = 48;

type NetworkCurve = {
    curve: THREE.Curve<THREE.Vector3>;
    color: string;
    /** Spine carries more energy traffic than branches. */
    weight: number;
};

type FlowParticle = {
    curveIndex: number;
    t0: number;
    speed: number;
};

function buildNetwork(): {
    nodes: THREE.Vector3[];
    curves: NetworkCurve[];
    lineGeometries: { geometry: THREE.BufferGeometry; color: string }[];
} {
    const nodes = CAREER_PALETTE_INDICES.map(
        (_, i) => new THREE.Vector3(Math.sin(i * 1.9) * 1.6, -i * NODE_SPACING, Math.cos(i * 1.4) * 1.2)
    );

    const curves: NetworkCurve[] = [
        {
            curve: new THREE.CatmullRomCurve3(nodes, false, 'catmullrom', 0.6),
            color: '#67e8f9',
            weight: 4,
        },
    ];

    nodes.forEach((node, i) => {
        const accent = scenePalettes[CAREER_PALETTE_INDICES[i]].accent;
        const count = BRANCH_COUNTS[i];
        for (let j = 0; j < count; j += 1) {
            const angle = (j / count) * Math.PI * 2 + i * 0.7;
            const radius = 3.4 + (j % 2) * 1.1;
            const out = new THREE.Vector3(
                Math.cos(angle) * radius,
                -1.6 - j * 0.7,
                Math.sin(angle) * radius * 0.8
            );
            const end = node.clone().add(out);
            const c1 = node
                .clone()
                .add(new THREE.Vector3(Math.cos(angle) * 0.8, -0.2, Math.sin(angle) * 0.8));
            const c2 = node.clone().add(
                out
                    .clone()
                    .multiplyScalar(0.65)
                    .setY(out.y * 0.4)
            );
            curves.push({
                curve: new THREE.CubicBezierCurve3(node.clone(), c1, c2, end),
                color: accent,
                weight: 1,
            });
        }
    });

    const lineGeometries = curves.map(({ curve, color }) => ({
        geometry: new THREE.BufferGeometry().setFromPoints(curve.getPoints(LINE_SEGMENTS)),
        color,
    }));

    return { nodes, curves, lineGeometries };
}

function makeParticles(curves: NetworkCurve[]): FlowParticle[] {
    const pool: number[] = [];
    curves.forEach((c, i) => {
        for (let w = 0; w < c.weight; w += 1) pool.push(i);
    });
    return Array.from({ length: PARTICLE_COUNT }, () => ({
        curveIndex: pool[Math.floor(Math.random() * pool.length)],
        t0: Math.random(),
        speed: 0.025 + Math.random() * 0.06,
    }));
}

/**
 * Layer C — the living timeline network. Procedural only: spine through four
 * career nodes, achievement filaments branching from each, energy particles
 * flowing along every curve. Camera travels down the spine as scroll moves
 * through the career chapters; node glows ignite on approach ("energy
 * gathers"). All animation reads the scroll MotionValue inside useFrame — no
 * React state per frame.
 */
export function NetworkScene({
    progress,
    range,
}: {
    progress: MotionValue<number>;
    range: [number, number];
}): React.JSX.Element {
    const { nodes, curves, lineGeometries } = React.useMemo(buildNetwork, []);
    const particles = React.useMemo(() => makeParticles(curves), [curves]);

    const groupRef = React.useRef<THREE.Group>(null);
    const pointsRef = React.useRef<THREE.Points>(null);
    const glowRefs = React.useRef<(THREE.Mesh | null)[]>([]);
    const tmp = React.useMemo(() => new THREE.Vector3(), []);

    const positions = React.useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

    useFrame((state) => {
        const [start, end] = range;
        const g = progress.get();
        // shared canvas: hide + skip all work (incl. camera) outside this scene's window
        const inWindow = g > start - 0.05 && g < end + 0.05;
        if (groupRef.current) groupRef.current.visible = inWindow;
        if (!inWindow) return;
        const m = Math.min(1, Math.max(0, (g - start) / (end - start)));
        const focusY = THREE.MathUtils.lerp(2.5, nodes[nodes.length - 1].y - 2.5, m);

        // camera rig: travel + pointer parallax, damped
        const cam = state.camera;
        const targetX = state.pointer.x * 1.4;
        const targetY = focusY + 3.5 + state.pointer.y * 0.8;
        cam.position.x = THREE.MathUtils.damp(cam.position.x, targetX, 3, state.clock.getDelta() + 0.016);
        cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY, 0.08);
        cam.position.z = 12;
        cam.lookAt(0, focusY - 1.5, 0);

        // energy flow
        const elapsed = state.clock.elapsedTime;
        for (let i = 0; i < particles.length; i += 1) {
            const p = particles[i];
            const t = (p.t0 + elapsed * p.speed) % 1;
            curves[p.curveIndex].curve.getPoint(t, tmp);
            positions[i * 3] = tmp.x;
            positions[i * 3 + 1] = tmp.y;
            positions[i * 3 + 2] = tmp.z;
        }
        if (pointsRef.current) {
            const attr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
            attr.needsUpdate = true;
        }

        // node ignition by camera proximity
        nodes.forEach((node, i) => {
            const mesh = glowRefs.current[i];
            if (!mesh) return;
            const k = Math.min(1, Math.max(0, 1 - Math.abs(focusY - node.y) / (NODE_SPACING * 0.9)));
            const pulse = 1 + Math.sin(elapsed * 2.2 + i) * 0.08;
            mesh.scale.setScalar((0.5 + k * 0.9) * pulse);
            (mesh.material as THREE.MeshBasicMaterial).opacity = 0.12 + k * 0.75;
        });
    });

    return (
        // shifted right so node glows sit beside the left-aligned scene text, not under it
        <group ref={groupRef} position={[2.4, 0, 0]}>
            {lineGeometries.map(({ geometry, color }, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <line key={`net-line-${i}`}>
                    <primitive object={geometry} attach="geometry" />
                    <lineBasicMaterial
                        color={color}
                        transparent
                        opacity={i === 0 ? 0.5 : 0.28}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </line>
            ))}

            {nodes.map((node, i) => (
                <mesh
                    key={scenePalettes[CAREER_PALETTE_INDICES[i]].accent}
                    position={node}
                    ref={(el) => {
                        glowRefs.current[i] = el;
                    }}
                >
                    <sphereGeometry args={[0.34, 16, 16]} />
                    <meshBasicMaterial
                        color={scenePalettes[CAREER_PALETTE_INDICES[i]].accent}
                        transparent
                        opacity={0.2}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            ))}

            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                </bufferGeometry>
                <pointsMaterial
                    color="#bfeafc"
                    size={0.09}
                    sizeAttenuation
                    transparent
                    opacity={0.85}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>
        </group>
    );
}
