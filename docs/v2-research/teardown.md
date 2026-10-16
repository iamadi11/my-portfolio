# Teardown: 12 award-level sites (2026-10-16)

Method: each site loaded alone in headless Chrome 155 (Metal GPU, 1440×900), left past its loader, then wheel-scrolled in 7 steps with a screenshot each. A runtime probe read `window.__THREE__` (three.js revision), GSAP/ScrollTrigger, Lenis/Locomotive, Barba/Swup, loaded fonts, computed type and colour, DOM size, resource weight and LCP. Static evidence for the first six is in [references.md](references.md) (REA `rea-agents@6.5.0`). Screenshots stay local (not committed). "Virtual scroll" means the page never scrolls natively: wheel input drives a WebGL/JS scene. Nothing here is reused; this records techniques.

## Studios

| Site | Stack (runtime) | Scroll | Type and colour | What the 3D does | Weight · LCP |
| --- | --- | --- | --- | --- | --- |
| Bruno Simon | three r183 (WebGPU/TSL), Rapier WASM, 35 KTX textures, 23 GLB, 42 MP3 | virtual (a drivable game) | Nunito + Amatic SC hand lettering; purple neon night grid | the whole site is a toy island you drive; "click to start" gate; foley on everything | 7.3 MB · no LCP (canvas only) |
| Lusion | three r158 in Astro, 38 WebP, 20 `.buf` geometry, 16 OGG | virtual, cards and sections move as one stream | Aeonik 36–38 px regular, IBM Plex Mono labels; white, black, one electric blue | a rounded "window" hero of instanced glossy shapes; full-bleed red reel panel; project grid with video | 0.5 MB · **540 ms** (H1 first, then 3D) |
| Active Theory | own engine (no global three), Basis textures, 2 videos | virtual camera flight | NB Architekt (pixel-mono) only; black with teal/violet | the page is one continuous camera move through a particle forest, a glass ring logo, floating video panes | 0.75 MB · 2.0 s |
| 14islands | three r156 + R3F in Next.js, **Lenis** | native, smoothed | AftenScreen 100 px at -4 px tracking, BentonSans 12 px uppercase labels; white, near-black | WebGL caustic text material; dot-matrix image reveal; DOM image grid | 2.7 MB · 2.2 s |
| Obys | raw WebGL2, 117 KB JS | virtual | own Obys serif 11 px; pure white, black | a vertical image strip with focus brackets; the shader is the transition | **75 KB** · 3.6 s |
| Resn | own engine, 46 PNG, 26 MP3, 850 KB JSON | virtual | Fort Extralight 43 px; charcoal | a faceted crystal that shatters on scroll; heavy sound bed | 27.6 MB · 10 s |

## Current award-winning portfolios (Awwwards, October 2026)

