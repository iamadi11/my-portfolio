/* eslint-disable react/no-unknown-property */
'use client';

/**
 * CINEMATIC HOME — The 3D IS the experience.
 *
 * Narrative: Loki's journey → Aditya's career
 *   0%–22%   TESSERACT  — crystal cube hero, name reveal
 *   22%–50%  TVA        — portals materialize, choose path
 *   50%–78%  TIMELINE   — sacred timeline tree with energy flow
 *   78%–100% THE VOID   — floating debris, contact
 */

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { Environment, Stars } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing';
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
const G3 = new THREE.Color(GOLD);
// Chromatic aberration offset — subtle film fringe
const CA_OFFSET = new THREE.Vector2(0.00055, 0.00035);

// Tesseract
const L = 8,
    S = 3.8;
const OV: [number, number, number][] = [
    [-L, -L, -L],
    [L, -L, -L],
    [-L, L, -L],
    [L, L, -L],
    [-L, -L, L],
    [L, -L, L],
    [-L, L, L],
    [L, L, L],
];
const IV: [number, number, number][] = [
    [-S, -S, -S],
    [S, -S, -S],
    [-S, S, -S],
    [S, S, -S],
    [-S, -S, S],
    [S, -S, S],
    [-S, S, S],
    [S, S, S],
];
const EDGES: [number, number][] = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
];

// Camera journey keyframes
type CamKey = { p: number; px: number; py: number; pz: number; lx: number; ly: number; lz: number };
const CAM: CamKey[] = [
    { p: 0.0, px: 0, py: 0, pz: 26, lx: 0, ly: 0, lz: 0 },
    { p: 0.12, px: -2, py: 1, pz: 22, lx: 0, ly: 0, lz: 0 },
    { p: 0.3, px: 0, py: 0, pz: 50, lx: 0, ly: 0, lz: 0 },
    { p: 0.52, px: 0, py: 0, pz: 50, lx: 0, ly: 0, lz: 0 },
    { p: 0.66, px: 24, py: 4, pz: 36, lx: 22, ly: 0, lz: 0 },
    { p: 0.82, px: 24, py: 4, pz: 32, lx: 22, ly: 0, lz: 0 },
    { p: 1.0, px: 0, py: -12, pz: 36, lx: 0, ly: -7, lz: 0 },
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
    const pos = useRef(new THREE.Vector3(0, 0, 26));
    const look = useRef(new THREE.Vector3(0, 0, 0));
    const tPos = useRef(new THREE.Vector3(0, 0, 26));
    const tLook = useRef(new THREE.Vector3(0, 0, 0));
    const mLerp = useRef({ x: 0, y: 0 }); // smooth mouse lag

    useFrame(({ clock }) => {
        const elapsed = clock.getElapsedTime();
        const p = Math.max(0, Math.min(1, progress.current));

        // Scroll-driven position
        let i = 0;
        for (let k = CAM.length - 2; k >= 0; k--) {
            if (p >= CAM[k].p) {
                i = k;
                break;
            }
        }
        const k0 = CAM[i],
            k1 = CAM[Math.min(i + 1, CAM.length - 1)];
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

        // Mouse parallax — inertial, fades out past portal scene
        mLerp.current.x += (mouse.current.x - mLerp.current.x) * 0.055;
        mLerp.current.y += (mouse.current.y - mLerp.current.y) * 0.055;
        const falloff = Math.max(0, 1 - p * 2.2);
        camera.position.x += mLerp.current.x * 2.4 * falloff;
        camera.position.y += mLerp.current.y * 1.2 * falloff;

        // Camera breathe — subtle living quality, only in tesseract scene
        const breathe = Math.sin(elapsed * 0.28) * 0.09 * Math.max(0, 1 - p * 5);
        camera.position.y += breathe;

        // Dynamic FOV — tight on tesseract, wide on void
        const pc = camera as THREE.PerspectiveCamera;
        const targetFov = p < 0.22 ? 46 : p < 0.55 ? 52 : p < 0.82 ? 50 : 57;
        if (Math.abs(pc.fov - targetFov) > 0.05) {
            pc.fov += (targetFov - pc.fov) * 0.022;
            pc.updateProjectionMatrix();
        }
    });
    return null;
}

