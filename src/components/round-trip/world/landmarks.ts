import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { GROUND, type LandKind, LANDS } from '@/components/round-trip/world/land';

/**
 * One real landmark on the horizon of some landscapes, standing beyond that scene's exit portal so
 * it grows as the ship closes in: "Mountain Range 01" by solararchitect, "Snowy Volcano" by
 * Pukar Shiwakoti, "Horseshoe bend near Grand Canyon" by Ignazio Pillitteri, "Snowy Mountain -
 * Terrain" and "Death Valley - Terrain" by artfromheath (all Sketchfab, CC BY 4.0).
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
    desert: { id: 'death_valley', width: 1700, ahead: 1250, sink: 70, side: 110, tint: [0.5, 0.46, 0.44] },
    canyon: { id: 'horseshoe', width: 1300, ahead: 1350, sink: 110, side: 170, tint: [0.42, 0.36, 0.36] },
    // The ship flies low in the alpine valley: sunk well below its floor, or the scan's flat base shows.
    alpine: { id: 'snowy_mountain', width: 2100, ahead: 1150, sink: 160, side: 120 },
    volcano: { id: 'snowy_volcano', width: 1100, ahead: 900, sink: 30, side: 160 },
};

export type Landmarks = { show: (zone: number) => void };

/** Night grade and lighter fog, so the far silhouette still reads against the sky. */
function nightFar(mat: THREE.MeshStandardMaterial, tint: [number, number, number]): void {
    mat.color.multiply(new THREE.Color(...tint));
    mat.envMapIntensity = 0.1;
    // A scan is a sheet: seen from below, its underside would read as a floating slab.
    mat.side = THREE.FrontSide;
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
