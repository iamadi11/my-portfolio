# Course state

State: initialized
Updated: 2026-10-28

The system design course is built only through the `system-design-educator` skill
(`.claude/skills/system-design-educator/`). This file and `CURRICULUM.md` are its memory; see the skill's
`references/course-state.md` for their formats.

## Current unit

none

## Next action

Mode C (`/system-design-educator next`): `web-request` (map chapter, stage 1) — the first chapter with no
prerequisites. Owner review of the curriculum is welcome before chapter authoring begins.

## Decisions

- 2026-10-27 The course is authored one unit per skill invocation; chapter status lives only in `CURRICULUM.md` —
  avoids two status lists drifting apart.
- 2026-10-27 An earlier `/learn` prototype was removed from the repo before the skill existed (archived outside the
  repo); it is not part of the course.
- 2026-10-28 `Product: none` — no course code exists; chapters stop at `authored` until the owner asks to start the
  product (SKILL.md "Starting the product").
- 2026-10-28 Proposal (not built): route `/learn` (`src/app/learn/`, App Router sibling of `/`), chapter pages as
  server components, interactive parts as lazy client components; content beside `src/content/site.ts` (e.g.
  `src/content/learn/`), models under `src/lib/` — follows the existing `src/app` + `src/content` + `src/lib` split.
- 2026-10-28 Proposal (not built): reuse the drawing-set look — `globals.css` tokens (`--paper --ink --ink-2 --ink-3
  --line-3 --rule --fill-1 --fill-2`), Arimo (`--font-arimo`, `layout.tsx`), `src/components/blueprint/pen.tsx`,
  `scene.tsx` and `lettering.tsx` for drawings — CLAUDE.md §10.2 and §11.4.
- 2026-10-28 Proposal (not built): budgets and checks adopt the host's existing gates — first-load JS per course
  route ≤ 120 kB and `/` unchanged (§10.4); WCAG 2.2 AA and Lighthouse ≥ 90 (§3); the six §10.5 device sizes with no
  horizontal scroll; reduced motion shows finished states (§10.7); `npx tsc --noEmit`, `npm run lint`, real browser
  check (§4). No new numbers.
- 2026-10-28 Proposal (not built): when the product starts, add the route to `src/app/sitemap.ts` (today it lists
  only `/`) and check `public/sw.js` serves it under its network-first navigation rule (bump `VERSION` if rules change).
- 2026-10-28 Curriculum v1 (mode B): 119 chapters, 12 stages, paths beginner 57 / interview 106 / production 106,
  every path closed under prerequisites — rationale, coverage and scoping sources in `CURRICULUM.md`.
- 2026-10-28 Map chapters (`web-request`, `distributed-trouble`, `security-map`) and mixed-review units
  (`review-foundations`, `review-distributed`, `capstone`) are the only chapters allowed more than one core idea —
  curriculum.md "map chapters" and late interleaving.

## Open issues

- No unit-test runner (`package.json` has no `test` script); model tests need one. Added when the product starts,
  not before (course).
- The authoring container could not open most primary-source sites (DNS blocked for fetch); sources found only via
  search are recorded `via: search` and cannot support claims from `implemented` on (course).
- `course.mjs` lives under `.claude/`, which `eslint.config.mjs` ignores; the skill's own tests run with
  `node --test` (course).
- Path closure (a path never needs a chapter outside it) is checked by the mode B generator, not by `course.mjs
  check`; a later edit to paths could break it unnoticed (course).
- Scoping sources were read only as search snippets except the System Design Primer; `time-clocks`,
  `consistent-hashing`, `cap-pacelc`, `consensus` and `isolation` have no primary source found yet (course).
- Beginner path has no end-to-end capstone; known gaps listed in `CURRICULUM.md` (course).

## Session log

- 2026-10-27 setup: skill and state docs created; course not initialized.
- 2026-10-28 A course: not initialized → initialized; app audited, empty graph created, placement and budgets
  proposed, empty leftover `src/app/learn/` folders (untracked, no files) removed.
- 2026-10-28 B course: curriculum empty → 119 chapters planned; `check` ok, `next` → web-request.
