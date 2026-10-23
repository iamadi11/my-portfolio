import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { clamp, smooth } from '@/components/round-trip/math';
import { ADD, type Shared, shader } from '@/components/round-trip/world/gl';
import type { Glow } from '@/components/round-trip/world/glow';

export type ShipIn = {
    /** Where the ship flies (route point plus `side`) and the way it is heading. */
    at: THREE.Vector3;
    heading: THREE.Vector3;
    speed: number;
    dt: number;
    /** In the hero (and at the very end) it turns round to face you. */
    hero: boolean;
    /** 0–1: re-entry heat. */
    heat: number;
    /** 0–1: a warm key from the camera's side, for the finale when the sun is behind the ship. */
    key: number;
    /** 0–1: the pool of its landing light on the ground; `ground` is the height it lands on. */
    beam: number;
    ground: number;
    /** Steering velocity (world units/s), across the route and up: it leans and pitches into it. */
    lean: number;
    pitch: number;
    /** 0–1: the visitor holding to boost (the engines flare). */
    boost: number;
    /** 0–1: the visitor is still: a slower, deeper hover and a lower hum. */
    idle: number;
    /** Rim light on the hull's edges: the air of the place, the portal ahead, the sunrise. */
    rim: THREE.Color;
};

export type Ship = {
    update: (f: ShipIn) => void;
    roll: () => void;
    boost: () => void;
    /** A glint as it goes: the engines swell and settle. */
    glint: () => void;
};

/** How long the leaving glint takes (s), and how far the engine glow swells at its height. */
const GLINT = { len: 0.6, gain: 2 };
/** The glint: a quick swell, then a long settle. 0 when none is under way. */
const glintAt = (c: number): number => {
    if (c < 0 || c >= 1) return 0;
    return c < 0.2 ? c / 0.2 : Math.pow(1 - (c - 0.2) / 0.8, 2);
};

/** What the hull's shader reads each frame. */
type HullU = {
    uRim: { value: THREE.Color };
    /** The place's light from below (lava, the city's glow, a portal), on the belly. */
    uUnder: { value: THREE.Color };
    uThrust: { value: number };
};

/**
 * The hull's grade, on top of the artist's maps. The ORM map carries baked AO (r: near white with
 * dark panel seams), roughness (g) and metal (b). The light plates read as warm titanium, the dark
 * ones as cool gunmetal, the non-metal parts as slate, so the form reads in two tones at night
 * instead of one chrome; seams go dark and rough; roughness keeps the map's wear, spread wider.
 */
const GRADE = /* glsl */ `
    vec3 orm = texture2D(metalnessMap, vMetalnessMapUv).rgb;
    float cav = smoothstep(0.62, 0.99, orm.r);
    float lit = smoothstep(0.3, 0.62, dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)));
    vec3 tone = mix(vec3(0.22, 0.27, 0.36), vec3(1.0, 0.84, 0.66), lit);
    diffuseColor.rgb *= mix(vec3(0.3, 0.36, 0.46), tone, orm.b) * mix(0.3, 1.0, cav);
    roughnessFactor = clamp(mix(0.1, 0.62, orm.g) + (1.0 - cav) * 0.35 + (1.0 - orm.b) * 0.12, 0.08, 1.0);
    metalnessFactor = orm.b;
`;

/**
 * Light of its own: a fresnel rim in the place's air (`uRim`); the place's light bounced up onto
 * the belly (`uUnder`); the engine eyes (the map's blue rings and strips) brightening with thrust,
 * the amber ones steady.
 */
const GLOW = /* glsl */ `
    float eye = saturate((totalEmissiveRadiance.b - totalEmissiveRadiance.r) * 2.0);
    totalEmissiveRadiance *= mix(1.5, 0.6 + uThrust * 1.2, eye);
    totalEmissiveRadiance += uRim * pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 4.0);
    vec3 wN = inverseTransformDirection(normal, viewMatrix);
    float below = saturate(-wN.y * 0.8 + 0.2);
    totalEmissiveRadiance += uUnder * below * below * mix(vec3(0.3), diffuseColor.rgb, 0.7) * cav;
`;

