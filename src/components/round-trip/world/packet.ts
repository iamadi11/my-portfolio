import * as THREE from 'three';

import { clamp } from '@/components/round-trip/math';
import { ADD, type Shared, shader } from '@/components/round-trip/world/gl';
import type { Route } from '@/components/round-trip/world/route';

const TRAIL = 120;

function glowTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.18, 'rgba(255,255,255,.8)');
    gr.addColorStop(0.45, 'rgba(255,255,255,.16)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

export type Glow = (scale: number, colour: THREE.Color, opacity?: number) => THREE.Sprite;

export function glowMaker(scene: THREE.Scene): Glow {
    const map = glowTexture();
    return (scale, colour, opacity = 1) => {
        const s = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map,
                color: colour,
                opacity,
                fog: false,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            })
        );
        s.scale.setScalar(scale);
        scene.add(s);
        return s;
    };
}

export type Packet = {
    /** Moves the request to u, tints it, and hides it once the map takes over. */
    update: (u: number, colour: THREE.Color, speed: number, t: number, map: number) => THREE.Vector3;
};

/** The request: a hot core, a halo, a light that lights the world as it passes, and a trail. */
export function addPacket(scene: THREE.Scene, route: Route, s: Shared, glow: Glow): Packet {
    const core = glow(1.3, new THREE.Color(5, 5, 5));
    const halo = glow(4.5, new THREE.Color('#8fd3ff'), 0.28);
    const light = new THREE.PointLight(0xdfe9ff, 700, 0, 2);
    scene.add(light);

    const pos = new Float32Array(TRAIL * 3);
    const order = new Float32Array(TRAIL).map((_, i) => i / (TRAIL - 1));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aI', new THREE.BufferAttribute(order, 1));
    const tint = { value: new THREE.Color('#8fd3ff') };
    const trail = new THREE.Points(
        geo,
        shader(
            s,
            /* glsl */ `attribute float aI; varying float vI;
            void main() { vI = aI; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(26.0, uPR * (0.15 + aI) * 110.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
            /* glsl */ `uniform vec3 uCol; varying float vI;
            void main() { float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(uCol * a * vI * vI * 0.55, 1.0); }`,
            { uCol: tint },
            ADD
        )
    );
    trail.frustumCulled = false;
    scene.add(trail);

    const p = new THREE.Vector3();
    const q = new THREE.Vector3();
    const white = new THREE.Color('#ffffff');
    const lit = new THREE.Color();
    const update = (u: number, colour: THREE.Color, speed: number, t: number, map: number): THREE.Vector3 => {
        route.curve.getPointAt(u, p);
        core.position.copy(p);
        halo.position.copy(p);
        light.position.copy(p);
        for (let j = 0; j < TRAIL; j++) {
            route.curve.getPointAt(clamp(u - (1 - order[j]) * (36 / route.len)), q);
            pos.set([q.x, q.y, q.z], j * 3);
        }
        geo.attributes.position.needsUpdate = true;
        halo.material.color.lerp(colour, 0.06);
        tint.value.lerp(colour, 0.06);
        light.color.lerp(lit.copy(colour).lerp(white, 0.5), 0.06);
        light.intensity = 700 * (1 - map);
        core.scale.setScalar(1.3 + Math.sin(t * 3) * 0.12 + speed * 0.8);
        core.visible = halo.visible = trail.visible = map < 0.98;
        s.uPacket.value.copy(p);
        return p;
    };
    return { update };
}

/** Dust drifting around the whole route: depth and parallax everywhere. */
export function addDust(
    scene: THREE.Scene,
    route: Route,
    s: Shared,
    density: number,
    rand: () => number
): void {
    const n = Math.round(3000 * density);
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const seed = new Float32Array(n);
    const d = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
        const p = route.curve.getPointAt(rand());
        d.set(rand() - 0.5, rand() - 0.5, rand() - 0.5)
            .normalize()
            .multiplyScalar(4 + Math.pow(rand(), 0.8) * 70);
        pos.set([p.x + d.x, p.y + d.y, p.z + d.z], i * 3);
        size[i] = 0.6 + rand() * 1.8;
        seed[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aRand', new THREE.BufferAttribute(seed, 1));
    const pts = new THREE.Points(
        g,
        shader(
            s,
            /* glsl */ `attribute float aSize, aRand; varying float vA, vD;
            void main() {
                vec4 mv = modelViewMatrix * vec4(position + vec3(0.0, sin(uTime * 0.3 + aRand * 20.0) * 0.8, 0.0), 1.0);
                vD = -mv.z;
                gl_PointSize = min(14.0, aSize * uPR * 30.0 / vD);
                vA = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * (0.6 + aRand) + aRand * 30.0));
                gl_Position = projectionMatrix * mv;
            }`,
            /* glsl */ `varying float vA, vD;
            void main() { float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vec3(0.75, 0.86, 1.0) * a * vA * 0.32 * fade(vD), 1.0); }`,
            {},
            ADD
        )
    );
    pts.frustumCulled = false;
    scene.add(pts);
}