/* ═══════════════════════════════════════════════════════
   CRYSTAL TESSERACT — iridescent gem, energy core
═══════════════════════════════════════════════════════ */
function edgesGeo(verts: [number, number, number][]): THREE.BufferGeometry {
    return new THREE.BufferGeometry().setFromPoints(
        EDGES.flatMap(([a, b]) => [new THREE.Vector3(...verts[a]), new THREE.Vector3(...verts[b])])
    );
}

function CrystalTesseract({ progress }: { progress: React.MutableRefObject<number> }) {
    const root = useRef<THREE.Group>(null!);
    const outer = useRef<THREE.Group>(null!);
    const inner = useRef<THREE.Group>(null!);
    const lightRef = useRef<THREE.PointLight>(null!);

    const oGeo = useMemo(() => edgesGeo(OV), []);
    const iGeo = useMemo(() => edgesGeo(IV), []);

    const connGeo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 2 * 3), 3));
        return g;
    }, []);

    const oMat = useMemo(
        () => new THREE.LineBasicMaterial({ color: G3, transparent: true, opacity: 0.85 }),
        []
    );
    const iMat = useMemo(
        () => new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.85 }),
        []
    );
    const cMat = useMemo(
        () => new THREE.LineBasicMaterial({ color: '#e8b730', transparent: true, opacity: 0.25 }),
        []
    );

    // Crystal faces — iridescent gem material
    const solidOuter = useMemo(
        () =>
            new THREE.MeshPhysicalMaterial({
                color: '#c8940a',
                iridescence: 0.6,
                iridescenceIOR: 1.7,
                iridescenceThicknessRange: [200, 600] as [number, number],
                metalness: 0.5,
                roughness: 0.1,
                transparent: true,
                opacity: 0.05,
                depthWrite: false,
                emissive: GOLD,
                emissiveIntensity: 0.5,
                side: THREE.BackSide,
            }),
        []
    );

    const solidInner = useMemo(
        () =>
            new THREE.MeshPhysicalMaterial({
                color: '#a0f0ff',
                iridescence: 1.0,
                iridescenceIOR: 2.2,
                iridescenceThicknessRange: [80, 400] as [number, number],
                metalness: 0.0,
                roughness: 0.0,
                transparent: true,
                opacity: 0.07,
                depthWrite: false,
                emissive: TEAL,
                emissiveIntensity: 3.8,
                side: THREE.DoubleSide,
            }),
        []
    );

    const ovW = useMemo(() => OV.map((v) => new THREE.Vector3(...v)), []);
    const ivW = useMemo(() => IV.map((v) => new THREE.Vector3(...v)), []);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;
        const vis = Math.max(0, Math.min(1, 1 - (p - 0.26) / 0.12));
        if (root.current) {
            root.current.visible = vis > 0.01;
            root.current.scale.setScalar(vis);
        }
        if (!vis) return;

        if (outer.current) {
            outer.current.rotation.x = t * 0.043;
            outer.current.rotation.y = t * 0.069;
            oMat.opacity = (0.6 + Math.sin(t * 0.8) * 0.3) * vis;
            solidOuter.emissiveIntensity = (0.4 + Math.sin(t * 0.6) * 0.15) * vis;
        }
        if (inner.current) {
            inner.current.rotation.x = -t * 0.13;
            inner.current.rotation.y = t * 0.2;
            inner.current.rotation.z = -t * 0.07;
            const pulse = 0.82 + Math.sin(t * 0.75) * 0.18;
            inner.current.scale.setScalar(pulse);
            iMat.opacity = (0.8 + Math.sin(t * 1.1) * 0.2) * vis;
            solidInner.emissiveIntensity = (1.8 + Math.sin(t * 0.9) * 0.6) * vis;
        }

        // Interior light pulses with inner cube
        if (lightRef.current) {
            lightRef.current.intensity = (4 + Math.sin(t * 1.3) * 2) * vis;
        }

        // Connector lines
        const pos = connGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < 8; i++) {
            ovW[i].set(...OV[i]).applyMatrix4(outer.current.matrixWorld);
            ivW[i].set(...IV[i]).applyMatrix4(inner.current.matrixWorld);
            pos.setXYZ(i * 2, ovW[i].x, ovW[i].y, ovW[i].z);
            pos.setXYZ(i * 2 + 1, ivW[i].x, ivW[i].y, ivW[i].z);
        }
        pos.needsUpdate = true;
        cMat.opacity = (0.18 + Math.sin(t * 0.55) * 0.1) * vis;
    });

    return (
        <group ref={root}>
            <group ref={outer}>
                <lineSegments geometry={oGeo} material={oMat} />
                <mesh>
                    <boxGeometry args={[L * 2, L * 2, L * 2]} />
                    <primitive object={solidOuter} />
                </mesh>
            </group>
            <group ref={inner}>
                <lineSegments geometry={iGeo} material={iMat} />
                <mesh>
                    <boxGeometry args={[S * 2, S * 2, S * 2]} />
                    <primitive object={solidInner} />
                </mesh>
            </group>
            <lineSegments geometry={connGeo} material={cMat} />
            {/* Pulsing interior light — casts glow on scene */}
            <pointLight ref={lightRef} color={TEAL} intensity={4} distance={28} decay={2} />
            {/* Energy core — additive creates physical glow source */}
            <mesh>
                <sphereGeometry args={[1.6, 24, 24]} />
                <meshStandardMaterial
                    color="#60e8ff"
                    emissive="#00b8d8"
                    emissiveIntensity={4.5}
                    transparent
                    opacity={0.18}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
            {/* Mid glow halo */}
            <mesh>
                <sphereGeometry args={[3.2, 16, 16]} />
                <meshStandardMaterial
                    color={TEAL}
                    emissive={TEAL}
                    emissiveIntensity={1.8}
                    transparent
                    opacity={0.06}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    );
}

