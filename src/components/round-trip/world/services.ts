import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { smooth } from '@/components/round-trip/math';
import { type Shared, shader } from '@/components/round-trip/world/gl';
import type { Glow } from '@/components/round-trip/world/glow';
import { GROUND, LANDS, POOL } from '@/components/round-trip/world/land';
import type { Route } from '@/components/round-trip/world/route';

/**
 * The portal's event horizon: energy swirling inward in the project's colour, brightest at the
 * rim, with a dark throat. It forms as the ship comes close and flashes as the ship crosses.
 */
const HORIZON_FRAG = /* glsl */ `
    uniform vec3 uCol, uNext; uniform float uOn, uFlash; varying vec2 vUv; varying vec3 vW; varying float vD;
    // The sky of the place beyond, looked up by direction (so it sits at infinity, like a window):
    // its horizon colour low down, near-black overhead, a few stars.
    vec3 beyond(vec3 d) {
        vec3 hz = uNext * 2.6 + 0.01;
        vec3 c = mix(hz, vec3(0.004, 0.007, 0.018), smoothstep(0.0, 0.5, d.y));
        c = mix(c, hz * 0.35, smoothstep(0.0, -0.12, d.y));
        vec2 sp = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0))) * 110.0;
        vec2 id = floor(sp);
        float star = step(0.965, hash(id)) * smoothstep(0.28, 0.0, length(fract(sp) - 0.5));
        return c + vec3(0.9, 0.95, 1.0) * star * (0.4 + 1.2 * hash(id + 7.3)) * smoothstep(0.02, 0.25, d.y);
    }
    void main() {
        vec2 c = vUv - 0.5;
        float r = max(length(c) * 2.0, 1e-3);
        float a = atan(c.y, c.x) / 6.2831853;
        // Spiral arms wound in log-polar space, drifting inward; fine streaks ride on them.
        vec2 sp = vec2(a * 3.0 + log(r) * 0.9 + uTime * 0.12, log(r) * 1.6 - uTime * 0.35);
        float arms = smoothstep(0.42, 0.78, fbm(sp * vec2(2.0, 1.4)));
        float streaks = smoothstep(0.55, 0.9, fbm(sp * vec2(7.0, 3.0) + 3.1));
        float depth = mix(0.15, 1.0, smoothstep(0.05, 0.75, r));
        float rim = pow(smoothstep(0.8, 0.995, r), 3.0);
        float inside = 1.0 - smoothstep(0.985, 1.0, r);
        // Kept dim inside: up close the disc fills the frame, and it must not wash the scene out.
        vec3 col = uCol * ((arms * 0.22 + streaks * 0.38) * depth + rim * 1.1);
        col += mix(uCol, vec3(1.0), 0.5) * streaks * arms * depth * 0.1;
        // Premultiplied: the throat covers the scene behind with the sky beyond; the swirl adds light.
        float alpha = 0.85 * uOn * inside * fade(vD);
        vec3 glow = col * uOn + mix(uCol, vec3(1.0), 0.5) * uFlash * (1.0 - r * 0.6);
        gl_FragColor = vec4(beyond(normalize(vW - cameraPosition)) * alpha + glow * inside * fade(vD), alpha);
    }
`;

/** Premultiplied alpha: the disc covers what is behind it (rgb already scaled by alpha), and adds light. */
const WINDOW: THREE.ShaderMaterialParameters = {
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
};

type Portal = {
    u: number;
    center: THREE.Vector3;
    /** The gateway's own group, its light strip and its event horizon. */
    g: THREE.Group;
    strip: THREE.Mesh;
    disc: THREE.Mesh;
    glow: THREE.MeshBasicMaterial;
    /** A lighthouse in the project's colour, so the gate is something to aim at from far off. */
    beacon: THREE.Sprite;
    horizon: { uOn: THREE.IUniform<number>; uFlash: THREE.IUniform<number> };
    colour: THREE.Color;
    near: number;
    passed: boolean;
};

export type Rings = {
    centers: THREE.Vector3[];
    /** 0–1: how hard the ship is rushing at the portal ahead (set by `update`). */
    rush: number;
    /** 0–1: how close the ship is to the portal on screen, before or after it. */
    close: number;
    /** Advances the portals, showing only `show` (the current landscape's exit; -1 for none). */
    update: (u: number, t: number, dt: number, show: number) => number | null;
};

/** The gateway model: its ring is 5 m across, centred 2.5 m above its base. */
const RING_Y = 2.5;
/** Fallback inner radius of the ring (m) until the model has been measured. */
const INNER = 2.05;

/** Inner radius of the gateway's ring, measured from its own vertices (in metres). */
function innerRadius(model: THREE.Object3D): number {
    let best = Infinity;
    const v = new THREE.Vector3();
    model.updateMatrixWorld(true);
    model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || !/portal_main/.test(m.name)) return;
        const p = m.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
            v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
            if (Math.abs(v.z) < 0.4) best = Math.min(best, Math.hypot(v.x, v.y - RING_Y));
        }
    });
    return Number.isFinite(best) ? best : INNER;
}

