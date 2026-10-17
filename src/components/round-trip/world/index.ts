import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

import { clamp, lerp, smooth } from '@/components/round-trip/math';
import { addCity, FLOOR } from '@/components/round-trip/world/city';
import { FOG, MOON, rng, shared } from '@/components/round-trip/world/gl';
import { glowMaker } from '@/components/round-trip/world/glow';
import { addLand, GROUND, type LandKind, LANDS } from '@/components/round-trip/world/land';
import { createPost } from '@/components/round-trip/world/post';
import { addRecords } from '@/components/round-trip/world/records';
import { createRig } from '@/components/round-trip/world/rig';
import { createRoute } from '@/components/round-trip/world/route';
import { addSea, SEA } from '@/components/round-trip/world/sea';
import { addRings } from '@/components/round-trip/world/services';
import { addShip } from '@/components/round-trip/world/ship';
import { addSky } from '@/components/round-trip/world/sky';
import { addSpace } from '@/components/round-trip/world/space';
import { addWarp } from '@/components/round-trip/world/warp';

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
    /** Where the ship should be on the route (0–1); the world eases towards it. */
    u: number;
    /** 0 = on the journey, 1 = back in orbit at the end. */
    map: number;
    /** The response going home, 1 → 0: at 0 the ship has left. */
    resp: number;
    pointer: { x: number; y: number };
};

export type FrameOut = {
    rings: Mark[];
    records: Mark[];
    /** Index of a project ring the ship just flew through. */
    passed: number | null;
    /** 0–1, how fast the ship is moving. */
    speed: number;
    /** True on the frame a jump to a new scene begins. */
    jumped: boolean;
};

export type World = {
    /** Route position at the start of each section: hero, wire, edge, services, data, end. */
    seg: number[];
    frame: (f: FrameIn) => FrameOut;
    dispose: () => void;
};

/** Every place the ship visits, in order. Each is endless; the ship jumps from one to the next. */
type Place = 'space' | 'city' | LandKind | 'ocean' | 'ice' | 'orbit';

type Air = {
    fog: number;
    horizon: [number, number, number];
    space?: boolean;
    aurora?: number;
    stars?: number;
};
const AIR: Record<Place, Air> = {
    space: { fog: 0.03, horizon: [0, 0, 0], space: true },
    city: { fog: FOG, horizon: [0.05, 0.042, 0.05], stars: 0.35 },
    grass: { fog: 0.006, horizon: [0.025, 0.04, 0.055] },
    desert: { fog: 0.0055, horizon: [0.035, 0.04, 0.06] },
    canyon: { fog: 0.006, horizon: [0.045, 0.035, 0.04] },
    alpine: { fog: 0.0045, horizon: [0.03, 0.045, 0.075] },
    volcano: { fog: 0.007, horizon: [0.09, 0.03, 0.015], stars: 0.7 },
    ocean: { fog: 0.005, horizon: [0.022, 0.04, 0.066] },
    ice: { fog: 0.0045, horizon: [0.018, 0.052, 0.06], aurora: 1 },
    orbit: { fog: 0.03, horizon: [0, 0, 0], space: true },
};
const isLand = (p: Place): p is LandKind => (LANDS as readonly string[]).includes(p);

/** The cut itself: fiery into the atmosphere, gold back into orbit, cold blue-white otherwise. */
const FLASH = {
    entry: new THREE.Color(1, 0.45, 0.15),
    orbit: new THREE.Color(1, 0.8, 0.5),
    other: new THREE.Color(0.7, 0.85, 1),
};
const JUMP = 0.95;
const PEAK = 0.32;

function renderer(canvas: HTMLCanvasElement, small: boolean): THREE.WebGLRenderer {
    const r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 1.75));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    return r;
}

/** Which place a share of the way through a section is in: split halfway between its items. */
const zoneOf = (f: number, at: number[]): number => {
    let k = 0;
    while (k < at.length - 1 && f > (at[k] + at[k + 1]) / 2) k++;
    return k;
};

type Jump = { shown: Place; jump: number; jumped: boolean; tint: THREE.Color };

/**
 * The jump between places: crossing into a new one starts a boost; the scene is swapped at its
 * peak, under the blur and the flash. Reduced motion cuts straight across.
 */
