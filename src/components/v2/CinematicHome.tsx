/* eslint-disable react/no-unknown-property */
'use client';

import { useEffect, useMemo, useRef } from 'react';

import { Float, Line, Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import * as THREE from 'three';

import { navigate } from './Chrome';
import { IDENTITY } from './data';

gsap.registerPlugin(ScrollTrigger);

/* ─── UTILS ─────────────────────────────────────── */
function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}
function clamp(x: number, lo = 0, hi = 1) {
    return Math.max(lo, Math.min(hi, x));
}
function s3(t: number) {
    const c = clamp(t);
    return c * c * (3 - 2 * c);
}

/* ─── TESSERACT — massive, fills frame ──────────── */
// Large outer cube so edges fill the screen during approach
const L = 11;
const S = 5;
const OUTER_V: [number, number, number][] = [
    [-L, -L, -L],
    [L, -L, -L],
    [-L, L, -L],
    [L, L, -L],
    [-L, -L, L],
    [L, -L, L],
    [-L, L, L],
    [L, L, L],
];
const INNER_V: [number, number, number][] = [
    [-S, -S, -S],
    [S, -S, -S],
    [-S, S, -S],
    [S, S, -S],
    [-S, -S, S],
    [S, -S, S],
    [-S, S, S],
    [S, S, S],
];
const C_EDGES: [number, number][] = [
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

function Tesseract({ progress }: { progress: React.MutableRefObject<number> }) {
    const og = useRef<THREE.Group>(null);
    const ig = useRef<THREE.Group>(null);
    const connectGeo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 2 * 3), 3));
        return g;
    }, []);
    const ov = useMemo(() => OUTER_V.map((v) => new THREE.Vector3(...v)), []);
    const iv = useMemo(() => INNER_V.map((v) => new THREE.Vector3(...v)), []);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;
        // Visible 0→0.38, fades 0.34→0.38
        const vis = clamp(1 - (p - 0.34) / 0.06);
        if (og.current) {
            og.current.rotation.x = t * 0.055;
            og.current.rotation.y = t * 0.082;
            og.current.scale.setScalar(vis);
        }
        if (ig.current) {
            ig.current.rotation.x = -t * 0.14;
            ig.current.rotation.y = t * 0.22;
            ig.current.rotation.z = -t * 0.09;
            ig.current.scale.setScalar((0.82 + Math.sin(t * 0.6) * 0.18) * vis);
        }
        // Update connecting edges imperatively
        if (og.current && ig.current) {
            const pos = connectGeo.attributes.position as THREE.BufferAttribute;
            const om = og.current.matrixWorld;
            const im = ig.current.matrixWorld;
            for (let i = 0; i < 8; i++) {
                ov[i].set(...OUTER_V[i]).applyMatrix4(om);
                iv[i].set(...INNER_V[i]).applyMatrix4(im);
                pos.setXYZ(i * 2, ov[i].x, ov[i].y, ov[i].z);
                pos.setXYZ(i * 2 + 1, iv[i].x, iv[i].y, iv[i].z);
            }
            pos.needsUpdate = true;
        }
    });

    return (
        <>
            {/* Outer cube — electric blue */}
            <group ref={og}>
                {C_EDGES.map(([a, b], i) => (
                    <Line
                        key={`o${i}`}
                        points={[OUTER_V[a], OUTER_V[b]]}
                        color="#4488ff"
                        lineWidth={1.8}
                        transparent
                        opacity={0.9}
                    />
                ))}
                {OUTER_V.map((v, i) => (
                    <mesh key={`ov${i}`} position={v}>
                        <sphereGeometry args={[0.28, 8, 8]} />
                        <meshStandardMaterial color="#88ccff" emissive="#88ccff" emissiveIntensity={8} />
                    </mesh>
                ))}
            </group>

            {/* Inner cube — violet */}
            <group ref={ig}>
                {C_EDGES.map(([a, b], i) => (
                    <Line
                        key={`i${i}`}
                        points={[INNER_V[a], INNER_V[b]]}
                        color="#cc88ff"
                        lineWidth={1.4}
                        transparent
                        opacity={0.8}
                    />
                ))}
                {INNER_V.map((v, i) => (
                    <mesh key={`iv${i}`} position={v}>
                        <sphereGeometry args={[0.22, 8, 8]} />
                        <meshStandardMaterial color="#cc88ff" emissive="#cc88ff" emissiveIntensity={10} />
                    </mesh>
                ))}
            </group>

            {/* Connecting edges — gold world-space */}
            <lineSegments geometry={connectGeo}>
                <lineBasicMaterial color="#ffaa44" transparent opacity={0.5} />
            </lineSegments>

            {/* Blazing core */}
            <Float speed={0.8} floatIntensity={0.15}>
                <mesh>
                    <sphereGeometry args={[1.4, 32, 32]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        emissive="#aaccff"
                        emissiveIntensity={6}
                        roughness={0}
                        metalness={1}
                    />
                </mesh>
            </Float>
            {/* Outer glow */}
            <mesh scale={1.6}>
                <sphereGeometry args={[2, 8, 8]} />
                <meshStandardMaterial
                    color="#4488ff"
                    transparent
                    opacity={0.06}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </>
    );
}

