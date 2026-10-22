# Award quality — Round trip `/`

**Agent F · Performance, Accessibility, Quality**  
**Branch:** `cursor/award-calibre-round-trip-410a`  
**Authority:** `CLAUDE.md` §3–4, §10; `docs/round-trip.md`; `docs/pass-award/plan.md`.  
**Rule:** Only measured numbers. No invented Lighthouse scores.

---

## Baseline (measured)

| Metric | Value | Source | When |
| --- | --- | --- | --- |
| First Load JS `/` | **113 kB** | `npx next build` route table (`○ /` First Load JS) | 2026-10-22 (this pass, early) |
| Page chunk `/` | 10.6 kB | same | same |
| Shared JS (all routes) | 103 kB | same (`+ First Load JS shared by all`) | same |
| Gate | ≤ 120 kB First Load JS for `/` | `CLAUDE.md` §10.3 | — |

Build command used: `npx next build` / `NEXT_DIST_DIR=.next-f npx next build --no-lint` when siblings race `.next`. Route table excerpt (baseline):

```
Route (app)                                 Size  First Load JS
┌ ○ /                                    10.6 kB         113 kB
+ First Load JS shared by all             103 kB
```

Artifact: `/opt/cursor/artifacts/first-load-js-baseline.txt` (agent machine).

Re-measure after integrating other agents’ commits: pull, build with `NEXT_DIST_DIR` (see `next.config.ts`), record the `/` First Load JS cell again.

---

## Targets

| Area | Target | Notes |
| --- | --- | --- |
| First Load JS `/` | ≤ **120 kB** | World (three.js) idle-fetched; built on Start/scroll. Sound chunk only after Sound on. |
| WCAG | **2.2 Level AA** | HTML is the content; canvas/poster/`rt-tag`/`rt-req` decorative → `aria-hidden`. |
| Reduced motion | Designed path | `prefers-reduced-motion: reduce`: no reveal transforms, poster drift, rush blur, cut blur; straight cuts; drive sets `--rush` to 0 when reduce. |
| Sound | Opt-in only | Nothing plays before Sound is pressed (`AudioContext` created in the click). |
| Tilt | Opt-in only | Tilt control starts `hidden`; shown by `tilt.ts` when DeviceOrientation is available; off until pressed. |
| CLS | ~0 | Panels stack in one grid cell; fixed canvas; status/`rt-again` reserved layout. |
| Lighthouse | ≥90 Perf / A11y / BP / SEO when measured | **Not run in this pass.** No `lighthouse` script in `package.json`. Do not invent scores. |

### Lighthouse scripts

**None today.** `package.json` scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `lint-staged`, `prepare`, `commit`. No `lighthouse`, `lhci`, or axe CI script. Prior measured scores in `docs/round-trip.md` are historical — not this pass’s numbers.

---

## Accessibility checklist

Mark after a real keyboard / AT pass on production build (`next start`). Status here is code-audit + smoke unless noted.

| Check | Status | Where |
| --- | --- | --- |
| Skip link → `#main-content` | Pass (code) | `src/app/layout.tsx` |
| One `h1` (name), section `h2`/`h3` | Pass (code) | `RoundTrip.tsx` Hero / Kinetic / Work / Career |
| Canvas / poster / world tags `aria-hidden` | Pass (code) | `RoundTrip.tsx` |
| Facts in HTML reading order | Pass (code) | panels under `<main id="main-content">` |
| `:focus-visible` ring (accent + HUD ink plate) | Pass (code) | `.rt :focus-visible`, `.rt-hud :focus-visible` |
| Route nav: one tree (top **or** bottom) | Pass (code) | `.rt-nav-bottom { display: none }` / mobile swap |
| `aria-current="step"` on active hop | Pass (code) | `drive.ts` HUD update |
| Keyboard: Start, Email, project links, Copy, Credits | Pass (code) | native controls; J/K skipped while a control is focused |
| J/K shortcuts off-switch (WCAG 2.1.4) | Pass (code) | `aria-pressed` + `aria-label` + localStorage `rt-keys` |
| Sound opt-in (`aria-pressed` / label, no autoplay) | Pass (code) | Sound button; synth lazy-loaded on first on |
| Tilt opt-in (`hidden` until available; `aria-pressed`) | Pass (code) | `[data-tilt]` + `tilt.ts` keeps `aria-label` in sync |
| Reduced-motion path | Pass (code) | CSS `@media (prefers-reduced-motion: reduce)` + `drive` `reduce` |
| Contrast AA for body / muted on scrim | Pass (intent) | `--ink`, `--muted` lifted; hero text-shadow plate; handoff glyph plate |
| 24×24 px minimum targets (AA 2.5.8) | Pass (code) | HUD `.rt-snd` min-height 36px; route links min-height 32px |
| No pageerror on Start + short scroll | **Pass (smoke)** | Playwright 375 / 1280 — see below |

