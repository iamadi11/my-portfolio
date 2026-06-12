# STORY_SPEC.md — Cinematic Journey Architecture

**Status:** Phase 4 (open-source ecosystem shipped)
**Authority:** content from `SOURCE_OF_TRUTH.md` only. This doc defines _presentation_, never facts.
**Staging route:** `/v2` (`src/components/v2/`, per CLAUDE.md §10). Existing site untouched — V2 is a self-contained full-viewport overlay with its own scroll container. Swapped to `/` only after Phase 12 audit passes all gates.

---

## 1. Narrative arc (scene graph)

One continuous scroll. Eight scenes, each mapped to real resume data:

| #   | Scene id      | Narrative beat                              | Data source (SOURCE_OF_TRUTH) |
| --- | ------------- | ------------------------------------------- | ----------------------------- |
| 0   | `origin`      | Single thread in dark space. Identity.      | Identity table                |
| 1   | `root`        | Thread traces back to root: IIIT Lucknow    | Education                     |
| 2   | `tata1mg`     | First chapter. Node ignites. 6 achievements | Experience: Tata 1mg          |
| 3   | `moresand`    | Branch. Migration story.                    | Experience: Moresand          |
| 4   | `cashfree`    | Current-era node. Risk platform.            | Experience: Cashfree          |
| 5   | `ecosystem`   | Open-source life: npm package growth        | GitHub / npm package          |
| 6   | `network`     | Skills as living knowledge graph            | Tech stack (validated list)   |
| 7   | `convergence` | All branches converge. Contact.             | Contact info                  |

Color progression: scene 0 = near-black/midnight → warmth and luminosity increase
monotonically per scene → scene 7 = brightest (cyan/violet/gold). Encoded as a
per-scene design token set, interpolated in the transition band.

## 2. Core engine (`src/components/v2/core/`)

- **`JourneyProvider`** — owns one `useScroll` progress value (0–1) for the whole
  page. Holds scene registry: ordered scene ids → normalized scroll ranges.
  Computed from each scene's measured height; no magic numbers.
- **`Scene`** — wrapper that registers itself, renders SSR content always, and
  exposes `localProgress` (0–1 within its own range) via context to enhancement
  layers.
- **`useSceneProgress(sceneId)`** — returns `{ local, global, state }` where
  state ∈ `before | entering | active | leaving | after`. Single source of
  truth for all animation; scenes never create their own scroll listeners.
- **Transition contract:** adjacent scenes overlap by a fixed band (15% of the
  shorter scene). Outgoing scene's `leaving` drives its exit, incoming scene's
  `entering` drives its emergence. No hard cuts.

## 3. Progressive enhancement (non-negotiable)

1. **Layer A — SSR semantic HTML.** Every fact (headings, roles, dates, bullets,
   contact links) rendered on the server inside `Scene`. Crawlable, in-DOM,
   styled readable with zero JS.
2. **Layer B — DOM motion.** `motion/react` transforms/opacity driven by
   `useSceneProgress`. Client-only, layers on top.
3. **Layer C — WebGL canvases.** R3F scenes (`next/dynamic`, `ssr: false`),
   `aria-hidden`, position fixed behind content. Mounted only while their scene
   is within one viewport of activation; unmounted after.
4. `prefers-reduced-motion`: Layer B collapses to opacity-only, Layer C renders
   a single static frame (no RAF loop).

## 4. Parallax layers (z-order)

1 foreground particles (C) · 2 interactive content (A+B) · 3 timeline structures (C)
· 4 environmental effects (C) · 5 background atmosphere (C, cheap shader)
· 6 distant field (static gradient/canvas). Layers 3–5 may share one canvas with
depth-separated groups — one WebGL context max on screen.

## 5. Performance budgets (gates per phase)

- 60 FPS on M-series laptop, ≥40 FPS mid-range Android; auto-degrade via
  `dpr` clamp `[1, 1.5]` and particle-count tiers.
- Total particles across all systems ≤ 300 simultaneous.
- One WebGL context mounted at a time; postprocessing limited to bloom,
  `luminanceThreshold ≥ 0.06`.
- JS added to first load ≤ 30 kB gz (engine + Layer B); R3F chunk lazy.
- Lighthouse on `/journey`: Perf ≥ 95, A11y = 100, SEO = 100. LCP element is
  Layer A text — never canvas-dependent.
- All animation = transform/opacity only. No layout-triggering properties.

## 6. Dependency plan

- Phase 1: none added.
- Phase 3: `@react-three/fiber` only — no drei, no postprocessing (thin GL lines
    - additive points cover the visual brief at lower cost).
- GSAP: not planned — `motion` covers scroll choreography; revisit only if a
  concrete sequencing need appears (record justification here).

## 6b. Known risks

- The classic site registers a service worker (PWA). It cached stale dev chunks
  during verification (fixed by unregistering). Phase 12 must verify SW caching
  strategy covers /v2 chunks correctly after the swap.

## 7. Phase ledger

| Phase | Scope                                                          | Status  |
| ----- | -------------------------------------------------------------- | ------- |
| 1     | Engine: provider, scene registry, progress hook, staging route | done    |
| 2     | Experience layer: atmosphere, thread, particles, choreography  | done    |
| 3     | Timeline network engine (R3F career constellation)             | done    |
| 4     | Company chapters (2–4)                                         | pending |
| 5     | Project branches                                               | pending |
| 6     | Open-source ecosystem (shared JourneyCanvas)                   | done    |
| 7     | Skills network                                                 | pending |
| 8     | Transition engine polish                                       | pending |
| 9     | Contact finale                                                 | pending |
| 10    | Motion polish                                                  | pending |
| 11    | Performance pass                                               | pending |
| 12    | A11y + SEO audit, swap to `/`                                  | pending |