/* ─── WORMHOLE ────────────────────────────────────
   Full-screen immersion. Three layers:
   1. Dark interior cylinder (BackSide)
   2. Animated energy walls (custom shader, BackSide)
   3. 4000 speed-line particles rushing toward camera
─────────────────────────────────────────────────── */
const TUBE_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const TUBE_FRAG = `
  uniform float time;
  varying vec2 vUv;

  float s3(float t) { return t * t * (3.0 - 2.0 * t); }

  void main() {
    float u = vUv.x; // 0-1 around tube
    float v = vUv.y; // 0-1 along length (0=far, 1=near camera)

    // Radial speed lines — 32 lines spinning slowly
    float angle = u * 6.28318;
    float lineIdx = mod(angle / 6.28318 * 32.0, 1.0);
    float lineFrac = abs(lineIdx - 0.5) * 2.0;
    float line = pow(max(0.0, 1.0 - lineFrac * 18.0), 2.0);

    // Rushing rings
    float rspd = time * 3.5;
    float rings = pow(max(0.0, sin(v * 90.0 - rspd)), 5.0) * 0.55;
    float pulse = pow(max(0.0, sin(v * 18.0 - rspd * 0.45)), 7.0) * 0.4;

    // Depth: brighter at near end (v→1)
    float depth = s3(v);

    float intensity = (line * 0.35 + rings + pulse) * (0.15 + depth * 0.85);

    // Color: deep indigo→electric blue→blinding white
    vec3 c0 = vec3(0.04, 0.02, 0.22);
    vec3 c1 = vec3(0.12, 0.35, 1.0);
    vec3 c2 = vec3(0.55, 0.8, 1.0);
    vec3 c3 = vec3(1.0, 1.0, 1.0);

    vec3 col;
    if (v < 0.33)      col = mix(c0, c1, s3(v / 0.33));
    else if (v < 0.66) col = mix(c1, c2, s3((v - 0.33) / 0.33));
    else               col = mix(c2, c3, s3((v - 0.66) / 0.34));

    gl_FragColor = vec4(col, clamp(intensity, 0.0, 0.85));
  }
`;

