# Award quality — Round trip `/`

**Agent F · Performance, Accessibility, Quality**  
**Branch:** `cursor/award-calibre-round-trip-410a`  
**Authority:** `CLAUDE.md` §3–4, §10; `docs/round-trip.md`; `docs/pass-award/plan.md`.  
**Rule:** Only measured numbers. No invented Lighthouse scores.

---

## Baseline (measured)

| Metric | Value | Source | When |
| --- | --- | --- | --- |
| First Load JS `/` | **113 kB** | `npx next build` route table (`○ /` First Load JS) | 2026-10-22 (this pass) |
| Page chunk `/` | 10.6 kB | same | same |
| Shared JS (all routes) | 103 kB | same (`+ First Load JS shared by all`) | same |
| Gate | ≤ 120 kB First Load JS for `/` | `CLAUDE.md` §10.3 | — |

Build command used: `npx next build --no-lint` (lint raced with concurrent agent edits; typecheck + compile ran). Route table excerpt:

```
Route (app)                                 Size  First Load JS
┌ ○ /                                    10.6 kB         113 kB
+ First Load JS shared by all             103 kB
```

Artifact: `/opt/cursor/artifacts/first-load-js-baseline.txt` (local agent machine).

Re-measure after integrating other agents’ commits: pull, exclusive build (avoid concurrent `next build` on the same `.next`), record the `/` First Load JS cell again.

---

## Targets

| Area | Target | Notes |
| --- | --- | --- |
| First Load JS `/` | ≤ **120 kB** | World (three.js) idle-fetched; built on Start/scroll. Sound chunk only after Sound on. |
| WCAG | **2.2 Level AA** | HTML is the content; canvas/poster/`rt-tag`/`rt-req` decorative → `aria-hidden`. |
| Reduced motion | Designed path | `prefers-reduced-motion: reduce`: no reveal transforms, poster drift, rush blur, cut blur; straight cuts; drive sets `--rush` to 0. |
| Sound | Opt-in only | Nothing plays before Sound is pressed (`AudioContext` created in the click). |
| Tilt | Opt-in only | Tilt control starts `hidden`; shown by `tilt.ts` when DeviceOrientation is available; off until pressed. |
| CLS | ~0 | Panels stack in one grid cell; fixed canvas; status/`rt-again` reserved layout. |
| Lighthouse | ≥90 Perf / A11y / BP / SEO when measured | **Not run in this baseline.** No `lighthouse` script in `package.json`. Record scores only after a real run. |

### Lighthouse scripts

**None today.** `package.json` scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `lint-staged`, `prepare`, `commit`. No `lighthouse`, `lhci`, or axe CI script. Prior measured scores live in `docs/round-trip.md` (historical; do not treat as this pass’s numbers).

---

## Accessibility checklist

Mark after a real keyboard / AT pass on production build (`next start`). Status here is code-audit + smoke unless noted.

| Check | Status | Where |
| --- | --- | --- |
| Skip link → `#main-content` | Pass (code) | `src/app/layout.tsx` |
| One `h1` (name), section `h2`/`h3` | Pass (code) | `RoundTrip.tsx` Hero / Kinetic / Work / Career |
| Canvas / poster / world tags `aria-hidden` | Pass (code) | `RoundTrip.tsx` |
| Facts in HTML reading order | Pass (code) | panels under `<main id="main-content">` |
| `:focus-visible` ring (accent, 2px + offset) | Pass (code) | `.rt :focus-visible` in `round-trip.css` |
| Route nav: one tree (top **or** bottom) | Pass (code) | `.rt-nav-bottom { display: none }` / mobile swap |
| `aria-current="step"` on active hop | Pass (code) | `drive.ts` HUD update |
| Keyboard: Start, Email, project links, Copy, Credits | Pass (code) | native controls; J/K skipped while a control is focused |
| J/K shortcuts off-switch (WCAG 2.1.4) | Pass (code) | `aria-pressed` + localStorage `rt-keys`; hidden without hover |
| Sound opt-in (`aria-pressed`, no autoplay) | Pass (code) | Sound button; synth lazy-loaded on first on |
| Tilt opt-in (`hidden` until available; `aria-pressed`) | Pass (code) | `[data-tilt]` + `tilt.ts` |
| Reduced-motion path | Pass (code) | CSS `@media (prefers-reduced-motion: reduce)` + `drive` `reduce` flag |
| Contrast AA for body / muted on scrim | Pass (intent) | `--ink`, `--muted` lifted; hero text-shadow plate; handoff glyph plate |
| 24×24 px minimum targets (AA 2.5.8) | Pass (code) | HUD `.rt-snd` min-height 36px; route links min-height 32px |
| No pageerror on Start + short scroll | Pending smoke | Playwright 375 / 1280 below |

---

## Perf checklist

| Check | Status |
| --- | --- |
| First Load JS `/` ≤ 120 kB | **Pass — 113 kB measured** |
| three.js not in first load | Pass (architecture: idle import in `drive.ts`) |
| Sound not in first load | Pass (`import()` inside Sound click) |
| No layout shift from panels / vitals / again | Pass (code intent) |
| Concurrent builds corrupt `.next` | Known hazard — measure with a single build |

---

## Browser smoke (Playwright)

When Chromium/Playwright is available:

1. `npx next start -p <port>` against a clean production build.
2. Viewports **375×812** and **1280×800**.
3. Load `/` → click **Start the trip** → scroll ~2 viewports.
4. Assert **no** `pageerror` / uncaught exception.
5. Save screenshots under `/opt/cursor/artifacts/screenshots/` as `rt-375-*.png` and `rt-1280-*.png`.

Results for this pass: filled in after the smoke run (or marked blocked if the server cannot start).

---

## Cheap fixes landed this pass

Documented in the commit message; prefer `RoundTrip.tsx` / `round-trip.css`:

- Explicit HUD control labels (`aria-label` on Sound / J/K / Tilt) so pressed state is clear to AT beyond visible text.
- Belt-and-suspenders reduced-motion: rush/cut panel filters forced off (already present; keep in checklist).
- Focus ring left as global `.rt :focus-visible` (accent on dark).

---

## Re-measure log

| SHA / note | First Load JS `/` | Notes |
| --- | --- | --- |
| Baseline (pre–quality.md commit; working tree with journey/tech-art WIP) | **113 kB** | Gate OK (−7 kB headroom) |
| _(add rows after each integrate + build)_ | | |
