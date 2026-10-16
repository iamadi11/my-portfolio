import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/** Colour fringing that grows with speed, film grain, vignette, and dither against banding. */
const FINISH = {
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVel: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; uniform float uTime, uVel; varying vec2 vUv;
        float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
            vec2 c = vUv - 0.5; float r = length(c);
            vec2 off = c * (0.0012 + uVel * 0.014) * (0.4 + r);
            vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
            col *= 1.0 - smoothstep(0.42, 1.05, r) * 0.6;
            col += (h(vUv * 1000.0 + fract(uTime) * 91.0) - 0.5) * 0.04;
            col += (h(gl_FragCoord.xy) - 0.5) / 255.0;
            gl_FragColor = vec4(col, 1.0);
        }`,
};

export type Post = {
    composer: EffectComposer;
    finish: (t: number, speed: number) => void;
};

export function createPost(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    small: boolean
): Post {
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), small ? 0.55 : 0.7, 0.45, 0.42));
    composer.addPass(new OutputPass());
    const pass = new ShaderPass(FINISH);
    composer.addPass(pass);
    const finish = (t: number, speed: number): void => {
        pass.uniforms.uTime.value = t;
        pass.uniforms.uVel.value = speed;
    };
    return { composer, finish };
}
