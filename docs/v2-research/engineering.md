# /v2 engineering: a character-led, heavily animated 3D world that ships safely

Written 2026-10-15 by the Engineering and perf role (`.cursor/skills/portfolio-craft/engineering.md`).
It covers the architecture, packages, loading, tiers, budgets, accessibility, files and milestones for the new `/v2`: a stylised bobblehead of the owner guiding visitors through a 3D world.

- **Inputs read:** `package.json` + lockfile, `node_modules` (three 0.184.0, fiber 9.6.1, React 19.0.0, motion 12.6.3), `src/app/{layout,template,page}.tsx`, `src/app/v2/page.tsx`, `src/components/host/*`, `src/components/instrumented/Vitals.tsx`, `src/content/site.ts`, `next.config.ts`, `docs/v2-realistic-3d-brief.md` §5 (budgets, tiers, a11y; the LAM parts are obsolete), and the sibling notes `docs/v2-research/concepts.md` (Director: **Collector's Edition**) and `docs/v2-research/bobblehead-pipeline.md` (Character and assets).
- **Measured vs estimated:** every size marked *measured* was produced on 2026-10-15 by the method in Appendix A. Everything else is marked *estimate*. No Lighthouse, Core Web Vitals or fps number appears here, because none was run for this note.
- **Concept-agnostic where possible.** The architecture serves any of the Director's concepts. Where it depends on the recommended Collector's Edition, that is said.

---

## 0. Decisions on one screen

| Decision | Choice |
| --- | --- |
| Renderer | WebGL2 through the installed `three` 0.184 + `@react-three/fiber` 9.6.1. No WebGPU: `postprocessing` and drei's materials are WebGL-only, and this scene does not need compute. |
| Source of truth for "where am I" | **Document scroll.** HTML sections set the scroll length; a tiny store turns `scrollY` into a section coordinate `t`; the camera rig damps toward it. The tour and Q&A *scroll the page*, so there is one code path, and keyboard, anchors and Find-in-page all work. No scroll hijack. |
| Choreography | **GSAP 3.15 core + CustomEase**, as *paused* timelines stepped from `useFrame` (camera, set pieces) or from the **audio clock** (the Start signature). No ScrollTrigger, no Lenis, no Theatre. |
| Post | Vanilla **`postprocessing` 6.39.5**: one `EffectComposer`, one merged `EffectPass`. **MSAA** on tier A instead of SMAA (SMAA adds ~57 KB gzip, measured). No `@react-three/postprocessing` (needs fiber ≥ 9.7). |
| Character | One skinned GLB (meshopt, WebP by default), with the head as a rigid child of the `Head` bone on a spring. Mouth from `face.ts` (shape keys with ARKit names, or the Director's face atlas). Visemes follow the AudioContext clock. |
| Physics | **None by default.** Springs and hand-written kinematics cover the recommended concept (Director agrees). If a later concept needs stacking or toppling, `cannon-es` as a lazy chunk (35 KB gzip, measured), never Rapier (834 KB gzip, measured). |
| Loading | HTML + poster first (LCP). The 3D chunk loads after `load` + idle or on first interaction. `compileAsync` + `initTexture` + hidden warm frames, then a crossfade from the poster to the canvas at the same framing, marked `3d-live`. |
| Tiers | A (desktop), B (phones/tablets), C (designed 2D stills + the same guide). A 30-frame probe before the reveal and a p75 monitor while moving. Changes that would recompile shaders wait for a cut. |
| Loop | One R3F loop. `frameloop="always"` only while the tab is visible and the canvas is not covered; `"never"` otherwise. Tier B renders idle-only frames at 30 fps. |
| Reuse | `host/script.ts`, `host/audio.ts` (four small fixes, §2.10), `host/face.ts`, `host/useGuideInput.ts`, `instrumented/Vitals.tsx`. `Host.tsx` is not refactored; `/v2` gets its own pure guide reducer. |

---

## 1. Packages

### 1.1 Installed baseline (measured)

| Package | Installed | Peer ranges | gzip |
| --- | --- | --- | --- |
| `three` | 0.184.0 (`sideEffects: ["./src/nodes/**/*"]`) | n/a | `three.core.min.js` 100,728 B + `three.module.min.js` 86,457 B = **187 KB** |
| `@react-three/fiber` | 9.6.1 (latest is 9.8.2, published 2026-10-14) | react `>=19 <19.3`, three `>=0.156` | ESM minified: **114 KB** (it bundles react-reconciler). Its deps `its-fine`, `scheduler` and `zustand` add ~3 KB. |
| `react` / `react-dom` | 19.0.0 (pinned) | satisfies fiber 9.6.1 | n/a |
| `motion` | 12.6.3 | n/a | Used by the old routes and by `src/app/template.tsx` (see §1.5). Not used on `/v2`. |
| three addons (in the bundle) | `GLTFLoader` 13.0 KB, `meshopt_decoder.module.js` 7.7 KB (WASM inlined, no extra fetch), `RoomEnvironment` 0.9 KB, `KTX2Loader` 5.3 KB | | |
| three decoders (fetched files) | Basis transcoder `.js` 15.1 KB + `.wasm` **245.4 KB**; Draco `.wasm` 63.2 KB + wrapper 11.5 KB | | |

### 1.2 Candidates, peer-checked against fiber 9.6.1 / three 0.184 / React 19.0.0

| Package | Version (npm, 2026-10-15) | Licence | Peers vs installed | gzip | Verdict |
| --- | --- | --- | --- | --- | --- |
| **`postprocessing`** | 6.39.5 | Zlib | three `>=0.168.0 <0.187.0` ✓. **Caps three below 0.187.** | Whole build 117 KB. Tree-shaken (measured approximation): composer + bloom + tone mapping + vignette = **17.6 KB**; + noise + tilt-shift = **18.7 KB**; + FXAA = **20.1 KB**; + DOF + chromatic aberration ≈ 22.7 KB. **SMAA adds ~57 KB** (embedded lookup images: 76.4 KB with tilt-shift). | **Add.** |
| `@react-three/postprocessing` | 3.2.0 | MIT | fiber `>=9.7.0` ✗ (3.1.x too; 3.1.0 also wants react ^19.2). 3.0.4 accepts fiber ^9.0.0 but is from Feb 2025, on n8ao 1.x. | Wrapper only; pulls `n8ao` ^2 and `maath`. | **Not added.** A 40-line `Post.tsx` replaces it with no fiber bump. |
| **`gsap`** | 3.15.0 | GSAP Standard "no charge" licence (checked at gsap.com/standard-license): free for any website, commercial use included, **all plugins** included. The restriction: no use in visual no-code animation builders that compete with Webflow. Keep the notices. | None | `gsap.min.js` **28.3 KB**, `CustomEase` 3.7 KB, `SplitText` 3.6 KB, ScrollTrigger 18.0 KB, Flip 9.7 KB, ScrollSmoother 5.5 KB | **Add core + CustomEase (32 KB).** SplitText only if the HTML layer animates per word (it sets `aria-label` and hides the split spans by default). |
| `@gsap/react` | 2.1.2 | GSAP licence | gsap ^3.12.5, react >=17 ✓ | 1.1 KB | Not added. `gsap.context()` in a `useLayoutEffect` is 3 lines. |
| **`@react-three/drei`** | 10.7.9 | MIT | fiber ^9.0.0 ✓, react ^19 ✓, three >=0.159 ✓. `sideEffects: false`, **no `exports` map**, so `@react-three/drei/core/X` deep imports resolve. | Per module, minified (excluding its imports): `ContactShadows` **1.1 KB**, `AccumulativeShadows` 2.5 KB, `MeshPortalMaterial` 2.8 KB (+ RenderTexture/Fbo), `Outlines` 1.4 KB, `PerformanceMonitor` 0.8 KB. **Traps:** `Environment` pulls `useEnvironment` → three-stdlib EXR + RGBE loaders + fflate + `@monogrid/gainmap-js` (~25–30 KB), and its presets fetch HDRIs from `raw.githack.com` (a third-party request). `useGLTF`/`useKTX2` use three-stdlib's copies of the loaders, duplicating three's. **Install footprint:** `@mediapipe/tasks-vision` (20.4 MB) and `hls.js` (32.8 MB) land in `node_modules` (not in the bundle). | **Add, deep imports only:** `ContactShadows` now (the Director's "contact shadows everywhere"); `MeshPortalMaterial` or `Outlines` only if a shot needs them. Ban the barrel with an ESLint `no-restricted-imports` rule. |
| `@react-three/rapier` | 2.2.0 | MIT | fiber ^9.0.4 ✓, react ^19 ✓, three >=0.159 ✓ | Binding **8.2 KB**, but it pins `@dimforge/rapier3d-compat` **0.19.2**, whose `rapier.mjs` (WASM inlined as base64) is **834 KB** (non-compat `.wasm` alone: 583 KB). The Director measured 0.21.0 at 1.17 MB (WASM) and 1.65 MB (compat). | **Rejected.** Heavier than the whole 3D core budget. |
| `cannon-es` | 0.20.0 (last published 2022-08-12) | MIT | none | **35.0 KB** minified | **Only if** a concept needs rigid-body stacking or toppling. Lazy chunk, budget ≤ 40 KB. Not needed for Collector's Edition. |
| `lenis` | 1.3.26 | MIT | react >=17 (optional) | **5.4 KB** | Not in the set. The damped camera already gives the buttery feel, and Lenis is one more thing between the visitor and native scroll (reduced motion, keyboard, assistive tech). Optional M4 trial on fine pointers only, behind a flag, if the HTML layer's wheel steps look coarse next to the camera. |
| `@theatre/core` / `studio` / `r3f` | 0.7.2 (last published 2024-05-19) | core Apache-2.0, **studio AGPL-3.0** | `@theatre/r3f` wants fiber `^8.13.6` ✗ | core **50 KB**, studio 244 KB | **Rejected.** Incompatible binding, stale, and 50 KB for what a GSAP timeline does. |
| `maath` | 0.10.8 | MIT | three >=0.134 | 11.4 KB whole | Not a direct dependency. `THREE.MathUtils.damp` and `Quaternion.slerp` with `1 - exp(-λ·dt)` cover it. It still arrives transitively with drei. |
| `three-stdlib` | 2.36.1 (Nov 2025) | MIT | three >=0.128 | per loader | Not a direct dependency. Use `three/examples/jsm/*`, which matches r184. |
| `@pmndrs/assets` | 1.7.0 | CC0 | none | Assets are **base64 inside JS modules**: 36 HDRIs (~8 MB total, 130–190 KB each), 568 matcaps (~4 KB each) | Not a dependency (base64 in JS costs parse time and defeats HTTP caching). If one matcap or HDRI is wanted, copy that CC0 file into `public/v2/` as a binary. `RoomEnvironment` (0.9 KB) is the zero-byte default. |
| `n8ao` | 2.0.1 | ISC (the earlier brief said CC0; npm says ISC) | postprocessing >=6.30 ✓ | `N8AO.js` 93.6 KB, unminified, not tree-shaken | Not added. In a stylised toy world AO is baked (Blender) or comes from contact shadows. |
| `three-custom-shader-material` | 6.4.0 | MIT | fiber >=8, three >=0.159 ✓ | n/a | Not added. `material.onBeforeCompile` + `customProgramCacheKey` covers the inflate, dissolve and rim shaders. |
| `camera-controls` | 3.1.2 | MIT | three >=0.126 | 12.2 KB | Not added. The camera is authored, not orbited. |

### 1.3 The recommended set

| Add | Version | Why (one line) | gzip in the 3D chunk |
| --- | --- | --- | --- |
| `postprocessing` | `6.39.5` (exact) | Bloom, tone mapping, vignette, grain, tilt-shift and the transition mask in one merged pass. | ~19–20 KB (measured approximation) |
| `gsap` | `3.15.0` (exact) | Seekable, reversible, multi-track choreography for 3D and HTML on one clock, plus `gsap.matchMedia()` for reduced-motion and breakpoint variants. | 32 KB (core + CustomEase, measured) |
| `@react-three/drei` | `10.7.9` (exact) | `ContactShadows` (and later portal or outline modules) without re-deriving ~150–300 lines of render-target plumbing each. | ~2–5 KB for the allowlist (measured modules; helper imports estimated) |

**Remove (sequenced, §1.5):** `gaussian-splat-renderer-for-lam`, `src/types/lam.d.ts`, `public/avatar/*.zip`.
**Pin:** `three` stays at 0.184.x while `postprocessing` caps it below 0.187. Keep fiber at the locked 9.6.1 (the `^9.6.1` range would allow 9.8.2 on a fresh install without a lockfile; there is no need to move).

**3D core chunk estimate:** three 187 + fiber 117 + postprocessing 20 + GLTFLoader and meshopt 21 + gsap 32 = **~377 KB** of library code (each part measured) + world code **40–60 KB** (estimate) = **~417–437 KB** against a 450 KB budget. That is tight. M0 measures it first. The levers, in order:
1. Move set pieces and the guide dock out of the core chunk (they are lazy anyway).
2. Replace GSAP with a 30-line keyframe sampler (−32 KB). The camera and signature are pure functions of `t`, so this is a contained swap.
3. Drop effects from the composer.

### 1.4 Not adding, and why (one line each)

- **ScrollTrigger:** no pinning is needed (a fixed canvas sits behind normal-flow HTML), and the scroll store is ~40 lines with damping and cuts that ScrollTrigger would not do for us. Add it (18 KB) only if one section needs a pinned, scrubbed HTML sequence.
- **Lenis:** see §1.2. An M4 trial at most.
- **Theatre.js:** the fiber 8 binding, stale since May 2024, and an AGPL studio.
- **Rapier:** 834 KB gzip (measured).
- **KTX2 by default:** the transcoder is 260 KB gzip (measured). For one or two character textures, WebP plus `initTexture` during the hidden warm-up costs fewer bytes and causes no visible hitch. Switch to KTX2 when the texture count or VRAM requires it (§4.3).
- **Draco:** meshopt has a smaller decoder (7.7 KB, inlined), decodes faster, and compresses morph targets and animation, which Draco does not.
- **SMAA:** +57 KB gzip (measured). Use MSAA (`multisampling`) on tier A, which also handles thin geometry such as glasses frames better.

### 1.5 Repo facts that change the plan

1. **`src/app/template.tsx` is a client component on every route, including `/v2`.** It returns early for `/` and `/v2`, but its imports (`motion/react`, `Header`, `Layout`, `SocialLinks` with react-icons) are still in `/v2`'s initial JS. M0 records `/v2` route JS. If the template costs more than ~30 KB or pushes the route over 200 KB, move the classic routes into a route group `src/app/(classic)/` that owns the template. That restructures core pages, so it needs the owner (CLAUDE.md §6.3).
2. **`<html className="scroll-smooth">`** (root layout) smooth-scrolls anchor jumps even under reduced motion. Change it to `motion-safe:scroll-smooth`: one class, all routes benefit.
3. **`public/profile_pic.png` is 1.95 MB** and is the raw LCP `<img>` on `/` today. The `/v2` poster must be an AVIF/WebP of ≤ 120 KB.
4. **LAM removal is sequenced.** `/v2` never imports it. `/` still uses it (`Host.tsx` → `Avatar.tsx`). Move the `Face` type from `Avatar.tsx` into `face.ts` first. Then either remove the package when `/v2` is promoted and `Host.tsx` is deleted, or earlier by switching `/` to its existing photo-only path (`avatar` undefined), with `/`'s own checks passing.
5. **Fiber gotchas against r184 (verified in source):**
   - `<Canvas shadows>` sets `PCFSoftShadowMap`, which r184 deprecates. It warns and falls back to `PCFShadowMap`. Use `shadows="percentage"` and soften with `light.shadow.radius`; r184's PCF path honours it.
   - Fiber defaults to ACES tone mapping. Pass `flat` (renderer `NoToneMapping`) because tone mapping happens in the composer.
   - On unmount, fiber 9 calls `forceContextLoss()`. Context count is safe across navigations.
   - `renderer.compileAsync` compiles materials of **all** objects (`scene.traverse`) but collects lights only from **visible** ones (`traverseVisible`). Keep the light count fixed and fade intensity; never toggle `visible` or add or remove lights.
6. **CLAUDE.md §10 ("SITE + 3D HOST RULES") has one rule that conflicts with this plan.** The Loki rules are gone: the working tree (uncommitted, as of this note) already deletes `src/components/v2/*` and `steps.md`.
   - §10.5 says "the renderer and avatar load only after Start". This plan preloads the 3D chunk after `load` + idle, *before* Start. That preload is what gives a live cut-out in the first 5 s, an invisible poster swap, and a Start with no wait.
   - **Default:** scope §10.5 to `/` and give `/v2` the gates in §5.1: lazy after first paint, ≤ 2.5 MB of 3D before the first interaction, 0 on tier C.
   - **The compliant alternative:** load nothing 3D until Start. The pre-Start cut-out is then CSS only, and the signature's anticipation phase covers the whole download (§2.4).
   - §10.6 (no sound before Start, captions always on) and the `/` ≤ 120 kB first-load gate stand as written.

---

## 2. Runtime architecture

### 2.1 Layers and owners

```
z 3  HTML: header/h1, sections, sheets (<details>/<dialog>), dock, hit-buttons   (server-rendered; the content)
z 2  grain (CSS, optional)                                                       (pointer-events: none)
z 1  poster <img fetchpriority="high">  ── crossfades out at 3d-live ──┐
z 0  <Canvas aria-hidden>  position: fixed; inset: 0; height: 100lvh   ◄─┘       (pointer-events: none)

stores (plain modules, no React state in the frame path):
  scroll.ts  t = section index + progress     ← passive scroll listener, ResizeObserver
  pointer    normalised x,y, velocity         ← window pointermove (passive)
  guide      machine state (§7.2)             ← Dock, Start, Q&A
  assets     progress 0..1, ready             ← fetch byte counts
  perf       frame-time ring buffer, tier     ← render loop
```

- **The canvas never takes pointer events.** Every interaction is an HTML control positioned over its 3D object: a transparent `<button aria-label="Bobble Aditya's head">` over the head's projected bounds, playset buttons, and a drag surface for the ducks. Each gets keyboard support for free, there is no raycasting cost, and WCAG 2.5.7 (a single-pointer alternative to dragging) is met by the same button. Overlay positions are written each frame as `transform` only.
- **The canvas is `100lvh` tall.** iOS Safari changes `innerHeight` as its toolbar collapses. A `100svh`/`100%` canvas would resize, and every render target would reallocate, mid-scroll. `lvh` stays constant.

### 2.2 Frame pipeline (one loop, `useFrame` priorities)

| Priority | Work | Notes |
| --- | --- | --- |
| −3 | Read stores; clamp `dt = min(delta, 1/30)`; push the frame time to `perf` | Large deltas after a hidden tab never explode springs. |
| −2 | **Rig:** damp `t`, seek the camera timeline, apply focal length and lens shift | §2.3 |
| −1 | Step choreography timelines; `mixer.update(dt)`; character procedural layers (look-at, bobble, mouth, blink) | Procedural layers run **after** the mixer, every frame (§2.5). |
| 0 | Active set piece, particles | Each returns early when its section is out of range. |
| 1 | `composer.render(dt)` (render takeover) | Tier B with no motion source: render every second frame. |
| 2 | Write overlay transforms (hit-buttons, labels) | Transform only, never layout. |

Driving GSAP: world-linked timelines are created `paused: true` and stepped here (`tl.time(x)`). GSAP's own ticker runs only for standalone HTML micro-interactions. So when the canvas loop stops, the world's choreography stops with it, and nothing drifts.

### 2.3 Scroll store → camera rig

```ts
// scroll.ts: the only scroll reader. t = index + progress through [data-shot] sections.
let tops: number[] = [];
let t = 0;
const measure = (): void => {
    tops = [...document.querySelectorAll<HTMLElement>('[data-shot]')].map((el) => el.offsetTop); // layout read only on resize
};
const read = (): void => {
    const y = scrollY + innerHeight * 0.5;
    const i = Math.max(0, tops.findLastIndex((top) => top <= y));
    const end = tops[i + 1] ?? document.documentElement.scrollHeight;
    t = i + Math.min(1, (y - tops[i]) / Math.max(1, end - tops[i]));
};
// new ResizeObserver(() => { measure(); read(); }).observe(document.body); addEventListener('scroll', read, { passive: true });
export const scrollT = (): number => t;
```

```ts
// Rig (priority −2). The shot table is data, one set per orientation (portrait for 375 and 768×1024, landscape for 1440).
const rig = { az: 0, r: 2.4, h: 1.5, tx: 0, ty: 1.4, tz: 0, mm: 85, sx: 0, sy: 0 };
// Build once per orientation: section i−1 → i occupies [i−1, i−1+travel] of the timeline; the rest is dwell.
shots.forEach((s, i) => i && tl.to(rig, { ...s.pose, duration: s.travel, ease: 'camera' }, i - 1)); // CustomEase 'camera'
useFrame((_, dt) => {
    const target = scrollT();
    damped = Math.abs(target - damped) > 2.5 ? cut(target) : THREE.MathUtils.damp(damped, target, 4, dt);
    tl.time(damped);
    camera.position.setFromCylindricalCoords(rig.r, rig.az, rig.h);
    camera.lookAt(rig.tx, rig.ty, rig.tz);
    camera.setFocalLength(rig.mm); // filmGauge 35: real 35/50/85 mm lenses
    camera.setViewOffset(w, h, rig.sx * w, rig.sy * h, w, h); // composition by lens shift, never yaw
}, -2);
```

- **Cuts:** a jump of more than 2.5 sections (nav click, tour skip, Q&A) snaps `damped` under a 160 ms cover. In Collector's Edition that cover is the cardboard flap across the lens. Reduced motion: every section change is a cut, and one frame renders.
- **Poster match (invisible swap):** the poster is a render of the hero shot at a reference aspect `A`, laid out with CSS `object-fit: cover`. The live camera reproduces the cover crop: `fov = viewportAspect > A ? 2·atan(tan(fovRef/2)·A/viewportAspect) : fovRef`, and `object-position` maps to the lens shift. One formula, so no layout shift and no visible pop.
- **Cost:** < 0.1 ms per frame (estimate). The camera moves are continuous with scroll and never steal it.

### 2.4 Choreography: the Start signature on the audio clock

- **Built at mount**, as one paused timeline with labels. Tracks for Collector's Edition: box tilt and dolly zoom, cut-out `uDepth` 0.02 → 1.12 → 1, `uLit` 0 → 1, hop and landing (squash and stretch), head impulse on landing, box unfold, HTML hero exit and dock entrance.
- **Stepped from the AudioContext:** `sig.time(ctx.currentTime − t0 − latency)`. The sound effects are scheduled at exact `ctx` times at the click. Picture and sound share one clock, so a slow frame never desyncs the pop from its "pop".
- **Waiting for assets:** if Start is pressed before the character is ready, the timeline sits in an "anticipation" loop (the cut-out wobbles, the tape peels in step with `assets.progress`). The pop runs on `ready`, after at least 400 ms. After 25 s, or on any failure, the guide switches to `render: '2d'` and keeps talking as the printed cut-out (the same fallback `Host.tsx` uses today).
- **Reduced motion:** seek straight to the end label, with a 200 ms opacity crossfade. Same sound, same first line.
- **INP:** the click handler only creates the `Voice`, schedules sounds and dispatches `START`. Shaders are already compiled.

### 2.5 Character

The pipeline from `bobblehead-pipeline.md`: a skinned body with clips, and a **rigid head mesh parented to the `Head` bone** (no jaw bone; the mouth is shape keys or a face atlas).

| Layer (runs after `mixer.update`) | Implementation | Cost |
| --- | --- | --- |
| Base clip | `AnimationMixer`: idle / greet / talk-idle / point-L / point-R / react; switches with `crossFadeTo(next, 0.25)`. Strip morph tracks from body clips at export so clips never fight the mouth. | One skinned draw; ≤ 40k triangles (A), ≤ 20k (B) |
| Bobble | A damped spring on a pivot object between `Head` and the head mesh (code below). Impulses come from a flick (pointer velocity on the hit-button), the body's root acceleration (hops), viseme onsets on `aa`/`O`/`E` (a 0.04 rad nod), and key **B**. | ~0 |
| Look-at | Yaw and pitch toward a target, solved in the neck's space and clamped to ±35° yaw / ±20° pitch. Eyes lead (λ 14) and the head follows (λ 6). Target: the pointer (fine pointers only), otherwise the next set piece or the camera. | ~0 |
| Mouth | **Shape keys:** `mouth(visemes, ms)` from `face.ts` returns ARKit-named weights, damped (λ 18) into `morphTargetInfluences[dict[name]]`; names the mesh lacks are skipped. **Face atlas** (the Director's alternative): map the active Oculus viseme to one of 7 cells via `map.offset`. Pick by look in M1; both read the same `voice.now()`. | Shape keys: morph-texture lookup on ~15k head vertices; atlas: 0 |
| Blink and rest | `ambience()` from `face.ts` | 0 |

```ts
// bobble.ts: pure; one check in scripts/check-host.mjs (an impulse decays below 1e-3 rad within 1.5 s).
export const SPRING = { k: 140, c: 10 }; // motion token; damping ratio c / (2·√k) ≈ 0.42 gives 2–3 visible wobbles
export function stepBobble(s: { x: number; y: number; vx: number; vy: number }, dt: number, ax = 0, ay = 0): void {
    for (let left = Math.min(dt, 1 / 30); left > 1e-6; left -= 1 / 120) {
        const h = Math.min(left, 1 / 120); // fixed 120 Hz substeps: stable on 30–144 Hz displays
        s.vx += (-SPRING.k * s.x - SPRING.c * s.vx - ax) * h;
        s.vy += (-SPRING.k * s.y - SPRING.c * s.vy - ay) * h;
        s.x += s.vx * h;
        s.y += s.vy * h;
    }
}
// In useFrame(−1), after mixer.update: pivot.rotation.set(s.x, 0, s.y). The pivot is a child of Head, so the clip never overwrites it.
```

- **Lip sync is on the audio clock.** `voice.now()` already measures from `ctx.currentTime`. Fix it to subtract output latency (`ctx.outputLatency || ctx.baseLatency || 0`), or Bluetooth headphones put the mouth 100–250 ms early (estimate; varies by device). Safari may report 0; fine.
- **Secondary motion:** feed the root's acceleration into the spring (`ax, ay`), so hops make the head lag and overshoot with no physics engine.
- **Tier B:** a separate `owner.b.glb` (LOD + 1K texture). It is loaded **instead of** the A file, never as well.

### 2.6 Transitions between scenes and worlds

| Technique | Cost | Use |
| --- | --- | --- |
| **Continuous world + camera move** | 0 extra | The default between adjacent sections. |
| **Foreground occluder** (the cardboard flap parented to the camera at 0.05 m, 180 ms) | 1 draw for 180 ms | Cuts (jumps > 2.5 sections, reduced motion), and it hides set-piece mount and unmount. The Director's choice; no shader. |
| **Screen-space mask wipe** (freeze the last frame into a render target once, then a noise or radial mask in a custom `Effect` inside the existing `EffectPass`) | One copy (~0.2 ms, estimate) + one texture sample per pixel while active | When the next world is not physically adjacent. Works on every tier. |
| **In-world portal** (drei `MeshPortalMaterial`) | Renders a second scene every frame while visible (≈ the cost of that scene again) | Tier A only, at most one on screen, the portal scene ≤ 30 draws at half resolution. Tier B swaps it for the mask wipe. |
| HTML sheet changes | 0 (CSS/WAAPI; View Transitions where supported) | Opening and closing project sheets. |

### 2.7 Shader set pieces (stylised that reads premium)

| Effect | How | Cost / rule |
| --- | --- | --- |
| **Inflate 2D → 3D** | `onBeforeCompile`: after `<skinning_vertex>`, `transformed.z *= uDepth;` and mix the printed photo (planar UV) into the albedo by `uLit`. | Uniform-driven, so one program for every state. Precompiled with the hero. |
| **Dissolve / reveal** | A noise threshold with `alphaTest` and an emissive edge band (HDR > 1, so only the edge blooms). | Same rule. |
| **Painted resin (character)** | `MeshPhysicalMaterial({ roughness 0.45, clearcoat 0.5, clearcoatRoughness 0.25 })` + a 512 px code-generated fBm roughness `DataTexture`; optional `sheen` for skin warmth. | Clearcoat adds a second specular lobe; fine for one character. Tier B: `MeshStandardMaterial` with the same maps. |
| **Toon option** | `MeshToonMaterial` + a 3–4 px `gradientMap` (`NearestFilter`) + drei `Outlines` (inverted hull) on the character only. | The hull doubles the character's vertex work. Only if the art direction moves to cel shading. |
| **Rim light** | A real back light, or a fresnel term injected via `onBeforeCompile`. | ~0 |
| **Matcap** | `MeshMatcapMaterial` on distant props for tier B. | One texture lookup, no lights. |
| **Blister glint** (packaging) | A shader band swept across the window's plastic on Start hover or focus. Do **not** animate a `Lightformer`: that means re-running PMREM every frame. | ~0 |

**Shader rules:** a fixed light count; no `visible` toggling of lights; no material `define` changes at runtime outside a cut; every set piece compiled with `gl.compileAsync(group, camera, scene)` before it becomes visible; `renderer.info.programs.length` ≤ 40.

### 2.8 Particles with purpose

- **Only with a cause:** confetti on the pop-out (the Director's 40 instanced quads with a hand-written ballistic update, removed after 1.2 s), the marble run's marbles (one per real frame, from the `perf` ring buffer, so the set piece reuses the same data), and steam or dust only where a light shaft justifies it.
- **Implementation:** one `InstancedMesh` or `Points` per system. Animate on the GPU from a time uniform where possible; CPU updates only for ≤ 100 instances.
- **Budget:** ≤ 2,000 points (A), ≤ 600 (B), 0 under reduced motion. Additive overdraw is the real cost: sprites ≤ 8 px at 1440, `depthWrite: false`, no full-screen soft quads.

### 2.9 Physics and play

- **Collector's Edition needs no engine:** head flick = spring; brick knock-apart and sprue parts = sphere-plane kinematics; ducks = a spring chain; the train = a curve parameter.
- **If a future concept needs real rigid bodies:** use `cannon-es` 0.20.0 as a lazy chunk, loaded when the play section is ≥ 50% visible. Fixed 60 Hz step with an accumulator and at most 2 substeps per frame; primitive colliders; ≤ 30 bodies (A) / ≤ 15 (B); sleeping on; step only while the section is active and a body is awake; render through one `InstancedMesh`.
- **The same impulse three ways:** pointer flick, touch flick, and a key on the focused hit-button. Play is never needed to read anything.

### 2.10 Sound

- **One `AudioContext`,** the existing `Voice` from `host/audio.ts`. Add `audio/sfx.ts` on the same context and master gain (the Director's foley list: tape rip, flap thump, pop, sonified boing, clacks, snaps, squeaks, room tone).
- **Four small changes to `audio.ts`** (all backward-compatible with `/`):
  1. **Expose `ctx` and `out`** for the SFX bus, and add `duck(db)`: −8 dB on ambience and foley while a line plays (`setTargetAtTime`, τ 80 ms).
  2. **End lines with `source.onended`** instead of `setTimeout(duration)`. Today a suspended context (hidden tab) lets the wall-clock timer advance the tour while the audio is frozen. Keep the timer only for missing clips.
  3. **Latency compensation** in `now()` (§2.5).
  4. **Suspend on `visibilitychange`:** `ctx.suspend()` / `resume()`. That pauses the voice and its viseme clock together, for free.
- **Contact and impulse sounds:** gain from impulse, throttled to one per 50 ms per source, at most 4 voices.
- **iOS ringer switch:** Web Audio is muted by the silent switch unless `navigator.audioSession.type = 'playback'` (Safari 16.4+; not in TypeScript's DOM lib, so it needs a cast). Set it inside the Start click. **Verify on a device.** Captions cover the case either way.

---

## 3. Look: light, shadows, post, colour (stylised but physically lit)

| Area | Tier A | Tier B | Notes |
| --- | --- | --- | --- |
| **Environment** | `PMREMGenerator.fromScene(new RoomEnvironment(), 0.04)` once, 256 px; `scene.environmentIntensity` tuned | 128 px | 0 bytes downloaded. A custom light scene with panels in the world's key and fill colours replaces `RoomEnvironment` if reflections need a brand tint. No drei `Environment` presets (third-party CDN). |
| **Key light** | One `DirectionalLight` casting shadows; `shadows="percentage"`, `mapSize` 1024, `radius` 3–4; ortho frustum fitted tightly around the focus (about 3 m) and moved with the shot | Shadow off; blob shadow | `castShadow` on the character and dynamic props only. |
| **Contact** | drei `ContactShadows` with `frames={1}` per playset, re-rendered on landing or after a change | A pre-blurred radial texture under the figure | `frames={Infinity}` re-renders the whole scene from below every frame; avoid it. |
| **Baked light** | Static props: AO baked in Blender into vertex colour or `aoMap`; code-built props get a generated AO gradient | Same | The cheapest premium cue. No SSAO or N8AO. |
| **Practicals** | Emissive HDR > 1 for LEDs and signals | Same | Only those bloom. |
| **Bloom** | `BloomEffect({ mipmapBlur: true, luminanceThreshold: 1.0, intensity 0.4–0.6 })` | `resolutionScale 0.5` | The CLAUDE.md §10 floor (threshold ≥ 0.06) is satisfied. |
| **Tone mapping** | `ToneMappingEffect` **NEUTRAL** (Khronos PBR Neutral keeps signal orange `#FF5A1F` and bone white faithful) or **AGX** for a moodier grade; decide side by side in M1. Both modes exist in 6.39.5. | Same | The renderer stays `NoToneMapping` (Canvas `flat`). |
| **Lens** | Vignette (offset 0.35, darkness 0.4); grain via `NoiseEffect` (premultiply, ~0.04); tilt-shift on playset shots | Vignette only | Tilt-shift adds ~1 KB (measured). |
| **DOF** | Hero and macro shots only, focus on the head | Off | +~3.5 KB (measured approximation) plus CoC and blur passes. |
| **AA** | `EffectComposer({ frameBufferType: HalfFloatType, multisampling: 4 })` | FXAA (≈ +1.4 KB) or none at dpr 1.25 | 4× MSAA on a HalfFloat target at 1440×900×1.5 dpr ≈ 93 MB VRAM (estimate). Drop to 2× if VRAM-bound. |
| **Colour management** | Fiber defaults: `ColorManagement.enabled`, `outputColorSpace = SRGBColorSpace`. GLTFLoader tags colour maps sRGB; normal, roughness and AO stay linear; `CanvasTexture` labels set `colorSpace = SRGBColorSpace`; toon `gradientMap` uses `NoColorSpace`. | Same | Palette tokens live in one `tokens.ts` → CSS variables + `THREE.Color`, so the HTML cards and the world match. |

---

## 4. Loading

### 4.1 Sequence

1. **HTML** (server component): the h1, role, city, availability, Start, Skip, nav, every section's minimal text, and the on-demand sheets. The poster is `<img fetchpriority="high">` (AVIF ≤ 120 KB, landscape and portrait sources). The LCP element is HTML, never the canvas.
2. **Client island** (small): tier detection, the scroll store, Start/Skip state. No three.
3. **3D chunk** via `next/dynamic(() => import('…/World'), { ssr: false })` from the island. It starts after `load` + `requestIdleCallback` (timeout 1500 ms) **or** on the first `pointerdown`/`keydown`/`scroll`, whichever comes first. Skipped on tier C, with "3D off", or with `saveData` (which offers a "Load 3D" key).
4. **Hero assets:** the character GLB (A or B) through `fetch` with streamed byte counts → `assets.progress`, then `gltfLoader.parseAsync(buffer, base)`. Progress totals come from a build-time manifest of **decoded** byte sizes, because `Content-Length` is the compressed size when the CDN compresses and the progress would overshoot 100%.
5. **Warm-up (canvas at opacity 0):** `await gl.compileAsync(scene, camera)` → `gl.initTexture(t)` for every texture → render 3 frames through the composer. This compiles the post shaders and the shadow depth programs, uploads textures, and doubles as the **tier probe** (§5.3). Opacity 0 still paints, unlike `visibility: hidden`.
6. **Reveal:** crossfade the poster to the canvas (400 ms; 0 under reduced motion), then `performance.mark('3d-live')`. Target ≤ 4 s on tier A over broadband (skill).
7. **Set pieces:** `React.lazy` inside the Canvas, prefetched when the previous section passes 50%. On arrival: `compileAsync(group, camera, scene)` → `initTexture` → visible. Kept mounted afterwards (memory is small; remounting would recompile).
8. **Voice:** per line, prefetching the next two (existing). The dock code loads on Start.

### 4.2 Bytes before the first interaction (the 2.5 MB rule)

- The 3D JS chunk is ~0.42–0.44 MB (estimate, §1.3). That leaves **≤ ~1.9 MB for the character GLB on A** with WebP, or ≤ ~1.6 MB with KTX2 (its transcoder is 0.26 MB). B: ≤ 1.0 MB.
- `bobblehead-pipeline.md` estimates the hero at 2.0–3.0 MB (with KTX2 and an optional normal map). **The two budgets conflict.** Resolve it one of two ways:
  - trim the hero: drop the normal map ("vinyl is smooth"), use WebP base colour and a packed 1K ORM; or
  - start the character download on the first interaction (Start hover or focus, pointerdown, scroll) instead of on idle, and let the signature's anticipation phase absorb the wait.
- **Default:** trim. The pre-Start live state (a blinking, tracking cut-out) needs the textures but not the full rig, so the first option also gives a better first 5 s.

### 4.3 Decoders and textures

| Format | Decision |
| --- | --- |
| **Geometry and animation** | `EXT_meshopt_compression` (gltf-transform `--compress meshopt`, quantised; morph deltas sparse). Decoder: `three/examples/jsm/libs/meshopt_decoder.module.js`, bundled (7.7 KB, WASM inline). |
| **Textures (default)** | WebP (`EXT_texture_webp`). GLTFLoader decodes off the main thread via `ImageBitmapLoader` (except Safari < 17 and Firefox < 98, verified in r184 source). Upload happens in the hidden warm-up (`initTexture`), so no visible hitch. VRAM: ~22 MB per 2K map with mips. |
| **KTX2 (switch when)** | > ~6 large maps, or tier B texture VRAM > 128 MB, or a measured texture-upload long task > 50 ms. Self-host the r184 Basis transcoder under a versioned path (`/v2/decoders/basis-r184/`), `ktx2Loader.detectSupport(gl)`, and `ktx2Loader.dispose()` on unmount (it owns workers). ETC1S for colour, UASTC for normals. |
| **Draco** | Not used. |

### 4.4 Caching

- **Name files with content hashes** (`owner.a.<hash>.glb`, `poster.<hash>.avif`), written by `scripts/assets.mjs`, which also writes the byte manifest. Voice files are already content-hashed by line id.
- In `next.config.ts` `headers()`: `/v2/:path*` and `/voice/:path*` → `Cache-Control: public, max-age=31536000, immutable`. GLBs also get `Content-Type: model/gltf-binary`.
- **Verify at M0:** does the CDN apply `br`/`gzip` to `.glb`? meshopt is designed to be followed by general-purpose compression. Check `content-encoding` in the Network panel. If the CDN does not compress `.glb`, record the size difference (unverified).
- No COOP/COEP needed; no SharedArrayBuffer is used.

---

## 5. Performance

### 5.1 Budgets (measure every one; never state an unmeasured number)

| Metric | Budget | How |
| --- | --- | --- |
| `/v2` initial route JS | ≤ 200 KB gzip, excluding lazy 3D | `next build` route table (watch the `template.tsx` share, §1.5) |
| 3D core chunk | ≤ 450 KB gzip (estimate today: ~417–437) | `gzip -9c` of the chunk files listed for `/v2` in `.next` |
| Each set-piece chunk | ≤ 25 KB gzip | same |
| Physics chunk (only if adopted) | ≤ 40 KB gzip | same |
| Character GLB | A ≤ 1.9 MB (WebP) / ≤ 1.6 MB (KTX2); B ≤ 1.0 MB | `ls -l`; `gltf-transform inspect` |
| 3D bytes before the first interaction | ≤ 2.5 MB (A), ≤ 1.5 MB (B), 0 (C) | Sum of `PerformanceResourceTiming.transferSize` for 3D requests |
| Poster | ≤ 120 KB | file size |
| `3d-live` | ≤ 4 s on A over broadband | `performance.getEntriesByName('3d-live')[0].startTime` |
| LCP / INP / CLS | ≤ 2.5 s / ≤ 200 ms / ≤ 0.1 | Lighthouse, or the `Vitals` reading labelled as such |
| Frame time while moving | p75 ≤ 16.7 ms (A), ≤ 25 ms (B); review rejects p75 > 20 ms on desktop | The review.md snippet during a move or the signature; name the browser, GPU and tier |
| Hitches | No frame > 50 ms and no long task > 50 ms after `3d-live` during scroll, set-piece arrival or the signature | `PerformanceObserver({ type: 'longtask' })` + the max of the frame snippet |
| Draw calls | ≤ 150 (A), ≤ 80 (B) | `gl.info.autoReset = false`; `info.reset()` at frame start; read `info.render.calls` after the composer |
| Triangles on screen | ≤ 500k (A), ≤ 150k (B) | `info.render.triangles` |
| Shader programs | ≤ 40 | `gl.info.programs.length` |
| dpr | max 1.5 (A), 1.25 (B) | Canvas `dpr` |

### 5.2 Quality tiers

| Setting | A | B | C |
| --- | --- | --- | --- |
| Who | Fine pointer, ≥ 8 threads, `deviceMemory` ≥ 8 (when exposed), and the probe passes | `pointer: coarse`, ≤ 4 threads, `deviceMemory` ≤ 4, or A's probe fails | No WebGL2, `saveData`, `deviceMemory` ≤ 2, B's runtime fails, or the user's "3D off" |
| dpr | [1, 1.5] | [1, 1.25] | none |
| AA | MSAA 4× | FXAA or none | none |
| Post | Bloom, tone mapping, vignette, grain, tilt-shift, DOF on close-ups | Half-resolution bloom, tone mapping, vignette | none |
| Shadows | One key PCF 1024 + `ContactShadows` (frames 1) | Blob + baked | none |
| Character | `owner.a.glb` (≤ 40k triangles, 2K) | `owner.b.glb` (≤ 20k, 1K) | The poster cut-out; voice + captions + a speaking ring |
| Materials | Physical (clearcoat), transmission allowed on one hero part | Standard, opacity instead of transmission | none |
| Particles | ≤ 2,000 | ≤ 600 | none |
| Portal | Allowed (1, half-res) | Mask wipe instead | none |
| Env map | 256 | 128 | none |
| Frame cadence | 60 (refresh) | 60 while moving, 30 when idle | none |
| Fallback content | n/a | n/a | One AVIF still per section, captured from the live scene (`scripts/stills.mjs`), beside the same HTML; a link to `/` for "lighter page" |

**Reduced motion (any tier):** render on demand only; every section change is a cut that renders one frame; the signature shows its final frame; the character holds one designed pose and smile; no particles, spring or physics; set pieces show the Director's designed steady states. Sound stays opt-in, and the voice and captions still work.

**Override:** `?tier=a|b|c` for review. "3D off" persists in `localStorage` (wrapped in try/catch).

### 5.3 Detection and runtime downgrade

```ts
export function detectTier(): 'a' | 'b' | 'c' {
    const q = new URLSearchParams(location.search).get('tier');
    if (q === 'a' || q === 'b' || q === 'c') return q;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const mem = nav.deviceMemory ?? 8;
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext(); // do not hold a context just to ask
    if (!gl || nav.connection?.saveData || mem <= 2) return 'c';
    if (matchMedia('(pointer: coarse)').matches || navigator.hardwareConcurrency <= 4 || mem <= 4) return 'b';
    return 'a';
}
```

- **Probe:** the warm-up frames (§4.1 step 5) are timed. If A's p75 is above 12 ms on the hero scene, start at B. This happens before anyone sees the canvas.
- **Monitor (`perf.ts`, own, ~20 lines):** a 120-sample ring buffer of `dt`, sampled only while something moves (camera, signature, play). Deltas above 100 ms are dropped (hidden tabs, GC). A → B when p75 > 20 ms; B → C (freeze on the current section's still, stop the loop, keep the HTML and guide) when p75 > 40 ms. The same buffer feeds the marble-run set piece and an optional colophon HUD.
- **Why not drei `PerformanceMonitor`:** it averages fps rather than taking p75, and the review gate is p75.
- **Downgrade without hitching:** apply dpr, bloom resolution, particle `count` and composer passes immediately (no recompiles). Apply material or shadow changes only at the next cut, under the flap, where a compile is hidden.

### 5.4 Frameloop and pausing

| Condition | Loop |
| --- | --- |
| Tab visible, canvas visible, motion allowed | `frameloop="always"` |
| `document.hidden` | `"never"`, plus `ctx.suspend()` (§2.10) |
| An opaque HTML layer covers the viewport (a full-screen sheet on mobile, the footer) | `"never"` |
| Reduced motion | `"never"` + `advance()` once per cut or state change |
| Tier C, or a runtime freeze | No canvas, or `"never"` showing the still |
| Set piece more than 1 section away | `visible = false`; its `useFrame` returns early |

On resume, the `dt` clamp (1/30) keeps springs and timelines sane. GSAP's ticker lag smoothing covers the HTML tweens.

### 5.5 Dispose rules

- **JSX-created objects:** fiber disposes them on unmount.
- **Cached assets:** `<primitive object={gltf.scene} dispose={null} />`. Dispose once, on World unmount, through `disposeGLTF(gltf)` (geometries, materials, textures, skeleton bone textures), then clear the loader cache.
- **Imperative objects, disposed in the creating effect's cleanup:** `composer.dispose()`, `envMap.dispose()` + `pmrem.dispose()`, render targets, `CanvasTexture`/`DataTexture`, `ktx2Loader.dispose()`, `ResizeObserver`/`IntersectionObserver`, GSAP `ctx.revert()`, `voice.close()`.
- **Leak test (M4):** `/v2` → `/` → `/v2` × 5. `renderer.info.memory.geometries` and `.textures` return to baseline, `programs.length` is stable, there is no "Too many active WebGL contexts" warning, and the JS heap is within 10%.
- **Context loss:** listen for `webglcontextlost` on `gl.domElement` with `preventDefault()`, show the current section's still, and try one restore on `webglcontextrestored`. If it fails, tier C. Test with `gl.getContext().getExtension('WEBGL_lose_context').loseContext()`.

---

## 6. Accessibility and SEO

- **The HTML layer is the content.** One `<h1>` (name), a `<header>` with role, city and availability, `<nav>` (the collector's shelf as real links to `#section` ids), `<main>` with one `<section id data-shot>` per place, and a `<footer>`. The canvas and poster are `aria-hidden`. All copy renders from `SITE` on the server, so search engines and screen readers get everything without JS.
- **Minimal text without hiding content:** each screen shows fewer than 15 words of prose (count with the review.md snippet). Project summaries, stacks, links, experience rows and skills live in `<details>` or a `<dialog>`. Sheets are in the DOM, so they are indexable and reachable.
- **Keyboard path:** skip link → Start → Skip to work → shelf links → each project's sheet button, demo buttons (`aria-pressed`) and links → experience → skills → contact keys → colophon.
  - Focusing a control already scrolls it into view, and the camera follows the scroll store, with no extra code.
  - `scroll-padding-bottom` ≥ the dock height (WCAG 2.4.11).
  - The character's hit-button takes focus; Space, Enter or **B** bobbles it.
- **Captions** are always on while the character speaks (`aria-live="polite"`, with the speaker label). Voice is never the only channel.
- **Sound:** no `AudioContext` exists before the Start click. Start says "sound on"; the dock has a visible mute key (persisted); a quieter "Start without sound" link is offered beside Start.
- **Reduced motion:** the designed still (§5.2). `gsap.matchMedia()` holds the motion and no-motion variants in one place.
- **Targets and contrast:** targets ≥ 44 px (52 px keys on mobile); text sits on solid cards (≥ 4.5:1), never on bare 3D; visible `:focus-visible` rings.
- **Mic:** a labelled push-to-talk key (the existing `useListen`). Use `processLocally` where the browser supports it; otherwise disclose that the browser's speech service is used. Firefox falls back to typing.
- **SEO and routing:** replace `src/app/v2/page.tsx`'s redirect with the server page. `robots: { index: false, follow: false }` until the owner promotes it. The root JSON-LD still applies. On promotion: swap `/`, keep the 2D site as the tier C link (for example `/lite`), drop `noindex`, update the sitemap.

---

## 7. Files, guide state machine, milestones

### 7.1 Files

```
src/app/v2/page.tsx                     server: metadata (noindex, viewport), buildScript(SITE, HOST), <World/> (replaces the redirect)
src/components/world/
  World.tsx                             server: ALL content as semantic HTML + poster <img> + hit-button slots
  world.css                             tokens, orientation layouts, sheets, dock, 100lvh canvas host
  tokens.ts                             palette + motion tokens (CSS variables and THREE.Color from one source)
  Client.tsx                            'use client' island: tier, 3D on/off, Start/Skip, lazy Scene + Dock, guide wiring
  tier.ts  scroll.ts  shots.ts          pure: detectTier(), scroll store, shot tables per orientation
  guide/machine.ts                      pure reducer (§7.2); asserted in scripts/check-host.mjs
  guide/useGuide.ts                     binds the machine to Voice (host/audio.ts), script (host/script.ts), scroll
  guide/Dock.tsx                        captions (aria-live), pause/next/mute/ask/mic (host/useGuideInput.ts)
  audio/sfx.ts                          procedural foley on the Voice's context + ducking
  three/Scene.tsx                       <Canvas> config, Suspense, warm-up + reveal, frameloop gating, context loss
  three/Post.tsx                        composer per tier (+ mask-wipe Effect)
  three/Rig.tsx                         camera from scroll + shots: damping, cuts, poster-matched fov
  three/perf.ts                         ring buffer, p75, probe, downgrade
  three/assets.ts                       GLTFLoader + meshopt, byte-progress fetch, manifest, dispose registry
  three/character/Character.tsx         GLB, mixer + clip state from the guide, mouth/blink via face.ts
  three/character/bobble.ts             spring + look-at (pure; one check)
  three/places/<projectId>.tsx          one lazy set piece per project (≤ 25 KB gzip each)
  three/fx/shaders.ts                   inflate / dissolve / rim onBeforeCompile chunks
  fallback/Stills.tsx                   tier C and reduced-motion stills
scripts/assets.mjs                      gltf-transform optimise + hash + byte manifest → public/v2/
scripts/stills.mjs                      capture posters and stills from ?still=<shot> (playwright-core, dev only)
public/v2/                              owner.{a,b}.<hash>.glb, poster.<hash>.avif, stills/*.avif, manifest.json
```

- **Reused unchanged:** `host/script.ts` (tour `target` ids map to `/v2` sections; `about` covers experience and skills until a `topic` field is needed), `host/face.ts` (plus the `Face` type moved in), `host/useGuideInput.ts`, `instrumented/Vitals.tsx` (colophon).
- **Reused with the four fixes:** `host/audio.ts` (§2.10).
- **Not reused:** `Host.tsx` is tied to LAM, and `GuideCard.tsx` to the `/` styling. They go away when `/v2` is promoted, so refactoring them now would only risk `/`.
- **Already deleted in the working tree (uncommitted):** `src/components/v2/*` (Loki) and `steps.md`. LAM removal is still pending (sequenced, §1.5).

### 7.2 The guide state machine (pure reducer; side effects in `useGuide`)

State: `{ phase: 'poster' | 'starting' | 'live'; talk: 'idle' | 'touring' | 'paused' | 'answering' | 'listening'; step: number; render: '3d' | '2d'; suspended: boolean }`

| From | Event | To | Effects |
| --- | --- | --- | --- |
| poster | `START` (click/key) | starting | `createVoice()` inside the click; schedule the signature sounds; start the signature (anticipation until `READY`) |
| starting | `READY` + `SIGNATURE_DONE` | live · touring(0) | chime; greet clip; `say(tour[0])` |
| starting | `FAILED` or 25 s timeout | live · touring(0) · render `2d` | the cut-out stays and talks with a speaking ring |
| touring(i) | `LINE_END` | touring(i+1) after 650 ms | `show(target)` scrolls (the camera follows); prefetch the next 2 lines; clip `point-*` toward the next place |
| touring(i) | `PAUSE` (wheel, touchmove, reading keys, Esc; `usePauseOnReading`) | paused(i) | `voice.stop()` |
| paused(i) | `RESUME` / `NEXT` | touring(i) / touring(i+1) | |
| live · any | `ASK(q)` | answering | caption "you"; 380 ms think pose; `match(q, intents)` → `show(target)` → `say(line ?? fallback)` |
| answering | `LINE_END` | paused(i) | |
| live · any | `LISTEN` | listening | mic (`useListen`); `HEARD(final)` → `ASK` |
| any | `HIDDEN` / `VISIBLE` | same, with `suspended` toggled | `ctx.suspend()`/`resume()`; frameloop never/always |
| touring(last) | `LINE_END` | idle | the dock offers "Replay tour" |

**Character behaviour is derived, not stored:** `poster` → printed cut-out (blink, pupils track the pointer); `starting` → signature; speaking → talk-idle + viseme nods; a step's entry → point toward its place; `answering` → think, then talk; `listening` → lean in; idle → idle + look-at; a flick → react, layered over any state; `HIDDEN` or reduced motion → rest pose.
**Check:** `scripts/check-host.mjs` replays the table above as event sequences and asserts the end states (one runnable check, no framework).

### 7.3 Milestones (each ends with review.md; `/` must still pass)

**Viewports for every check:** 375 × 812 (portrait shots), 768 × 1024 (portrait shots), 1440 × 900 (landscape shots); plus reduced motion emulated, `?tier=b` and `?tier=c`. Every number is reported with its browser, GPU (or "software") and tier, or as "not measured".

**M0: foundations and measurement (stand-in character)**

- **Work:**
  - Replace the redirect with the server page (all HTML from `SITE`, minimal text plus sheets).
  - Poster AVIF from the approved 2D art (until then, a compressed photo cut-out).
  - `tier.ts`, `scroll.ts`, the lazy `Scene` with environment, post, Rig and a dev-only stand-in figure.
  - Warm-up, reveal and `3d-live`; `perf.ts`; cache headers; the drei barrel lint rule; `motion-safe:scroll-smooth`.
  - Record the `/v2` route JS and the 3D chunk gzip. Decide on the template route group (§1.5).
- **Acceptance:**
  - [ ] JS disabled, at all three viewports: name, role, a way into the work (all four projects with real links in sheets) and contact are visible and usable.
  - [ ] The LCP element is the h1 or the poster (`PerformanceObserver` `largest-contentful-paint` → `entry.element`).
  - [ ] Network panel: no three or fiber chunk before `load` (or the first interaction); `?tier=c` fetches 0 3D bytes.
  - [ ] Poster → canvas swap: no visible jump at 375, 768 and 1440 (screenshots before and after); CLS ≤ 0.1 (Vitals reading).
  - [ ] `3d-live` recorded; `/v2` route JS and 3D chunk sizes recorded against §5.1.
  - [ ] Tab hidden → a rAF counter stops incrementing; it resumes on return.
  - [ ] `npx tsc --noEmit`, `npm run lint` and `npm run build` are clean; `/` behaves as before.

**M1: character, signature, voice**

- **Work:**
  - Load the character (A and B files) with mixer clips, bobble, look-at, blink and mouth (shape keys or atlas, chosen by look).
  - The Start signature on the audio clock, with anticipation tied to progress; SFX bus; the `audio.ts` fixes.
  - Captions and line 0; the hit-button; the tone-mapping decision.
- **Acceptance:**
  - [ ] At 1440, Start → pop-out → greeting with voice and caption. A 6-frame screenshot sequence of the signature exists. p75 ≤ 16.7 ms on A during it (snippet, GPU named). No long task > 50 ms between the click and the greeting.
  - [ ] The mouth moves whenever audio plays, and it stays in sync on Bluetooth output if one is available (otherwise "not tested").
  - [ ] At 1440 the head and eyes track the mouse. At 375 a tap on the figure bobbles it and plays a line. The keyboard (focus + B) bobbles it.
  - [ ] No sound before Start; mute works; a hidden tab suspends the AudioContext (`ctx.state === 'suspended'`) and the tour does not advance while hidden.
  - [ ] Reduced motion: the final frame, no squash, no particles.
  - [ ] GLB sizes within §5.1; `gltf-transform validate` is clean; every clip and shape key animates after optimisation.

**M2: world, camera choreography, tour**

- **Work:** the shot tables for both orientations; Rig with cuts and the flap; the section layouts; tour scrolling; focus-follow; transitions.
- **Acceptance:**
  - [ ] Every section at 375, 768 and 1440: the figure and its place are framed clear of the HTML card (screenshots); fewer than 15 words of prose per screen (snippet).
  - [ ] Scrolling moves the camera continuously; Tab to a project link moves the camera there; a shelf jump of more than 2 sections cuts under the flap.
  - [ ] The tour visits every section in order with captions, and the camera follows. Wheel, touch or arrow keys pause it; Esc stops it.
  - [ ] Find-in-page and anchor links work; the scrollbar is native.
  - [ ] Draw calls ≤ 150 (A) / ≤ 80 (`?tier=b`); p75 while scrolling recorded per tier.

**M3: set pieces, play, Q&A**

- **Work:** one lazy set piece per project, prefetched and precompiled; the play interactions; the HTML sheets; typed and voice Q&A traveling to targets.
- **Acceptance:**
  - [ ] Each set-piece chunk ≤ 25 KB gzip. Arriving at each one causes no frame > 50 ms (the frame snippet's max).
  - [ ] Each set piece has an HTML twin: a button, plus a sheet with the real summary and links exactly as in `site.ts`.
  - [ ] Every play interaction works with the mouse at 1440, touch at 375, and the keyboard. Nothing animates once it is idle and settled.
  - [ ] "Tell me about Eidos" travels there and speaks the line; "Where have you worked?" goes to experience; "What is the meaning of life" gives the fallback. The mic works in Chrome and Safari; Firefox shows the typed path.
  - [ ] The marble run's readout matches `perf.ts` p75 within 1 ms.

**M4: mobile, tiers, hardening**

- **Work:**
  - Tune the B settings; the probe and downgrade; the tier C stills (`scripts/stills.mjs`); the reduced-motion stills; "3D off".
  - The leak test; context loss; the iOS audio session; an optional Lenis trial; Lighthouse.
- **Acceptance:**
  - [ ] `?tier=b`: no MSAA, DOF or portal; the Network panel shows `owner.b.glb`, not the A file; within the B budgets. `?tier=c`: stills, and Start, captions and Q&A all work.
  - [ ] Reduced motion at all three viewports: a designed still per section; navigation cuts.
  - [ ] iOS Safari on a real device if available (record the model): the renderer size is constant while the toolbar collapses; sound plays with the silent switch on, or this is recorded as not working; the dock clears the safe area.
  - [ ] The leak test passes (§5.5); forced context loss shows the still and restores.
  - [ ] Lighthouse mobile ≥ 90 in all four categories on a production build, or "not measured" with the reason.

---

## 8. Risks

| # | Risk | Why it is real | Mitigation |
| --- | --- | --- | --- |
| 0 | **A repo rule blocks the preload.** | CLAUDE.md §10.5 says the renderer loads only after Start. | Owner decision (§9.3). The compliant path is described in §1.5 item 6. |
| 1 | **The character asset is the long pole, and it gates everything visible.** | No generator ships a face rig. Auto-riggers are untested on a 45% head. Generated textures often bake lighting into the albedo (a cheap tell). The Blender finishing is new code. Likeness approval comes first. | Build M0 on a dev-only stand-in. The rigid head on a spring decouples rig quality from the bobble. Two mouth paths (shape keys or atlas) share one input. Budgets are checked by `scripts/assets.mjs` on every export. |
| 2 | **Byte and bundle budgets are tight.** | The 3D core is ~377 KB of measured library code before app code (budget 450). `/v2` also carries the root `template.tsx` client JS. The asset note's 2.0–3.0 MB hero conflicts with the 2.5 MB pre-interaction rule. | Measure in M0 before features. Levers in order (§1.3). Trim the hero texture set or defer its download to the first interaction (§4.2). The template route group if needed (owner). |
| 3 | **Smoothness on real phones.** | Shader compiles and texture uploads when lazy set pieces arrive; iOS toolbar resizes; low-power 30 fps caps; thermal throttling on long visits; Safari audio quirks (silent switch, `outputLatency`). | Precompile and `initTexture` per set piece; a `100lvh` canvas; probe + p75 monitor with downgrades applied at cuts; idle 30 fps on B; a real-device pass in M4, with "not tested" stated where no device was available. |

Lower risks:

- `postprocessing` caps three below 0.187: pin three.
- cannon-es is stale: it is not needed for the recommended concept.
- Removing LAM touches `/`: sequenced (§1.5).
- Whether the CDN compresses `.glb`: unverified; check in M0.

## 9. Owner decisions needed (each has a default)

1. **Route group for the classic pages** if `template.tsx` bloats `/v2`. **Default:** measure in M0 first; only restructure if it exceeds the budget.
2. **When to drop LAM from `/`.** **Default:** at promotion. Earlier only if you want `/` on the photo-only guide now.
3. **CLAUDE.md §10.5** ("the renderer loads only after Start"). **Default:** scope it to `/` and give `/v2` the §5.1 gates, so the 3D chunk preloads after idle (§1.5 item 6).
4. **Hero texture set** (to fit 2.5 MB): drop the normal map and use WebP. **Default:** yes.

---

## Appendix A: how the numbers were measured (2026-10-15)

- **Versions, licences, peer ranges, publish dates:** `npm view <pkg> version license peerDependencies dependencies time` from the npm registry.
- **Installed files:** `gzip -9c <file> | wc -c` on files in `node_modules` (three builds and addons, decoders). Fiber's ESM was minified with the terser bundled in Next (`next/dist/compiled/terser`) and then gzipped.
- **Packages that are not installed:** their published files were streamed from jsDelivr through `gzip -9c | wc -c`, without saving them to disk or executing them (gsap, lenis, n8ao, rapier, theatre, maath, drei modules, three-stdlib loaders, cannon-es, camera-controls). Unminified sources were minified with the same terser before gzip where a dist `.min` file did not exist.
- **Tree-shaken `postprocessing`:** an approximation. The published ESM build was reduced to the listed exports and minified with terser `toplevel` dead-code removal, then gzipped. The real webpack output can differ by a few KB. Re-measure from `.next` in M0.
- **Not measured:** the actual `/v2` build output (no `next build` was run, to avoid disturbing a running dev server's `.next`), any runtime frame time, Core Web Vitals or Lighthouse score.

| Measured item | gzip bytes |
| --- | --- |
| three.core.min.js + three.module.min.js (r184) | 100,728 + 86,457 |
| @react-three/fiber 9.6.1 ESM (terser) | 113,661 |
| GLTFLoader (terser) / meshopt decoder / RoomEnvironment / KTX2Loader (terser) | 12,964 / 7,714 / 922 / 5,348 |
| Basis transcoder js + wasm / Draco wasm + wrapper | 15,060 + 245,408 / 63,240 + 11,524 |
| postprocessing 6.39.5 whole min / subset (composer, bloom, tone mapping, vignette, noise, tilt-shift) / + FXAA / + SMAA instead | 117,261 / 18,693 / 20,082 / 76,368 |
| gsap 3.15.0 core / CustomEase / SplitText / ScrollTrigger / Flip / ScrollSmoother | 28,256 / 3,655 / 3,641 / 17,977 / 9,694 / 5,523 |
| lenis 1.3.26 | 5,418 |
| @react-three/rapier 2.2.0 binding (terser) / rapier3d-compat 0.19.2 `rapier.mjs` / rapier3d 0.19.2 `.wasm` | 8,172 / 834,313 / 583,233 |
| cannon-es 0.20.0 (terser) | 35,006 |
| @theatre/core 0.7.2 / @theatre/studio 0.7.2 | 49,955 / 243,922 |
| drei 10.7.9 modules (terser): ContactShadows / Outlines / MeshPortalMaterial / AccumulativeShadows / PerformanceMonitor | 1,097 / 1,409 / 2,795 / 2,534 / 848 |
| three-stdlib 2.36.1 (unminified): GLTFLoader / EXRLoader / RGBELoader / KTX2Loader; @monogrid/gainmap-js 3 | 19,865 / 9,983 / 2,586 / 5,476; 6,309 |
| n8ao 2.0.1 `N8AO.js` (unminified) / maath 0.10.8 (+esm) / camera-controls 3.1.2 min | 93,638 / 11,351 / 12,241 |
| `public/profile_pic.png` (raw size) / `public/voice` (128 files) | 1,948,298 B / 2.5 MB |