function jumper(reduce: boolean, onStart: () => void): { step: (dt: number, target: Place) => Jump } {
    const out: Jump = { shown: 'space', jump: 0, jumped: false, tint: FLASH.other };
    let next: Place = 'space';
    let clock = -1;
    const start = (target: Place): void => {
        next = target;
        clock = 0;
        out.jumped = true;
        out.tint = out.shown === 'space' ? FLASH.entry : target === 'orbit' ? FLASH.orbit : FLASH.other;
        onStart();
    };
    const step = (dt: number, target: Place): Jump => {
        out.jumped = false;
        if (clock < 0 && target !== out.shown) {
            if (reduce) out.shown = target;
            else start(target);
        }
        out.jump = 0;
        if (clock < 0) return out;
        clock += dt / JUMP;
        if (clock >= PEAK) out.shown = next;
        out.jump = clock < PEAK ? Math.pow(clock / PEAK, 2) : 1 - Math.pow((clock - PEAK) / (1 - PEAK), 0.6);
        if (clock >= 1) {
            clock = -1;
            out.jump = 0;
        }
        return out;
    };
    return { step };
}

export function createWorld(o: WorldOptions): World {
    const gl = renderer(o.canvas, o.small);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, FOG);
    const pmrem = new THREE.PMREMGenerator(gl);
    // A studio light until the night-city HDRI (Poly Haven, CC0) arrives; then metal has a night to reflect.
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    new HDRLoader()
        .loadAsync('/env/night.hdr')
        .then((hdr) => {
            scene.environment = pmrem.fromEquirectangular(hdr).texture;
            scene.environmentIntensity = 0.35;
            hdr.dispose();
        })
        .catch(() => undefined);
    scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x05070d, 0.25));
    const moon = new THREE.DirectionalLight(0xbccbff, 0.8);
    moon.position.copy(MOON).multiplyScalar(100);
    scene.add(moon);
    // Warm sunlight on the ship once it is back in orbit at sunrise.
    const sunlight = new THREE.DirectionalLight(0xffc48a, 0);
    scene.add(sunlight, sunlight.target);
    const camera = new THREE.PerspectiveCamera(o.small ? 72 : 58, 1, 0.1, 6000);
    scene.add(camera);

    const s = shared(gl.getPixelRatio());
    const sky = addSky(scene, s, o.small);
    const rand = rng(7);
    const density = o.small ? 0.5 : 1;
    const route = createRoute(o.rings.length, o.recordAt.length);
    const [, , city0, svc, data] = route.seg;
    const glow = glowMaker(scene);
    const space = addSpace(scene, route, s, density, o.small, glow, rand);
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);
    const city = addCity(cityGroup, s, density, rand);
    const land = addLand(scene, s, o.small, rand);
    const sea = addSea(scene, s, sky.uniforms.uHorizon, o.small, rand);
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);
    const rings = addRings(
        ringGroup,
        route,
        o.rings,
        o.ringAt.map((f) => lerp(svc, data, f)),
        rand
    );
    const recordGroup = new THREE.Group();
    scene.add(recordGroup);
    const records = addRecords(
        recordGroup,
        route,
        s,
        o.recordAt.map((f) => lerp(data, 1, f))
    );
    const ship = addShip(scene, s, o.small, glow);
    const warp = addWarp(camera, s, o.small ? 160 : 320, rand);
    const rig = createRig(camera, route, o.small, o.reduce);
    const post = createPost(gl, scene, camera, o.small);

    const placeAt = (u: number, map: number): Place => {
        if (map > 0.5) return 'orbit';
        if (u < city0) return 'space';
        if (u < svc) return 'city';
        if (u < data) return LANDS[zoneOf((u - svc) / (data - svc), o.ringAt) % LANDS.length];
        const half =
            o.recordAt.length > 1
                ? (o.recordAt[Math.floor(o.recordAt.length / 2) - 1] +
                      o.recordAt[Math.floor(o.recordAt.length / 2)]) /
                  2
                : 0.5;
        return (u - data) / (1 - data) < half ? 'ocean' : 'ice';
    };

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

    const v = new THREE.Vector3();
    const RING_TAG = new THREE.Vector3(16, 10, 0);
    const project = (p: THREE.Vector3, range: number): Mark => {
        if (camera.position.distanceTo(p) > range) return null;
        v.copy(p).project(camera);
        return v.z < 1 ? { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h } : null;
    };

    const tangent = new THREE.Vector3();
    const side = new THREE.Vector3();
    const at = new THREE.Vector3();
    const p = new THREE.Vector3();
    const DOWN = new THREE.Vector3(0, -0.7, 0);
    const jumps = jumper(o.reduce, () => ship.boost());
    let leaveWas = 0;
    let u = 0.004;
    let speed = 0;
    let t = 0;
    let last = performance.now();

    /** Fog, horizon and sky for the place on screen. */
    const applyAir = (air: Air): void => {
        const fog = scene.fog as THREE.FogExp2;
        fog.density = s.uFog.value = air.fog;
        sky.uniforms.uHorizon.value.setRGB(...air.horizon);
        s.uFogColor.value.copy(sky.uniforms.uHorizon.value);
        fog.color.copy(sky.uniforms.uHorizon.value);
        sky.uniforms.uSpace.value = air.space ? 1 : 0;
        sky.uniforms.uAurora.value = air.aurora ?? 0;
        sky.uniforms.uStars.value = air.stars ?? 1;
    };

    /** Only the place on screen is drawn; the rest wait for their jump. */
    const showPlace = (place: Place): { heat: number; sun: THREE.Vector3 | null } => {
        const atSea = place === 'ocean' || place === 'ice';
        city.update(camera.position, place === 'city');
        cityGroup.visible = place === 'city';
        land.show(isLand(place) ? place : null, camera.position);
        sea.show(atSea ? place : null, camera.position);
        ringGroup.visible = isLand(place);
        recordGroup.visible = atSea;
        return space.update({
            on: place === 'space' || place === 'orbit',
            e: clamp(u / city0),
            eye: camera.position,
            tall: camera.aspect < 1,
            finale: place === 'orbit',
        });
    };

    /**
     * The ship: beside the line of sight (right of centre on wide screens, above the bottom panel
     * on tall ones). In the hero it waits a little further off, facing you; at the end it greets
     * you, then turns and is gone towards the sunrise.
     */
    const flyShip = (
        place: Place,
        dt: number,
        resp: number,
        heat: number,
        sun: THREE.Vector3 | null
    ): void => {
        const orbit = place === 'orbit';
        const air = AIR[place];
        const { n1 } = route.frame(clamp(u));
        if (camera.aspect >= 1) side.copy(n1).multiplyScalar(3).add(DOWN);
        else side.set(0, air.space ? 3.6 : 4.6, 0);
        route.curve.getTangentAt(clamp(u), tangent);
        const hero = 1 - smooth(route.seg[1] * 0.6, route.seg[1] * 1.6, u);
        const leave = orbit ? smooth(0.35, 1, 1 - resp) : 0;
        at.copy(p)
            .add(side)
            .addScaledVector(tangent, hero * 5 + Math.pow(leave, 2.2) * 900);
        at.y += hero * 1.1 + leave * 6;
        sunlight.intensity = sun ? 3.2 : 0;
        if (sun) {
            sunlight.target.position.copy(at);
            sunlight.position.copy(sun);
        }
        ship.update({
            at,
            heading: tangent,
            speed: Math.max(speed, leave),
            dt,
            hero: u < route.seg[1] + 0.002 || (orbit && leave < 0.08),
            heat,
            beam: air.space ? 0 : 1,
            ground: place === 'city' ? FLOOR : isLand(place) ? GROUND[place] : SEA,
        });
        if (leaveWas < 0.3 && leave >= 0.3) ship.boost();
        leaveWas = leave;
    };

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
        const { shown, jump, jumped, tint } = jumps.step(dt, placeAt(u, f.map));
        route.curve.getPointAt(clamp(u), p);
        s.uPacket.value.copy(p);
        s.uScan.value = p.y;
        s.uTime.value = t;
        applyAir(AIR[shown]);
        rig.update(u, t, dt, speed, jump, f.pointer, !AIR[shown].space);
        const { heat, sun } = showPlace(shown);
        const passed = rings.update(u, t, dt, 0);
        flyShip(shown, dt, f.resp, heat, sun);
        if (passed !== null) ship.roll();
        records.update(p, u);
        warp.update(jump, tint);
        post.finish(t, o.reduce ? 0 : speed, jump, tint);
        post.composer.render();
        return {
            rings: rings.centers.map((c) =>
                isLand(shown) ? project(v.copy(c).add(RING_TAG).clone(), 170) : null
            ),
            records: records.points.map((r) => (recordGroup.visible ? project(r, 120) : null)),
            passed,
            speed,
            jumped,
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
