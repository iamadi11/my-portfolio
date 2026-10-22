# Round trip world — visual quality tech audit (La Paz pass)

**Scope:** `src/components/round-trip/world/` focus files only (`city.ts`, `land.ts`, `landmarks.ts`, `ship.ts`, `services.ts`, `post.ts`, `rig.ts`, `sky.ts`, `space.ts`, `index.ts`, `gl.ts`).  
**Method:** static read of shaders, layout constants, and how `createWorld` wires places. No code edits.  
**Filter:** highest on-screen impact, cheapest fix that keeps the existing wrap / lazy-GLB / shared-haze architecture. Max 12.

---

## Prioritized weaknesses

| # | File(s) | What’s wrong on screen | Cheapest fix (keep architecture) | Perf risk |
| --- | --- | --- | --- | --- |
| 1 | `city.ts` | Edge reads as a **flat endless megacity**: towers sit on one plane (`FLOOR`), streets are a flat 900×900 plane, density falls off only by `|x|`. No canyon amphitheater, no terraced climb of lights up bowl walls — fights the La Paz arrival beat. | Keep `wrapAround` + `uTile` / `uClear` / `pathX`. Drive tower Y (and later street samples) from a bowl height field `H(x,z)` (DEM displacement or GLSL height like `land.ts`), still instanced with `boxes` + `WRAP_VERT`. Leave path corridor clear via `CLEAR`. | **Med** — extra height lookups in vertex/frag; same draw-call count if instance count unchanged. |
| 2 | `city.ts` (`addDowntown`) | “Real downtown” is **Osaka night photogrammetry**: Japanese tower silhouettes, wrong massing for Altiplano. On lean/Save-Data the strip is empty and the flat procedural grid dominates. | Keep the three-copy Z wrap, `scanRoofs` / `roofLights`, `SCAN_FRAG` night grade, and `lean()` gate. Swap `/models/osaka-*.glb` for a La Paz downtown mesh (or DEM+footprint bake); retune `k` / `DOWNTOWN_X` / `period` only. | **Low** — same load path and material swap; cost tracks new mesh tris. |
| 3 | `space.ts` | Dive targets **Bengaluru** (`HOME` ≈ 13°N, 77.6°E). City lights under the ship are the wrong continent for a La Paz chapter; geography-aware viewers feel the mismatch at the cloud cut. | Change `HOME` lat/lon to La Paz (~16.5°S, 68.15°W). Keep `setFromUnitVectors(HOME, up)` and texture stack. | **Low** |
| 4 | `city.ts` / `sky.ts` / `index.ts` | City horizon is a **generic warm fog band** (`AIR.city`); no Illimani / mountain wall behind the bowl. Sky dome has moon + stars but no far ridge, so the amphitheater never closes. | Cheapest: one distant landmark group in the city chapter (same pattern as `landmarks.ts`: scale, sink, `nightFar` / shared mist) — Illimani DEM or still mesh — positioned past `DOWNTOWN_X` / far +Z. Optional: slight cooler `AIR.city.horizon`. Do not invent a second sky system. | **Low–med** — one extra GLB when city is on; skip on `lean()`. |
| 5 | `index.ts` (`FRAMING`) / `rig.ts` | City uses default **chase** framing; only drop lift sells the cloud-break. Ship stays path-centred; bowl walls never tower in frame the way canyon already does (`side`/`up`/`look`). | Add a `city` entry to `FRAMING` (e.g. slight side offset, lower `up`, more `look` down into the bowl during/after `beat.drop`). `reframe` + `soften` already blend under jumps/dips. | **Low** |
| 6 | `city.ts` (`STREET_FRAG` / `addStreets`) | Wet streets assume a **planar grid** (`fract(vW.xz / 18.0)`, boulevard on `pathX`). On a bowl, asphalt would float or cut through terraces; mirrors only help desktop (`density >= 1`). | Until full DEM streets: keep Reflector plane but **mask/fade** asphalt by slope or distance-to-path; or sample the same `H` for a low-res displaced plane under the boulevard only. Keep phone path as lamp sheen (`uMirror = 0`). | **Med** if displaced mesh + Reflector; **Low** if path-corridor fade only. |
| 7 | `land.ts` | Project lands are still **grass / desert / canyon / alpine / volcano** noise. Creative direction wants Chocolate Hills, Lençóis, Danxia, Roraima, Erta Ale — current HEIGHT/FRAG read as stock biomes, not those forms. | Remap `LANDS` + `HEIGHT` / `FRAG` branches (and `GROUND`) to the five forms; keep one plane, `uKind`, motes, wrap. Volcano → Erta Ale is closest; grass → conical hills needs a new `landH` (cone field already exists for volcano). | **Low** — shader complexity similar; watch alpine/grass instance counts on `small`. |
| 8 | `landmarks.ts` | Horizons are **Sketchfab tourist-ish scans** (Horseshoe Bend, Death Valley, etc.). Silhouettes sell the wrong place names and fight “lesser-known Earth forms.” | Keep lazy `loadAsync` + `lean()` + `nightFar`. Swap `LANDMARKS[].id` / tint / sink / ahead when DEM/terrain GLBs exist; same `show(zone)` prefetch of zone and zone+1. | **Low** |
| 9 | `ship.ts` | Engine thrust and re-entry nose use **`Math.random()`** each frame; glow swell scales with `speed² * 2.5`. On screen: noisy flicker and bloom mush when boosting or diving — cheap-tells against PBR hull. | Deterministic flicker from `uTime` + seed; cap swell (e.g. `1 + speed² * 0.6` as in handover). Keep `glowMaker` sprites and flame shader. | **Low** |
| 10 | `post.ts` (`FINISH`) | Chromatic offset starts at **`0.0012` even at rest**; vignette cuts ~60% at the corners. Idle city/land looks soft and muddy; fights “night film” clarity. | Gate fringe on `uVel` / jump (zero at rest); ease vignette strength (~0.25–0.35). Keep 14-tap zoom blur only when `uJump` is hot. | **Low** — fewer effective samples when idle; jump path unchanged. |
| 11 | `services.ts` (`HORIZON_FRAG`) | Portal throat is a **noise skyline postcard**, not the next landscape’s real light. Next place already has rich `land.ts` / sea shaders the window never shows. | Short term: tighten `skyline()` / ground colours per `uKind` to match remapped lands (Chocolate cones, lagoon flats, banded strata, tepui, lava). Long term (not cheapest): tiny cubemap/RT of next place — skip for this pass. | **Low** for GLSL retune; **High** if RT. |
| 12 | `gl.ts` / `city.ts` (`SCAN_FRAG` + tower `TOWER_FRAG`) | Scan and procedural towers share fog but **different light language**: scan uses photo lamps + fake window grid; towers use occupancy rooms + HDRI glass. Seam at `DOWNTOWN_X` reads as two cities glued together — worse once La Paz bowl + scan (or footprints) meet. | Unify grade: push scan through same moon/`fogAt`/`glowAt` vocabulary; bias `SCAN_FRAG` window grid toward tower cool/warm occupancy; optional shared `tEnv` lod on scan glass-ish faces. No new post pass. | **Low** |

