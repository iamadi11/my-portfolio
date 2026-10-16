import * as THREE from 'three';

import { smooth } from '@/components/round-trip/math';
import type { Route } from '@/components/round-trip/world/route';

type Ring = {
    u: number;
    center: THREE.Vector3;
    parts: THREE.Mesh[];
    rates: number[][];
    glow: THREE.MeshBasicMaterial;
    colour: THREE.Color;
    align: number;
    passed: boolean;
};

export type Rings = {
    centers: THREE.Vector3[];
    /** Advances the rings; returns the index of a ring the request just flew through. */
    update: (u: number, t: number, dt: number, map: number) => number | null;
};

const BEADS = 8;
const IDENTITY = new THREE.Quaternion();

function gyroscope(scene: THREE.Scene, center: THREE.Vector3, colour: string): Pick<Ring, 'parts' | 'glow'> {
    const g = new THREE.Group();
    g.position.copy(center);
    scene.add(g);
    const chrome = new THREE.MeshStandardMaterial({
        color: '#c8d0dc',
        metalness: 1,
        roughness: 0.2,
        envMapIntensity: 0.55,
    });
    const glow = new THREE.MeshBasicMaterial({ color: colour });
    const parts = [
        new THREE.Mesh(new THREE.TorusGeometry(15, 0.5, 20, 180), chrome),
        new THREE.Mesh(new THREE.TorusGeometry(12, 0.32, 16, 160), chrome),
        new THREE.Mesh(new THREE.TorusGeometry(9.6, 0.09, 8, 200), glow),
    ];
    const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 12, 10), glow, BEADS);
    const m = new THREE.Matrix4();
    for (let b = 0; b < BEADS; b++) {
        const a = (b / BEADS) * Math.PI * 2;
        beads.setMatrixAt(b, m.makeTranslation(Math.cos(a) * 15, Math.sin(a) * 15, 0));
    }
    parts[0].add(beads);
    parts.forEach((p) => g.add(p));
    return { parts, glow };
}

/**
 * 3 · Services: one gyroscope per project. Each spins freely, then locks into a portal as the
 * request arrives (the rings lie across the path, so "aligned" is no rotation at all).
 */
export function addRings(
    scene: THREE.Scene,
    route: Route,
    colours: string[],
    us: number[],
    rand: () => number
): Rings {
    const sign = (): number => (rand() < 0.5 ? -1 : 1);
    const rings: Ring[] = colours.map((c, k) => {
        const center = route.curve.getPointAt(us[k]);
        const rates = [0, 1, 2].map(() =>
            [0.2 + rand() * 0.5, 0.15 + rand() * 0.45, 0.1 + rand() * 0.3].map((r) => r * sign())
        );
        return {
            u: us[k],
            center,
            rates,
            colour: new THREE.Color(c),
            align: 0,
            passed: false,
            ...gyroscope(scene, center, c),
        };
    });
    const e = new THREE.Euler();
    const q = new THREE.Quaternion();
    const update = (u: number, t: number, dt: number, map: number): number | null => {
        let hit: number | null = null;
        rings.forEach((r, k) => {
            const d = Math.abs(u - r.u) * route.len;
            r.align += (smooth(80, 14, d) * (1 - map * 0.6) - r.align) * (1 - Math.exp(-dt * 4));
            r.parts.forEach((p, i) => {
                e.set(t * r.rates[i][0] + k, t * r.rates[i][1] + i, t * r.rates[i][2]);
                p.quaternion.slerpQuaternions(q.setFromEuler(e), IDENTITY, r.align);
            });
            r.glow.color.copy(r.colour).multiplyScalar(0.7 + r.align * 2.2);
            if (!r.passed && u > r.u) {
                r.passed = true;
                hit = k;
            }
            if (u < r.u - 0.002) r.passed = false;
        });
        return hit;
    };
    return { centers: rings.map((r) => r.center), update };
}
