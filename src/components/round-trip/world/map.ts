import * as THREE from 'three';

import { ADD, type Shared, shader } from '@/components/round-trip/world/gl';
import type { Glow } from '@/components/round-trip/world/packet';
import type { Route } from '@/components/round-trip/world/route';

/** The route drawn as a tube, coloured by zone; the stretch the response has covered burns bright. */
const FRAG = /* glsl */ `
    uniform float uResp, uOp; varying float vU;
    void main() {
        vec3 c = mix(vec3(0.56, 0.83, 1.0), vec3(1.0, 0.7, 0.36), smoothstep(0.18, 0.4, vU));
        c = mix(c, vec3(1.0, 0.48, 0.85), smoothstep(0.45, 0.62, vU));
        c = mix(c, vec3(0.48, 0.94, 1.0), smoothstep(0.7, 0.85, vU));
        float back = step(uResp, vU);
        float head = exp(-pow((vU - uResp) * 60.0, 2.0));
        gl_FragColor = vec4(c * (0.35 + back * 1.4) * uOp + vec3(1.0) * head * 5.0 * uOp, 1.0);
    }
`;

export type RouteMap = { update: (map: number, resp: number) => void };

/** 5 · 200 OK: the whole route as a glowing map, with the response flying home along it. */
export function addMap(scene: THREE.Scene, route: Route, s: Shared, glow: Glow): RouteMap {
    const uResp = { value: 1 };
    const uOp = { value: 0 };
    const tube = new THREE.Mesh(
        new THREE.TubeGeometry(route.curve, 1400, 1.1, 6, false),
        shader(
            s,
            /* glsl */ `varying float vU; void main() { vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            FRAG,
            { uResp, uOp },
            ADD
        )
    );
    tube.frustumCulled = false;
    tube.visible = false;
    scene.add(tube);
    const response = glow(30, new THREE.Color(3.5, 3.5, 3.5));
    response.visible = false;
    const update = (map: number, resp: number): void => {
        tube.visible = response.visible = map > 0.01;
        uOp.value = map;
        uResp.value = resp;
        if (!response.visible) return;
        route.curve.getPointAt(resp, response.position);
        response.material.opacity = map;
    };
    return { update };
}
