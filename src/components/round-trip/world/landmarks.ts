import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { GROUND, type LandKind, LANDS } from '@/components/round-trip/world/land';

/**
 * One real landmark on the horizon of some landscapes, standing beyond that scene's exit portal so
 * it grows as the ship closes in: "Mountain Range 01" by solararchitect, "Snowy Volcano" by
 * Pukar Shiwakoti and "Horseshoe bend near Grand Canyon" by Ignazio Pillitteri (all Sketchfab,
 * CC BY 4.0).
 * The alpine peaks borrow the mountain range, sunk deeper and further off, until a snowy range
 * of their own is added (`scripts/assets.sh`).
 */
type Landmark = {
    id: string;
    width: number;
    ahead: number;
    sink: number;
    side: number;
    /** Night grade of the scan's colours; blue-grey moonlight unless the rock should stay warm. */
    tint?: [number, number, number];
};

/** Width in metres; `ahead` past the exit portal; `sink` below the ground; `side` off the path. */
const LANDMARKS: Partial<Record<LandKind, Landmark>> = {
    grass: { id: 'mountain_range_01', width: 1500, ahead: 1050, sink: 40, side: -80 },
    canyon: { id: 'horseshoe', width: 1300, ahead: 1350, sink: 110, side: 170, tint: [0.42, 0.36, 0.36] },
    alpine: { id: 'mountain_range_01', width: 1900, ahead: 1150, sink: 20, side: 140 },
    volcano: { id: 'snowy_volcano', width: 1100, ahead: 900, sink: 30, side: 160 },
};

export type Landmarks = { show: (zone: number) => void };

/** Night grade and lighter fog, so the far silhouette still reads against the sky. */
function nightFar(mat: THREE.MeshStandardMaterial, tint: [number, number, number]): void {
    mat.color.multiply(new THREE.Color(...tint));
    mat.envMapIntensity = 0.1;
    mat.onBeforeCompile = (sh) => {
        sh.fragmentShader = sh.fragmentShader.replace(
            '#include <fog_fragment>',
            `#ifdef USE_FOG
                float fogFactor = 1.0 - exp(-fogDensity * fogDensity * 0.12 * vFogDepth * vFogDepth);
                gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, clamp(fogFactor, 0.0, 1.0));
            #endif`
        );
    };
}

export function addLandmarks(
    scene: THREE.Object3D,
    portals: Array<{ center: THREE.Vector3; tangent: THREE.Vector3 }>,
    small: boolean
): Landmarks {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const groups = portals.map((p, k) => {
        const mark = LANDMARKS[LANDS[k % LANDS.length]];
        if (!mark) return null;
        const g = new THREE.Group();
        g.visible = false;
        scene.add(g);
        const ahead = p.tangent.clone().setY(0).normalize();
        const right = new THREE.Vector3(-ahead.z, 0, ahead.x);
        g.position
            .copy(p.center)
            .addScaledVector(ahead, mark.ahead)
            .addScaledVector(right, mark.side)
            .setY(GROUND[LANDS[k % LANDS.length]] - mark.sink);
        loader
            .loadAsync(`/models/terrain/${mark.id}-${small ? 'lo' : 'hi'}.glb`)
            .then((gltf) => {
                const model = gltf.scene;
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                model.scale.setScalar(mark.width / Math.max(size.x, size.z));
                model.position.set(
                    -box.getCenter(new THREE.Vector3()).x,
                    -box.min.y,
                    -box.getCenter(new THREE.Vector3()).z
                );
                model.position.multiplyScalar(model.scale.x);
                model.traverse((o) => {
                    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
                    if (m?.isMeshStandardMaterial) nightFar(m, mark.tint ?? [0.45, 0.5, 0.62]);
                    o.frustumCulled = false;
                });
                g.add(model);
            })
            .catch(() => undefined);
        return g;
    });
    return {
        show: (zone) => groups.forEach((g, k) => g && (g.visible = k === zone)),
    };
}
