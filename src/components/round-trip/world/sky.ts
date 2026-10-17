import * as THREE from 'three';

import { MOON, type Shared } from '@/components/round-trip/world/gl';

/**
 * The night sky over every landscape: the real stars and Milky Way (NASA/Goddard SVS Deep Star
 * Maps, ESA/Gaia), the moon with its halo, a horizon that takes the colour of whatever lies below
 * (city glow, desert haze, sea), and the aurora over the pole. In space the air drops away.
 */
const FRAG = /* glsl */ `
    uniform float uTime, uSpace, uAurora, uStars; uniform vec3 uMoon, uHorizon; uniform sampler2D tStars; uniform mat3 uTurn;
    varying vec3 vDir;
    float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
    float n3(vec3 p) {
        vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
    }
    float f3(vec3 p) { float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * n3(p); p *= 2.07; a *= 0.5; } return v; }
    // The real sky (NASA star map): look it up by direction, without a seam where the map wraps.
    vec3 sky(vec3 d) {
        vec3 s = uTurn * d;
        vec2 uv = vec2(atan(s.z, s.x) / 6.2831853 + 0.5, asin(clamp(s.y, -1.0, 1.0)) / 3.1415927 + 0.5);
        vec2 dx = dFdx(uv), dy = dFdy(uv);
        dx.x -= floor(dx.x + 0.5); dy.x -= floor(dy.x + 0.5);
        vec3 c = textureGrad(tStars, uv, dx, dy).rgb;
        return c * c * 1.4;
    }
    void main() {
        vec3 d = normalize(vDir);
        float up = d.y;
        float air = 1.0 - uSpace;

        // Air: near-black overhead, the landscape's colour along the horizon, a faint green airglow.
        vec3 zenith = vec3(0.0035, 0.006, 0.016);
        vec3 col = mix(uHorizon, zenith, smoothstep(-0.02, 0.45, up)) * air;
        col += vec3(0.02, 0.05, 0.03) * exp(-abs(up - 0.06) * 18.0) * air;

        // Stars and the Milky Way, dimmed by the air near the horizon and by city light.
        float clear = mix(smoothstep(-0.02, 0.3, up) * uStars, 1.0, uSpace);
        col += sky(d) * clear;

        // The moon: a disc with darker seas, its halo, and a wider glow in the air.
        float m = dot(d, uMoon);
        float r = acos(clamp(m, -1.0, 1.0));
        float disc = smoothstep(0.034, 0.031, r);
        vec3 md = normalize(d - uMoon * m);
        float seas = smoothstep(0.45, 0.62, f3(md * 40.0 + uMoon * 13.0));
        vec3 moon = vec3(1.0, 0.97, 0.9) * 2.4 * (1.0 - seas * 0.35) * (0.75 + 0.25 * smoothstep(0.034, 0.0, r));
        // Seen from the ground only: from orbit it would steal the scene from Earth.
        col = mix(col, moon, disc * air);
        col += vec3(0.5, 0.6, 0.8) * (exp(-r * 30.0) * 0.35 + exp(-r * 4.0) * 0.05) * air;

        // Aurora: curtains along the horizon ahead, a sharp green lower edge fading up into red.
        if (uAurora > 0.001) {
            float az = atan(d.x, -d.z);
            float base = 0.07 + 0.05 * sin(az * 2.3 + uTime * 0.07) + 0.03 * sin(az * 5.1 - uTime * 0.11);
            float hgt = up - base;
            float rays = pow(n3(vec3(az * 26.0, uTime * 0.25, 0.0)), 2.0) * 0.8 + 0.2;
            float curtain = smoothstep(-0.006, 0.01, hgt) * exp(-max(hgt, 0.0) * 7.0);
            float fold = 0.5 + 0.5 * sin(az * 9.0 + n3(vec3(az * 3.0, uTime * 0.05, 1.0)) * 6.0);
            vec3 tint = mix(vec3(0.12, 1.0, 0.55), vec3(0.85, 0.18, 0.5), smoothstep(0.02, 0.32, hgt));
            float ahead = smoothstep(-0.4, 0.4, -d.z);
            col += tint * curtain * rays * (0.4 + 0.6 * fold) * ahead * uAurora * 0.55;
        }

        // Below the horizon: the haze over the ground (the land itself covers most of it).
        col = mix(col, uHorizon * air, smoothstep(0.0, -0.08, up));
        gl_FragColor = vec4(col, 1.0);
    }
`;

export type Sky = {
    mesh: THREE.Mesh;
    uniforms: {
        uSpace: THREE.IUniform<number>;
        uAurora: THREE.IUniform<number>;
        uStars: THREE.IUniform<number>;
        uHorizon: THREE.IUniform<THREE.Color>;
    };
};

export function addSky(scene: THREE.Scene, s: Shared, small: boolean): Sky {
    const tStars = new THREE.TextureLoader().load(small ? '/env/stars-2k.jpg' : '/env/stars-4k.jpg');
    tStars.colorSpace = THREE.SRGBColorSpace;
    tStars.anisotropy = 4;
    // Turn the sky so the bright core of the Milky Way rises ahead and to the left.
    const turn = new THREE.Matrix3().setFromMatrix4(
        new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.5, 2.3, 0.2))
    );
    const uniforms = {
        uTime: s.uTime,
        uMoon: { value: MOON },
        uSpace: { value: 1 },
        uAurora: { value: 0 },
        uStars: { value: 1 },
        uHorizon: { value: new THREE.Color(0.03, 0.045, 0.08) },
        tStars: { value: tStars },
        uTurn: { value: turn },
    };
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(4000, 48, 24),
        new THREE.ShaderMaterial({
            uniforms,
            side: THREE.BackSide,
            depthWrite: false,
            fog: false,
            vertexShader: /* glsl */ `varying vec3 vDir; void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
            fragmentShader: FRAG,
        })
    );
    mesh.frustumCulled = false;
    mesh.renderOrder = -2;
    // The dome travels with the camera, so it is always at the horizon.
    mesh.onBeforeRender = (_r, _s, camera) => mesh.position.copy(camera.position);
    scene.add(mesh);
    return { mesh, uniforms };
}
