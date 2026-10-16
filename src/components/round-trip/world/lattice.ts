import * as THREE from 'three';

import { smooth } from '@/components/round-trip/math';
import { ADD, boxes, type Shared, shader } from '@/components/round-trip/world/gl';
import type { Route } from '@/components/round-trip/world/route';

/** Glass cells: bright edges, faint fill, a scan line that follows the request down. */
const VERT = /* glsl */ `
    attribute float aRand; attribute float aHot;
    varying vec3 vL, vW; varying float vR, vD, vH;
    void main() {
        vL = position; vR = aRand; vH = aHot;
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vec4 mv = viewMatrix * w;
        vD = -mv.z;
        gl_Position = projectionMatrix * mv;
    }
`;
const FRAG = /* glsl */ `
    varying vec3 vL, vW; varying float vR, vD, vH;
    void main() {
        vec3 a = abs(vL) * 2.0;
        float e1 = smoothstep(0.82, 0.97, a.x), e2 = smoothstep(0.82, 0.97, a.y), e3 = smoothstep(0.82, 0.97, a.z);
        float edge = max(max(e1 * e2, e2 * e3), e1 * e3);
        float occ = step(0.82, vR);
        float scan = exp(-pow((vW.y - uScan) / 3.5, 2.0));
        vec3 c = mix(vec3(0.35, 0.85, 1.0), vec3(0.7, 0.6, 1.0), step(0.94, vR));
        vec3 col = c * (0.02 + edge * (0.22 + occ * 0.9)) + c * scan * (0.08 + edge * 1.2) * (0.4 + occ);
        col += vec3(0.9, 0.97, 1.0) * glowAt(vW, 10.0) * (0.05 + edge * 0.6);
        col += vec3(1.0) * vH * (0.25 + edge * 3.0);
        gl_FragColor = vec4(col * fade(vD), 1.0);
    }
`;

export type Records = {
    points: THREE.Vector3[];
    /** Lights each record as the request passes; passed records stay half lit. */
    update: (packet: THREE.Vector3, u: number) => void;
};

function addCells(scene: THREE.Scene, route: Route, s: Shared, small: boolean, rand: () => number): void {
    const step = small ? 13 : 9.5;
    const transforms: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion();
    for (let x = -66; x <= 66; x += step)
        for (let y = -236; y <= 28; y += step)
            for (let z = -1032; z >= -1345; z -= step) {
                if (rand() > 0.5 || route.near(x, y, z) < 10) continue;
                const k = 1.6 + rand() * 1.2;
                const pos = new THREE.Vector3(x + (rand() - 0.5) * 1.5, y, z);
                transforms.push(new THREE.Matrix4().compose(pos, q, new THREE.Vector3(k, k, k)));
            }
    const mesh = boxes(shader(s, VERT, FRAG, {}, ADD), transforms, rand);
    mesh.geometry.setAttribute(
        'aHot',
        new THREE.InstancedBufferAttribute(new Float32Array(transforms.length), 1)
    );
    scene.add(mesh);
}

/** 4 · Data: a lattice of records around the dive; one bigger cell per role, beside the path. */
export function addLattice(
    scene: THREE.Scene,
    route: Route,
    s: Shared,
    us: number[],
    small: boolean,
    rand: () => number
): Records {
    addCells(scene, route, s, small, rand);
    const points = us.map((u, k) => {
        const { n1 } = route.frame(u);
        return route.curve
            .getPointAt(u)
            .addScaledVector(n1, k % 2 ? -9 : 9)
            .add(new THREE.Vector3(0, 2, 0));
    });
    const q = new THREE.Quaternion();
    const size = new THREE.Vector3(3.4, 3.4, 3.4);
    const mesh = boxes(
        shader(s, VERT, FRAG, {}, ADD),
        points.map((p) => new THREE.Matrix4().compose(p, q, size)),
        () => 0.9
    );
    const hot = new THREE.InstancedBufferAttribute(new Float32Array(points.length), 1);
    hot.setUsage(THREE.DynamicDrawUsage);
    mesh.geometry.setAttribute('aHot', hot);
    scene.add(mesh);
    const update = (packet: THREE.Vector3, u: number): void => {
        points.forEach((p, k) =>
            hot.setX(k, Math.max(smooth(40, 6, packet.distanceTo(p)) * 1.6, u > us[k] ? 0.45 : 0))
        );
        hot.needsUpdate = true;
    };
    return { points, update };
}
