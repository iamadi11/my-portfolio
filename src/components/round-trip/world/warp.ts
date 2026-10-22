import * as THREE from 'three';

import { ADD, type Shared, shader } from '@/components/round-trip/world/gl';

/**
 * `jump` (0–1): full streak stretch — callers pass this only for the two air passages (into the
 * cloud deck, out to orbit). Portal cuts and quiet dips leave it at 0.
 * `hint` (0–1): a faint, short streaking while the visitor boosts; not a jump.
 */
export type Warp = { update: (jump: number, tint: THREE.Color, hint?: number) => void };

/** How strong a full boost's hint is, as a share of a jump. */
const HINT = 0.3;

/**
 * Light streaks for the air passages: long streaks rushing past the camera, stretching as the cut
 * peaks. They ride with the camera. Portal jumps keep post flash/blur without these streaks; quiet
 * dips stay dark.
 */
export function addWarp(camera: THREE.Camera, s: Shared, n: number, rand: () => number): Warp {
    const uJump = { value: 0 };
    const uHint = { value: 0 };
    const uLit = { value: 0 };
    const uTint = { value: new THREE.Color() };
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const r = new Float32Array(n);
    const mesh = new THREE.InstancedMesh(
        geo,
        shader(
            s,
            /* glsl */ `uniform float uJump; attribute float aRand; varying float vZ, vR;
            void main() {
                vR = aRand; vZ = position.z + 0.5;
                vec3 p = position;
                p.z *= 0.2 + uJump * uJump * 8.0;
                vec4 c = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                float z = mod(c.z + uTime * (180.0 + aRand * 260.0) * (0.3 + uJump), 260.0) - 270.0;
                vec4 w = instanceMatrix * vec4(p, 1.0);
                w.z += z - c.z;
                gl_Position = projectionMatrix * modelViewMatrix * w;
            }`,
            /* glsl */ `uniform float uLit, uHint; uniform vec3 uTint; varying float vZ, vR;
            void main() { gl_FragColor = vec4(mix(uTint, vec3(1.0), 0.4) * pow(vZ, 2.0) * max(smoothstep(0.05, 0.5, uLit), uHint * vR * vR) * (0.5 + vR) * 1.6, 1.0); }`,
            { uJump, uLit, uHint, uTint },
            ADD
        ),
        n
    );
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const size = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2;
        const rad = 4 + Math.pow(rand(), 0.7) * 34;
        const w = 0.03 + rand() * 0.06;
        mesh.setMatrixAt(
            i,
            m.compose(
                v.set(Math.cos(a) * rad, Math.sin(a) * rad, -rand() * 260),
                q,
                size.set(w, w, 6 + rand() * 10)
            )
        );
        r[i] = rand();
    }
    geo.setAttribute('aRand', new THREE.InstancedBufferAttribute(r, 1));
    mesh.frustumCulled = false;
    camera.add(mesh);
    return {
        update: (jump, tint, hint = 0) => {
            // The hint streaks a little (it sets the stretch), and lights only some of the streaks.
            uJump.value = Math.max(jump, hint * HINT);
            uLit.value = jump;
            uHint.value = hint * HINT;
            uTint.value.copy(tint);
            mesh.visible = uJump.value > 0.01;
        },
    };
}
