/* eslint-disable react/no-unknown-property */
// v2-build: cache-bust
'use client';

/**
 * CINEMATIC HOME — THE LAST MILE
 *
 * Narrative: Aditya's career as a spatial journey through three cities
 *   0%–14%   THE TOUCH    — origin ignites, name reveals in the dark
 *   14%–28%  THE SIGNAL   — data pulse travels outward toward the cities
 *   28%–44%  THE EXCHANGE — Cashfree: risk engine, real-time systems
 *   44%–60%  THE GRID     — Tata 1mg: maps, notifications, pipeline
 *   60%–74%  THE LATTICE  — Moresand: infrastructure, PWA, build systems
 *   74%–88%  THE SPINE    — career overview: pull back, all cities visible
 *   88%–100% THE VOID     — contact portal
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import { Stars } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    Bloom,
    ChromaticAberration,
    EffectComposer,
    GodRays,
    SMAA,
    Vignette,
} from '@react-three/postprocessing';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import * as THREE from 'three';

import { navigate } from './Chrome';
import { IDENTITY } from './data';
import { SoundToggle, useSoundEngine } from './SoundEngine';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const GOLD = '#c9a227';
const TEAL = '#00c9c9';
const BLUE_M = '#2255dd';
const GREEN_S = '#00d878';
const PURPLE_L = '#8844cc';
const CA_OFFSET = new THREE.Vector2(0.00055, 0.00035);

/* ═══════════════════════════════════════════════════════
   WORLD POSITIONS
═══════════════════════════════════════════════════════ */
const EXCHANGE_POS: [number, number, number] = [24, 0, -24];
const GRID_POS: [number, number, number] = [-22, 0, -24];
const LATTICE_POS: [number, number, number] = [0, 0, -58];
const SPINE_POS: [number, number, number] = [0, 0, -30];

/* ═══════════════════════════════════════════════════════
   CAMERA KEYFRAMES — 8 keys for 7 scenes
═══════════════════════════════════════════════════════ */
type CamKey = { p: number; px: number; py: number; pz: number; lx: number; ly: number; lz: number };
const CAM: CamKey[] = [
    { p: 0.0, px: 0, py: 2, pz: 20, lx: 0, ly: 0, lz: 0 }, // THE TOUCH
    { p: 0.14, px: -3, py: 5, pz: 16, lx: 0, ly: -1, lz: -4 }, // THE SIGNAL
    { p: 0.28, px: 35, py: 10, pz: 18, lx: 24, ly: 2, lz: -24 }, // THE EXCHANGE
    { p: 0.44, px: -30, py: 8, pz: 14, lx: -22, ly: 1, lz: -24 }, // THE GRID
    { p: 0.6, px: 0, py: 14, pz: -18, lx: 0, ly: 3, lz: -58 }, // THE LATTICE
    { p: 0.74, px: 0, py: 45, pz: 55, lx: 0, ly: -6, lz: -28 }, // THE SPINE
    { p: 0.88, px: 0, py: 8, pz: 26, lx: 0, ly: 0, lz: 0 }, // VOID APPROACH
    { p: 1.0, px: 0, py: 12, pz: 22, lx: 0, ly: 3, lz: -6 }, // THE VOID
];

/* ═══════════════════════════════════════════════════════
   UTILITY
═══════════════════════════════════════════════════════ */
function smoothstep(t: number) {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
}
function useCamProgress(): React.MutableRefObject<number> {
    return useRef(0);
}

/* ═══════════════════════════════════════════════════════
   CAMERA CONTROLLER
═══════════════════════════════════════════════════════ */
function CameraRig({
    progress,
    mouse,
}: {
    progress: React.MutableRefObject<number>;
    mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
    const { camera } = useThree();
    const pos = useRef(new THREE.Vector3(0, 2, 20));
    const look = useRef(new THREE.Vector3(0, 0, 0));
    const tPos = useRef(new THREE.Vector3(0, 2, 20));
    const tLook = useRef(new THREE.Vector3(0, 0, 0));
    const mLerp = useRef({ x: 0, y: 0 });

    useFrame(({ clock }) => {
        const elapsed = clock.getElapsedTime();
        const p = Math.max(0, Math.min(1, progress.current));

        let i = 0;
        for (let k = CAM.length - 2; k >= 0; k--) {
            if (p >= CAM[k].p) {
                i = k;
                break;
            }
        }
        const k0 = CAM[i];
        const k1 = CAM[Math.min(i + 1, CAM.length - 1)];
        const span = k1.p - k0.p;
        const t = span <= 0 ? 0 : smoothstep((p - k0.p) / span);
        tPos.current.set(
            k0.px + (k1.px - k0.px) * t,
            k0.py + (k1.py - k0.py) * t,
            k0.pz + (k1.pz - k0.pz) * t
        );
        tLook.current.set(
            k0.lx + (k1.lx - k0.lx) * t,
            k0.ly + (k1.ly - k0.ly) * t,
            k0.lz + (k1.lz - k0.lz) * t
        );
        pos.current.lerp(tPos.current, 0.045);
        look.current.lerp(tLook.current, 0.045);
        camera.position.copy(pos.current);
        camera.lookAt(look.current);

        // Mouse parallax — inertial, fades to zero after signal scene
        mLerp.current.x += (mouse.current.x - mLerp.current.x) * 0.055;
        mLerp.current.y += (mouse.current.y - mLerp.current.y) * 0.055;
        const falloff = Math.max(0, 1 - p * 3.5);
        camera.position.x += mLerp.current.x * 2.4 * falloff;
        camera.position.y += mLerp.current.y * 1.2 * falloff;

        // Breathe — only in touch scene
        const breathe = Math.sin(elapsed * 0.28) * 0.09 * Math.max(0, 1 - p * 7);
        camera.position.y += breathe;

        // Dynamic FOV
        const pc = camera as THREE.PerspectiveCamera;
        const targetFov = p < 0.14 ? 46 : p < 0.44 ? 52 : p < 0.74 ? 50 : p < 0.88 ? 62 : 54;
        if (Math.abs(pc.fov - targetFov) > 0.05) {
            pc.fov += (targetFov - pc.fov) * 0.022;
            pc.updateProjectionMatrix();
        }
    });
    return null;
}

/* ═══════════════════════════════════════════════════════
   TOUCH ORIGIN — the big bang: particles ignite from a point
═══════════════════════════════════════════════════════ */
function TouchOrigin({ progress }: { progress: React.MutableRefObject<number> }) {
    const root = useRef<THREE.Group>(null!);
    const coreRef = useRef<THREE.Mesh>(null!);
    const haloRef = useRef<THREE.Mesh>(null!);

    const coreMat = useMemo(
        () =>
            new THREE.MeshPhysicalMaterial({
                color: '#ffffff',
                emissive: '#c0d8ff',
                emissiveIntensity: 8,
                iridescence: 1.0,
                iridescenceIOR: 2.4,
                iridescenceThicknessRange: [100, 500] as [number, number],
                metalness: 0.0,
                roughness: 0.0,
                transparent: true,
                opacity: 0.92,
            }),
        []
    );

    const haloMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#60a0ff',
                emissive: '#60a0ff',
                emissiveIntensity: 2,
                transparent: true,
                opacity: 0.05,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
            }),
        []
    );

    const particleGeo = useMemo(() => {
        const n = 1400;
        const buf = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const theta = Math.acos(2 * Math.random() - 1);
            const phi = Math.random() * Math.PI * 2;
            const r = 0.7 + Math.random() * 0.5;
            buf[i * 3] = r * Math.sin(theta) * Math.cos(phi);
            buf[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            buf[i * 3 + 2] = r * Math.cos(theta);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(buf, 3));
        return g;
    }, []);

    const particleMat = useMemo(
        () =>
            new THREE.PointsMaterial({
                color: '#a8c8ff',
                size: 0.1,
                transparent: true,
                opacity: 0.7,
                sizeAttenuation: true,
            }),
        []
    );

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;

        // Visible from p=0 to p=0.24
        const vis = p < 0.14 ? 1 : Math.max(0, 1 - (p - 0.14) / 0.1);
        if (!root.current) return;
        root.current.visible = vis > 0.01;
        if (!vis) return;

        // Explosion scale: 0 → 28 as p goes 0 → 0.12
        const explode = smoothstep(Math.min(1, p / 0.12));
        root.current.scale.setScalar(explode * 28 + 0.3);

        // Core: bright at p=0, dim as explodes
        const coreVis = Math.max(0, 1 - p / 0.09);
        if (coreRef.current) {
            coreRef.current.scale.setScalar((1 + Math.sin(t * 3.2) * 0.14) * Math.max(0.01, coreVis));
            coreMat.emissiveIntensity = (6 + Math.sin(t * 2.2) * 2) * coreVis;
            coreMat.opacity = coreVis * 0.92;
        }
        if (haloRef.current) {
            haloRef.current.scale.setScalar((1.8 + Math.sin(t * 1.1) * 0.3) * Math.max(0.01, coreVis));
            haloMat.opacity = 0.05 * coreVis * vis;
        }
        particleMat.opacity = (0.55 + Math.sin(t * 0.8) * 0.1) * vis * Math.min(1, p * 12);
    });

    return (
        <group ref={root}>
            <points geometry={particleGeo} material={particleMat} />
            <mesh ref={coreRef}>
                <sphereGeometry args={[1.4, 32, 32]} />
                <primitive object={coreMat} />
            </mesh>
            <mesh ref={haloRef}>
                <sphereGeometry args={[3.5, 16, 16]} />
                <primitive object={haloMat} />
            </mesh>
        </group>
    );
}

