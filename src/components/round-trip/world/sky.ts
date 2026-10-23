import * as THREE from 'three';

import { hazeGlsl, MIST, MOON, type Shared } from '@/components/round-trip/world/gl';

/**
 * The night sky over every landscape: the real stars and Milky Way (NASA/Goddard SVS Deep Star
 * Maps, ESA/Gaia), the moon with its halo, a horizon that takes the colour of whatever lies below
 * (city glow, desert haze, sea), and the aurora over the pole. In space the air drops away.
 */
const FRAG =
    /* glsl */ `
    uniform float uTime, uSpace, uAurora, uStars, uMist, uMoonOn; uniform vec3 uMoon, uHorizon;
    uniform sampler2D tStars, tMoon; uniform mat3 uTurn;
    varying vec3 vDir;
` +
    hazeGlsl('uHorizon', 'uMist') +
    /* glsl */ `
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
        c = c * c * 1.4;
        // The map's dust lanes are a warm brown that fights the night palette: cooled, mostly grey.
        float l = dot(c, vec3(0.3, 0.59, 0.11));
        return mix(vec3(l), c, 0.3) * vec3(0.82, 0.92, 1.12);
    }
    void main() {
        vec3 d = normalize(vDir);
        float up = d.y;
        float air = 1.0 - uSpace;

        // Air: the same haze the fog fades into, so the ground meets the sky in one colour.
        // A faint green airglow a few degrees up, none at the horizon itself so the seam stays shut.
        vec3 col = haze(d) * air;
        col += vec3(0.02, 0.05, 0.03) * exp(-abs(up - 0.06) * 18.0) * smoothstep(0.0, 0.06, up) * air;

        // Stars and the Milky Way, dimmed by the air near the horizon and by city light.
        float clear = mix(smoothstep(-0.02, 0.3, up) * uStars, 1.0, uSpace);
        col += sky(d) * clear;

        // The moon: NASA's photograph of the full moon once loaded (a disc with noise seas until then),
        // its halo, and a wider glow in the air.
        float m = dot(d, uMoon);
        float r = acos(clamp(m, -1.0, 1.0));
        // Seen from the ground only: from orbit it would steal the scene from Earth.
        // (The photo is sampled outside the branch, so its mip level stays well defined.)
        vec3 east = normalize(cross(uMoon, vec3(0.0, 1.0, 0.0))), north = cross(east, uMoon);
        vec3 photo = texture2D(tMoon, vec2(dot(d, east), dot(d, north)) * (0.497 / 0.034) + 0.5).rgb * 1.8;
        if (r < 0.034 && air > 0.0) {
            float seas = smoothstep(0.45, 0.62, f3(d * 40.0 + uMoon * 13.0));
            // A moon, not a sun: a modest disc and a tight halo, so it never blooms over the scene.
            vec3 drawn = vec3(1.0, 0.97, 0.9) * 1.5 * (1.0 - seas * 0.35) * (1.0 - 0.25 * smoothstep(0.0, 0.034, r));
            col = mix(col, mix(drawn, photo, uMoonOn), (1.0 - smoothstep(0.031, 0.034, r)) * air);
        }
        col += vec3(0.5, 0.6, 0.8) * (exp(-r * 40.0) * 0.2 + exp(-r * 5.0) * 0.035) * air;

        // Aurora: curtains along the horizon ahead, a sharp green lower edge fading up into red.
        if (uAurora > 0.001) {
            float az = atan(d.x, -d.z);
            float base = 0.07 + 0.05 * sin(az * 2.3 + uTime * 0.07) + 0.03 * sin(az * 5.1 - uTime * 0.11);
            float hgt = up - base;
            float rays = pow(n3(vec3(az * 26.0, uTime * 0.25, 0.0)), 2.0) * 0.8 + 0.2;
            // A soft lower edge: the curtain's foot glows out a little below where it is brightest.
            float curtain = smoothstep(-0.035, 0.015, hgt) * exp(-max(hgt, 0.0) * 7.0);
            float fold = 0.5 + 0.5 * sin(az * 9.0 + n3(vec3(az * 3.0, uTime * 0.05, 1.0)) * 6.0);
            vec3 tint = mix(vec3(0.12, 1.0, 0.55), vec3(0.85, 0.18, 0.5), smoothstep(0.02, 0.32, hgt));
            float ahead = smoothstep(-0.4, 0.4, -d.z);
            col += tint * curtain * rays * (0.4 + 0.6 * fold) * ahead * uAurora * 0.55;
        }

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
    /** Turns the star map about the vertical (radians), so each place has its own sky. */
    turn: (yaw: number) => void;
};

export function addSky(scene: THREE.Scene, s: Shared, small: boolean): Sky {
    const tStars = new THREE.TextureLoader().load(small ? '/env/stars-2k.jpg' : '/env/stars-4k.jpg');
    tStars.colorSpace = THREE.SRGBColorSpace;
    tStars.anisotropy = 4;
    // The sky's base orientation; each place turns it about the vertical from there.
    const base = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.5, 2.3, 0.2));
    const turn = new THREE.Matrix3().setFromMatrix4(base);
    const spin = new THREE.Matrix4();
    let yawNow = 0;
    const uniforms = {
        uTime: s.uTime,
        uMoon: { value: MOON },
        uSpace: { value: 1 },
        uAurora: { value: 0 },
        uStars: { value: 1 },
        uHorizon: { value: new THREE.Color(0.03, 0.045, 0.08) },
        tStars: { value: tStars },
        uTurn: { value: turn },
        uMist: MIST,
        tMoon: { value: new THREE.Texture() },
        uMoonOn: { value: 0 },
    };
    // The real moon (NASA), cropped to its disc; the drawn one stands in until it arrives.
    new THREE.TextureLoader().load('/env/moon.webp', (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        uniforms.tMoon.value = t;
        uniforms.uMoonOn.value = 1;
    });
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
    const turnTo = (yaw: number): void => {
        if (yaw === yawNow) return;
        yawNow = yaw;
        turn.setFromMatrix4(spin.makeRotationY(yaw).premultiply(base));
    };
    return { mesh, uniforms, turn: turnTo };
}