/* ═══════════════════════════════════════════════════════
   TVA PORTAL — concentric rings + inner disc + swirl
═══════════════════════════════════════════════════════ */
const PORTAL_R = 5.2;

function TVAPortal({
    pos,
    accentColor,
    visRange,
    progress,
}: {
    pos: [number, number, number];
    accentColor: string;
    visRange: [number, number];
    progress: React.MutableRefObject<number>;
}) {
    const root = useRef<THREE.Group>(null!);
    const ring = useRef<THREE.Group>(null!);
    const swirl = useRef<THREE.Points>(null!);

    const ac3 = useMemo(() => new THREE.Color(accentColor), [accentColor]);

    const ringMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: accentColor,
                emissive: accentColor,
                emissiveIntensity: 3,
                metalness: 0.9,
                roughness: 0.05,
            }),
        [accentColor]
    );

    const innerRingMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: TEAL,
                emissive: TEAL,
                emissiveIntensity: 2,
                metalness: 0.8,
                roughness: 0.1,
            }),
        []
    );

    // Inner disc — deep void, no emissive tint
    const discMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#000005',
                emissive: '#000005',
                emissiveIntensity: 0,
                transparent: true,
                opacity: 0.88,
                side: THREE.DoubleSide,
                depthWrite: false,
            }),
        []
    );

    const swirlGeo = useMemo(() => {
        const n = 700;
        const buf = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * PORTAL_R * 0.88;
            buf[i * 3] = Math.cos(a) * r;
            buf[i * 3 + 1] = Math.sin(a) * r;
            buf[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(buf, 3));
        return g;
    }, []);

    const swirlMat = useMemo(
        () =>
            new THREE.PointsMaterial({
                color: ac3,
                size: 0.055,
                transparent: true,
                opacity: 0.5,
                sizeAttenuation: true,
            }),
        [ac3]
    );

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;
        const [lo, hi] = visRange;
        let v = 0;
        if (p >= lo && p < lo + 0.07) v = (p - lo) / 0.07;
        else if (p >= lo + 0.07 && p < hi - 0.07) v = 1;
        else if (p >= hi - 0.07 && p < hi) v = 1 - (p - (hi - 0.07)) / 0.07;

        if (root.current) {
            root.current.visible = v > 0.01;
            root.current.scale.setScalar(0.4 + v * 0.6);
        }
        if (!v) return;
        if (ring.current) ring.current.rotation.z = t * 0.38;
        if (swirl.current) swirl.current.rotation.z = -t * 0.24;
        ringMat.emissiveIntensity = (2.8 + Math.sin(t * 0.9) * 0.7) * v;
        discMat.emissiveIntensity = (0.14 + Math.sin(t * 0.6) * 0.06) * v;
        swirlMat.opacity = (0.4 + Math.sin(t * 1.2) * 0.12) * v;
    });

    return (
        <group ref={root} position={pos}>
            {/* Inner disc — dark portal mouth */}
            <mesh>
                <circleGeometry args={[PORTAL_R - 0.22, 64]} />
                <primitive object={discMat} />
            </mesh>
            <group ref={ring}>
                <mesh>
                    <torusGeometry args={[PORTAL_R, 0.18, 16, 100]} />
                    <primitive object={ringMat} />
                </mesh>
                <mesh>
                    <torusGeometry args={[PORTAL_R - 0.32, 0.055, 8, 80]} />
                    <primitive object={innerRingMat} />
                </mesh>
                <mesh>
                    <torusGeometry args={[PORTAL_R + 0.38, 0.038, 6, 70]} />
                    <primitive object={ringMat} />
                </mesh>
                {/* Outer halo ring — slow counter-rotation */}
                <mesh rotation={[0, 0, 0.8]}>
                    <torusGeometry args={[PORTAL_R + 0.9, 0.018, 4, 60]} />
                    <primitive object={ringMat} />
                </mesh>
            </group>
            <points ref={swirl} geometry={swirlGeo} material={swirlMat} />
            {/* Atmospheric glow — adds physical depth behind the portal mouth */}
            <mesh position={[0, 0, -0.8]}>
                <sphereGeometry args={[PORTAL_R * 0.62, 14, 14]} />
                <meshStandardMaterial
                    color={accentColor}
                    emissive={accentColor}
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
   ENERGY FLOW — particles racing along timeline branches
═══════════════════════════════════════════════════════ */
const FLOW_PARTICLES = 28; // per branch
const FLOW_STEPS = 80; // sample resolution per curve

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

    // Pre-sample all curves
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
        if (!flowRef.current?.visible) return; // skip when hidden
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
   SACRED TIMELINE — Loki's journey as 3D tree
   Maps: tesseract → TVA → nexus → variant → god of stories
═══════════════════════════════════════════════════════ */
const TIMELINE_ORIGIN: [number, number, number] = [22, 0, -3];

function SacredTimeline({ progress }: { progress: React.MutableRefObject<number> }) {
    const root = useRef<THREE.Group>(null!);

    // Branch definitions — Loki's arc mapped to career
    const { branches, goldCurves, tealCurves, prunedCurves } = useMemo(() => {
        const main = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -10, 0),
            new THREE.Vector3(0.4, -5, 0.6),
            new THREE.Vector3(-0.3, 0, 0.2),
            new THREE.Vector3(0.6, 5, 0.4),
            new THREE.Vector3(0, 10, 0),
            new THREE.Vector3(0.2, 13, 0),
        ]);
        // Left lower: "The Void" — pruned branch
        const voidBranch = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -3, 0),
            new THREE.Vector3(-4, -1, 1),
            new THREE.Vector3(-7, 1, 0),
            new THREE.Vector3(-8, 2, 0),
        ]);
        // Right lower: "TVA Variant" — golden secondary
        const tvaBranch = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(4, 3, 1),
            new THREE.Vector3(7, 4, 0),
            new THREE.Vector3(9, 6, 0),
        ]);
        // Left upper: nexus event branch — pruned (teal, shorter)
        const nexusBranch = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 5, 0),
            new THREE.Vector3(-3, 7, 0.5),
            new THREE.Vector3(-5, 8, 0),
        ]);
        // Right upper: "Enchantress path" — golden
        const enchBranch = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 7, 0),
            new THREE.Vector3(4, 9, 1),
            new THREE.Vector3(6, 10, 0),
            new THREE.Vector3(7, 11, 0),
        ]);
        // Sub-branch from void branch: pruned fragment
        const voidSub = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-7, 1, 0),
            new THREE.Vector3(-9, 3, 0.4),
            new THREE.Vector3(-8, 5, 0),
        ]);
        // Tip: "God of Stories" — splits open upward
        const godBranch = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 10, 0),
            new THREE.Vector3(1.2, 12, 0.5),
            new THREE.Vector3(0.4, 14, 0),
        ]);

        const branchDefs = [
            { curve: main, radius: 0.11, isMain: true, isTeal: false, isPruned: false },
            { curve: tvaBranch, radius: 0.065, isMain: false, isTeal: false, isPruned: false },
            { curve: enchBranch, radius: 0.058, isMain: false, isTeal: false, isPruned: false },
            { curve: godBranch, radius: 0.075, isMain: false, isTeal: false, isPruned: false },
            { curve: voidBranch, radius: 0.05, isMain: false, isTeal: true, isPruned: true },
            { curve: nexusBranch, radius: 0.042, isMain: false, isTeal: true, isPruned: true },
            { curve: voidSub, radius: 0.032, isMain: false, isTeal: true, isPruned: true },
        ];

        const bs = branchDefs.map((b) => ({
            ...b,
            geo: new THREE.TubeGeometry(b.curve, 60, b.radius, 8, false),
        }));

        return {
            branches: bs,
            goldCurves: [main, tvaBranch, enchBranch, godBranch],
            tealCurves: [nexusBranch],
            prunedCurves: [voidBranch, voidSub],
        };
    }, []);

    // Nodes: [x, y, z, color, radius, isPrimary]
    const nodes = useMemo<[number, number, number, string, number, boolean][]>(
        () => [
            [0, -10, 0, GOLD, 0.3, false], // origin
            [0, -3, 0, GOLD, 0.42, false], // tesseract pick-up (IIIT Lucknow)
            [0, 1, 0, GOLD, 0.52, true], // TVA capture (Tata 1mg SDE I)
            [0, 5, 0, GOLD, 0.58, true], // nexus event (Tata 1mg SDE II)
            [9, 6, 0, GOLD, 0.42, false], // TVA variant branch tip
            [0, 7, 0, GOLD, 0.64, true], // Moresand pivot
            [0, 10, 0, GOLD, 0.78, true], // Cashfree — current (brightest)
            [-8, 2, 0, TEAL, 0.32, false], // void branch node
            [-5, 8, 0, TEAL, 0.28, false], // nexus marker
            [7, 11, 0, GOLD, 0.36, false], // enchantress path tip
            [0, 13, 0, '#f5d56e', 0.55, false], // god of stories tip
        ],
        []
    );

    const tubeMat = useMemo(
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

    const branchMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: TEAL,
                emissive: TEAL,
                emissiveIntensity: 1.5,
                metalness: 0.3,
                roughness: 0.2,
            }),
        []
    );

    const prunedMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: TEAL,
                emissive: TEAL,
                emissiveIntensity: 0.8,
                metalness: 0.2,
                roughness: 0.3,
                transparent: true,
                opacity: 0.55,
            }),
        []
    );

    const nodeMats = useMemo(
        () =>
            nodes.map((n) => {
                const color = n[3];
                const isPrimary = n[5];
                return new THREE.MeshStandardMaterial({
                    color,
                    emissive: color,
                    emissiveIntensity: isPrimary ? 5 : 3,
                    metalness: 0.8,
                    roughness: 0.05,
                });
            }),
        [nodes]
    );

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;
        let v = 0;
        if (p >= 0.55 && p < 0.62) v = (p - 0.55) / 0.07;
        else if (p >= 0.62 && p < 0.87) v = 1;
        else if (p >= 0.87 && p < 0.94) v = 1 - (p - 0.87) / 0.07;

        if (root.current) {
            root.current.visible = v > 0.01;
            root.current.scale.setScalar(0.5 + v * 0.5);
        }
        if (!v) return;

        tubeMat.emissiveIntensity = (1.8 + Math.sin(t * 0.7) * 0.4) * v;
        branchMat.emissiveIntensity = (1.4 + Math.sin(t * 0.9) * 0.3) * v;
        prunedMat.emissiveIntensity = (0.6 + Math.sin(t * 1.1) * 0.2) * v;
        prunedMat.opacity = (0.45 + Math.sin(t * 0.8) * 0.08) * v;

        nodeMats.forEach((m, i) => {
            const isPrimary = nodes[i][5];
            m.emissiveIntensity = ((isPrimary ? 4.5 : 2.8) + Math.sin(t * 0.8 + i * 0.9) * 0.9) * v;
        });
    });

    const getMat = (b: (typeof branches)[0]) => {
        if (b.isPruned) return prunedMat;
        if (b.isTeal) return branchMat;
        return tubeMat;
    };

    return (
        <group ref={root} position={TIMELINE_ORIGIN}>
            {/* Branch tubes */}
            {branches.map((b, i) => (
                <mesh key={i} geometry={b.geo} material={getMat(b)} />
            ))}

            {/* Nodes */}
            {nodes.map(([x, y, z, , r], i) => (
                <mesh key={i} position={[x, y, z]}>
                    <sphereGeometry args={[r, 20, 20]} />
                    <primitive object={nodeMats[i]} />
                </mesh>
            ))}

            {/* Energy flowing along golden branches */}
            <EnergyFlow curves={goldCurves} color={GOLD} speed={0.14} size={0.065} />

            {/* Slower teal flow on secondary branches */}
            <EnergyFlow curves={tealCurves} color={TEAL} speed={0.08} size={0.045} />

            {/* Dispersing particles on pruned branches — energy bleeding out */}
            <EnergyFlow curves={prunedCurves} color={TEAL} speed={0.05} size={0.032} />
        </group>
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
            ref.current.rotation.y = t * 0.006;
            ref.current.rotation.x = t * 0.003;
        }
    });
    return (
        <points ref={ref} geometry={geo}>
            <pointsMaterial color={GOLD} size={0.065} transparent opacity={0.24} sizeAttenuation />
        </points>
    );
}

