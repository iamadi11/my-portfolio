import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { clamp, smooth } from '@/components/round-trip/math';
import { ADD, type Shared, shader } from '@/components/round-trip/world/gl';
import type { Glow } from '@/components/round-trip/world/glow';

export type ShipIn = {
    /** Where the ship flies (route point plus `side`) and the way it is heading. */
    at: THREE.Vector3;
    heading: THREE.Vector3;
    speed: number;
    dt: number;
    /** In the hero (and at the very end) it turns round to face you. */
    hero: boolean;
    /** 0–1: re-entry heat. */
    heat: number;
    /** 0–1: the search beam; `ground` is the height it lands on. */
    beam: number;
    ground: number;
};

export type Ship = { update: (f: ShipIn) => void; roll: () => void; boost: () => void };

const LEN = 3.2;

/** Engine plasma: white-hot at the nozzle, blue along the plume, flickering. */
const FLAME_FRAG = /* glsl */ `
    uniform float uThrust; uniform vec2 uSpan; varying vec3 vL, vN, vV;
    void main() {
        float k = clamp((vL.z - uSpan.x) / (uSpan.y - uSpan.x), 0.0, 1.0);
        // Faces seen edge-on fade out, so the jagged plume reads as a soft glow.
        float face = pow(abs(dot(normalize(vN), normalize(vV))), 2.0);
        float flick = 0.85 + 0.15 * sin(uTime * 61.0 + vL.z * 9.0);
        vec3 c = mix(vec3(0.15, 0.55, 1.0), vec3(0.85, 0.95, 1.0), pow(k, 3.0));
        gl_FragColor = vec4(c * pow(k, 1.6) * uThrust * flick * face * 1.1, 1.0);
    }
`;

/** The search beam: a soft cone of light with bands drifting down it. */
const BEAM_FRAG = /* glsl */ `
    uniform float uOn; varying vec3 vL, vWN, vW; varying vec2 vUv;
    void main() {
        vec3 V = normalize(cameraPosition - vW);
        float edge = pow(1.0 - abs(dot(normalize(vWN), V)), 1.5);
        float bands = 0.75 + 0.25 * sin(vUv.y * 40.0 + uTime * 6.0);
        float fall = smoothstep(0.0, 0.15, vUv.y) * pow(vUv.y, 0.6);
        float a = (0.025 + edge * 0.16) * bands * fall * uOn;
        gl_FragColor = vec4(vec3(0.45, 1.0, 0.88) * a, 1.0);
    }
`;

/**
 * The visitor: the Intergalactic Spaceship by Dennis Haupt (3DHaupt, free3d.com; personal,
 * non-commercial licence), with its own PBR maps. Blue plasma from the engines, a search beam
 * underneath once it is over land, a plasma glow on re-entry, strobes on the wingtips.
 */
