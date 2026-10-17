import * as THREE from 'three';

import { ADD, MOON, MOONLIGHT, type Shared, shader } from '@/components/round-trip/world/gl';

/** The landscapes the project rings stand in, one per project (cycling if there are more). */
export const LANDS = ['grass', 'desert', 'canyon', 'alpine', 'volcano'] as const;
export type LandKind = (typeof LANDS)[number];
/** Roughly where the ground is under the path in each, for the search beam. */
export const GROUND: Record<LandKind, number> = {
    grass: -10,
    desert: -16,
    canyon: -14,
    alpine: -20,
    volcano: -16,
};

/**
 * Ground height for each landscape, in GLSL so the land is endless: the mesh follows the camera and
 * every vertex asks for its own height. All of them keep a valley along the path.
 */
const HEIGHT = /* glsl */ `
    uniform int uKind;
    vec2 coneAt(vec2 p) {
        vec2 cell = floor(p / 520.0);
        return (cell + 0.5 + (vec2(hash(cell), hash(cell + 3.1)) - 0.5) * 0.5) * 520.0;
    }
    float landH(vec2 p) {
        float d = abs(p.x - pathX(p.y));
        if (uKind == 0) {
            float hills = (fbm(p * 0.006) - 0.45) * 60.0 + (fbm(p * 0.03 + 7.0) - 0.5) * 6.0;
            float far = ridged(p * 0.0028 + 9.0) * 150.0 * smoothstep(160.0, 420.0, d);
            return -10.0 + hills * (0.2 + 0.8 * smoothstep(12.0, 110.0, d)) + far;
        }
        if (uKind == 1) {
            float warp = fbm(p * 0.008) * 6.0;
            float crest = 1.0 - abs(sin((p.x * 0.8 + p.y * 0.6) * 0.035 + warp));
            float dunes = pow(crest, 2.2) * (5.0 + 12.0 * fbm(p * 0.011 + 5.0)) * (0.3 + 0.7 * smoothstep(8.0, 40.0, d));
            float mesas = smoothstep(0.55, 0.62, fbm(p * 0.0035 + 2.0)) * 70.0 * smoothstep(120.0, 260.0, d);
            return -16.0 + dunes + mesas;
        }
        if (uKind == 2) {
            // Mesas everywhere except a dry wash along the path; walls rise on both sides of it.
            float m = (fbm(p * 0.005 + 4.0) * 1.3 - 0.45) * smoothstep(22.0, 70.0, d) + smoothstep(30.0, 140.0, d) * 0.85;
            float t = clamp(m, 0.0, 1.4) * 150.0 / 16.0;
            float h = (floor(t) + smoothstep(0.72, 1.0, fract(t))) * 16.0;
            return -14.0 + h + (fbm(p * 0.06) - 0.5) * 2.5;
        }
        if (uKind == 3) {
            return -20.0 + ridged(p * 0.0055 + 3.0) * 260.0 * smoothstep(28.0, 170.0, d) + (fbm(p * 0.03) - 0.5) * 10.0;
        }
        vec2 c = coneAt(p);
        float r = length(p - c);
        float keep = smoothstep(70.0, 160.0, abs(c.x - pathX(c.y)));
        float cone = pow(max(0.0, 1.0 - r / 230.0), 1.6) * 240.0 - smoothstep(30.0, 8.0, r) * 45.0;
        float plain = (fbm(p * 0.01) - 0.5) * 14.0 + ridged(p * 0.02) * 4.0;
        return -16.0 + plain * (0.4 + 0.6 * smoothstep(10.0, 60.0, d)) + cone * keep * smoothstep(25.0, 110.0, d);
    }
`;

