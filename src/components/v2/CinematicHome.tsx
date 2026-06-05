/* eslint-disable react/no-unknown-property */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import * as THREE from 'three';

import { navigate } from './Chrome';
import { IDENTITY } from './data';

gsap.registerPlugin(ScrollTrigger);

/* ─── TESSERACT — TVA Gold/Teal ──────────────────── */
const L = 10;
const S = 4.5;
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
const CUBE_EDGES: [number, number][] = [
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

const GOLD_COLOR = new THREE.Color('#c9a227');
const TEAL_COLOR = new THREE.Color('#00c9c9');

function CubeEdges({ verts, color }: { verts: [number, number, number][]; color: THREE.Color }) {
    const points = useMemo(
        () =>
            CUBE_EDGES.flatMap(([a, b]) => [new THREE.Vector3(...verts[a]), new THREE.Vector3(...verts[b])]),
        [verts]
    );
    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry().setFromPoints(points);
        return g;
    }, [points]);
    const mat = useMemo(
        () => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }),
        [color]
    );

    useFrame(({ clock }) => {
        mat.opacity = 0.6 + Math.sin(clock.getElapsedTime() * 0.8) * 0.3;
    });

    return <lineSegments geometry={geo} material={mat} />;
}

function TesseractScene() {
    const outerRef = useRef<THREE.Group>(null!);
    const innerRef = useRef<THREE.Group>(null!);
    const connGeo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 2 * 3), 3));
        return g;
    }, []);
    const connMat = useMemo(
        () => new THREE.LineBasicMaterial({ color: '#e8b730', transparent: true, opacity: 0.3 }),
        []
    );
    const outerWorldV = useMemo(() => OUTER_V.map((v) => new THREE.Vector3(...v)), []);
    const innerWorldV = useMemo(() => INNER_V.map((v) => new THREE.Vector3(...v)), []);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (outerRef.current) {
            outerRef.current.rotation.x = t * 0.044;
            outerRef.current.rotation.y = t * 0.071;
        }
        if (innerRef.current) {
            innerRef.current.rotation.x = -t * 0.12;
            innerRef.current.rotation.y = t * 0.19;
            innerRef.current.rotation.z = -t * 0.07;
            const pulse = 0.84 + Math.sin(t * 0.7) * 0.16;
            innerRef.current.scale.setScalar(pulse);
        }
        // Update connectors imperatively
        const pos = connGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < 8; i++) {
            outerWorldV[i].set(...OUTER_V[i]).applyMatrix4(outerRef.current.matrixWorld);
            innerWorldV[i].set(...INNER_V[i]).applyMatrix4(innerRef.current.matrixWorld);
            pos.setXYZ(i * 2, outerWorldV[i].x, outerWorldV[i].y, outerWorldV[i].z);
            pos.setXYZ(i * 2 + 1, innerWorldV[i].x, innerWorldV[i].y, innerWorldV[i].z);
        }
        pos.needsUpdate = true;
        connMat.opacity = 0.22 + Math.sin(t * 0.55) * 0.12;
    });

    return (
        <>
            <group ref={outerRef}>
                <CubeEdges verts={OUTER_V} color={GOLD_COLOR} />
            </group>
            <group ref={innerRef}>
                <CubeEdges verts={INNER_V} color={TEAL_COLOR} />
            </group>
            <lineSegments geometry={connGeo} material={connMat} />
        </>
    );
}

/* ─── PORTAL RINGS ──────────────────────────────── */
function PortalRings() {
    const rings = useRef<THREE.Group[]>([]);
    const mats = useMemo(
        () => [
            new THREE.MeshBasicMaterial({
                color: GOLD_COLOR,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide,
            }),
            new THREE.MeshBasicMaterial({
                color: TEAL_COLOR,
                transparent: true,
                opacity: 0.08,
                side: THREE.DoubleSide,
            }),
            new THREE.MeshBasicMaterial({
                color: GOLD_COLOR,
                transparent: true,
                opacity: 0.07,
                side: THREE.DoubleSide,
            }),
        ],
        []
    );
    const geos = useMemo(
        () => [
            new THREE.TorusGeometry(14, 0.07, 8, 80),
            new THREE.TorusGeometry(19, 0.05, 8, 100),
            new THREE.TorusGeometry(24, 0.04, 8, 120),
        ],
        []
    );
    const speeds = [0.18, -0.13, 0.09];

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        rings.current.forEach((r, i) => {
            if (!r) return;
            r.rotation.x = t * speeds[i];
            r.rotation.z = t * speeds[i] * 0.5;
            r.rotation.y = -t * Math.abs(speeds[i]) * 0.7;
            mats[i].opacity = (i === 1 ? 0.06 : 0.08) + Math.sin(t * 0.4 + i) * 0.04;
        });
    });

    return (
        <>
            {geos.map((geo, i) => (
                <group
                    key={i}
                    ref={(el) => {
                        if (el) rings.current[i] = el;
                    }}
                >
                    <mesh geometry={geo} material={mats[i]} />
                </group>
            ))}
        </>
    );
}