function gradeHull(src: THREE.MeshStandardMaterial, small: boolean, u: HullU): THREE.MeshStandardMaterial {
    const base = {
        map: src.map,
        normalMap: src.normalMap,
        normalScale: src.normalScale,
        roughnessMap: src.roughnessMap,
        metalnessMap: src.metalnessMap,
        emissiveMap: src.emissiveMap,
        emissive: new THREE.Color(1, 1, 1),
        side: src.side,
        envMapIntensity: 1.1,
    };
    // A lacquer over the paint catches the night in sharp lines; phones keep the plain material.
    const mat = small
        ? new THREE.MeshStandardMaterial(base)
        : new THREE.MeshPhysicalMaterial({ ...base, clearcoat: 0.55, clearcoatRoughness: 0.14 });
    mat.name = 'Hull';
    mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, u);
        sh.fragmentShader = sh.fragmentShader
            .replace('void main() {', 'uniform vec3 uRim, uUnder; uniform float uThrust;\nvoid main() {')
            .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\n${GRADE}`)
            .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${GLOW}`);
    };
    src.dispose();
    return mat;
}

const LEN = 3.2;

/**
 * The barrel roll: a short counter-bank the other way (`wind` s, to `back` rad), then one full
 * turn eased in and out over `len` s, so it gathers speed, peaks mid-roll and settles level.
 */
const ROLL = { wind: 0.12, back: 0.3, len: 0.95 };
const inOut = (x: number): number => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** The roll angle `c` seconds into it (0 once it is done). */
const barrel = (c: number): number => {
    if (c >= ROLL.wind + ROLL.len) return 0;
    if (c < ROLL.wind) {
        const a = c / ROLL.wind;
        return -ROLL.back * a * a * (3 - 2 * a);
    }
    const e = inOut((c - ROLL.wind) / ROLL.len);
    return -ROLL.back * (1 - e) + Math.PI * 2 * e;
};

/**
 * Engine plasma: white-hot at the nozzle, blue along the plume. Its colour temperature follows
 * thrust (violet-blue at idle, near white at full burn); on a boost, shock diamonds stand in the
 * plume. `uLive` is 0 with reduced motion: only the original flicker then.
 */
