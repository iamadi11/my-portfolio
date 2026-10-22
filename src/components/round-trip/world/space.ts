import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { clamp, lerp, smooth } from '@/components/round-trip/math';
import { ADD, MOON, type Shared, shader } from '@/components/round-trip/world/gl';
import type { Glow } from '@/components/round-trip/world/glow';
import type { Route } from '@/components/round-trip/world/route';

const R = 1000;
/**
 * La Paz on the globe (16.5°S, 68.15°W): the ship dives into the city chapter's amphitheater.
 * The owner's home city in the HTML remains Bengaluru (`SITE.basics.location`).
 */
const HOME = (() => {
    const lat = THREE.MathUtils.degToRad(-16.5);
    const phi = THREE.MathUtils.degToRad(-68.15 + 180);
    return new THREE.Vector3(-Math.cos(phi) * Math.cos(lat), Math.sin(lat), Math.sin(phi) * Math.cos(lat));
})();
/** Where the sun is about to rise: a gold rim along the left of the globe. */
const SUN = new THREE.Vector3(-0.9, 0.25, -0.35).normalize();
/** Where along the limb the sun comes up at the end (radians round from straight ahead; - is right). */
const SUN_AT = { wide: -0.72, tall: -0.5 };

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
        // From high orbit a steep response: a metro burns, a small town is a faint speck, and the
        // edges of a lit texel fall away instead of clipping. With a flat, high gain every lit texel
        // saturated to its full bilinear footprint, so the three texels of the Seychelles (Victoria,
        // Mahe; alone in the dark Indian Ocean at lower left in the hero and the finale) read as a
        // hard glowing block. The big metros get a soft halo of light pollution from a blurred copy.
        float raw = texture2D(tLights, vUv).r;
        float halo = texture2D(tLights, vUv, 2.5).r;
        float high = pow(raw, 1.6) * 7.0 + pow(halo, 1.3) * 2.0;
        // Low down, the map's blocks are broken up into clusters of street grids and dark gaps.
        // (The map's texels are ~10 km: finer than a texel, so each one breaks into streets.)
        float streets = (0.15 + 1.4 * fbm(vUv * 9000.0)) * (0.25 + 0.75 * vnoise(vUv * 22000.0));
        float lights = mix(high * (0.4 + fbm(vUv * 1400.0)), pow(raw * streets, 0.85) * 1.2, uNear);
        // Low down the cloud map's texels would show as soft squares: fine noise breaks them up.
        float cloud = smoothstep(0.12, 0.85, texture2D(tClouds, vUv + vec2(uTime * 0.0004, 0.0)).r
            + (fbm(vUv * 1600.0 + uTime * 0.02) - 0.5) * 0.7 * uNear);
        float moon = max(dot(n, uMoon), 0.0);
        // Moonlit land and sea in blue-grey, as the night side looks from orbit, cities burning on it.
        // City lights: brilliant from high orbit, held back on the way down so they do not bloom.
        vec3 col = day * vec3(0.3, 0.38, 0.55) * (0.2 + 0.8 * moon) + vec3(1.0, 0.7, 0.36) * lights * (1.0 - cloud * 0.75);
        col = mix(col, vec3(0.2, 0.23, 0.29) * (0.3 + 0.9 * moon), cloud * 0.8);
        float sunLit = smoothstep(-0.04, 0.3, dot(n, uSun)) * uDay;
        float ocean = smoothstep(0.04, 0.18, day.b - max(day.r, day.g));
        vec3 H = normalize(uSun + V);
        vec3 lit = mix(day, vec3(1.0), cloud) * 1.5 + vec3(1.0, 0.82, 0.55) * pow(max(dot(n, H), 0.0), 140.0) * ocean * 5.0 * (1.0 - cloud);
        col = mix(col, lit, sunLit);
        // The terminator: a warm line where the light first touches the ground and cloud tops.
        float term = exp(-pow((dot(n, uSun) - 0.02) / 0.07, 2.0)) * uDay;
        col += vec3(1.0, 0.42, 0.12) * term * (0.12 + 0.5 * cloud);
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
    uniform vec3 uCenter, uSun, uRim; uniform float uR, uOp, uRise, uDay;
    varying vec3 vW;
    void main() {
        vec3 Vd = normalize(vW - cameraPosition);
        vec3 toC = uCenter - cameraPosition;
        float t = dot(toC, Vd);
        vec3 near = cameraPosition + Vd * t - uCenter;
        float h = (length(near) - uR) / uR;
        float above = exp(-max(h, 0.0) / 0.011) * step(0.0, h);
        float onTop = exp(min(h, 0.0) / 0.025) * (1.0 - step(0.0, h)) * 0.45;
        // How far round the limb from where the sun comes up (1 there, 0 a quarter of the way round).
        vec3 nd = normalize(near), te = normalize(cameraPosition - uCenter);
        float around = dot(normalize(nd - te * dot(nd, te) + 1e-5), uRim);
        // Gold where the sun is: on the way in, round the limb towards it; at sunrise, gathered close
        // round the point where the disc comes up.
        float sun = mix(pow(max(dot(nd, uSun), 0.0), 3.0), pow(max(around, 0.0), 30.0) * 0.45, smoothstep(0.0, 0.1, uDay));
        vec3 blue = vec3(0.12, 0.32, 0.95);
        vec3 gold = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.82, 0.5), exp(-max(h, 0.0) / 0.004));
        // Sunrise seen edge on: where the sunlight grazes the air along the sunlit limb, a thin band
        // hugging the curve, deep orange at the surface going to gold above, running far from the
        // sun. It takes the place of the blue there (added on top, the tone curve turns it white),
        // and shows early, before the disc is up.
        float graze = smoothstep(-0.1, 0.95, around);
        float warmth = exp(-abs(h - 0.0015) / 0.0035) * graze * graze * smoothstep(0.0, 0.3, uDay);
        vec3 warm = mix(vec3(0.9, 0.22, 0.03), vec3(1.0, 0.62, 0.2), smoothstep(-0.001, 0.007, h));
        vec3 col = blue * (above + onTop) * 0.9 * (1.0 - 0.85 * warmth) + gold * sun * (above * 3.2 + onTop * 0.8) * uRise;
        col += warm * warmth * 0.9;
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