---

## How `city.ts` uses Osaka, `FLOOR`, and `GRID` (La Paz bowl plug-in)

### Constants and layout

| Symbol | Value / role |
| --- | --- |
| `FLOOR` | `-60` — street plane Y; tower bases at `FLOOR + h/2`; exported for ship beam ground in `index.ts`. |
| `GRID` | `18` — block pitch (m). `COLS=27`, `ROWS=24` → one tile `TILE = (486, 432)`. |
| `CLEAR` | `20` — instances within this of `pathX(z)` are discarded in `WRAP_VERT`. |
| `DOWNTOWN_X` | `-55` — procedural towers only for `x > DOWNTOWN_X`; scan owns the left strip. |

`planTowers` fills the tile with jittered `(x,z)` on the grid, then **skips** cells in the downtown strip. `wrapAround` (in `gl.ts`) repeats that tile around the camera so the city never ends.

### Osaka scan path (`addDowntown`)

1. Early-out on `lean()` (Save-Data / slow network) — towers alone.
2. Load `/models/osaka-{lo\|hi}.glb` (meshopt), scale so tallest ≈ **150 m**, centre/shift onto `FLOOR - 1.5`.
3. Replace materials with `SCAN_VERT` / `SCAN_FRAG` (photo → night grade, derivative normals, fake windows, street warm-up).
4. `scanRoofs` + `roofLights` for aviation blinks.
5. **Three** group copies; each frame `update(eye)` sets `z = round(eye.z / period) * period + (i-1)*period`, `x` fixed left of path.