/**
 * 3 · Services: one gateway per project ("Sci-Fi Portal Gateway" by Igrium, CC BY 4.0), standing
 * on the ground of that project's landscape and sized so the ship flies through the middle of its
 * ring. A strip of light in the project's colour lines the ring; the event horizon fills it.
 */
export function addRings(
    scene: THREE.Object3D,
    s: Shared,
    route: Route,
    colours: string[],
    us: number[],
    small: boolean,
    glowAt: Glow,
    next: THREE.Color[] = []
): Rings {
    const portals: Portal[] = colours.map((c, k) => {
        const center = route.curve.getPointAt(us[k]);
        const tangent = route.curve.getTangentAt(us[k]);
        // Big enough to stand on this landscape's ground with its ring around the path.
        const scale = Math.max(4, (center.y - GROUND[LANDS[k % LANDS.length]]) / RING_Y) * 1.05;
        const g = new THREE.Group();
        g.position.copy(center).add(new THREE.Vector3(0, -RING_Y * scale, 0));
        g.lookAt(g.position.clone().sub(tangent.setY(0)));
        g.scale.setScalar(scale);
        scene.add(g);
        const glow = new THREE.MeshBasicMaterial({ color: c });
        const strip = new THREE.Mesh(new THREE.TorusGeometry(INNER, 0.025, 8, 160), glow);
        strip.position.y = RING_Y;
        const horizon = { uOn: { value: 0 }, uFlash: { value: 0 } };
        const beyond = next[k] ?? new THREE.Color(0.03, 0.045, 0.08);
        const disc = new THREE.Mesh(
            new THREE.CircleGeometry(INNER, 128),
            shader(
                s,
                /* glsl */ `varying vec2 vUv; varying vec3 vW; varying float vD; void main() { vUv = uv; vW = (modelMatrix * vec4(position, 1.0)).xyz; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
                HORIZON_FRAG,
                { uCol: { value: new THREE.Color(c) }, uNext: { value: beyond.clone() }, ...horizon },
                { ...WINDOW, side: THREE.DoubleSide }
            )
        );
        disc.position.y = RING_Y;
        g.add(strip, disc);
        const beacon = glowAt(6, new THREE.Color(c), 0.85);
        beacon.position.copy(center);
        beacon.visible = false;
        return {
            u: us[k],
            center,
            g,
            strip,
            disc,
            glow,
            beacon,
            horizon,
            colour: new THREE.Color(c),
            near: 0,
            passed: false,
        };
    });

    new GLTFLoader()
        .setMeshoptDecoder(MeshoptDecoder)
        .loadAsync(small ? '/models/portal-1k.glb' : '/models/portal.glb')
        .then((gltf) => {
            const inner = innerRadius(gltf.scene);
            gltf.scene.traverse((o) => {
                const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
                if (!m?.isMeshStandardMaterial) return;
                m.envMapIntensity = 0.6;
                // Brushed, not polished: a mirror finish throws glints that bloom into white blobs.
                m.roughness = Math.max(m.roughness, 0.45);
            });
            for (const p of portals as Array<
                Portal & { strip: THREE.Mesh; disc: THREE.Mesh; g: THREE.Group }
            >) {
                p.g.add(gltf.scene.clone());
                p.strip.scale.setScalar(inner / INNER);
                p.disc.scale.setScalar((inner * 0.99) / INNER);
            }
        })
        .catch(() => undefined);

    // The gate lights the ground at its foot as it opens.
    const pool = (p: Portal): void => {
        const r = RING_Y * p.g.scale.x * 0.9;
        POOL.uPool.value.set(p.g.position.x, p.g.position.y, p.g.position.z, r * p.horizon.uOn.value);
        POOL.uPoolCol.value.copy(p.colour).multiplyScalar(0.6);
    };
    const rings: Rings = { centers: portals.map((p) => p.center), rush: 0, close: 0, update: () => null };
    const update = (u: number, _t: number, dt: number, show: number): number | null => {
        let hit: number | null = null;
        rings.rush = 0;
        rings.close = 0;
        POOL.uPool.value.w = 0;
        portals.forEach((p, k) => {
            p.g.visible = k === show;
            // The run-up: the last 90 m before the ring, building until the ship is through.
            if (k === show && u < p.u) rings.rush = smooth(90, 8, (p.u - u) * route.len);
            const d = Math.abs(u - p.u) * route.len;
            if (k === show) rings.close = smooth(60, 12, d);
            p.near += (smooth(400, 40, d) - p.near) * (1 - Math.exp(-dt * 4));
            // The beacon holds its size on screen from far off and fades as the ring takes over.
            p.beacon.visible = k === show && u < p.u;
            p.beacon.scale.setScalar(3 + d * 0.03);
            p.beacon.material.opacity = 0.85 * smooth(30, 120, d);
            p.glow.color.copy(p.colour).multiplyScalar(0.35 + p.near * 0.8);
            p.horizon.uOn.value = smooth(0.15, 0.85, p.near);
            if (k === show) pool(p);
            p.horizon.uFlash.value *= Math.exp(-dt * 3.5);
            if (!p.passed && u > p.u) {
                p.passed = true;
                p.horizon.uFlash.value = 0.45;
                hit = k;
            }
            if (u < p.u - 0.002) p.passed = false;
        });
        return hit;
    };
    rings.update = update;
    return rings;
}