/**
 * The International Space Station (NASA 3D Resources, ISS model B), seen against the dawn: arrays
 * dark gold and blue-black, the truss and modules light metal, lit by the rising sun from behind so
 * it reads as a silhouette with a bright rim, and faint earthlight on the side facing us.
 */
const ISS_FRAG = /* glsl */ `
    uniform vec3 uSun, uAlbedo; uniform float uDawn, uSpec, uGloss;
    varying vec3 vN, vW;
    void main() {
        vec3 V = normalize(cameraPosition - vW);
        vec3 n = normalize(vN);
        n = faceforward(n, -V, n);
        vec3 sunCol = vec3(1.0, 0.78, 0.5) * uDawn;
        float lit = max(dot(n, uSun), 0.0);
        float spec = pow(max(dot(reflect(-uSun, n), V), 0.0), uGloss) * uSpec;
        float rim = pow(1.0 - abs(dot(n, V)), 3.0) * pow(max(dot(-V, uSun), 0.0), 2.0);
        vec3 earth = vec3(0.04, 0.06, 0.11) * (0.5 + 0.5 * n.y);
        // Edges also catch the warm band of the dawn air behind and below it, so the shape reads.
        float edge = pow(1.0 - abs(dot(n, V)), 2.0);
        vec3 col = uAlbedo * (sunCol * lit * 1.2 + earth) + sunCol * (spec + rim * 4.0) + vec3(1.0, 0.55, 0.25) * edge * 0.35 * uDawn;
        gl_FragColor = vec4(col, 1.0);
    }
`;

type Iss = { group: THREE.Group; uDawn: THREE.IUniform<number>; uSun: THREE.IUniform<THREE.Vector3> };

