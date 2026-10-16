import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { clamp, lerp } from '@/components/round-trip/math';
import { addCity } from '@/components/round-trip/world/city';
import { FOG, NIGHT, rng, shared } from '@/components/round-trip/world/gl';
import { addLattice } from '@/components/round-trip/world/lattice';
import { addMap } from '@/components/round-trip/world/map';
import { addDust, addPacket, glowMaker } from '@/components/round-trip/world/packet';
import { createPost } from '@/components/round-trip/world/post';
import { createRig } from '@/components/round-trip/world/rig';
import { createRoute } from '@/components/round-trip/world/route';
import { addRings } from '@/components/round-trip/world/services';
import { addWire } from '@/components/round-trip/world/wire';

export type WorldOptions = {
    canvas: HTMLCanvasElement;
    /** One colour per project; each gets a gyroscope. */
    rings: string[];
    /** Where each ring sits, as a share of the services stretch (0–1). */
    ringAt: number[];
    /** Where each role's record sits, as a share of the data stretch (0–1). */
    recordAt: number[];
    small: boolean;
    reduce: boolean;
};

/** A point on screen, in CSS pixels; null when it is behind the camera. */
export type Mark = { x: number; y: number } | null;

export type FrameIn = {
    /** Where the request should be on the route (0–1); the world eases towards it. */
    u: number;
    /** 0 = riding the route, 1 = looking at the whole map. */
    map: number;
    /** The response flying home, 1 → 0. */
    resp: number;
    pointer: { x: number; y: number };
};

export type FrameOut = {
    rings: Mark[];
    records: Mark[];
    /** Index of a project ring the request just flew through. */
    passed: number | null;
    /** 0–1, how fast the request is moving. */
    speed: number;
};

export type World = {
    /** Route position at the start of each section: hero, wire, edge, services, data, end. */
    seg: number[];
    frame: (f: FrameIn) => FrameOut;
    dispose: () => void;
};

const ZONE = ['#8fd3ff', '#ffb35c', '#7af0ff', '#ffffff'].map((c) => new THREE.Color(c));

function renderer(canvas: HTMLCanvasElement, small: boolean): THREE.WebGLRenderer {
    const r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 1.75));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.95;
    return r;
}

export function createWorld(o: WorldOptions): World {
    const gl = renderer(o.canvas, o.small);
    const scene = new THREE.Scene();
    scene.background = NIGHT.clone();
    scene.fog = new THREE.FogExp2(NIGHT, FOG);
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x05070d, 0.25));
    const camera = new THREE.PerspectiveCamera(o.small ? 72 : 58, 1, 0.1, 6000);

    const s = shared(gl.getPixelRatio());
    const rand = rng(7);
    const density = o.small ? 0.5 : 1;
    const route = createRoute();
    const [, , , svc, data, end] = route.seg;
    addWire(scene, route, s, density, rand);
    addCity(scene, route, s, density, rand);
    const rings = addRings(
        scene,
        route,
        o.rings,
        o.ringAt.map((f) => lerp(svc, data, f)),
        rand
    );
    const recordUs = o.recordAt.map((f) => lerp(data, end, f));
    const records = addLattice(scene, route, s, recordUs, o.small, rand);
    addDust(scene, route, s, density, rand);
    const glow = glowMaker(scene);
    const packet = addPacket(scene, route, s, glow);
    const routeMap = addMap(scene, route, s, glow);
    const rig = createRig(camera, route, o.small, o.reduce);
    const post = createPost(gl, scene, camera, o.small);
    const ringColours = o.rings.map((c) => new THREE.Color(c));

    let w = 0;
    let h = 0;
    const resize = (): void => {
        const cw = o.canvas.clientWidth;
        const ch = o.canvas.clientHeight;
        // Ignore the phone address bar sliding in and out.
        if (cw === w && Math.abs(ch - h) < 140) return;
        w = cw;
        h = ch;
        gl.setSize(cw, ch, false);
        post.composer.setSize(cw, ch);
        camera.aspect = cw / ch;
        camera.updateProjectionMatrix();
    };

    const colourAt = (u: number, map: number): THREE.Color => {
        if (map > 0.02) return ZONE[3];
        if (u < route.seg[2]) return ZONE[0];
        if (u < svc) return ZONE[1];
        if (u >= data) return ZONE[2];
        const k = Math.round(clamp((u - svc) / (data - svc)) * (ringColours.length - 1));
        return ringColours[k] ?? ZONE[0];
    };
    const v = new THREE.Vector3();
    const RING_TAG = new THREE.Vector3(16, 10, 0);
    const project = (p: THREE.Vector3, range: number): Mark => {
        if (camera.position.distanceTo(p) > range) return null;
        v.copy(p).project(camera);
        return v.z < 1 ? { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h } : null;
    };

    let u = 0.004;
    let speed = 0;
    let t = 0;
    let last = performance.now();
    const frame = (f: FrameIn): FrameOut => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        t += dt;
        resize();
        const prev = u;
        u += (f.u - u) * (o.reduce ? 1 : 1 - Math.exp(-dt * 5));
        speed +=
            (Math.min(1, (Math.abs(u - prev) * route.len) / Math.max(dt, 1e-3) / 160) - speed) *
            (1 - Math.exp(-dt * 4));

        const p = packet.update(u, colourAt(u, f.map), speed, t, f.map);
        rig.update(u, f.map, t, dt, speed, f.pointer);
        const fog = FOG * Math.pow(0.00055 / FOG, Math.pow(f.map, 0.35));
        (scene.fog as THREE.FogExp2).density = fog;
        s.uFog.value = fog;
        s.uScan.value = p.y;
        s.uTime.value = t;
        const passed = rings.update(u, t, dt, f.map);
        records.update(p, u);
        routeMap.update(f.map, f.resp);
        post.finish(t, o.reduce ? 0 : speed);
        post.composer.render();
        return {
            rings: rings.centers.map((c) => project(v.copy(c).add(RING_TAG).clone(), 170)),
            records: records.points.map((r) => project(r, 120)),
            passed,
            speed,
        };
    };

    const dispose = (): void => {
        scene.traverse((obj) => {
            const m = obj as THREE.Mesh;
            m.geometry?.dispose();
            const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
            mats.forEach((x) => x.dispose());
        });
        pmrem.dispose();
        post.composer.dispose();
        gl.dispose();
    };
    return { seg: route.seg, frame, dispose };
}
