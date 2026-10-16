import * as THREE from 'three';

import { boxes, INSTANCED_VERT, type Shared, shader } from '@/components/round-trip/world/gl';
import type { Route } from '@/components/round-trip/world/route';

const FLOOR = -60;
const GRID = 18;

/** Facades: a window grid, some floors lit, warm and a few cool, flickering; the request lights them up. */
const TOWER_FRAG = /* glsl */ `
    varying vec3 vW, vN, vL; varying float vR, vD;
    void main() {
        vec3 n = normalize(vN);
        float side = 1.0 - step(0.5, abs(n.y));
        vec2 f = abs(n.x) > 0.5 ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y);
        vec2 cs = vec2(1.9, 3.1), cell = floor(f / cs), g = fract(f / cs);
        float win = step(0.16, g.x) * step(g.x, 0.84) * step(0.2, g.y) * step(g.y, 0.72);
        float h = hash(cell + vR * 91.7);
        float band = step(0.55, hash(vec2(cell.y, vR * 13.0)));
        float lit = step(0.6, h) * win * side * mix(0.35, 1.0, band);
        float flick = 0.8 + 0.2 * sin(uTime * (1.5 + h * 5.0) + h * 40.0);
        vec3 warm = mix(vec3(1.0, 0.58, 0.22), vec3(1.0, 0.86, 0.66), fract(h * 7.3));
        vec3 wc = mix(warm, vec3(0.5, 0.78, 1.0), step(0.88, fract(h * 13.1)));
        float hgt = clamp((vW.y + 60.0) / 210.0, 0.0, 1.0);
        vec3 facade = mix(vec3(0.012, 0.016, 0.028), vec3(0.05, 0.06, 0.09), hgt) * (0.7 + 0.3 * abs(n.x));
        vec3 col = facade + wc * lit * 2.2 * flick;
        col += step(0.5, n.y) * vec3(0.04, 0.05, 0.08);
        col += vec3(1.0, 0.86, 0.7) * glowAt(vW, 20.0) * 0.18;
        gl_FragColor = vec4(fogIt(col, vD), 1.0);
    }
`;

function addTowers(scene: THREE.Scene, route: Route, s: Shared, rand: () => number): void {
    const transforms: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion();
    for (let k = -13; k <= 13; k++)
        for (let j = 0; j < 24; j++) {
            const x = k * GRID + (rand() - 0.5) * 3;
            const z = -326 - j * GRID + (rand() - 0.5) * 3;
            if (route.near(x, 0, z, true) < 17) continue;
            const h = 22 + Math.pow(rand(), 1.8) * 175 * (1 - (Math.abs(x) / 240) * 0.5);
            const pos = new THREE.Vector3(x, FLOOR + h / 2, z);
            transforms.push(
                new THREE.Matrix4().compose(pos, q, new THREE.Vector3(8 + rand() * 5, h, 8 + rand() * 5))
            );
        }
    scene.add(boxes(shader(s, INSTANCED_VERT, TOWER_FRAG), transforms, rand));
}

function addStreets(scene: THREE.Scene, s: Shared): void {
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(700, 600).rotateX(-Math.PI / 2),
        shader(
            s,
            /* glsl */ `varying vec3 vW; varying float vD;
            void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
            /* glsl */ `varying vec3 vW; varying float vD;
            void main() {
                vec2 q = abs(fract((vW.xz - 9.0) / 18.0) - 0.5) * 18.0;
                float lane = smoothstep(0.45, 0.0, min(q.x, q.y));
                vec3 col = vec3(0.008, 0.011, 0.02) + vec3(0.25, 0.4, 0.75) * lane * 0.12;
                vec3 lp = vec3(uPacket.x, vW.y, uPacket.z);
                col += vec3(1.0, 0.75, 0.5) * exp(-dot(vW - lp, vW - lp) / 900.0) * 0.12;
                gl_FragColor = vec4(fogIt(col, vD), 1.0);
            }`
        )
    );
    floor.position.set(0, FLOOR, -530);
    scene.add(floor);
}

/** Other requests driving the streets: white heading one way, red the other. */
function addTraffic(scene: THREE.Scene, s: Shared, density: number, rand: () => number): void {
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
            base.set([(Math.floor(rand() * 26) - 13) * GRID + 9 + fwd * 1.6, FLOOR + 0.6, -530], i * 3);
            dir.set([0, 0, fwd], i * 3);
            sp.set([8 + rand() * 22, 430], i * 2);
        } else {
            base.set([0, FLOOR + 0.6, -326 - Math.floor(rand() * 23) * GRID - 9 + fwd * 1.6], i * 3);
            dir.set([fwd, 0, 0], i * 3);
            sp.set([8 + rand() * 22, 480], i * 2);
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
            /* glsl */ `attribute vec3 aBase, aDir, aCol; attribute vec2 aSp; varying vec3 vC; varying float vD;
            void main() {
                vec3 d = vec3(aDir.x, 0.0, aDir.z);
                vec3 lp = (abs(d.x) > 0.5 ? position.zyx : position) * vec3(0.35, 0.18, 2.2);
                float s = mod(uTime * aSp.x + aDir.y, aSp.y) - aSp.y * 0.5;
                vC = aCol;
                vec4 mv = viewMatrix * vec4(aBase + d * s + lp, 1.0);
                vD = -mv.z;
                gl_Position = projectionMatrix * mv;
            }`,
            /* glsl */ `varying vec3 vC; varying float vD; void main() { gl_FragColor = vec4(fogIt(vC, vD), 1.0); }`
        )
    );
    cars.frustumCulled = false;
    scene.add(cars);
}

/** 2 · Edge: a night city of servers the route weaves through. */
export function addCity(
    scene: THREE.Scene,
    route: Route,
    s: Shared,
    density: number,
    rand: () => number
): void {
    addTowers(scene, route, s, rand);
    addStreets(scene, s);
    addTraffic(scene, s, density, rand);
}
