# Full-course expansion — 29 October 2026

Scope: improve the educator skill first, use it to build the remaining 99 chapters and improve the shared learning journey across all 119, then audit the five featured portfolio projects against public source. Work stays on `main`. Implementation coverage is not independent teaching acceptance.

## Delivered

- All 119 curriculum ids resolve, from `/learn/web-request` through `/learn/capstone`; the index, sources, sitemap, prerequisites and ordered previous/next links cover the graph. The original 20 specialized lessons/labs remain available.
- New compact, hand-authored question/rule/misconception/boundary/source records select 77 bounded mechanism models. Reuse is at the rendering and mechanism level, not a renamed generic packet movie. Foreign keys, inverted postings, MVCC, upload publication, canaries, event-time windows, replicated-log commitment and file conflicts have distinct state machines.
- The model produces the event trace, visible state, metrics and lab verdict. A prediction is required before results; quiz scenarios change an input and require commitment before feedback. Terms and prerequisite links precede new films. Eleven case studies and capstone include an authored whole-design walkthrough, illustrative workload arithmetic, concrete failure and a self-assessed design challenge.
- Manual stepping seeks an actual settled event frame, so Play does not rewind. Static mode, system reduced-motion response, transcript, HTML state summaries, offscreen/hidden playback control and memoized device geometry share one player. Numeric quantities retain their full count even when object marks are abbreviated.
- `/learn` adds cross-path search, saved path, resume and separate viewed/practiced/recall-checked activity. New academy assessments record those signals; legacy specialized assessments retain their existing behavior. Device-local activity never claims mastery. Arimo and persistent course-only light/dark/system themes remain.
- Skill context output defaults to 1,220 UTF-8 bytes in this state; requested chapters print only their own blueprint and paths. This is a measured byte proxy, not an invented token-reduction percentage. New context tests guard against accidentally dumping all implemented rows.

## Checks actually performed

| Check | Result and scope |
| --- | --- |
| Production build | Pass: `NEXT_DIST_DIR=.next-expansion-build npm run build`; 131 static pages generated, including all course paths. Separate dev/build directories prevent cache collision. |
| TypeScript / ESLint | Pass: `npx tsc --noEmit`, changed-source ESLint and production lint/type gates. The old `npm run lint` points to removed `next lint`; direct ESLint was used. |
| Unit tests | Pass: 469 tests in 23 files. Includes every permitted input of all 77 mechanisms, selectable verdicts, finite state, endpoints, determinism and misconception invariants. Also checks outbox atomic frozen frames, step/play continuation, coverage and portfolio motion lifecycle. |
| Skill helper tests | Pass: existing 39 course-validator tests plus 2 context tests. Graph/skill checks pass with three explicitly retained legacy-standard warnings (`web-request`, `client-server`, `ip-and-ports`). |
| Routes | Pass: read-only HTTP check of all 119 chapter pages plus `/`, `/learn`, `/learn/sources`, `/sitemap.xml` (123 routes). Chapter pages include scene controls and journey navigation. Unknown chapter returns 404. |
| Browser | Production pages inspected through the in-app browser. Checked catalog search finding capstone across the beginner filter, persisted appearance/resume, final-chapter links, keyboard tab ArrowRight, prediction gating, foreign-key rejection with zero orphan rows, quiz commitment/feedback and queue step → Play continuity. |
| Responsive | `/` and capstone have no horizontal page overflow at 375×812, 402×874, 768×1024, 1280×800, 1440×900 and 1920×1080. Mobile case geometry, captions, state summaries and transport inspected. Portfolio navigation targets measured at least 44×44. This is representative responsive QA, not every chapter at every size. |
| Motion | Browser explicit static-step mode works. Pure driver tests cover dynamic motion preference, canceling animation frames, whole-sheet still camera, still resize handling, print after a mobile final frame, restoration and listener/class cleanup. Actual OS preference switching/print dialog was not exercised through the browser capability. |
| Focused independent review | `INDEPENDENT_LEARNING_REVIEW.md` records findings and follow-up probes. Reported blocking/should-fix issues were resolved within its narrow source/model scope. This is not full-course acceptance. |

## Script budgets

Next reports `/` at 110 kB first-load JS, `/learn` at 113 kB and the generated chapter route at 143 kB. A read-only local HTTP measurement summed script response bodies referenced by initial HTML, excluding `nomodule` polyfills that modern browsers do not fetch. This is a useful response-size cross-check, **not** the browser/CDP network meter or a claim about all later downloads. The portfolio remains below its 120,000-byte gate and representative course routes below 150,000 bytes. No runtime dependencies or fonts were added. Exact final response sizes are recorded below after the last build.

## Limits and recorded deviations

Chapters remain `implemented`. Full chapter-by-chapter independent teaching/source review, physical-device checks, a real screen-reader session, axe and Lighthouse were not performed. The selected browser exposes UI/viewport inspection, not a Lighthouse runner or OS preference emulation; no score or WCAG certification is inferred from a build. This records the release-gate deviation under CLAUDE §4. Current evidence is bounded model correctness, representative rendered/keyboard checks and script-response sizes. A measured learning outcome still requires fresher learner testing. These short films introduce one mechanism; they are not comprehensive protocol implementations, benchmarks or production-design certification.

During rapid development, a stale dev client produced a DesignWorksheet hydration mismatch after its props changed. The clean production build renders the challenge consistently; no production-origin hydration error was observed. Historical dev console entries were not counted as production errors.

## Portfolio

See `../portfolio-audit-2026-10-29.md` for pinned revisions and public-source limitations. Corrected Spatial to frame drops and optional memory; changed Sidecar to verifiable runtime-prototype behavior without an achieved size/build-pipeline claim. Snapshot labels no longer promise live measurements. Preserved owner-confirmed career facts. Fixed motion lifecycle, whole-sheet still camera and target sizes in the existing drawing-set style. External repositories were inspected, not modified.

Final initial-script response check (modern-browser script tags, gzip accepted, response headers excluded): `/` 115,690 bytes; `/learn` 115,415; `/learn/web-request` 123,152; `/learn/rest` and `/learn/capstone` 144,695 each. Final HTTP route rerun: 123 successful routes, all119 chapters, unknown chapter404. Final production-origin browser error filter returned no entries.
