# Reference sites, reverse-engineered (2026-10-16)

Passive observation with [REA](https://github.com/morluto/rea) `rea-agents@6.5.0` (`inspect-web-page`, `analyze-web-bundle`, `export-web-scripts`, `capture-web-screenshot`) against a dedicated headless Chrome 155 (Metal GPU, loopback CDP). Captured scripts were grepped, never executed. Library rows are **inferences from static markers** in shipped bundles, not observed execution; "network" only covers the window after REA attached. Purpose: learn techniques and loading strategy. Nothing (code, shaders, models, copy, layout) is reused.

| Site | Evidence | Shell | 3D / rendering (static markers) | Motion, audio, assets |
| --- | --- | --- | --- | --- |
| bruno-simon.com | bundle `ev_233d1ecd…`, page `ev_8714ab37…` | Vite, 1 canvas, 4.7 MB main bundle | three.js r183, WebGPU renderer and TSL node shaders (WGSL), instancing, matcaps, render targets | Rapier physics as WASM (225 KB loader), GSAP, Web Audio with ~50 foley loops, Draco + KTX2 + Meshopt glTF, workers |
| lusion.co | `ev_de6179…`, `ev_ccb123…` | Astro, 3 canvases, 1.2 MB hoisted bundle | three.js r158 in a custom engine, GPGPU/FBO simulation, instancing, matcaps, video textures, raw GLSL | Virtual (wheel) scroll, audio, self-hosted Aeonik + IBM Plex Mono |
| activetheory.net | `ev_00d364…`, `ev_10a63c…` | 83 DOM nodes, everything in one 1.8 MB app bundle | Their own engine ("Hydra", ~600 references), GLSL ES 3, fluid simulation, MSDF text drawn in GL, post-processing | Theatre.js sequencing, KTX2/Basis + Draco assets, workers |
| 14islands.com | `ev_863259…`, `ev_187a87…` | Next.js + React, 1 canvas + video | react-three-fiber over three.js, instancing, troika/MSDF text in GL, DOM elements mirrored as GL planes | Lenis smooth scroll, video textures, workers |
| obys.agency | `ev_2b425c…`, `ev_edce11…` | 117 KB of JS total, 1 canvas | A single raw WebGL2 shader layer under DOM typography | Typography and transitions carry the identity |
| resn.co.nz | `ev_d9e706…`, `ev_aa89e0…` | RequireJS, 6 canvases, 3.9 MB bundle, 1–2 MB PNG posters | three.js, post-processing, render-target simulations | GSAP (~1000 references), SplitText, Howler-style audio |

Screenshots (`capture-web-screenshot`, Evidence `ev_b3e15d…`, `ev_56666a…`, `ev_2714db…`, `ev_5452e4…`, `ev_e3e2a6…`, `ev_cbdcf9…`) all caught a **loader or a blank first frame** in a headless background tab.

## What the evidence says, in plain words

1. **Every one of them gates the experience behind a loader** and ships 1–5 MB of JavaScript before anything moves. Our recruiter rule forbids that, so the wow has to be *progressive*: real HTML first, the magic grows out of it.
2. **The "how did they make that?" moments are simulations, not models**: GPU particle/fluid sims (Lusion, Active Theory), physics (Bruno), text rendered as geometry (Active Theory, 14islands). Hand-authored meshes are the minority.
3. **One engine, one idea.** Each site commits to one technique as identity (physics toy, fluid, typographic shader) and builds everything around it.
4. **Sound is part of it**: Bruno ships ~50 foley loops; Resn and Lusion carry audio code.
5. **Asset discipline**: compressed glTF (Draco/KTX2/Meshopt), workers for heavy lifting, WebGPU where available with WebGL fallback (three r183).

## Not to copy

A drivable vehicle on a playground (Bruno), dark abstract fluid/particle hero (Lusion, Active Theory), DOM-to-GL gallery tiles (14islands), black typographic shader page (Obys), crystal loader (Resn).
