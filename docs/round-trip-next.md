# Round trip: what would make it better

Research for the next pass on `/` (Round trip). Sources: the REA teardowns in `docs/v2-research/references.md` and `teardown.md` (Bruno Simon, Lusion, Active Theory, 14islands, Resn, Arthur Engel) plus the web sources listed at the end. Written 2026-10-16.

## Where it stands

- Everything is generated in code: instanced boxes with custom GLSL, one chrome material, additive glows, `UnrealBloomPass` plus a finishing pass (colour fringing on speed, grain, vignette).
- First-load JS is 108 kB. The world chunk is fetched on idle (three.js ≈135 kB gz plus about 12 kB of world code) and built on first scroll.
- Lighthouse: mobile performance 91, desktop 100; accessibility, best practices and SEO 100. CLS 0.001. About 60 fps headless at 1280×800 and 390×844.
- On phones, tilt steers the camera (iOS asks through the Tilt button) and each ring gives a haptic tick.

## What still separates it from award sites

The teardowns show what the "how did they make that?" moments have in common: simulations (Lusion, Active Theory), physics (Bruno Simon) and type drawn in the GL scene (Active Theory, 14islands). Each site also commits to one technique and builds everything around it. Measured against that, Round trip lacks:

1. **Lighting and materials.** Surfaces are flat emissive shaders. Nothing reflects except the rings, and those reflect a generic studio room.
2. **No simulation.** The request moves along a fixed curve, and nothing in the world reacts to it beyond a glow.
3. **The camera follows; it is not directed.** Scroll maps linearly to the path, so there are no authored beats such as speed ramps, holds, focus pulls or reveals.
4. **Text lives only in the DOM.** The world never says anything itself.
5. **Synth-only sound.** There is no foley, and nothing is placed in space.
6. **Zone changes are cross-fades of geometry,** not designed transitions.

## Upgrades, in order of impact per effort

| # | Upgrade | What changes on screen | Cost / risk |
|---|---|---|---|
| 1 | **Adaptive quality.** Use `detect-gpu` for the starting tier, plus a frame-time governor that steps the pixel ratio down after N slow frames and back up after a sustained margin. | Lets every item below ship without hurting phones. | Small. Tier detection can misjudge new GPUs, so runtime timing wins. |
| 2 | **Post stack on pmndrs `postprocessing`.** Effects merge into one pass: mip-chain bloom, SMAA, AgX tone mapping, chromatic aberration, noise, vignette. N8AO at half resolution for the city and rings, and bokeh depth of field for the project and record close-ups. | Cleaner bloom and edges, real depth, and a filmic grade. | Medium. Skip AO and depth of field on low tiers. |
| 3 | **HDRI lighting.** A CC0 night HDRI (Poly Haven) as the environment for chrome and glass, instead of `RoomEnvironment`. | The rings reflect a believable sky and city. | Small. About 1–2 MB, so use a low-resolution HDR for lighting only. Test KTX2 for size and VRAM on a real phone first. |
| 4 | **Wet streets.** A planar reflection of the city floor at a quarter of the resolution, roughness-blurred, active only in the edge zone. | Neon windows and traffic reflected in wet asphalt. This is the strongest single look upgrade. | Medium. It adds one extra render while in the city. |
| 5 | **Glass records.** `MeshPhysicalMaterial` with transmission and dispersion, used only on the 4–5 lit records. The rest stay instanced wireframe. | Each role becomes a refracting glass block that the query scan lights from inside. | Medium. Transmission costs one extra render, so restrict it to the data zone. |
| 6 | **A traffic simulation.** GPGPU particles on the route: other requests stream past, swirl into each gyroscope and scatter after you pass. Use ping-pong float textures on WebGL2 and TSL compute when the WebGPU backend is active. | The world reacts: it feels like a live system, not a ride. | Medium–large. Compute nodes run only on the WebGPU backend, so the WebGL2 path needs its own vertex-shader version. |
| 7 | **Directed camera.** A Theatre.js sequence keyed to the scroll value: holds on each project, a speed ramp into the city, a focus pull onto each record, and a crane-out at 200 OK. | Pacing and drama instead of a constant glide. | Medium. The editor is development-only; ship `@theatre/core` with an exported state JSON. |
| 8 | **Type in the world.** MSDF text (troika) for section titles and ring names, set into the scene and lit by the request. "200 OK" is built out of the route itself. | The world speaks, as on Active Theory and 14islands. | Medium. Keep the DOM copy for accessibility and SEO. |
| 9 | **Designed zone transitions.** A "packet loss" glitch (pixel sort or datamosh on the finishing pass) when scrolling fast between zones, and a dolly-zoom warp at the tunnel's exit. | Each section change becomes an event. | Small (shader only). |
| 10 | **Sound design.** CC0 foley loops per zone (hum, rain on the street, servo whir at the rings, glassy ticks in the data), placed in space with `PannerNode` relative to the camera, and a whoosh on each ring. | Presence; Bruno Simon ships about 50 loops. | Small–medium. Still off until switched on. |
| 11 | **Play.** Click or tap a ring to spin it and open the project. Hover a record to read it in the scene. A "Resend" button replays the trip. On phones, a shake (`devicemotion`) resends. | People stay and poke at it. | Small (raycasting is already in three). |
| 12 | **WebGPU renderer.** `WebGPURenderer` with TSL, which falls back to WebGL2 automatically. Write the shaders once in TSL; gate compute on the active backend, not just `navigator.gpu`. Test with `forceWebGL`. | Headroom for #6 and higher particle counts. | Large (a port of every shader). Do it after #1–#5 prove the look. |

