import * as THREE from 'three';

import { clamp, lerp, smooth } from '@/components/round-trip/math';
import { ADD, MOON, type Shared, shader } from '@/components/round-trip/world/gl';
import type { Glow } from '@/components/round-trip/world/glow';
import type { Route } from '@/components/round-trip/world/route';

const R = 1000;
/** Bengaluru on the globe (13°N, 77.6°E): the ship comes down on the owner's city. */
const HOME = (() => {
    const lat = THREE.MathUtils.degToRad(13);
    const phi = THREE.MathUtils.degToRad(77.6 + 180);
    return new THREE.Vector3(-Math.cos(phi) * Math.cos(lat), Math.sin(lat), Math.sin(phi) * Math.cos(lat));
})();
/** Where the sun is about to rise: a gold rim along the left of the globe. */
const SUN = new THREE.Vector3(-0.9, 0.25, -0.35).normalize();

/**
 * Earth at night: city lights burning warm, land and sea faintly moonlit, real cloud drifting over
 * the lights. At the end the sun lights a thin crescent along the rim and glints off the oceans.
 */
const EARTH_FRAG = /* glsl */ `
    uniform sampler2D tLights, tClouds, tDay; uniform float uOp, uDay, uNear; uniform vec3 uMoon, uSun;
    varying vec2 vUv; varying vec3 vN, vW;
    void main() {
        vec3 n = normalize(vN), V = normalize(cameraPosition - vW);
        vec3 day = texture2D(tDay, vUv).rgb;
        float lights = texture2D(tLights, vUv).r;
        // Low down, the map's blocks are broken up into clusters of street grids and dark gaps.
        // (The map's texels are ~10 km: finer than a texel, so each one breaks into streets.)
        lights *= mix(1.0, (0.15 + 1.4 * fbm(vUv * 9000.0)) * (0.25 + 0.75 * vnoise(vUv * 22000.0)), uNear);
        // Low down the cloud map's texels would show as soft squares: fine noise breaks them up.
        float cloud = smoothstep(0.12, 0.85, texture2D(tClouds, vUv + vec2(uTime * 0.0004, 0.0)).r
            + (fbm(vUv * 1600.0 + uTime * 0.02) - 0.5) * 0.7 * uNear);
        float moon = max(dot(n, uMoon), 0.0);
        // Moonlit land and sea in blue-grey, as the night side looks from orbit, cities burning on it.
        // City lights: brilliant from high orbit, held back on the way down so they do not bloom.
        vec3 col = day * vec3(0.3, 0.38, 0.55) * (0.2 + 0.8 * moon) + vec3(1.0, 0.7, 0.36) * pow(lights, 0.85) * mix(10.0, 1.2, uNear) * (1.0 - cloud * 0.75);
        col = mix(col, vec3(0.2, 0.23, 0.29) * (0.3 + 0.9 * moon), cloud * 0.8);
        float sunLit = smoothstep(-0.04, 0.3, dot(n, uSun)) * uDay;
        float ocean = smoothstep(0.04, 0.18, day.b - max(day.r, day.g));
        vec3 H = normalize(uSun + V);
        vec3 lit = mix(day, vec3(1.0), cloud) * 1.5 + vec3(1.0, 0.82, 0.55) * pow(max(dot(n, H), 0.0), 140.0) * ocean * 5.0 * (1.0 - cloud);
        col = mix(col, lit, sunLit);
        float edge = 1.0 - max(dot(n, V), 0.0);
        col = mix(col, vec3(0.03, 0.07, 0.18), pow(edge, 3.0) * 0.8);
        gl_FragColor = vec4(col, uOp);
    }
`;

/**
 * The air seen edge on: for each pixel, how close its line of sight passes to the globe. Blue
 * haze just above the surface, and gold where the sun is about to come up behind the curve.
 */
const AIR_FRAG = /* glsl */ `
    uniform vec3 uCenter, uSun; uniform float uR, uOp, uRise;
    varying vec3 vW;
    void main() {
        vec3 Vd = normalize(vW - cameraPosition);
        vec3 toC = uCenter - cameraPosition;
        float t = dot(toC, Vd);
        vec3 near = cameraPosition + Vd * t - uCenter;
        float h = (length(near) - uR) / uR;
        float above = exp(-max(h, 0.0) / 0.011) * step(0.0, h);
        float onTop = exp(min(h, 0.0) / 0.025) * (1.0 - step(0.0, h)) * 0.45;
        float sun = pow(max(dot(normalize(near), uSun), 0.0), 3.0);
        vec3 blue = vec3(0.12, 0.32, 0.95);
        vec3 gold = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.82, 0.5), exp(-max(h, 0.0) / 0.004));
        vec3 col = blue * (above + onTop) * 0.9 + gold * sun * (above * 3.2 + onTop * 0.8) * uRise;
        gl_FragColor = vec4(col * uOp, 1.0);
    }
`;

