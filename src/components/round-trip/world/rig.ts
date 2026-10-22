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
        ground: boolean,
        /** The shot: `tilt` pitches the camera down (radians, negative = up); `lift` raises it. */
        shot: Shot
    ) => void;
};

/**
 * Where the camera stands for a place, relative to the ship's path: each place has its own shot,
 * and the world blends between them under the jumps and dips so the change is never seen.
 */
export type Framing = {
    /** Across the path (world units; + is the ship's side, - stands off to the other side). */
    side: number;
    /** Up from the usual height just above the ship (negative: low, looking up at it). */
    up: number;
    /** How far behind the ship. */
    back: number;
    /** How far ahead it looks, how far above the path (negative: down), and how far across. */
    ahead: number;
    look: number;
    aim: number;
    /** Multiplies the field of view: under 1 is a long lens, over 1 a wide one. */
    lens: number;
};

/** Behind and a little above the ship, looking down the path. */
export const CHASE: Framing = { side: 0, up: 0, back: 10, ahead: 28, look: 0, aim: 0, lens: 1 };

export type Shot = {
    /** The place's framing, already blended by the caller. */
    frame: Framing;
    tilt: number;
    lift: number;
    shake: number;
    /** 0–1, eased: the visitor boosting: the frame widens and drops back a little. */
    boost: number;
    /** 0–1, eased: the visitor is still: the frame breathes, a slow sway and rise. */
    idle: number;
};

const softened: Framing = { ...CHASE };
/** The framing `k` of the way from the chase towards `fr` (into a shared scratch object). */
function soften(fr: Framing, k: number): Framing {
    for (const key of Object.keys(CHASE) as Array<keyof Framing>) {
        softened[key] = CHASE[key] + (fr[key] - CHASE[key]) * k;
    }
    return softened;
}

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
    let tilt = 0;
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
        ground: boolean,
        shot: Shot
    ): void => {
        // Parallax and the hover bob are decoration: none with reduced motion, same pace at any refresh rate.
        const still = reduce ? 0 : 1;
        px += (pointer.x * still - px) * ease(dt, 3);
        py += (pointer.y * still - py) * ease(dt, 3);
        // Tall screens are narrow and the text sits low: a shot from the side would push the ship
        // out of frame and a crane would sink it behind the panel, so they get a hint of each shot.
        const fr = camera.aspect < 1 ? soften(shot.frame, 0.3) : shot.frame;
        const back = clamp(u - (fr.back + shot.boost * 3 * still) / route.len);
        route.curve.getPointAt(back, camera.position);
        camera.position.addScaledVector(route.frame(back).n1, px * 1.4 + fr.side);
        camera.position.y +=
            1.8 + fr.up - py * 0.9 + (u < route.seg[1] + 0.002 ? Math.sin(t * 0.6) * 0.3 * still : 0);
        // Lifted (coming down onto the city, or climbing off the ice), it looks further ahead, down
        // at the path. Past the end of the route the look point carries on along the last tangent.
        camera.position.y += shot.lift + shot.idle * Math.sin(t * 0.13) * 0.4 * still;
        const ahead = (fr.ahead + Math.max(0, shot.lift) * 1.6) / route.len;
        route.curve.getPointAt(clamp(u + ahead), look);
        look.addScaledVector(route.frame(clamp(u + ahead)).n1, fr.aim);
        look.y += fr.look;
        // Dropped below the path (skimming the sea), it keeps looking level, not up at the path.
        look.y += Math.min(0, shot.lift);
        if (u + ahead > 1) look.addScaledVector(route.curve.getTangentAt(1, t1), (u + ahead - 1) * route.len);
        // Tall screens: the text sits low, so ride higher and look down to fill the top with land,
        // keeping the ship in the upper half, above the panel, whatever the place's shot.
        if (camera.aspect < 1 && ground) {
            camera.position.y += 5;
            look.y -= 9;
        }
        camera.up.set(0, 1, 0);
        camera.lookAt(look);
        // Pitch for the dive onto Earth and the climb back out, eased so the cut never snaps it.
        tilt += (shot.tilt - tilt) * ease(dt, 4);
        camera.rotateX(-tilt);
        // Look around a little with the mouse or the phone's tilt; shake through a jump.
        const shake = reduce ? 0 : jump * jump * 0.006 + shot.shake;
        camera.rotateY(-px * 0.1 + Math.sin(t * 53) * shake + shot.idle * Math.sin(t * 0.21) * 0.06 * still);
        camera.rotateX(-py * 0.06 + Math.sin(t * 47 + 1) * shake);

        route.curve.getTangentAt(clamp(u), t0);
        route.curve.getTangentAt(clamp(u + 0.025), t1);
        const turn = t0.x * t1.z - t0.z * t1.x;
        roll += (clamp(-turn * 5, -0.32, 0.32) * (reduce ? 0 : 1) - roll) * ease(dt, 3);
        camera.rotateZ(roll);

        // The jump's punch outwards: enough to feel the boost, not so much that the frame warps.
        fov +=
            (base * fr.lens + (reduce ? 0 : speed * 16 + jump * 19 + shot.boost * 6) - fov) *
            ease(dt, jump > 0.05 ? 14 : 5);
        camera.fov = fov;
        camera.updateProjectionMatrix();
    };
    return { update };
}