function Wormhole({ progress }: { progress: React.MutableRefObject<number> }) {
    const matRef = useRef<THREE.ShaderMaterial>(null);
    const linesRef = useRef<THREE.InstancedMesh>(null);
    const uniforms = useMemo(() => ({ time: { value: 0 } }), []);

    // Tube geometry — large radius fills the frame
    const tubeGeo = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < 50; i++) {
            pts.push(new THREE.Vector3(Math.sin(i * 0.38) * 5, Math.cos(i * 0.26) * 3, -(i * 5.6 + 28)));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        return new THREE.TubeGeometry(curve, 400, 12, 24, false);
    }, []);

    // Speed-line instances — elongated thin boxes rushing toward camera
    const N_LINES = 4000;
    const lineGeo = useMemo(() => new THREE.CylinderGeometry(0.02, 0.02, 1, 4), []);
    const lineMat = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: '#aaddff',
                transparent: true,
                opacity: 0.55,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        []
    );

    // Precompute per-instance data (radius, angle, z-offset, speed factor)
    const lineData = useMemo(() => {
        const data = new Float32Array(N_LINES * 4); // r, angle, zOff, spd
        for (let i = 0; i < N_LINES; i++) {
            data[i * 4 + 0] = 1.2 + Math.random() * 9; // r
            data[i * 4 + 1] = Math.random() * Math.PI * 2; // angle
            data[i * 4 + 2] = Math.random() * 270; // zOff in tunnel
            data[i * 4 + 3] = 0.7 + Math.random() * 0.6; // speed
        }
        return data;
    }, []);

    const tmp = useMemo(() => new THREE.Object3D(), []);

    // Initial placement
    useEffect(() => {
        const mesh = linesRef.current;
        if (!mesh) return;
        for (let i = 0; i < N_LINES; i++) {
            const r = lineData[i * 4 + 0];
            const a = lineData[i * 4 + 1];
            const z = lineData[i * 4 + 2];
            tmp.position.set(Math.cos(a) * r, Math.sin(a) * r, -(z + 28));
            tmp.scale.set(1, 0.5 + Math.random() * 3, 1);
            tmp.rotation.z = Math.PI / 2;
            tmp.updateMatrix();
            mesh.setMatrixAt(i, tmp.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    }, [lineData, tmp]);

    useFrame(({ clock }) => {
        if (matRef.current) matRef.current.uniforms.time.value = clock.getElapsedTime();

        const mesh = linesRef.current;
        if (!mesh) return;
        const t = clock.getElapsedTime();
        for (let i = 0; i < N_LINES; i++) {
            const r = lineData[i * 4 + 0];
            const a = lineData[i * 4 + 1] + t * 0.012;
            const zOff = lineData[i * 4 + 2];
            const spd = lineData[i * 4 + 3];
            // Lines rush toward camera (positive z = toward camera)
            const z = -((zOff + t * spd * 14) % 270) - 28;
            tmp.position.set(Math.cos(a) * r, Math.sin(a) * r, z);
            tmp.scale.set(1, 1.5 + spd * 4, 1);
            tmp.rotation.z = Math.PI / 2;
            tmp.updateMatrix();
            mesh.setMatrixAt(i, tmp.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            {/* Dark interior */}
            <mesh geometry={tubeGeo}>
                <meshStandardMaterial
                    color="#010008"
                    emissive="#050020"
                    emissiveIntensity={0.5}
                    side={THREE.BackSide}
                />
            </mesh>
            {/* Animated energy walls */}
            <mesh geometry={tubeGeo}>
                <shaderMaterial
                    ref={matRef}
                    vertexShader={TUBE_VERT}
                    fragmentShader={TUBE_FRAG}
                    uniforms={uniforms}
                    transparent
                    side={THREE.BackSide}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
            {/* Speed lines */}
            <instancedMesh ref={linesRef} args={[lineGeo, lineMat, N_LINES]} />
        </group>
    );
}

/* ─── CAREER TIMELINE — galaxy-scale ─────────────
   60 nodes across a vast branching structure.
   Camera flies THROUGH it.
────────────────────────────────────────────────── */
interface TNode {
    pos: [number, number, number];
    color: string;
    r: number;
    label: string;
}

// Three "galaxies": Tata 1mg (left), Moresand (right), Cashfree (center/high)
const TIMELINE: TNode[] = [
    // Origin
    { pos: [0, 0, -300], color: '#88ccff', r: 1.2, label: '2021' },

    // Tata 1mg cluster — left
    { pos: [-38, 10, -318], color: '#55ddaa', r: 1.6, label: 'Tata 1mg' },
    { pos: [-52, 28, -330], color: '#55ddaa', r: 0.8, label: 'Build Perf' },
    { pos: [-44, 16, -342], color: '#66ffbb', r: 0.9, label: 'SDE II' },
    { pos: [-62, 34, -326], color: '#44cc99', r: 0.6, label: 'Webpack' },
    { pos: [-35, 44, -346], color: '#55ddaa', r: 0.7, label: 'Redis' },
    { pos: [-56, 50, -352], color: '#33bb88', r: 0.5, label: 'PWA' },

    // Moresand cluster — right
    { pos: [40, 8, -322], color: '#cc88ff', r: 1.3, label: 'Moresand' },
    { pos: [55, 24, -336], color: '#bb66ff', r: 0.7, label: 'Maps' },
    { pos: [46, 38, -348], color: '#aa44ff', r: 0.6, label: 'Spatial' },
    { pos: [62, 18, -330], color: '#dd99ff', r: 0.5, label: 'React' },
    { pos: [50, 44, -356], color: '#cc88ff', r: 0.5, label: 'PWA II' },

    // Bridge year 2024
    { pos: [0, 30, -360], color: '#7799ff', r: 0.9, label: '2024' },
    { pos: [-20, 38, -368], color: '#5577ff', r: 0.6, label: 'Systems' },
    { pos: [18, 36, -364], color: '#7799ff', r: 0.6, label: 'Scale' },

    // Cashfree — center elevated — the apex
    { pos: [0, 60, -380], color: '#ffaa44', r: 2.2, label: 'Cashfree' },
    { pos: [-28, 72, -392], color: '#ff8822', r: 0.9, label: 'Risk Engine' },
    { pos: [24, 75, -388], color: '#ffcc66', r: 0.9, label: 'Cashmere' },
    { pos: [-14, 86, -400], color: '#ff9933', r: 0.7, label: '~M/mo' },
    { pos: [16, 88, -396], color: '#ffbb44', r: 0.7, label: '<120ms p99' },
    { pos: [0, 92, -408], color: '#ffffff', r: 1.0, label: '2026' },
];

const TL_EDGES: [number, number][] = [
    [0, 1],
    [0, 7],
    [0, 12],
    [1, 2],
    [1, 3],
    [2, 4],
    [3, 5],
    [4, 6],
    [5, 6],
    [7, 8],
    [7, 10],
    [8, 9],
    [9, 11],
    [10, 11],
    [1, 12],
    [7, 12],
    [12, 13],
    [12, 14],
    [13, 15],
    [14, 15],
    [15, 16],
    [15, 17],
    [16, 18],
    [17, 19],
    [18, 20],
    [19, 20],
];

function CareerTimeline({ progress }: { progress: React.MutableRefObject<number> }) {
    const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
    const grpRef = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const p = progress.current;

        const vis = s3(clamp((p - 0.65) / 0.08));
        const exit = 1 - s3(clamp((p - 0.88) / 0.07));

        if (grpRef.current) {
            grpRef.current.rotation.y = Math.sin(t * 0.08) * 0.06;
        }

        meshRefs.current.forEach((m, i) => {
            if (!m) return;
            const nodeVis = s3(clamp((p - 0.65 - i * 0.006) / 0.06)) * exit;
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = nodeVis * (2.5 + Math.sin(t * 0.5 + i * 0.7) * 0.8);
            mat.opacity = clamp(nodeVis + 0.05);
        });
    });

    return (
        <group ref={grpRef}>
            {/* Branch lines */}
            {TL_EDGES.map(([a, b], i) => (
                <Line
                    key={i}
                    points={[TIMELINE[a].pos, TIMELINE[b].pos]}
                    color={TIMELINE[b].color}
                    lineWidth={1.2}
                    transparent
                    opacity={0.22}
                />
            ))}

            {/* Nodes */}
            {TIMELINE.map((n, i) => (
                <Float key={n.label} speed={0.3 + i * 0.06} floatIntensity={0.6}>
                    <group position={n.pos}>
                        {/* Core sphere */}
                        <mesh
                            ref={(el) => {
                                meshRefs.current[i] = el;
                            }}
                        >
                            <sphereGeometry args={[n.r, 24, 24]} />
                            <meshStandardMaterial
                                color={n.color}
                                emissive={n.color}
                                emissiveIntensity={0}
                                roughness={0.05}
                                metalness={0.95}
                                transparent
                                opacity={0}
                            />
                        </mesh>
                        {/* Halo 1 */}
                        <mesh scale={2.8}>
                            <sphereGeometry args={[n.r, 8, 8]} />
                            <meshStandardMaterial
                                color={n.color}
                                transparent
                                opacity={0.055}
                                side={THREE.BackSide}
                                blending={THREE.AdditiveBlending}
                                depthWrite={false}
                            />
                        </mesh>
                        {/* Halo 2 */}
                        <mesh scale={6}>
                            <sphereGeometry args={[n.r, 8, 8]} />
                            <meshStandardMaterial
                                color={n.color}
                                transparent
                                opacity={0.018}
                                side={THREE.BackSide}
                                blending={THREE.AdditiveBlending}
                                depthWrite={false}
                            />
                        </mesh>
                    </group>
                </Float>
            ))}
        </group>
    );
}

/* ─── ENERGY PARTICLES ────────────────────────── */
function EnergyField({ progress }: { progress: React.MutableRefObject<number> }) {
    const ref = useRef<THREE.Points>(null);
    const positions = useMemo(() => {
        const N = 1200;
        const a = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            const r = 6 + Math.random() * 18;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            a[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            a[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            a[i * 3 + 2] = r * Math.cos(phi);
        }
        return a;
    }, []);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime();
        const vis = clamp(1 - ((p) => (p - 0.3) / 0.12)(progress.current));
        ref.current.rotation.y = t * 0.04;
        (ref.current.material as THREE.PointsMaterial).opacity = 0.55 * vis;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.045} color="#88ccff" transparent opacity={0.55} sizeAttenuation />
        </points>
    );
}

/* ─── CINEMATIC CAMERA ────────────────────────── */
function CinematicCamera({
    scrollRef,
    progressRef,
}: {
    scrollRef: React.MutableRefObject<number>;
    progressRef: React.MutableRefObject<number>;
}) {
    const pos = useRef(new THREE.Vector3(0, 0, 60));
    const look = useRef(new THREE.Vector3(0, 0, 0));
    const tmp = useRef(new THREE.Vector3());

    useFrame(({ camera, clock }) => {
        const el = document.querySelector<HTMLElement>('.v2-root');
        if (!el) return;
        const max = el.scrollHeight - el.clientHeight;
        const p = max > 0 ? clamp(scrollRef.current / max) : 0;
        progressRef.current = p;
        const t = clock.getElapsedTime();

        /* ── P0: Distant arrival (0 → 0.10) ─────────────── */
        if (p < 0.1) {
            const e = s3(p / 0.1);
            pos.current.set(Math.sin(t * 0.06) * 1.5, Math.cos(t * 0.05) * 0.8, lerp(60, 26, e));
            look.current.set(0, 0, 0);
        } else if (p < 0.26) {
            /* ── P1: Approach — tesseract fills frame (0.10 → 0.26) ── */
            const e = s3((p - 0.1) / 0.16);
            pos.current.set(
                Math.sin(t * 0.08) * 2 * (1 - e * 0.5),
                Math.cos(t * 0.06) * 1 * (1 - e * 0.5),
                lerp(26, 6, e) // camera enters the cube (L=11, inner face at z=11)
            );
            look.current.set(0, 0, 0);
        } else if (p < 0.4) {
            /* ── P2: Inside orbit — edges surround camera (0.26 → 0.40) ── */
            const e = s3((p - 0.26) / 0.14);
            const angle = e * Math.PI * 0.7;
            const r = 10; // inside cube (L=11)
            pos.current.set(Math.sin(angle) * r, Math.sin(angle * 0.5) * 5 + 2, Math.cos(angle) * r);
            look.current.set(0, 0, 0);
        } else if (p < 0.52) {
            /* ── P3: Portal — cube fades, approach wormhole (0.40 → 0.52) ── */
            const e = s3((p - 0.4) / 0.12);
            pos.current.set(
                lerp(Math.sin(0.7 * Math.PI) * 10, 0, e),
                lerp(Math.sin(0.35 * Math.PI) * 5 + 2, 3, e),
                lerp(Math.cos(0.7 * Math.PI) * 10, -45, e)
            );
            look.current.set(0, lerp(0, 2, e), lerp(0, -80, e));
        } else if (p < 0.68) {
            /* ── P4: Wormhole — full immersion (0.52 → 0.68) ── */
            const e = s3((p - 0.52) / 0.16);
            const zp = lerp(-45, -270, e);
            // Oscillate inside the tube — subtle, not nauseating
            const ox = Math.sin(e * Math.PI * 3.5) * 3;
            const oy = Math.cos(e * Math.PI * 2.8) * 1.8;
            pos.current.set(ox, oy, zp);
            look.current.set(ox * 0.5, oy * 0.5, zp - 16);
        } else if (p < 0.86) {
            /* ── P5: Timeline — fly through galaxy (0.68 → 0.86) ── */
            const e = s3((p - 0.68) / 0.18);
            // Sweeping arc through the node cloud
            const sweep = Math.sin(e * Math.PI) * 28;
            pos.current.set(lerp(0, sweep, e) * 0.5, lerp(0, 55, e), lerp(-270, -390, e));
            look.current.set(0, lerp(0, 38, e), -370);
        } else {
            /* ── P6: Destination (0.86 → 1.0) ── */
            const e = s3((p - 0.86) / 0.14);
            pos.current.set(lerp(sweep_end(progressRef.current), 0, e), lerp(55, 12, e), lerp(-390, -408, e));
            look.current.set(0, lerp(38, 6, e), -420);
        }

        camera.position.lerp(pos.current, 0.042);
        tmp.current.lerp(look.current, 0.038);
        camera.lookAt(tmp.current);
    });

    return null;
}
function sweep_end(p: number) {
    const e = s3(clamp((p - 0.68) / 0.18));
    return Math.sin(e * Math.PI) * 28 * 0.5;
}

/* ─── POST FX ─────────────────────────────────── */
function PostFX() {
    return (
        <EffectComposer multisampling={0}>
            <Bloom intensity={2.0} luminanceThreshold={0.08} luminanceSmoothing={0.4} mipmapBlur />
            <Vignette eskil={false} offset={0.15} darkness={0.7} />
        </EffectComposer>
    );
}

/* ─── SCENE COMPOSITION ───────────────────────── */
function CinematicScenes({
    scrollRef,
    progressRef,
}: {
    scrollRef: React.MutableRefObject<number>;
    progressRef: React.MutableRefObject<number>;
}) {
    return (
        <>
            <CinematicCamera scrollRef={scrollRef} progressRef={progressRef} />
            <Stars radius={500} depth={160} count={14000} factor={9} saturation={0.1} fade speed={0.3} />

            <ambientLight intensity={0.03} />
            {/* Tesseract lights */}
            <pointLight position={[0, 0, 4]} intensity={8} color="#4488ff" distance={50} />
            <pointLight position={[15, 8, -20]} intensity={4} color="#ffaa44" distance={60} />
            <pointLight position={[-12, -6, 8]} intensity={3} color="#cc88ff" distance={50} />
            {/* Wormhole interior lights */}
            <pointLight position={[0, 0, -100]} intensity={6} color="#2255dd" distance={100} />
            <pointLight position={[0, 0, -180]} intensity={5} color="#4466ff" distance={100} />
            <pointLight position={[0, 0, -260]} intensity={8} color="#aaddff" distance={120} />
            {/* Timeline lights */}
            <pointLight position={[0, 50, -360]} intensity={10} color="#ffaa44" distance={150} />
            <pointLight position={[-30, 30, -340]} intensity={5} color="#55ddaa" distance={100} />
            <pointLight position={[30, 30, -340]} intensity={5} color="#cc88ff" distance={100} />

            <Tesseract progress={progressRef} />
            <EnergyField progress={progressRef} />
            <Wormhole progress={progressRef} />
            <CareerTimeline progress={progressRef} />

            <PostFX />
        </>
    );
}

/* ─── SCENE TEXTS ─────────────────────────────── */
const TEXTS = [
    {
        id: 'awaken',
        tid: 'gm-ct-t1',
        headline: 'I build at\nthe frontier.',
        sub: 'FRONTEND ENGINEER · 4.5 YEARS · INDIA',
    },
    {
        id: 'wormhole',
        tid: 'gm-ct-t3',
        headline: 'React.\nTypeScript.\nSystems.',
        sub: 'THE STACK THAT SHIPS',
    },
    {
        id: 'timeline',
        tid: 'gm-ct-t4',
        headline: 'Four companies.\nOne trajectory.',
        sub: '2021 → 2026 · TATA 1MG · MORESAND · CASHFREE',
    },
];

// Heights in vh, sum = 700
const HEIGHTS = [80, 130, 110, 150, 140, 90];

/* ─── CINEMATIC HOME ──────────────────────────── */
export default function CinematicHome(): JSX.Element {
    const scrollRef = useRef(0);
    const progressRef = useRef(0);

    useEffect(() => {
        const el = document.querySelector<HTMLElement>('.v2-root');
        if (!el) return;
        const fn = () => {
            scrollRef.current = el.scrollTop;
        };
        el.addEventListener('scroll', fn, { passive: true });
        return () => el.removeEventListener('scroll', fn);
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            TEXTS.forEach(({ id, tid, headline }) => {
                const el = document.getElementById(id + '-text');
                const trig = document.getElementById(tid);
                if (!el || !trig) return;
                gsap.set(el, { opacity: 0, y: 40 });
                ScrollTrigger.create({
                    trigger: trig,
                    scroller: '.v2-root',
                    start: 'top 60%',
                    end: 'top 18%',
                    onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }),
                    onLeave: () => gsap.to(el, { opacity: 0, y: -28, duration: 0.45, ease: 'power3.in' }),
                    onEnterBack: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.7 }),
                    onLeaveBack: () => gsap.to(el, { opacity: 0, y: 32, duration: 0.4 }),
                });
            });

            /* Progress bar */
            ScrollTrigger.create({
                trigger: '.gm-ct-scroll-space',
                scroller: '.v2-root',
                start: 'top top',
                end: 'bottom bottom',
                onUpdate: (s) => {
                    const b = document.getElementById('gm-progress-bar');
                    if (b) b.style.height = s.progress * 100 + '%';
                },
            });

            /* Hint fades */
            ScrollTrigger.create({
                trigger: document.getElementById('gm-ct-t1'),
                scroller: '.v2-root',
                start: 'top 80%',
                onEnter: () => gsap.to('.gm-ct-scroll-hint', { opacity: 0, duration: 0.6 }),
            });

            /* CTA */
            const cta = document.getElementById('gm-ct-cta');
            const ctaT = document.getElementById('gm-ct-t5');
            if (cta && ctaT) {
                gsap.set(cta, { opacity: 0, y: 52 });
                ScrollTrigger.create({
                    trigger: ctaT,
                    scroller: '.v2-root',
                    start: 'top 70%',
                    onEnter: () =>
                        gsap.to(cta, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: 0.2 }),
                    onLeaveBack: () => gsap.to(cta, { opacity: 0, y: 52, duration: 0.45 }),
                });
            }

            ScrollTrigger.refresh();
        });
        return () => ctx.revert();
    }, []);

    const totalVh = HEIGHTS.reduce((a, b) => a + b, 0);

    return (
        <div className="gm-ct-root">
            <div className="gm-ct-letterbox-top" aria-hidden="true" />
            <div className="gm-ct-letterbox-bottom" aria-hidden="true" />
            <div className="gm-ct-progress-track" aria-hidden="true">
                <div id="gm-progress-bar" className="gm-ct-progress-fill" />
            </div>

            {/* R3F Canvas */}
            <div className="gm-ct-canvas" aria-hidden="true">
                <Canvas
                    camera={{ position: [0, 0, 60], fov: 62, near: 0.1, far: 1600 }}
                    dpr={[1, 1.8]}
                    gl={{
                        antialias: true,
                        alpha: false,
                        powerPreference: 'high-performance',
                        toneMapping: THREE.ACESFilmicToneMapping,
                        toneMappingExposure: 1.3,
                    }}
                >
                    <CinematicScenes scrollRef={scrollRef} progressRef={progressRef} />
                </Canvas>
            </div>

            {/* Scroll space */}
            <div className="gm-ct-scroll-space" style={{ height: `${totalVh}vh` }}>
                {HEIGHTS.map((h, i) => (
                    <div
                        key={i}
                        id={`gm-ct-t${i}`}
                        className="gm-ct-trigger"
                        style={{ height: `${h}vh` }}
                        aria-hidden="true"
                    />
                ))}
            </div>

            {/* Text overlays */}
            {TEXTS.map(({ id, headline, sub }) => (
                <div
                    key={id}
                    id={id + '-text'}
                    className="gm-ct-text gm-ct-text--left gm-ct-text--bottom"
                    aria-label={headline}
                >
                    <h2 className="gm-ct-headline v2-display">
                        {headline.split('\n').map((l, i) => (
                            <span key={i} className="gm-ct-headline-line">
                                {l}
                            </span>
                        ))}
                    </h2>
                    {sub && <p className="gm-ct-sub v2-mono">{sub}</p>}
                </div>
            ))}

            {/* CTA */}
            <div id="gm-ct-cta" className="gm-ct-cta">
                <p className="gm-ct-cta-label v2-mono">Open to work · Bengaluru · Remote-friendly</p>
                <a
                    href={`mailto:${IDENTITY.email}`}
                    className="gm-ct-cta-email v2-display"
                    aria-label={`Email ${IDENTITY.email}`}
                >
                    {IDENTITY.email}
                </a>
                <div className="gm-ct-cta-links">
                    <button className="v2-btn v2-btn-primary gm-ct-cta-btn" onClick={() => navigate('/work')}>
                        See the work →
                    </button>
                    <a
                        href={IDENTITY.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v2-btn v2-btn-ghost gm-ct-cta-btn"
                    >
                        LinkedIn ↗
                    </a>
                </div>
            </div>

            <div className="gm-ct-scroll-hint v2-mono" aria-hidden="true">
                scroll to travel
            </div>
        </div>
    );
}
