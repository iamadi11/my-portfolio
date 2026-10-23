import * as THREE from 'three';

import { MOON, MOONLIGHT, rng, type Shared, shader, WRAP_VERT } from '@/components/round-trip/world/gl';

/** Sea level, below the path. */
export const SEA = -24;
const SIZE = 2600;
const TILE = 900;

const WAVES = /* glsl */ `
    uniform vec3 uMoon, uMoonCol, uHorizon; uniform float uIce;
    // Open water on the ocean; pack ice everywhere at the pole, thinning only along the path.
    float ice(vec2 p) { return uIce * (0.82 + 0.25 * smoothstep(8.0, 40.0, abs(p.x - pathX(p.y)))); }
    float swell(vec2 p) {
        return sin(dot(p, vec2(0.08, 0.05)) + uTime * 0.9) * 0.5 + sin(dot(p, vec2(-0.06, 0.11)) + uTime * 1.1) * 0.35
            + sin(dot(p, vec2(0.17, -0.04)) + uTime * 1.6) * 0.18;
    }
`;

const SEA_FRAG = /* glsl */ `
    varying vec3 vW; varying float vD;
    // The swell's slope, exactly (the derivative of swell()).
    vec2 swellSlope(vec2 p) {
        return vec2(0.08, 0.05) * cos(dot(p, vec2(0.08, 0.05)) + uTime * 0.9) * 0.5
            + vec2(-0.06, 0.11) * cos(dot(p, vec2(-0.06, 0.11)) + uTime * 1.1) * 0.35
            + vec2(0.17, -0.04) * cos(dot(p, vec2(0.17, -0.04)) + uTime * 1.6) * 0.18;
    }
    // Chop: two scrolling, crossing taps of a tiling slope map (one on phones); mipmaps calm it far off.
    uniform sampler2D tWaves;
    vec2 chop(vec2 uv) { return texture2D(tWaves, uv).rg * 2.0 - 1.0; }
    vec2 slope(vec2 p, float near) {
        vec2 g = chop(p / 37.0 + uTime * vec2(0.011, 0.006)) * 0.35;
#ifndef SMALL
        g += chop(mat2(0.8, -0.6, 0.6, 0.8) * p / 11.0 - uTime * vec2(0.02, 0.008)) * 0.25;
#endif
        return swellSlope(p) + g * near;
    }
    // Sea ice: a Voronoi field of floes: (inside a floe, distance to its edge, which way that edge faces).
    vec4 floes(vec2 p, float cover) {
        vec2 g = floor(p), f = fract(p);
        float d1 = 8.0, d2 = 8.0, id = 0.0;
        vec2 c1 = vec2(0.0), c2 = vec2(0.0);
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec2 o = vec2(float(x), float(y));
            vec2 c = o + vec2(hash(g + o), hash(g + o + 17.3)) * 0.85;
            float d = length(c - f);
            if (d < d1) { d2 = d1; c2 = c1; d1 = d; c1 = c; id = hash(g + o + 5.1); } else if (d < d2) { d2 = d; c2 = c; }
        }
        float edge = d2 - d1;
        return vec4(step(id, cover) * smoothstep(0.03, 0.09, edge), edge, normalize(c2 - c1 + 1e-4));
    }
    // The pack at the pole: big floes with small ones and brash filling the gaps.
    vec4 pack(vec2 p) {
        float cover = ice(p) * 1.05;
        // Warp the cells so floes come in uneven, rounded shapes.
        vec2 wp = p * 0.04;
        wp += (vec2(fbm(wp * 1.3), fbm(wp * 1.3 + 9.0)) - 0.5) * 1.1;
        vec4 fl = floes(wp, cover);
        vec4 bits = floes(wp * 3.1 + 4.0, cover * 0.8);
        float brash = smoothstep(0.62, 0.7, fbm(p * 0.6)) * cover;
        fl.x = max(fl.x, max(bits.x * 0.95, brash * 0.7));
        fl.y = max(fl.y, bits.y * 0.5);
        return fl;
    }
    // The aurora as the open leads mirror it: a soft green band low over the horizon ahead, and a
    // faint wash of it higher up, so even a lead seen from above holds a little green.
    vec3 auroraIn(vec3 R) {
        float ahead = smoothstep(-0.4, 0.4, -R.z);
        float band = exp(-pow((R.y - 0.09) / 0.07, 2.0)) * ahead;
        float fold = 0.6 + 0.4 * sin(atan(R.x, -R.z) * 9.0 + uTime * 0.1);
        float wash = exp(-pow((R.y - 0.2) / 0.45, 2.0)) * (0.4 + 0.6 * ahead);
        return vec3(0.12, 1.0, 0.55) * (band * fold * 0.16 + wash * 0.035) * uIce;
    }
    // Open water in the pack: deep blue-black in the leads, with a soft rim of grey new ice (nilas)
    // and slush where it meets the floes, so leads read as water, not holes.
    vec3 lead(vec3 water, vec4 fl, vec3 sky) {
        float rim = 1.0 - smoothstep(0.015, 0.16, fl.y);
        vec3 deep = water + vec3(0.004, 0.013, 0.04) + sky * 0.08;
        vec3 nilas = vec3(0.07, 0.1, 0.13) * (uMoonCol * max(uMoon.y, 0.0) + 0.3);
        return mix(deep, nilas, rim * 0.8);
    }
    // Floes: snow on top lit by the moon and faintly green by the aurora above, sparkling; a lit lip
    // on edges facing the moon, blue on those turned away, and where they crack and meet the water.
    vec3 floeColour(vec4 fl, vec2 p, vec3 V) {
        vec3 iN = normalize(vec3((fbm(p * 0.3) - 0.5) * 0.25, 1.0, (fbm(p.yx * 0.3) - 0.5) * 0.25));
        vec3 albedo = mix(vec3(0.3, 0.42, 0.5), vec3(0.55, 0.58, 0.62), smoothstep(0.1, 0.3, fl.y));
        vec3 amb = vec3(0.02, 0.03, 0.05) + vec3(0.012, 0.05, 0.03) * uIce * iN.y;
        vec3 snow = albedo * (uMoonCol * max(dot(iN, uMoon), 0.0) + amb);
        float rim = 1.0 - smoothstep(0.06, 0.16, fl.y);
        float face = dot(fl.zw, normalize(uMoon.xz));
        snow += uMoonCol * albedo * rim * max(face, 0.0) * 0.5;
        snow *= mix(vec3(1.0), vec3(0.4, 0.58, 0.85), rim * max(-face, 0.0));
        float sparkle = step(0.988, hash(floor(p * 5.0))) * pow(max(dot(reflect(-uMoon, iN), -V), 0.0), 4.0);
        return snow + uMoonCol * sparkle * 1.6 * exp(-vD * 0.012) + beamAt(vW) * albedo * 4.0;
    }
    void main() {
        vec2 p = vW.xz;
        // Open ocean skips the floe field entirely.
        vec4 fl = vec4(0.0, 1.0, 0.0, 0.0);
        if (uIce > 0.0) fl = pack(p);
        float near = exp(-vD * 0.002) * (1.0 - fl.x);
        vec2 g = slope(p, near);
        vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
        vec3 V = normalize(vW - cameraPosition);
        vec3 R = reflect(V, n);
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(-V, n), 0.0), 5.0);
        // The sky it mirrors is the same haze the fog fades into, so the horizon has no seam.
        vec3 sky = haze(R) + auroraIn(R);
        // The moon path: a tight lobe on per-cell jittered facets, so it breaks into glitter instead
        // of one rubber-sheet highlight; the lobe widens with distance so it never aliases.
        vec2 cellId = floor(p * 3.0);
        vec3 nj = normalize(n + (vec3(hash(cellId), 0.0, hash(cellId + 7.1)) - 0.5) * 0.12 * near);
        float m = max(dot(reflect(V, nj), uMoon), 0.0);
        float ex = mix(1400.0, 150.0, smoothstep(40.0, 600.0, vD));
        vec3 water = mix(vec3(0.002, 0.007, 0.012), sky, fres) + uMoonCol * (pow(m, ex) * 2.5 * (ex / 1400.0) + pow(max(dot(R, uMoon), 0.0), 220.0) * 0.06);
        // Crests turned to the moon let a little teal light through.
        float crest = smoothstep(0.1, 0.8, swell(p)) * clamp(dot(n.xz, uMoon.xz) * 8.0, 0.0, 1.0);
        water += uMoonCol * vec3(0.0, 0.012, 0.011) * crest * (1.0 - fres);
        water += beamAt(vW) * 0.12;
        vec3 col = water;
        if (uIce > 0.0) {
            col = mix(lead(water, fl, sky), floeColour(fl, p, V), fl.x);
            // Polar air: the pack fades into the haze gradually, over its whole depth, instead of
            // in a thin line at the horizon, so the far ice meets the sky without a wall.
            col = mix(col, haze(V), (1.0 - exp(-vD * 0.0045)) * 0.75);
        }
        gl_FragColor = vec4(fogAt(col, vD, vW), 1.0);
    }
`;

