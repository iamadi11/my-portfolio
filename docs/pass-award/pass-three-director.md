# Award pass three — Creative Director

**Agent A · Creative Director**  
**Branch:** `cursor/award-pass-three-410a` (from `origin/cursor/award-pass-two-410a`)  
**Authority:** `CLAUDE.md` §10, `docs/round-trip.md`, `docs/pass-award/director.md`, `tech-art.md`, `pass-two-*.md`, `src/content/site.ts`.  
**Lock:** Round trip night film. No bobblehead / likeness world. `SITE` facts only. First-load JS `/` ≤ 120 kB. No new large assets unless a clear CC0 win (pass two: none).

Passes 1–2 shipped: filmic post, land AIR, portal punch, ship/sea motion, place bloom/glow/records/horizon, journey dawn CSS + hero plate + RM path. First Load JS measured **114 kB**.

---

## 1. Thesis (≤3 sentences)

Round trip is one night-film take: an alien ship carries the recruiter from cool orbital authority (Aditya Raj, Senior SDE at Amby Tech — fintech and e-commerce proof in `SITE`) down into a real La Paz night city, through one elsewhere per build, quiet résumé weather, then sunrise contact. The world proves place and craft; the HUD keeps the request metaphor (`GET /aditya` → `200 OK`) — never a dashboard over the hero. Portal jumps stay the only loud cuts; quiet dips and air cuts protect that meaning.

---

## 2. Three weakest remaining moments (after passes 1–2)

| # | Beat | Where | Why it still fails the award read |
| --- | --- | --- | --- |
| 1 | **Cloud-break → La Paz** (signature #1) | `world/index.ts` `FRAMING.city` + `reframe(…, beat.drop)`; `AIR.city` mist on drop; `city.ts` / Illimani DEM | Amphitheater still soft: chase framing holds too long after the deck clears; bowl walls + Illimani land late; valley mist under-sells Altiplano air vs “flat megacity” residue. |
| 2 | **Ship vs limb / night key** | `world/ship.ts` key/fill/rim path; `index.ts` `rimOf` / `flyShip` / `depart` | Graphite hull goes flat against Earth at orbit close-in and early dawn — continuous character loses film grade before the finale greets. |
| 3 | **Sunrise departure** (signature #3) | `world/space.ts` ISS scale + dawn graze; `index.ts` GOLD rim + finale sunlight; HTML dawn plate already landed (pass two) | Station reads shy on the limb; hull gold + engine glint under-powered vs the CSS contact craft that already works. World must match the plate. |

---

## 3. Top 5 perceptual improvements (impact ÷ cost)

Implementable in shaders / framing / uniforms / CSS. **No new large assets** (HDRI keep Modern Buildings Night per `pass-two-assets.md`).

| Rank | Improvement | Impact | Cost | Owner |
| --- | --- | --- | --- | --- |
| 1 | **City FRAMING + mist on `beat.drop`** — stronger side/look into the bowl; faster `reframe` urgency as drop falls; thicker valley mist so Illimani + walls own the first clear frames | Highest (signature #1) | Low | Tech art (B) · `index.ts` |
| 2 | **Hull moon/dawn key + fill + hotter rim** — readable graphite against globe and dawn; keep idle flicker deterministic | High (only continuous character) | Low | Tech art (B) · `ship.ts`, `index.ts` |
| 3 | **ISS scale + warmer dawn graze + finale sun** — station silhouettes the limb; gold owns the hull as `dawn` climbs; engine glint lands with leave | High (signature #3) | Low | Tech art (B) · `space.ts`, `index.ts` |
| 4 | **Quiet-dip craft** — intentional dark hold on city→first land and sea→ice (`jumper` dip / post) so portal remains the only loud cut | Med–high (protects sig #2) | Low | Tech art (B) · `index.ts` / `post.ts` |
| 5 | **Land micro-life** — mote / ember density bump on `land.ts` (and chase-distance crest read on Chocolate Hills / Lençóis) so five elsewheres feel alive without new GLBs | Med | Low | Tech art (B) · `land.ts` |

**Defer:** RT portal throat, HDRI A/B (Shanghai Bund fights night-film tone), Quaternius ship swap (owner), land HEIGHT rewrite (already remapped).

---

## 4. Kill list

- Bobblehead / character-likeness world (Round trip locked; owner approval required)
- Google SV / sat / photoreal 3D tiles
- Purple-glow / neon cyberpunk UI or full-scene project-colour washes
- Hero / Wire dashboard clutter (stat strips, pills, floating badges)
- Invented `SITE` copy, metrics, employers, or vitals the browser cannot measure
- Bengaluru-as-city swap; tourist postcard icons for the five lands
- Portal inflation (every hop is not a jump)
- Sound / tilt before consent
- First-load JS `/` > 120 kB; layout shift; WCAG AA regressions
- New large assets without a clear CC0 win (pass-two bar still holds)

---

## 5. Acceptance for pass three

- [ ] Signature #1: after cloud-break, La Paz bowl + Illimani read at **375** and **1280** within the first clear seconds (not chase-only)
- [ ] Ship hull readable against night Earth and dawn limb (no flat graphite silhouette)
- [ ] Signature #3: ISS readable on dawn limb; hull gold + leave glint match the existing CSS dawn contact plate
- [ ] Portal remains the only loud cut; quiet dips stay quiet; night-film grade held (no neon)
- [ ] No new large assets; credits unchanged unless a binary actually ships
- [ ] Every string still from `site.ts` / resume / LinkedIn / GitHub / owner / browser-measured vitals
- [ ] `npx tsc --noEmit`, `npm run lint`, production build; `/` First Load JS **≤ 120 kB**
- [ ] Real browser smoke at 375 and 1280; reduced-motion path still intentional (stills + straight cuts)
