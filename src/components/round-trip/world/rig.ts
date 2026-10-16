import * as THREE from 'three';

import { clamp, lerp } from '@/components/round-trip/math';
import type { Route } from '@/components/round-trip/world/route';

export type Rig = {
    /** Follows the request (banking into turns, widening with speed), or pulls out to the map. */
    update: (
        u: number,
        map: number,
        t: number,
        dt: number,
        speed: number,
        pointer: { x: number; y: number }
    ) => void;
};

const MAP_LOOK = new THREE.Vector3(0, -50, -690);

export function createRig(
    camera: THREE.PerspectiveCamera,
    route: Route,
    small: boolean,
    reduce: boolean
): Rig {
    const pos = new THREE.Vector3();
    const look = new THREE.Vector3();
    const mapPos = new THREE.Vector3();
    const t0 = new THREE.Vector3();
    const t1 = new THREE.Vector3();
    const base = small ? 72 : 58;
    let roll = 0;
    let fov = base;
    let px = 0;
    let py = 0;
    const ease = (dt: number, rate: number): number => 1 - Math.exp(-dt * rate);

    const update = (
        u: number,
        map: number,
        t: number,
        dt: number,
        speed: number,
        pointer: { x: number; y: number }
    ): void => {
        px += (pointer.x - px) * 0.05;
        py += (pointer.y - py) * 0.05;
        const back = clamp(u - 10 / route.len);
        route.curve.getPointAt(back, pos);
        pos.addScaledVector(route.frame(back).n1, px * 1.4);
        pos.y += 1.8 - py * 0.9 + (u < route.seg[1] + 0.002 ? Math.sin(t * 0.6) * 0.3 : 0);
        route.curve.getPointAt(clamp(u + 28 / route.len), look);

        // Portrait screens look down the long axis so the whole route fits.
        if (camera.aspect < 1) mapPos.set(150, 1150, 230);
        else mapPos.set(860, 540, 140);
        camera.position.lerpVectors(pos, mapPos, map);
        look.lerp(MAP_LOOK, map);
        camera.up.set(0, 1, 0);
        camera.lookAt(look);
        // Look around a little with the mouse or the phone's tilt.
        camera.rotateY(-px * 0.1 * (1 - map));
        camera.rotateX(-py * 0.06 * (1 - map));

        route.curve.getTangentAt(clamp(u), t0);
        route.curve.getTangentAt(clamp(u + 0.025), t1);
        const turn = t0.x * t1.z - t0.z * t1.x;
        roll += (clamp(-turn * 5, -0.32, 0.32) * (1 - map) * (reduce ? 0 : 1) - roll) * ease(dt, 3);
        camera.rotateZ(roll);

        fov += (lerp(base + (reduce ? 0 : speed * 16), small ? 46 : 38, map) - fov) * ease(dt, 5);
        camera.fov = fov;
        camera.updateProjectionMatrix();
    };
    return { update };
}
