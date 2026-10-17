import * as THREE from 'three';

import { MOON, MOONLIGHT, type Shared, shader, WRAP_VERT } from '@/components/round-trip/world/gl';

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
    float waves(vec2 p, float near) {
        return swell(p) + ((fbm(p * 0.25 + uTime * vec2(0.05, 0.03)) - 0.5) * 0.7 + (fbm(p * 0.9 - uTime * vec2(0.09, 0.02)) - 0.5) * 0.22) * near;
    }
    // Sea ice: a Voronoi field of floes; returns (inside a floe, distance to its edge).
    vec2 floes(vec2 p, float cover) {
        vec2 g = floor(p), f = fract(p);
        float d1 = 8.0, d2 = 8.0, id = 0.0;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec2 o = vec2(float(x), float(y));
            vec2 c = o + vec2(hash(g + o), hash(g + o + 17.3)) * 0.85;
            float d = length(c - f);
            if (d < d1) { d2 = d1; d1 = d; id = hash(g + o + 5.1); } else if (d < d2) d2 = d;
        }
        float edge = d2 - d1;
        return vec2(step(id, cover) * smoothstep(0.03, 0.09, edge), edge);
    }
`;

const SEA_FRAG = /* glsl */ `
    varying vec3 vW; varying float vD;
    void main() {
        float cover = ice(vW.xz) * 1.05;
        // Warp the cells so floes come in uneven, rounded shapes; small ones fill the gaps.
        vec2 wp = vW.xz * 0.04;
        wp += (vec2(fbm(wp * 1.3), fbm(wp * 1.3 + 9.0)) - 0.5) * 1.1;
        vec2 fl = floes(wp, cover);
        vec2 bits = floes(wp * 3.1 + 4.0, cover * 0.8);
        float brash = smoothstep(0.62, 0.7, fbm(vW.xz * 0.6)) * cover;
        fl.x = max(fl.x, max(bits.x * 0.95, brash * 0.7));
        fl.y = max(fl.y, bits.y * 0.5);
        float near = exp(-vD * 0.004) * (1.0 - fl.x);
        float e = 0.35;
        vec2 p = vW.xz;
        vec3 n = normalize(vec3(waves(p - vec2(e, 0.0), near) - waves(p + vec2(e, 0.0), near), 2.0 * e,
                                waves(p - vec2(0.0, e), near) - waves(p + vec2(0.0, e), near)));
        vec3 V = normalize(vW - cameraPosition);
        vec3 R = reflect(V, n);
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(-V, n), 0.0), 5.0);
        vec3 sky = mix(uHorizon, vec3(0.004, 0.007, 0.018), smoothstep(0.0, 0.5, R.y));
        float m = max(dot(R, uMoon), 0.0);
        vec3 water = mix(vec3(0.002, 0.007, 0.012), sky, fres) + uMoonCol * (pow(m, 1400.0) * 2.5 + pow(m, 220.0) * 0.06);
        water += beamAt(vW) * 0.12;

        // Floes: snow on top, lit by the moon, sparkling; blue where they crack and meet the water.
        vec3 iN = normalize(vec3((fbm(p * 0.3) - 0.5) * 0.25, 1.0, (fbm(p.yx * 0.3) - 0.5) * 0.25));
        vec3 albedo = mix(vec3(0.42, 0.55, 0.62), vec3(0.72, 0.78, 0.86), smoothstep(0.1, 0.3, fl.y));
        vec3 snow = albedo * (uMoonCol * max(dot(iN, uMoon), 0.0) + vec3(0.02, 0.03, 0.05));
        float sparkle = step(0.988, hash(floor(p * 5.0))) * pow(max(dot(reflect(-uMoon, iN), -V), 0.0), 4.0);
        snow += uMoonCol * sparkle * 1.6 * exp(-vD * 0.012) + beamAt(vW) * albedo * 4.0;
        vec3 col = mix(water, snow, fl.x);
        gl_FragColor = vec4(fogIt(col, vD), 1.0);
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
        vec3 albedo = mix(vec3(0.3, 0.5, 0.6), vec3(0.78, 0.84, 0.92), top);
        vec3 col = albedo * (uMoonCol * lit + vec3(0.015, 0.03, 0.045));
        col += vec3(0.02, 0.11, 0.17) * (1.0 - lit) * (0.6 + 0.4 * vR);
        col += uMoonCol * pow(max(dot(reflect(-uMoon, n), V), 0.0), 24.0) * 0.5;
        col += vec3(0.25, 0.45, 0.6) * pow(1.0 - abs(dot(n, V)), 3.0) * 0.08;
        float wet = smoothstep(${(SEA + 0.6).toFixed(1)}, ${(SEA - 0.4).toFixed(1)}, vW.y);
        col = mix(col, col * vec3(0.3, 0.55, 0.6), wet);
        col += beamAt(vW) * albedo * 3.0;
        gl_FragColor = vec4(fogIt(col, vD), 1.0);
    }
`;

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
            WAVES + SEA_FRAG,
            lights
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