/** Fetched once it is wanted; the strays above the station in the source model are left out. */
function loadIss(scene: THREE.Scene, s: Shared, iss: Iss): void {
    const vert = /* glsl */ `varying vec3 vN, vW;
        void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
    const mat = (albedo: THREE.Color, spec: number, gloss: number): THREE.ShaderMaterial =>
        shader(
            s,
            vert,
            ISS_FRAG,
            {
                uSun: iss.uSun,
                uDawn: iss.uDawn,
                uAlbedo: { value: albedo },
                uSpec: { value: spec },
                uGloss: { value: gloss },
            },
            { side: THREE.DoubleSide }
        );
    const arrays = mat(new THREE.Color(0.09, 0.065, 0.035), 1.4, 60);
    const metal = mat(new THREE.Color(0.62, 0.62, 0.6), 0.5, 24);
    new GLTFLoader()
        .setMeshoptDecoder(MeshoptDecoder)
        .loadAsync('/models/iss.glb')
        .then((gltf) => {
            const model = gltf.scene;
            model.updateMatrixWorld(true);
            const drop: THREE.Object3D[] = [];
            const size = new THREE.Vector3();
            model.traverse((o) => {
                const mesh = o as THREE.Mesh;
                if (!mesh.isMesh) return;
                if (!mesh.name.startsWith('polySurfa')) {
                    drop.push(mesh);
                    return;
                }
                new THREE.Box3().setFromObject(mesh).getSize(size);
                // The solar arrays are the one sheet flat in x; everything else is metal.
                mesh.material = size.x / Math.max(size.y, size.z) < 0.02 ? arrays : metal;
                mesh.frustumCulled = false;
            });
            drop.forEach((o) => o.removeFromParent());
            const box = new THREE.Box3().setFromObject(model);
            model.position.copy(box.getCenter(size)).negate();
            const inner = new THREE.Group();
            inner.add(model);
            inner.scale.setScalar(1 / Math.max(...box.getSize(size).toArray()));
            iss.group.add(inner);
            scene.add(iss.group);
        })
        .catch(() => undefined);
}

const tmp = Array.from({ length: 7 }, () => new THREE.Vector3());

/**
 * The point of the visible limb (of a sphere of radius `r` around `centre`) in the direction `dir`
 * (at right angles to the eye): where a line of sight from the eye grazes that sphere.
 */
function limbPoint(
    out: THREE.Vector3,
    eye: THREE.Vector3,
    centre: THREE.Vector3,
    dir: THREE.Vector3,
    r: number
) {
    const toEye = out.copy(eye).sub(centre);
    const c = Math.min(r / toEye.length(), 0.9999);
    return toEye
        .normalize()
        .multiplyScalar(c)
        .addScaledVector(dir, Math.sqrt(1 - c * c))
        .multiplyScalar(r)
        .add(centre);
}
const basis = new THREE.Matrix4();

/**
 * Where the station is at sunrise: low over the limb some way along from the sun, drifting towards
 * it as the ship climbs, truss along the curve and arrays turned to the sun; small in frame.
 */
function placeIss(
    iss: Iss,
    eye: THREE.Vector3,
    centre: THREE.Vector3,
    rim: THREE.Vector3,
    rise: number,
    tall: boolean
): void {
    const toEye = tmp[0].copy(eye).sub(centre).normalize();
    // On wide screens it crosses the dawn from the panel's side, in front of the sun and on beyond
    // it, clear of the pills at the panel's foot. On tall ones the ship sits in the middle: it
    // stays beyond the sun.
    const k = smooth(0.05, 0.95, rise);
    const along = tall ? lerp(-0.21, -0.06, k) : lerp(0.42, -0.14, k);
    const limb = limbPoint(tmp[1], eye, centre, tmp[6].copy(rim).applyAxisAngle(toEye, along), R * 1.012);
    const D = 60;
    const look = tmp[2].copy(limb).sub(eye).normalize();
    iss.group.position.copy(eye).addScaledVector(look, D);
    const z = tmp[3].crossVectors(toEye, rim).normalize();
    const x = tmp[4].copy(iss.uSun.value).addScaledVector(z, -z.dot(iss.uSun.value)).normalize();
    const y = tmp[5].crossVectors(z, x);
    iss.group.quaternion.setFromRotationMatrix(basis.makeBasis(x, y, z));
    iss.group.scale.setScalar(D * 0.075);
}

/** The station: fetched when wanted, shown only in the finale, placed against the dawn. */
function addStation(scene: THREE.Scene, s: Shared, small: boolean, uSun: THREE.IUniform<THREE.Vector3>) {
    const iss: Iss = { group: new THREE.Group(), uDawn: { value: 0 }, uSun };
    let asked = false;
    return {
        // Wide screens fetch it once the ship has left orbit; phones only when it is due.
        want: (f: SpaceIn): void => {
            if (!asked && (f.finale || (!small && !f.on))) {
                asked = true;
                loadIss(scene, s, iss);
            }
            iss.group.visible = f.on && f.finale;
        },
        place: (f: SpaceIn, dawn: number, centre: THREE.Vector3, rim: THREE.Vector3): void => {
            iss.uDawn.value = dawn;
            placeIss(iss, f.eye, centre, rim, f.rise, f.tall);
        },
    };
}
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
    // Earth textures: NASA Blue Marble NG (day), Black Marble 2016 (lights), Blue Marble clouds.
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
    const uRim = { value: new THREE.Vector3(0, 1, 0) };
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
            { uCenter, uSun, uRim, uR: { value: R }, uOp, uRise, uDay },
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
    const station = addStation(scene, s, small, uSun);
    const update = (f: SpaceIn): { heat: number; sun: THREE.Vector3 | null; dawn: number } => {
        globe.visible = f.on;
        station.want(f);
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
        // Off centre, on a third: on wide screens well to the right, clear of the text on the left
        // and of the ship; on tall ones a little right, above the panel.
        rim.set(0, 1, 0)
            .addScaledVector(toEye, -toEye.y)
            .normalize()
            .applyAxisAngle(toEye, f.tall ? SUN_AT.tall : SUN_AT.wide);
        uRim.value.copy(rim);
        uRise.value = 1 + 1.6 * smooth(0, 0.6, dawn);
        uDay.value = dawn;
        // Just under the visible limb, then clearing it: on the curve as seen from here.
        limbPoint(sunAt, f.eye, globe.position, rim, R * lerp(0.99, 1.03, dawn));
        // The light comes from where the disc is seen, tipped a little towards us: at any height
        // the day side is then a thin crescent along the limb under the sun, its terminator just
        // inside the curve.
        if (f.finale) uSun.value.copy(sunAt).sub(f.eye).normalize().addScaledVector(toEye, 0.05).normalize();
        else uSun.value.copy(SUN);
        for (const g of sun) g.position.copy(sunAt);
        if (f.finale) station.place(f, dawn, globe.position, rim);
        const heat = f.finale ? 0 : smooth(0.55, 0.95, f.e);
        uHeat.value = heat;
        return { heat, sun: f.finale ? sunAt : null, dawn };
    };
    return { update };
}
