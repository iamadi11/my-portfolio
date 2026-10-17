import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

import { ADD, boxes, type Shared, shader, WRAP_VERT } from '@/components/round-trip/world/gl';

/** Street level, below the path; the grid the blocks sit on, and one tile of the endless city. */
export const FLOOR = -60;
const GRID = 18;
const COLS = 27;
const ROWS = 24;
const TILE = new THREE.Vector2(COLS * GRID, ROWS * GRID);
const CLEAR = 20;

/**
 * Facades. Two kinds of tower: concrete with punched windows, and glass curtain walls. Unlit glass
 * reflects the sky (stronger at grazing angles). Lit windows are fake rooms: the back wall shifts
 * with the camera, so each window reads as a lit room with depth, some with blinds, a few flickering
 * like a TV. Street level glows like shopfronts; the request lights the walls as it passes.
 */
const TOWER_FRAG = /* glsl */ `
    varying vec3 vW, vN, vL; varying float vR, vD;
    void main() {
        vec3 n = normalize(vN);
        float side = 1.0 - step(0.5, abs(n.y));
        bool xFace = abs(n.x) > 0.5;
        vec2 f = xFace ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y);
        float glassy = step(0.58, vR);
        vec2 cs = mix(vec2(2.4, 3.4), vec2(1.7, 3.1), glassy);
        vec2 cell = floor(f / cs), g = fract(f / cs);
        vec2 lo = mix(vec2(0.15, 0.24), vec2(0.05, 0.12), glassy);
        float win = step(lo.x, g.x) * step(g.x, 1.0 - lo.x) * step(lo.y, g.y) * step(g.y, 1.0 - lo.y) * side;
        float h = hash(cell + vR * 91.7);
        float floorOn = step(0.45, hash(vec2(cell.y, vR * 13.0)));
        float lit = step(0.72 - 0.2 * floorOn, h) * win;

        vec3 V = normalize(vW - cameraPosition);
        vec3 T = xFace ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
        float into = max(dot(V, -n), 0.15);
        vec2 bp = (g - 0.5) + vec2(dot(V, T), V.y) / into * (1.3 / cs);
        float backWall = 1.0 - smoothstep(0.36, 0.5, max(abs(bp.x), abs(bp.y)));
        float ceilingLight = smoothstep(-0.3, 0.6, bp.y);
        vec3 warm = mix(vec3(1.0, 0.6, 0.3), vec3(1.0, 0.85, 0.64), fract(h * 7.3));
        vec3 wc = mix(warm, vec3(0.6, 0.8, 1.0), step(0.86, fract(h * 13.1)));
        float tv = step(0.94, fract(h * 3.7));
        float flick = mix(1.0, 0.75 + 0.25 * sin(uTime * (6.0 + h * 9.0) + h * 40.0), tv);
        wc = mix(wc, vec3(0.45, 0.65, 1.0), tv);
        float blinds = step(0.72, fract(h * 5.3));
        float slats = mix(1.0, 0.55 + 0.45 * step(0.45, fract(g.y * 10.0)), blinds);
        vec3 room = wc * (0.3 + 0.95 * backWall) * (0.8 + 0.35 * ceilingLight) * flick * slats;

        float fres = pow(1.0 - clamp(abs(dot(V, n)), 0.0, 1.0), 3.0);
        vec3 sky = mix(vec3(0.045, 0.06, 0.1), vec3(0.14, 0.17, 0.26), clamp(0.5 - V.y * 0.6, 0.0, 1.0));
        vec3 glass = sky * (0.35 + 1.7 * fres);
        float hgt = clamp((vW.y + 60.0) / 210.0, 0.0, 1.0);
        vec3 concrete = mix(vec3(0.02, 0.022, 0.03), vec3(0.06, 0.064, 0.078), hgt) * (0.78 + 0.22 * abs(n.x));
        concrete *= 0.9 + 0.2 * hash(floor(f * 0.5));
        vec3 curtain = vec3(0.016, 0.024, 0.04) + glass * 0.55;
        vec3 col = mix(concrete, curtain, glassy);
        col += (1.0 - smoothstep(0.0, 0.05, g.y)) * side * (1.0 - glassy) * vec3(0.03);
        col = mix(col, glass, win * (1.0 - lit));
        col = mix(col, room * 1.15 + glass * 0.2, lit);
        float shop = side * step(0.35, vR) * smoothstep(-60.0, -59.0, vW.y) * (1.0 - smoothstep(-56.0, -55.0, vW.y));
        col += shop * mix(vec3(1.0, 0.62, 0.32), vec3(0.6, 0.85, 1.0), step(0.8, vR)) * 1.1;
        col = mix(col, vec3(0.025, 0.03, 0.042), step(0.5, n.y));
        col += vec3(1.0, 0.86, 0.7) * glowAt(vW, 18.0) * 0.1;
        gl_FragColor = vec4(fogIt(col, vD), 1.0);
    }
`;