const FLAME_FRAG = /* glsl */ `
    uniform float uThrust, uBoost, uLive; uniform vec2 uSpan; varying vec3 vL, vN, vV;
    void main() {
        float k = clamp((vL.z - uSpan.x) / (uSpan.y - uSpan.x), 0.0, 1.0);
        // Faces seen edge-on fade out, so the jagged plume reads as a soft glow.
        float face = pow(abs(dot(normalize(vN), normalize(vV))), 2.0);
        float flick = 0.85 + 0.15 * sin(uTime * 61.0 + vL.z * 9.0);
        // Heat shimmer: a slower, uneven ripple running down the plume.
        flick *= 1.0 + uLive * 0.14 * sin(uTime * 23.0 - vL.z * 31.0) * sin(uTime * 7.3 + vL.x * 17.0);
        float t = clamp((uThrust - 0.6) / 1.8, 0.0, 1.0);
        vec3 cool = mix(vec3(0.3, 0.32, 1.0), vec3(0.12, 0.55, 1.0), t);
        vec3 hot = mix(vec3(0.7, 0.85, 1.0), vec3(1.0, 0.96, 0.9), t);
        vec3 c = mix(cool, hot, pow(k, mix(4.0, 2.0, t)));
        float d = 1.0 - k;
        float dia = pow(0.5 + 0.5 * cos(d * 30.0 - uTime * 2.0 * uLive), 10.0) * smoothstep(0.04, 0.2, d) * (1.0 - d);
        vec3 col = c * pow(k, 1.6) + hot * dia * uBoost * 0.9;
        gl_FragColor = vec4(col * uThrust * flick * face * 1.1, 1.0);
    }
`;
const FLAME_VERT = /* glsl */ `varying vec3 vL, vN, vV; void main() { vL = position; vN = normalMatrix * normal; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;

/**
 * A flicker in -1..1 from time alone (two incommensurate waves), so it looks the same at any
 * frame rate.
 */
const jitter = (t: number): number => Math.sin(t * 37.1) * 0.6 + Math.sin(t * 61.7 + 1.3) * 0.4;

/** Engine glow colour: blue at idle, whiter as the burn gets hot. */
const ENGINE_COOL = new THREE.Color(0.35, 0.6, 1.4);
const ENGINE_HOT = new THREE.Color(0.85, 0.92, 1.4);

/**
 * Where on the hull a ray straight down from above `x, z` (the ship's own space) lands, lifted a
 * hair off the paint; null if it misses.
 */
function onTop(hull: THREE.Object3D, top: number, x: number, z: number): THREE.Vector3 | null {
    const ray = new THREE.Raycaster(new THREE.Vector3(x, top + 1, z), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObject(hull, false)[0];
    return hit ? hit.point.setY(hit.point.y + 0.025) : null;
}

/** The hull's outermost points to port (+x) and starboard (-x), in the ship's own space. */
function wingtips(hull: THREE.Mesh): [THREE.Vector3, THREE.Vector3] {
    const pos = hull.geometry.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    const tips: [THREE.Vector3, THREE.Vector3] = [
        new THREE.Vector3(-Infinity, 0, 0),
        new THREE.Vector3(Infinity, 0, 0),
    ];
    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(hull.matrixWorld);
        if (v.x > tips[0].x) tips[0].copy(v);
        if (v.x < tips[1].x) tips[1].copy(v);
    }
    return tips;
}

/**
 * Lights that give it scale, as an aircraft carries them: steady red (port) and green (starboard)
 * at the wingtips beside the strobes, a red beacon on the spine, and a row of small running lights
 * along the trailing edge. Forward is +z, so port is +x.
 */
function placeLights(
    hull: THREE.Object3D,
    hb: THREE.Box3,
    lights: { nav: THREE.Sprite[]; beacon: THREE.Sprite; run: THREE.Sprite[] }
): void {
    const mid = hb.getCenter(new THREE.Vector3());
    const size = hb.getSize(new THREE.Vector3());
    const tips = wingtips(hull as THREE.Mesh);
    lights.nav.forEach((g, i) => g.position.copy(tips[i]).multiplyScalar(0.97));
    const spine = onTop(hull, hb.max.y, mid.x, mid.z);
    lights.beacon.position.copy(spine ?? new THREE.Vector3(mid.x, hb.max.y, mid.z));
    const n = lights.run.length / 2;
    lights.run.forEach((g, i) => {
        const side = i < n ? 1 : -1;
        const x = mid.x + side * size.x * (0.14 + 0.08 * (i % n));
        // Walk forward from the trailing edge until the ray finds paint.
        let p: THREE.Vector3 | null = null;
        for (let z = hb.min.z + size.z * 0.06; !p && z < mid.z; z += size.z * 0.07)
            p = onTop(hull, hb.max.y, x, z);
        if (p) g.position.copy(p);
        else g.visible = false;
    });
}

/**
 * The visitor: the Intergalactic Spaceship by Dennis Haupt (3DHaupt, free3d.com; personal,
 * non-commercial licence), with its own PBR maps, graded two-tone (warm titanium, slate paint,
 * dark seams) under a clear lacquer. Blue plasma from the engines, a pool of landing light on the
 * ground below it, brighter when it flies low, a plasma glow on re-entry, navigation lights,
 * strobes and a beacon, and the light of each place bounced onto its belly.
 */
export function addShip(scene: THREE.Scene, s: Shared, small: boolean, glow: Glow): Ship {
    const rig = new THREE.Group();
    const body = new THREE.Group();
    rig.add(body);
    scene.add(rig);
    if (small) rig.scale.setScalar(0.75);
    const uThrust = { value: 1 };
    const uBoost = { value: 0 };
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const uLive = { value: reduce ? 0 : 1 };

    // Plasma around the nose on re-entry; engine glow and its hot core; wingtip strobes. Placed
    // once the model is in.
    const nose = glow(1, new THREE.Color(1, 0.45, 0.15), 0);
    const engines = [glow(1, ENGINE_COOL.clone(), 0.55), glow(1, ENGINE_COOL.clone(), 0.55)];
    const cores = [glow(0.3, new THREE.Color(1.6, 1.7, 2)), glow(0.3, new THREE.Color(1.6, 1.7, 2))];
    const strobes = [glow(0.28, new THREE.Color(3, 3, 3)), glow(0.28, new THREE.Color(3, 3, 3))];
    const lights = {
        nav: [glow(0.16, new THREE.Color(2.2, 0.15, 0.1)), glow(0.16, new THREE.Color(0.1, 2, 0.6))],
        beacon: glow(0.2, new THREE.Color(2.4, 0.2, 0.1)),
        run: Array.from({ length: small ? 4 : 8 }, () => glow(0.07, new THREE.Color(1.2, 1.6, 2))),
    };
    [nose, ...engines, ...cores, ...strobes, ...lights.nav, lights.beacon, ...lights.run].forEach((g) =>
        body.add(g)
    );

    // A little light of its own so it reads against the dark; it leans to the colour of the place.
    const FILL = new THREE.Color('#ffe6c4');
    const fill = new THREE.PointLight(FILL, 1.4, 14, 2);
    scene.add(fill);

    const uOn = { value: 0 };
    const hullU: HullU = {
        uRim: { value: new THREE.Color(0, 0, 0) },
        uUnder: { value: new THREE.Color(0, 0, 0) },
        uThrust,
    };
    const uRim = hullU.uRim;

    new GLTFLoader()
        .setMeshoptDecoder(MeshoptDecoder)
        .loadAsync(small ? '/models/ship-1k.glb' : '/models/ship.glb')
        .then((gltf) => {
            const model = gltf.scene;
            const flames: THREE.Mesh[] = [];
            let hull: THREE.Mesh | null = null;
            model.traverse((o) => {
                const m = o as THREE.Mesh;
                if (!m.isMesh) return;
                const mat = m.material as THREE.MeshStandardMaterial;
                if (mat.name === 'Flame') flames.push(m);
                else hull = m;
            });
            if (!hull) return;
            const h = hull as THREE.Mesh;
            const hullBox = new THREE.Box3().setFromObject(h);
            const k = LEN / hullBox.getSize(new THREE.Vector3()).z;
            model.scale.setScalar(k);
            model.position.copy(hullBox.getCenter(new THREE.Vector3())).multiplyScalar(-k);
            h.material = gradeHull(h.material as THREE.MeshStandardMaterial, small, hullU);
            for (const f of flames) {
                const box = new THREE.Box3().setFromBufferAttribute(
                    f.geometry.attributes.position as THREE.BufferAttribute
                );
                f.material = shader(
                    s,
                    FLAME_VERT,
                    FLAME_FRAG,
                    { uThrust, uBoost, uLive, uSpan: { value: new THREE.Vector2(box.min.z, box.max.z) } },
                    ADD
                );
            }
            // Put the glows where the model's nozzles, nose and wingtips are. Measured before the
            // model joins the rig, so these boxes are in the ship's own space whichever way it faces.
            model.updateMatrixWorld(true);
            flames.forEach((f, i) => {
                const b = new THREE.Box3().setFromObject(f);
                const at = b.getCenter(new THREE.Vector3()).setZ(b.max.z);
                engines[i]?.position.copy(at);
                cores[i]?.position.copy(at).setZ(at.z - 0.04);
            });
            const hb = new THREE.Box3().setFromObject(h);
            const mid = hb.getCenter(new THREE.Vector3());
            nose.position.set(mid.x, mid.y, hb.max.z);
            placeLights(h, hb, lights);
            strobes.forEach((g, i) => g.position.copy(lights.nav[1 - i].position));
            body.add(model);
        })
        .catch(() => undefined);

    const look = new THREE.Vector3();
    const prev = new THREE.Vector3(0, 0, -1);
    const tint = new THREE.Color();
    let turn = 0;
    let bank = 0;
    let spin = ROLL.wind + ROLL.len;
    let kick = 0;
    let glint = -1;
    /** Engine thrust: idle hum, cruise, speed, steering, boost, the afterburner kick. */
    const thrust = (f: ShipIn, now: number): number =>
        0.7 +
        f.speed * 0.9 +
        Math.hypot(f.lean, f.pitch) * 0.1 +
        f.boost * 0.8 -
        f.idle * 0.15 +
        kick +
        jitter(now) * 0.04;

    /** Engine glows: swell with thrust and the glint, whiten as the burn gets hot. */
    const burn = (f: ShipIn): void => {
        if (glint >= 0) glint = glint + f.dt / GLINT.len;
        // Hard thrust flares the engines a little (a glow round the nozzles, not a bubble round the
        // ship); the leaving glint swells them so a ship burning away reads as a point from afar.
        const swell = (1 + f.speed * f.speed * 0.6) * (1 + GLINT.gain * glintAt(glint));
        const hot = clamp((uThrust.value - 0.6) / 1.8);
        engines.forEach((e) => {
            e.scale.setScalar((0.4 + uThrust.value * 0.12) * swell);
            e.material.color.lerpColors(ENGINE_COOL, ENGINE_HOT, hot);
        });
        cores.forEach((c) => {
            c.scale.setScalar((0.22 + uThrust.value * 0.12) * Math.sqrt(swell));
            c.material.opacity = 0.35 + hot * 0.65;
        });
        uBoost.value = Math.max(f.boost, clamp(kick));
    };

    /**
     * The place's light on the hull: the rim as it is, the same colour bounced onto the belly
     * (strongest where the light is red from below: lava, a red portal), the fill leaning to it.
     */
    const placeLight = (f: ShipIn): void => {
        uRim.value.lerp(f.rim, 1 - Math.exp(-f.dt * 4));
        const r = uRim.value;
        const red = smooth(1.6, 4, r.r / (Math.max(r.g, r.b) + 0.01));
        hullU.uUnder.value.copy(r).multiplyScalar(1.4 + red * 2.2);
        const lum = Math.max(r.r, r.g, r.b);
        tint.copy(r).multiplyScalar(lum > 0.01 ? 1 / lum : 0);
        fill.color.copy(FILL).lerp(lum > 0.01 ? tint : FILL, 0.3);
    };

    /** Strobes, nav lights and the beacon; with reduced motion the beacon holds steady. */
    const blink = (now: number): void => {
        strobes.forEach((g, i) => (g.material.opacity = (now + i * 0.7) % 1.4 < 0.07 ? 1 : 0));
        lights.beacon.material.opacity = reduce ? 0.6 : Math.pow(Math.max(0, Math.sin(now * 5.2)), 6);
    };

    /** The search beam's pool below it, and the engines' wash adding to it when it flies low. */
    const pool = (f: ShipIn): void => {
        uOn.value += (f.beam - uOn.value) * (1 - Math.exp(-f.dt * 3));
        const h = rig.position.y - 0.6 - f.ground;
        const wash = (1 - smooth(1.5, 9, h)) * 0.22 * uThrust.value;
        if (f.beam > 0.01 && h > 0.5)
            s.uBeam.value.set(
                rig.position.x,
                f.ground,
                rig.position.z,
                uOn.value * (smooth(0.5, 3, h) * 0.6 + wash)
            );
        else s.uBeam.value.w = 0;
    };

    const update = (f: ShipIn): void => {
        const now = performance.now() / 1000;
        rig.position.copy(f.at);
        rig.position.y += Math.sin(now * 1.4) * (0.08 + f.idle * 0.1);
        rig.lookAt(look.copy(rig.position).add(f.heading));
        turn += ((f.hero ? Math.PI : 0) - turn) * (1 - Math.exp(-f.dt * 2.5));
        rig.rotateY(turn);
        // Bank into turns; a full barrel roll through each project ring.
        const yaw = prev.x * f.heading.z - prev.z * f.heading.x;
        prev.copy(f.heading);
        // Steered, it banks into the move (positive roll drops the right wing; turned round to face
        // you, that flips) and lifts its nose into a climb.
        const lean = clamp(-yaw * 40, -0.6, 0.6) + clamp(f.lean * 0.12, -0.5, 0.5) * Math.cos(turn);
        bank += (lean - bank) * (1 - Math.exp(-f.dt * 3));
        spin = Math.min(ROLL.wind + ROLL.len, spin + f.dt);
        const roll = bank + barrel(spin);
        body.rotation.set(
            -Math.min(0.2, f.speed * 0.25) - f.pitch * 0.05,
            0,
            roll + Math.sin(now * 0.9) * 0.04
        );
        kick = Math.max(0, kick - f.dt * 1.5);
        uThrust.value = thrust(f, now);
        burn(f);
        placeLight(f);
        nose.material.opacity = f.heat;
        nose.scale.setScalar(2 + f.heat * 5 + (jitter(now + 3.1) + 1) * 0.2);
        blink(now);
        fill.position.copy(rig.position).add(look.set(0, 2.2, 0));
        fill.intensity = 1.4 + f.key * 9;
        pool(f);
    };
    return {
        update,
        roll: () => {
            spin = 0;
        },
        boost: () => {
            kick = 1.2;
        },
        glint: () => {
            glint = 0;
        },
    };
}
