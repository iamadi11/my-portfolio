import * as THREE from 'three';

export interface PrimeScene {
    renderer: THREE.WebGLRenderer;
    setCount: (n: number) => void;
    dispose: () => void;
}

const GOLDEN = (1 + Math.sqrt(5)) / 2;
const COUNT = 1_000_000;

/** Inline HSL → RGB — avoids 1M THREE.Color allocations in the hot loop. */
function hslToRgb(h: number, s: number, l: number): readonly [number, number, number] {
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h * 12) % 12;
        return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    };
    return [f(0), f(8), f(4)] as const;
}

function buildGeometry(primes: Int32Array): THREE.BufferGeometry {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
        const t = i / COUNT;
        const angle = i * GOLDEN * Math.PI * 2;
        const radius = 4 + Math.sqrt(t) * 85;

        // z = prime gap at this index (twin primes stay near z=0; large gaps rise up)
        const gap = i < COUNT - 1 ? primes[i + 1] - primes[i] : 2;
        const z = gap * 0.28;

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
        positions[i * 3 + 2] = z;

        // Cyan (twin prime, gap=2) → orange-red (large gap, gap≥72)
        const normGap = Math.min(gap / 72, 1);
        const hue = 0.54 - normGap * 0.46; // 194° cyan → 29° orange
        const [r, g, b] = hslToRgb(hue, 1.0, 0.55 + normGap * 0.1);
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeBoundingSphere();
    return geo;
}

