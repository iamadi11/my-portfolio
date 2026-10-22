# Award pass two — assets (Agent D)

**Role:** Agent D — Asset Researcher · **Date:** 2026-10-22 · **Branch:** `cursor/award-pass-two-410a`  
**Re-verify of:** `docs/pass-award/assets.md` against live Poly Haven / ambientCG APIs (metadata + licence pages only — **no binaries downloaded**).

## Verdict

**Keep current assets. Docs only — no adopt.**

| Decision | Action |
| --- | --- |
| Night HDRI | **Keep** `public/env/night.hdr` = [Modern Buildings Night](https://polyhaven.com/a/modern_buildings_night) 1k HDR |
| Pack ice | **Keep** procedural Voronoi floes in `world/sea.ts` (no bitmap) |
| Ship | **Do not replace** — free3d personal NC; owner-blocked |
| Google / Street View / sat meshes | **Out** — ToS |

**Clear-win bar (all must pass):** (1) CC0 or already-credited CC BY, (2) materially better for night city *or* ice *or* land than what ships, (3) ≤ current download class (~1.6 MB HDRI / ice extras ≤ ~1.5 MB), (4) wireable without breaking `lean()` / Save-Data, (5) no tone clash with La Paz amphitheater storytelling. **None of the shortlist clears (2)+(5) as a drop-in.**

### Shipped HDRI fingerprint (2026-10-22)

| Check | Value |
| --- | --- |
| Path | `public/env/night.hdr` |
| Size | **1 655 510** bytes |
| MD5 | `3067e8d9e8e961e6a11ff45c055a5fbd` |
| Matches | Poly Haven API `files/modern_buildings_night` → `hdri.1k.hdr` (same size + MD5) |
| Licence | [Poly Haven CC0](https://polyhaven.com/license) |

---

## Shortlist

| Candidate | Link | Licence | Size (API) | Adopt / later / reject | Why |
| --- | --- | --- | --- | --- | --- |
| **Modern Buildings Night** (status quo) | [polyhaven.com/a/modern_buildings_night](https://polyhaven.com/a/modern_buildings_night) · [licence](https://polyhaven.com/license) | **CC0** | 1k HDR **1.66 MB** (shipped) | **Keep (already)** | Warm glass + cool sky + water; fits wet night La Paz without neon clash. Wired as `/env/night.hdr` (PMREM + city `tEnv`). |
| Shanghai Bund | [polyhaven.com/a/shanghai_bund](https://polyhaven.com/a/shanghai_bund) | **CC0** (Greg Zaal) | 1k HDR **1.64 MB** | **Later** | Punchier neon skyline + river — same size ballpark — but tone fights canyon bowl / Illimani chapter (plan: “night film, not neon cyberpunk”). A/B only if art direction flips. |
| Vignaioli Night | [polyhaven.com/a/vignaioli_night](https://polyhaven.com/a/vignaioli_night) | **CC0** | 1k HDR **1.70 MB** | **Later** | Rainy square / wet cobbles — close to wet-street story — but incremental vs Modern Buildings for tower glass + distant skyline. |
| Cobblestone Street Night | [polyhaven.com/a/cobblestone_street_night](https://polyhaven.com/a/cobblestone_street_night) | **CC0** | 1k HDR **1.76 MB** | **Reject** (city env) | Tight alley FOV; weak distant skyline for ship + tower reflections. Mood reference only. |
| Qwantani Night | [polyhaven.com/a/qwantani_night](https://polyhaven.com/a/qwantani_night) | **CC0** | 1k HDR **1.70 MB** | **Reject** (city / ice env) | Nature hilltop + Milky Way / soft starlight — fights NASA star dome + procedural aurora; no urban glass cues for Edge. |
| Hansaplatz | [polyhaven.com/a/hansaplatz](https://polyhaven.com/a/hansaplatz) | **CC0** | 1k HDR ≈ **1.7 MB** | **Reject** (city env) | Plaza lamps / shopfronts; no material upgrade over Modern Buildings for wet towers. |
| Snow 02 (nor ± diff) | [polyhaven.com/a/snow_02](https://polyhaven.com/a/snow_02) | **CC0** | 1k nor_gl jpg **1.08 MB**; diff 1k jpg **0.33 MB** | **Later** | Could microdetail pack-ice tops — needs `sea.ts` sample + mip strategy; procedural floes already read. Lazy with ice place only; never first-load. |
| Ice 001 | [ambientcg.com/a/Ice001](https://ambientcg.com/a/Ice001) · [CC0 1.0](https://docs.ambientcg.com/license/) | **CC0 1.0** | 1K-JPG **zip 5.77 MB** (full pack) | **Later** | Legal + commercial-friendly, but full 1K zip blows ice-extras budget; cherry-picking maps still needs shader work. Prefer one library (Poly Haven *or* ambientCG), not both. |
| Rocky Terrain 02 | [polyhaven.com/a/rocky_terrain_02](https://polyhaven.com/a/rocky_terrain_02) | **CC0** | 1k diff jpg **0.84 MB** + nor_gl **0.99 MB** | **Later** | Land is endless GLSL (`land.ts`); tiled albedo fights wrap/`landH` unless blended as fine noise — not a file drop-in. |

### Explicit rejects (unchanged)

| Idea | Why |
| --- | --- |
| Replace ship | free3d **personal NC**; owner call only — `docs/pass-lapaz/ship-licence.md` |
| Google / Street View / satellite meshes | ToS — `docs/pass-lapaz/aleph.md` |
| Aurora HDRI as sky replacement | Fights NASA star map + procedural curtains in `sky.ts` |
| Portal energy texture / new gateway | Event horizon is intentional procedural colour; portal already CC BY and sized |
| Rooftop / twilight HDRIs | Wrong time-of-day for deep-night Edge |

---

## Implement now?

**No.** No binary under `public/env` or `public/textures`. No credit-line change required in `RoundTrip.tsx` / `docs/round-trip.md` (HDRI file unchanged; Poly Haven CC0 attribution remains optional).

If a later pass A/Bs Shanghai Bund: copy 1k HDR → `assets-src/story/hdri/`, rebuild via `scripts/assets.sh`, keep filename `/env/night.hdr`, name the new asset in credits so the panel stays in step with the file on disk.

---

## Sources checked (pass two)

- Poly Haven licence: https://polyhaven.com/license (all assets CC0)
- Poly Haven API `info/*` + `files/*` for Modern Buildings Night, Shanghai Bund, Vignaioli Night, Cobblestone Street Night, Qwantani Night, Hansaplatz, Snow 02, Rocky Terrain 02
- ambientCG licence: https://docs.ambientcg.com/license/ (CC0 1.0); Ice001 via ambientCG API `id=Ice001`
- Local: `public/env/night.hdr` size + MD5 vs API