const FRAG = /* glsl */ `
    uniform vec3 uMoon, uMoonCol;
    varying vec3 vW, vN; varying float vD;
    void main() {
        vec3 n = normalize(vN);
        vec2 p = vW.xz;
        float slope = 1.0 - n.y;
        float close = exp(-vD * 0.012);
        float g = fbm(p * 0.35 + vW.y * 0.2);
        float rocky = smoothstep(0.14, 0.32, slope + (fbm(p * 0.05) - 0.5) * 0.25);
        n = normalize(n + vec3(g - 0.5, 0.0, fbm(p.yx * 0.35) - 0.5) * 0.35 * rocky * close);
        vec3 albedo;
        vec3 glow = vec3(0.0);
        float snow = 0.0;
        if (uKind == 0) {
            // Grass: wind rolling across it in long silvery waves.
            float wave = 0.5 + 0.5 * sin(dot(p, vec2(0.6, 0.8)) * 0.07 - uTime * 1.3 + fbm(p * 0.02) * 6.0);
            albedo = vec3(0.045, 0.07, 0.032) * (0.75 + 0.45 * fbm(p * 0.05)) * (0.8 + 0.45 * wave);
            albedo = mix(albedo, vec3(0.08, 0.075, 0.07), rocky * 0.6);
        } else if (uKind == 1) {
            float rip = sin(dot(p, vec2(0.8, 0.6)) * 2.4 + fbm(p * 0.2) * 5.0);
            n = normalize(n + vec3(0.8, 0.0, 0.6) * rip * 0.07 * (1.0 - rocky) * close);
            albedo = mix(vec3(0.4, 0.29, 0.18) * (0.85 + 0.3 * fbm(p * 0.02)), vec3(0.2, 0.11, 0.07), rocky);
        } else if (uKind == 2) {
            // Red sandstone in bands, pale dust on the shelves.
            float band = 0.5 + 0.5 * sin(vW.y * 0.45 + fbm(p * 0.02) * 3.0);
            vec3 rock = mix(vec3(0.42, 0.16, 0.08), vec3(0.56, 0.3, 0.16), band) * (0.85 + 0.4 * g);
            albedo = mix(vec3(0.44, 0.28, 0.18), rock, rocky);
        } else if (uKind == 3) {
            snow = smoothstep(20.0, 50.0, vW.y + fbm(p * 0.03) * 34.0) * (1.0 - smoothstep(0.5, 0.72, slope));
            snow = max(snow, (1.0 - rocky) * smoothstep(0.0, -12.0, vW.y));
            albedo = mix(vec3(0.065, 0.06, 0.058) * (0.7 + 0.6 * g), vec3(0.74, 0.8, 0.9), snow);
        } else {
            // Basalt and ash; lava in the low channels, cracks glowing, craters alight.
            albedo = mix(vec3(0.024, 0.023, 0.026), vec3(0.06, 0.055, 0.05), rocky) * (0.7 + 0.6 * g);
            float river = smoothstep(0.9, 0.97, 1.0 - abs(fbm(p * 0.012 + 11.0) * 2.0 - 1.0)) * smoothstep(-8.0, -16.0, vW.y);
            float crack = (1.0 - smoothstep(0.0, 0.025, abs(fbm(p * 0.09) - 0.5))) * 0.35 * (1.0 - rocky);
            vec2 c = coneAt(p);
            float crater = smoothstep(26.0, 6.0, length(p - c)) * step(40.0, vW.y);
            float pulse = 0.75 + 0.25 * sin(uTime * 1.3 + fbm(p * 0.05) * 9.0);
            glow = vec3(3.2, 0.85, 0.16) * max(max(river, crack), crater) * pulse;
        }
        vec3 V = normalize(cameraPosition - vW);
        float lit = max(dot(n, uMoon), 0.0);
        vec3 amb = vec3(0.016, 0.024, 0.042) * (0.6 + 0.4 * n.y);
        vec3 col = albedo * (uMoonCol * lit + amb) + glow;
        vec3 R = reflect(-uMoon, n);
        float sparkle = step(0.985, hash(floor(p * 6.0))) * pow(max(dot(R, V), 0.0), 6.0);
        col += uMoonCol * (pow(max(dot(R, V), 0.0), 30.0) * 0.25 * snow + sparkle * snow * 1.2 * close);
        col += beamAt(vW) * (albedo * 4.0 + 0.04);
        gl_FragColor = vec4(fogIt(col, vD), 1.0);
    }
`;

