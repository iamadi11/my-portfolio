# Pass two — Journey polish (Agent C+E)

**Branch:** `cursor/award-pass-two-410a`  
**Scope:** HTML / CSS / `drive.ts` only. `world/*` left alone (tech-art track).  
**Authority:** `SOURCE_OF_TRUTH.md`, `src/content/site.ts`, `docs/pass-award/director.md`, `CLAUDE.md` §10.  
**Lock:** Round trip only; night film not neon; no invented copy; first-load JS `/` ≤ 120 kB.

Pass 1 already shipped filmic post, land AIR, portal punch, ship/sea polish, rush CSS, a11y labels. This pass closes remaining **journey** beats on the contact sunrise, hero plate, and reduced-motion path.

---

## What changed

| Beat | Change | Files |
| --- | --- | --- |
| **`200 OK` / sunrise craft** | Zone accent → warm dawn `#ffd7a8` (film sunrise, not neon white). Dawn text-shadow plate on `.rt-ok`, `.rt-done`, `.rt-vitals`, `.rt-mail`. Hierarchy: email display primary → filled **Copy email** → quieter phone/GitHub/LinkedIn (muted outline) → **Send again** ghost last. Send again stays layout-reserved; `pointer-events: none` until `.rt-left`, then auto + 44px. No new copy. | `round-trip.css` |
| **Hero plate** | Stronger multi-layer plate on name/role over orbit limb; soft plate on lede/meta. Still one composition — no stats, pills, or dashboard chrome. | `round-trip.css` |
| **Reduced motion** | Building req pip blink gated to `prefers-reduced-motion: no-preference`. Reduce block also kills Start pulse, cue scrub, poster/beacon, rush/cut blur, Send-again veil transitions, hover transforms; explicit building-pip kill with `!important`. Drive skips vibrate on cut / pass / jump when `reduce`. Veil already skipped in drive. | `round-trip.css`, `drive.ts` |

**Left alone:** `world/*.ts` (post, land, portal, ship, sea, ISS, dawn rim on hull); `site.ts` / resume facts; Pass 1 rush/cut/handoff timing; Sound/Tilt consent.

---

## Acceptance

- [x] Contact reads email → Copy → secondary → Send again; Send again usable only after ship leave (`.rt-left`)
- [x] Dawn feel on close is CSS-only (warm accent + plates); no invented vitals or promo chips
- [x] Hero name/role readable over orbit plate at first paint; no dashboard clutter
- [x] `prefers-reduced-motion: reduce`: no rush/cut blur, Start pulse, req pip blink, cue scrub, poster drift, beacon breath, Send-again veil; no vibrate on portal beats
- [x] Every visible string still from `SITE` / credits / browser-measured vitals
- [x] First Load JS `/` ≤ 120 kB — **114 kB** (`npx next build` route table, 2026-10-22; page 10.7 kB + shared 103 kB)
- [x] Real browser check at 375 and 1280 — hero name/role plate; contact `--accent: #ffd7a8` + dawn mail underline; RM: `.rt-go` `animation: none` + static shadow; no pageerrors (Playwright Chromium)

---

## Trace to `SITE`

| On screen | Source |
| --- | --- |
| Name, role, statement, status · location | `SITE.profile` |
| Email, phone, GitHub, LinkedIn | `SITE.profile` + links |
| “200 OK”, “Round trip complete · …”, Copy email, Send again, Credits | Existing Round trip copy / assets credits (unchanged strings) |
| Measured vitals line | Browser Performance APIs only (`drive.ts`) |
