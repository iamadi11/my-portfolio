# Pass three — Recruiter path + contact sunrise (Agent C/E)

**Branch:** `cursor/award-pass-three-410a`  
**Scope:** HTML / CSS / `drive.ts` only. `world/*` left alone (tech-art track).  
**Authority:** `SOURCE_OF_TRUTH.md`, `src/content/site.ts`, `docs/pass-award/director.md`, `CLAUDE.md` §10.  
**Lock:** Round trip only; night film not neon; no invented copy; first-load JS `/` ≤ 120 kB.

Pass two shipped dawn accent, contact hierarchy, hero plates, and reduced-motion gates. This pass **strengthens** the recruiter first-viewport read and the `200 OK` mail CTA path without new strings.

---

## Beats (SITE facts only)

| Beat | Feeling | On screen | Pass-three craft |
| --- | --- | --- | --- |
| **Orbit · Intro** | Cool authority in &lt;5 s | `SITE.profile` name, role, statement (`lede` + `rest`), status · location; Start / Email me / or scroll | Denser name/role text-shadow plate over orbit limb; softer lede/meta plate so brand wins; Email me outline tertiary under filled Start — one composition, no stats/pills |
| **Wire → Edge → Services → Data** | Proof → place → craft → quiet résumé | Impact / skills / projects / roles / education from `SITE` | Unchanged this pass (HTML already maps; world is Agent B) |
| **`200 OK` · Contact** | Closure + conversion | Kinetic “200 OK”; `Round trip complete · {meta}`; measured vitals (browser only); `mailto:` email; Copy email; phone; GitHub; LinkedIn; Credits; Send again | Zone `--accent: #ffd7a8` kept; mail display + dawn underline remains primary; Copy filled next; secondary muted; Send again ghost last — visible and **not inert** only after `.rt-left` (ship leave); 44px target; dawn focus ring |

---

## What changed

| Area | Change | Files |
| --- | --- | --- |
| **Hero plate** | Stronger multi-layer plate on name/role; softer supporting plate; cue Email me quieter than Start | `round-trip.css` |
| **Contact hierarchy** | Slightly warmer mail underline + soft dawn bloom on address; Copy / secondary / Send again weights held; explicit 44px on Copy + Send again; dawn `focus-visible` on mail / Copy / live Send again | `round-trip.css` |
| **Send again usable** | `inert` while ship still present; cleared when `rt-left` so keyboard matches pointer (CSS still opacity / `pointer-events`) | `drive.ts` |

**Left alone:** `world/*`; `site.ts` / resume facts; Pass 1–2 rush/cut/RM animation kills; Sound/Tilt consent.

---

## Acceptance

- [x] First viewport: name + role dominate over orbit plate at 375 and 1280; lede/meta readable but subordinate; no dashboard chrome
- [x] Contact reads **email (mailto) → Copy email → phone/GitHub/LinkedIn → Send again**; warm dawn accent held (`--accent: #ffd7a8`)
- [x] Send again: `inert` + opacity 0 / `pointer-events: none` until `.rt-left`; then inert cleared, 44px, visible; click returns home (smoke 375; 1280 leave-zone after settle)
- [x] Every visible string still from `SITE` / existing Round trip copy / credits / browser-measured vitals
- [x] First Load JS `/` ≤ 120 kB — **114 kB** (`NEXT_DIST_DIR=.next-pass3 npx next build`, 2026-10-22; page 10.8 kB + shared 103 kB)
- [x] `npx tsc --noEmit` and `npm run lint` pass; no edits under `world/*`

---

## Trace to `SITE`

| On screen | Source |
| --- | --- |
| Name, role, statement, status · location | `SITE.profile` |
| Email, phone, GitHub, LinkedIn | `SITE.profile` + links |
| “200 OK”, “Round trip complete · …”, Copy email, Send again, Credits | Existing Round trip copy / assets credits (unchanged strings) |
| Measured vitals line | Browser Performance APIs only (`drive.ts`) |