/** Grass blades near the ship: tapered, bending in the wind, silver at the tips under the moon. */
const BLADE_VERT = /* glsl */ `
    uniform vec2 uTile;
    attribute vec2 aOff; attribute vec3 aBlade;
    varying float vT, vD; varying vec3 vW;
    void main() {
        vec2 c = wrapAround(aOff, uTile);
        float far = length(c - cameraPosition.xz);
        float h = aBlade.y * (1.0 - smoothstep(uTile.x * 0.3, uTile.x * 0.48, far));
        float t = position.y;
        vT = t;
        vec2 dir = vec2(cos(aBlade.x), sin(aBlade.x));
        vec3 p = vec3(c.x, landH(c), c.y);
        p.xz += vec2(-dir.y, dir.x) * position.x;
        p.y += t * h;
        float gust = (0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 1.6 + dot(c, vec2(0.08, 0.05))))) * fbm(c * 0.02 + uTime * 0.1);
        p.xz += vec2(0.8, 0.6) * t * t * h * 0.5 * gust;
        p.y -= t * t * h * 0.12 * gust;
        vW = p;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        vD = -mv.z;
        gl_Position = projectionMatrix * mv;
    }
`;
const BLADE_FRAG = /* glsl */ `
    uniform vec3 uMoonCol;
    varying float vT, vD; varying vec3 vW;
    void main() {
        vec3 c = mix(vec3(0.012, 0.022, 0.01), vec3(0.11, 0.16, 0.085), vT);
        vec3 col = c * (uMoonCol * 0.55 + 0.15) + uMoonCol * pow(vT, 4.0) * 0.05;
        col += beamAt(vW) * c * 4.0;
        gl_FragColor = vec4(fogIt(col, vD), 1.0);
    }
`;

function bladeGeometry(n: number, tile: number, rand: () => number): THREE.InstancedBufferGeometry {
    const g = new THREE.InstancedBufferGeometry();
    const w = 0.09;
    const pos = [
        -w,
        0,
        0,
        w,
        0,
        0,
        -w * 0.7,
        0.4,
        0,
        w * 0.7,
        0.4,
        0,
        -w * 0.35,
        0.75,
        0,
        w * 0.35,
        0.75,
        0,
        0,
        1,
        0,
    ];
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4, 4, 3, 5, 4, 5, 6]);
    const off = new Float32Array(n * 2);
    const blade = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        off.set([rand() * tile, rand() * tile], i * 2);
        blade.set([rand() * Math.PI * 2, 1.1 + rand() * 1.6, rand()], i * 3);
    }
    g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 2));
    g.setAttribute('aBlade', new THREE.InstancedBufferAttribute(blade, 3));
    g.instanceCount = n;
    return g;
}

/** Things drifting in the air: fireflies over grass, embers over lava, snow in the mountains. */
type Motes = {
    n: number;
    tile: number;
    y: [number, number];
    colour: THREE.Color;
    size: number;
    mode: number;
};

const MOTE_VERT = /* glsl */ `
    uniform vec2 uTile, uY; uniform float uSize, uMode;
    attribute vec4 aSeed; varying float vA, vD;
    void main() {
        float r = aSeed.w, span = uY.y - uY.x;
        float y = uMode > 1.5 ? uY.y - mod(aSeed.z * span + uTime * (1.2 + r * 1.5), span)
                : uMode > 0.5 ? uY.x + mod(aSeed.z * span + uTime * (3.0 + r * 6.0), span)
                : uY.x + aSeed.z * span + sin(uTime * (0.5 + r) + r * 20.0) * 1.5;
        vec3 p = vec3(aSeed.x + sin(uTime * (0.3 + r * 0.5) + r * 31.0) * 3.0, y, aSeed.y + cos(uTime * (0.25 + r * 0.4) + r * 17.0) * 3.0);
        p.xz = wrapAround(p.xz, uTile);
        vA = uMode < 0.5 ? smoothstep(0.55, 1.0, sin(uTime * (0.8 + r * 1.7) + r * 40.0))
           : uMode < 1.5 ? (0.6 + 0.4 * sin(uTime * 9.0 + r * 50.0)) * (1.0 - (y - uY.x) / span) : 0.8;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        vD = -mv.z;
        gl_PointSize = min(18.0, uSize * uPR * 40.0 / vD);
        gl_Position = projectionMatrix * mv;
    }
`;

