# Course production

## Current architecture

- Graph/status authority: `docs/system-design/CURRICULUM.md`; routes: `src/content/learn/chapters.ts`.
- Short films: `src/content/learn/films.ts` (serializable topic-specific nodes, links, event beats).
- Pure event sampling: `src/lib/learn/film-model.ts`; geometry: `src/components/learn/film/Scene.tsx`; player: `LessonFilm.tsx`.
- Existing pages server-select `LessonFilm` and pass it as `ChapterTabs film={...}`; film leads Learn; original explanation is a closed disclosure. Keep original labs/quiz usable.
- New chapter content: `src/content/learn/api-lessons.ts`; `src/app/learn/[chapter]/page.tsx` renders only explicitly registered lessons, with static params and real 404s.
- Course-only appearance: `CourseTheme.tsx`, `learn.css`, `film/film.css`. Arimo already loaded: no extra font request.

## Per-chapter recipe

Before implementation, record the objective, primary source, misconception, topology, beat sequence, changed input and limit in `docs/system-design/chapters/<id>.md`. Each beat stores message endpoints, caption, and observable component state. The sampler derives position from beat progress; static scene coordinates are layout, never measured latency. Do not report seconds in the film as real network timing.

A compact film has: everyday problem → normal mechanism → state update → contrasting failure/tradeoff → takeaway. Captions ≤25 words; further detail in transcript/disclosure. Reusable nodes represent recognizable computers, network devices, stores, service processes or data rows. Distinct lessons must differ in topology, ordering or state, not merely labels. One renderer may show many mechanisms; data owns causality.

For a new lab, write a pure function returning the outcome from inputs. Test the important misconception or invariant (e.g. HTTP methods have different semantics), then render that outcome. Avoid giant per-chapter numeric models when the lesson concerns discrete protocol semantics.

## Batch release

Keep a small batch manifest in COURSE_STATE (ids + actual state). Research new claims together, then implement each chapter’s data. Reuse source records without claiming newly read material. Validate graph, skill, deterministic model, typecheck and browser behavior once after the coherent batch. Keep chapters `implemented` until all tests and review evidence required by their next status are available. Never weaken validators to hide missing evidence.

Token accounting: compare UTF-8 byte/word counts as a proxy, not invented model-token measurements. Prefer context helper output + a targeted source read over loading every reference. Do not duplicate the curriculum or place all lesson data in a client bundle: server-select one film and pass only its data to the client player.

## Full-curriculum production

`academy-lessons.json` contains authored chapter blueprints, not status or duplicated curriculum titles. `academy-sources.json` holds shared primary source records. `academy.ts` joins those with the curriculum on the server. The browser receives only its own lesson, film and prerequisite recap; shared experiment functions form a bounded lazy client chunk. `design-guides.ts` adds authored complete cases with computed workload arithmetic and explicit faults. `experiment-model.ts` and `topic-models.ts` implement small, explicit models; `makeExperimentFilm` converts their event traces into the same player. Do not paint results unrelated to those traces.

Use the coverage tests to reject missing/duplicate ids, dangling routes, unsupported source ids, answer leakage, inert controls and broken next/previous links. Author chapters as compact records, but never infer the mechanism from a title or generate a quiz by repeating its summary. New numerical examples are labelled assumptions and tested. Existing specialized labs remain available.

## Anatomy/GSAP refinement (2026-10-30)

Shared anatomy parts and explicit port routes replace bespoke device paths. `paceFilm` assigns caption-dependent playback durations; all scene seeks use cumulative starts. `useClock` owns a scoped GSAP timeline or duration-aware static steps. Portfolio drawing time uses a disposable GSAP context and ScrollTrigger; native sticky layout stays server-rendered. Portfolio preference is independent of course appearance.

`COMPANION_MODELS` in academy.ts adds tested comparisons and labs when a broad objective needs more than its primary model. Do not copy a chapter component. `anatomy-refinement.test.ts` checks published films, companions, portfolio tours, part mounts, routes and pacing together. Preserve source/model limitations; an SVG geometry invariant is not a rendered acceptance result.

Owner-approved ceilings are 180,000 bytes first-load JS for `/`, 200,000 for course routes and 600,000 additional on demand. Compare measured compressed assets after a production build; do not increase a ceiling merely to hide a regression. The font remains the bundled Arimo variable font.

## Mission refinements

`ChapterTabs` exposes Learn / Explore / Assess, with query deep links and legacy lab/quiz aliases. `TabFromUrl` observes search params behind a small Suspense boundary so server lesson HTML remains available. Use `history.replaceState(null, ...)`: Next copies router state; passing its existing `__NA` state bypasses URL-hook synchronization. Chapter-keyed tabs prevent one chapter’s answers leaking into another.

`Assessment.tsx` owns committed scored attempts and missed-question revisit links; `Question.tsx` owns committed open reasoning and explicitly manual self-review. Do not import the entire experiment engine merely to render an assessment. `DeferredAcademyLab` downloads it when Explore (or a companion disclosure) becomes visible, then retains it across tab changes. Browser-check first activation as well as cached reuse.

Rich model pilots (load-balancing, partitioned logs, caching) may expose several orthogonal controls and inspectable event ledgers while using the same player and hardware. Register their bounded adapters in the model authority so tests, blueprint metadata and generic question generation reflect the actual mechanism. Never leave a corrected route’s blueprint pointing at the old related-sounding model.
