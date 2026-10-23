import * as THREE from 'three';

import { smooth } from '@/components/round-trip/math';
import { ADD, type Shared, shader } from '@/components/round-trip/world/gl';
import type { Route } from '@/components/round-trip/world/route';
import { SEA } from '@/components/round-trip/world/sea';

const H = 120;
const W = 18;

/**
 * Light pillars, as cold nights make them: a column of light standing over a point of light,
 * glittering where ice crystals catch it, fading upward. One per role.
 */
const PILLAR_VERT = /* glsl */ `
    attribute vec3 aBase; attribute float aHot, aRand;
    varying vec2 vP; varying float vHot, vR, vD;
    void main() {
        vP = position.xy; vHot = aHot; vR = aRand;
        vec2 dir = normalize(cameraPosition.xz - aBase.xz);
        vec3 right = vec3(dir.y, 0.0, -dir.x);
        vec3 w = aBase + right * position.x * ${W.toFixed(1)} + vec3(0.0, position.y * ${H.toFixed(1)}, 0.0);
        vec4 mv = viewMatrix * vec4(w, 1.0);
        vD = -mv.z;
        gl_Position = projectionMatrix * mv;
    }
`;
const PILLAR_FRAG = /* glsl */ `
    varying vec2 vP; varying float vHot, vR, vD;
    void main() {
        float x = vP.x * 2.0;
        float core = exp(-x * x * 40.0);
        float halo = exp(-x * x * 3.5);
        float rise = pow(1.0 - vP.y, 1.3) * smoothstep(0.0, 0.03, vP.y);
        float shimmer = 0.75 + 0.25 * vnoise(vec2(vP.y * 40.0 + vR * 9.0, uTime * 1.2));
        // Ice crystals: a few cells hold one soft, round, twinkling point (a whole lit cell reads as a pixel).
        vec2 gc = vec2(vP.x * 30.0, vP.y * 220.0 - uTime * 3.0) + vR * 17.0;
        float seed = hash(floor(gc));
        float glint = smoothstep(0.42, 0.0, length(fract(gc) - 0.5));
        float glitter = step(0.93, seed) * glint * glint * (0.6 + 0.4 * sin(uTime * 6.0 + seed * 40.0));
        vec3 tint = mix(vec3(0.75, 0.9, 1.0), vec3(1.0, 0.95, 0.85), vR);
        vec3 col = tint * (core * 0.7 + halo * 0.16 + glitter * halo * 0.5) * rise * shimmer;
        gl_FragColor = vec4(col * vHot * fade(vD * 0.6), 1.0);
    }
`;

/** The light's broken reflection laid across the water towards the viewer. */
const STREAK_VERT = /* glsl */ `
    attribute vec3 aBase; attribute float aHot, aRand;
    varying vec2 vP; varying float vHot, vR, vD;
    void main() {
        vP = position.xy; vHot = aHot; vR = aRand;
        vec2 dir = normalize(cameraPosition.xz - aBase.xz);
        vec3 right = vec3(dir.y, 0.0, -dir.x);
        vec3 w = aBase + right * position.x * 6.0 + vec3(dir.x, 0.0, dir.y) * position.y * 70.0;
        w.y = ${(SEA + 0.15).toFixed(2)};
        vec4 mv = viewMatrix * vec4(w, 1.0);
        vD = -mv.z;
        gl_Position = projectionMatrix * mv;
    }
`;
const STREAK_FRAG = /* glsl */ `
    varying vec2 vP; varying float vHot, vR, vD;
    void main() {
        float x = vP.x * 2.0;
        float across = exp(-x * x * 8.0);
        float along = pow(1.0 - vP.y, 2.0);
        float broken = smoothstep(0.45, 0.7, vnoise(vec2(vP.x * 6.0, vP.y * 60.0 - uTime * 0.8) + vR * 5.0));
        vec3 col = vec3(0.8, 0.9, 1.0) * across * along * broken * 1.2;
        gl_FragColor = vec4(col * vHot * fade(vD), 1.0);
    }
`;