export function buildPrimeScene(canvas: HTMLCanvasElement, primes: Int32Array): PrimeScene {
    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x00000a, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 2000);

    // Disposal registries
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    // ── Helpers ──────────────────────────────────────────────────────────────

    const addTicks = (
        axisDir: THREE.Vector3,
        perpDir: THREE.Vector3,
        halfLen: number,
        step: number,
        color: number
    ) => {
        const mat = new THREE.LineBasicMaterial({ color, opacity: 0.3, transparent: true });
        mats.push(mat);
        for (let v = -halfLen; v <= halfLen + 0.001; v += step) {
            const center = axisDir.clone().multiplyScalar(v);
            const geo = new THREE.BufferGeometry().setFromPoints([
                center.clone().addScaledVector(perpDir, 1.5),
                center.clone().addScaledVector(perpDir, -1.5),
            ]);
            scene.add(new THREE.Line(geo, mat));
            geos.push(geo);
        }
    };

    const addLabel = (text: string, cssColor: string, pos: THREE.Vector3, scaleX = 10, scaleY = 2.5) => {
        const cvs = document.createElement('canvas');
        cvs.width = 256;
        cvs.height = 64;
        const ctx = cvs.getContext('2d')!;
        ctx.font = 'bold 26px monospace';
        ctx.fillStyle = cssColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);
        const tex = new THREE.CanvasTexture(cvs);
        textures.push(tex);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
        mats.push(mat);
        const sprite = new THREE.Sprite(mat);
        sprite.position.copy(pos);
        sprite.scale.set(scaleX, scaleY, 1);
        scene.add(sprite);
    };

    // ── 1M Prime points ───────────────────────────────────────────────────────

    const primesGeo = buildGeometry(primes);
    geos.push(primesGeo);
    const primesMat = new THREE.PointsMaterial({
        size: 0.9,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.88,
        blending: THREE.NormalBlending,
        depthWrite: false,
    });
    mats.push(primesMat);
    scene.add(new THREE.Points(primesGeo, primesMat));

    // ── Axes (ArrowHelper = visible cone tips even against bright spiral) ───────

    const AX = 98;
    const AZ = 68;
    const HEAD = 6;
    const HEAD_W = 3.5;

    const addAxisArrow = (dx: number, dy: number, dz: number, len: number, color: number, addNeg = true) => {
        const dir = new THREE.Vector3(dx, dy, dz).normalize();
        scene.add(new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), len, color, HEAD, HEAD_W));
        if (addNeg) {
            const negGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                dir.clone().multiplyScalar(-len),
            ]);
            const negMat = new THREE.LineBasicMaterial({ color, opacity: 0.4, transparent: true });
            scene.add(new THREE.Line(negGeo, negMat));
            geos.push(negGeo);
            mats.push(negMat);
        }
    };

    addAxisArrow(1, 0, 0, AX, 0xff4444);
    addAxisArrow(0, 1, 0, AX, 0x44dd44);
    addAxisArrow(0, 0, 1, AZ, 0x4488ff, false);

    addTicks(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), AX, 10, 0xff4444);
    addTicks(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), AX, 10, 0x44dd44);
    addTicks(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), AZ * 0.5, 10, 0x4488ff);

    addLabel('X', '#ff8888', new THREE.Vector3(AX + 9, 0, 0));
    addLabel('Y', '#88ee88', new THREE.Vector3(0, AX + 9, 0));
    addLabel('Z gap', '#88aaff', new THREE.Vector3(0, 0, AZ + 8));
    addLabel('prime gap ↑', 'rgba(140,170,255,0.45)', new THREE.Vector3(14, 0, AZ * 0.5), 15, 1.8);

    // Origin marker
    const originGeo = new THREE.SphereGeometry(1.2, 8, 6);
    const originMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.7, transparent: true });
    geos.push(originGeo);
    mats.push(originMat);
    scene.add(new THREE.Mesh(originGeo, originMat));

    // ── Grid (XY plane at z = 0) ─────────────────────────────────────────────

    const grid = new THREE.GridHelper(200, 20, 0x0d1f2d, 0x0a1820);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    // ── Star field ───────────────────────────────────────────────────────────

    const starCount = 2000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 900;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true, opacity: 0.5 });
    geos.push(starGeo);
    mats.push(starMat);
    scene.add(new THREE.Points(starGeo, starMat));

    // ── Orbit controller (inline — no extra import needed) ───────────────────

    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let theta = 0.5; // azimuth
    let phi = 0.68; // polar ~39° from top — full disk visible + z-depth readable
    let camRadius = 360;

    // Smooth-damping targets
    let tTheta = theta;
    let tPhi = phi;
    let tRadius = camRadius;

    const updateCamera = () => {
        camera.position.set(
            Math.sin(phi) * Math.sin(theta) * camRadius,
            Math.cos(phi) * camRadius,
            Math.sin(phi) * Math.cos(theta) * camRadius
        );
        camera.lookAt(0, 0, 8);
    };
    updateCamera();

    const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        tTheta -= (e.clientX - prevX) * 0.005;
        tPhi = Math.max(0.15, Math.min(Math.PI - 0.15, tPhi - (e.clientY - prevY) * 0.005));
        prevX = e.clientX;
        prevY = e.clientY;
    };
    const onMouseUp = () => {
        isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
        tRadius = Math.max(30, Math.min(700, tRadius + e.deltaY * 0.25));
    };
    const onTouchStart = (e: TouchEvent) => {
        isDragging = true;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;
        tTheta -= (e.touches[0].clientX - prevX) * 0.005;
        tPhi = Math.max(0.15, Math.min(Math.PI - 0.15, tPhi - (e.touches[0].clientY - prevY) * 0.005));
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: true });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onMouseUp);

    // ── Resize ────────────────────────────────────────────────────────────────

    const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Render loop ───────────────────────────────────────────────────────────

    let raf = 0;
    const DAMP = 0.07;

    const tick = () => {
        raf = requestAnimationFrame(tick);

        // Auto-rotate when idle
        if (!isDragging) tTheta += 0.0004;

        // Smooth damp toward targets
        theta += (tTheta - theta) * DAMP;
        phi += (tPhi - phi) * DAMP;
        camRadius += (tRadius - camRadius) * DAMP;

        updateCamera();
        renderer.render(scene, camera);
    };
    tick();

    // ── Dispose ───────────────────────────────────────────────────────────────

    const dispose = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('wheel', onWheel);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onMouseUp);
        // Traverse whole scene — covers ArrowHelper internals, sprites, meshes
        scene.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                const matList = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                matList.forEach((m) => {
                    const sm = m as THREE.SpriteMaterial;
                    if (sm.map) sm.map.dispose();
                    m.dispose();
                });
            }
        });
        renderer.dispose();
    };

    const setCount = (n: number) => {
        primesGeo.setDrawRange(0, Math.max(1, Math.min(COUNT, n)));
    };

    return { renderer, setCount, dispose };
}