type Tower = { x: number; z: number; h: number; w: number; d: number };

/** One tile of blocks; the shader repeats it around the camera and keeps the flight path clear. */
function addTowers(scene: THREE.Object3D, s: Shared, rand: () => number): Tower[] {
    const towers: Tower[] = [];
    const q = new THREE.Quaternion();
    for (let k = 0; k < COLS; k++)
        for (let j = 0; j < ROWS; j++) {
            const x = (k - (COLS - 1) / 2) * GRID + (rand() - 0.5) * 3;
            const z = -j * GRID + (rand() - 0.5) * 3;
            const h = 22 + Math.pow(rand(), 1.8) * 175 * (1 - (Math.abs(x) / 240) * 0.4);
            towers.push({ x, z, h, w: 8 + rand() * 5, d: 8 + rand() * 5 });
        }
    const transforms = towers.map((t) =>
        new THREE.Matrix4().compose(
            new THREE.Vector3(t.x, FLOOR + t.h / 2, t.z),
            q,
            new THREE.Vector3(t.w, t.h, t.d)
        )
    );
    const wrap = { uTile: { value: TILE }, uClear: { value: CLEAR } };
    scene.add(boxes(shader(s, WRAP_VERT, TOWER_FRAG, wrap), transforms, rand));
    return towers;
}

/** Blinking red aviation lights on the masts of the tallest towers. */
function addBeacons(scene: THREE.Object3D, towers: Tower[], s: Shared, rand: () => number): void {
    const lights: number[] = [];
    for (const t of towers) if (t.h > 115) lights.push(t.x, FLOOR + t.h + 6 + rand() * 10, t.z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(lights, 3));
    const blink = new THREE.Points(
        g,
        shader(
            s,
            /* glsl */ `uniform vec2 uTile; uniform float uClear; varying float vD; varying float vP;
            void main() {
                vec3 p = position; p.xz = wrapAround(p.xz, uTile); vP = fract(position.x * 0.137);
                vec4 mv = viewMatrix * vec4(p, 1.0); vD = -mv.z;
                gl_PointSize = abs(p.x - pathX(p.z)) < uClear ? 0.0 : min(22.0, uPR * 900.0 / vD);
                gl_Position = projectionMatrix * mv; }`,
            /* glsl */ `varying float vD; varying float vP;
            void main() { float on = step(0.55, fract(uTime * 0.6 + vP)); float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
                gl_FragColor = vec4(vec3(2.4, 0.15, 0.1) * a * on * fade(vD), 1.0); }`,
            { uTile: { value: TILE }, uClear: { value: CLEAR } },
            ADD
        )
    );
    blink.frustumCulled = false;
    scene.add(blink);
}

/**
 * Wet asphalt. Puddles (large-scale noise) mirror the city; between them the road is rough and
 * only smears the lights. Desktop renders a real mirrored city for the puddles; phones fake it.
 */
const STREET_FRAG = /* glsl */ `
    uniform sampler2D tReflect; uniform float uMirror;
    varying vec4 vRuv; varying vec3 vW; varying float vD;
    void main() {
        float puddle = smoothstep(0.5, 0.62, fbm(vW.xz * 0.045));
        float grain = fbm(vW.xz * 1.9);
        vec2 ripple = (vec2(fbm(vW.xz * 0.8 + uTime * 0.04), fbm(vW.xz * 0.8 - uTime * 0.04)) - 0.5) * 0.035;
        vec4 uv = vRuv;
        uv.xy += ripple * uv.w * (1.0 - puddle * 0.75);
        float spread = mix(0.012, 0.003, puddle) * uv.w;
        vec3 refl = (texture2DProj(tReflect, uv).rgb + texture2DProj(tReflect, uv + vec4(spread, 0.0, 0.0, 0.0)).rgb
            + texture2DProj(tReflect, uv - vec4(spread, 0.0, 0.0, 0.0)).rgb + texture2DProj(tReflect, uv + vec4(0.0, spread * 2.0, 0.0, 0.0)).rgb) * 0.25;
        vec3 V = normalize(vW - cameraPosition);
        float fres = 0.25 + 0.75 * pow(1.0 - abs(V.y), 4.0);
        vec3 asphalt = vec3(0.01, 0.012, 0.018) * (0.6 + 0.8 * grain);
        vec2 q = abs(fract((vW.xz - 9.0) / 18.0) - 0.5) * 18.0;
        float lane = smoothstep(0.4, 0.0, min(q.x, q.y)) * (1.0 - puddle * 0.6);
        vec3 col = asphalt + vec3(0.32, 0.36, 0.42) * lane * 0.05;
        col += refl * uMirror * mix(0.22, 0.95, puddle) * fres;
        vec3 lp = vec3(uPacket.x, vW.y, uPacket.z);
        col += vec3(1.0, 0.75, 0.5) * exp(-dot(vW - lp, vW - lp) / 900.0) * 0.1;
        gl_FragColor = vec4(fogIt(col, vD), 1.0);
    }
`;

