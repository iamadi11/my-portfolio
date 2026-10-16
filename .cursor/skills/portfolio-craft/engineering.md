# Engineering

The Engineering and perf role reads this. Its output goes in `docs/<pass>/engineering.md`.

## Stack

Keep what is installed (`three`). Add the following only as the concept needs them, each with a one-line reason:

| Need | Package | Notes |
| --- | --- | --- |
| Loaders, light, shadows, tiers | `@react-three/drei` | `useGLTF` (meshopt), `useKTX2`, `Environment` + `Lightformer`, `ContactShadows` / `AccumulativeShadows`, `PerformanceMonitor`, `AdaptiveDpr`. Import named modules only. |
| Post-processing | `postprocessing`, or `@react-three/postprocessing` | One merged pass for bloom, tone mapping, vignette, SMAA, and N8AO on tier A. The R3F wrapper may need a newer fiber than is installed, so check first. |
| Play physics | `@react-three/rapier` | Lazy-loaded with the play set piece only. Use a fixed timestep, let bodies sleep, and cap the body count. Bobble and secondary motion are springs, with no physics engine. |
| Scroll timelines | `gsap` + ScrollTrigger + `@gsap/react` | Scrub a plain object that the camera rig reads. The `gsap-*` skills cover the API. If only progress per section is needed, a damped scroll store is enough. |

Before adding a package, run `npm view <pkg> version peerDependencies`, compare the peer ranges with the installed versions, and estimate the gzip size. Record all three.

## Architecture

- **Layers, back to front:**
  - The fixed full-viewport `<Canvas aria-hidden>`. It takes pointer events only where play exists.
  - The server-rendered HTML layer, which holds all the content. The LCP element is the h1 or the poster `<img fetchpriority="high">`.
  - HTML overlays, positioned with transforms only.
- **One canvas, one loop.** All per-frame work runs in `useFrame`, with no extra rAF loops. Use `frameloop="demand"` and call `invalidate()` while anything moves, or run `always` with the pause rules below.
- **Scroll.** Use native scroll: the HTML sections set the scroll length. A store holds progress for each section, written by IntersectionObserver or a ScrollTrigger scrub. The camera rig reads it in `useFrame` and damps toward it with `THREE.MathUtils.damp(cur, target, λ, dt)`. No scroll hijack: anchors, the keyboard, and Find in page all work.
- **Camera.** A shot table for each section and each breakpoint: position, target, focal length (`setFocalLength`), and lens shift (`setViewOffset`), to keep it clear of the HTML. Interpolate between shots, or along a `CatmullRomCurve3`. Focusing an HTML control moves the camera to its set piece.
- **Character.**
  - Load it with `useGLTF` into a `SkinnedMesh`. An `AnimationMixer` plays the clips, switching with `crossFadeTo`.
  - Add the spring bobble to the head bone after `mixer.update`.
  - Look-at uses lag and a clamp.
  - Blinks fire on a random timer.
  - Visemes follow the audio clock, never rAF time.
  - Reuse the repo's voice pipeline instead of adding a TTS. Here that is `npm run voice` → `public/voice/`, with the lines in `HOST` in `site.ts`.
- **Set pieces.** One lazy module per project, prefetched once the previous section is half visible. Materials are shared and their shaders precompiled on arrival.
- **Sound.** One `AudioContext`, created on the first gesture. A master gain with a mute toggle. Suspend it when the tab is hidden. Physics contacts set gain by impulse and are throttled.

```ts
// Bobble: damped spring on the head, run after mixer.update(dt). off/vel are Vector2 (radians).
const K = 140, C = 10;                 // motion tokens: stiffness, damping
dt = Math.min(dt, 1 / 30);             // stability on frame drops
vel.x += (-K * off.x - C * vel.x) * dt; vel.y += (-K * off.y - C * vel.y) * dt;
off.x += vel.x * dt; off.y += vel.y * dt;
head.rotation.x += off.x; head.rotation.z += off.y;
// Flick: vel.add(pointerDelta * gain). Body accelerates: vel.sub(bodyAccel * gain).

// Visemes: drive morphs from the audio clock.
const v = timeline.at(ctx.currentTime - lineStart);   // active viseme id
for (const [id, i] of visemeIndex) infl[i] = THREE.MathUtils.damp(infl[i], id === v ? 1 : 0, 18, dt);
```