/** Re-entry: streaks of plasma racing past, hottest in the middle of the descent. */
const STREAK_FRAG = /* glsl */ `
    uniform float uHeat; varying vec3 vL; varying float vR, vD;
    void main() {
        float along = fract(vL.z * 0.5 + 0.5 - uTime * (1.2 + vR));
        vec3 c = mix(vec3(1.0, 0.38, 0.1), vec3(1.0, 0.85, 0.6), smoothstep(0.6, 1.0, vR));
        float a = pow(along, 6.0) * (0.6 + vR);
        gl_FragColor = vec4(c * a * uHeat * 1.4, 1.0);
    }
`;

export type SpaceIn = {
    on: boolean;
    /** 0–1 from high orbit down to the jump into the atmosphere. */
    e: number;
    eye: THREE.Vector3;
    /** Portrait screens, where the text sits low, so the globe rises higher behind the ship. */
    tall: boolean;
    /** Back in orbit at the end, as the sun comes up over the rim. */
    finale: boolean;
    /** 0–1 in the finale: just clear of the air, then climbing away until Earth is a globe again. */
    rise: number;
};
/** `sun`: where the sun is rising at the end (null otherwise), to light the ship from; `dawn` 0–1. */
export type Space = {
    update: (f: SpaceIn) => { heat: number; sun: THREE.Vector3 | null; dawn: number };
};

