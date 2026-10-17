import * as THREE from 'three';

/**
 * The ship's path: a long, gently swaying line into -z. The scenery around it is endless and
 * changes with each jump, so the path only sets how far each section travels.
 */
export type Route = {
    curve: THREE.CatmullRomCurve3;
    len: number;
    /** Path position at the start of each section: hero, wire, edge, services, data, end. */
    seg: number[];
    /** Tangent and two normals at u, for placing things around the path. */
    frame: (u: number) => { t: THREE.Vector3; n1: THREE.Vector3; n2: THREE.Vector3 };
};

const UP = new THREE.Vector3(0, 1, 0);
const STEP = 40;
const SPACE = 340;
const CITY = 420;
const PER_RING = 130;
const PER_RECORD = 75;

/** Sideways sway at depth z; `pathX` in gl.ts is the same curve. */
const swayX = (z: number): number => Math.sin(-z * 0.0175) * 6;

export function createRoute(rings: number, records: number): Route {
    const lens = [SPACE, CITY, Math.max(1, rings) * PER_RING, Math.max(1, records) * PER_RECORD];
    const total = lens.reduce((a, b) => a + b, 0);
    const points: THREE.Vector3[] = [];
    for (let z = 0; z >= -total - STEP; z -= STEP)
        points.push(new THREE.Vector3(swayX(z), Math.sin(-z * 0.011) * 2, z));
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const len = curve.getLength();
    let at = 0;
    const seg = [0.004, 0.03];
    lens.slice(0, 3).forEach((l) => seg.push((at += l) / (total + STEP)));
    seg.push(1);
    seg[2] = Math.max(seg[2], 0.05);
    const frame = (u: number): { t: THREE.Vector3; n1: THREE.Vector3; n2: THREE.Vector3 } => {
        const t = curve.getTangentAt(u);
        const n1 = new THREE.Vector3().crossVectors(t, UP).normalize();
        return { t, n1, n2: new THREE.Vector3().crossVectors(n1, t) };
    };
    return { curve, len, seg, frame };
}
