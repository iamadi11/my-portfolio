/* eslint-disable react/no-unknown-property */
'use client';

import { useEffect, useRef } from 'react';

import { Float, MeshDistortMaterial, Environment } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* Morphing primary blob — represents "systems thinking" */
function Blob(): JSX.Element {
    const meshRef = useRef<THREE.Mesh>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', onMove, { passive: true });
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        const t = clock.getElapsedTime();
        meshRef.current.rotation.x += (mouseRef.current.y * 0.03 - meshRef.current.rotation.x) * 0.04;
        meshRef.current.rotation.y +=
            (t * 0.08 + mouseRef.current.x * 0.15 - meshRef.current.rotation.y) * 0.04;
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1.8, 128, 128]} />
            <MeshDistortMaterial
                color="#4466ee"
                distort={0.52}
                speed={2.2}
                roughness={0.05}
                metalness={0.9}
                envMapIntensity={2}
            />
        </mesh>
    );
}

/* Wireframe satellite shapes — represent connected sub-systems */
function Satellites(): JSX.Element {
    return (
        <>
            <Float speed={2.2} rotationIntensity={1.0} floatIntensity={1.5}>
                <mesh position={[3.8, 1.6, -2.5]}>
                    <octahedronGeometry args={[0.52, 0]} />
                    <meshStandardMaterial color="#e8a03a" wireframe />
                </mesh>
            </Float>

            <Float speed={1.7} rotationIntensity={0.7} floatIntensity={1.2}>
                <mesh position={[-4.0, -1.2, -1.8]}>
                    <icosahedronGeometry args={[0.46, 0]} />
                    <meshStandardMaterial color="#a898ff" wireframe />
                </mesh>
            </Float>

            <Float speed={2.4} rotationIntensity={0.8} floatIntensity={1.0}>
                <mesh position={[2.5, -2.8, -0.8]}>
                    <tetrahedronGeometry args={[0.42, 0]} />
                    <meshStandardMaterial color="#5dd89e" emissive="#5dd89e" emissiveIntensity={0.4} />
                </mesh>
            </Float>

            <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.9}>
                <mesh position={[-2.6, 2.8, -1.2]}>
                    <dodecahedronGeometry args={[0.35, 0]} />
                    <meshStandardMaterial color="#7ee5ff" wireframe />
                </mesh>
            </Float>

            {/* Glowing point nodes */}
            {(
                [
                    [-3.5, 0.5, 0.5],
                    [3.2, -0.8, 1.0],
                    [-1.8, -3.0, 0.2],
                    [1.2, 3.2, -0.6],
                    [-3.8, -2.5, -1.0],
                ] as [number, number, number][]
            ).map((pos, i) => (
                <Float key={i} speed={1.1 + i * 0.25} floatIntensity={0.7}>
                    <mesh position={pos}>
                        <sphereGeometry args={[0.07, 8, 8]} />
                        <meshStandardMaterial color="#5578ff" emissive="#5578ff" emissiveIntensity={3} />
                    </mesh>
                </Float>
            ))}
        </>
    );
}

export default function HeroScene3D(): JSX.Element {
    return (
        <Canvas
            camera={{ position: [0, 0, 7], fov: 55 }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
            <ambientLight intensity={0.15} />
            <pointLight position={[8, 8, 8]} intensity={2} color="#5578ff" />
            <pointLight position={[-8, -5, -6]} intensity={1.2} color="#e8a03a" />
            <pointLight position={[0, -8, 4]} intensity={0.8} color="#5dd89e" />

            <Float speed={0.6} rotationIntensity={0.2} floatIntensity={0.4}>
                <Blob />
            </Float>

            <Satellites />

            <Environment preset="city" />
        </Canvas>
    );
}
