import * as THREE from 'three';

/**
 * The request's path through the world, always heading into -z:
 * wire (z 0 → -340), edge city (→ -725), services (→ -1025), then a dive into the data (→ -1325).
 */
export type Route = {
    curve: THREE.CatmullRomCurve3;
    len: number;
    /** Path position at the start of each section: hero, wire, edge, services, data, end. */
    seg: number[];
    /** Distance from a point to the path (flat = ignore height). */
    near: (x: number, y: number, z: number, flat?: boolean) => number;
    /** Tangent and two normals at u, for placing things around the path. */
    frame: (u: number) => { t: THREE.Vector3; n1: THREE.Vector3; n2: THREE.Vector3 };
};

const UP = new THREE.Vector3(0, 1, 0);

function points(): THREE.Vector3[] {
    const p: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++)
        p.push(new THREE.Vector3(Math.sin(i * 0.8) * 5, Math.sin(i * 0.5) * 2.5, -i * 40));
    [14, -22, 26, -10, 20, -26, 8].forEach((x, i) =>
        p.push(new THREE.Vector3(x, 8 + (i % 2) * 10, -370 - i * 55))
    );
    for (let i = 0; i < 6; i++) p.push(new THREE.Vector3(0, 4, -750 - i * 55));
    for (let i = 1; i <= 6; i++) p.push(new THREE.Vector3(Math.sin(i) * 7, 4 - i * 32, -1025 - i * 50));
    return p;
}

export function createRoute(): Route {
    const curve = new THREE.CatmullRomCurve3(points(), false, 'centripetal');
    const len = curve.getLength();
    const uAtZ = (z: number): number => {
        let lo = 0;
        let hi = 1;
        for (let k = 0; k < 32; k++) {
            const m = (lo + hi) / 2;
            if (curve.getPointAt(m).z > z) lo = m;
            else hi = m;
        }
        return (lo + hi) / 2;
    };
    const seg = [0.004, 0.03, uAtZ(-340), uAtZ(-725), uAtZ(-1025), 1];

    // z only ever decreases along the path, so a binary search finds the nearby stretch.
    const samples = Array.from({ length: 900 }, (_, i) => curve.getPointAt(i / 899));
    const indexAt = (z: number): number => {
        let lo = 0;
        let hi = samples.length - 1;
        while (lo < hi) {
            const m = (lo + hi) >> 1;
            if (samples[m].z > z) lo = m + 1;
            else hi = m;
        }
        return lo;
    };
    const near = (x: number, y: number, z: number, flat = false): number => {
        const i = indexAt(z);
        let best = Infinity;
        for (let k = Math.max(0, i - 90); k < Math.min(samples.length, i + 90); k++) {
            const p = samples[k];
            const d = (p.x - x) ** 2 + (p.z - z) ** 2 + (flat ? 0 : (p.y - y) ** 2);
            if (d < best) best = d;
        }
        return Math.sqrt(best);
    };
    const frame = (u: number): { t: THREE.Vector3; n1: THREE.Vector3; n2: THREE.Vector3 } => {
        const t = curve.getTangentAt(u);
        const n1 = new THREE.Vector3().crossVectors(t, UP).normalize();
        return { t, n1, n2: new THREE.Vector3().crossVectors(n1, t) };
    };
    return { curve, len, seg, near, frame };
}