/* ─── 3D HERO CANVAS ────────────────────────────── */
function HeroCanvas() {
    return (
        <Canvas
            camera={{ position: [0, 0, 30], fov: 48 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 1.5]}
        >
            <Stars radius={160} depth={70} count={3500} factor={3} fade speed={0.3} />
            <TesseractScene />
            <PortalRings />
            <EffectComposer>
                <Bloom intensity={2.4} luminanceThreshold={0.06} luminanceSmoothing={0.8} mipmapBlur />
                <Vignette eskil={false} offset={0.18} darkness={0.55} />
            </EffectComposer>
        </Canvas>
    );
}

/* ─── TVA CURSOR ────────────────────────────────── */
function TVACursor() {
    const ringRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);
    const posTarget = useRef({ x: -200, y: -200 });
    const posLerped = useRef({ x: -200, y: -200 });
    const [isHover, setIsHover] = useState(false);

    useEffect(() => {
        let rafId: number;

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        const onMove = (e: MouseEvent) => {
            posTarget.current = { x: e.clientX, y: e.clientY };
            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            }
            const el = document.elementFromPoint(e.clientX, e.clientY);
            setIsHover(!!el?.closest('button,a,[role="button"],input,textarea,[tabindex]'));
        };

        const tick = () => {
            posLerped.current.x = lerp(posLerped.current.x, posTarget.current.x, 0.11);
            posLerped.current.y = lerp(posLerped.current.y, posTarget.current.y, 0.11);
            if (ringRef.current) {
                ringRef.current.style.transform = `translate(${posLerped.current.x}px, ${posLerped.current.y}px)`;
            }
            rafId = requestAnimationFrame(tick);
        };
        tick();

        window.addEventListener('mousemove', onMove, { passive: true });
        return () => {
            window.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <>
            <div
                ref={ringRef}
                className={`tva-cursor${isHover ? 'tva-cursor-hover' : ''}`}
                aria-hidden="true"
            />
            <div ref={dotRef} className="tva-cursor-dot" aria-hidden="true" />
        </>
    );
}

/* ─── HERO CONTENT ──────────────────────────────── */
export default function CinematicHome() {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const ctx = gsap.context(() => {
            gsap.from('[data-reveal]', {
                opacity: 0,
                y: 28,
                filter: 'blur(10px)',
                stagger: 0.13,
                duration: 1.1,
                ease: 'power3.out',
                delay: 0.15,
            });
        }, el);
        return () => ctx.revert();
    }, []);

    return (
        <>
            <TVACursor />
            <div className="tva-grain" aria-hidden="true" />

            <section className="tva-hero-root gm-home" aria-label="Hero — Aditya Raj Portfolio">
                {/* 3D scene */}
                <div className="tva-hero-canvas" aria-hidden="true">
                    <HeroCanvas />
                </div>

                {/* Scan lines */}
                <div className="tva-scanlines" aria-hidden="true" />

                {/* Vignette */}
                <div className="tva-hero-vignette" aria-hidden="true" />

                {/* Text content */}
                <div className="tva-hero-content" ref={contentRef}>
                    {/* TVA clearance badge */}
                    <div className="tva-badge" data-reveal>
                        <span className="tva-badge-dot" aria-hidden="true" />
                        <span className="tva-badge-full">TVA CLEARANCE · NEXUS VARIANT · LEVEL Ω</span>
                        <span className="tva-badge-short">TVA · NEXUS VARIANT</span>
                    </div>

                    {/* Name */}
                    <h1
                        className="tva-hero-name tva-glitch-wrap"
                        data-text={IDENTITY.name.toUpperCase().replace(' ', '\n')}
                        data-reveal
                    >
                        {IDENTITY.name.split(' ').map((word) => (
                            <span key={word} style={{ display: 'block' }}>
                                {word.toUpperCase()}
                            </span>
                        ))}
                    </h1>

                    {/* Role */}
                    <div className="tva-hero-role" data-reveal>
                        {IDENTITY.title}&nbsp;·&nbsp;{IDENTITY.company}
                    </div>

                    {/* Bio */}
                    <p
                        data-reveal
                        style={{
                            fontSize: 'clamp(13px, 1.5vw, 15px)',
                            color: 'var(--v2-ink-2)',
                            margin: '16px 0 0',
                            maxWidth: 480,
                            lineHeight: 1.7,
                        }}
                    >
                        {IDENTITY.bio}
                    </p>

                    {/* CTAs */}
                    <div className="tva-actions" data-reveal>
                        <button className="tva-btn-primary" onClick={() => navigate('/work')} type="button">
                            ↗ Explore Timeline
                        </button>
                        <button className="tva-btn-ghost" onClick={() => navigate('/contact')} type="button">
                            Open Channel
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="tva-stats" data-reveal>
                        <div className="tva-stat">
                            <span className="tva-stat-n">4.5+</span>
                            <span className="tva-stat-k">Years</span>
                        </div>
                        <div className="tva-stat">
                            <span className="tva-stat-n">~M</span>
                            <span className="tva-stat-k">Txn / mo</span>
                        </div>
                        <div className="tva-stat">
                            <span className="tva-stat-n">80%</span>
                            <span className="tva-stat-k">Build speedup</span>
                        </div>
                    </div>
                </div>

                {/* Scroll hint */}
                <div className="tva-scroll-hint" aria-hidden="true">
                    SCROLL TO BEGIN TIMELINE
                    <div className="tva-scroll-line" />
                </div>
            </section>
        </>
    );
}