/* ═══════════════════════════════════════════════════════
   VOID DEBRIS — pruned timeline fragments drifting
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
                pos: [rng(-15, 14), rng(-8, 12), rng(-20, 16)],
                rx: 0.3,
                ry: 0.7,
                rz: 0.2,
                size: 1.4,
                spd: [0.012, 0.008, 0.015],
            },
            {
                pos: [rng(12, 14), rng(-10, 14), rng(-18, 14)],
                rx: 0.6,
                ry: 0.4,
                rz: 0.8,
                size: 0.9,
                spd: [0.018, 0.012, 0.009],
            },
            {
                pos: [rng(-5, 10), rng(-12, 8), rng(-22, 12)],
                rx: 0.1,
                ry: 0.9,
                rz: 0.4,
                size: 1.1,
                spd: [0.009, 0.016, 0.011],
            },
            {
                pos: [rng(8, 12), rng(4, 14), rng(-16, 14)],
                rx: 0.8,
                ry: 0.2,
                rz: 0.6,
                size: 0.7,
                spd: [0.014, 0.01, 0.018],
            },
            {
                pos: [rng(-10, 14), rng(6, 10), rng(-24, 10)],
                rx: 0.5,
                ry: 0.5,
                rz: 0.3,
                size: 1.6,
                spd: [0.007, 0.013, 0.01],
            },
            {
                pos: [rng(4, 16), rng(-6, 16), rng(-12, 18)],
                rx: 0.4,
                ry: 0.6,
                rz: 0.7,
                size: 0.6,
                spd: [0.016, 0.007, 0.014],
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
                opacity: 0.07,
                wireframe: true,
            }),
        []
    );

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;
        // Appear only in void scene
        const v = p >= 0.82 ? Math.min(1, (p - 0.82) / 0.1) : 0;
        if (root.current) root.current.visible = v > 0.01;
        if (!v) return;
        mat.opacity = 0.06 * v;

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
   SCENE FOG — exponential depth haze
═══════════════════════════════════════════════════════ */
function SceneFog() {
    const { scene } = useThree();
    useEffect(() => {
        scene.fog = new THREE.FogExp2('#03020a', 0.0036);
        return () => {
            scene.fog = null;
        };
    }, [scene]);
    return null;
}

