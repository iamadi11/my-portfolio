import * as THREE from 'three';

/**
 * Uniforms every material shares: time, where the ship is, fog, pixel ratio, the record scan, and
 * where the ship's beam meets the ground (w = how strongly it is on).
 */
export type Shared = {
    uTime: THREE.IUniform<number>;
    uPacket: THREE.IUniform<THREE.Vector3>;
    uFog: THREE.IUniform<number>;
    uFogColor: THREE.IUniform<THREE.Color>;
    uPR: THREE.IUniform<number>;
    uScan: THREE.IUniform<number>;
    uBeam: THREE.IUniform<THREE.Vector4>;
};

export const FOG = 0.0115;
const NIGHT = new THREE.Color('#05070d');
/** Where the moon hangs: ahead and to the right, low enough to lay a path of light on the sea. */
export const MOON = new THREE.Vector3(0.32, 0.36, -0.88).normalize();
/** Moonlight on the hand-lit landscapes: brighter than nature, as night is shot for film. */
export const MOONLIGHT = new THREE.Color(1.1, 1.25, 1.65);

export const shared = (pr: number): Shared => ({
    uTime: { value: 0 },
    uPacket: { value: new THREE.Vector3() },
    uFog: { value: FOG },
    uFogColor: { value: NIGHT.clone() },
    uPR: { value: pr },
    uScan: { value: 0 },
    uBeam: { value: new THREE.Vector4(0, -999, 0, 0) },
});

const HEAD = /* glsl */ `
    uniform float uTime; uniform vec3 uPacket; uniform float uFog; uniform vec3 uFogColor; uniform float uPR; uniform float uScan;
    uniform vec4 uBeam;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    vec3 fogIt(vec3 c, float d) { float f = 1.0 - exp(-uFog * uFog * d * d); return mix(c, uFogColor, clamp(f, 0.0, 1.0)); }
    float fade(float d) { return exp(-uFog * uFog * d * d); }
    float glowAt(vec3 w, float r) { vec3 d = w - uPacket; return exp(-dot(d, d) / (r * r)); }
    float vnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }
    // The path's sideways sway at depth z (route.ts builds the same curve).
    float pathX(float z) { return sin(-z * 0.0175) * 6.0; }
    // Shift a point by whole tiles so it stays within half a tile of the camera: endless scenery.
    vec2 wrapAround(vec2 c, vec2 tile) { return cameraPosition.xz + mod(c - cameraPosition.xz + tile * 0.5, tile) - tile * 0.5; }
    float ridged(vec2 p) {
        float v = 0.0, a = 0.55, w = 1.0;
        for (int k = 0; k < 5; k++) { float n = 1.0 - abs(vnoise(p) * 2.0 - 1.0); float r = n * n * w; v += r * a; w = clamp(r * 2.0, 0.0, 1.0); p *= 2.1; a *= 0.5; }
        return v;
    }
    // The ship's search beam where it meets the ground: a soft pool with a brighter rim.
    vec3 beamAt(vec3 w) {
        float d = length(w.xz - uBeam.xz);
        float pool = exp(-d * d / 14.0) * 0.4 + exp(-pow((d - 3.4) / 0.5, 2.0)) * 0.3;
        return vec3(0.55, 1.0, 0.92) * pool * uBeam.w * smoothstep(24.0, 4.0, abs(w.y - uBeam.y));
    }
`;

/** Glowing things add light instead of covering what is behind them. */
export const ADD: THREE.ShaderMaterialParameters = {
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
};

export function shader(
    s: Shared,
    vertex: string,
    fragment: string,
    extra: Record<string, THREE.IUniform> = {},
    opts: THREE.ShaderMaterialParameters = {}
): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
        uniforms: { ...s, ...extra },
        vertexShader: HEAD + vertex,
        fragmentShader: HEAD + fragment,
        ...opts,
    });
}

/**
 * Instanced scenery that never runs out: each instance is moved by whole tiles to stay near the
 * camera, and any that would land on the flight path (within `uClear` of it) are dropped.
 */
export const WRAP_VERT = /* glsl */ `
    uniform vec2 uTile; uniform float uClear;
    attribute float aRand;
    varying vec3 vW, vN, vL, vWN; varying float vR, vD;
    void main() {
        vL = position; vN = normal; vR = aRand;
        vec3 c = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        vec2 wc = wrapAround(c.xz, uTile);
        if (abs(wc.x - pathX(wc.y)) < uClear) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
        vWN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        w.xz += wc - c.xz;
        vW = w.xyz;
        vec4 mv = viewMatrix * w;
        vD = -mv.z;
        gl_Position = projectionMatrix * mv;
    }
`;

/** One draw call for many boxes, each with its own transform and random. */
export function boxes(
    material: THREE.Material,
    transforms: THREE.Matrix4[],
    rand: () => number
): THREE.InstancedMesh {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.InstancedMesh(geo, material, transforms.length);
    const r = new Float32Array(transforms.length);
    transforms.forEach((m, i) => {
        mesh.setMatrixAt(i, m);
        r[i] = rand();
    });
    geo.setAttribute('aRand', new THREE.InstancedBufferAttribute(r, 1));
    mesh.frustumCulled = false;
    return mesh;
}

/** Same sequence every load, so the world is identical for everyone. */
export function rng(seed: number): () => number {
    let s = seed;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
