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
        uDip: { value: 0 },
        uTint: { value: new THREE.Color(0.8, 0.9, 1) },
        uAspect: { value: 1.6 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; uniform float uTime, uVel, uJump, uDip, uAspect; uniform vec3 uTint; varying vec2 vUv;
        float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
            vec2 c = vUv - 0.5; float r = length(c * vec2(uAspect, 1.0)) / uAspect;
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
            // A quiet change of place: the frame sinks into the night from the edges in, then rises.
            col *= 1.0 - smoothstep(0.0, 1.0, uDip * (1.15 + r * 0.6));
            col *= 1.0 - smoothstep(0.42, 1.05, r) * 0.6;
            // Film grain: in the mid-tones, in screen space, never lifting the blacks.
            float lum = dot(col, vec3(0.3, 0.59, 0.11));
            col += (h(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.05 * sqrt(max(lum, 0.0)) * (1.0 - min(lum, 1.0));
            col += (h(gl_FragCoord.xy) - 0.5) / 255.0;
            gl_FragColor = vec4(col, 1.0);
        }`,
};

export type Post = {
    composer: EffectComposer;
    /** `jump` 0–1 is the cut between scenes; `tint` colours its flash; `glow` scales the bloom;
     * `dip` 0–1 is a quiet change of place, through the dark. */
    finish: (t: number, speed: number, jump: number, tint: THREE.Color, glow: number, dip: number) => void;
};

export function createPost(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    small: boolean
): Post {
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // Soft-kneed, HDR-only bloom at the frame's aspect, so halos neither pop on nor stretch.
    const strength = small ? 0.5 : 0.6;
    const bloom = new UnrealBloomPass(
        new THREE.Vector2(Math.round((256 * innerWidth) / Math.max(1, innerHeight)), 256),
        strength,
        0.2,
        1.0
    );
    (bloom.highPassUniforms as { smoothWidth: THREE.IUniform<number> }).smoothWidth.value = 0.6;
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    // Clean edges on towers, rings and fibres (the renderer itself runs without MSAA).
    composer.addPass(new SMAAPass());
    const pass = new ShaderPass(FINISH);
    composer.addPass(pass);
    const finish = (
        t: number,
        speed: number,
        jump: number,
        tint: THREE.Color,
        glow: number,
        dip: number
    ): void => {
        bloom.strength = strength * glow;
        pass.uniforms.uAspect.value = innerWidth / Math.max(1, innerHeight);
        pass.uniforms.uTime.value = t;
        pass.uniforms.uVel.value = speed;
        pass.uniforms.uJump.value = jump;
        pass.uniforms.uDip.value = dip;
        pass.uniforms.uTint.value.copy(tint);
    };
    return { composer, finish };
}
