# / (home): Round trip

Scrolling sends one request through a full-stack world, and the visitor rides it: from the browser down a fibre tunnel, through a night city of servers, through one gyroscope per project, into a lattice of records (one per role), and back as a `200 OK` with the whole route laid out as a map. Every shape is generated in code with three.js; there are no model files. All facts come from `SITE` in `src/content/site.ts`; the next pass is planned in `docs/round-trip-next.md`.

## What a visitor sees

1. **First paint (no 3D yet):** name, role, statement, availability and city in HTML over a CSS poster of the fibre tunnel, with **Send a request** and **Email me**. The world's code (three.js + `world/*`) is fetched on idle.
2. **First scroll, wheel, swipe, scroll key or Send a request:** the world builds (≈100–300 ms) and fades in over the poster.
3. **Wire:** `practice.impact`, the resume results worth reading at a glance, inside the tunnel.
4. **Edge:** the skill groups from `practice.skills`; the city's lit windows and street traffic (other requests) pass by. The row in focus follows the scroll.
5. **Services:** one chrome gyroscope per project, coloured by the project's `hue`. Each spins freely and locks into a portal as the request arrives; the panel shows that project (summary, stack, links). Labels in the scene name the nearby rings.
6. **Data:** experience then education, one record at a time (role, period, location, resume highlights, tech; phones show the first three highlights); a query scan follows the request down the lattice and each role's record lights as it passes.
7. **200 OK:** the camera climbs out to show the whole route; the response flies home along it. Email, copy, phone and profile links.

The HUD shows the hop (`Browser → Wire → Edge → Services → Data → 200 OK`) and a request timer (`GET /<first name> · ms`). Sound (drone, wind that follows speed, a chime per ring) stays off until the visitor turns it on.

## Files (`src/components/round-trip/`)

| File | Job |
| --- | --- |
| `trip.ts` | The page's view of `SiteContent` (reshapes, never adds facts), plus section heights and where each ring/record sits. |
| `RoundTrip.tsx` | Page shell: HUD, poster, sections and panels, scene labels, sound and tilt toggles. |
| `drive.ts` | Scroll → section, panel state, HUD, scene labels; fetches the world on idle and builds it on the first scroll or Start. No three.js. |
| `sound.ts` | WebAudio drone, wind and chimes. |
| `tilt.ts` | Phone tilt → camera steering (iOS asks via the Tilt button; Android needs no prompt). |
| `math.ts` | `clamp`, `lerp`, `smooth`, shared by the shell and the world. |
| `round-trip.css` | Styles, all under `.rt`. |
| `world/index.ts` | `createWorld`: renderer, scene, zones, camera, post; `frame()` per animation frame, `dispose()`. |
| `world/route.ts` | The path (a Catmull-Rom curve heading into -z) and helpers to place things around it. |
| `world/gl.ts` | Shared uniforms and GLSL (fog, the request's glow), instanced boxes, a seeded random. |
| `world/wire.ts`, `city.ts`, `services.ts`, `lattice.ts`, `map.ts` | The five zones. |
| `world/packet.ts` | The request (core, halo, light, trail) and the dust. |
| `world/rig.ts` | Camera: follows the request, banks into turns, widens with speed, pulls out for the map. |
| `world/post.ts` | Bloom, then colour fringing with speed, grain, vignette, dither. |

## Make it yours

- **Facts:** edit `SITE` in `src/content/site.ts` (types and a `SAMPLE` in `src/content/types.ts`). The number of rings and records follows the number of projects and roles; the services and data sections grow to give each one the same scroll.
- **Ring colours:** each project's `hue` (`RING` in `trip.ts`).
- **Look:** zone colours live in the zone files; bloom and exposure in `world/post.ts` and `world/index.ts`.

The retired /v2 character, pop-up book and the old `/` guide (LAM head, voice) are archived in `docs/v2-research/archive/`; the generated assets sit in git-ignored `assets-src/`.

## Budgets (measured 2026-10-16, production build)

- First-load JS 108 kB (gate: ≤ 120 kB). The world is fetched on idle: three.js 82 kB + 53 kB, world 7 kB + post 5 kB (gzipped).
- Lighthouse on `/`: performance 91 mobile / 100 desktop; accessibility, best practices and SEO 100; CLS 0.001.
- ~60 fps headless at 1280×800 and 390×844 (GPU on; phones get half the geometry and a lower pixel ratio).

## Accessibility

The canvas, poster and scene labels are `aria-hidden`; every fact is in the HTML in reading order. Keyboard: skip link, name, Sound, Send a request, Email me, then each project's links (tabbing into a project brings it on screen). Reduced motion: no reveals, camera roll, speed fringing or poster pulse; the request follows the scroll directly. Without WebGL the poster stays and every panel still works.
