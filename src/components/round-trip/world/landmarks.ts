import * as THREE from 'three';

import { GROUND, type LandKind, LANDS } from '@/components/round-trip/world/land';
import {
    addPlaceLandmarks,
    lean as placeLean,
    type PlaceLandmarks,
} from '@/components/round-trip/world/places';

/**
 * One real landmark on the horizon of each landscape, standing beyond that scene's exit portal so
 * it grows as the ship closes in. Meshes are DEM heightfields from AWS Terrain Tiles (see
 * `scripts/places/build-dem.py` and docs/round-trip.md): Chocolate Hills, Lençóis Maranhenses,
 * Zhangye Danxia, Mount Roraima, Erta Ale — places portfolios rarely stage.
 */
export type Landmarks = PlaceLandmarks;

/** Re-export so city downtown / places share one Save-Data gate. */
export const lean = placeLean;

export function addLandmarks(
    scene: THREE.Object3D,
    portals: Array<{ center: THREE.Vector3; tangent: THREE.Vector3 }>,
    small: boolean
): Landmarks {
    return addPlaceLandmarks(scene, portals, [...LANDS], GROUND as Record<string, number>, small);
}

/** Stable names for HUD / world labels (one per project slot, cycling with LANDS). */
export function landmarkNames(count: number): string[] {
    const names = LANDS.map((k: LandKind) => {
        const id = (
            {
                grass: 'Chocolate Hills',
                desert: 'Lençóis Maranhenses',
                canyon: 'Zhangye Danxia',
                alpine: 'Mount Roraima',
                volcano: 'Erta Ale',
            } as const
        )[k];
        return id;
    });
    return Array.from({ length: count }, (_, i) => names[i % names.length]);
}
