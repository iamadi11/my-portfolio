# Portfolio craft backlog

Ordered. The skill updates this file at the end of a pass.

1. Done: `public/avatar/aditya.zip` (LAM export from `public/profile_pic.png`) is live on `/`; framing checked at 1440 in the frame and the docked porthole. Re-check the scan alignment at 375 and on a real phone (`--crop`, `--face-y`, `--face-at` in `src/components/host/host.css`).
2. Listen to the voice. Audio decodes and plays on a clock that drives the lip-sync, but nobody has heard it. Check "Tata one M G", "More sand", the email and phone readouts; fix with `HOST.say`, then `npm run voice`.
3. Voice questions (Web Speech API) were not tested with a real microphone. Headless Chrome only proves the mic key renders and typed questions work.
4. The LAM renderer is alpha (`0.0.9-alpha.2`): a 323 KB gzip chunk carrying its own three@0.173, logs to the console, and renders at full devicePixelRatio (no cap). Measure on a mid-range phone; if it stutters, shrink the porthole or patch the DPR.
5. Lighthouse was not run (not installed). LCP/CLS were read with PerformanceObserver in headless Chrome on production builds only.
6. Resume metrics the old Index showed (e.g. Video KYC failure rate −30%, SLA breaches 70% → 15%) are not on `/`: `SOURCE_OF_TRUTH.md`'s snapshot does not list them. Confirm against the resume, add them to the snapshot, then to `Row`.
7. The spec-sheet morph (View Transitions) ran without errors, but a mid-transition frame was not captured. Check it by eye in Chrome and Safari.
8. Unmounted code: `src/components/index/*` (+ `.index-root` rules in `globals.css`), `src/components/signal/*`, `src/components/v2/*` (Loki), `steps.md`. Delete once the owner confirms. `SOURCE_OF_TRUTH.md` § V2 still describes Loki.
9. The avatar ZIP (4–8 MB) will live in git under `public/`. Move it to a CDN or Blob store if repo size matters.
10. The root layout emits Aditya's JSON-LD and Open Graph on every route. Split into route groups before the template ships for someone else.
11. Projects have no screenshot slot; add an optional `image` to `Project` when real screenshots exist. `/about`, `/tech-stack`, `/contact` still use the older card chrome and are not linked from `/`.
