import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/**
 * Colour fringing that grows with speed, film grain, vignette, dither against banding, and the jump
 * between scenes: everything smears outward from the centre and flashes at the cut.
 */
const FINISH = {
    uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uVel: { value: 0 },
        uJump: { value: 0 },
        uTint: { value: new THREE.Color(0.8, 0.9, 1) },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; uniform float uTime, uVel, uJump; uniform vec3 uTint; varying vec2 vUv;
        float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
            vec2 c = vUv - 0.5; float r = length(c);
            vec2 off = c * (0.0012 + uVel * 0.014 + uJump * 0.05) * (0.4 + r);
            vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
            if (uJump > 0.01) {
                // Zoom blur: average the image along the line from the centre, longer at the edges.
                vec3 acc = vec3(0.0);
                float j = h(gl_FragCoord.xy) * 0.07;
                for (int i = 0; i < 14; i++) {
                    float t = (float(i) + j) / 14.0;
                    acc += texture2D(tDiffuse, 0.5 + c * (1.0 - uJump * 0.42 * t)).rgb;
                }
                col = mix(col, acc / 14.0, smoothstep(0.0, 0.35, uJump));
                col += uTint * pow(uJump, 4.0) * (0.6 + r) * 1.6;
            }
            col *= 1.0 - smoothstep(0.42, 1.05, r) * 0.6;
            col += (h(vUv * 1000.0 + fract(uTime) * 91.0) - 0.5) * 0.04;
            col += (h(gl_FragCoord.xy) - 0.5) / 255.0;
            gl_FragColor = vec4(col, 1.0);
        }`,
};

export type Post = {
    composer: EffectComposer;
    /** `jump` 0–1 is the cut between scenes; `tint` colours its flash. */
    finish: (t: number, speed: number, jump: number, tint: THREE.Color) => void;
};

export function createPost(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    small: boolean
): Post {
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), small ? 0.5 : 0.6, 0.4, 0.7));
    composer.addPass(new OutputPass());
    // Clean edges on towers, rings and fibres (the renderer itself runs without MSAA).
    composer.addPass(new SMAAPass());
    const pass = new ShaderPass(FINISH);
    composer.addPass(pass);
    const finish = (t: number, speed: number, jump: number, tint: THREE.Color): void => {
        pass.uniforms.uTime.value = t;
        pass.uniforms.uVel.value = speed;
        pass.uniforms.uJump.value = jump;
        pass.uniforms.uTint.value.copy(tint);
    };
    return { composer, finish };
}