/** Icebergs: faceted, snow on top, glowing blue inside where the moon does not reach. */
const BERG_FRAG = /* glsl */ `
    uniform vec3 uMoon, uMoonCol;
    varying vec3 vW, vN, vL, vWN; varying float vR, vD;
    void main() {
        vec3 n = normalize(vWN);
        vec3 V = normalize(cameraPosition - vW);
        float lit = max(dot(n, uMoon), 0.0);
        float top = smoothstep(0.55, 0.85, n.y);
        vec3 albedo = mix(vec3(0.26, 0.42, 0.52), vec3(0.56, 0.6, 0.65), top);
        vec3 col = albedo * (uMoonCol * lit + vec3(0.015, 0.03, 0.045) + vec3(0.012, 0.05, 0.03) * max(n.y, 0.0));
        col += vec3(0.02, 0.11, 0.17) * (1.0 - lit) * (0.6 + 0.4 * vR);
        col += uMoonCol * pow(max(dot(reflect(-uMoon, n), V), 0.0), 24.0) * 0.5;
        col += vec3(0.25, 0.45, 0.6) * pow(1.0 - abs(dot(n, V)), 3.0) * 0.08;
        float wet = 1.0 - smoothstep(${(SEA - 0.4).toFixed(1)}, ${(SEA + 0.6).toFixed(1)}, vW.y);
        col = mix(col, col * vec3(0.3, 0.55, 0.6), wet);
        col += beamAt(vW) * albedo * 3.0;
        gl_FragColor = vec4(fogAt(col, vD, vW), 1.0);
    }
`;

