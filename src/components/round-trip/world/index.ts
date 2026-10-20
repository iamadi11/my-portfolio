import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

import { clamp, lerp, smooth } from '@/components/round-trip/math';
import { addCity, type Env, FLOOR } from '@/components/round-trip/world/city';
import { FOG, MOON, rng, shared } from '@/components/round-trip/world/gl';
import { glowMaker } from '@/components/round-trip/world/glow';
import { addLand, GROUND, type LandKind, LANDS } from '@/components/round-trip/world/land';
import { addLandmarks } from '@/components/round-trip/world/landmarks';
import { createPost } from '@/components/round-trip/world/post';
import { addRecords } from '@/components/round-trip/world/records';
import { createRig, type Shot } from '@/components/round-trip/world/rig';
import { createRoute } from '@/components/round-trip/world/route';
import { addSea, SEA } from '@/components/round-trip/world/sea';
import { addRings } from '@/components/round-trip/world/services';
import { addShip } from '@/components/round-trip/world/ship';
import { addSky } from '@/components/round-trip/world/sky';
import { addSpace } from '@/components/round-trip/world/space';
import { addWarp } from '@/components/round-trip/world/warp';

export type WorldOptions = {
    canvas: HTMLCanvasElement;
    /** One colour per project; each gets a portal. */
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
    /** True on the frame a jump to a new scene begins (not for a quiet dip). */
    jumped: boolean;
    /** 0–1: how white the screen is with a jump's flash, so the HUD can hold its ground. */
    flash: number;
    /** The stop on screen: a place, plus which project's stretch for a landscape ("desert#1"). */
    place: string;
    /** Where the ship is on screen, for the sound of its engine. */
    ship: Mark;
    /** 0–1: rushing at a portal or burning through the air, for the roar. */
    rush: number;
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
    // Thinner than the default so the downtown reads across the avenue.
    city: { fog: FOG * 0.74, horizon: [0.05, 0.042, 0.05], stars: 0.35 },
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

/** The cut itself: the cloud deck on the way in, thin blue air on the way out, blue-white otherwise. */
const FLASH = {
    entry: new THREE.Color(0.9, 0.84, 0.8),
    orbit: new THREE.Color(0.75, 0.88, 1),
    other: new THREE.Color(0.7, 0.85, 1),
};
/** Night cloud, lit from below by the city, for the fog while dropping through the deck. */
const CLOUD = new THREE.Color(0.06, 0.05, 0.05);
/** How long a jump takes (s) and where in it the scene is swapped: portals are quick, the two
 * passages through the air (into the cloud deck, out of the last of the air) linger. */
const JUMP = { portal: 1.45, air: 1.9, dip: 1.1 };
const PEAK = { portal: 0.36, air: 0.42, dip: 0.5 };

function renderer(canvas: HTMLCanvasElement, small: boolean): THREE.WebGLRenderer {
    const r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 1.75));
    // AgX: a filmic roll-off that keeps saturated lights from clipping to neon.
    r.toneMapping = THREE.AgXToneMapping;
    r.toneMappingExposure = 1.08;
    return r;
}

/** Where each item's stretch of a section ends (halfway to the next item; the last runs to the end). */
const endsOf = (at: number[]): number[] =>
    at.map((f, k) => (k < at.length - 1 ? (f + at[k + 1]) / 2 : 0.998));

/** Which item's stretch a share of the way through a section is in. */
const zoneOf = (f: number, ends: number[]): number => {
    let k = 0;
    while (k < ends.length - 1 && f > ends[k]) k++;
    return k;
};

/**
 * A stop on the trip: a place, plus which project's stretch it is for the landscapes ("desert#1"),
 * so that every portal is a jump even when a landscape comes round again.
 */
type Stop = string;
const placeOf = (stop: Stop): Place => stop.split('#')[0] as Place;
const zoneIn = (stop: Stop): number => Number(stop.split('#')[1] ?? -1);

type Jump = { shown: Stop; jump: number; dip: number; jumped: boolean; tint: THREE.Color };
type TintOf = (target: Stop) => THREE.Color | null;

/**
 * The quiet changes of place, where there is no portal to fly through: city to the first
 * landscape, open sea to the pack ice. They dip through the dark instead of jumping, so the warp
 * stays the signature of the portals (and of the two passages through the air).
 */
const quiet = (from: Stop, to: Stop): boolean =>
    (from === 'city' && to.includes('#')) || (from === 'ocean' && to === 'ice');

/**
 * The change between places: crossing into a new one starts a boost (or, for a quiet change, a
 * dip through the dark); the scene is swapped at its peak, under the blur and flash or the dark.
 * Reduced motion cuts straight across.
 */
