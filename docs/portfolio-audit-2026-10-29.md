# Portfolio truth and motion audit — 29 October 2026

Scope: read-only review of `SITE`, its content authority, the drawing-set implementation and all five featured public repositories. Application and external repository files were not changed by this audit. `CLAUDE.md` §10 governs the monochrome drawing-set concept; the older character/world defaults in `portfolio-craft` do not override it. Public READMEs were checked against selected source files, not treated as proof that every advertised feature works.

## Confirmed errors and source limitations

### 1. Sidecar's size target becomes an achieved result in the drawing

`src/content/site.ts` correctly calls the size a target. `src/components/blueprint/sections/assemblies/configs.ts`, Sidecar rows/layer subtitles/section labels, instead says `Under 1 KB` / `Runtime · under 1 KB`. The [README at the inspected revision](https://github.com/iamadi11/progressive-image/blob/e78b8deebf748b5fd0e7daaeab5701f09b812fe9/README.md) states a **less-than-1-KB gzip target**, not an independently measured result. The [runtime package](https://github.com/iamadi11/progressive-image/blob/e78b8deebf748b5fd0e7daaeab5701f09b812fe9/packages/runtime/package.json) builds through TypeScript; this inspection did not measure a bundled/gzipped distribution.

Fix: remove the size from the main description/drawing, or consistently label it `Target <1 KB gzip`. Never shorten it into an achieved size claim.

### 2. Sidecar's advertised build pipeline cannot be reproduced from the inspected public checkout

The [public tree](https://github.com/iamadi11/progressive-image/tree/e78b8deebf748b5fd0e7daaeab5701f09b812fe9/packages) contains runtime, React and integration plugins, but no `packages/build`. Nevertheless the [Vite package manifest](https://github.com/iamadi11/progressive-image/blob/e78b8deebf748b5fd0e7daaeab5701f09b812fe9/packages/vite-plugin/package.json) requires `@sidecar/build: workspace:*`, and the [plugin source](https://github.com/iamadi11/progressive-image/blob/e78b8deebf748b5fd0e7daaeab5701f09b812fe9/packages/vite-plugin/src/index.ts) imports `encodeSidecar` from it. The [benchmark](https://github.com/iamadi11/progressive-image/blob/e78b8deebf748b5fd0e7daaeab5701f09b812fe9/bench/synthetic.ts) has the same dependency. This establishes missing public source, without claiming a full install/build was run.

The unanchored `build/` rule in [.gitignore](https://github.com/iamadi11/progressive-image/blob/e78b8deebf748b5fd0e7daaeab5701f09b812fe9/.gitignore) could have excluded that package; this is an inference, not a proven cause. Keep external repositories unchanged in this pass.

Portfolio fix: describe the verifiable runtime as a prototype; avoid presenting the missing generator as a fully reproducible deliverable. Suggested exact summary:

> A progressive-image-loading prototype with a browser runtime that parses binary sidecars, shows intermediate image previews and falls back to the full image.

This traces to [loader.ts](https://github.com/iamadi11/progressive-image/blob/e78b8deebf748b5fd0e7daaeab5701f09b812fe9/packages/runtime/src/loader.ts). Its normal path races the sidecar against a full fetch; tile loading is a fallback after full-fetch failure. Do not imply every successful load always traverses four sequential phases. If the summary changes, update its mirror in `SOURCE_OF_TRUTH.md` and the Sidecar drawing comments, rows and labels together.

### 3. Spatial observes frame drops rather than reporting a direct FPS measurement

The current summary/drawing says `FPS`. The [metrics implementation](https://github.com/iamadi11/spatial/blob/bafde9ff9ef4bce6e44496550b3b2514e9c4ac14/src/adapters/metrics.ts) increments a frame-drop counter when a frame exceeds twice the 60-fps target duration. It also counts layout-shift entries and reads Chromium's optional `performance.memory`; memory is zero when unavailable. Avoid suggesting that all browsers supply identical memory instrumentation.

Suggested exact summary:

> Detects UI performance anti-patterns during development using render counts, layout shifts, frame drops and available browser memory data.

Update the matching signal labels/comments in `configs.ts` to `Frame drops`, keeping the public concept intact. The [README](https://github.com/iamadi11/spatial/blob/bafde9ff9ef4bce6e44496550b3b2514e9c4ac14/README.md) supports the TypeScript, React and Vitest stack. No overhead or cross-browser guarantee was added.

## Confirmed project evidence

| Project | Evidence and safe wording |
| --- | --- |
| Eidos | [README](https://github.com/sweidos/eidos/blob/6676f6763c4aac25854c6aa827afb275002fbb3f/README.md) supports durable IndexedDB mutation replay, service workers, React, stable idempotency keys and npm publication. Safe description: `A durable client-mutation queue for unreliable networks, with IndexedDB replay and stable idempotency keys.` Preserve `Never lose a write` as the project's slogan; if discussing delivery semantics, state at-least-once delivery with server deduplication, never exactly-once. The public contributors endpoint returned `iamadi11` as the largest contributor (276 contributions); this supports the documented organization-repo exception. |
| MCP UI studio | [README](https://github.com/iamadi11/mcp-ui-poc/blob/e45df38ab4af32e557cf8f9622dc4e6e135ca260/README.md) supports the current summary: `A chat-first studio where a message (and an optional API URL) becomes a versioned, publishable UI widget.` React/Vite client, Express server and Redis/Mongo storage are documented. No invented usage or outcome metrics. |
| Video Light Sync | [README](https://github.com/iamadi11/video-light-sync/blob/03fdf6753b7d565041de6342f002bed8d5d02793/README.md), [Yeelight TCP adapter](https://github.com/iamadi11/video-light-sync/blob/03fdf6753b7d565041de6342f002bed8d5d02793/packages/adapters/yeelight/src/YeelightAdapter.ts) and [WLED UDP adapter](https://github.com/iamadi11/video-light-sync/blob/03fdf6753b7d565041de6342f002bed8d5d02793/packages/adapters/wled/src/WledAdapter.ts) support the current screen → Electron hub → devices architecture and the listed stack. Keep the description without a measured latency guarantee. Hardware behavior was not tested; adapters have explicit mock modes when no IP is configured. |

## Owner-confirmed facts that public repos cannot independently validate

Preserve the role history, employment dates, education and career metrics in `SITE`. `SOURCE_OF_TRUTH.md` records owner approval on 19 October 2026 and the resume/LinkedIn conflict decisions. Public personal repositories cannot independently establish or disprove the Cashfree merchant count, KYC reduction, Tata SLA change or build-time improvements. No conflicting evidence was found, and no metrics should be invented, reset or removed merely because these professional results are private. `5+ years` is consistent with the approved June 2021 start date on the audit date.

## Animation and interaction defects from source inspection

1. **Motion preference only read at mount.** `src/components/blueprint/drive.ts`, `drive()` checks `prefers-reduced-motion` once and returns early in still mode. Switching the OS/browser preference later leaves active scroll/camera motion running, or leaves still mode unable to resume. Subscribe to its `change` event, cancel pending frames, finish all scenes in still mode and reset scene caches when resuming. Remove mode classes/listeners on cleanup.
2. **Still-mode camera does not recompose on resize.** The early return also omits resize and small-breakpoint listeners. A still frame loaded at phone width retains the phone camera after widening the viewport. Force camera refresh even if scene time remains `T`; `apply()` currently skips when `t === lastT`.
3. **Print camera can retain a phone composition.** `beforeprint` calls `apply(s, s.T, false)`, but its time-only cache can return immediately when the scene already ended at `T` with the mobile camera. Invalidate the cache or include viewport/camera mode in its key before print. Reapply scroll state after print. The still-mode early return also skips print handlers.
4. **Mobile still results frame holds only the final study.** `sections/Results.tsx` uses `camSm={keys(2, false)}`; still mode selects its last close-up rather than a whole-sheet composition. HTML retains all outcomes, so content is available, but the finished drawing does not communicate the complete sheet. Use a dedicated whole-sheet camera for the still/print mode; test readability on a phone.
5. **Targets fall below the skill's 44-px rule.** `.nav-link`/`.nav-name` in `sections/nav.css` and `.asm-btn` in `sections/assemblies.css` use 32-px minimum heights; title scroll cue uses 36 px. Enlarge hit regions within the existing drawing language. This is a repository/skill target, not a claim that every 32-px control fails WCAG 2.2 AA's smaller target-size criterion.

Suggested meaningful regression checks: mount animated → toggle reduced motion → assert all strokes finish and scroll cannot alter their transforms; toggle back → assert correct current scroll pose; load still at 375 px then resize to desktop → assert camera recomposes; finish a mobile scene then print → assert whole-sheet desktop composition; keyboard focus on project links during an early scroll beat → links remain visible and usable. Existing source reveals these lifecycle paths; rendered browser motion, frame time, Lighthouse and physical-device behavior were **not measured by this audit**.

## Focused recommendations

Apply the source-supported copy and lifecycle fixes before adding animation complexity. Preserve the drawing-set concept and server-rendered HTML. A useful later project-motion enhancement would show one real cause/effect per project (e.g. mutation saved → network unavailable → replay with the same key), grounded in verified source and accompanied by a static equivalent. Extra camera motion alone does not explain behavior. Label cached repository references accurately: `src/lib/live.ts` revalidates daily, so they are source-fetched snapshots rather than continuously live measurements.

Audit method: local source inspection; public GitHub web reads; read-only `gh api` README, source, tree, contributor and commit queries. No secrets were printed. No commits, pushes, deployments or external repository mutations were performed.

## Applied disposition — implementation pass

The parent implementation corrected both confirmed copy issues in `SITE`, the drawings and `SOURCE_OF_TRUTH.md`. Sidecar now describes the verifiable runtime prototype; unsupported achieved-size/build-pipeline language was removed. Spatial uses frame drops and labels memory availability. The project reference's accessible label says public source snapshot.

The scroll driver now observes preference changes, cancels frames in still/print mode, recomposes its camera independently of cached scene time, restores the scroll pose after print and removes listeners/classes on cleanup. Results has a dedicated whole-sheet still camera. Navigation, project and scroll-cue hit targets were enlarged; the six sheet links measured at least 44×44 in the production browser at all six required widths. Portfolio pages showed no horizontal overflow at those widths.

Three driver regression tests cover preference transitions, print after an already-finished mobile frame, still-mode resize/print and cleanup. These tests use a deterministic DOM/observer harness; they are not physical OS/print-dialog or frame-rate measurements. A production browser pass inspected the existing exploded Eidos assembly and the navigation layout. All five featured public repo descriptions were source-audited; public repos do not establish private career outcome metrics. See `system-design/EXPANSION_QA.md` for the complete check/deviation record.