## Phones

- **Already shipped:** tilt steers the camera, iOS permission goes through the Tilt button, Android needs no prompt, the forward angle re-centres slowly, and there is a haptic tick per ring.
- **Next:**
  - Let the governor (#1) also cut the lattice density and switch depth of field and AO off on low tiers.
  - Add drag-to-look as a fallback when tilt is denied.
  - Respect `prefers-reduced-motion` for tilt too, which already disables roll, speed fringing and reveals.

## Budgets to hold

- First-load JS stays ≤ 120 kB: everything above lives in the lazy world chunk.
- World chunk target ≤ 260 kB gz with `postprocessing`, troika and Theatre core. HDRI and audio load on first scroll, not on idle.
- Frame rate: desktop 60 fps; mobile ≥ 45 fps with the governor. CLS stays ~0, since all of this happens on the canvas.

## Suggested milestones

1. **Look (1–2 sessions):** #1 adaptive quality, #2 post stack, #3 HDRI, #4 wet streets, #9 transitions.
2. **Life (2 sessions):** #6 traffic simulation (WebGL2 first), #10 sound, #11 play.
3. **Direction (1–2 sessions):** #7 Theatre.js choreography, #8 type in the world, #5 glass records.
4. **Engine (later):** #12 WebGPU/TSL port once the look is settled.

## Sources

- REA teardowns: `docs/v2-research/references.md`, `docs/v2-research/teardown.md`
- [three.js manual: WebGPURenderer](https://threejs.org/manual/en/webgpurenderer)
- [WebGPU + Three.js migration guide (2026)](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- [Migrating three.js from WebGL to WebGPU: the Firefox caveat](https://www.buildmvpfast.com/blog/threejs-webgl-to-webgpu-renderer-migration-2026)
- [TSL and WebGL2 vs WebGPU (three.js forum)](https://discourse.threejs.org/t/tsl-and-webgl2-vs-webgpu/87974.md)
- [WebGPU vs WebGL for games (2026)](https://app.cinevva.com/guides/webgpu-vs-webgl-games)
- [100 three.js performance tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [pmndrs postprocessing README](https://cdn.jsdelivr.net/npm/postprocessing@6.39.4/README.md)
- [N8AO](https://github.com/N8python/n8ao)
- [three-good-godrays](https://cdn.jsdelivr.net/npm/three-good-godrays@0.12.0/README.md)
- [Changing pixel ratio based on FPS (three.js forum)](https://discourse.threejs.org/t/changing-pixelratio-based-on-fps-good-or-bad-idea/34563)
- [Adjusting quality dynamically (three.js forum)](https://discourse.threejs.org/t/is-there-a-way-to-adjust-quality-dynamically-based-on-performance/23328)
- [KTX2Loader docs](https://threejs.org/docs/pages/KTX2Loader.html)
- [Basis Universal in three.js](https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/libs/basis/README.md)
- [Chromium: DeviceOrientation permission request API (Intent to Ship)](https://groups.google.com/a/chromium.org/g/blink-dev/c/ckd2rFmT3PA/m/YNiz6AREAQAJ)
- [Codrops: camera fly-through on scroll with Theatre.js](https://tympanus.net/codrops/2023/02/14/animate-a-camera-fly-through-on-scroll-using-theatre-js-and-react-three-fiber/)
- [@theatre/core on npm](https://www.npmjs.org/package/@theatre/core)
