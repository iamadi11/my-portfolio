# / (home): Round trip

Scrolling flies an alien ship down to Earth at night and across it. It comes in from orbit over the night side, dives through the atmosphere into a city, then jumps from landscape to landscape (one per project), crosses the open sea to the pole, and ends back in orbit as the sun comes up over the rim. Each place is endless. Flying through a project's portal is the signature: its window, which already shows the next place's sky, opens past the edges of the frame as the ship crosses, the rim sweeps past the lens with a brief flash in the project's colour, and the window fades into the new place. Streaks, zoom blur and the camera punch are kept for the two passages through the air (into the cloud deck, out to orbit). Where there is no portal (city to the first landscape, open sea to the pack ice) the frame dips through the dark instead, so the warp keeps its meaning. The navigation uses plain names (Intro, Impact, Stack, Projects, Experience, Contact); the request metaphor lives in the HUD's request line (`GET /aditya` and the trip clock) and the `200 OK` ending. All facts come from `SITE` in `src/content/site.ts`.

## What a visitor sees

1. **First paint (no 3D yet):** name, role, statement, availability and city in HTML over a CSS poster (stars over the curve of the night Earth), with **Start the trip** and **Email me**. The world's code is fetched on idle.
2. **First scroll, wheel, swipe, scroll key or Send a request:** the world builds and fades in over the poster.
3. **Hero and Wire (space):** the ship hovers over Earth at night, real stars and the Milky Way behind. Through `practice.impact` it closes in; then it noses down and dives at the moonlit globe, plasma building on the hull, the camera pitching down after it, until the cloud deck whites the screen out.
4. **Edge (city):** out of the cloud high over an endless night city, sinking between the towers as the fog thins: lit rooms, LED billboards that scroll the skill groups and items from `practice.skills` (exact strings), street lamps, traffic and wet streets.
5. **Services (one landscape per project):** grassland (wind in the grass, fireflies), desert dunes, red-rock canyon, alpine peaks in falling snow, a volcanic field with lava rivers and embers; then they repeat if there are more projects. Each landscape is a long stretch with one portal at its end, the only one in view: a sci-fi gateway standing on the ground, lined with the project's colour, an event horizon swirling inside it. Flying through it (with a barrel roll) is the jump to the next landscape. The panel shows that project.
6. **Data:** experience then education, one record at a time; the first half over the open sea under the moon, the second over pack ice and icebergs under the aurora. Each record (every role, then education) is a light pillar beside the path, a column of light over a point of light, the way cold nights make them.
7. **200 OK:** the ship pulls up off the ice, the air thins and the stars come back; a cut through the last of the air, and it climbs away from Earth into orbit at sunrise, the globe falling away below. The International Space Station (NASA model) crosses the dawn limb as a small backlit silhouette. The ship turns to greet you, then leaves towards the sun with a last glint of its engines. Under it, what this visit actually measured (first byte, largest paint, JavaScript transferred, from the browser's own timing; any it cannot measure are left out), then email, copy, phone and profile links, the credits, and **Send again** once the ship has gone (the frame fades to black and the trip starts over).

The route in the HUD fills between hops as the request travels; each project's dot fills as the ship closes on its portal; the project panel changes when the world reaches that project's landscape, at the portal's flash, and the panel blurs for that beat so text and world change together; the HUD gets a dark backing while a flash whites out the frame. On a portal's cut the project's name flashes large in its ring colour and flies into the panel's heading. The ship follows the pointer (or the phone's tilt, or the arrow keys) on a spring and banks into the move; holding on the world (or holding J) boosts it like an afterburner; left alone it breathes, a slow sway. J and K fly to the next and previous stop. The HUD shows the real time spent on the trip, not an invented latency. The Wire numbers count between the endpoints their own text states. The event horizon of each portal is a window onto the next place's sky. Ground mist pools in the valleys and the sky and the haze share one colour, so no horizon band shows; the Moon is a NASA photograph. The ship's search beam sweeps the ground on Earth. Sound (drone, wind that follows speed, a chime per ring, a riser into each portal resolving on its cut) loads and plays only once the visitor turns it on. Phones buzz briefly on each jump and ring.

## Files (`src/components/round-trip/`)

| File | Job |
| --- | --- |
| `trip.ts` | The page's view of `SiteContent` (reshapes, never adds facts), plus section heights and where each ring/record sits. |
| `RoundTrip.tsx` | Page shell: HUD, poster, sections and panels, scene labels, sound and tilt toggles, credits. |
| `drive.ts` | Scroll → section, panel state, HUD, scene labels; fetches the world on idle and builds it on the first scroll or Start. No three.js. |
| `sound.ts`, `tilt.ts`, `math.ts`, `round-trip.css` | Sound, tilt-to-scroll on phones, shared maths, styles. |
| `world/index.ts` | `createWorld`: which place is on screen (`stopAt`), the jump or quiet dip between places (`jumper`), the air of each place (`AIR`), the ship's position; `frame()` per animation frame. |
| `world/route.ts` | The path: a long, gently swaying line whose length per section follows the content. |
| `world/gl.ts` | Shared uniforms and GLSL: fog, noise, the path's sway, wrapping scenery around the camera, the beam's pool of light. |
| `world/sky.ts` | Stars and Milky Way from the NASA star map, moon, horizon, aurora. |
| `world/space.ts` | Earth (night lights, clouds, a sunlit crescent at the end), the air seen edge-on, the sun rising over the rim, re-entry plasma. |
| `world/city.ts` | The endless city: towers, aviation lights, traffic, the wet street (mirrored on desktop). |
| `world/land.ts` | The landscapes: one GLSL terrain with five kinds, grass blades, fireflies, embers, snow. |
| `world/sea.ts` | Open sea with a moon path; at the pole, pack ice and icebergs. |
| `world/landmarks.ts` | One real terrain model (Sketchfab, CC BY) on the horizon of some landscapes, beyond the exit portal. |
| `world/services.ts`, `world/records.ts` | The project portals (gateway model, light strip, event horizon; one visible at a time); one light pillar per record. |
| `world/ship.ts` | The ship: PBR model, engine plasma, search beam, re-entry glow, wingtip strobes, banking and barrel rolls. |
| `world/warp.ts` | Light streaks rushing past the camera during a jump. |
| `world/rig.ts` | Camera: follows the ship, banks into turns, widens with speed, punches out and shakes on a jump. |
| `world/post.ts` | Bloom, SMAA, then fringing with speed, the jump's zoom blur and flash, the quiet dip, grain, vignette, dither. |
| `world/glow.ts` | Soft additive sprites (engine glow, strobes, the sun). |

## Look

- **Endless places:** the camera only ever moves forward; the ground, the city blocks and the icebergs are moved by whole tiles to stay around it (`wrapAround` in `gl.ts`), and terrain heights are computed per vertex in GLSL, so no place has an edge.
- **Night everywhere:** moonlight (brighter than nature, as night is shot for film), the horizon tinted by what lies below, fog that fades into it.
- **Ship:** the artist's colour, normal, roughness, metalness, AO and emission maps, baked into plain glTF PBR; reflections from a night HDRI.

## Assets

`scripts/assets.sh` rebuilds everything in `public/models` and `public/env` from git-ignored `assets-src/` (Blender 4.2 for the `.blend` and image work).

| Asset | Source | Licence / credit |
| --- | --- | --- |
| `models/ship.glb`, `ship-1k.glb` | Intergalactic Spaceship, Dennis Haupt (3DHaupt), free3d.com | Personal, non-commercial use; supplied by the owner |
| `models/portal.glb`, `portal-1k.glb` | Sci-Fi Portal Gateway, Igrium, Sketchfab | CC BY 4.0; supplied by the owner |
| `env/earth-*.jpg` | Earth model textures supplied by the owner (`59-earth.zip`) | As supplied |
| `env/stars-*.jpg` | NASA/Goddard SVS Deep Star Maps 2020 | NASA/GSFC SVS; ESA/Gaia/DPAC |
| `env/night.hdr` | Modern Buildings Night, Poly Haven | CC0 |
| `models/terrain/mountain_range_01-*.glb` | Mountain Range 01, solararchitect, Sketchfab | CC BY 4.0; on the grassland horizon |
| `models/terrain/snowy_volcano-*.glb` | Snowy Volcano, Pukar Shiwakoti, Sketchfab | CC BY 4.0; on the volcanic horizon |
| `models/terrain/horseshoe-*.glb` | Horseshoe bend near Grand Canyon, Ignazio Pillitteri, Sketchfab | CC BY 4.0; on the canyon horizon |
| `models/terrain/snowy_mountain-*.glb` | Snowy Mountain - Terrain, artfromheath, Sketchfab | CC BY 4.0; on the alpine horizon |
| `models/terrain/death_valley-*.glb` | Death Valley - Terrain, artfromheath, Sketchfab | CC BY 4.0; on the desert horizon |
| `models/osaka-*.glb` | Osaka downtown, matousekfoto, Sketchfab (night photogrammetry) | CC BY 4.0; the downtown left of the city path |
| `env/moon.webp` | Moon photograph, NASA (nasa/NASA-3D-Resources @11ebb4e, `Images and Textures/Moon/Moon.jpg`) | NASA media, free and without copyright; credit NASA |
| `models/iss.glb` | International Space Station (B), NASA (nasa/NASA-3D-Resources @11ebb4e) | NASA media, free and without copyright; credit NASA; the finale |

## Make it yours

- **Facts:** edit `SITE` in `src/content/site.ts` (types and a `SAMPLE` in `src/content/types.ts`). The number of rings and records follows the number of projects and roles; each gets the same stretch of scroll and a landscape of its own.
- **Ring colours:** each project's `hue` (`RING` in `trip.ts`).
- **Order of landscapes:** `LANDS` in `world/land.ts`; the air of each place: `AIR` in `world/index.ts`.

## Budgets (measured 2026-10-17, production build)

- First-load JS 113 kB (Next.js build report, measured 2026-10-22; gate: ≤ 120 kB). The world is fetched on idle and built on the first scroll; sound loads only when switched on.
- Lighthouse on `/`: performance 98 mobile / 100 desktop; accessibility, best practices and SEO 100; CLS 0.001.
- 60 fps headless in every place at 1280×800 and 390×844 (GPU on; phones get lighter grass, motes, terrain and textures).
- Downloads after Start: ship 1.3 MB (phones 0.6 MB), star map 2.8 MB (0.6 MB), Earth 1.6 MB (0.45 MB), night HDRI 1.6 MB. Per place, as it comes on screen (each landmark is fetched when its landscape or the one before it is shown): downtown scan 5.4 MB (4.8 MB), landmarks 1.9–3.6 MB each (0.7–3.4 MB). On Save-Data or a 2g/3g connection neither the downtown scan nor the landmarks load.

## Accessibility

The canvas, poster and scene labels are `aria-hidden`; every fact is in the HTML in reading order. Keyboard: skip link, name, the J/K keys switch (off by default on devices without hover), Sound, Start the trip, Email me, then each project's links (tabbing into a project brings it on screen); J/K fly between stops and the arrow keys steer. Reduced motion: no reveals, camera roll, shake, speed fringing or poster drift, and places change with a straight cut instead of a jump. Without WebGL the poster stays and every panel still works.