/* ═══════════════════════════════════════════════════════
   SIGNAL BEAM — data highway from origin toward cities
═══════════════════════════════════════════════════════ */
function SignalBeam({ progress }: { progress: React.MutableRefObject<number> }) {
    const root = useRef<THREE.Group>(null!);

    const tubeMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: BLUE_M,
                emissive: BLUE_M,
                emissiveIntensity: 1.2,
                transparent: true,
                opacity: 0.18,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            }),
        []
    );

    // Main beam: straight into -z
    const mainTubeGeo = useMemo(() => {
        const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 0, -70)]);
        return new THREE.TubeGeometry(curve, 20, 0.18, 8, false);
    }, []);

    // Branch toward Exchange
    const branch1Geo = useMemo(() => {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, -18),
            new THREE.Vector3(12, 0, -21),
            new THREE.Vector3(24, 0, -24),
        ]);
        return new THREE.TubeGeometry(curve, 16, 0.12, 6, false);
    }, []);

    // Branch toward Grid
    const branch2Geo = useMemo(() => {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, -18),
            new THREE.Vector3(-11, 0, -21),
            new THREE.Vector3(-22, 0, -24),
        ]);
        return new THREE.TubeGeometry(curve, 16, 0.12, 6, false);
    }, []);

    // Branch toward Lattice (continues main)
    const branch3Geo = useMemo(() => {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, -25),
            new THREE.Vector3(0, 0, -58),
        ]);
        return new THREE.TubeGeometry(curve, 12, 0.12, 6, false);
    }, []);

    // Racing particles along main beam
    const beamCurves = useMemo(
        () => [
            new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 0, -70)]),
            new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, -18),
                new THREE.Vector3(12, 0, -21),
                new THREE.Vector3(24, 0, -24),
            ]),
            new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, -18),
                new THREE.Vector3(-11, 0, -21),
                new THREE.Vector3(-22, 0, -24),
            ]),
        ],
        []
    );

    useFrame(({ clock }) => {
        const p = progress.current;
        const lo = 0.08,
            hi = 0.36;
        let v = 0;
        if (p >= lo && p < lo + 0.06) v = (p - lo) / 0.06;
        else if (p >= lo + 0.06 && p < hi - 0.06) v = 1;
        else if (p >= hi - 0.06 && p < hi) v = 1 - (p - (hi - 0.06)) / 0.06;

        if (root.current) root.current.visible = v > 0.01;
        if (!v) return;

        const pulse = 0.15 + Math.sin(clock.getElapsedTime() * 2.1) * 0.05;
        tubeMat.opacity = pulse * v;
        tubeMat.emissiveIntensity = (1.0 + Math.sin(clock.getElapsedTime() * 1.8) * 0.3) * v;
    });

    return (
        <group ref={root}>
            <mesh geometry={mainTubeGeo} material={tubeMat} />
            <mesh geometry={branch1Geo} material={tubeMat} />
            <mesh geometry={branch2Geo} material={tubeMat} />
            <mesh geometry={branch3Geo} material={tubeMat} />
            <EnergyFlow curves={beamCurves} color={BLUE_M} speed={0.28} size={0.08} />
        </group>
    );
}

/* ═══════════════════════════════════════════════════════
   ENERGY FLOW — particles racing along curves
═══════════════════════════════════════════════════════ */
const FLOW_PARTICLES = 22;
const FLOW_STEPS = 80;

function EnergyFlow({
    curves,
    color,
    speed = 0.12,
    size = 0.055,
}: {
    curves: THREE.CatmullRomCurve3[];
    color: string;
    speed?: number;
    size?: number;
}) {
    const flowRef = useRef<THREE.Points>(null!);

    const sampled = useMemo(
        () =>
            curves.map((c) => {
                const pts: number[] = [];
                for (let i = 0; i <= FLOW_STEPS; i++) {
                    const v = c.getPoint(i / FLOW_STEPS);
                    pts.push(v.x, v.y, v.z);
                }
                return pts;
            }),
        [curves]
    );

    const geo = useMemo(() => {
        const total = curves.length * FLOW_PARTICLES;
        const buf = new Float32Array(total * 3);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(buf, 3));
        return g;
    }, [curves.length]);

    const mat = useMemo(
        () =>
            new THREE.PointsMaterial({
                color,
                size,
                transparent: true,
                opacity: 0.75,
                sizeAttenuation: true,
            }),
        [color, size]
    );

    useFrame(({ clock }) => {
        if (!flowRef.current?.visible) return;
        const t = clock.getElapsedTime();
        const pos = geo.attributes.position as THREE.BufferAttribute;
        for (let ci = 0; ci < curves.length; ci++) {
            const pts = sampled[ci];
            for (let pi = 0; pi < FLOW_PARTICLES; pi++) {
                const frac = (((pi / FLOW_PARTICLES + t * speed) % 1) + 1) % 1;
                const idx = Math.min(Math.floor(frac * FLOW_STEPS), FLOW_STEPS - 1);
                const base = idx * 3;
                pos.setXYZ(ci * FLOW_PARTICLES + pi, pts[base], pts[base + 1], pts[base + 2]);
            }
        }
        pos.needsUpdate = true;
    });

    return <points ref={flowRef} geometry={geo} material={mat} />;
}

/* ═══════════════════════════════════════════════════════
   VISIBILITY HELPER — city fade-in/dim/spine/fade-out
═══════════════════════════════════════════════════════ */
function cityVis(p: number, fadeIn: number, peakEnd: number, spineEnd: number): number {
    const fi = 0.06;
    if (p < fadeIn) return 0;
    if (p < fadeIn + fi) return (p - fadeIn) / fi;
    if (p < peakEnd) return 1;
    // dim during other city scenes
    if (p < 0.74) return 0.28;
    // brighten for spine overview
    if (p < 0.8) return 0.28 + ((p - 0.74) / 0.06) * 0.47;
    if (p < spineEnd - 0.06) return 0.75;
    if (p < spineEnd) return 0.75 * (1 - (p - (spineEnd - 0.06)) / 0.06);
    return 0;
}

/* ═══════════════════════════════════════════════════════
   CITY: THE EXCHANGE — Cashfree risk engine
   Octahedron core + satellite nodes + data planes
═══════════════════════════════════════════════════════ */
function CityExchange({ progress }: { progress: React.MutableRefObject<number> }) {
    const root = useRef<THREE.Group>(null!);
    const coreRef = useRef<THREE.Mesh>(null!);
    const coreLightRef = useRef<THREE.PointLight>(null!);

    const satPositions = useMemo<[number, number, number][]>(
        () =>
            Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2;
                return [Math.cos(a) * 5.5, Math.sin(a * 2) * 1.8, Math.sin(a) * 5.5];
            }),
        []
    );

    const panelData = useMemo<[number, number, number, number][]>(
        () => [
            [7.5, 3.0, -1, -0.5],
            [7.5, 0.0, 1, -0.4],
            [7.5, -3.0, 0, -0.6],
            [-2, 4.0, 6.5, 0.3],
            [-2, -4.0, 6.5, 0.3],
            [3, 0.0, 7.5, 0.1],
        ],
        []
    );

    const coreMat = useMemo(
        () =>
            new THREE.MeshPhysicalMaterial({
                color: GOLD,
                emissive: GOLD,
                emissiveIntensity: 3,
                metalness: 0.95,
                roughness: 0.02,
                clearcoat: 1.0,
                clearcoatRoughness: 0.04,
            }),
        []
    );

    const nodeMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#88aaff',
                emissive: '#3355bb',
                emissiveIntensity: 2.2,
                metalness: 0.7,
                roughness: 0.1,
            }),
        []
    );

    const panelMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: BLUE_M,
                emissive: BLUE_M,
                emissiveIntensity: 0.4,
                metalness: 0.9,
                roughness: 0.08,
                transparent: true,
                opacity: 0.65,
            }),
        []
    );

    const lineGeo = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        satPositions.forEach((sp, i) => {
            pts.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(...sp));
            const next = satPositions[(i + 1) % 8];
            pts.push(new THREE.Vector3(...sp), new THREE.Vector3(...next));
        });
        return new THREE.BufferGeometry().setFromPoints(pts);
    }, [satPositions]);

    const lineMat = useMemo(
        () =>
            new THREE.LineBasicMaterial({
                color: '#3355cc',
                transparent: true,
                opacity: 0.38,
            }),
        []
    );

    const flowCurves = useMemo(() => {
        const even = satPositions.filter((_, i) => i % 2 === 0).map((p) => new THREE.Vector3(...p));
        const odd = satPositions.filter((_, i) => i % 2 !== 0).map((p) => new THREE.Vector3(...p));
        return [new THREE.CatmullRomCurve3(even, true), new THREE.CatmullRomCurve3(odd, true)];
    }, [satPositions]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;
        const v = cityVis(p, 0.24, 0.54, 0.92);

        if (root.current) root.current.visible = v > 0.01;
        if (!v) return;

        if (coreRef.current) {
            coreRef.current.rotation.y = t * 0.22;
            coreRef.current.rotation.x = t * 0.14;
        }
        if (coreLightRef.current) {
            coreLightRef.current.intensity = (2.2 + Math.sin(t * 1.1) * 0.8) * v;
        }
        coreMat.emissiveIntensity = (2.8 + Math.sin(t * 0.8) * 0.8) * v;
        nodeMat.emissiveIntensity = (1.8 + Math.sin(t * 1.2) * 0.5) * v;
        panelMat.opacity = (0.55 + Math.sin(t * 0.6) * 0.08) * v;
        panelMat.emissiveIntensity = (0.35 + Math.sin(t * 0.7) * 0.1) * v;
        lineMat.opacity = (0.32 + Math.sin(t * 0.5) * 0.07) * v;
    });

    return (
        <group ref={root} position={EXCHANGE_POS}>
            <mesh ref={coreRef} material={coreMat}>
                <octahedronGeometry args={[2.8, 1]} />
            </mesh>
            <pointLight ref={coreLightRef} color={GOLD} intensity={2.2} distance={32} decay={2} />
            {satPositions.map((sp, i) => (
                <mesh key={i} position={sp} material={nodeMat}>
                    <sphereGeometry args={[0.52, 12, 12]} />
                </mesh>
            ))}
            <lineSegments geometry={lineGeo} material={lineMat} />
            {panelData.map(([x, y, z, ry], i) => (
                <mesh key={i} position={[x, y, z]} rotation={[0, ry, 0]} material={panelMat}>
                    <boxGeometry args={[3.2, 2.0, 0.07]} />
                </mesh>
            ))}
            <EnergyFlow curves={flowCurves} color={GOLD} speed={0.18} size={0.06} />
        </group>
    );
}