## Loading order

1. HTML and the poster go first. three is not in the initial route JS.
2. The world chunk loads through `next/dynamic(..., { ssr: false })` from a client component. It starts after `load` plus `requestIdleCallback`, or on the first interaction, whichever comes first. It is skipped on tier C.
3. Hero assets, then `await gl.compileAsync(scene, camera)` and `gl.initTexture(t)`, then a crossfade from the poster to the live frame. They share a camera, so the swap is invisible and the first interaction never pays for shader compilation.
4. Call `performance.mark('3d-live')` at that crossfade. Target: 4 s or less on tier A over broadband, so the greeting lands inside 5 s.
5. Later sections load ahead of the scroll.

## Quality tiers

| Tier | Who | Rendering |
| --- | --- | --- |
| A | Desktop GPU, ≥ 8 cores, `deviceMemory` ≥ 8 when exposed | dpr `[1, 1.5]`; AO, bloom, SMAA; 2K textures; full set pieces |
| B | `pointer: coarse`, ≤ 4 cores, or `deviceMemory` ≤ 4 | dpr `[1, 1.25]`; half-resolution bloom; baked shadows, no AO; 1K textures; LOD character; mobile shots |
| C | No WebGL2, `saveData`, `deviceMemory` ≤ 2, a runtime decline below B, or the user's "3D off" | No canvas. The poster and per-section stills sit beside the same HTML. Voice and captions still work. |

- **Runtime downgrade:** drei `PerformanceMonitor`. If the p75 frame time is above 20 ms on A, drop to B. If it stays above 40 ms on B, freeze on the current still (C).
- **Override:** `?tier=a|b|c`, for review. dpr never goes above 1.5.

## Pause and dispose

- On `visibilitychange` to hidden, stop the loop, suspend audio, and pause the voice.
- Set pieces that are out of view do not animate.
- Dispose everything created imperatively in the cleanup of the effect that created it: textures, render targets, composers, PMREM, physics worlds.
- **Leak check:** navigate away and back 5 times. `renderer.info.memory` returns to its baseline, with no "too many WebGL contexts" warning.
- On `webglcontextlost`, show the current still, then attempt one restore.

## Budgets

Measure every one. Never claim a number that was not measured.

| Metric | Budget | How |
| --- | --- | --- |
| Initial route JS | ≤ 200 KB gzip, excluding lazy 3D (or the repo's stricter gate, e.g. `/` ≤ 120 kB) | `next build` route table |
| 3D core chunk | ≤ 450 KB gzip | Build output or analyzer |
| Each set-piece chunk | ≤ 25 KB gzip | Build output |
| 3D bytes before the first interaction | ≤ 2.5 MB (A), ≤ 1.5 MB (B), 0 (C) | `PerformanceResourceTiming` |
| LCP / INP / CLS | ≤ 2.5 s / ≤ 200 ms / ≤ 0.1 | Lighthouse, or a `PerformanceObserver` reading labelled as such |
| Frame time while moving | p75 ≤ 16.7 ms (A), ≤ 25 ms (B). On desktop, never below 50 fps sustained. | The frame-time snippet in [review.md](review.md) |
| Draw calls | ≤ 150 (A), ≤ 80 (B) | `renderer.info.render.calls` |
| Lighthouse | ≥ 90 on all four categories | Run it, or write "not measured" and the reason |

## Accessibility layer

- The HTML is the content. Each set piece has an HTML twin (a button or link plus a sheet), and the camera follows focus.
- Set `scroll-padding` so a sticky dock never covers the focused control.
- Captions use `aria-live="polite"` and are always on.
- "3D off" is a persisted user control.
- Every drag interaction has a single-pointer or key alternative (WCAG 2.5.7).
