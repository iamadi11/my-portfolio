# Course production

## Current architecture

- Graph/status authority: `docs/system-design/CURRICULUM.md`; routes: `src/content/learn/chapters.ts`.
- Short films: `src/content/learn/films.ts` (serializable topic-specific nodes, links, event beats).
- Pure event sampling: `src/lib/learn/film-model.ts`; geometry: `src/components/learn/film/Scene.tsx`; player: `LessonFilm.tsx`.
- Existing pages use `ChapterTabs chapterId="id"`; film leads Learn; original explanation is a closed disclosure. Keep original labs/quiz usable.
- New chapter content: `src/content/learn/api-lessons.ts`; `src/app/learn/[chapter]/page.tsx` renders only explicitly registered lessons, with static params and real 404s.
- Course-only appearance: `CourseTheme.tsx`, `learn.css`, `film/film.css`. Arimo already loaded: no extra font request.

## Per-chapter recipe

Before implementation, record the objective, primary source, misconception, topology, beat sequence, changed input and limit in `docs/system-design/chapters/<id>.md`. Each beat stores message endpoints, caption, and observable component state. The sampler derives position from beat progress; static scene coordinates are layout, never measured latency. Do not report seconds in the film as real network timing.

A compact film has: everyday problem → normal mechanism → state update → contrasting failure/tradeoff → takeaway. Captions ≤25 words; further detail in transcript/disclosure. Reusable nodes represent recognizable computers, network devices, stores, service processes or data rows. Distinct lessons must differ in topology, ordering or state, not merely labels. One renderer may show many mechanisms; data owns causality.

For a new lab, write a pure function returning the outcome from inputs. Test the important misconception or invariant (e.g. HTTP methods have different semantics), then render that outcome. Avoid giant per-chapter numeric models when the lesson concerns discrete protocol semantics.

## Batch release

Keep a small batch manifest in COURSE_STATE (ids + actual state). Research new claims together, then implement each chapter’s data. Reuse source records without claiming newly read material. Validate graph, skill, deterministic model, typecheck and browser behavior once after the coherent batch. Keep chapters `implemented` until all tests and review evidence required by their next status are available. Never weaken validators to hide missing evidence.

Token accounting: compare UTF-8 byte/word counts as a proxy, not invented model-token measurements. Prefer context helper output + a targeted source read over loading every reference. Do not duplicate the curriculum or place all lesson data in a client bundle: server-select one film and pass only its data to the client player.