---

## Perf checklist

| Check | Status |
| --- | --- |
| First Load JS `/` ≤ 120 kB | **Pass — 113–114 kB** (exclusive remasure after tip: **113 kB**) |
| three.js not in first load | Pass (architecture: idle import in `drive.ts`) |
| Sound not in first load | Pass (`import()` inside Sound click) |
| No layout shift from panels / vitals / again | Pass (code intent) |
| Concurrent builds | Use `NEXT_DIST_DIR=.next-f` (wired in `next.config.ts`) |

---

## Browser smoke (Playwright)

Procedure:

1. `NEXT_DIST_DIR=.next-f npx next build --no-lint` then `NEXT_DIST_DIR=.next-f npx next start -p 3040`.
2. Viewports **375×812** and **1280×800** (Chromium via `google-chrome` + `playwright-core`).
3. Load `/` → click **Start the trip** → scroll ~2 viewports.
4. Assert **no** `pageerror`.
5. Screenshots: `/opt/cursor/artifacts/screenshots/rt-{375,1280}-{load,start,scroll}.png`.

### Results (2026-10-22)

| Viewport | pageerror | Screenshots |
| --- | --- | --- |
| 375×812 | **none** | `rt-375-load.png`, `rt-375-start.png`, `rt-375-scroll.png` |
| 1280×800 | **none** | `rt-1280-load.png`, `rt-1280-start.png`, `rt-1280-scroll.png` |

Error log artifact: `/opt/cursor/artifacts/rt-smoke-errors.json` (`ok: true`).

---

## Cheap fixes landed this pass

Prefer `RoundTrip.tsx` / `round-trip.css` / `tilt.ts` (also landed via `aa407cb` integrate):

- Explicit HUD control labels (`aria-label` on Sound / J/K / Tilt); Sound visible text flips to “Sound on”.
- `tilt.ts` keeps `aria-label` in sync when toggled.
- HUD `:focus-visible` uses ink outline + dark plate over the canvas.
- Reduced-motion: rush/cut panel filters forced off in CSS.

---

## Re-measure log

| SHA / note | First Load JS `/` | Notes |
| --- | --- | --- |
| Baseline (early this pass) | **113 kB** | Gate OK (−7 kB headroom); page 10.6 kB |
| `aa407cb` (+ HUD a11y / journey / world integrate) | **114 kB** | Concurrent-agent build path |
| Exclusive remasure after tip (this lead) | **113 kB** | `npx next build --no-lint`; page 10.5 kB; gate −7 kB |
| pass-two tip (bloom/portal/pillars) | **114 kB** | Exclusive husky build on `cursor/award-pass-two-410a` |
| _(add rows after each integrate + build)_ | | |

Lead confirmation: `GET /` **200** on `next start -p 4310`; HTML mount checks pass (`smoke-html-checks.json`); Lighthouse **not run**; interactive computerUse agent **blocked** (model usage) — smoke evidence is harness screenshots + empty pageerror lists.

### Pass two smoke (2026-10-22)

| Viewport | pageerror | Screenshots |
| --- | --- | --- |
| 375×812 | **none** | `p2-375-{load,start,scroll}.png` |
| 1280×800 | **none** | `p2-1280-{load,start,scroll}.png` |

`/opt/cursor/artifacts/p2-smoke-errors.json` (`ok: true`).
