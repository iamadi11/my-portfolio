import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/**
 * Colour fringing that comes in with speed (none at rest), film grain, a light vignette, dither
 * against banding, and the jump through the air: everything smears outward from the centre and
 * flashes at the cut. `uStreak` (0–1) keeps the smear and flash to the passages through the air; a
 * portal is entered through its window instead (services.ts).
 */
const FINISH = {
    uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uVel: { value: 0 },
        uJump: { value: 0 },
        uDip: { value: 0 },
        uStreak: { value: 1 },
        uTint: { value: new THREE.Color(0.8, 0.9, 1) },
        uAspect: { value: 1.6 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; uniform float uTime, uVel, uJump, uDip, uAspect, uStreak; uniform vec3 uTint; varying vec2 vUv;
        float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
            vec2 c = vUv - 0.5; float r = length(c * vec2(uAspect, 1.0)) / uAspect;
            float jump = uJump * uStreak;
            vec2 off = c * (smoothstep(0.1, 0.35, uVel) * (0.0012 + uVel * 0.004) + jump * 0.05) * (0.4 + r);
            vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
            if (jump > 0.01) {
                // Zoom blur: average the image along the line from the centre, longer at the edges.
                vec3 acc = vec3(0.0);
                float j = h(gl_FragCoord.xy) * 0.07;
                for (int i = 0; i < 14; i++) {
                    float t = (float(i) + j) / 14.0;
                    acc += texture2D(tDiffuse, 0.5 + c * (1.0 - jump * 0.42 * t)).rgb;
                }
                col = mix(col, acc / 14.0, smoothstep(0.0, 0.35, jump));
                col += uTint * pow(jump, 4.0) * (0.6 + r) * 1.6;
            }
            // A quiet change of place: the frame sinks into the night from the edges in, then rises.
            // Its peak is true black: the dark is reached well before the dip's top and held there.
            float dark = clamp(uDip * (1.3 + r * 0.6), 0.0, 1.0);
            col *= pow(1.0 - smoothstep(0.0, 0.85, dark), 1.5);
            // Vignette: a long, soft falloff by distance from the centre, the corners at 1.
            col *= 1.0 - 0.35 * pow(smoothstep(0.3, 1.15, length(c) * 1.4142), 1.6);
            // Film grain: in the mid-tones, in screen space, never lifting the blacks.
            float lum = dot(col, vec3(0.3, 0.59, 0.11));
            col += (h(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.05 * sqrt(max(lum, 0.0)) * (1.0 - min(lum, 1.0));
            col += (h(gl_FragCoord.xy) - 0.5) / 255.0 * (1.0 - uDip);
            col = max(col, 0.0);
            gl_FragColor = vec4(col, 1.0);
        }`,
};

/**
 * The bloom's bright pass, read with four taps spread over each of its (much larger) texels so small
 * lights neither alias nor flicker as the chain shrinks; each tap is clamped, so a specular glint
 * on metal can't flood the chain.
 */
const BRIGHT_FRAG = /* glsl */ `
    uniform sampler2D tDiffuse; uniform vec3 defaultColor; uniform float defaultOpacity;
    uniform float luminosityThreshold, smoothWidth; uniform vec2 uStep; varying vec2 vUv;
    vec4 tap(vec2 o) {
        vec4 c = texture2D(tDiffuse, vUv + o * uStep);
        c.rgb = min(c.rgb, vec3(6.0));
        float a = smoothstep(luminosityThreshold, luminosityThreshold + smoothWidth, luminance(c.rgb));
        return mix(vec4(defaultColor, defaultOpacity), c, a);
    }
    void main() { gl_FragColor = 0.25 * (tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0)) + tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0))); }
`;

/** Height of the bloom's first mip (px): halos keep their size on screen at any pixel ratio. */
const BLOOM_H = 256;

/** Pins the bloom chain to BLOOM_H tall at the frame's aspect, whatever size the composer asks for. */
function pinBloom(bloom: UnrealBloomPass): void {
    const uStep = { value: new THREE.Vector2() };
    const u = bloom.highPassUniforms as Record<string, THREE.IUniform>;
    u.uStep = uStep;
    bloom.materialHighPassFilter.fragmentShader = BRIGHT_FRAG;
    const setSize = bloom.setSize.bind(bloom);
    bloom.setSize = (width: number, height: number): void => {
        const h = Math.max(1, height);
        // The pass halves what it is given for its first mip.
        setSize(Math.max(2, Math.round((2 * BLOOM_H * width) / h)), 2 * BLOOM_H);
        // A quarter of a bright-pass texel, in the source's uv.
        uStep.value.set((0.25 * h) / (BLOOM_H * Math.max(1, width)), 0.25 / BLOOM_H);
    };
}

export type Post = {
    composer: EffectComposer;
    /** `jump` 0–1 is the cut between scenes; `tint` colours its flash; `glow` scales the bloom;
     * `dip` 0–1 is a quiet change of place, through the dark; `streak` 0–1 is how much of the
     * jump's zoom blur, fringing and flash to show (1 for the air passages, 0 through a portal). */
    finish: (
        t: number,
        speed: number,
        jump: number,
        tint: THREE.Color,
        glow: number,
        dip: number,
        streak?: number
    ) => void;
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
    pinBloom(bloom);
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
        dip: number,
        streak = 1
    ): void => {
        bloom.strength = strength * glow;
        pass.uniforms.uAspect.value = innerWidth / Math.max(1, innerHeight);
        pass.uniforms.uTime.value = t;
        pass.uniforms.uVel.value = speed;
        pass.uniforms.uJump.value = jump;
        pass.uniforms.uDip.value = dip;
        pass.uniforms.uStreak.value = streak;
        pass.uniforms.uTint.value.copy(tint);
    };
    return { composer, finish };
}
