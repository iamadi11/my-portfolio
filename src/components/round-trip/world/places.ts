import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { hazeGlsl, MIST, type Shared, shader } from '@/components/round-trip/world/gl';

/**
 * Real-place DEM meshes built by `scripts/places/build-dem.py` from AWS Terrain Tiles
 * (Terrarium). Attribution: https://github.com/tilezen/joerd/blob/master/docs/attribution.md
 *
 * City chapter: La Paz amphitheater + Illimani. Project horizons: Chocolate Hills,
 * Lençóis Maranhenses, Zhangye Danxia, Mount Roraima, Erta Ale — lesser-seen landforms.
 */

type Connection = { saveData?: boolean; effectiveType?: string };

/** Scenery is left out on Save-Data or a slow (≤3G) link; the trip still reads without it. */
export function lean(): boolean {
    const c = (navigator as Navigator & { connection?: Connection }).connection;
    return !!c && (c.saveData === true || ['slow-2g', '2g', '3g'].includes(c.effectiveType ?? ''));
}

/** Night grade + the world's haze so a DEM stands in the same air as the land in front. */
function nightRock(mat: THREE.MeshStandardMaterial, tint: [number, number, number], fogMul = 0.14): void {
    mat.color.multiply(new THREE.Color(...tint));
    mat.envMapIntensity = 0.08;
    mat.roughness = Math.max(mat.roughness ?? 0.9, 0.88);
    mat.metalness = Math.min(mat.metalness ?? 0.05, 0.08);
    mat.side = THREE.FrontSide;
    mat.onBeforeCompile = (sh) => {
        sh.uniforms.uMist = MIST;
        sh.vertexShader = sh.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vHazeW;')
            .replace(
                '#include <fog_vertex>',
                '#include <fog_vertex>\nvHazeW = (modelMatrix * vec4(transformed, 1.0)).xyz;'
            );
        sh.fragmentShader = sh.fragmentShader
            .replace(
                '#include <fog_pars_fragment>',
                `#include <fog_pars_fragment>
                varying vec3 vHazeW; uniform float uMist;
                #ifdef USE_FOG
                ${hazeGlsl('fogColor', 'uMist')}
                #endif`
            )
            .replace(
                '#include <fog_fragment>',
                `#ifdef USE_FOG
                float hazeD = length(vHazeW - cameraPosition);
                float fogFactor = 1.0 - exp(-fogDensity * fogDensity * ${fogMul.toFixed(3)} * hazeD * hazeD - mist(vHazeW, hazeD));
                gl_FragColor.rgb = mix(gl_FragColor.rgb, haze((vHazeW - cameraPosition) / hazeD), fogFactor);
            #endif`
            );
    };
}

/** City bowl: cooler rock with a soft sodium spill from the valley lights. */
const BOWL_VERT = /* glsl */ `varying vec3 vW, vN; varying float vD;
    void main() {
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 mv = viewMatrix * w; vD = -mv.z;
        gl_Position = projectionMatrix * mv;
    }`;
const BOWL_FRAG = /* glsl */ `
    varying vec3 vW, vN; varying float vD;
    void main() {
        vec3 n = normalize(vN);
        float moon = max(dot(n, MOON_DIR), 0.0);
        float up = max(n.y, 0.0);
        // Altiplano night: cool rock that still reads under city fog, warm spill in the valley.
        vec3 rock = mix(vec3(0.055, 0.05, 0.07), vec3(0.12, 0.11, 0.14), up);
        rock *= 0.7 + 0.55 * moon;
        float valley = exp(-max(vW.y + 40.0, 0.0) / 55.0);
        rock += vec3(0.28, 0.14, 0.06) * valley * 0.14;
        // Snow lick on the steepest high faces (Illimani-adjacent ridges).
        float snow = smoothstep(0.5, 0.82, up) * smoothstep(30.0, 100.0, vW.y + 60.0);
        rock = mix(rock, vec3(0.62, 0.65, 0.72) * (0.45 + 0.55 * moon), snow * 0.9);
        gl_FragColor = vec4(fogAt(rock, vD, vW), 1.0);
    }
`;

type PlaceMesh = {
    id: string;
    /** Metres across the mesh's wider axis after load. */
    width: number;
    /** World Y of the mesh origin (model sits with its lowest point at local y=0). */
    y: number;
    /** Offset across the flight path (x). */
    side: number;
    /** Offset along the path (z), relative to the wrapping base. */
    ahead: number;
    tint?: [number, number, number];
    /** Use the city bowl shader instead of MeshStandard night grade. */
    bowl?: boolean;
};

/**
 * Loads one DEM mesh, grades it for night, and returns a group ready to place. Skipped on
 * Save-Data / slow links (lean()).
 */
function loadPlace(
    loader: GLTFLoader,
    s: Shared | null,
    small: boolean,
    place: PlaceMesh
): Promise<THREE.Group | null> {
    if (lean()) return Promise.resolve(null);
    return loader
        .loadAsync(`/models/places/${place.id}-${small ? 'lo' : 'hi'}.glb`)
        .then((gltf) => {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const k = place.width / Math.max(size.x, size.z, 1);
            model.scale.setScalar(k);
            model.position.set(
                -box.getCenter(new THREE.Vector3()).x * k,
                -box.min.y * k,
                -box.getCenter(new THREE.Vector3()).z * k
            );
            model.traverse((o) => {
                const m = o as THREE.Mesh;
                if (!m.isMesh) return;
                if (place.bowl && s) {
                    m.material = shader(s, BOWL_VERT, BOWL_FRAG);
                } else {
                    const mat = m.material as THREE.MeshStandardMaterial;
                    if (mat?.isMeshStandardMaterial) {
                        nightRock(mat, place.tint ?? [0.45, 0.48, 0.55]);
                    }
                }
                m.frustumCulled = false;
            });
            const g = new THREE.Group();
            g.add(model);
            return g;
        })
        .catch(() => null);
}