export function addShip(scene: THREE.Scene, s: Shared, small: boolean, glow: Glow): Ship {
    const rig = new THREE.Group();
    const body = new THREE.Group();
    rig.add(body);
    scene.add(rig);
    if (small) rig.scale.setScalar(0.75);
    const uThrust = { value: 1 };

    // Plasma around the nose on re-entry; engine glow; wingtip strobes. Placed once the model is in.
    const nose = glow(1, new THREE.Color(1, 0.45, 0.15), 0);
    const engines = [
        glow(1, new THREE.Color(0.35, 0.65, 1.4), 0.55),
        glow(1, new THREE.Color(0.35, 0.65, 1.4), 0.55),
    ];
    const strobes = [glow(0.28, new THREE.Color(3, 3, 3)), glow(0.28, new THREE.Color(3, 3, 3))];
    [nose, ...engines, ...strobes].forEach((g) => body.add(g));

    // A little light of its own so it reads against the dark.
    const fill = new THREE.PointLight('#cfe0ff', 1.2, 10, 2);
    scene.add(fill);

    const uOn = { value: 0 };
    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 3.6, 1, 48, 1, true).translate(0, -0.5, 0),
        shader(
            s,
            /* glsl */ `varying vec3 vL, vWN, vW; varying vec2 vUv;
            void main() { vL = position; vUv = uv; vWN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
            BEAM_FRAG,
            { uOn },
            { ...ADD, side: THREE.DoubleSide }
        )
    );
    beam.frustumCulled = false;
    scene.add(beam);

    new GLTFLoader()
        .setMeshoptDecoder(MeshoptDecoder)
        .loadAsync(small ? '/models/ship-1k.glb' : '/models/ship.glb')
        .then((gltf) => {
            const model = gltf.scene;
            const flames: THREE.Mesh[] = [];
            let hull: THREE.Mesh | null = null;
            model.traverse((o) => {
                const m = o as THREE.Mesh;
                if (!m.isMesh) return;
                const mat = m.material as THREE.MeshStandardMaterial;
                if (mat.name === 'Flame') flames.push(m);
                else hull = m;
            });
            if (!hull) return;
            const hullBox = new THREE.Box3().setFromObject(hull);
            const k = LEN / hullBox.getSize(new THREE.Vector3()).z;
            model.scale.setScalar(k);
            model.position.copy(hullBox.getCenter(new THREE.Vector3())).multiplyScalar(-k);
            const mat = (hull as THREE.Mesh).material as THREE.MeshStandardMaterial;
            mat.envMapIntensity = 0.45;
            mat.color.multiplyScalar(0.55);
            mat.emissive.setRGB(0.5, 0.75, 1);
            mat.emissiveIntensity = 2;
            for (const f of flames) {
                const box = new THREE.Box3().setFromBufferAttribute(
                    f.geometry.attributes.position as THREE.BufferAttribute
                );
                f.material = shader(
                    s,
                    /* glsl */ `varying vec3 vL, vN, vV; void main() { vL = position; vN = normalMatrix * normal; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
                    FLAME_FRAG,
                    { uThrust, uSpan: { value: new THREE.Vector2(box.min.z, box.max.z) } },
                    ADD
                );
            }
            // Put the glows where the model's nozzles, nose and wingtips are. Measured before the
            // model joins the rig, so these boxes are in the ship's own space whichever way it faces.
            model.updateMatrixWorld(true);
            flames.forEach((f, i) => {
                const b = new THREE.Box3().setFromObject(f);
                if (engines[i]) engines[i].position.copy(b.getCenter(new THREE.Vector3()).setZ(b.max.z));
            });
            const hb = new THREE.Box3().setFromObject(hull);
            const mid = hb.getCenter(new THREE.Vector3());
            nose.position.set(mid.x, mid.y, hb.max.z);
            strobes.forEach((g, i) => g.position.set(i ? hb.max.x : hb.min.x, mid.y, mid.z));
            body.add(model);
        })
        .catch(() => undefined);

    const look = new THREE.Vector3();
    const prev = new THREE.Vector3(0, 0, -1);
    let turn = 0;
    let bank = 0;
    let spin = 1;
    let kick = 0;
    const update = (f: ShipIn): void => {
        beam.visible = f.beam > 0.01;
        const now = performance.now() / 1000;
        rig.position.copy(f.at);
        rig.position.y += Math.sin(now * 1.4) * 0.08;
        rig.lookAt(look.copy(rig.position).add(f.heading));
        turn += ((f.hero ? Math.PI : 0) - turn) * (1 - Math.exp(-f.dt * 2.5));
        rig.rotateY(turn);
        // Bank into turns; a full barrel roll through each project ring.
        const yaw = prev.x * f.heading.z - prev.z * f.heading.x;
        prev.copy(f.heading);
        bank += (clamp(-yaw * 40, -0.6, 0.6) - bank) * (1 - Math.exp(-f.dt * 3));
        spin = Math.min(1, spin + f.dt / 0.9);
        const roll = bank + (spin < 1 ? Math.PI * 2 * (1 - Math.pow(1 - spin, 3)) : 0);
        body.rotation.set(-Math.min(0.2, f.speed * 0.25), 0, roll + Math.sin(now * 0.9) * 0.04);
        kick = Math.max(0, kick - f.dt * 1.5);
        uThrust.value = 0.7 + f.speed * 0.9 + kick + (Math.random() - 0.5) * 0.08;
        engines.forEach((e) => e.scale.setScalar(0.5 + uThrust.value * 0.45));
        nose.material.opacity = f.heat;
        nose.scale.setScalar(2 + f.heat * 5 + Math.random() * 0.4);
        strobes.forEach((g, i) => (g.material.opacity = (now + i * 0.7) % 1.4 < 0.07 ? 1 : 0));
        fill.position.copy(rig.position).add(look.set(0, 2.2, 0));
        uOn.value += (f.beam - uOn.value) * (1 - Math.exp(-f.dt * 3));
        const h = rig.position.y - 0.6 - f.ground;
        if (beam.visible && h > 0.5) {
            beam.position.set(rig.position.x, rig.position.y - 0.6, rig.position.z);
            beam.scale.set(1 + h * 0.03, h, 1 + h * 0.03);
            s.uBeam.value.set(rig.position.x, f.ground, rig.position.z, uOn.value * smooth(0.5, 3, h));
        } else s.uBeam.value.w = 0;
    };
    return {
        update,
        roll: () => {
            spin = 0;
        },
        boost: () => {
            kick = 1.2;
        },
    };
}
