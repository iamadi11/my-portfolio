# Course state

State: initialized
Updated: 2026-10-29

The system design course is built only through the `system-design-educator` skill
(`.claude/skills/system-design-educator/`). This file and `CURRICULUM.md` are its memory; see the skill's
`references/course-state.md` for their formats.

## Current unit

none

## Next action

Full-curriculum expansion implemented: 119 routes, including the original 20 specialized lessons and 99 new compact chapters. Next quality work is independent chapter-by-chapter teaching review, accessibility/Lighthouse and learner testing; no next chapter is missing. See EXPANSION_QA.md for actual validation and limits, INDEPENDENT_LEARNING_REVIEW.md for focused model-review dispositions, and the portfolio audit for pinned repo evidence. Keep statuses implemented until the remaining evidence exists.

## Decisions

- 2026-10-29 Follow-up: improve the entire learning journey and audit portfolio claims against all five featured public repos. Strengthened the educator skill first with mechanism correspondence, legal frozen frames, prediction/transfer, terms, exact quantities, fault semantics and review gates. The context helper now prints bounded summaries instead of every implemented row; its regression tests cover that token-saving behavior. Bytes are a proxy, not measured model tokens.
- 2026-10-29 All 119 curriculum ids have routes and previous/next/prerequisite links. New blueprints are server-selected; 77 reusable bounded mechanism models generate event traces, film state and lab verdicts. Eleven case studies plus capstone include authored read/write paths, explicit workload arithmetic, concrete faults and a self-assessed design challenge. Source records live in academy-sources.json; no company workload or benchmark is invented.
- 2026-10-29 Course map adds cross-path search, saved path and resume. Activity is viewed / practiced / recall checked, never inferred mastery; the new academy labs/quizzes record practice/recall while legacy specialized labs retain their original assessment behavior. Existing local watched flags remain optional activity history. Shared films gain actual settled-frame stepping, explicit static mode, state summaries and memoized device geometry. Arimo and course-only themes are preserved.
- 2026-10-29 Focused independent source/model review found and drove repairs for unrelated model substitutions, fanout/coalescing, false loss labels, quantity clamping, watermark semantics, outbox atomicity, step/play rewind and case narration packets. Report closes those findings within its narrow scope, without accepting all119 chapters or claiming learner outcomes. Three legacy chapter-spec standard warnings remain visible.


- 2026-10-29 Owner requests a batch, beginner-first 3D explainers, little text, readable font, dark mode and token savings. This supersedes the earlier one-unit-per-invocation limit. Skill entry shortened, reference loading selective, read-only context helper added. No token-usage percentage is claimed; entry size is measured in bytes.
- 2026-10-29 Reuse one isometric 3D scene/player and server-selected film records for all 20 available chapters. Five-second beats are playback timing, never network measurements. New semantic labs use tested pure functions. Preserve existing Learn details/labs/quizzes; primary sources live on /learn/sources. No new runtime dependencies or font requests.
- 2026-10-29 Preserve Arimo with readable sentence-case course typography. Course-only light/dark/system preference and watched-film progress use localStorage with graceful storage failure. Portfolio theme remains unchanged.
- 2026-10-29 Built 20/119 chapters; all remain implemented. Production build, 377 model/content tests and 39 helper tests pass; browser evidence and remaining accessibility/review checks are recorded separately. No independent review or world-class certification claimed.

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
- 2026-10-28 Owner: the 120 kB first-load budget is the portfolio's (`/`, CLAUDE.md §10.4), not the course's.
  Course budget: `/learn` routes ≤ 150 kB first-load and ≤ 400 kB more fetched on demand while the page is
  scrolled (figures and their libraries in their own lazy chunks); Lighthouse ≥ 90 still binds
  (`tests/browser/js-budget.cjs`). Supersedes the 2026-10-27 "≤ 120 kB per course route" proposal.
- 2026-10-28 Owner: install what anatomy needs. Vendored `wheresryan22/anatomy` @ 1482e84 (MIT) as the `anatomy`
  skill (`.claude/skills/anatomy/VENDORED.md`); added `esbuild` (dev) for its scripts; its tests 290/290.
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

- 2026-10-27 Visual-first standard (owner request): chapters are planned as a storyboard and asset plan before the
  explanation; models before prose; a rendered-page review answers five visual questions. Specs declare
  `Standard: visual-first`; `course.mjs check` enforces the asset plan structure (references `visual-design.md`,
  `visual-science.md`, renamed `scientific-modeling.md` on 2026-10-28). Older specs warn until audited.
