import * as THREE from 'three';

/** Uniforms every material shares: time, where the request is, fog, pixel ratio, the data scan. */
export type Shared = {
    uTime: THREE.IUniform<number>;
    uPacket: THREE.IUniform<THREE.Vector3>;
    uFog: THREE.IUniform<number>;
    uFogColor: THREE.IUniform<THREE.Color>;
    uPR: THREE.IUniform<number>;
    uScan: THREE.IUniform<number>;
};

export const FOG = 0.0115;
export const NIGHT = new THREE.Color('#05070d');

export const shared = (pr: number): Shared => ({
    uTime: { value: 0 },
    uPacket: { value: new THREE.Vector3() },
    uFog: { value: FOG },
    uFogColor: { value: NIGHT },
    uPR: { value: pr },
    uScan: { value: 0 },
});

const HEAD = /* glsl */ `
    uniform float uTime; uniform vec3 uPacket; uniform float uFog; uniform vec3 uFogColor; uniform float uPR; uniform float uScan;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    vec3 fogIt(vec3 c, float d) { float f = 1.0 - exp(-uFog * uFog * d * d); return mix(c, uFogColor, clamp(f, 0.0, 1.0)); }
    float fade(float d) { return exp(-uFog * uFog * d * d); }
    float glowAt(vec3 w, float r) { vec3 d = w - uPacket; return exp(-dot(d, d) / (r * r)); }
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

/** Vertex shader for instanced meshes: world position, depth and a per-instance random. */
export const INSTANCED_VERT = /* glsl */ `
    attribute float aRand;
    varying vec3 vW, vN, vL; varying float vR, vD;
    void main() {
        vL = position; vN = normal; vR = aRand;
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
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