function addStreaks(scene: THREE.Scene, route: Route, s: Shared, n: number, rand: () => number) {
    const uHeat = { value: 0 };
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const r = new Float32Array(n);
    const mesh = new THREE.InstancedMesh(
        geo,
        shader(
            s,
            /* glsl */ `attribute float aRand; varying vec3 vL; varying float vR, vD;
            void main() { vL = position; vR = aRand; vec4 mv = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
            STREAK_FRAG,
            { uHeat },
            ADD
        ),
        n
    );
    const Z = new THREE.Vector3(0, 0, 1);
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const size = new THREE.Vector3();
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
        const u = lerp(0.45, 1.02, rand()) * route.seg[2];
        const { t, n1, n2 } = route.frame(u);
        const a = rand() * Math.PI * 2;
        // A sheath around the ship, clear of the eye: none closer than 5 m to the path.
        const rad = 5 + Math.pow(rand(), 1.5) * 22;
        pos.copy(route.curve.getPointAt(u))
            .addScaledVector(n1, Math.cos(a) * rad)
            .addScaledVector(n2, Math.sin(a) * rad);
        q.setFromUnitVectors(Z, t);
        const w = 0.02 + rand() * 0.06;
        mesh.setMatrixAt(i, m.compose(pos, q, size.set(w, w, 10 + rand() * 40)));
        r[i] = rand();
    }
    geo.setAttribute('aRand', new THREE.InstancedBufferAttribute(r, 1));
    mesh.frustumCulled = false;
    scene.add(mesh);
    return uHeat;
}

/**
 * Hero and wire: the ship arrives from orbit. Earth at night fills the lower sky and rises to meet
 * it, the air turns to plasma, and the ship drops through the cloud deck onto the city.
 */
export function addSpace(
    scene: THREE.Scene,
    route: Route,
    s: Shared,
    density: number,
    small: boolean,
    glow: Glow,
    rand: () => number
): Space {
    // Earth textures (night lights, clouds, day) supplied by the owner as a free Earth model.
    const load = (name: string, colour: boolean): THREE.Texture => {
        const t = new THREE.TextureLoader().load(`/env/${name}-${small ? 'lo' : 'hi'}.jpg`);
        if (colour) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
    };
    const tLights = load('earth-lights', false);
    const tClouds = load('earth-clouds', false);
    const tDay = load('earth-day', true);
    const uOp = { value: 1 };
    const uSun = { value: SUN.clone() };
    const uRise = { value: 1 };
    const uDay = { value: 0 };
    const uNear = { value: 0 };
    const globe = new THREE.Group();
    const earth = new THREE.Mesh(
        new THREE.SphereGeometry(R, 128, 64),
        shader(
            s,
            /* glsl */ `varying vec2 vUv; varying vec3 vN, vW;
            void main() { vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
            EARTH_FRAG,
            {
                tLights: { value: tLights },
                tClouds: { value: tClouds },
                tDay: { value: tDay },
                uOp,
                uDay,
                uNear,
                uSun,
                uMoon: { value: MOON },
            },
            { transparent: true, depthWrite: false }
        )
    );
    const uCenter = { value: new THREE.Vector3() };
    const air = new THREE.Mesh(
        new THREE.SphereGeometry(R * 1.06, 96, 48),
        shader(
            s,
            /* glsl */ `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
            AIR_FRAG,
            { uCenter, uSun, uR: { value: R }, uOp, uRise },
            { ...ADD, side: THREE.BackSide }
        )
    );
    earth.renderOrder = -1;
    air.renderOrder = -0.9;
    globe.add(earth, air);
    scene.add(globe);
    globe.traverse((o) => (o.frustumCulled = false));

    const uHeat = addStreaks(scene, route, s, Math.round(200 * density), rand);
    // The sun about to clear the rim at the end: a hot white core, a wide gold glare.
    const SUN_SIZE = [34, 140];
    const sun = [glow(34, new THREE.Color(8, 7, 6)), glow(140, new THREE.Color(3, 2, 1.1), 0.5)];
    const sunAt = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const up = new THREE.Vector3();
    const toEye = new THREE.Vector3();
    const rim = new THREE.Vector3();
    const X = new THREE.Vector3(1, 0, 0);
    const update = (f: SpaceIn): { heat: number; sun: THREE.Vector3 | null; dawn: number } => {
        globe.visible = f.on;
        // The sunrise: the limb goes gold, then the disc breaks the curve, as the ship climbs away.
        const dawn = f.finale ? smooth(0.04, 0.72, f.rise) : 0;
        sun.forEach((g, i) => {
            g.visible = f.on && dawn > 0.01;
            g.scale.setScalar(SUN_SIZE[i] * (0.15 + 0.85 * dawn));
        });
        uHeat.value = 0;
        if (!f.on) return { heat: 0, sun: null, dawn: 0 };
        // Higher up the globe sits ahead and below; diving in, it fills the floor of the view.
        const k = f.finale ? lerp(1, 0.1, f.rise) : clamp(f.e);
        uNear.value = smooth(0.5, 1, k);
        const alt = R * (f.tall ? 0.25 : 0.42) * Math.pow(f.tall ? 0.12 : 0.08, k);
        const pitch = THREE.MathUtils.degToRad(lerp(f.tall ? 44 : 52, f.tall ? 70 : 76, k));
        dir.set(0, -Math.sin(pitch), -Math.cos(pitch));
        globe.position.copy(f.eye).addScaledVector(dir, R + alt);
        uCenter.value.copy(globe.position);
        // Turn the globe so home is right under the ship, drifting into place as it comes down.
        up.copy(dir)
            .negate()
            .applyAxisAngle(X, (1 - k) * 0.5);
        earth.quaternion.setFromUnitVectors(HOME, up);
        // Where the rim tops out from here: the sun rises just behind it at the end.
        toEye.copy(f.eye).sub(globe.position).normalize();
        // On wide screens it comes up to the right, clear of the text.
        rim.set(0, 1, 0)
            .addScaledVector(toEye, -toEye.y)
            .normalize()
            .applyAxisAngle(toEye, f.tall ? 0 : -0.32);
        if (f.finale) uSun.value.copy(rim).multiplyScalar(0.9).addScaledVector(toEye, -0.45).normalize();
        else uSun.value.copy(SUN);
        uRise.value = 1 + 1.6 * smooth(0, 0.6, dawn);
        uDay.value = dawn;
        sunAt
            .copy(globe.position)
            .addScaledVector(rim, R * lerp(0.984, 1.003, dawn))
            .addScaledVector(toEye, -R * 0.02);
        for (const g of sun) g.position.copy(sunAt);
        const heat = f.finale ? 0 : smooth(0.55, 0.95, f.e);
        uHeat.value = heat;
        return { heat, sun: f.finale ? sunAt : null, dawn };
    };
    return { update };
}