- 2026-10-28 Owner: chapters must be Anatomy machines, not text with a diagram. Preference: Anatomy turn-3D
  when a part must move in depth, otherwise Anatomy isometric 3D (a solid object). Flat diagrams need a written
  exception. Fidelity ledger on every figure (computed, scaled, assumed, faked). `Standard: anatomy-3d` is what
  `check` enforces for new specs; `visual-first` and `legacy` warn. No Three.js, Spline, GSAP or Manim.
- 2026-10-28 Experience-first standard, earlier the same day: six stages (concept decomposition → storyboard → build
  the experience → scientific explanation → tests → independent review), nine interaction patterns, motion from
  model events, a ten-item model document, and the visual review rubric. Its "2D by default" line is withdrawn
  by the Anatomy decision above. `ip-and-ports` was lowered to `researched` under that pass and later reviewed.
## Open issues

- 2026-10-29 Current batch: independent rendered-page review, manual screen-reader verification, system reduced-motion emulation, automated axe, Lighthouse and legacy browser suites remain not run. The production browser smoke checks do not substitute for these. Three historical spec-standard warnings remain (web-request, client-server, ip-and-ports). See VISUAL_COURSE_QA.md.

- `client-server`: implemented in `/learn` on the owner's authorization (2026-10-27); two independent reviews ran
  (implementation, then a check of its fixes). No real screen reader was used (DOM/ARIA only); a manual checklist
  is in `SCREEN_READER_CHECKLIST.md`. The browser suites are now in the repo (`tests/browser/`, PR #22).
- `web-request`, `client-server` and `ip-and-ports` are `implemented`. The bench is gone. The rail, the packet
  ride and the demux lookup spot are not covered by the old reviews. Each still needs Verify the animation, then
  a fresh review, before it can rise.
- The Idempotency-Key field is an IETF Internet-Draft read in the WG's editor's copy (@ a2cd12a); its published
  draft number and status are unchecked (datatracker unreachable) (client-server).
- RFC 6265 (cookies) may have been obsoleted by the 6265bis revision (search only: approved, no published number
  found); `client-server` uses only the basic Set-Cookie → Cookie mechanism (client-server).

- `web-request` was lowered from `verified` to `implemented` on 2026-10-28. The bench that replaced the box
  diagram did not teach the wait (the carriage only changed stations). It was replaced the same day by a time
  rail whose marker position is the model's running sum. On 2026-10-28 the rail, the packet, and the demux
  result were checked in the browser (see the session log). Reduced motion and Lighthouse were not re-run.
  `client-server` and `ip-and-ports` were lowered to `implemented` the same day because their figures changed.
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
- 2026-10-27 owner: authorized merging the web-request fixes and implementing client-server. PR #19 merged
  (dceb551; production deployment recorded as success on GitHub).
- 2026-10-27 C client-server: authored → implemented → tested → reviewed. /learn/client-server built (af07b7c):
  page, Fig. 1 ExchangeStepper, client-server-model with an Idempotency-Key case (spec revised; draft read in the
  WG's editor's copy). Implementation review: 1 blocking (late-case order), 3 should-fix, 11 notes → fixed or
  accepted (607f1d5). Fresh check of the fixes: 2 should-fix (label crossing lanes, this state file), 3 notes →
  fixed. 157 unit tests, 48/48 + 69/69 browser checks, Lighthouse 100.
- 2026-10-27 C client-server: reviewed → verified. Final fresh check of the last fixes (6b5f8d5): no blocking or
  should-fix finding; its 3 notes fixed (still-busy line clear of the boxes, order-number test, evidence names its
  build). 159 unit tests, 48/48 + 69/69 browser checks, Lighthouse 100/99 mobile, first-load JS 112 kB.
- 2026-10-27 release: PR #20 merged (71fd4d8; production deployment recorded as success on GitHub). Report:
  `SYSTEM_DESIGN_COURSE_IMPLEMENTATION_REPORT_2026-10-28.md`.
- 2026-10-27 maintenance: PR #22 merged (f12c089): browser suites in the repo, screen-reader checklist, source
  re-checks, critters kept. Independent review: no blocking; 3 should-fix fixed (af6897f) and re-verified.
- 2026-10-27 skill: visual-first upgrade (stages A–F, asset plan, visual review, structural checks; 29 course tests).
- 2026-10-27 C ip-and-ports (visual-first pilot): planned → tested. Storyboard and asset plan first (A1 drawing,
  A2 demultiplexing simulation, A3 datagram timeline); models and tests, then figures, then text. Route
  `/learn/ip-and-ports`, 113 kB first-load JS; browser suite 55/55; regression 69/69 and 48/48.
- 2026-10-28 C ip-and-ports: tested → reviewed → verified. Three independent reviews (pilot; fixes; final fixes):
  1 + 1 blocking and 10 + 2 + 2 should-fix findings fixed; adversarial `check` wordings accepted (structure-only
  tool). 194 unit tests, browser 64/64 + 69/69 + 48/48, 116.3 kB first-load JS, course tests 35/35.
- 2026-10-28 Phase 1: PR #23 merged (main a0a6fd8 = af288aa's tree). Skill overhaul on
  `claude/visual-first-learning-skill`; ip-and-ports verified → researched under the new standard.
- 2026-10-28 ip-and-ports rebuilt visual-first (steps 2–7): concept decomposition and storyboard; Fig. 1 explore
  (no script), Fig. 2 packet travels through the host's checks, Fig. 3 a network of four routers (route change,
  link failure, congestion; `network-model.ts`, 37 tests); kit `useClock`, `Transport`, `NearViewport`,
  `verdict`. 213 unit tests, browser 72/72 + 69/69 + 48/48 + 5/5, 109.5 kB first-load JS (was 116.3), Lighthouse
  mobile 99 / desktop 100. Status researched → tested.