/**
 * A tiling map of wave slopes (x, z in red, green): a sum of sines on whole-number wave vectors so
 * it repeats seamlessly, steeper for the long waves, with its own seed so the world stays the same.
 */
function waveSlopes(size: number): THREE.DataTexture {
    const rand = rng(11);
    const waves = Array.from({ length: 24 }, () => {
        const a = rand() * Math.PI * 2;
        const k = 2 + Math.pow(rand(), 1.5) * 12;
        const kx = Math.round(Math.cos(a) * k);
        const ky = Math.round(Math.sin(a) * k);
        return { kx, ky, amp: Math.pow(Math.hypot(kx, ky) || 1, -0.6), phase: rand() * Math.PI * 2 };
    });
    const slopes = new Float32Array(size * size * 2);
    for (let i = 0; i < size * size; i++) {
        const x = i % size;
        const y = Math.floor(i / size);
        for (const w of waves) {
            const c = Math.cos(((w.kx * x + w.ky * y) / size) * Math.PI * 2 + w.phase) * w.amp;
            slopes[i * 2] += c * w.kx;
            slopes[i * 2 + 1] += c * w.ky;
        }
    }
    // Scaled so the steepest slope in the map is 1 (stored as 0–255 around 128).
    const peak = slopes.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-6);
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
        data[i * 4] = Math.round((0.5 + (0.5 * slopes[i * 2]) / peak) * 255);
        data[i * 4 + 1] = Math.round((0.5 + (0.5 * slopes[i * 2 + 1]) / peak) * 255);
        data[i * 4 + 3] = 255;
    }
    const t = new THREE.DataTexture(data, size, size);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
}

