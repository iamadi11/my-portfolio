import * as THREE from 'three';

import { boxes, INSTANCED_VERT, type Shared, shader } from '@/components/round-trip/world/gl';
import type { Route } from '@/components/round-trip/world/route';

/** Pulses race forward along each fibre; only the pulses are bright enough to bloom. */
const FRAG = /* glsl */ `
    varying vec3 vW, vN, vL; varying float vR, vD;
    void main() {
        float ph = fract(vL.z - uTime * (0.25 + vR * 0.6) + vR * 7.0);
        float pulse = pow(ph, 9.0) * 4.5;
        vec3 base = mix(vec3(0.25, 0.6, 1.0), vec3(0.62, 0.45, 1.0), smoothstep(0.55, 1.0, vR));
        base = mix(base, vec3(1.0), step(0.93, vR));
        vec3 col = base * (0.05 + pulse) + vec3(0.85, 0.92, 1.0) * glowAt(vW, 6.0) * 0.5;
        gl_FragColor = vec4(fogIt(col, vD), 1.0);
    }
`;

/** 1 · Wire: a tunnel of light fibres wrapped around the first stretch of the route. */
export function addWire(
    scene: THREE.Scene,
    route: Route,
    s: Shared,
    density: number,
    rand: () => number
): void {
    const n = Math.round(2600 * density);
    const Z = new THREE.Vector3(0, 0, 1);
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const size = new THREE.Vector3();
    const transforms = Array.from({ length: n }, () => {
        const u = rand() * (route.seg[2] + 0.01);
        const { t, n1, n2 } = route.frame(u);
        const a = rand() * Math.PI * 2;
        const r = 3.2 + Math.pow(rand(), 1.7) * 20;
        pos.copy(route.curve.getPointAt(u))
            .addScaledVector(n1, Math.cos(a) * r)
            .addScaledVector(n2, Math.sin(a) * r);
        q.setFromUnitVectors(Z, t);
        const w = 0.035 + rand() * 0.08;
        size.set(w, w, 6 + rand() * 30);
        return new THREE.Matrix4().compose(pos, q, size);
    });
    scene.add(boxes(shader(s, INSTANCED_VERT, FRAG), transforms, rand));
}
