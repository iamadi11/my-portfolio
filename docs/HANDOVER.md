# Handover prompt (paste into Cursor)

> Last updated: 2026-10-22, during quality round 3. `main` is the source of truth; this file is refreshed at the end of every round.

You are continuing an award-calibre quality pass on the portfolio home page `/` ("Round trip") in this repo. Work autonomously, in small validated steps, and commit + push to `main` after each round.

## Read first

1. `CLAUDE.md` — hard rules (every fact from `src/content/site.ts`; never invent; first-load JS for `/` ≤ 120 kB, now 113 kB; WCAG 2.2 AA; no layout shift; sound only after opt-in; reduced motion; commit format `feat(portfolio): … — reflects …`).
2. `docs/round-trip.md` — the spec of `/` (places, files, assets and licences, budgets, accessibility).
3. `SOURCE_OF_TRUTH.md` — content authority (mirrors `site.ts`).

## What `/` is

Scrolling flies an alien ship (three.js r184, `src/components/round-trip/world/*`, lazy chunk) from orbit into a night city, through one landscape per project (each ends in a titled portal), over the sea to the pole (one light pillar per record) and back to orbit at sunrise for `200 OK`. Page shell: `RoundTrip.tsx`, `drive.ts` (scroll, panels, HUD, J/K keys, hold-to-boost, idle), `round-trip.css`, `sound.ts` (loaded on opt-in), `tilt.ts`, `trip.ts`.

## Done so far (all on `main`)

- Skills used: juliobsz/skills (`awwwards`, `jury`), wheresryan22/anatomy (reviewed, not adopted yet), pbakaus/impeccable, Leonxlnx/taste-skill, emilkowalski/skills (review/improve animations, performance). Reviewed copies were read from a scratchpad; they are not installed in `.claude/skills`.
- Motion: interruptible jumps; portal-only warp with quiet dips; cues land on the cut; steerable ship (pointer/tilt/arrows), hold-to-boost, idle breathing; per-place camera framing; eased barrel roll; departure glint.
- World: shared haze + valley mist; aurora-lit ice; NASA Moon photo; NASA ISS at the sunrise limb; bloom resolution fix; anti-aliased city windows; skill billboards (exact `site.ts` strings); portals with lit title signs and window throats; blackbody lava; sandstone canyon; night-graded Osaka scan; Seychelles "blob" fixed.
- Page: plain nav (Intro/Impact/Stack/Projects/Experience/Contact); "Start the trip"; WCAG 2.1.4-compliant J/K (switch, off where no hover); honest trip clock; measured vitals at `200 OK`; impact counters; portal title handoff; Send again; JSON-LD from `site.ts`; every panel fits short/landscape screens; disclosures fixed; scenery lazy-loaded; Save-Data/slow gates.

## In flight when this was written (may or may not have landed — check `git log` and `git branch`)

Worktree branches named `worktree-agent-*` (see `git worktree list`). Each owns specific files:
- Ship polish (`world/ship.ts`): hull grade, running lights, plumes; cap engine glow swell (`1 + speed²×0.6`), time-based flicker instead of `Math.random`.
- Portals & post (`services.ts`, `post.ts`, `warp.ts`): enter the next place through the portal window (expose e.g. `rings.entry`), streaks only for the two air passages, bigger black marquees with emissive letters, no fringe at rest, lighter vignette. Needs wiring in `index.ts`.
- Framing & world (`index.ts`, `rig.ts`, `space.ts`, `land.ts`, `sky.ts`): ship at 62–70% width on desktop, framings for city/sea/space, roll only at the first portal, darker night Earth + city lights, alpine triplanar rock/snow, volcano detail, cooler Milky Way per place, crisper dive clouds.
- HTML layer (`RoundTrip.tsx`, `round-trip.css`, `drive.ts`, `src/app/page.tsx`): phone scrim must not erase the world (stops ~`0.9 0 34%, 0.5 46%, 0 60%`), lighter desktop scrim, no duplicate project titles (drop ring tags), a distinctive display face and a world-tied reveal instead of the "template" look.
- Real places (`landmarks.ts` + assets): DEM backdrops from AWS Terrain Tiles for Chocolate Hills (Bohol), Lençóis Maranhenses or Shibam, Zhangye Danxia, Mount Roraima, Erta Ale; expose `names` for world labels.
- La Paz city (`city.ts` + assets): the city chapter as real La Paz (canyon bowl from AWS Terrain Tiles, footprints from Google Open Buildings v3, CC BY 4.0; heights stylised), Illimani behind.

To finish an in-flight branch: `git merge main` into it, validate (below), merge into `main`, push. Then add the credit lines it reports to the Credits in `RoundTrip.tsx` and the asset table in `docs/round-trip.md`.

## Validation (every change)

- `npx tsc --noEmit`, `npm run lint`, `npx prettier --check src/components/round-trip`, `npx next build` (report First Load JS for `/`).
- Real browser at 375×812, 667×375, 960×540, 1280×800: no console errors; CLS 0; all six panels fit between the HUD bars; career disclosures open the visible record and scroll above the HUD; reduced motion; keyboard pass; axe 0 violations.
- 3D: inspect frames at each place (hero, dive, city, each portal, canyon, alpine, volcano, sea, ice, finale). On a real GPU also check 60 fps and the motion itself (jumps, steering, boost, departure).
- Husky pre-commit runs lint + build; commitlint header ≤ 100 chars, body lines ≤ 100; a fallow gate blocks new functions over cognitive complexity 15.

## Open items needing the owner

- Earth textures (`public/env/earth-*.jpg`) come from an owner-supplied `59-earth.zip` with unknown author/licence; credited as "supplied by the owner". Replace with NASA Blue Marble / Black Marble if reachable.
- Ship model is a free3d "personal, non-commercial" model kept by the owner's choice (residual licence risk).
- Sketchfab credits link to search pages; replace with each model's page URL.
- Impact card "200+ merchants changing fraud rules without a redeploy" goes beyond the source wording (owner confirmed `site.ts`; flagged only).

## The loop

Harsh-critic review (jury rubric, Impeccable audit/critique, Taste checklist, Emil's review-animations) → fix every blocker/major → validate in the browser → commit + push to `main` → repeat until a round finds nothing basic, careless or derivative.