Streets (`addStreets`), traffic, beacons, and rain motes all assume the same flat `FLOOR` and 18 m grid (boulevard follows `pathX`).

### Plugging in a La Paz canyon bowl

Architecture to keep:

- Endless wrap (`uTile` / `wrapAround` / `CLEAR` / `pathX`).
- Split: **procedural (or footprint) fabric** on one side of the path + **hero mesh** on the other (`DOWNTOWN_X` or a bowl-radius rule).
- Lazy GLB + `lean()` + shared `Shared` fog/haze.
- `City.update(eye, on)` toggling streets/downtown with `cityGroup.visible`.

Minimal plug-in sequence:

1. **Height field** `H(x,z)` for the Altiplano bowl (AWS Terrain Tiles bake → texture or GLSL), valley along `pathX` so the flight path stays clear (`CLEAR` still applies).
2. **Towers / footprints** — keep instancing; set instance Y from `H` (Google Open Buildings v3 footprints, stylised heights per creative direction). Retire pure flat `FLOOR` as the only ground; keep `FLOOR` as path reference or replace with `H` samples along the route for the ship beam (`index.ts` already branches `ground: FLOOR` in city).
3. **Downtown hero** — same `addDowntown` pipeline with a La Paz mesh (or terraced bowl chunk); retune `DOWNTOWN_X`, scale, `period`.
4. **Illimani** — far landmark (item 4), not part of the wrap tile.
5. **Credits** — swap Osaka credit in `RoundTrip.tsx` / `docs/round-trip.md` when the asset lands.

What *not* to do: replace wrap with a finite city mesh, or load Google 3D / Street View (creative-direction ToS). Aleph/OSM + AWS Terrain + Open Buildings only.

---

## Out of scope but adjacent

- `sea.ts` / `records.ts` / `warp.ts` / `glow.ts` — not in the focus list; no blocking La Paz gaps identified beyond shared post/ship bloom.
- Adaptive pixel-ratio governor and pmndrs post stack remain larger upgrades (`docs/round-trip-next.md`); not required to make the bowl read.

---

*Audit only. Implementation should follow `CLAUDE.md` release gates and the creative lock in `docs/pass-lapaz/creative-direction.md`.*

---

## Follow-up (implementation status on this branch)

| # | Status |
| --- | --- |
| 1 Flat city / bowl | **Done** — DEM `lapaz-bowl` + slope-lifted towers (`places.ts`, `city.ts`) |
| 2 Osaka morphology | **Kept** — night scan as downtown massing (CC BY); footprints still open |
| 3 Bengaluru `HOME` | **Done** — dive targets La Paz; HTML location stays Bengaluru |
| 4 Illimani wall | **Done** — DEM `illimani` wrapping on the right |
| 5 City framing | **Done** — `FRAMING.city` + thinner Altiplano `AIR.city` |
| 6 Planar streets | Open |
| 7 Land biomes | Partial — DEM horizons swapped; `land.ts` HEIGHT still generic biomes |
| 8 Sketchfab landmarks | **Done** — DEM places via `landmarks.ts` → `places.ts` |
| 9 Ship flicker | **Done** — time-based thrust/nose; capped swell |
| 10 Idle fringe / vignette | **Done** — fringe gated on speed/jump; lighter vignette |
| 11 Portal throat skyline | Open |
| 12 Scan vs tower grade | Open |