/* ═══════════════════════════════════════════════════════
   CITY: THE GRID — Tata 1mg polygon delivery zones
   Hex towers + delivery zone rings + notification pulses
═══════════════════════════════════════════════════════ */
function CityGrid({ progress }: { progress: React.MutableRefObject<number> }) {
    const root = useRef<THREE.Group>(null!);
    const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);

    const hexTowers = useMemo(() => {
        const towers: { x: number; z: number; h: number }[] = [{ x: 0, z: 0, h: 4.0 }];
        const r1 = 3.8;
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            towers.push({ x: Math.cos(a) * r1, z: Math.sin(a) * r1, h: 1.4 + (i % 3) * 0.7 });
        }
        const r2 = 7.6;
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            towers.push({ x: Math.cos(a) * r2, z: Math.sin(a) * r2, h: 0.5 + (i % 4) * 0.35 });
        }
        return towers;
    }, []);

    // Custom GLSL tower material: animated scanlines + fresnel edge glow + window grid
    const hexMat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uColor: { value: new THREE.Color(TEAL) },
                    uVis: { value: 1.0 },
                },
                vertexShader: /* glsl */ `
                    varying vec3 vPos;
                    varying vec3 vNormal;
                    varying vec2 vUv;
                    void main() {
                        vPos = position;
                        vNormal = normalize(normalMatrix * normal);
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: /* glsl */ `
                    uniform float uTime;
                    uniform vec3 uColor;
                    uniform float uVis;
                    varying vec3 vPos;
                    varying vec3 vNormal;
                    varying vec2 vUv;
                    void main() {
                        // Fresnel: bright silhouette edges
                        float fr = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.2);
                        // Scanline: thin horizontal bands scrolling upward
                        float scan = smoothstep(0.82, 1.0, fract(vPos.y * 6.0 - uTime * 0.45));
                        // Window grid: bright dots at intersections
                        float wx = smoothstep(0.78, 1.0, fract(vUv.x * 7.0));
                        float wy = smoothstep(0.72, 1.0, fract(vUv.y * 14.0));
                        float win = wx * wy * (0.4 + 0.6 * fract(sin(dot(floor(vUv * vec2(7.0, 14.0)), vec2(12.9898, 78.233))) * 43758.5453));
                        // Win pulse: some windows blink
                        float blink = step(0.5, fract(sin(dot(floor(vUv * vec2(7.0, 14.0)), vec2(127.1, 311.7))) * 43758.5453 + uTime * 0.4));
                        win *= (0.5 + 0.5 * blink);
                        // Base color composition
                        vec3 col = uColor * 0.12;
                        col += uColor * scan * 0.7;
                        col += uColor * fr * 1.8;
                        col += vec3(0.6, 1.0, 0.9) * win * 0.9;
                        float a = (0.15 + fr * 0.55 + scan * 0.18 + win * 0.12) * uVis;
                        gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
                    }
                `,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
            }),
        []
    );

    // Ground grid plane below the city
    const groundGridMat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                uniforms: { uTime: { value: 0 }, uVis: { value: 1.0 } },
                vertexShader: /* glsl */ `
                    varying vec2 vUv;
                    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
                `,
                fragmentShader: /* glsl */ `
                    uniform float uTime;
                    uniform float uVis;
                    varying vec2 vUv;
                    void main() {
                        vec2 grid = abs(fract(vUv * 18.0 - 0.5) - 0.5) / fwidth(vUv * 18.0);
                        float line = 1.0 - min(min(grid.x, grid.y), 1.0);
                        // Radial fade from center
                        float dist = length(vUv - 0.5) * 2.0;
                        float fade = 1.0 - smoothstep(0.5, 1.0, dist);
                        // Pulse ring expanding from center
                        float pulse = smoothstep(0.02, 0.0, abs(fract(dist - uTime * 0.18) - 0.5) - 0.46);
                        vec3 col = vec3(0.0, 0.78, 0.78) * (line * 0.5 + pulse * 0.8);
                        gl_FragColor = vec4(col, (line * 0.25 + pulse * 0.35) * fade * uVis);
                    }
                `,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
            }),
        []
    );

    const ringGeos = useMemo(() => [4.5, 8.5, 13.0].map((r) => new THREE.TorusGeometry(r, 0.07, 6, 80)), []);

    const ringMats = useMemo(
        () =>
            [0, 1, 2].map(
                (i) =>
                    new THREE.MeshStandardMaterial({
                        color: GREEN_S,
                        emissive: GREEN_S,
                        emissiveIntensity: 1.5 - i * 0.3,
                        transparent: true,
                        opacity: 0.5 - i * 0.08,
                        metalness: 0.2,
                        roughness: 0.2,
                    })
            ),
        []
    );

    const notifGeo = useMemo(() => new THREE.TorusGeometry(1, 0.055, 6, 60), []);
    const nMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: TEAL,
                emissive: TEAL,
                emissiveIntensity: 3,
                transparent: true,
                opacity: 0.7,
            }),
        []
    );

    const spiralCurve = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 28; i++) {
            const a = (i / 28) * Math.PI * 5;
            const r = 0.8 + i * 0.44;
            pts.push(new THREE.Vector3(Math.cos(a) * r, i * 0.28 - 3.5, Math.sin(a) * r));
        }
        return [new THREE.CatmullRomCurve3(pts)];
    }, []);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;
        const v = cityVis(p, 0.4, 0.7, 0.92);

        if (root.current) root.current.visible = v > 0.01;
        if (!v) return;

        hexMat.uniforms.uTime.value = t;
        hexMat.uniforms.uVis.value = v;
        groundGridMat.uniforms.uTime.value = t;
        groundGridMat.uniforms.uVis.value = v;

        ringMats.forEach((m, i) => {
            m.emissiveIntensity = (1.3 - i * 0.22 + Math.sin(t * 0.7 + i * 1.2) * 0.25) * v;
            m.opacity = (0.44 - i * 0.07 + Math.sin(t * 0.5 + i) * 0.06) * v;
        });

        // Expanding notification rings
        pulseRefs.current.forEach((mesh, i) => {
            if (!mesh) return;
            const phase = (t * 0.55 + i * 0.6) % 2.5;
            const s = phase * 7.5 + 0.5;
            mesh.scale.setScalar(s * v);
            nMat.opacity = Math.max(0, (1 - phase / 2.5) * 0.55 * v);
        });
    });

    return (
        <group ref={root} position={GRID_POS}>
            {/* Ground grid plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} material={groundGridMat}>
                <planeGeometry args={[42, 42]} />
            </mesh>
            {hexTowers.map(({ x, z, h }, i) => (
                <mesh key={i} position={[x, h / 2, z]} material={hexMat}>
                    <cylinderGeometry args={[1.85, 1.85, h, 6]} />
                </mesh>
            ))}
            {ringGeos.map((g, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} geometry={g} material={ringMats[i]} />
            ))}
            {[0, 1, 2, 3].map((i) => (
                <mesh
                    key={i}
                    ref={(el) => {
                        pulseRefs.current[i] = el;
                    }}
                    rotation={[-Math.PI / 2, 0, 0]}
                    geometry={notifGeo}
                    material={nMat}
                />
            ))}
            <EnergyFlow curves={spiralCurve} color={TEAL} speed={0.1} size={0.065} />
        </group>
    );
}

/* ═══════════════════════════════════════════════════════
   CITY: THE LATTICE — Moresand build infrastructure
   3D lattice of nodes + tubes — dependency graph
═══════════════════════════════════════════════════════ */
function CityLattice({ progress }: { progress: React.MutableRefObject<number> }) {
    const root = useRef<THREE.Group>(null!);

    // 4×3×2 grid of nodes
    const nodes = useMemo<[number, number, number][]>(() => {
        const pts: [number, number, number][] = [];
        for (let xi = 0; xi < 4; xi++) {
            for (let yi = 0; yi < 3; yi++) {
                for (let zi = 0; zi < 2; zi++) {
                    pts.push([(xi - 1.5) * 4.2, (yi - 1) * 4.0, (zi - 0.5) * 5.0]);
                }
            }
        }
        return pts;
    }, []);

    // Horizontal + vertical beams
    const beamGeos = useMemo(() => {
        const geos: THREE.BufferGeometry[] = [];
        const addBeam = (a: [number, number, number], b: [number, number, number]) => {
            const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
            geos.push(new THREE.TubeGeometry(curve, 2, 0.1, 5, false));
        };
        // Horizontal rows (x direction)
        for (let yi = 0; yi < 3; yi++) {
            for (let zi = 0; zi < 2; zi++) {
                for (let xi = 0; xi < 3; xi++) {
                    addBeam(
                        [(xi - 1.5) * 4.2, (yi - 1) * 4.0, (zi - 0.5) * 5.0],
                        [(xi - 0.5) * 4.2, (yi - 1) * 4.0, (zi - 0.5) * 5.0]
                    );
                }
            }
        }
        // Vertical columns (y direction)
        for (let xi = 0; xi < 4; xi++) {
            for (let zi = 0; zi < 2; zi++) {
                for (let yi = 0; yi < 2; yi++) {
                    addBeam(
                        [(xi - 1.5) * 4.2, (yi - 1) * 4.0, (zi - 0.5) * 5.0],
                        [(xi - 1.5) * 4.2, yi * 4.0, (zi - 0.5) * 5.0]
                    );
                }
            }
        }
        // Depth (z direction)
        for (let xi = 0; xi < 4; xi++) {
            for (let yi = 0; yi < 3; yi++) {
                addBeam([(xi - 1.5) * 4.2, (yi - 1) * 4.0, -2.5], [(xi - 1.5) * 4.2, (yi - 1) * 4.0, 2.5]);
            }
        }
        return geos;
    }, []);

    const beamMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: PURPLE_L,
                emissive: PURPLE_L,
                emissiveIntensity: 1.2,
                metalness: 0.6,
                roughness: 0.2,
                transparent: true,
                opacity: 0.7,
            }),
        []
    );

    const nodeMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#cc99ff',
                emissive: '#9955cc',
                emissiveIntensity: 2.5,
                metalness: 0.8,
                roughness: 0.05,
            }),
        []
    );

    const flowCurves = useMemo(() => {
        // Two pipeline curves snaking through lattice
        const c1 = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-6.3, -4, -2.5),
            new THREE.Vector3(-2.1, 0, 2.5),
            new THREE.Vector3(2.1, 4, -2.5),
            new THREE.Vector3(6.3, 0, 2.5),
        ]);
        const c2 = new THREE.CatmullRomCurve3([
            new THREE.Vector3(6.3, -4, 2.5),
            new THREE.Vector3(2.1, 0, -2.5),
            new THREE.Vector3(-2.1, 4, 2.5),
            new THREE.Vector3(-6.3, 0, -2.5),
        ]);
        return [c1, c2];
    }, []);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;
        const v = cityVis(p, 0.56, 0.78, 0.92);

        if (root.current) root.current.visible = v > 0.01;
        if (!v) return;

        beamMat.emissiveIntensity = (1.1 + Math.sin(t * 0.6) * 0.3) * v;
        beamMat.opacity = (0.65 + Math.sin(t * 0.5) * 0.07) * v;
        nodeMat.emissiveIntensity = (2.2 + Math.sin(t * 1.0) * 0.6) * v;
    });

    return (
        <group ref={root} position={LATTICE_POS}>
            {beamGeos.map((g, i) => (
                <mesh key={i} geometry={g} material={beamMat} />
            ))}
            {nodes.map((n, i) => (
                <mesh key={i} position={n} material={nodeMat}>
                    <sphereGeometry args={[0.38, 10, 10]} />
                </mesh>
            ))}
            <EnergyFlow curves={flowCurves} color={PURPLE_L} speed={0.14} size={0.065} />
        </group>
    );
}

/* ═══════════════════════════════════════════════════════
   CAREER SPINE — vertical career line + city connections
   Visible primarily in THE SPINE overview scene
═══════════════════════════════════════════════════════ */
const SPINE_NODES: { y: number; color: string; r: number; isPrimary: boolean }[] = [
    { y: -16, color: '#a89060', r: 0.4, isPrimary: false }, // IIIT Lucknow
    { y: -8, color: TEAL, r: 0.5, isPrimary: false }, // Tata 1mg SDE I
    { y: 0, color: TEAL, r: 0.6, isPrimary: true }, // Tata 1mg SDE II
    { y: 8, color: PURPLE_L, r: 0.5, isPrimary: false }, // Moresand
    { y: 16, color: GOLD, r: 0.72, isPrimary: true }, // Cashfree (current)
];

function CareerSpine({ progress }: { progress: React.MutableRefObject<number> }) {
    const root = useRef<THREE.Group>(null!);

    const spineCurve = useMemo(
        () =>
            new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, -20, 0),
                new THREE.Vector3(0.4, -10, 0.2),
                new THREE.Vector3(-0.3, 0, 0.1),
                new THREE.Vector3(0.3, 10, -0.2),
                new THREE.Vector3(0, 20, 0),
            ]),
        []
    );

    const spineGeo = useMemo(() => new THREE.TubeGeometry(spineCurve, 80, 0.12, 8, false), [spineCurve]);

    const spineMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: GOLD,
                emissive: GOLD,
                emissiveIntensity: 2.0,
                metalness: 0.5,
                roughness: 0.1,
            }),
        []
    );

    // Connection lines to cities — world space relative to SPINE_POS
    const connectionGeo = useMemo(() => {
        const ex = EXCHANGE_POS.map((v, i) => v - SPINE_POS[i]) as [number, number, number];
        const gr = GRID_POS.map((v, i) => v - SPINE_POS[i]) as [number, number, number];
        const la = LATTICE_POS.map((v, i) => v - SPINE_POS[i]) as [number, number, number];
        return new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 8, 0),
            new THREE.Vector3(...ex),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(...gr),
            new THREE.Vector3(0, 4, 0),
            new THREE.Vector3(...la),
        ]);
    }, []);

    const connMat = useMemo(
        () =>
            new THREE.LineBasicMaterial({
                color: GOLD,
                transparent: true,
                opacity: 0.22,
            }),
        []
    );

    const nodeMats = useMemo(
        () =>
            SPINE_NODES.map(
                (n) =>
                    new THREE.MeshPhysicalMaterial({
                        color: n.color,
                        emissive: n.color,
                        emissiveIntensity: n.isPrimary ? 4.5 : 2.8,
                        metalness: 0.9,
                        roughness: 0.03,
                        clearcoat: 1.0,
                        clearcoatRoughness: 0.04,
                    })
            ),
        []
    );

    const spineFlowCurve = useMemo(() => [spineCurve], [spineCurve]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;

        let v = 0;
        if (p >= 0.7 && p < 0.76) v = (p - 0.7) / 0.06;
        else if (p >= 0.76 && p < 0.9) v = 1;
        else if (p >= 0.9 && p < 0.96) v = 1 - (p - 0.9) / 0.06;

        if (root.current) root.current.visible = v > 0.01;
        if (!v) return;

        spineMat.emissiveIntensity = (1.8 + Math.sin(t * 0.7) * 0.4) * v;
        connMat.opacity = (0.22 + Math.sin(t * 0.5) * 0.05) * v;
        nodeMats.forEach((m, i) => {
            m.emissiveIntensity =
                ((SPINE_NODES[i].isPrimary ? 4.2 : 2.6) + Math.sin(t * 0.8 + i * 0.9) * 0.8) * v;
        });
    });

    return (
        <group ref={root} position={SPINE_POS}>
            <mesh geometry={spineGeo} material={spineMat} />
            <lineSegments geometry={connectionGeo} material={connMat} />
            {SPINE_NODES.map((n, i) => (
                <mesh key={i} position={[0, n.y, 0]} material={nodeMats[i]}>
                    <sphereGeometry args={[n.r, 18, 18]} />
                </mesh>
            ))}
            <EnergyFlow curves={spineFlowCurve} color={GOLD} speed={0.08} size={0.055} />
        </group>
    );
}

/* ═══════════════════════════════════════════════════════
   VOID PORTAL — contact destination
═══════════════════════════════════════════════════════ */
const PORTAL_R = 6.5;
const VOID_PORTAL_POS: [number, number, number] = [0, 2, -4];

function VoidPortal({ progress }: { progress: React.MutableRefObject<number> }) {
    const root = useRef<THREE.Group>(null!);
    const ringGroup = useRef<THREE.Group>(null!);
    const swirl = useRef<THREE.Points>(null!);

    const ringMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: GOLD,
                emissive: GOLD,
                emissiveIntensity: 3.2,
                metalness: 0.9,
                roughness: 0.04,
            }),
        []
    );

    const discMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#000005',
                transparent: true,
                opacity: 0.9,
                depthWrite: false,
                side: THREE.DoubleSide,
            }),
        []
    );

    const innerRingMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: TEAL,
                emissive: TEAL,
                emissiveIntensity: 2.2,
                metalness: 0.8,
                roughness: 0.08,
            }),
        []
    );

    const swirlGeo = useMemo(() => {
        const n = 600;
        const buf = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * PORTAL_R * 0.85;
            buf[i * 3] = Math.cos(a) * r;
            buf[i * 3 + 1] = Math.sin(a) * r;
            buf[i * 3 + 2] = (Math.random() - 0.5) * 0.9;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(buf, 3));
        return g;
    }, []);

    const swirlMat = useMemo(
        () =>
            new THREE.PointsMaterial({
                color: GOLD,
                size: 0.06,
                transparent: true,
                opacity: 0.5,
                sizeAttenuation: true,
            }),
        []
    );

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;

        let v = 0;
        if (p >= 0.84 && p < 0.9) v = (p - 0.84) / 0.06;
        else if (p >= 0.9) v = 1;

        if (root.current) root.current.visible = v > 0.01;
        if (!v) return;

        if (ringGroup.current) ringGroup.current.rotation.z = t * 0.34;
        if (swirl.current) swirl.current.rotation.z = -t * 0.22;
        ringMat.emissiveIntensity = (3.0 + Math.sin(t * 0.9) * 0.8) * v;
        swirlMat.opacity = (0.42 + Math.sin(t * 1.1) * 0.1) * v;
    });

    return (
        <group ref={root} position={VOID_PORTAL_POS}>
            <mesh>
                <circleGeometry args={[PORTAL_R - 0.2, 64]} />
                <primitive object={discMat} />
            </mesh>
            <group ref={ringGroup}>
                <mesh>
                    <torusGeometry args={[PORTAL_R, 0.2, 16, 100]} />
                    <primitive object={ringMat} />
                </mesh>
                <mesh>
                    <torusGeometry args={[PORTAL_R - 0.35, 0.06, 8, 80]} />
                    <primitive object={innerRingMat} />
                </mesh>
                <mesh>
                    <torusGeometry args={[PORTAL_R + 0.42, 0.042, 6, 70]} />
                    <primitive object={ringMat} />
                </mesh>
                <mesh rotation={[0, 0, 0.8]}>
                    <torusGeometry args={[PORTAL_R + 1.0, 0.022, 4, 60]} />
                    <primitive object={ringMat} />
                </mesh>
            </group>
            <points ref={swirl} geometry={swirlGeo} material={swirlMat} />
            <mesh position={[0, 0, -0.8]}>
                <sphereGeometry args={[PORTAL_R * 0.55, 14, 14]} />
                <meshStandardMaterial
                    color={GOLD}
                    emissive={GOLD}
                    emissiveIntensity={0.6}
                    transparent
                    opacity={0.07}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    );
}

/* ═══════════════════════════════════════════════════════
   SPINE SUN — invisible GodRays light source above the spine
   Becomes visible only during THE SPINE (p=0.70–0.96)
═══════════════════════════════════════════════════════ */
function SpineSun({
    progress,
    sunRef,
}: {
    progress: React.MutableRefObject<number>;
    sunRef: React.MutableRefObject<THREE.Mesh>;
}) {
    const mat = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: GOLD,
                transparent: true,
                opacity: 0,
                depthWrite: false,
            }),
        []
    );

    useFrame(({ clock }) => {
        const p = progress.current;
        const t = clock.getElapsedTime();
        let v = 0;
        if (p >= 0.7 && p < 0.76) v = (p - 0.7) / 0.06;
        else if (p >= 0.76 && p < 0.9) v = 1;
        else if (p >= 0.9 && p < 0.96) v = 1 - (p - 0.9) / 0.06;

        if (sunRef.current) {
            sunRef.current.visible = v > 0.005;
            mat.opacity = v * (0.88 + Math.sin(t * 1.3) * 0.1);
        }
    });

    // World position: SPINE_POS=[0,0,-30] + local y=22 → [0, 22, -30]
    return (
        <mesh ref={sunRef} position={[0, 22, -30]}>
            <sphereGeometry args={[0.38, 6, 6]} />
            <primitive object={mat} />
        </mesh>
    );
}

/* ═══════════════════════════════════════════════════════
   VOID DUST — ambient gold particles
═══════════════════════════════════════════════════════ */
function VoidDust() {
    const ref = useRef<THREE.Points>(null!);
    const geo = useMemo(() => {
        const n = 2800;
        const buf = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            buf[i * 3] = (Math.random() - 0.5) * 140;
            buf[i * 3 + 1] = (Math.random() - 0.5) * 100;
            buf[i * 3 + 2] = (Math.random() - 0.5) * 140;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(buf, 3));
        return g;
    }, []);
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (ref.current) {
            ref.current.rotation.y = t * 0.005;
            ref.current.rotation.x = t * 0.002;
        }
    });
    return (
        <points ref={ref} geometry={geo}>
            <pointsMaterial color={GOLD} size={0.055} transparent opacity={0.18} sizeAttenuation />
        </points>
    );
}

/* ═══════════════════════════════════════════════════════
   VOID DEBRIS — drifting fragments in contact zone
═══════════════════════════════════════════════════════ */
type DebrisPiece = {
    pos: [number, number, number];
    rx: number;
    ry: number;
    rz: number;
    size: number;
    spd: [number, number, number];
};

function VoidDebris({ progress }: { progress: React.MutableRefObject<number> }) {
    const root = useRef<THREE.Group>(null!);

    const pieces = useMemo<DebrisPiece[]>(() => {
        const rng = (s: number, r: number) => s + (Math.random() - 0.5) * r;
        return [
            {
                pos: [rng(-14, 12), rng(-7, 10), rng(-18, 14)],
                rx: 0.3,
                ry: 0.7,
                rz: 0.2,
                size: 1.3,
                spd: [0.012, 0.008, 0.015],
            },
            {
                pos: [rng(11, 12), rng(-9, 12), rng(-16, 12)],
                rx: 0.6,
                ry: 0.4,
                rz: 0.8,
                size: 0.9,
                spd: [0.018, 0.012, 0.009],
            },
            {
                pos: [rng(-4, 8), rng(-11, 6), rng(-20, 10)],
                rx: 0.1,
                ry: 0.9,
                rz: 0.4,
                size: 1.1,
                spd: [0.009, 0.016, 0.011],
            },
            {
                pos: [rng(7, 10), rng(3, 12), rng(-14, 12)],
                rx: 0.8,
                ry: 0.2,
                rz: 0.6,
                size: 0.7,
                spd: [0.014, 0.01, 0.018],
            },
            {
                pos: [rng(-9, 12), rng(5, 8), rng(-22, 8)],
                rx: 0.5,
                ry: 0.5,
                rz: 0.3,
                size: 1.5,
                spd: [0.007, 0.013, 0.01],
            },
        ];
    }, []);

    const mat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: GOLD,
                emissive: GOLD,
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.13,
                wireframe: true,
            }),
        []
    );

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;
        const v = p >= 0.84 ? Math.min(1, (p - 0.84) / 0.1) : 0;
        if (root.current) root.current.visible = v > 0.01;
        if (!v) return;
        mat.opacity = 0.13 * v;
        const children = root.current.children as THREE.Mesh[];
        pieces.forEach((piece, i) => {
            if (children[i]) {
                children[i].rotation.x = piece.rx + t * piece.spd[0];
                children[i].rotation.y = piece.ry + t * piece.spd[1];
                children[i].rotation.z = piece.rz + t * piece.spd[2];
            }
        });
    });

    return (
        <group ref={root}>
            {pieces.map((p, i) => (
                <mesh key={i} position={p.pos} material={mat}>
                    <octahedronGeometry args={[p.size, 1]} />
                </mesh>
            ))}
        </group>
    );
}

/* ═══════════════════════════════════════════════════════
   VOID LIGHT — cold point light in contact zone
═══════════════════════════════════════════════════════ */
function VoidLight({ progress }: { progress: React.MutableRefObject<number> }) {
    const ref = useRef<THREE.PointLight>(null!);
    useFrame(() => {
        const p = progress.current;
        if (ref.current) {
            ref.current.intensity = p >= 0.84 ? Math.min(1, (p - 0.84) / 0.14) * 2.8 : 0;
        }
    });
    return (
        <pointLight ref={ref} color="#3355aa" position={[0, 14, -18]} intensity={0} distance={75} decay={2} />
    );
}

/* ═══════════════════════════════════════════════════════
   SCENE ATMOSPHERE — dynamic zone lighting
═══════════════════════════════════════════════════════ */
function SceneAtmosphere({ progress }: { progress: React.MutableRefObject<number> }) {
    const keyRef = useRef<THREE.DirectionalLight>(null!);
    const fillRef = useRef<THREE.DirectionalLight>(null!);
    const kState = useRef({ r: 0.5, g: 0.6, b: 1.0, i: 0.8 });
    const fState = useRef({ r: 0.0, g: 0.5, b: 0.8, i: 0.4 });

    useFrame(() => {
        const p = progress.current;
        const L = 0.022;
        let kr: number, kg: number, kb: number, ki: number;
        let fr: number, fg: number, fb: number, fi: number;

        if (p < 0.14) {
            // THE TOUCH — cool white/blue birth
            kr = 0.6;
            kg = 0.7;
            kb = 1.0;
            ki = 0.9;
            fr = 0.1;
            fg = 0.3;
            fb = 0.7;
            fi = 0.4;
        } else if (p < 0.28) {
            // THE SIGNAL — electric blue
            kr = 0.2;
            kg = 0.4;
            kb = 1.0;
            ki = 1.2;
            fr = 0.0;
            fg = 0.3;
            fb = 0.9;
            fi = 0.5;
        } else if (p < 0.44) {
            // THE EXCHANGE — warm gold + blue
            kr = 1.0;
            kg = 0.75;
            kb = 0.35;
            ki = 1.6;
            fr = 0.1;
            fg = 0.3;
            fb = 0.8;
            fi = 0.5;
        } else if (p < 0.6) {
            // THE GRID — teal + green
            kr = 0.2;
            kg = 0.9;
            kb = 0.7;
            ki = 1.4;
            fr = 0.1;
            fg = 0.8;
            fb = 0.4;
            fi = 0.45;
        } else if (p < 0.74) {
            // THE LATTICE — purple + lavender
            kr = 0.6;
            kg = 0.3;
            kb = 0.9;
            ki = 1.3;
            fr = 0.4;
            fg = 0.2;
            fb = 0.6;
            fi = 0.4;
        } else if (p < 0.88) {
            // THE SPINE — wide spectrum, slightly golden
            kr = 1.0;
            kg = 0.8;
            kb = 0.4;
            ki = 1.2;
            fr = 0.2;
            fg = 0.4;
            fb = 0.7;
            fi = 0.35;
        } else {
            // THE VOID — cold deep blue
            kr = 0.4;
            kg = 0.45;
            kb = 0.8;
            ki = 0.45;
            fr = 0.1;
            fg = 0.18;
            fb = 0.32;
            fi = 0.2;
        }

        const k = kState.current;
        k.r += (kr - k.r) * L;
        k.g += (kg - k.g) * L;
        k.b += (kb - k.b) * L;
        k.i += (ki - k.i) * L;
        const f = fState.current;
        f.r += (fr - f.r) * L;
        f.g += (fg - f.g) * L;
        f.b += (fb - f.b) * L;
        f.i += (fi - f.i) * L;

        if (keyRef.current) {
            keyRef.current.color.setRGB(k.r, k.g, k.b);
            keyRef.current.intensity = k.i;
        }
        if (fillRef.current) {
            fillRef.current.color.setRGB(f.r, f.g, f.b);
            fillRef.current.intensity = f.i;
        }
    });

    return (
        <>
            <directionalLight ref={keyRef} position={[8, 14, 10]} intensity={0.9} color="#aabbff" />
            <directionalLight ref={fillRef} position={[-10, 2, -8]} intensity={0.4} color="#4488cc" />
            <directionalLight position={[2, -10, -10]} intensity={0.2} color="#5060cc" />
            <ambientLight color="#030210" intensity={0.55} />
        </>
    );
}

/* ═══════════════════════════════════════════════════════
   SCENE FOG
═══════════════════════════════════════════════════════ */
function SceneFog() {
    const { scene } = useThree();
    useEffect(() => {
        scene.fog = new THREE.FogExp2('#02010a', 0.0028);
        return () => {
            scene.fog = null;
        };
    }, [scene]);
    return null;
}

/* ═══════════════════════════════════════════════════════
   FULL 3D SCENE
═══════════════════════════════════════════════════════ */
const REDUCED_MOTION =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Scene({
    progress,
    mouse,
}: {
    progress: React.MutableRefObject<number>;
    mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
    const sunMeshRef = useRef<THREE.Mesh>(null!);

    if (REDUCED_MOTION) {
        return <Stars radius={180} depth={60} count={2000} factor={3} fade speed={0} />;
    }
    return (
        <>
            <SceneFog />
            <CameraRig progress={progress} mouse={mouse} />
            <SceneAtmosphere progress={progress} />
            {/* Hemisphere light: night sky blue top, dark warm bottom — simulates IBL */}
            <hemisphereLight args={['#1a2a4a', '#0a0608', 0.9]} />

            <Stars radius={180} depth={60} count={6000} factor={4.5} saturation={0.2} fade speed={0.1} />
            <VoidDust />

            {/* Scene objects by zone */}
            <TouchOrigin progress={progress} />
            <SignalBeam progress={progress} />

            <CityExchange progress={progress} />
            <CityGrid progress={progress} />
            <CityLattice progress={progress} />
            <CareerSpine progress={progress} />
            <SpineSun progress={progress} sunRef={sunMeshRef} />

            <VoidPortal progress={progress} />
            <VoidDebris progress={progress} />
            <VoidLight progress={progress} />

            <EffectComposer>
                <SMAA />
                <Bloom intensity={2.2} luminanceThreshold={0.12} luminanceSmoothing={0.9} mipmapBlur />
                <GodRays
                    sun={sunMeshRef}
                    samples={20}
                    density={0.96}
                    decay={0.94}
                    weight={0.4}
                    exposure={0.45}
                    blur
                />
                <ChromaticAberration offset={CA_OFFSET} />
                <Vignette eskil={false} offset={0.15} darkness={0.68} />
            </EffectComposer>
        </>
    );
}

/* ═══════════════════════════════════════════════════════
   OVERLAY SYSTEM — single RAF drives all overlays
═══════════════════════════════════════════════════════ */
type OverlayDef = {
    ref: React.RefObject<HTMLDivElement | null>;
    lo: number;
    hi: number;
    fl?: number;
};

function useOverlayAnimator(progress: React.MutableRefObject<number>, overlays: OverlayDef[]) {
    useEffect(() => {
        let raf: number;
        const tick = () => {
            const p = progress.current;
            for (const o of overlays) {
                const fl = o.fl ?? 0.07;
                let v = 0;
                if (p >= o.lo && p < o.lo + fl) v = (p - o.lo) / fl;
                else if (p >= o.lo + fl && p < o.hi - fl) v = 1;
                else if (p >= o.hi - fl && p < o.hi) v = 1 - (p - (o.hi - fl)) / fl;
                if (o.ref.current) {
                    o.ref.current.style.opacity = String(v);
                    o.ref.current.style.pointerEvents = v > 0.15 ? 'auto' : 'none';
                }
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [progress, overlays]);
}

/* ═══════════════════════════════════════════════════════
   TOUCH OVERLAY — hero: name + title
═══════════════════════════════════════════════════════ */
function TouchOverlay({ divRef }: { divRef: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={divRef}
            aria-label="Aditya Raj — Hero"
            style={{
                position: 'fixed',
                left: '5%',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 12px 5px 7px',
                    borderRadius: 3,
                    background: 'rgba(34,85,221,0.08)',
                    border: '1px solid rgba(34,85,221,0.25)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    color: '#6688ee',
                    textTransform: 'uppercase',
                    marginBottom: 24,
                }}
            >
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#39ff14',
                        boxShadow: '0 0 8px #39ff14',
                        flexShrink: 0,
                    }}
                />
                SIGNAL ORIGIN · FRONTEND ENGINEER · 4.5Y
            </div>

            <div
                style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 'clamp(70px, 14vw, 152px)',
                    lineHeight: 0.87,
                    letterSpacing: '0.015em',
                    background: 'linear-gradient(160deg, #f0e6c8 0%, #f5d56e 40%, #c9a227 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 70px rgba(201,162,39,0.3))',
                }}
            >
                {IDENTITY.name.split(' ').map((w) => (
                    <div key={w}>{w.toUpperCase()}</div>
                ))}
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 'clamp(10px, 1.1vw, 12px)',
                    letterSpacing: '0.22em',
                    color: '#a89060',
                    textTransform: 'uppercase',
                    marginTop: 22,
                }}
            >
                <span style={{ width: 28, height: 1, background: GOLD, flexShrink: 0 }} />
                {IDENTITY.title} · {IDENTITY.company}
            </div>

            <div
                className="tva-scroll-cue"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.26em',
                    color: '#9a8050',
                    textTransform: 'uppercase',
                    marginTop: 36,
                }}
            >
                ↓ SCROLL TO BEGIN THE JOURNEY
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   EXCHANGE OVERLAY — Cashfree systems
═══════════════════════════════════════════════════════ */
function ExchangeOverlay({ divRef }: { divRef: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={divRef}
            style={{ position: 'fixed', inset: 0, zIndex: 10, opacity: 0, pointerEvents: 'none' }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    right: '5%',
                    transform: 'translateY(-50%)',
                    maxWidth: 340,
                }}
            >
                <div
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.28em',
                        color: BLUE_M,
                        textTransform: 'uppercase',
                        marginBottom: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span style={{ display: 'block', width: 20, height: 1, background: BLUE_M }} />
                    THE EXCHANGE · CASHFREE PAYMENTS
                </div>

                <div
                    style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 'clamp(32px, 4.5vw, 52px)',
                        color: '#f0e6c8',
                        lineHeight: 0.92,
                        letterSpacing: '0.02em',
                        marginBottom: 18,
                    }}
                >
                    RISK ENGINE
                </div>

                <div
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: '#a89060',
                        lineHeight: 1.7,
                        marginBottom: 20,
                    }}
                >
                    Schema-driven fraud rule engine. 200+ merchants self-configure transaction-blocking rules
                    with zero frontend deployments.
                </div>

                {[
                    { v: '200+', k: 'merchants self-serve' },
                    { v: '<120ms', k: 'p99 rule decision' },
                    { v: '40%', k: 'faster time-to-action' },
                ].map((m) => (
                    <div
                        key={m.k}
                        style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}
                    >
                        <span
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 28,
                                color: GOLD,
                                lineHeight: 1,
                            }}
                        >
                            {m.v}
                        </span>
                        <span
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 8,
                                color: '#5c4d30',
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                            }}
                        >
                            {m.k}
                        </span>
                    </div>
                ))}

                <div
                    style={{
                        marginTop: 14,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 8,
                        color: '#3344aa',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                    }}
                >
                    React · TypeScript · Zustand · Micro-frontends
                </div>

                <button
                    onClick={() => navigate('/work')}
                    style={{
                        marginTop: 18,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.18em',
                        color: GOLD,
                        textTransform: 'uppercase',
                        background: 'none',
                        border: `1px solid rgba(201,162,39,0.28)`,
                        padding: '8px 16px',
                        borderRadius: 3,
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                    }}
                >
                    VIEW ALL PROJECTS →
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   GRID OVERLAY — Tata 1mg systems
═══════════════════════════════════════════════════════ */
function GridOverlay({ divRef }: { divRef: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={divRef}
            style={{ position: 'fixed', inset: 0, zIndex: 10, opacity: 0, pointerEvents: 'none' }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '5%',
                    transform: 'translateY(-50%)',
                    maxWidth: 340,
                }}
            >
                <div
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.28em',
                        color: TEAL,
                        textTransform: 'uppercase',
                        marginBottom: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span style={{ display: 'block', width: 20, height: 1, background: TEAL }} />
                    THE GRID · TATA 1MG
                </div>

                <div
                    style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 'clamp(32px, 4.5vw, 52px)',
                        color: '#f0e6c8',
                        lineHeight: 0.92,
                        letterSpacing: '0.02em',
                        marginBottom: 18,
                    }}
                >
                    MAPS · PULSE · PIPELINE
                </div>

                <div
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: '#a89060',
                        lineHeight: 1.7,
                        marginBottom: 20,
                    }}
                >
                    Polygon delivery zones across 120+ cities. Real-time notifications cutting SLA breaches
                    from 70% to 15%. Turborepo monorepo shaving 64% off CI time.
                </div>

                {[
                    { v: '120+', k: 'cities covered' },
                    { v: '70→15%', k: 'SLA breach rate' },
                    { v: '80%', k: 'faster builds' },
                ].map((m) => (
                    <div
                        key={m.k}
                        style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}
                    >
                        <span
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 28,
                                color: TEAL,
                                lineHeight: 1,
                            }}
                        >
                            {m.v}
                        </span>
                        <span
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 8,
                                color: '#1a5050',
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                            }}
                        >
                            {m.k}
                        </span>
                    </div>
                ))}

                <div
                    style={{
                        marginTop: 14,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 8,
                        color: '#006655',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                    }}
                >
                    React · Node · Redis · Google Maps · Webpack · Turborepo
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   LATTICE OVERLAY — Moresand infrastructure
═══════════════════════════════════════════════════════ */
function LatticeOverlay({ divRef }: { divRef: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={divRef}
            style={{ position: 'fixed', inset: 0, zIndex: 10, opacity: 0, pointerEvents: 'none' }}
        >
            <div
                style={{
                    position: 'absolute',
                    bottom: '14%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    maxWidth: 440,
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.28em',
                        color: PURPLE_L,
                        textTransform: 'uppercase',
                        marginBottom: 14,
                    }}
                >
                    THE LATTICE · MORESAND TECHNOLOGIES
                </div>

                <div
                    style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 'clamp(30px, 4vw, 48px)',
                        color: '#f0e6c8',
                        lineHeight: 0.92,
                        letterSpacing: '0.02em',
                        marginBottom: 18,
                    }}
                >
                    BUILD INFRASTRUCTURE
                </div>

                <div
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: '#a89060',
                        lineHeight: 1.7,
                        marginBottom: 20,
                    }}
                >
                    Migrated legacy Backbone.js to React. PWA with service-worker pre-caching — 3× faster
                    delivery, 50% faster repeat visits.
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                    {[
                        { v: '3×', k: 'faster delivery' },
                        { v: '50%', k: 'faster repeat visits' },
                    ].map((m) => (
                        <div key={m.k} style={{ textAlign: 'center' }}>
                            <div
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: 36,
                                    color: PURPLE_L,
                                    lineHeight: 1,
                                }}
                            >
                                {m.v}
                            </div>
                            <div
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 8,
                                    color: '#552266',
                                    letterSpacing: '0.14em',
                                    textTransform: 'uppercase',
                                    marginTop: 2,
                                }}
                            >
                                {m.k}
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        marginTop: 16,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 8,
                        color: '#552266',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                    }}
                >
                    React · Next.js · React Query · PWA · Node.js
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   SPINE OVERLAY — career overview
═══════════════════════════════════════════════════════ */
const CAREER_NODES = [
    {
        event: 'ORIGIN POINT',
        year: '2017–21',
        company: 'IIIT Lucknow',
        role: 'B.Tech — Information Technology',
        metric: 'CGPA 8.14 — foundations laid',
        color: '#a89060',
    },
    {
        event: 'FIRST SIGNAL',
        year: '2021',
        company: 'Tata 1mg',
        role: 'SDE I — first production systems',
        metric: 'Maps across 20+ cities · PDF microservice',
        color: TEAL,
    },
    {
        event: 'SCALE ACHIEVED',
        year: '2023',
        company: 'Tata 1mg',
        role: 'SDE II — building at scale',
        metric: 'Build 15→3 min · SLA breach 70→15%',
        color: TEAL,
    },
    {
        event: 'NEW ARCHITECTURE',
        year: '2024',
        company: 'Moresand Technologies',
        role: 'Software Engineer — platform rebuild',
        metric: '3× faster delivery · PWA offline-first',
        color: PURPLE_L,
    },
    {
        event: 'CURRENT MISSION',
        year: '2025',
        company: 'Cashfree Payments',
        role: 'Frontend Engineer II — now',
        metric: '200+ merchants · 30% KYC drop reduction',
        color: GOLD,
        current: true,
    },
] as const;

function SpineOverlay({
    divRef,
    progress,
}: {
    divRef: React.RefObject<HTMLDivElement | null>;
    progress: React.MutableRefObject<number>;
}) {
    const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const NODE_BASE = 0.76;
        const NODE_STEP = 0.038;
        const FADE_SPAN = 0.024;
        let raf: number;
        const tick = () => {
            const p = progress.current;
            nodeRefs.current.forEach((el, i) => {
                if (!el) return;
                const lo = NODE_BASE + i * NODE_STEP;
                let v = 0;
                if (p >= lo && p < lo + FADE_SPAN) v = (p - lo) / FADE_SPAN;
                else if (p >= lo + FADE_SPAN) v = 1;
                el.style.opacity = String(v);
                el.style.transform = `translateX(${(1 - v) * 14}px)`;
            });
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [progress]);

    return (
        <div
            ref={divRef}
            style={{ position: 'fixed', inset: 0, zIndex: 10, opacity: 0, pointerEvents: 'none' }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    right: '5%',
                    transform: 'translateY(-50%)',
                    maxWidth: 360,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                }}
            >
                <div
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.28em',
                        color: GOLD,
                        textTransform: 'uppercase',
                        marginBottom: 18,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span style={{ display: 'block', width: 20, height: 1, background: GOLD }} />
                    THE SPINE — CAREER ARC
                </div>

                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 58,
                            color: '#f0e6c8',
                            lineHeight: 0.9,
                            letterSpacing: '0.02em',
                        }}
                    >
                        4.5
                    </span>
                    <span
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 9,
                            color: '#5c4d30',
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                            lineHeight: 1.6,
                        }}
                    >
                        YEARS OF
                        <br />
                        PRODUCTION WORK
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {CAREER_NODES.map((node, i) => (
                        <div
                            key={i}
                            ref={(el) => {
                                nodeRefs.current[i] = el;
                            }}
                            style={{
                                display: 'flex',
                                gap: 12,
                                alignItems: 'flex-start',
                                paddingBottom: 12,
                                borderBottom:
                                    i < CAREER_NODES.length - 1 ? '1px solid rgba(201,162,39,0.08)' : 'none',
                                opacity: 0,
                                transform: 'translateX(14px)',
                            }}
                        >
                            <div
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: node.color,
                                    boxShadow: `0 0 12px ${node.color}`,
                                    flexShrink: 0,
                                    marginTop: 5,
                                }}
                            />
                            <div>
                                <div
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: 8,
                                        color: node.color,
                                        letterSpacing: '0.16em',
                                        textTransform: 'uppercase',
                                        marginBottom: 2,
                                    }}
                                >
                                    {node.event} · {node.year}
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: '#f0e6c8',
                                        fontWeight: 500,
                                        marginBottom: 1,
                                    }}
                                >
                                    {node.company}
                                    {'current' in node && node.current && (
                                        <span
                                            style={{
                                                marginLeft: 6,
                                                fontSize: 7,
                                                background: GOLD,
                                                color: '#06040c',
                                                padding: '1px 5px',
                                                borderRadius: 2,
                                                letterSpacing: '0.12em',
                                                fontFamily: "'JetBrains Mono'",
                                            }}
                                        >
                                            NOW
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 10, color: '#a89060', marginBottom: 2 }}>
                                    {node.role}
                                </div>
                                <div
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: 8,
                                        color: '#5c4d30',
                                        letterSpacing: '0.08em',
                                    }}
                                >
                                    {node.metric}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => navigate('/about')}
                    style={{
                        marginTop: 20,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.18em',
                        color: GOLD,
                        textTransform: 'uppercase',
                        background: 'none',
                        border: `1px solid rgba(201,162,39,0.25)`,
                        padding: '8px 16px',
                        borderRadius: 3,
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                    }}
                >
                    VIEW FULL STORY →
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   VOID OVERLAY — contact portal
═══════════════════════════════════════════════════════ */
function VoidOverlay({ divRef }: { divRef: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={divRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10,
                opacity: 0,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
            }}
        >
            <div
                style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.3em',
                    color: '#5c4d30',
                    textTransform: 'uppercase',
                }}
            >
                THE LAST MILE — OR THE NEXT ONE
            </div>
            <div
                style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 'clamp(38px, 6vw, 72px)',
                    color: GOLD,
                    letterSpacing: '0.04em',
                    textShadow: `0 0 60px rgba(201,162,39,0.4)`,
                    textAlign: 'center',
                }}
            >
                OPEN A CHANNEL
            </div>
            <a
                href={`mailto:${IDENTITY.email}`}
                style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 'clamp(11px, 1.6vw, 16px)',
                    letterSpacing: '0.1em',
                    color: GOLD,
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(201,162,39,0.3)',
                    paddingBottom: 3,
                    pointerEvents: 'auto',
                }}
            >
                {IDENTITY.email}
            </a>
            <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
                {[
                    { label: 'LinkedIn', href: IDENTITY.linkedin },
                    { label: 'GitHub', href: IDENTITY.github },
                ].map((l) => (
                    <a
                        key={l.label}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 9,
                            letterSpacing: '0.18em',
                            color: '#5c4d30',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            pointerEvents: 'auto',
                        }}
                    >
                        {l.label} ↗
                    </a>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   PROGRESS BAR — right edge
═══════════════════════════════════════════════════════ */
const PROGRESS_SCENES = [
    'THE TOUCH',
    'THE SIGNAL',
    'THE EXCHANGE',
    'THE GRID',
    'THE LATTICE',
    'THE SPINE',
    'THE VOID',
] as const;

function ProgressBar({ progress }: { progress: React.MutableRefObject<number> }) {
    const barRef = useRef<HTMLDivElement>(null);
    const labelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let raf: number;
        const tick = () => {
            const p = progress.current;
            if (barRef.current) barRef.current.style.transform = `scaleY(${p})`;
            if (labelRef.current) {
                const idx =
                    p < 0.14
                        ? 0
                        : p < 0.28
                          ? 1
                          : p < 0.44
                            ? 2
                            : p < 0.6
                              ? 3
                              : p < 0.74
                                ? 4
                                : p < 0.88
                                  ? 5
                                  : 6;
                labelRef.current.textContent = PROGRESS_SCENES[idx];
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [progress]);

    return (
        <div
            style={{
                position: 'fixed',
                right: 20,
                top: '10%',
                bottom: '10%',
                width: 1,
                background: 'rgba(201,162,39,0.1)',
                zIndex: 20,
            }}
        >
            <div
                ref={barRef}
                style={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(180deg, ${BLUE_M}, ${TEAL}, ${GOLD})`,
                    transformOrigin: 'top',
                    transform: 'scaleY(0)',
                }}
            />
            <div
                ref={labelRef}
                style={{
                    position: 'absolute',
                    top: '50%',
                    right: 10,
                    transform: 'translateY(-50%) rotate(90deg)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    letterSpacing: '0.2em',
                    color: '#5c4d30',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                }}
            >
                THE TOUCH
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   TVA CURSOR
═══════════════════════════════════════════════════════ */
function TVACursor() {
    const ring = useRef<HTMLDivElement>(null);
    const dot = useRef<HTMLDivElement>(null);
    const tgt = useRef({ x: -200, y: -200 });
    const cur = useRef({ x: -200, y: -200 });
    const [hover, setHover] = useState(false);

    useEffect(() => {
        let raf: number;
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const onMove = (e: MouseEvent) => {
            tgt.current = { x: e.clientX, y: e.clientY };
            if (dot.current) dot.current.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
            const el = document.elementFromPoint(e.clientX, e.clientY);
            setHover(!!el?.closest('button,a,[role="button"]'));
        };
        const tick = () => {
            cur.current.x = lerp(cur.current.x, tgt.current.x, 0.11);
            cur.current.y = lerp(cur.current.y, tgt.current.y, 0.11);
            if (ring.current)
                ring.current.style.transform = `translate(${cur.current.x}px,${cur.current.y}px)`;
            raf = requestAnimationFrame(tick);
        };
        tick();
        window.addEventListener('mousemove', onMove, { passive: true });
        return () => {
            window.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <>
            <div ref={ring} className={`tva-cursor${hover ? 'tva-cursor-hover' : ''}`} aria-hidden="true" />
            <div ref={dot} className="tva-cursor-dot" aria-hidden="true" />
        </>
    );
}

/* ═══════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════ */
export default function CinematicHome(): JSX.Element {
    const progress = useCamProgress();
    const mouseRef = useRef({ x: 0, y: 0 });
    const driverRef = useRef<HTMLDivElement>(null);

    const touchRef = useRef<HTMLDivElement>(null);
    const exchangeRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const latticeRef = useRef<HTMLDivElement>(null);
    const spineRef = useRef<HTMLDivElement>(null);
    const voidRef = useRef<HTMLDivElement>(null);

    const overlays = useMemo<OverlayDef[]>(
        () => [
            { ref: touchRef, lo: -0.1, hi: 0.28, fl: 0.06 },
            { ref: exchangeRef, lo: 0.26, hi: 0.55 },
            { ref: gridRef, lo: 0.42, hi: 0.7 },
            { ref: latticeRef, lo: 0.58, hi: 0.78 },
            { ref: spineRef, lo: 0.72, hi: 0.93 },
            { ref: voidRef, lo: 0.86, hi: 1.02 },
        ],
        []
    );

    useOverlayAnimator(progress, overlays);

    const { muted, toggleMute } = useSoundEngine(progress);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', onMove, { passive: true });
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    useEffect(() => {
        const scroller = document.querySelector('.v2-root');
        if (!scroller) return undefined;
        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                scroller,
                trigger: driverRef.current,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.7,
                onUpdate: (self) => {
                    progress.current = self.progress;
                },
            });
        });
        return () => ctx.revert();
    }, [progress]);

    return (
        <>
            <TVACursor />
            <div className="tva-grain" aria-hidden="true" />

            {/* Fixed 3D canvas */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#02010a' }}>
                <Canvas
                    camera={{ position: [0, 2, 20], fov: 50, near: 0.1, far: 1000 }}
                    gl={{ antialias: true, alpha: false }}
                    dpr={[1, 1.5]}
                >
                    <Scene progress={progress} mouse={mouseRef} />
                </Canvas>
            </div>

            <div
                className="tva-scanlines"
                aria-hidden="true"
                style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}
            />

            {/* Scene overlays */}
            <TouchOverlay divRef={touchRef} />
            <ExchangeOverlay divRef={exchangeRef} />
            <GridOverlay divRef={gridRef} />
            <LatticeOverlay divRef={latticeRef} />
            <SpineOverlay divRef={spineRef} progress={progress} />
            <VoidOverlay divRef={voidRef} />
            <ProgressBar progress={progress} />

            <SoundToggle muted={muted} onToggle={toggleMute} />

            {/* 500vh scroll driver */}
            <div
                ref={driverRef}
                className="gm-home"
                style={{ height: '500vh', position: 'relative', zIndex: 0, pointerEvents: 'none' }}
            />
        </>
    );
}