- 2026-10-28 Fourth review (fresh subagent) of faa5b85: 9 should-fix, 9 notes, no rejects; all fixed or accepted
  with reasons (Fig. 2 stage list after the run ends, rules in "Ran it?" disclosures, Fig. 3 key, numbered drops,
  "Why:" line, Previous announcement, clock holds offscreen, `check` reads one review block). Owner: course JS
  budget split from `/`; anatomy vendored. Browser 77/77 + 69/69 + 48/48 + 9/9, Lighthouse 99/100. Status
  tested → reviewed.
- 2026-10-28 skill: anatomy-3d standard (isometric machine by default, turn-3D when depth motion is the mechanism,
  fidelity ledger, fresher path). `course.mjs` warns on visual-first and legacy. 37/37 skill tests.
- 2026-10-28 D web-request: box diagram replaced by the sorting bench (`bench-geometry.ts`, `Bench.tsx`); journey
  prose cut to station names. Status verified → implemented. Carriage motion checked in the browser. client-server
  and ip-and-ports not rebuilt this unit.
- 2026-10-28 skill: animation sense gate. Research the mechanism and name the model field before geometry.
  `course.mjs` requires `## Animation sense` for an anatomy-3d figure at implemented, and `animation sense: pass`
  at tested. The sorting bench is deleted. web-request is a time rail (`TimeRail.tsx`). client-server draws a
  packet whose x is the current event. ip-and-ports lookup stops on the socket table, then the result stops on
  the matching pin. client-server and ip-and-ports lowered to implemented. Browser verification of the new
  motion not recorded yet.
- 2026-10-28 sources: learner-facing lists leave the chapter pages for `/learn/sources`, grouped by chapter.
  Inline marks link there. The spec `## Sources` stays the author record. Skill: research-and-sources.md,
  chapter-workflow.md, visual-review.md.