function bergGeometry(rand: () => number): THREE.BufferGeometry {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    // Seeded per direction, so shared corners move together and the berg stays closed.
    const bump = (x: number, y: number, z: number): number => {
        const s = Math.sin(x * 12.9 + y * 78.2 + z * 37.7) * 43758.5;
        return s - Math.floor(s);
    };
    const seed = rand() * 10;
    for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const r =
            1 + (bump(Math.round(v.x * 4) + seed, Math.round(v.y * 4), Math.round(v.z * 4)) - 0.5) * 0.45;
        v.multiplyScalar(r);
        if (v.y > 0.42) v.y = 0.42 + (v.y - 0.42) * 0.12;
        p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
}

export type Sea = {
    /** Open ocean, the frozen pole, or hidden; the water follows the camera. */
    show: (mode: 'ocean' | 'ice' | null, eye: THREE.Vector3) => void;
};

/** 4 · Data: the open sea at night, then the pole: pack ice and icebergs under the aurora. */
export function addSea(
    scene: THREE.Object3D,
    s: Shared,
    horizon: THREE.IUniform<THREE.Color>,
    small: boolean,
    rand: () => number
): Sea {
    const group = new THREE.Group();
    scene.add(group);
    const uIce = { value: 0 };
    const lights = { uMoon: { value: MOON }, uMoonCol: { value: MOONLIGHT }, uHorizon: horizon, uIce };
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, small ? 120 : 240, small ? 120 : 240);
    geo.rotateX(-Math.PI / 2);
    const cell = SIZE / (small ? 120 : 240);
    const sea = new THREE.Mesh(
        geo,
        shader(
            s,
            WAVES +
                /* glsl */ `varying vec3 vW; varying float vD;
            void main() { vec4 w = modelMatrix * vec4(position, 1.0); w.y = ${SEA.toFixed(1)} + swell(w.xz) * 0.6 * (1.0 - ice(w.xz) * 0.85); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
            WAVES + (small ? '#define SMALL\n' : '') + SEA_FRAG,
            { ...lights, tWaves: { value: waveSlopes(small ? 128 : 256) } }
        )
    );
    sea.frustumCulled = false;
    group.add(sea);

    // Icebergs: one tile of them, repeated around the camera and kept off the path.
    const bergs = new THREE.Group();
    group.add(bergs);
    const n = small ? 24 : 50;
    const kinds = [bergGeometry(rand), bergGeometry(rand), bergGeometry(rand)];
    const wrap = { uTile: { value: new THREE.Vector2(TILE, TILE) }, uClear: { value: 36 } };
    const mats = kinds.map(() => shader(s, WRAP_VERT, BERG_FRAG, { ...lights, ...wrap }));
    const lists: THREE.Matrix4[][] = [[], [], []];
    const q = new THREE.Quaternion();
    const Y = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < n; i++) {
        const z = -rand() * TILE;
        const x = (rand() - 0.5) * TILE;
        const w = 6 + Math.pow(rand(), 2) * 30;
        const h = 4 + rand() * 12;
        q.setFromAxisAngle(Y, rand() * Math.PI * 2);
        lists[i % 3].push(
            new THREE.Matrix4().compose(
                new THREE.Vector3(x, SEA - h * 0.15, z),
                q,
                new THREE.Vector3(w, h, w * (0.6 + rand() * 0.6))
            )
        );
    }
    lists.forEach((list, k) => {
        const mesh = new THREE.InstancedMesh(kinds[k], mats[k], list.length);
        const r = new Float32Array(list.length);
        list.forEach((m, j) => {
            mesh.setMatrixAt(j, m);
            r[j] = rand();
        });
        kinds[k].setAttribute('aRand', new THREE.InstancedBufferAttribute(r, 1));
        mesh.frustumCulled = false;
        bergs.add(mesh);
    });
    return {
        show: (mode, eye) => {
            group.visible = mode !== null;
            if (!mode) return;
            uIce.value = mode === 'ice' ? 1 : 0;
            bergs.visible = mode === 'ice';
            sea.position.set(
                Math.round(eye.x / cell) * cell,
                0,
                Math.round(eye.z / cell) * cell - SIZE * 0.3
            );
        },
    };
}