export type Records = {
    /** Where each role's label sits (a little above its pillar's base). */
    points: THREE.Vector3[];
    /** Flares each pillar as the ship passes; passed ones stay lit, the rest glow faintly. */
    update: (ship: THREE.Vector3, u: number) => void;
};

function quads(
    geo: THREE.BufferGeometry,
    bases: THREE.Vector3[],
    hot: THREE.InstancedBufferAttribute,
    rand: number[]
) {
    const g = new THREE.InstancedBufferGeometry();
    g.setIndex(geo.index);
    g.setAttribute('position', geo.getAttribute('position'));
    g.setAttribute(
        'aBase',
        new THREE.InstancedBufferAttribute(new Float32Array(bases.flatMap((b) => [b.x, b.y, b.z])), 3)
    );
    g.setAttribute('aHot', hot);
    g.setAttribute('aRand', new THREE.InstancedBufferAttribute(new Float32Array(rand), 1));
    g.instanceCount = bases.length;
    return g;
}

/** 4 · Data: one light pillar per role, standing out at sea (and on the ice) beside the path. */
export function addRecords(scene: THREE.Object3D, route: Route, s: Shared, us: number[]): Records {
    const bases = us.map((u, k) => {
        const { n1 } = route.frame(u);
        const p = route.curve.getPointAt(u).addScaledVector(n1, k % 2 ? -26 : 26);
        p.y = SEA;
        return p;
    });
    const points = bases.map((b) => b.clone().add(new THREE.Vector3(0, 30, 0)));
    const rand = us.map((_, k) => ((k * 0.618) % 1) * 0.6);
    const hot = new THREE.InstancedBufferAttribute(new Float32Array(us.length).fill(0.25), 1);
    hot.setUsage(THREE.DynamicDrawUsage);
    const column = new THREE.PlaneGeometry(1, 1, 1, 24).translate(0, 0.5, 0);
    const pillars = new THREE.Mesh(
        quads(column, bases, hot, rand),
        shader(s, PILLAR_VERT, PILLAR_FRAG, {}, { ...ADD, side: THREE.DoubleSide })
    );
    const streaks = new THREE.Mesh(
        quads(new THREE.PlaneGeometry(1, 1, 1, 24).translate(0, 0.5, 0), bases, hot, rand),
        shader(s, STREAK_VERT, STREAK_FRAG, {}, { ...ADD, side: THREE.DoubleSide })
    );
    // Points of light where each pillar meets the water.
    const sources = new THREE.Points(
        new THREE.BufferGeometry().setAttribute(
            'position',
            new THREE.Float32BufferAttribute(
                bases.flatMap((b) => [b.x, b.y + 0.6, b.z]),
                3
            )
        ),
        shader(
            s,
            /* glsl */ `attribute float aHot; varying float vHot, vD; void main() { vHot = aHot; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_PointSize = min(64.0, uPR * 2600.0 / vD); gl_Position = projectionMatrix * mv; }`,
            /* glsl */ `varying float vHot, vD; void main() { float d = length(gl_PointCoord - 0.5); float a = exp(-d * d * 60.0) + exp(-d * d * 12.0) * 0.25; gl_FragColor = vec4(vec3(0.9, 0.96, 1.0) * a * vHot * 2.0 * fade(vD), 1.0); }`,
            {},
            ADD
        )
    );
    sources.geometry.setAttribute('aHot', hot);
    [pillars, streaks, sources].forEach((m) => {
        m.frustumCulled = false;
        scene.add(m);
    });
    const update = (ship: THREE.Vector3, u: number): void => {
        bases.forEach((b, k) => {
            const near = smooth(160, 30, Math.hypot(ship.x - b.x, ship.z - b.z));
            hot.setX(k, Math.max(0.25, near * 1.1, u > us[k] ? 0.55 : 0));
        });
        hot.needsUpdate = true;
    };
    return { points, update };
}
