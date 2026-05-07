'use client';

import { useEffect, useRef } from 'react';

/* Three.js particle network — lazy-loaded, client-only.
   Uses a single LineSegments geometry with dynamic Float32Array updates
   to avoid GC pressure from repeated geometry creation. */
export default function HeroCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.innerWidth < 768) return; // skip on mobile — CSS gradient only

        let running = true;
        let frameId: number;
        let dispose: (() => void) | undefined;

        (async () => {
            const THREE = await import('three');
            if (!running) return;

            // ── Scene setup ──
            const scene = new THREE.Scene();
            const W = canvas.clientWidth;
            const H = canvas.clientHeight;
            const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 100);
            camera.position.z = 6;

            const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
            renderer.setSize(W, H, false);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            renderer.setClearColor(0x000000, 0);

            // ── Particles ──
            const N = 90;
            const positions = new Float32Array(N * 3);
            const velocities = new Float32Array(N * 3);

            for (let i = 0; i < N; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 16;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
                velocities[i * 3] = (Math.random() - 0.5) * 0.0035;
                velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0025;
                velocities[i * 3 + 2] = 0;
            }

            const ptGeo = new THREE.BufferGeometry();
            ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const ptMat = new THREE.PointsMaterial({
                size: 0.028,
                color: 0x22d3ee,
                transparent: true,
                opacity: 0.65,
                sizeAttenuation: true,
            });
            const points = new THREE.Points(ptGeo, ptMat);
            scene.add(points);

            // ── Lines (pre-allocated LineSegments) ──
            const MAX_SEGS = 500;
            const segPos = new Float32Array(MAX_SEGS * 6);
            const segGeo = new THREE.BufferGeometry();
            const segAttr = new THREE.BufferAttribute(segPos, 3);
            segAttr.setUsage(THREE.DynamicDrawUsage);
            segGeo.setAttribute('position', segAttr);
            segGeo.setDrawRange(0, 0);
            const segMat = new THREE.LineBasicMaterial({
                color: 0x22d3ee,
                transparent: true,
                opacity: 0.11,
            });
            const lines = new THREE.LineSegments(segGeo, segMat);
            scene.add(lines);

            // ── Mouse parallax ──
            let mx = 0,
                my = 0;
            const onMouse = (e: MouseEvent) => {
                mx = (e.clientX / window.innerWidth - 0.5) * 0.6;
                my = (e.clientY / window.innerHeight - 0.5) * -0.4;
            };
            window.addEventListener('mousemove', onMouse, { passive: true });

            // ── Resize ──
            const onResize = () => {
                const w = canvas.clientWidth,
                    h = canvas.clientHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h, false);
            };
            window.addEventListener('resize', onResize, { passive: true });

            // ── Animate ──
            const THRESH = 2.8;
            let tick = 0;

            const animate = () => {
                if (!running) return;
                frameId = requestAnimationFrame(animate);
                tick++;

                // Update particle positions
                for (let i = 0; i < N; i++) {
                    positions[i * 3] += velocities[i * 3];
                    positions[i * 3 + 1] += velocities[i * 3 + 1];
                    // Wrap edges
                    if (positions[i * 3] > 8) positions[i * 3] = -8;
                    if (positions[i * 3] < -8) positions[i * 3] = 8;
                    if (positions[i * 3 + 1] > 5) positions[i * 3 + 1] = -5;
                    if (positions[i * 3 + 1] < -5) positions[i * 3 + 1] = 5;
                }
                ptGeo.attributes.position.needsUpdate = true;

                // Update line segments every 2nd frame
                if (tick % 2 === 0) {
                    let seg = 0;
                    for (let i = 0; i < N && seg < MAX_SEGS; i++) {
                        for (let j = i + 1; j < N && seg < MAX_SEGS; j++) {
                            const dx = positions[i * 3] - positions[j * 3];
                            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                            if (Math.abs(dx) > THRESH || Math.abs(dy) > THRESH) continue;
                            const d2 = dx * dx + dy * dy;
                            if (d2 > THRESH * THRESH) continue;
                            const base = seg * 6;
                            segPos[base] = positions[i * 3];
                            segPos[base + 1] = positions[i * 3 + 1];
                            segPos[base + 2] = positions[i * 3 + 2];
                            segPos[base + 3] = positions[j * 3];
                            segPos[base + 4] = positions[j * 3 + 1];
                            segPos[base + 5] = positions[j * 3 + 2];
                            seg++;
                        }
                    }
                    segAttr.needsUpdate = true;
                    segGeo.setDrawRange(0, seg * 2);
                }

                // Camera drift (mouse parallax)
                camera.position.x += (mx - camera.position.x) * 0.025;
                camera.position.y += (my - camera.position.y) * 0.025;
                camera.lookAt(0, 0, 0);

                renderer.render(scene, camera);
            };

            animate();

            dispose = () => {
                window.removeEventListener('mousemove', onMouse);
                window.removeEventListener('resize', onResize);
                cancelAnimationFrame(frameId);
                renderer.dispose();
                ptGeo.dispose();
                ptMat.dispose();
                segGeo.dispose();
                segMat.dispose();
            };
        })();

        return () => {
            running = false;
            dispose?.();
        };
    }, []);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