export type City = {
    /** The street follows the ship; mirroring runs only while the city is on screen. */
    update: (eye: THREE.Vector3, on: boolean) => void;
};

function addStreets(scene: THREE.Object3D, s: Shared, mirror: boolean): City {
    const geo = new THREE.PlaneGeometry(900, 900);
    // The reflector renders the mirrored city; its own material is swapped for the asphalt above.
    const floor = mirror
        ? new Reflector(geo, { textureWidth: 1024, textureHeight: 640, clipBias: 0.003 })
        : new THREE.Mesh(geo);
    const reflectUniforms = mirror
        ? ((floor as Reflector).material as THREE.ShaderMaterial).uniforms
        : { tDiffuse: { value: null }, textureMatrix: { value: new THREE.Matrix4() } };
    floor.material = shader(
        s,
        /* glsl */ `uniform mat4 textureMatrix; varying vec4 vRuv; varying vec3 vW; varying float vD;
        void main() { vRuv = textureMatrix * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
            vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
        STREET_FRAG,
        {
            tReflect: reflectUniforms.tDiffuse,
            textureMatrix: reflectUniforms.textureMatrix,
            uMirror: { value: mirror ? 1 : 0 },
        }
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR;
    scene.add(floor);
    return {
        update: (eye, on) => {
            floor.position.x = eye.x;
            floor.position.z = eye.z - 200;
            floor.visible = on;
        },
    };
}

/** Other requests driving the streets: white heading one way, red the other. */
function addTraffic(scene: THREE.Object3D, s: Shared, density: number, rand: () => number): void {
    const n = Math.round(900 * density);
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.setIndex(unit.index);
    g.setAttribute('position', unit.getAttribute('position'));
    g.instanceCount = n;
    const base = new Float32Array(n * 3);
    const dir = new Float32Array(n * 3);
    const sp = new Float32Array(n * 2);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        const fwd = rand() < 0.5 ? 1 : -1;
        if (rand() < 0.55) {
            base.set(
                [(Math.floor(rand() * COLS) - (COLS - 1) / 2) * GRID + 9 + fwd * 1.6, FLOOR + 0.6, 0],
                i * 3
            );
            dir.set([0, 0, fwd], i * 3);
            sp.set([8 + rand() * 22, TILE.y], i * 2);
        } else {
            base.set([0, FLOOR + 0.6, -Math.floor(rand() * ROWS) * GRID - 9 + fwd * 1.6], i * 3);
            dir.set([fwd, 0, 0], i * 3);
            sp.set([8 + rand() * 22, TILE.x], i * 2);
        }
        dir[i * 3 + 1] = rand() * 1000; // phase, kept in the unused y of the direction
        col.set(fwd > 0 ? [2.6, 2.2, 1.7] : [2.6, 0.35, 0.22], i * 3);
    }
    g.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 3));
    g.setAttribute('aDir', new THREE.InstancedBufferAttribute(dir, 3));
    g.setAttribute('aSp', new THREE.InstancedBufferAttribute(sp, 2));
    g.setAttribute('aCol', new THREE.InstancedBufferAttribute(col, 3));
    const cars = new THREE.Mesh(
        g,
        shader(
            s,
            /* glsl */ `uniform vec2 uTile; attribute vec3 aBase, aDir, aCol; attribute vec2 aSp; varying vec3 vC; varying float vD;
            void main() {
                vec3 d = vec3(aDir.x, 0.0, aDir.z);
                vec3 lp = (abs(d.x) > 0.5 ? position.zyx : position) * vec3(0.35, 0.18, 2.2);
                float s = mod(uTime * aSp.x + aDir.y, aSp.y) - aSp.y * 0.5;
                vC = aCol;
                vec3 c = aBase + d * s;
                c.xz = wrapAround(c.xz, uTile);
                vec4 mv = viewMatrix * vec4(c + lp, 1.0);
                vD = -mv.z;
                gl_Position = projectionMatrix * mv;
            }`,
            /* glsl */ `varying vec3 vC; varying float vD; void main() { gl_FragColor = vec4(fogIt(vC, vD), 1.0); }`,
            { uTile: { value: TILE } }
        )
    );
    cars.frustumCulled = false;
    scene.add(cars);
}

/** 2 · Edge: an endless night city of towers the ship weaves above. */
export function addCity(scene: THREE.Object3D, s: Shared, density: number, rand: () => number): City {
    const towers = addTowers(scene, s, rand);
    addBeacons(scene, towers, s, rand);
    addTraffic(scene, s, density, rand);
    return addStreets(scene, s, density >= 1);
}
