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

/** A fresnel rim on the hull: edges seen side-on pick up `uRim` as light of their own. */
function addRim(mat: THREE.MeshStandardMaterial, uRim: { value: THREE.Color }): void {
    mat.onBeforeCompile = (sh) => {
        sh.uniforms.uRim = uRim;
        sh.fragmentShader = sh.fragmentShader
            .replace('void main() {', 'uniform vec3 uRim;\nvoid main() {')
            .replace(
                '#include <emissivemap_fragment>',
                `#include <emissivemap_fragment>
                // Wider falloff than pow4 so graphite panels keep a readable edge against night.
                float rim = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);
                totalEmissiveRadiance += uRim * rim * 1.15;`
            );
    };
    mat.needsUpdate = true;
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

/** Engine plasma: white-hot at the nozzle, blue along the plume, flickering. */
const FLAME_FRAG = /* glsl */ `
    uniform float uThrust; uniform vec2 uSpan; varying vec3 vL, vN, vV;
    void main() {
        float k = clamp((vL.z - uSpan.x) / (uSpan.y - uSpan.x), 0.0, 1.0);
        // Faces seen edge-on fade out, so the jagged plume reads as a soft glow.
        float face = pow(abs(dot(normalize(vN), normalize(vV))), 2.0);
        float flick = 0.85 + 0.15 * sin(uTime * 61.0 + vL.z * 9.0);
        vec3 c = mix(vec3(0.15, 0.55, 1.0), vec3(0.85, 0.95, 1.0), pow(k, 3.0));
        gl_FragColor = vec4(c * pow(k, 1.6) * uThrust * flick * face * 1.1, 1.0);
    }
`;

/**
 * The visitor: the Intergalactic Spaceship by Dennis Haupt (3DHaupt, free3d.com; personal,
 * non-commercial licence), with its own PBR maps, graded to graphite with warm-lit panels. Blue
 * plasma from the engines, a pool of landing light on the ground below it (no visible cone: the
 * model carries its own lights), a plasma glow on re-entry, strobes on the wingtips.
 */
export function addShip(scene: THREE.Scene, s: Shared, small: boolean, glow: Glow): Ship {
    const rig = new THREE.Group();
    const body = new THREE.Group();
    rig.add(body);
    scene.add(rig);
    if (small) rig.scale.setScalar(0.75);
    const uThrust = { value: 1 };

    // Plasma around the nose on re-entry; engine glow; wingtip strobes. Placed once the model is in.
    const nose = glow(1, new THREE.Color(1, 0.45, 0.15), 0);
    const engines = [
        glow(1, new THREE.Color(0.35, 0.65, 1.4), 0.55),
        glow(1, new THREE.Color(0.35, 0.65, 1.4), 0.55),
    ];
    const strobes = [glow(0.28, new THREE.Color(3, 3, 3)), glow(0.28, new THREE.Color(3, 3, 3))];
    [nose, ...engines, ...strobes].forEach((g) => body.add(g));

    // Cool moonlight bounce + a short warm key ahead of the nose so panel breaks read at night.
    const fill = new THREE.PointLight('#c8d6ff', 0.95, 16, 2);
    const key = new THREE.PointLight('#ffe2b8', 0.85, 9, 2);
    scene.add(fill, key);

    const uOn = { value: 0 };
    const uRim = { value: new THREE.Color(0, 0, 0) };

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
            const hullBox = new THREE.Box3().setFromObject(hull);
            const k = LEN / hullBox.getSize(new THREE.Vector3()).z;
            model.scale.setScalar(k);
            model.position.copy(hullBox.getCenter(new THREE.Vector3())).multiplyScalar(-k);
            // Graphite hull: darker base so normals and night HDRI speculars read; warm panels held
            // back so emission does not flatten the free3d PBR maps.
            const mat = (hull as THREE.Mesh).material as THREE.MeshStandardMaterial;
            mat.envMapIntensity = 1.35;
            mat.color.setRGB(0.34, 0.35, 0.38);
            mat.metalness = 1;
            mat.roughness = Math.min(mat.roughness, 0.38);
            mat.emissive.setRGB(1, 0.78, 0.48);
            mat.emissiveIntensity = 0.85;
            if (mat.aoMap) mat.aoMapIntensity = 1.2;
            addRim(mat, uRim);
            for (const f of flames) {
                const box = new THREE.Box3().setFromBufferAttribute(
                    f.geometry.attributes.position as THREE.BufferAttribute
                );
                f.material = shader(
                    s,
                    /* glsl */ `varying vec3 vL, vN, vV; void main() { vL = position; vN = normalMatrix * normal; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
                    FLAME_FRAG,
                    { uThrust, uSpan: { value: new THREE.Vector2(box.min.z, box.max.z) } },
                    ADD
                );
            }
            // Put the glows where the model's nozzles, nose and wingtips are. Measured before the
            // model joins the rig, so these boxes are in the ship's own space whichever way it faces.
            model.updateMatrixWorld(true);
            flames.forEach((f, i) => {
                const b = new THREE.Box3().setFromObject(f);
                if (engines[i]) engines[i].position.copy(b.getCenter(new THREE.Vector3()).setZ(b.max.z));
            });
            const hb = new THREE.Box3().setFromObject(hull);
            const mid = hb.getCenter(new THREE.Vector3());
            nose.position.set(mid.x, mid.y, hb.max.z);
            strobes.forEach((g, i) => g.position.set(i ? hb.max.x : hb.min.x, mid.y, mid.z));
            body.add(model);
        })
        .catch(() => undefined);

    const look = new THREE.Vector3();
    const prev = new THREE.Vector3(0, 0, -1);
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
        // Time-based flicker (not Math.random): a soft beat that stays coherent under bloom.
        Math.sin(now * 37.1) * 0.035 +
        Math.sin(now * 61.3 + 1.7) * 0.025;
    const update = (f: ShipIn): void => {
        const now = performance.now() / 1000;
        rig.position.copy(f.at);
        // Idle hover reads at chase distance; cruise keeps a quieter bob.
        rig.position.y += Math.sin(now * 1.55) * (0.11 + f.idle * 0.18);
        rig.lookAt(look.copy(rig.position).add(f.heading));
        turn += ((f.hero ? Math.PI : 0) - turn) * (1 - Math.exp(-f.dt * 2.5));
        rig.rotateY(turn);
        // Bank into turns; a full barrel roll through each project ring.
        const yaw = prev.x * f.heading.z - prev.z * f.heading.x;
        prev.copy(f.heading);
        // Steered, it banks into the move (positive roll drops the right wing; turned round to face
        // you, that flips) and lifts its nose into a climb.
        const lean = clamp(-yaw * 48, -0.72, 0.72) + clamp(f.lean * 0.14, -0.55, 0.55) * Math.cos(turn);
        bank += (lean - bank) * (1 - Math.exp(-f.dt * 3.4));
        spin = Math.min(ROLL.wind + ROLL.len, spin + f.dt);
        const roll = bank + barrel(spin);
        body.rotation.set(
            -Math.min(0.22, f.speed * 0.28) - f.pitch * 0.055,
            0,
            roll + Math.sin(now * 0.95) * (0.05 + f.idle * 0.03)
        );
        kick = Math.max(0, kick - f.dt * 1.5);
        uThrust.value = thrust(f, now);
        if (glint >= 0) glint = glint + f.dt / GLINT.len;
        // Hard thrust flares the engines, so a ship burning away reads as a bright point from afar.
        // Cap the speed swell so bloom does not mush the hull on boost; pulse with thrust.
        const pulse = 1 + Math.max(0, uThrust.value - 0.85) * 0.22 * (0.55 + 0.45 * Math.sin(now * 18.0));
        const swell = (1 + f.speed * f.speed * 0.6) * (1 + GLINT.gain * glintAt(glint)) * pulse;
        engines.forEach((e) => e.scale.setScalar((0.52 + uThrust.value * 0.5) * swell));
        uRim.value.lerp(f.rim, 1 - Math.exp(-f.dt * 4));
        nose.material.opacity = f.heat;
        nose.scale.setScalar(2 + f.heat * 5 + Math.sin(now * 29.0) * 0.12);
        strobes.forEach((g, i) => (g.material.opacity = (now + i * 0.7) % 1.4 < 0.07 ? 1 : 0));
        // Bounce from above-left; warm key sits ahead of the nose so the facing hull keeps shape.
        fill.position.copy(rig.position).add(look.set(-1.1, 2.4, 0.4));
        fill.intensity = 0.9 + f.key * 7;
        key.position.copy(rig.position).addScaledVector(f.heading, 2.4).y += 1.1;
        key.intensity = 0.75 + f.heat * 0.35 + f.key * 5;
        uOn.value += (f.beam - uOn.value) * (1 - Math.exp(-f.dt * 3));
        const h = rig.position.y - 0.6 - f.ground;
        if (f.beam > 0.01 && h > 0.5)
            s.uBeam.value.set(rig.position.x, f.ground, rig.position.z, uOn.value * smooth(0.5, 3, h) * 0.6);
        else s.uBeam.value.w = 0;
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
