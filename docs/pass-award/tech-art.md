# Round trip `/` — tech-art audit (award pass)

**Agent B · 3D Graphics / Technical Art**  
**Scope:** presentation in `ship.ts`, `post.ts`, `sky.ts`, `space.ts`, `city.ts` (look only), `land.ts`, `sea.ts`, `records.ts`, `index.ts` (`FRAMING` / `AIR`), `services.ts` portals, `warp.ts`, `glow.ts`, `rig.ts`.  
**Architecture lock:** three.js r184, no R3F; keep ship / portal / Osaka scan / DEM places / MS footprints; no Google SV/sat/mesh; first-load JS `/` ≤ 120 kB; facts from `site.ts` only.  
**Method:** static shader + framing read against the award blueprint (`docs/pass-lapaz/award-blueprint.md`). La Paz bowl / land remap / idle fringe gates from the prior pass are treated as done.

---

## Top 12 on-screen weaknesses

| # | Where | On-screen weakness | Cheapest fix (no large assets) | Perf risk | Priority |
| --- | --- | --- | --- | --- | --- |
| 1 | `post.ts` `FINISH` | Night film looks mid-grey: AgX alone, no contrast shoulder / shadow lift in the finish pass. Grain + vignette sit on a flat grade. | Mild S-curve + cool shadow lift + soft highlight roll in `FINISH` (filmic, not neon). Keep fringe gated on speed/jump. | **Low** — ~8 ALU ops/pixel after SMAA. | **Do** |
| 2 | `index.ts` `reframe` / `FRAMING.city` / `rig.ts` | After the cloud cut, La Paz still rides chase framing for too long; bowl side/look lands late while `beat.drop` lift owns the shot. | Faster settle into `FRAMING.city` while drop is falling; nudge city frame (side/look/lens) so Illimani + walls read sooner. | **Low** — CPU lerp only. | **Do** |
| 3 | `index.ts` `AIR` + land fog | Project lands share near-identical air; Chocolate Hills / Lençóis / Danxia / Roraima / Erta Ale read as one moonlit plane with different albedo. | Widen per-place `fog` / `horizon` / `mist` / `stars` deltas so each jump changes the air, not only the ground. | **Low** — uniform writes already per frame. | **Do** |
| 4 | `services.ts` horizon / rush | Portal throat is a polite swirl: flash `0.45`, `uOn` from distance only; rush does not punch the disc as the ship lines up. | Rush-driven throat punch (`uPunch`), hotter cross flash, strip surge on hit. Keep postcard skyline (no RT). | **Low–med** — few extra uniforms/ALU; watch bloom near gate (glow already scaled by `rings.close`). | **Do** |
| 5 | `ship.ts` | Secondary motion is hard to read at chase distance: tiny hover, soft bank residual, engines swell quietly. | Stronger idle hover + readable bank residual + thrust-linked engine pulse (time-based, no `Math.random`). | **Low** — existing update path. | **Do** |
| 6 | `sea.ts` | Open water is near-black flat; pack ice leads lack deep blue; bergs read as chalk blocks. | View-dependent absorption on water, deeper leads, stronger ice/berg subsurface blue. | **Low** — frag ALU only; sea already heavy. | **Do** |
| 7 | `post.ts` / `index.ts` glow scale | Volcano lava + city windows still mush under one bloom strength; portal already dampened. | Place-aware `glow` scale (volcano/city down a touch, ice/ocean up slightly). | **Low**. | Later |
| 8 | `glow.ts` | Engine / beacon sprites are soft white balls; plasma mesh does the work but far shots go mushy. | Tighter radial falloff on the shared canvas map. | **Low**. | Later |
| 9 | `records.ts` | Pillars stay at `0.25` until close — résumé weather is easy to miss on the first sea stretch. | Raise baseline + earlier near ramp; keep passed-lit state. | **Low**. | Later |
| 10 | `warp.ts` / portal cuts | Portal jumps intentionally skip streaks; the physical cue is only post zoom-blur — can feel thin vs air passages. | Optional: slightly stronger portal zoom in `FINISH` when tint is project-coloured (not full streaks). | **Med** — easy to over-smear text. | Later |
| 11 | `sky.ts` / land seams | Horizon haze is shared, but alpine mist / volcano heat don’t tint the dome enough vs ground fog. | Drive a touch more of `uHorizon` from place AIR (already wired); optional thin heat shimmer only on volcano. | **Med** if shimmer. | Later |
| 12 | `space.ts` dive → city | Dive pitch / heat already work; residual risk is framing handoff (item 2) more than Earth shaders. | Prefer item 2; leave Earth textures / `HOME` La Paz alone. | — | Out |

---

## Implementation order (this agent)

Ship **#1–#6** only (LOW–MED risk, high perceptual impact, no new large assets). Atomic commits; `npx tsc --noEmit` before each code commit.

Left open for sibling agents / later: #7–#11, any RT portal throat, glow texture bake, records pillar art pass, CSS/HUD (Agent E).

---

*Facts remain `SITE`-only. Do not replace earth textures or footprints JSON.*
