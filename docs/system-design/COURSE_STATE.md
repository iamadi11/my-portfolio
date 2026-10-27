# Course state

State: initialized
Updated: 2026-10-27

The system design course is built only through the `system-design-educator` skill
(`.claude/skills/system-design-educator/`). This file and `CURRICULUM.md` are its memory; see the skill's
`references/course-state.md` for their formats.

## Current unit

web-request step 8

## Next action

Finish `web-request` step 8 (independent review of the implementation), then mode C `client-server`.

## Decisions

- 2026-10-27 The course is authored one unit per skill invocation; chapter status lives only in `CURRICULUM.md` —
  avoids two status lists drifting apart.
- 2026-10-27 An earlier `/learn` prototype was removed from the repo before the skill existed (archived outside the
  repo); it is not part of the course.
- 2026-10-27 `Product: none` — no course code exists; chapters stop at `authored` until the owner asks to start the
  product (SKILL.md "Starting the product").
- 2026-10-27 Proposal (not built): route `/learn` (`src/app/learn/`, App Router sibling of `/`), chapter pages as
  server components, interactive parts as lazy client components; content beside `src/content/site.ts` (e.g.
  `src/content/learn/`), models under `src/lib/` — follows the existing `src/app` + `src/content` + `src/lib` split.
- 2026-10-27 Proposal (not built): reuse the drawing-set look — `globals.css` tokens (`--paper --ink --ink-2 --ink-3
  --line-3 --rule --fill-1 --fill-2`), Arimo (`--font-arimo`, `layout.tsx`), `src/components/blueprint/pen.tsx`,
  `scene.tsx` and `lettering.tsx` for drawings — CLAUDE.md §10.2 and §11.4.
- 2026-10-27 Proposal (not built): budgets and checks adopt the host's existing gates — first-load JS per course
  route ≤ 120 kB and `/` unchanged (§10.4); WCAG 2.2 AA and Lighthouse ≥ 90 (§3); the six §10.5 device sizes with no
  horizontal scroll; reduced motion shows finished states (§10.7); `npx tsc --noEmit`, `npm run lint`, real browser
  check (§4). No new numbers.
- 2026-10-27 Proposal (not built): when the product starts, add the route to `src/app/sitemap.ts` (today it lists
  only `/`) and check `public/sw.js` serves it under its network-first navigation rule (bump `VERSION` if rules change).
- 2026-10-27 Curriculum v1 (mode B): 119 chapters, 12 stages, paths beginner 57 / interview 106 / production 106,
  every path closed under prerequisites — rationale, coverage and scoping sources in `CURRICULUM.md`.
- 2026-10-27 Map chapters (`web-request`, `distributed-trouble`, `security-map`) and mixed-review units
  (`review-foundations`, `review-distributed`, `capstone`) are the only chapters allowed more than one core idea —
  curriculum.md "map chapters" and late interleaving.
- 2026-10-27 Sources that the authoring container cannot open as websites are read from their public source
  repositories (mdn/content, httpwg/http-core, tlswg/tls13-spec, w3c/*, whatwg/fetch) and recorded `via: read` with
  the repo and commit — the text is the same material, and the record says where it came from.
- 2026-10-27 Product started at the owner's request: `/learn` (index, reads `CURRICULUM.md` at build time) and
  `/learn/web-request`; `Product: src/app/learn`. Reused: tokens, Arimo, sheet classes (`bp-sheet`, `bp-nbox`); new:
  `src/components/learn/*` (shell, citation mark, the chapter's figure), `src/lib/learn/*` (model, curriculum reader),
  `src/content/learn/*` (built-chapter routes, sources). No scroll driver on /learn: plain HTML headings.
- 2026-10-27 Test runner: Vitest 4.1.11 (`npm test`, `vitest.config.mts`, `src/**/*.test.ts`). Installed with npm 11
  because npm 10.9.4 crashes on this tree (`edgesOut` in arborist); a strict `npm ci` with npm 10.9.4 then installs
  the lockfile cleanly. The lockfile also moves `@types/node` 20.17.10 → 20.19.43 (within `"20"`; Vite 8's peer
  range) and patch-bumps `nanoid`, `source-map-js`, `@jridgewell/sourcemap-codec`, `undici-types`.

## Open issues

- The authoring container could not open most primary-source sites (DNS blocked for fetch); sources found only via
  search are recorded `via: search` and cannot support claims from `implemented` on (course).
- `course.mjs` lives under `.claude/`, which `eslint.config.mjs` ignores; the skill's own tests run with
  `node --test` (course).
- Scoping sources were read only as search snippets except the System Design Primer; `time-clocks`,
  `consistent-hashing`, `cap-pacelc`, `consensus` and `isolation` have no primary source found yet (course).
- Beginner path has no end-to-end capstone; known gaps listed in `CURRICULUM.md` (course).
- `CURRICULUM.md` scoping sources cite RFC 8446 for TLS 1.3; RFC 9846 (2026-07) obsoletes it (found in
  web-request research). Update the scoping table in the next mode B pass (course).

## Session log

- 2026-10-27 setup: skill and state docs created; course not initialized.
- 2026-10-27 A course: not initialized → initialized; app audited, empty graph created, placement and budgets
  proposed, empty leftover `src/app/learn/` folders (untracked, no files) removed.
- 2026-10-27 B course: curriculum empty → 119 chapters planned; `check` ok, `next` → web-request.
- 2026-10-27 skill: `course.mjs check` now enforces path closure and rejects duplicate path/prerequisite entries
  (closes the open issue); curriculum still passes.
- 2026-10-27 C web-request: planned → authored; spec written, two independent spec reviews, all findings fixed.