export type CityPlaces = { update: (eye: THREE.Vector3) => void };

/**
 * La Paz for the city chapter: a wrapping canyon bowl under the flight path and Illimani's
 * snow cone riding along on the right, so the drop reads as a real high-altitude amphitheater
 * instead of a flat grid. Osaka downtown stays as the left-side night scan (CC BY).
 */
export function addCityPlaces(scene: THREE.Object3D, s: Shared, small: boolean): CityPlaces {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const bowls: THREE.Group[] = [0, 1, 2].map(() => {
        const g = new THREE.Group();
        g.visible = false;
        scene.add(g);
        return g;
    });
    const peaks: THREE.Group[] = [0, 1].map(() => {
        const g = new THREE.Group();
        g.visible = false;
        scene.add(g);
        return g;
    });
    let bowlPeriod = 3200;
    let peakPeriod = 4800;
    void loadPlace(loader, s, small, {
        id: 'lapaz-bowl',
        width: 3200,
        y: 0,
        side: 0,
        ahead: 0,
        bowl: true,
    }).then((proto) => {
        if (!proto) return;
        const box = new THREE.Box3().setFromObject(proto);
        bowlPeriod = Math.max(box.getSize(new THREE.Vector3()).z * 0.9, 1600);
        bowls.forEach((g) => {
            g.add(proto.clone());
            g.visible = true;
            // Valley floor near street level; ridges rise above the mid-rises.
            g.position.y = -60 + 6;
        });
    });
    void loadPlace(loader, s, small, {
        id: 'illimani',
        width: 4200,
        y: 0,
        side: 0,
        ahead: 0,
        tint: [0.72, 0.74, 0.8],
    }).then((proto) => {
        if (!proto) return;
        const box = new THREE.Box3().setFromObject(proto);
        peakPeriod = Math.max(box.getSize(new THREE.Vector3()).z * 0.88, 2200);
        peaks.forEach((g) => {
            g.add(proto.clone());
            g.visible = true;
            // Closer on the right so the snow cone sits in the city frame.
            g.position.set(380, -60 + 20, 0);
        });
    });
    return {
        update: (eye) => {
            const b0 = Math.round(eye.z / bowlPeriod) * bowlPeriod;
            bowls.forEach((g, i) => {
                g.position.x = 20;
                g.position.z = b0 + (i - 1) * bowlPeriod;
            });
            const p0 = Math.round(eye.z / peakPeriod) * peakPeriod;
            peaks.forEach((g, i) => {
                g.position.x = 380;
                g.position.y = -40;
                g.position.z = p0 + (i - 0.5) * peakPeriod + 200;
            });
        },
    };
}

/** Horizon DEM per landscape kind — unique places, not the usual portfolio stock. */
export const PLACE_LANDMARKS: Record<
    string,
    {
        id: string;
        width: number;
        ahead: number;
        sink: number;
        side: number;
        tint?: [number, number, number];
        name: string;
    }
> = {
    grass: {
        id: 'chocolate-hills',
        width: 1600,
        ahead: 1100,
        sink: 30,
        side: -100,
        tint: [0.4, 0.32, 0.24],
        name: 'Chocolate Hills',
    },
    desert: {
        id: 'lencois',
        width: 1900,
        ahead: 1200,
        sink: 20,
        side: 90,
        tint: [0.7, 0.62, 0.48],
        name: 'Lençóis Maranhenses',
    },
    canyon: {
        id: 'zhangye-danxia',
        width: 1500,
        ahead: 1300,
        sink: 80,
        side: 150,
        tint: [0.55, 0.28, 0.22],
        name: 'Zhangye Danxia',
    },
    alpine: {
        id: 'roraima',
        width: 2200,
        ahead: 1200,
        sink: 140,
        side: 100,
        tint: [0.4, 0.42, 0.48],
        name: 'Mount Roraima',
    },
    volcano: {
        id: 'erta-ale',
        width: 1200,
        ahead: 950,
        sink: 25,
        side: 140,
        tint: [0.28, 0.22, 0.2],
        name: 'Erta Ale',
    },
};

export type PlaceLandmarks = { show: (zone: number) => void; names: string[] };

/**
 * One DEM landmark past each project's exit portal. Lazy-fetched like the old Sketchfab scans.
 */
export function addPlaceLandmarks(
    scene: THREE.Object3D,
    portals: Array<{ center: THREE.Vector3; tangent: THREE.Vector3 }>,
    lands: string[],
    ground: Record<string, number>,
    small: boolean
): PlaceLandmarks {
    const names = portals.map((_, k) => PLACE_LANDMARKS[lands[k % lands.length]]?.name ?? '');
    if (lean()) return { show: () => undefined, names };
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const loads: Array<(() => Promise<void>) | undefined> = [];
    const groups = portals.map((p, k) => {
        const mark = PLACE_LANDMARKS[lands[k % lands.length]];
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
            .setY((ground[lands[k % lands.length]] ?? -60) - mark.sink);
        loads[k] = () =>
            loadPlace(loader, null, small, {
                id: mark.id,
                width: mark.width,
                y: 0,
                side: 0,
                ahead: 0,
                tint: mark.tint,
            }).then((proto) => {
                if (proto) g.add(proto);
            });
        return g;
    });
    const fetch = (k: number): void => {
        const go = loads[k];
        loads[k] = undefined;
        void go?.();
    };
    return {
        names,
        show: (zone) => {
            if (zone >= 0) [zone, zone + 1].forEach(fetch);
            groups.forEach((g, k) => g && (g.visible = k === zone));
        },
    };
}
