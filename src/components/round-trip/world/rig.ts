import * as THREE from 'three';

import { clamp } from '@/components/round-trip/math';
import type { Route } from '@/components/round-trip/world/route';

export type Rig = {
    /** Follows the ship (banking into turns, widening with speed, punching out on a jump). */
    update: (
        u: number,
        t: number,
        dt: number,
        speed: number,
        jump: number,
        pointer: { x: number; y: number },
        /** Over land or sea (not in space): tall screens look down at it. */
        ground: boolean
    ) => void;
};

export function createRig(
    camera: THREE.PerspectiveCamera,
    route: Route,
    small: boolean,
    reduce: boolean
): Rig {
    const look = new THREE.Vector3();
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
        t: number,
        dt: number,
        speed: number,
        jump: number,
        pointer: { x: number; y: number },
        ground: boolean
    ): void => {
        px += (pointer.x - px) * 0.05;
        py += (pointer.y - py) * 0.05;
        const back = clamp(u - 10 / route.len);
        route.curve.getPointAt(back, camera.position);
        camera.position.addScaledVector(route.frame(back).n1, px * 1.4);
        camera.position.y += 1.8 - py * 0.9 + (u < route.seg[1] + 0.002 ? Math.sin(t * 0.6) * 0.3 : 0);
        route.curve.getPointAt(clamp(u + 28 / route.len), look);
        // Tall screens: the text sits low, so ride higher and look down to fill the top with land.
        if (camera.aspect < 1 && ground) {
            camera.position.y += 5;
            look.y -= 5;
        }
        camera.up.set(0, 1, 0);
        camera.lookAt(look);
        // Look around a little with the mouse or the phone's tilt; shake through a jump.
        const shake = reduce ? 0 : jump * jump * 0.012;
        camera.rotateY(-px * 0.1 + Math.sin(t * 53) * shake);
        camera.rotateX(-py * 0.06 + Math.sin(t * 47 + 1) * shake);

        route.curve.getTangentAt(clamp(u), t0);
        route.curve.getTangentAt(clamp(u + 0.025), t1);
        const turn = t0.x * t1.z - t0.z * t1.x;
        roll += (clamp(-turn * 5, -0.32, 0.32) * (reduce ? 0 : 1) - roll) * ease(dt, 3);
        camera.rotateZ(roll);

        fov += (base + (reduce ? 0 : speed * 16 + jump * 38) - fov) * ease(dt, jump > 0.05 ? 14 : 5);
        camera.fov = fov;
        camera.updateProjectionMatrix();
    };
    return { update };
}