| Site | Stack | Scroll | Type and colour | Signature | Weight · LCP |
| --- | --- | --- | --- | --- | --- |
| [Huy Phan Vol.2](https://huyml.co/) (SOTD + Developer, 14 Oct) | three r179 | virtual | BT Grotesk + F37 Bolton; light grey #ececec, black, tiny colour chips | giant index numerals (01…17) and project images as **3D cards that skew, tilt and slide with scroll velocity**; dense metadata columns (role, launch, recognition) | 5.2 MB · 2.4 s |
| [Maria Vasilyeva](https://www.mariavasilyeva.com/) (SOTD + Developer, 9 Oct) | canvas/WebGL, 3 canvases | virtual | three custom faces; off-white, black side rails, hand-drawn notes | a horizontal **timeline strip of thumbnails** whose active project explodes into a collage as you scroll | 3.9 MB · 1.7 s |
| [Arthur Engel](https://aengel.io/) | three r184 + Lenis | virtual | League Spartan + Manrope; #111, white | percent loader, "enter the experience" gate, offers a lite version | 1.1 MB · 4.2 s |
| [Nahiyan Khan](https://nahiyan.codes/) (design engineer) | three r183 in Astro, 5 canvases | virtual | Widescreen Ex display, Commit Mono body; #1d1d20, white, one blue | an ambient **dot-field shader** behind dense mono text ("today / yesterday"), floating pill nav, music player | 3.5 MB · **0.8 s** |
| [Houmahani Kane](https://houmahani.com/) | DOM only | virtual | — | percent loader, then typographic | 0.13 MB · 2.6 s |
| [Eemon Roy](https://www.eemonroy.com/) | DOM + 1 canvas | native | Mona Sans + Averia Serif; white, candy pink/green | sticky-note highlights, a 3D gift box, testimonials grid | 1.3 MB · 2.3 s |

### REA evidence for the portfolios

Static (`analyze-web-bundle`, `inspect-web-page --include-script-sources`, `export-web-scripts`, then a marker grep of the exported scripts, never executed) and a `capture-browser-scenario` per site (wait 9 s, six `PageDown` presses, a screenshot after each step, network events):

| Site | Scenario Evidence | Bundle / page Evidence | Markers in shipped scripts (inference) |
| --- | --- | --- | --- |
| Huy Phan | `ev_d5ecb379…` | `ev_ef3a37fe…` / `ev_85692c94…` | three r179 at runtime; only 15 KB of script retained (rest lazy) |
| Maria Vasilyeva | `ev_515d6eff…` | `ev_f2b9800f…` / `ev_ff28cd92…` | raw GLSL ES 3 (9), velocity easing, Web Audio |
| Arthur Engel | `ev_33745c7c…` | `ev_8cf2f058…` / `ev_8fc0fc1b…` | Next.js + React; three WebGPU/TSL (758), R3F, GSAP (177), Lenis (60), glTF/Draco/KTX2, instancing, render targets, glass transmission, Rive, View Transitions |
| Nahiyan Khan | `ev_12309afa…` | `ev_6178cf8b…` / `ev_b4776d38…` | Astro islands; instancing, render targets, transmission (82), View Transitions |
| Houmahani Kane | `ev_114de303…` | `ev_381994ed…` / `ev_5e4901ac…` | DOM only |
| Eemon Roy | `ev_4d7128da…` | `ev_20d5ac2f…` / `ev_d7901b5e…` | React; Rive/Lottie (11) |

## Patterns across all 12

1. **Type does the heavy lifting.** One large grotesk or display face (36–100 px, negative tracking on big sizes) plus a mono or tiny uppercase label face (11–12 px). Two families, rarely three.
2. **Restrained palette.** White, grey or near-black, plus a single accent; colour comes from the work itself.
3. **The 3D is either the whole world (Bruno, Active Theory) or a living layer under editorial layout** (Lusion, Huy Phan, 14islands, Nahiyan). The editorial kind wins most recent portfolio awards, loads in 0.5–2.5 s, and keeps text real.
4. **Motion is scroll-velocity driven.** Cards skew and tilt with speed, then settle (Huy Phan); images explode into collages (Vasilyeva); the camera flies (Active Theory). Almost all use virtual scroll.
5. **Index numerals and metadata rows** (01 · role · year · stack) replace paragraphs.
6. **Floating pill controls** (nav, sound, "let's talk") instead of a header bar.
7. **Loaders and "click to enter" gates are common, and they hurt**: LCP 2–10 s on most; the fastest (Lusion 540 ms, Nahiyan 816 ms) paint real HTML type first and grow the 3D in after.
8. **Sound** is on half of them, always behind a toggle.
9. **Stacks**: three.js r156–r184 everywhere (WebGPU/TSL on the newest); Astro or Next as the shell; Lenis where scroll is native; KTX2/Draco/Meshopt for assets.

## What this means for /v2

- Modern = editorial grid, big grotesk + mono labels, neutral palette with one accent, floating pills, index numbers, very little prose.
- Wow = a 3D layer that **reacts to scroll velocity and the pointer**, one signature transformation, and **real animation clips** on an existing free model rather than hand-made motion.
- Fast = HTML type paints first (target LCP under 1 s, first-load JS ≤ 120 kB), 3D streams in after; no loader gate.
- Assets = CC0 only: RobotExpressive (three.js repo, CC0, 14 clips), Quaternius Universal Animation Library (CC0), Kenney / Quaternius kits (CC0). Real imagery for the projects can come from screenshots of the owner's own live project demos (true content).
