# Handover prompt (paste into Cursor)

> Last updated: 2026-10-22, quality round 4 (La Paz + unique DEM places). Branch `cursor/la-paz-city-storytelling-410a` holds this round; merge to `main` via PR.

You are continuing an award-calibre quality pass on the portfolio home page `/` ("Round trip") in this repo. Work autonomously, in small validated steps, and commit + push after each round (feature branch + PR in cloud agents; `main` when you have direct push).

## Read first

1. `CLAUDE.md` — hard rules (every fact from `src/content/site.ts`; never invent; first-load JS for `/` ≤ 120 kB; WCAG 2.2 AA; no layout shift; sound only after opt-in; reduced motion; commit format `feat(portfolio): … — reflects …`).
2. `docs/round-trip.md` — the spec of `/` (places, files, assets and licences, budgets, accessibility).
3. `SOURCE_OF_TRUTH.md` — content authority (mirrors `site.ts`).
4. `docs/pass-lapaz/` — this round's notes (`aleph.md`, `creative-direction.md`).

## What `/` is

Scrolling flies an alien ship (three.js r184, `src/components/round-trip/world/*`, lazy chunk) from orbit into a night city (**La Paz** amphitheater + Illimani), through one landscape per project (each ends in a titled portal; horizons are Chocolate Hills, Lençóis Maranhenses, Zhangye Danxia, Mount Roraima, Erta Ale), over the sea to the pole (one light pillar per record) and back to orbit at sunrise for `200 OK`. Page shell: `RoundTrip.tsx`, `drive.ts`, `round-trip.css`, `sound.ts`, `tilt.ts`, `trip.ts`.

## Done so far (on `main`, plus this branch)

- Prior rounds: motion polish, Osaka scan, portals, ship, sea/ice, NASA moon/ISS, panels, disclosures, lazy scenery, Save-Data gates. See git log before this round.
- **This round:** AWS Terrain DEM meshes (`scripts/places/build-dem.py` → `public/models/places/*`); city as La Paz bowl + Illimani (`world/places.ts`, `city.ts`); landscape horizons swapped to unique places (`landmarks.ts`); globe dive targets La Paz (HTML location stays Bengaluru); credits + `docs/round-trip.md` updated.
- **Aleph (Belluxx/Aleph):** useful for OSM + terrain research only. Google Street View / satellite / 3D meshes are **out** (ToS). See `docs/pass-lapaz/aleph.md`.

## Next highest-impact open items

1. Open Buildings / OSM footprints for La Paz mid-rises (ODbL) instead of pure procedural towers on the slopes.
2. Ship polish still listed in older notes (hull grade, engine glow cap, time-based flicker).
3. Portal entry through the window (`rings.entry`), streaks only for air passages, lighter vignette.
4. Phone scrim must not erase the world; distinctive display face (HTML layer).
5. Replace owner-supplied Earth textures with NASA Blue Marble / Black Marble if reachable.
6. Sketchfab credit links still point at search pages — replace with model page URLs.

## Validation (every change)

- `npx tsc --noEmit`, `npm run lint`, `npx prettier --check src/components/round-trip`, `npx next build` (report First Load JS for `/`).
- Real browser at 375×812, 667×375, 960×540, 1280×800: no console errors; CLS 0; panels fit; reduced motion; keyboard; axe 0.
- 3D: frames at hero, dive, **La Paz**, each portal + DEM horizon, sea, ice, finale.

## Open items needing the owner

- Earth textures (`public/env/earth-*.jpg`) licence unknown; credited as owner-supplied.
- Ship model free3d personal/non-commercial (owner's choice; residual licence risk).
- Impact card wording flagged in prior handover (owner confirmed `site.ts`).

## The loop

Harsh-critic review → fix blockers → validate in browser → commit + push → repeat.