- 2026-10-29 api-design wired into the graph, the route list, and the sources page. Status implemented. Utilisation now links to it. Browser, after Reset: the body is with the caller, place caller, translate(0.00 0.00). Next seats it, place accepted, translate(300.83 122.17), status 200. Lab fig-api-h still says press Run and has no step. Quiz answers stay closed. GET only, and a current representation for the matching call, are assumptions. item is a teaching label. Not verified. No animation sense pass. Current unit stays dns. The chapter loop stops here.
- 2026-10-29 estimation wired into the graph, the route list, and the sources page. Status implemented. Latency numbers now links to it, and it links to utilisation. The asset was type simulation with an anatomy-iso render, so check rejected it; the type is now 3d. The pattern line now includes step and manipulate, which the figure already has. Browser: Reset shows 0 plates on each pan; Next shows 1 of 2, 1 of 8, and 1 of 5; the finished stacks are 2, 8, and 5 plates, for 2 requests per second, 86,400,000 bytes stored, and 1,000 bytes per second. Lab fig-est-h still says press Run and has no step. Quiz answers stay closed. The inputs are assumed. A day is 86,400 seconds by definition. Not verified. No animation sense pass. Current unit stays dns.
- 2026-10-29 http-versions wired into the graph, the route list, and the sources page. Status implemented. UDP and QUIC now links to it, and it links to cloud networking. Browser, HTTP/3: three responses leave; step 4 the middle response is held at translate(102.27 110.60) while the other two stay on the wire; step 6 the earliest and the latest are delivered and one response stays held. Lab fig-hver-h still says press Run and has no step. Quiz answers stay closed. The lost carrier and the tick lengths are assumed. Not verified. No animation sense pass. Current unit stays dns.
- 2026-10-29 api-design started on its own files. Prerequisite http is implemented. It must not edit the curriculum, course state, or the route list. Current unit stays dns.
- 2026-10-29 utilisation-queueing wired into the graph, the route list, and the sources page. Status implemented. The asset pattern was predict only, so check rejected it; the spec now says predict step, which is the Learn transport. Browser, after a reload: the row starts at 1 job, mean waiting 0.5, mean time 0.2 s, utilisation 0.5, and 5 per second times 0.2 s equals 1. Next puts 8 jobs in the row, mean waiting 8.1, mean time 1 s, utilisation 0.9, and 9 per second times 1 s equals 9. Lab fig-queue-h still says press Run and has no step. Quiz answers stay closed. The rates are assumed. Little's proof was not in the fetched page. Not verified. No animation sense pass. Current unit stays dns.
- 2026-10-29 estimation started on its own files. Prerequisite latency-numbers is implemented. It must not edit the curriculum, course state, or the route list. Current unit stays dns.
- 2026-10-29 latency-numbers wired into the graph, the route list, and the sources page. Status implemented. Percentiles now links to it. Browser, after Reset: left post magnitude -1; L1 0.5 ns at magnitude -0.301; main memory 100 ns at magnitude 2, translate(107.60 47.01); SSD 16,000 ns at magnitude 4.204, labelled the script constant; 2K send 20,000 ns at 4.301; 1MB memory read at 5.398; disk seek 8,000,000 ns at magnitude 6.903, translate(371.40 162.26), 4.903 orders farther than main memory; 1MB disk read at 7.301; US–Europe packet 150 ms at magnitude 8.176, the farthest stop. Lab fig-latnum-h still says press Run and has no step. Quiz answers stay closed. Not verified. No animation sense pass. Current unit stays dns.
- 2026-10-29 utilisation-queueing started on its own files. Prerequisite percentiles is implemented. It must not edit the curriculum, course state, or the route list. Current unit stays dns.
- 2026-10-29 cloud-networking wired into the graph, the route list, and the sources page. Status implemented. Browser: step 1 the body is outside, aimed at 192.168.2.10, place outside, translate(249.81 64.77); step 2 place is stopped at the boundary, translate(225.68 79.22), and the line says it does not arrive. The screen move between those two poses is small. Lab fig-vpc-h still says press Run and has no step. Quiz answers stay closed. No vendor VPC doc. Not verified. No animation sense pass. Current unit stays dns.
- 2026-10-29 http-versions started on its own files. Prerequisites http and udp-quic are implemented. It must not edit the curriculum, course state, or the route list. Current unit stays dns.
- 2026-10-29 udp-quic wired into the graph, the route list, and the sources page. Status implemented. HTTP now links to it. Browser: step 1 earlier stream on the wire at translate(134.38 17.40), later at the sender; step 2 earlier held at translate(209.26 -9.82); step 3 later on the wire while earlier stays held; step 4 later delivered at translate(362.62 140.57) and earlier still held. Lab fig-quic-h still says press Run and has no step. Quiz answers stay closed. Loss at 2 ticks, gap 4, flight 6 are assumed. Not verified. No animation sense pass. Current unit stays dns.
- 2026-10-29 Three more workers started on separate files: udp-quic, latency-numbers, and cloud-networking. Prerequisites tcp, tls, latency-throughput, ip-and-ports, and percentiles are implemented. They must not edit the curriculum, course state, or the route list. Current unit stays dns.
- 2026-10-29 percentiles wired into the graph, the route list, and the sources page. Status implemented. Latency and throughput now links to it. Browser: the finger starts at rank 0, translate(10.46 38.61); Next stops it at rank 50.5, the median, 20 ms, translate(316.89 172.48), with the tall pin still ahead; the next stop is rank 99.99, 198.4 ms, translate(617.18 303.68), one sample above it. Lab fig-pct-h still says press Run and has no step. Quiz answers stay closed. Pin durations are assumed. Not verified. No animation sense pass. Current unit stays dns.
- 2026-10-29 tls wired into the graph, the route list, and the sources page. Status implemented. TCP now links to it, and it links to HTTP. Browser: step 1 the client's hello leaves unsealed; step 2 it arrives readable; steps 3–4 the server hello leaves open and arrives with the name checked; steps 5–6 the finished step leaves and arrives, and the application body has not left; step 7 the application body is on the wire, sealed, and the plaintext is not inside the receiver; step 8 the sealed body is at the receiver and the plaintext is inside. Lab fig-tls-h still says press Run and has no step. Quiz answers stay closed. Not verified. No animation sense pass. Current unit stays dns.
- 2026-10-29 http wired into the graph, the route list, and the sources page. Status implemented. Browser: step 1 the GET request is at the client and the slot holds a representation; step 2 the request is at the server, the plate stays, status 200; step 3 the response is at the client, status 200, stored representation did not change. Message place client, role response, status 200, changed false. Lab fig-http-h still says press Run and has no step. Quiz answers stay closed. Not verified. No animation sense pass. Current unit stays dns.
- 2026-10-29 Three more workers started on separate files: tls, http, and percentiles. Prerequisites tcp and latency-throughput are implemented. They must not edit the curriculum, course state, or the route list. Current unit stays dns.
- 2026-10-29 tcp wired into the graph, the route list, and the sources page. Status implemented. DNS now links to it. Browser: segment 3 falls at step 6; steps 8 and 10 hold 4 and then 4 and 5 while the application has read 2 of 5; step 12 the gap fills and the application has read 5 of 5 through byte 499. Lab fig-tcp-h still says press Run and has no step. 38 solids. The 26-tick resend is assumed; RFC 6298 was not read. Not verified. No animation sense pass. Current unit stays dns.
- 2026-10-28 latency-throughput wired into the graph, the route list, and the sources page. Status implemented. Browser: Learn tray count went 0, 1, 2, 3, then 4. The end line says the first piece finishes at 250 ms. Lab fig-lat-h still says press Run and has no step. 21 solids. Not verified. No animation sense pass. Current unit stays dns.
- 2026-10-28 dns figure checked in the browser after the rebuild. 62 solids. The body moved through five places and returned to the computer on step 6, when the line says the address comes back. Servers asked: 3. Lab fig-dns-h still says press Run and has no step. Screenshot timed out. The racks are still unnamed, so a referral is still only in the step line. No animation sense pass.
- 2026-10-28 Owner: keep producing chapters without waiting between turns. Three workers started on separate files. One repairs the dns figure. One builds tcp. One builds latency-throughput. They must not edit the curriculum, course state, or the route list. Those get wired after the files exist. No animation sense pass.
- 2026-10-28 C dns: planned → implemented. RFC 1034 read from rfc-editor.org (§3.7, §4.1, §5.3.3). Model tests 8/8. Learn walk: the body moved from the computer to the resolver, the root, the com server, the example.com server, then back. Step 5 names 203.0.113.10. Step 6 says the address comes back. Servers asked: 3. Lab fig-dns-h still says press Run and has no step. Not verified. No animation sense pass. The racks are still plain. 115 chapters remain unwritten.
- 2026-10-28 ip-and-ports network: station names and link delays are off the metal. The sender is a computer (case, screen, keys). Four racks each have a vent. The host is taller, with two vents, and its screen lights once a datagram has arrived. The failed link is a gap; "× failed" sits in the open plate. UDP end still reads 1 4 5 with ×2 and ×3 beside the upper rack. TCP end still reads 1 2 3 4 5, arrival 1 4 5 2 3. 26 solids. Lab figure stays hidden on the Learn tab. Not verified. No animation sense pass.
- 2026-10-28 ip-and-ports Learn adds a second watch, same model, TCP, link failed. At the end the application has read 1 2 3 4 5; arrival order is 1 4 5 2 3; tick 14 says the sender resends 2; tick 23 says the application reads 3, then 4 after a 10-tick wait, then 5 after an 8-tick wait. UDP watch still reads 1 4 5. Lab fig3-h still says press Run and has no tick and no "has read". Not verified. No animation sense pass. Chapter 4 not started.
- 2026-10-28 ip-and-ports Learn plays UDP with the link failed. At tick 6 the line reads "3 reaches R2; R2 cannot forward 3: it is dropped." The drawing shows × failed on that link and ×2 and ×3 staying beside R2. The application has read 1. The lab figure stays fig3-h and still waits for Run. TCP resend is not on this watched run. Not world class.
- 2026-10-28 ip-and-ports Learn plays one open TCP connection into the server. 25 solids: feet, two lanes, pins in the sockets a program owns, a separate case for the other machine. The body moved from translate(91.15 28.45) at the address check to translate(117.23 -23.96) at the result. The line then reads that the web server receives it on connection 1, because the other connection has a different source port. The lab figure id stays fig2-h and still waits for Run. Not world class.
- 2026-10-28 client-server Learn runs POST with the response lost. At the lost step the body sits off the cable and the line reads "The body is off the wire. The client cannot tell whether the server did the work." The model still records one new order. ip-and-ports: the well names were piled on the cutaway and are off the metal. One packet line remains. Step 1 reads "Address. The destination address 203.0.113.10 is this server's." Goals on all three chapters sit after the figure. Chapter 3 Learn is still the host you click; the packet run is the lab. Not world class.
- 2026-10-28 fresher pass on the rendered chapter 1. The ruler and the "drum means lookup" caption failed that pass, and the skill now rejects a caption that translates shapes. The figure is a computer, a smaller machine the mark visits before any cable, then a cable to the server. At the lookup the readout is "Looking up the hostname. The mark is at the smaller machine. 30 ms for this wait. 30 of 200 ms so far." At the end the screen is lit and the readout is "Request and server. 90 ms for this wait. 200 of 200 ms so far." The objectives list now sits after the figure. Not world class: the cover on the cable does not teach TLS, and chapter 2's Learn run is only the GET that arrives.
- 2026-10-28 web-request: stations differ without painted words. Drum is the lookup, two posts the handshake, a collar the secure session, a tall housing the server. At the last step the readout is "Request and server, 90 ms. Carriage at 200 ms of 200 ms." client-server: the painted browser/server/GET words are off the metal. Eight solids: keys and a screen, a cable, a cabinet with two vents, one body. The step line names the event. ip-and-ports not rebuilt. No animation sense pass.
- 2026-10-28 skill: craft-bar.md. Open Anatomy ("the object is the explanation") and ui-ux-pro-max (reduced motion, one or two moving parts, focus not covered) before a figure. Do not take a palette, GSAP, or dimensional-drawing's empty slots. Words painted on slabs are a reject. web-request Learn is a bench: 22 solids, a scale, end stops, a carriage. At the hostname step the readout is "DNS lookup, 30 ms. Carriage at 30 ms of 200 ms." Not an Anatomy figure yet. Chapters 2 and 3 not rebuilt.
- 2026-10-28 The pictures did not say the chapter. Names are now on the parts: the rail reads DNS, TCP, TLS, request; the exchange reads browser, server, GET; the host reads name, address, TCP 443, UDP 8125, 9000 empty. Headers, cookies, idempotency, and what TCP does that UDP does not are still text. No animation sense pass.
- 2026-10-28 D ip-and-ports: Fig. 2 is a cutaway. The packet body rests in the well the current stage reads (moved translate(-96.87 -94.05) to translate(-56.73 -85.17) on the protocol step; 12 solids). Fig. 3 is six machines and a body per datagram. Link R2–R4 fails, UDP, to the end: solids 8, dropped marks ×2 ×3, one "× failed", result "Some missing." Models unchanged. Standard stays visual-first. No animation sense pass. Not re-reviewed.
- 2026-10-28 skill: a wait, a message, and a lookup are Anatomy isometric solids. A CSS bar or a circle on a line is a reject. web-request Learn is a carriage whose position is elapsed milliseconds. client-server Learn is a body on a wire. ip-and-ports Learn is a cutaway host; the selected part is drawn heavy. Demux and the network lab are still the previous drawings. Not re-reviewed. No `animation sense: pass`.
- 2026-10-28 skill: three tabs are mandatory from `implemented` (`references/three-tabs.md`; `course.mjs`
  requires `## Tabs`). web-request, client-server and ip-and-ports each have Learn, Interactive Lab, and Quiz.
  Browser: repeat visit on the rail is 90 ms and the marker ends at 100%; a lost GET sits at x 150; TCP to
  port 9000 ends as "Nobody receives it" with a reset. Quiz answers stay closed until opened. Reduced motion,
  Lighthouse, and a fresh review were not run. No new chapter.

- 2026-10-29 Visual-course batch: optimized educator skill first, then 20 chapter-specific films, four new source-backed API lessons, shared player/experiments, course theme and catalog filters. Passed build/type/lint, 377 unit tests, 39 helper tests, graph/skill validators and recorded production UI checks. All statuses implemented; follow-up review still needed.
