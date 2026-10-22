# Award pass — asset shortlist (Round trip `/`)

**Role:** Agent D — Asset Researcher · **Date:** 2026-10-22 · **Branch:** `cursor/award-calibre-round-trip-410a`  
**Verdict:** **Docs only.** No CC0 HDRI or texture was a clear drop-in win over what ships today. Keep `env/night.hdr` (Modern Buildings Night). Do not touch the free3d ship without the owner.

Licence rules for this pass: verify every source; **no Google imagery**; Poly Haven / ambientCG preferred (CC0); Sketchfab only when already credited CC BY; NASA media OK with credit.

---

## Inventory (current)

Sources: `docs/round-trip.md`, `scripts/assets.sh`, `public/models`, `public/env`. Sizes on disk 2026-10-22.

### Environment (`public/env/`) — loaded with the world (not first-load JS)

| File | Role | Source / licence | Size |
| --- | --- | --- | --- |
| `night.hdr` | Ship PBR + city glass reflections (`world/index.ts` PMREM; `city.ts` `tEnv`) | [Modern Buildings Night](https://polyhaven.com/a/modern_buildings_night), Poly Haven, **CC0** | 1.6 MB (1k HDR) |
| `stars-4k.jpg` / `stars-2k.jpg` | Sky dome | NASA/Goddard SVS Deep Star Maps 2020; ESA/Gaia/DPAC | 2.8 / 0.6 MB |
| `earth-day-*.jpg`, `earth-lights-*.jpg`, `earth-clouds-*.jpg` | Globe | NASA Blue Marble NG / Black Marble 2016 / Blue Marble clouds | ~1.6 / ~0.45 MB combined hi/lo |
| `moon.webp` | Moon disc | NASA 3D Resources | 52 KB |

### Models (`public/models/`) — lazy / after Start

| File | Role | Licence | Size (approx) |
| --- | --- | --- | --- |
| `ship.glb` / `ship-1k.glb` | Hull | free3d **personal NC** (Dennis Haupt) — **owner-supplied; do not replace** | 1.3 / 0.6 MB |
| `portal.glb` / `portal-1k.glb` | Project gates | Igrium, Sketchfab **CC BY 4.0** | 2.3 / 0.7 MB |
| `osaka-hi.glb` / `osaka-lo.glb` | La Paz downtown mass | matousekfoto **CC BY 4.0**; skipped on `lean()` | 5.4 / 4.8 MB |
| `places/*-{hi,lo}.glb` | DEM horizons (La Paz bowl, Illimani, Chocolate Hills, Lençóis, Danxia, Roraima, Erta Ale) | AWS Terrain Tiles / Joerd; skipped on `lean()` | 0.7–3.6 MB each |
| `terrain/*` | Legacy Sketchfab horizons (still in tree; places DEM is the live path) | CC BY 4.0 | — |
| `iss.glb` | Finale silhouette | NASA | 0.5 MB |

### Procedural (no bitmap upgrade today)

| System | File | Notes |
| --- | --- | --- |
| Land ground | `world/land.ts` | Full GLSL albedo / height; no ground textures |
| Pack ice / aurora mirror | `world/sea.ts`, `world/sky.ts` | Voronoi floes + procedural aurora curtains |
| Portal energy | `world/services.ts` | Event-horizon swirl in project colour; no energy map |
| City wet street / towers | `world/city.ts` | Procedural + night HDRI reflections |

**Budgets:** first-load JS ≤ 120 kB (world idle-fetched). Night HDRI ~1.6 MB after Start. Scenery (`osaka`, `places`) gated by `lean()` (Save-Data / ≤3G).

---

## Shortlist (3–6 upgrades)

| # | Candidate | URL | Licence | Why it might help | Poly / tex budget | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Shanghai Bund** (HDRI) | [polyhaven.com/a/shanghai_bund](https://polyhaven.com/a/shanghai_bund) | **CC0** (Greg Zaal) | Stronger neon skyline + river speculars for glass / wet street vs Berlin riverside | 1k HDR ≈ **1.64 MB** (same ballpark as current 1.66 MB) | **Later** — tone fights La Paz amphitheater (canyon + Illimani, not neon bund). A/B only if art direction wants “megacity neon.” |
| 2 | **Vignaioli Night** (HDRI) | [polyhaven.com/a/vignaioli_night](https://polyhaven.com/a/vignaioli_night) | **CC0** | Rainy square, warm lamps, wet cobbles — closer to wet-street story | 1k HDR ≈ **1.70 MB** | **Later** — incremental over Modern Buildings; not a clear glass/skyline upgrade for tower reflections. |
| 3 | **Cobblestone Street Night** (HDRI) | [polyhaven.com/a/cobblestone_street_night](https://polyhaven.com/a/cobblestone_street_night) | **CC0** | Tight lamp pools / deep shadow for intimate street read | 1k HDR ≈ **1.76 MB** | **Reject** (for city env) — alley FOV; weak distant skyline for ship + tower glass. Keep as mood reference only. |
| 4 | **Snow 02** normal (+ optional diff) | [polyhaven.com/a/snow_02](https://polyhaven.com/a/snow_02) | **CC0** | Microdetail on pack-ice floes / berg tops under aurora | 1k nor_gl jpg ≈ **1.1 MB**; diff 1k ≈ **0.3 MB**. Lazy with ice place only | **Later** — needs `sea.ts` sample + mip strategy; procedural floes already read. Wire only behind ice `show`, never first-load. |
| 5 | **Ice 001** (or Snow 014) | [ambientcg.com/a/Ice001](https://ambientcg.com/a/Ice001) · [Snow014](https://ambientcg.com/a/Snow014) | **CC0 1.0** ([ambientCG licence](https://docs.ambientcg.com/license/)) | Alternate ice albedo/roughness pack for floe sparkle | Use **1k** JPG maps only (keep total ice extras ≤ ~1.5 MB) | **Later** — same shader cost as #4; prefer one library (Poly Haven *or* ambientCG), not both. |
| 6 | **Rocky Terrain 02** / **Aerial Grass Rock** | [rocky_terrain_02](https://polyhaven.com/a/rocky_terrain_02) · [aerial_grass_rock](https://polyhaven.com/a/aerial_grass_rock) | **CC0** | Ground detail on land stretches (Chocolate Hills / Roraima floor) | ARM or diff+nor 1k ≈ **0.7–1.8 MB** per set; must be landscape-lazy | **Later** — land is endless GLSL; a tiled map fights wrap/`landH` unless blended as fine noise. Not a drop-in. |
| — | *(status quo)* **Modern Buildings Night** | [modern_buildings_night](https://polyhaven.com/a/modern_buildings_night) | **CC0** | Already wired; warm glass + cool sky + water — fits wet night city without neon clash | **1.66 MB** shipped | **Keep (adopt already)** — best fit for current La Paz chapter. |

### Explicit rejects

| Idea | Why |
| --- | --- |
| Replace ship with any free model | free3d **NC**; owner call only — see `docs/pass-lapaz/ship-licence.md` |
| Google / Street View / satellite meshes | ToS — out (`docs/pass-lapaz/aleph.md`) |
| Aurora HDRI as sky replacement | Would fight NASA star map + procedural curtains in `sky.ts`; ice wants green *emission*, not a baked dome |
| Portal “energy” texture / new gateway | Event horizon is intentional procedural colour; portal is already CC BY and sized for flight-through |
| Rooftop Night / twilight HDRIs | Wrong time-of-day for deep-night Edge |

---

## Implement now?

**No.** Criteria for a clear win were: (1) legally CC0/CC-BY verified, (2) materially better for night city *or* ice *or* portal *or* land, (3) ≤ current download class, (4) wireable without breaking `lean()` / Save-Data, (5) no tone clash with La Paz storytelling.

Shanghai Bund is the only HDRI that might *look* punchier, but it fails (2)+(5) for this chapter. Texture upgrades need shader work, not a file copy into `public/env`.

If a later pass A/Bs Shanghai Bund: copy 1k HDR → `assets-src/story/hdri/`, update `scripts/assets.sh` + credits in `RoundTrip.tsx` / `docs/round-trip.md`, keep filename `/env/night.hdr` so `lean()` paths stay untouched.

---

## Credits note

`200 OK` credits already list Sketchfab CC BY, NASA Earth/Moon/ISS/stars, and Joerd/AWS terrain. Poly Haven night HDRI is **CC0** (attribution optional); still name it if the HDRI file ever changes so the panel stays in step with `scripts/assets.sh`.