function jumper(
    reduce: boolean,
    tintOf: TintOf,
    onStart: () => void
): { step: (dt: number, target: Stop, back: boolean) => Jump } {
    const out: Jump = { shown: 'space', jump: 0, dip: 0, jumped: false, tint: FLASH.other.clone() };
    let next: Stop = 'space';
    let clock = -1;
    let len = JUMP.portal;
    let peak = PEAK.portal;
    let soft = false;
    let level = 0;
    const start = (target: Stop): void => {
        soft = quiet(out.shown, target);
        next = target;
        clock = 0;
        out.jumped = !soft;
        const air = out.shown === 'space' || target === 'orbit';
        len = soft ? JUMP.dip : air ? JUMP.air : JUMP.portal;
        peak = soft ? PEAK.dip : air ? PEAK.air : PEAK.portal;
        out.tint.copy(
            out.shown === 'space'
                ? FLASH.entry
                : target === 'orbit'
                  ? FLASH.orbit
                  : (tintOf(target) ?? FLASH.other)
        );
        if (!soft) onStart();
    };
    /** A new target while a change is under way: rewind before the peak, chain after it. */
    const redirect = (target: Stop, back: boolean): void => {
        if (clock < 0 || target === next) return;
        // Scrolled back before the peak: drop the change and cut to where the visitor is.
        if (clock < peak && back) {
            clock = -1;
            out.shown = target;
            return;
        }
        // Raced past another place after the peak: chain straight into the next change, at the
        // same strength and twice the pace, instead of queueing a full one behind this.
        if (clock >= peak && !back && !reduce) {
            const now = level;
            start(target);
            len *= 0.5;
            clock = peak * Math.sqrt(now);
        }
    };
    /** Strength of the change in progress (0–1): rising to the peak, where the scene swaps, then easing out. */
    const advance = (dt: number): number => {
        if (clock < 0) return 0;
        clock += dt / len;
        if (clock >= peak) out.shown = next;
        if (clock >= 1) {
            clock = -1;
            return 0;
        }
        return clock < peak ? Math.pow(clock / peak, 2) : 1 - Math.pow((clock - peak) / (1 - peak), 0.6);
    };
    const step = (dt: number, target: Stop, back: boolean): Jump => {
        out.jumped = false;
        redirect(target, back);
        if (clock < 0 && target !== out.shown) {
            // Rewinding is a plain cut; only the way forward is a jump.
            if (reduce || back) out.shown = target;
            else start(target);
        }
        level = advance(dt);
        out.jump = soft ? 0 : level;
        out.dip = soft ? level : 0;
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
    // The city's glass reflects the same HDRI by direction, so it is kept.
    const env: Env = { tEnv: { value: null }, uEnvOn: { value: 0 } };
    new HDRLoader()
        .loadAsync('/env/night.hdr')
        .then((hdr) => {
            scene.environment = pmrem.fromEquirectangular(hdr).texture;
            scene.environmentIntensity = 0.35;
            hdr.generateMipmaps = true;
            hdr.minFilter = THREE.LinearMipmapLinearFilter;
            hdr.needsUpdate = true;
            env.tEnv.value = hdr;
            env.uEnvOn.value = 1;
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
    const city = addCity(cityGroup, s, density, rand, env);
    const land = addLand(scene, s, o.small, rand);
    const sea = addSea(scene, s, sky.uniforms.uHorizon, o.small, rand);
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);
    // Each project's landscape ends at its portal: flying through it is the jump to the next.
    const ringEnds = endsOf(o.ringAt);
    const rings = addRings(
        ringGroup,
        s,
        route,
        o.rings,
        ringEnds.map((f) => lerp(svc, data, f)),
        o.small,
        glow
    );
    const landmarks = addLandmarks(
        scene,
        ringEnds.map((f) => {
            const at = lerp(svc, data, f);
            return { center: route.curve.getPointAt(at), tangent: route.curve.getTangentAt(at) };
        }),
        o.small
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

    // Where the open sea gives way to the pack ice: halfway through the records.
    const half =
        o.recordAt.length > 1
            ? (o.recordAt[Math.floor(o.recordAt.length / 2) - 1] +
                  o.recordAt[Math.floor(o.recordAt.length / 2)]) /
              2
            : 0.5;
    const iceAt = lerp(data, 1, half);
    const stopAt = (u: number, map: number): Stop => {
        if (map > 0.5) return 'orbit';
        if (u < city0) return 'space';
        if (u < svc) return 'city';
        if (u < data) {
            const k = zoneOf((u - svc) / (data - svc), ringEnds);
            return `${LANDS[k % LANDS.length]}#${k}`;
        }
        return u < iceAt ? 'ocean' : 'ice';
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
    // Each portal's jump flashes in its project's colour.
    const jumps = jumper(
        o.reduce,
        (target) => (zoneIn(target) >= 0 ? new THREE.Color(o.rings[zoneIn(target)]) : null),
        () => ship.boost()
    );
    let rushNow = 0;
    let rolled = false;
    const toSun = new THREE.Vector3();
    let leaveWas = 0;
    let u = 0.004;
    let speed = 0;
    let t = 0;
    let last = performance.now();

    /**
     * The designed moves of the trip, each 0–1: the dive at Earth before the cut into the air,
     * the drop out of the cloud deck onto the city, the climb off the ice, and the rise away from
     * Earth once back in orbit.
     */
    const beat = { dive: 0, drop: 0, climb: 0, rise: 0, skim: 0, over: 0, leave: 0 };
    const shot: Shot = { tilt: 0, lift: 0, shake: 0 };
    let kicked = false;
    const heading = new THREE.Vector3();

    /** Fog, horizon and sky for the place on screen; `thin` is high air, `cloud` the deck. */
    const applyAir = (air: Air, thin: number, cloud: number): void => {
        const fog = scene.fog as THREE.FogExp2;
        fog.density = s.uFog.value = air.fog * (1 - thin);
        sky.uniforms.uHorizon.value.setRGB(...air.horizon).lerp(CLOUD, cloud);
        s.uFogColor.value.copy(sky.uniforms.uHorizon.value);
        fog.color.copy(sky.uniforms.uHorizon.value);
        sky.uniforms.uSpace.value = air.space ? 1 : 0;
        sky.uniforms.uAurora.value = air.aurora ?? 0;
        sky.uniforms.uStars.value = (air.stars ?? 1) * (1 - cloud) * (1 + thin * 0.9);
    };

    /** Only the place on screen is drawn; the rest wait for their jump. */
    const showPlace = (place: Place): { heat: number; sun: THREE.Vector3 | null; dawn: number } => {
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
            rise: beat.rise,
        });
    };

    /**
     * The moves: nose down and drop away as it dives at Earth and sinks onto the city; nose up and
     * climb above the eye line pulling off the ice and leaving orbit. Sets `heading`; returns the
     * height offset.
     */
    /** At the end it climbs away, up and ahead over the Earth, shrinking in frame, lit by the sun. */
    const depart = (sun: THREE.Vector3 | null, leave: number, dawn: number): void => {
        sunlight.intensity = sun ? 3.2 * dawn : 0;
        if (!sun) return;
        if (leave > 0) {
            // Away along the view, rising a little: it shrinks against the Earth, not out of frame.
            const gone = Math.pow(leave, 1.4) * 160;
            toSun
                .copy(tangent)
                .setY(tangent.y + 0.14)
                .normalize();
            at.addScaledVector(toSun, gone);
            heading.lerp(toSun, leave).normalize();
        }
        // The key comes from the camera's side and above (the sun is behind the ship, which would
        // leave it a black silhouette on black space), so it reads however far it has gone.
        sunlight.target.position.copy(at);
        sunlight.position.copy(camera.position).addScaledVector(camera.up, 40);
    };

    const moves = (orbit: boolean): number => {
        const away = orbit ? 1 - beat.rise : 0;
        heading
            .copy(tangent)
            .setY(tangent.y - 0.9 * beat.dive - 0.55 * beat.drop + 0.9 * beat.climb + 0.4 * away)
            .normalize();
        return shot.lift * 0.97 - beat.dive * 9 + beat.climb * 30 - away * 6;
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
        sun: THREE.Vector3 | null,
        dawn: number
    ): void => {
        const orbit = place === 'orbit';
        const air = AIR[place];
        const { n1 } = route.frame(clamp(u));
        if (camera.aspect >= 1) side.copy(n1).multiplyScalar(2.2).add(DOWN);
        else side.set(0, air.space ? 3.6 : 4.6, 0);
        route.curve.getTangentAt(clamp(u), tangent);
        const hero = 1 - smooth(route.seg[1] * 0.6, route.seg[1] * 1.6, u);
        const leave = orbit ? smooth(0.35, 1, 1 - resp) : 0;
        // Runs ahead of the eye when it dives, skims, crosses the pole or rushes a gate.
        const lead = beat.dive * 14 + beat.skim * 10 + beat.over * 18 + beat.climb * 22 + rushNow * 6;
        at.copy(p)
            .add(side)
            .addScaledVector(tangent, hero * 5 + lead);
        at.y += hero * 1.1 + leave * 6 + moves(orbit);
        depart(sun, leave, dawn);
        ship.update({
            at,
            heading,
            speed: Math.max(speed, leave, rings.rush),
            dt,
            hero: u < route.seg[1] + 0.002 || (orbit && leave < 0.08),
            heat,
            key: dawn,
            beam: air.space ? 0 : 1,
            ground: place === 'city' ? FLOOR : isLand(place) ? GROUND[place] : SEA,
        });
        if (leaveWas < 0.3 && leave >= 0.3) ship.boost();
        leaveWas = leave;
    };

    /** The beats for the place on screen, and the shot they make. */
    const beats = (shown: Place, map: number, resp: number): void => {
        beat.leave = shown === 'orbit' ? smooth(0.35, 1, 1 - resp) : 0;
        // The long way in: a slow roll onto the globe, then the dive proper, the air thickening.
        beat.dive = shown === 'space' ? smooth(0.38, 0.96, u / city0) : 0;
        beat.drop = shown === 'city' ? 1 - smooth(city0, lerp(city0, svc, 0.34), u) : 0;
        // The long way out: pull up off the ice, burn, then the globe falls away in orbit.
        beat.climb = shown === 'ice' ? smooth(0.06, 0.5, map) : 0;
        beat.rise = shown === 'orbit' ? smooth(0.5, 1, map) : 0;
        // Arrivals at sea: a skim low over the waves; at the pole: a lift to take in the ice.
        const bump = (from: number, span: number): number => Math.sin(Math.PI * clamp((u - from) / span));
        beat.skim = shown === 'ocean' ? bump(data, (1 - data) * 0.16) : 0;
        beat.over = shown === 'ice' ? bump(iceAt, (1 - data) * 0.14) : 0;
        shot.tilt =
            beat.dive * 0.8 -
            beat.climb * 0.9 +
            (shown === 'orbit' ? (1 - beat.rise) * 0.55 - beat.leave * 0.1 : 0);
        shot.lift =
            beat.drop * beat.drop * 230 + beat.climb * beat.climb * 40 + beat.over * 22 - beat.skim * 12;
        // The afterburner lights once on the way out.
        if (beat.climb > 0.45 && !kicked) {
            kicked = true;
            ship.boost();
        }
        if (beat.climb < 0.1) kicked = false;
    };

    /**
     * Rushing at a gate (a portal, the edge of the city, the edge of the ice) or burning through
     * the air: the frame widens and shudders; the barrel roll is the wind-up. Returns 0–1.
     */
    const rushing = (shown: Place, heat: number, forward: boolean): number => {
        // Only a portal is rushed; the quiet changes (city to land, sea to ice) are not.
        const gate = rings.rush;
        if (gate > 0.5 && !rolled && forward) {
            rolled = true;
            ship.roll();
        }
        if (gate < 0.2) rolled = false;
        return Math.max(gate, heat * 0.8, beat.climb > 0.45 ? (beat.climb - 0.45) * 1.6 : 0);
    };

    const frame = (f: FrameIn): FrameOut => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        t += dt;
        resize();
        const prev = u;
        u += (f.u - u) * (o.reduce ? 1 : 1 - Math.exp(-dt * 3.6));
        speed +=
            (Math.min(1, (Math.abs(u - prev) * route.len) / Math.max(dt, 1e-3) / 160) - speed) *
            (1 - Math.exp(-dt * 4));
        const { shown: stop, jump, dip, jumped, tint } = jumps.step(dt, stopAt(u, f.map), u < prev);
        const shown = placeOf(stop);
        const zone = zoneIn(stop);
        route.curve.getPointAt(clamp(u), p);
        s.uPacket.value.copy(p);
        s.uScan.value = p.y;
        s.uTime.value = t;
        beats(shown, f.map, f.resp);
        applyAir(AIR[shown], beat.drop * 0.6 + beat.climb * 0.85, beat.drop);
        s.uDrop.value = beat.drop;
        const { heat, sun, dawn } = showPlace(shown);
        const passed = rings.update(u, t, dt, zone);
        const rush = rushing(shown, heat, u >= prev);
        rushNow = rush;
        shot.shake = o.reduce ? 0 : rush * 0.004;
        rig.update(u, t, dt, Math.min(1, speed + rush * 0.6), jump, f.pointer, !AIR[shown].space, shot);
        landmarks.show(zone);
        flyShip(shown, dt, f.resp, heat, sun, dawn);
        records.update(p, u);
        warp.update(Math.max(jump, !o.reduce && beat.climb > 0.45 ? (beat.climb - 0.45) * 1.4 : 0), tint);
        // Seen from above through cloud, a city of small lights would bloom into mush.
        post.finish(
            t,
            o.reduce ? 0 : Math.min(1, speed + rush * 0.5),
            jump,
            tint,
            1 - Math.max(beat.drop * 0.8, beat.dive * 0.45),
            dip
        );
        post.composer.render();
        return {
            rings: rings.centers.map((c, k) =>
                k === zone ? project(v.copy(c).add(RING_TAG).clone(), 260) : null
            ),
            records: records.points.map((r) => (recordGroup.visible ? project(r, 240) : null)),
            passed,
            speed,
            jumped,
            flash: Math.pow(jump, 3),
            place: stop,
            ship: project(at, 1e9),
            rush: Math.max(rush, heat),
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
