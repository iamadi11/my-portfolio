# Course state

State: initialized
Updated: 2026-10-27

The system design course is built only through the `system-design-educator` skill
(`.claude/skills/system-design-educator/`). This file and `CURRICULUM.md` are its memory; see the skill's
`references/course-state.md` for their formats.

## Current unit

client-server step 6

## Next action

Blocked on an owner decision: `client-server` is authored (spec complete through step 5) and step 6 (implement in
`/learn`) waits for the owner to authorize integrating it. When authorized: implement the visual's model and tests,
the page, browser checks, then the independent review (steps 6–8). Separately, the owner decides when to merge the
web-request fixes made after PR #18 (production still serves 75b2b6c).

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
- 2026-10-27 Deploys: `.vercelignore` keeps `docs/` local except `docs/system-design/CURRICULUM.md`, which `/learn`
  reads at build time (a Vercel preview failed with ENOENT on it; reproduced and fixed by building from only the
  files the ignore rules upload). Any other build-time read from `docs/` needs the same exception.

## Open issues

- `client-server` step 6 is blocked by choice of the owner: implementation in `/learn` needs their authorization
  (2026-10-27). No independent review has run on its spec yet; the skill runs it at step 8 (client-server).
- RFC 6265 (cookies) may have been obsoleted by the 6265bis revision (search only: approved, no published number
  found); `client-server` uses only the basic Set-Cookie → Cookie mechanism (client-server).

- `web-request` is `verified` against the skill's criteria, with these limits recorded (not findings): no real
  screen reader was used (DOM/ARIA only); RFC 9846 is read in the TLS WG's final source, not the published RFC
  (unreachable; publication date in search snippets disagrees, July vs May 2026); the owner has not reviewed the
  page (not a skill criterion); fixes after PR #18 are on the branch, not yet deployed (web-request).
- The authoring container could not open most primary-source sites (DNS blocked for fetch); sources found only via
  search are recorded `via: search` and cannot support claims from `implemented` on (course).
- `course.mjs` lives under `.claude/`, which `eslint.config.mjs` ignores; the skill's own tests run with
  `node --test` (course).
- Scoping sources were read only as search snippets except the System Design Primer; `time-clocks`,
  `consistent-hashing`, `cap-pacelc`, `consensus` and `isolation` have no primary source found yet (course).
- Beginner path has no end-to-end capstone; known gaps listed in `CURRICULUM.md` (course).
- Closed 2026-10-27: `CURRICULUM.md` scoping sources cited RFC 8446 for TLS 1.3; RFC 9846 obsoletes it (found in
  web-request research). Update the scoping table in the next mode B pass (course).

## Session log

- 2026-10-27 setup: skill and state docs created; course not initialized.
- 2026-10-27 A course: not initialized → initialized; app audited, empty graph created, placement and budgets
  proposed, empty leftover `src/app/learn/` folders (untracked, no files) removed.
- 2026-10-27 B course: curriculum empty → 119 chapters planned; `check` ok, `next` → web-request.
- 2026-10-27 skill: `course.mjs check` now enforces path closure and rejects duplicate path/prerequisite entries
  (closes the open issue); curriculum still passes.
- 2026-10-27 C web-request: planned → authored; spec written, two independent spec reviews, all findings fixed.
- 2026-10-27 C web-request: authored → reviewed; /learn and /learn/web-request built, 95 unit tests, 56/56 browser
  checks, three implementation reviews with findings fixed; not marked verified (see Open issues).
- 2026-10-27 C web-request: final review (fresh reviewer) → 4 should-fix + 6 notes fixed; review of those fixes →
  2 should-fix + 3 notes fixed, 2 accepted; Vercel build fix (`.vercelignore`); status stays reviewed.
- 2026-10-27 C web-request: reviewed → verified. Fresh review of the merged tree (1 should-fix: the predict panel's
  answer was on screen; 5 notes) and a fresh review of that fix (4 notes) → all fixed or accepted; 96 unit tests,
  69/69 browser checks, Lighthouse 99/100; RFC 8446 → 9846 in the curriculum scoping table; RFC 9846 published text
  still unreachable (limit recorded).
  Format only: each review finding in web-request.md now sits on one line, so `check` reads its outcome; the
  screen-reader limit moved from Evidence (not a required check) to Open questions. No finding text changed.
- 2026-10-27 C client-server: planned → authored. Spec `chapters/client-server.md`: 4 objectives, 14 questions,
  worked example (POST duplicate on a late response; PUT idempotent), visual spec (stepper over a 24-case discrete
  model), 5 retrieval questions, exercise, 10 sources (9 read: RFC 9110, 9112, 6265 in the HTTP WG's published
  rendering; MDN; PostgreSQL docs; 1 search-only lead with supports: none). Stopped at step 6: integration not
  authorized.