function addMotes(group: THREE.Object3D, s: Shared, m: Motes, rand: () => number): void {
    const g = new THREE.BufferGeometry();
    const seed = new Float32Array(m.n * 4);
    for (let i = 0; i < m.n; i++) seed.set([rand() * m.tile, rand() * m.tile, rand(), rand()], i * 4);
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(m.n * 3), 3));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 4));
    const pts = new THREE.Points(
        g,
        shader(
            s,
            MOTE_VERT,
            /* glsl */ `uniform vec3 uCol; varying float vA, vD;
            void main() { float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(uCol * a * vA * fade(vD), 1.0); }`,
            {
                uTile: { value: new THREE.Vector2(m.tile, m.tile) },
                uY: { value: new THREE.Vector2(...m.y) },
                uSize: { value: m.size },
                uMode: { value: m.mode },
                uCol: { value: m.colour },
            },
            ADD
        )
    );
    pts.frustumCulled = false;
    group.add(pts);
}

export type Land = {
    /** Shows one landscape (or none) and keeps the ground under the camera. */
    show: (kind: LandKind | null, eye: THREE.Vector3) => void;
};

/** 3 · Services: the landscapes the ship visits, one per project ring. All by moonlight, all endless. */
export function addLand(scene: THREE.Object3D, s: Shared, small: boolean, rand: () => number): Land {
    const group = new THREE.Group();
    scene.add(group);
    const size = small ? 1100 : 1500;
    const seg = small ? 120 : 240;
    const cell = size / seg;
    const uKind = { value: 0 };
    const lights = { uMoon: { value: MOON }, uMoonCol: { value: MOONLIGHT }, uKind };
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2),
        shader(
            s,
            HEIGHT +
                /* glsl */ `uniform float uCell; varying vec3 vW, vN; varying float vD;
            void main() {
                vec4 w = modelMatrix * vec4(position, 1.0);
                float hx = landH(w.xz + vec2(uCell, 0.0)) - landH(w.xz - vec2(uCell, 0.0));
                float hz = landH(w.xz + vec2(0.0, uCell)) - landH(w.xz - vec2(0.0, uCell));
                vN = normalize(vec3(-hx, 2.0 * uCell, -hz));
                w.y = landH(w.xz);
                vW = w.xyz;
                vec4 mv = viewMatrix * w;
                vD = -mv.z;
                gl_Position = projectionMatrix * mv;
            }`,
            HEIGHT + FRAG,
            { ...lights, uCell: { value: cell } }
        )
    );
    ground.frustumCulled = false;
    group.add(ground);

    const tile = small ? 110 : 150;
    const grass = new THREE.Mesh(
        bladeGeometry(small ? 16000 : 60000, tile, rand),
        shader(
            s,
            HEIGHT + BLADE_VERT,
            BLADE_FRAG,
            { ...lights, uTile: { value: new THREE.Vector2(tile, tile) } },
            {
                side: THREE.DoubleSide,
            }
        )
    );
    grass.frustumCulled = false;
    group.add(grass);

    const motes: Partial<Record<LandKind, THREE.Group>> = {
        grass: new THREE.Group(),
        volcano: new THREE.Group(),
        alpine: new THREE.Group(),
    };
    const k = small ? 0.45 : 1;
    const air: Array<[LandKind, Motes]> = [
        [
            'grass',
            {
                n: 260 * k,
                tile: 160,
                y: [-9, -2],
                colour: new THREE.Color(2.2, 1.9, 0.6),
                size: 2.2,
                mode: 0,
            },
        ],
        [
            'volcano',
            {
                n: 700 * k,
                tile: 180,
                y: [-16, 40],
                colour: new THREE.Color(3.2, 1, 0.25),
                size: 1.6,
                mode: 1,
            },
        ],
        [
            'alpine',
            {
                n: 1600 * k,
                tile: 140,
                y: [-20, 40],
                colour: new THREE.Color(0.75, 0.8, 0.9),
                size: 1.1,
                mode: 2,
            },
        ],
    ];
    for (const [kind, m] of air) {
        const g = motes[kind] as THREE.Group;
        addMotes(g, s, { ...m, n: Math.round(m.n) }, rand);
        group.add(g);
    }

    const show = (kind: LandKind | null, eye: THREE.Vector3): void => {
        group.visible = kind !== null;
        if (!kind) return;
        uKind.value = LANDS.indexOf(kind);
        ground.position.set(Math.round(eye.x / cell) * cell, 0, Math.round(eye.z / cell) * cell - size * 0.3);
        grass.visible = kind === 'grass';
        for (const [name, g] of Object.entries(motes)) if (g) g.visible = name === kind;
    };
    return { show };
}