/* ═══════════════════════════════════════════════════════
   FULL 3D SCENE
═══════════════════════════════════════════════════════ */
// Reduced-motion: detect once at module level (SSR-safe)
const REDUCED_MOTION =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Scene({
    progress,
    mouse,
}: {
    progress: React.MutableRefObject<number>;
    mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
    if (REDUCED_MOTION) {
        return <Stars radius={200} depth={80} count={2000} factor={2} fade speed={0} />;
    }
    return (
        <>
            <SceneFog />
            <CameraRig progress={progress} mouse={mouse} />

            {/* Three-point lighting — balanced for materials without bloom halos */}
            <directionalLight position={[8, 14, 10]} intensity={1.2} color="#ffd880" />
            <directionalLight position={[-10, 2, -8]} intensity={0.55} color="#00b8d0" />
            <directionalLight position={[2, -10, -10]} intensity={0.22} color="#5060cc" />
            <ambientLight color="#060410" intensity={0.5} />

            {/* HDRI environment — enables PBR reflections + iridescence */}
            <Suspense fallback={null}>
                <Environment preset="city" background={false} />
            </Suspense>

            <Stars radius={200} depth={80} count={4200} factor={3} fade speed={0.22} />
            <VoidDust />
            <VoidDebris progress={progress} />
            <CrystalTesseract progress={progress} />

            <TVAPortal pos={[-17, 0, -4]} accentColor={GOLD} visRange={[0.27, 0.6]} progress={progress} />
            <TVAPortal pos={[0, 11, -7]} accentColor={TEAL} visRange={[0.27, 0.6]} progress={progress} />
            <TVAPortal pos={[17, 0, -4]} accentColor={GOLD} visRange={[0.27, 0.6]} progress={progress} />

            <SacredTimeline progress={progress} />

            <EffectComposer>
                <Bloom intensity={2.0} luminanceThreshold={0.14} luminanceSmoothing={0.88} mipmapBlur />
                <ChromaticAberration offset={CA_OFFSET} />
                <Vignette eskil={false} offset={0.15} darkness={0.65} />
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
   HERO OVERLAY
═══════════════════════════════════════════════════════ */
function HeroOverlay({ divRef }: { divRef: React.RefObject<HTMLDivElement | null> }) {
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
                    background: 'rgba(201,162,39,0.07)',
                    border: '1px solid rgba(201,162,39,0.22)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    color: GOLD,
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
                TVA CLEARANCE · NEXUS VARIANT · LEVEL Ω
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
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.26em',
                    color: '#5c4d30',
                    textTransform: 'uppercase',
                    marginTop: 36,
                }}
            >
                ↓ SCROLL TO ENTER THE TIMELINE
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   PORTAL OVERLAY
═══════════════════════════════════════════════════════ */
function PortalOverlay({ divRef }: { divRef: React.RefObject<HTMLDivElement | null> }) {
    const portals = [
        { label: 'THE WORK', sub: 'Projects & Case Studies', route: '/work', x: '15%', y: '60%' },
        { label: 'THE STORY', sub: 'Experience & Skills', route: '/about', x: '50%', y: '26%' },
        { label: 'REACH OUT', sub: 'Contact & Hire', route: '/contact', x: '85%', y: '60%' },
    ];
    return (
        <div
            ref={divRef}
            style={{ position: 'fixed', inset: 0, zIndex: 10, opacity: 0, pointerEvents: 'none' }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '14%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.28em',
                    color: '#5c4d30',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                }}
            >
                — CHOOSE YOUR PATH THROUGH THE TIMELINE —
            </div>
            {portals.map((p) => (
                <button
                    key={p.route}
                    onClick={() => navigate(p.route)}
                    aria-label={p.label}
                    style={{
                        position: 'absolute',
                        left: p.x,
                        top: p.y,
                        transform: 'translate(-50%,-50%)',
                        background: 'none',
                        border: 'none',
                        textAlign: 'center',
                        borderRadius: 4,
                        padding: '8px 12px',
                        outline: 'none',
                        cursor: 'pointer',
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.outline = '2px solid rgba(201,162,39,0.7)';
                        e.currentTarget.style.outlineOffset = '6px';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.outline = 'none';
                    }}
                >
                    <div
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 'clamp(22px, 2.8vw, 34px)',
                            letterSpacing: '0.07em',
                            color: GOLD,
                            textShadow: `0 0 40px rgba(201,162,39,0.5)`,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {p.label}
                    </div>
                    <div
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 9,
                            letterSpacing: '0.18em',
                            color: '#5c4d30',
                            textTransform: 'uppercase',
                            marginTop: 6,
                        }}
                    >
                        {p.sub}
                    </div>
                </button>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   TIMELINE OVERLAY — Loki journey narrative
═══════════════════════════════════════════════════════ */
const LOKI_NODES = [
    {
        lokiEvent: 'TESSERACT ACQUIRED',
        year: '2017–21',
        company: 'IIIT Lucknow',
        role: 'B.Tech — Information Technology',
        metric: 'CGPA 8.14 — the origin point',
        color: GOLD,
    },
    {
        lokiEvent: 'CAPTURED BY THE TVA',
        year: '2021',
        company: 'Tata 1mg',
        role: 'SDE I — first production systems',
        metric: 'Maps across 20+ cities, PDF microservice',
        color: GOLD,
    },
    {
        lokiEvent: 'NEXUS EVENT DETECTED',
        year: '2023',
        company: 'Tata 1mg',
        role: 'SDE II — building at scale',
        metric: 'Build time 15→3 min · SLA breach 70→15%',
        color: GOLD,
    },
    {
        lokiEvent: 'TIMELINE BRANCHING',
        year: '2024',
        company: 'Moresand Technologies',
        role: 'Software Engineer — new path',
        metric: '3× faster delivery · PWA offline-first',
        color: TEAL,
    },
    {
        lokiEvent: 'GOD OF THE TIMELINE',
        year: '2025',
        company: 'Cashfree Payments',
        role: 'Frontend Engineer II — current',
        metric: '200+ merchants · 30% KYC drop reduction',
        color: '#f5d56e',
        current: true,
    },
] as const;

function TimelineOverlay({ divRef }: { divRef: React.RefObject<HTMLDivElement | null> }) {
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
                {/* Header */}
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
                    SACRED TIMELINE — VARIANT LOG
                </div>

                {/* Years total badge */}
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
                        YEARS ON THE TIMELINE
                    </span>
                </div>

                {/* Loki event nodes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {LOKI_NODES.map((node, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                gap: 12,
                                alignItems: 'flex-start',
                                paddingBottom: 12,
                                borderBottom:
                                    i < LOKI_NODES.length - 1 ? '1px solid rgba(201,162,39,0.08)' : 'none',
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
                                    {node.lokiEvent} · {node.year}
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
                                                background: node.color,
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
                    VIEW FULL TIMELINE →
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   VOID OVERLAY
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
                END OF TIME — OR THE BEGINNING
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
   SCROLL PROGRESS BAR — right edge
═══════════════════════════════════════════════════════ */
const PROGRESS_SCENES = ['TESSERACT', 'TVA PORTALS', 'TIMELINE', 'THE VOID'] as const;

function ProgressBar({ progress }: { progress: React.MutableRefObject<number> }) {
    const barRef = useRef<HTMLDivElement>(null);
    const labelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let raf: number;
        const tick = () => {
            const p = progress.current;
            if (barRef.current) barRef.current.style.transform = `scaleY(${p})`;
            if (labelRef.current) {
                const idx = p < 0.27 ? 0 : p < 0.55 ? 1 : p < 0.82 ? 2 : 3;
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
                    background: `linear-gradient(180deg, ${GOLD}, ${TEAL})`,
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
                TESSERACT
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

    // Overlay refs — all driven by one RAF
    const heroRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const voidRef = useRef<HTMLDivElement>(null);

    const overlays = useMemo<OverlayDef[]>(
        () => [
            { ref: heroRef, lo: -0.1, hi: 0.27, fl: 0.06 },
            { ref: portalRef, lo: 0.27, hi: 0.6 },
            { ref: timelineRef, lo: 0.57, hi: 0.93 },
            { ref: voidRef, lo: 0.86, hi: 1.02 },
        ],
        []
    );

    useOverlayAnimator(progress, overlays);

    const { muted, toggleMute } = useSoundEngine(progress);

    // Mouse tracking for camera parallax
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
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#06040c' }}>
                <Canvas
                    camera={{ position: [0, 0, 26], fov: 50, near: 0.1, far: 1000 }}
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
            <HeroOverlay divRef={heroRef} />
            <PortalOverlay divRef={portalRef} />
            <TimelineOverlay divRef={timelineRef} />
            <VoidOverlay divRef={voidRef} />
            <ProgressBar progress={progress} />

            {/* Sound toggle */}
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
