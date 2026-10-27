# System Design Course: implementation report

Date of work: 2026-10-27 (file named 2026-10-28 as requested) · Repository: `iamadi11/my-portfolio` · Branch:
`claude/trusting-wright-s27b5f`

## 1. Executive summary

- **Chapter 1 (`web-request`) fixes are merged and deployed.**
  - PR [#19](https://github.com/iamadi11/my-portfolio/pull/19), merge commit `dceb551`.
  - GitHub records a successful **Production** deployment of `dceb551` (deployment 7367234156).
  - The prediction-answer leak is fixed in main.
- **Chapter 2 (`client-server`) is implemented, independently reviewed, verified, merged and deployed.**
  - Route: `/learn/client-server`.
  - PR [#20](https://github.com/iamadi11/my-portfolio/pull/20), merge commit `71fd4d8`.
  - GitHub records a successful **Production** deployment of `71fd4d8` (deployment 7368508004).
- **Three independent reviews ran on Chapter 2.** Each was a fresh agent that had not worked on the chapter:
  - the implementation review: 1 blocking, 3 should-fix, 11 notes;
  - a check of those fixes: 2 should-fix, 3 notes;
  - a final check: 0 blocking, 0 should-fix, 3 notes.
  - Every blocking and should-fix finding is fixed.
- **All automated gates pass on the final code.** See §8 for exact counts.
- **Not performed:**
  - a real screen-reader test;
  - opening the deployed site: the container's network proxy refuses `*.vercel.app` and the custom domain, so deployment status comes from GitHub's deployment records;
  - reading the published RFC/draft web pages, which are unreachable. Published-text renderings and the working group's own sources were read instead.

## 2. Initial repository state

| Item | Supplied status report | Actual (checked before any change) |
| --- | --- | --- |
| `main` / production | `75b2b6c` | `75b2b6c` ✓ |
| Feature branch | `claude/trusting-wright-s27b5f` | exists ✓ |
| Feature head | `162c645` | `162c645` ✓ (local and remote) |
| Open PRs | not stated | none; PR #18 already merged |
| Working tree | not stated | clean |
| `AGENTS.md` | asked to read | **does not exist**; project rules are in `CLAUDE.md` and the skill |

The branch was 4 commits ahead of main and 0 behind:
- `7ebbf34`: curriculum scoping, RFC 8446 → 9846 (docs);
- `f441d44`: Chapter 1 prediction fix (code and tests);
- `1bdc3fd`: `predictAt`, refreshed evidence, Chapter 1 verified;
- `162c645`: Chapter 2 specification only (docs).

There were no concurrent changes, conflicts or unrelated commits.

## 3. Chapter 1 changes merged

PR [#19](https://github.com/iamadi11/my-portfolio/pull/19), merged with a merge commit (no squash, no rebase, no
force-push).
- Merge commit: `dceb551`.
- Parents: `75b2b6c` (previous main) and `162c645` (tested head).
- The merged tree is identical to `162c645`.

| Commit | Change |
| --- | --- |
| `7ebbf34` | `CURRICULUM.md` scoping table cites RFC 9846 instead of 8446, with a note on the version change and the unverified publication date |
| `f441d44` | Fig. 1 "Predict, then run" asks about an 80 ms round trip (answer 130 ms, not on screen before Run). Also: negative guesses refused before rounding; "(after any redirects)" added to the Fetch timing sentence; Fetch clamp-step question recorded |
| `1bdc3fd` | `predictAt()` in the model, tested against every number the figure shows at the defaults; evidence refreshed; Chapter 1 marked verified |
| `162c645` | Chapter 2 spec (docs only) |

Main after the merge contains no Chapter 2 implementation: the only Chapter 2 file was the spec. This was checked with `git ls-tree` and a diff.

Checks run on `162c645` before the merge:
- 96/96 unit tests;
- `tsc`, lint and Prettier clean;
- `course.mjs check` ok; course tests 23/23;
- fallow pass;
- build: /learn/web-request 111 kB;
- browser suite 69/69;
- Vercel preview: success.

## 4. Chapter 1 deployment state

- **Merge:** `dceb551` on `main` (PR #19).
- **Production deployment:** GitHub deployment 7367234156, environment "Production", status **success** (2026-10-27T18:39:14Z). Vercel commit status: "Deployment has completed".
- **Not verified:** that the live page serves the fix. The deployed hosts cannot be reached from this container.

## 5. Chapter 2 implementation

Route: **`/learn/client-server`** (static, prerendered). It follows the spec's teaching sequence:
1. **Parts:** client and server as roles; origin server and intermediary; exchange; method and target; header field and body; stateless; cookie; timeout; safe and idempotent methods.
2. **The problem:** "Network error" after "Place order".
3. **The first guess and where it breaks:** roles; the three causes of no response, under the stated "completely or not at all" assumption.
4. **What actually travels:** the RFC 9110 §3.9 example.
5. **The mechanism**, in five subsections, each followed by its retrieval question:
   - roles (Q1);
   - messages (Q2);
   - stateless and cookies (Q3);
   - no response (Q4);
   - retrying, with `PUT` qualified: intended effect, correct server behaviour, concurrent writers (Q5).
6. **Fig. 1** (interactive).
7. **Idempotency keys:** replay once the original has finished, `409 Conflict` while it is in progress. Presented as an IETF draft that works only if the server implements it.
8. **Three layers kept apart:** HTTP semantics, application behaviour, infrastructure.
9. **Alternatives and when to choose them:** push, queue hand-off, both roles in one program.
10. **Worked example:** the duplicate `POST`; a repeated `PUT` stays safe.
11. **Exercise:** payments, with the worked answer including the key.
12. **Own words and transfer;** sources; next and previous links.

### Spec revisions made at implementation (recorded in the spec)

- Added the "POST with an idempotency key" case: to the model, the figure, the explanation (question 7, steps 9–10) and the exercise.
- Added a source record for the Idempotency-Key draft.
- Questions are renumbered in page order; the spaced-review references are updated.
- The leak scope is defined and tested:
  - nothing in the figure states an outcome before Check, Skip or Run;
  - nothing above the figure states the keyed outcomes.

## 6. Interactive figure: behaviour and learning features

**Predict first.** Three questions, with choices:
- **A (recall):** POST, response lost, retried → new orders? Answer: 2.
- **B (predict):** the same with a key → new orders? Answer: 1.
- **C (predict):** keyed, response late → what does the retry get? Answer: 409 Conflict.

**Feedback:**
- **Incomplete:** Check names the open questions and reveals nothing.
- **Correct:** "right" with the reason.
- **Incorrect:** the answer, a reason specific to the option the learner picked, and the general reason.
- **Skip:** reveals the answers without feedback.
- Once the answers are revealed, "Run case A/B/C" buttons appear.

**Run any case.** Request: `GET`, `PUT`, `POST` or `POST` with a key. Fault: none, request lost, response lost or response late. Retry: on or off. That is 32 combinations, all computed by the pure model `exchange()`.

**What a run shows:**
- a stepper over a two-lane sequence drawing;
- an ordered event list;
- "Client saw" for each attempt;
- how many times the request reached the server;
- new orders, total orders, and order 42's quantity.

In the late case, the events are in time order: the first request starts, the client gives up, any retry is refused with 409 while the first is still running, and the first finishes last. The drawing matches.

**Accessibility:**
- **Keyboard:** native radios, checkbox and buttons. Buttons at the ends of a sequence stay focused using `aria-disabled` rather than `disabled`.
- **Announcements:** a polite live summary per run, and a polite step announcer. Both are cleared when a choice changes, and stale results are removed.
- **Motion:** nothing animates in any mode.
- **Colour:** monochrome; states are shown by line weight, dash and text.

## 7. Changed files, by purpose

**Chapter 1 release (PR #19):**
- `src/lib/learn/web-request-model.ts` and `.test.ts`;
- `src/components/learn/web-request/JourneyStepper.tsx`;
- `src/app/learn/web-request/page.tsx`;
- `docs/system-design/chapters/web-request.md`;
- `docs/system-design/CURRICULUM.md`;
- `docs/system-design/COURSE_STATE.md`;
- `docs/system-design/chapters/client-server.md` (spec).

**Chapter 2 (PR #20):**

| Purpose | Files |
| --- | --- |
| Page | `src/app/learn/client-server/page.tsx` (new) |
| Figure | `src/components/learn/client-server/ExchangeStepper.tsx` (new); `src/components/learn/learn.css`: figure styles, code blocks that wrap, underlined links in the "next" box (WCAG 1.4.1) |
| Model and tests | `src/lib/learn/client-server-model.ts` and `client-server-model.test.ts` (new) |
| Sources | `src/content/learn/client-server-sources.ts` (new) |
| Integration | `src/content/learn/chapters.ts` (route, which feeds the course index and sitemap); `src/app/learn/web-request/page.tsx` (chapter 1's "next" link) |
| Course records | `docs/system-design/chapters/client-server.md` (spec revisions, evidence, three review blocks); `CURRICULUM.md` (status verified); `COURSE_STATE.md` |

No other files changed. The homepage, blueprint components, `package.json` and the lockfile are untouched.

## 8. Test and quality-gate results (final Chapter 2 code, `0dc065d` = tree of `71fd4d8`)

| Gate | Command / suite | Result |
| --- | --- | --- |
| Unit and model tests | `npm test` (Vitest) | **159/159 pass**: 63 client-server model, 93 web-request, 3 curriculum |
| Mutation check | late reply moved before the retry | 5 tests fail, as intended |
| Course helpers | `node --test …/course.test.mjs` | **23/23 pass** |
| Course validation | `node …/course.mjs check` | **ok** |
| Typecheck | `npx tsc --noEmit` | **pass** |
| Lint | `npm run lint` | **pass**, 0 warnings |
| Formatting | `npx prettier --check src docs` | **pass** |
| Pre-commit audit | `npx fallow audit` (new-only) | **pass**: 0 new issues; `critters` unused dependency is pre-existing (`introduced: false`) |
| Production build | `next build` | **pass** |
| Browser suite, chapter 2 | Playwright, 48 checks | **48/48 pass** |
| Browser suite, chapter 1 (regression) | Playwright, 69 checks | **69/69 pass** |
| Accessibility | axe-core 4.10.3, WCAG 2.0/2.1/2.2 A and AA, at 375 and 1280 px | **0 violations**; 6 SVG text nodes "need review" (inside an `aria-hidden` SVG; checked by hand) |
| Lighthouse 13.4.1 | mobile and desktop | see table below |
| Real screen reader | — | **NOT RUN**: none available in this container |

The 48 Chapter 2 browser checks cover:
- **Viewports:** six widths, no horizontal scroll and no console errors, before and after a run.
- **axe:** on load (answers open) and after a reveal plus a run.
- **Answer leakage:** before Check, Skip or Run.
- **Feedback:** incomplete, correct and incorrect, including per-option reasons.
- **Keyboard:** operation and focus retention.
- **Announcements:** the live summary and the step announcer.
- **Stale results:** cleared when a choice changes.
- **Cases A–C:** each runs to the model's outcome.
- **Late case:** the drawing and event list are in time order.
- **Label geometry:** across all late cases.
- **Citations:** links resolve, and numbering follows first citation.
- **Reduced motion.**
- **Integration:** the /learn link, chapter 1's next link, the sitemap, and that / renders.

**First-load JS** (budget ≤ 120 kB per page, from `next build`), with script bodies fetched before the load event (gzip) measured in the browser:

| Route | `next build` | In-browser (gzip) |
| --- | --- | --- |
| / | 110 kB (unchanged) | 112.9 KB |
| /learn | 107 kB | 106.5 KB |
| /learn/web-request | 111 kB | 111.0 KB |
| /learn/client-server | 112 kB | 111.2 KB |

**Viewports tested:** 375×812, 402×874, 768×1024, 1280×800, 1440×900 and 1920×1080. All pass.

**Lighthouse (final build):**

| Route | Mobile performance | Desktop performance | Accessibility, best practices, SEO | CLS |
| --- | --- | --- | --- | --- |
| /learn/client-server | 100, 99 | 100 | 100 | 0 |
| /learn/web-request | 99 | 100 | 100 | 0 |
| /learn | 99 | 100 | 100 | 0 |
| / | 97 | 100 | 100 | 0 |

An earlier build (`af07b7c`) scored 84 on mobile once, on the first run after a server start (TBT 510 ms), then 100, 99 and 99. It is recorded as run-to-run variance.

**Totals across the gates in the table:**
- **Passed:** 13 (unit tests, mutation check, course helpers, course validation, typecheck, lint, formatting, audit, build, two browser suites, axe, Lighthouse).
- **Failed:** 0.
- **Not run:** 1 (real screen reader).

## 9. Independent reviewer findings and disposition

Each review was a fresh subagent with no part in authoring Chapter 2. Each used the spec, the rubric (`verification.md`), the diff, a production build of that commit, and the local source copies.

**Review 1: implementation, `dceb551..af07b7c`.**

| Severity | Finding | Disposition |
| --- | --- | --- |
| Blocking | In the late case, events and drawing showed the first request finished before the retry, contradicting the 409 | Fixed: model emits time-ordered events; drawing redone; event-order tests per method |
| Should-fix | Worked-example order numbers inconsistent | Fixed |
| Should-fix | Drawing labels crossed the lanes and scaled up at wide widths | Fixed |
| Should-fix | 3 citations claimed more than their sections (§15.2 frequency, §9.3.4 "undoes", key reuse §2.2) | Fixed: one dropped, one marked derived, one re-cited to §2, §2.2 |
| Notes (11) | Exercise hint; spec self-contradiction; per-option feedback; "consistent with the original"; "three causes" assumption; scope and outside-HTTP wording; code block at 320 px; parts list | Fixed |
| | Figcaption hint; Program/Status code in the parts list; browser suite not in repo; radio-after-reveal | Accepted with reasons (in the spec) |

**Review 2: check of the fixes, `af07b7c..607f1d5`.** It confirmed the blocking finding fixed.

| Severity | Finding | Disposition |
| --- | --- | --- |
| Should-fix | Tail label still crossed both lanes | Fixed: shortened; browser geometry check added |
| Should-fix | `COURSE_STATE.md` not updated | Fixed |
| Notes (3) | Still-busy bar always heavy; order 43 vs 44 wording; HTTP/1.1 qualifier cited to §3.4 | Fixed |

**Review 3: final check, `607f1d5..6b5f8d5`.** No blocking or should-fix findings.

| Notes (3) | Disposition |
| --- | --- |
| Still-busy line crossed the retry's server box | Fixed: moved |
| No test tying "order 43" to the late reply | Fixed: test added |
| Evidence not tied to a build | Fixed: everything re-run on the final code |

The final notes' fixes are an SVG coordinate change and one added unit test. They were not reviewed by a fourth agent; the browser suites and tests re-ran on them.

## 10. Source verification

**Read directly** (pinned versions):

| Source | What was read, and where |
| --- | --- |
| RFC 9110 | Published text as rendered by the HTTP WG (`httpwg/httpwg.github.io` @ `ce03dd5`). Sections read: §3.3–3.7, 3.9, 6.3, 6.4, 7.1, 7.5, 8.3, 8.6, 9.1, 9.2.1, 9.2.2, 9.3.3, 9.3.4, 15, 15.2, 15.3.2, 15.5.10 |
| RFC 9112 | Same repository. Sections: §3, 3.2, 4, 9.3, 9.3.1, 9.5 |
| RFC 6265 | Same repository. Sections: §1 and §3 |
| MDN | `mdn/content` @ `bd7387a`: HTTP overview, messages, cookies, server-sent events, WebSocket API |
| PostgreSQL docs | `start.sgml`, REL_18_STABLE @ `35f60e5` |
| IETF Idempotency-Key draft | Working group editor's copy, `ietf-wg-httpapi/idempotency` @ `a2cd12a` (2026-10-22). Labelled as a draft throughout |

**Not reachable:** rfc-editor.org, datatracker, ietf.org, the IETF mail archive, RFC mirrors, MDN's website, postgresql.org, and the deployed Vercel hosts. All are refused by the egress proxy, and WebFetch could not resolve them either.

**Unresolved (recorded in the course records):**
- **RFC 9846:**
  - read only in the TLS working group's final source;
  - its published date and section numbers are unverified against the published RFC;
  - search snippets disagree on the date (July vs May 2026).
- **RFC 6265 vs 6265bis:** the revision may obsolete RFC 6265. It is search-only; no published RFC number was found. Chapter 2 uses only the basic Set-Cookie → Cookie mechanism, and does not use 6265bis as evidence.
- **Idempotency-Key draft:** its current published draft number and status are unchecked. Its section numbers are computed from the editor's copy.
- **Fetch's clamp step 2:** read literally, it would set the secure connection start from the connection end (Chapter 1 open question). Upstream not checked.

## 11. Accessibility limitations

- **No real screen-reader test was performed** (VoiceOver, NVDA or JAWS). The live regions, `role="status"`, accessible names and `aria-disabled` focus behaviour were checked through DOM and ARIA inspection by Playwright and by the reviewers. That is not equivalent to assistive-technology testing.
- **axe:** "needs review" items remain for SVG text inside `aria-hidden` drawings. They were checked by hand: ink #111 and #4a4a4a on white or #ebebeb, at least 7:1.
- **Devices:** viewport emulation only; no real devices, and no safe-area behaviour on hardware.

## 12. Git, PR and deployment status

| Item | Status |
| --- | --- |
| PR #19 (Chapter 1 release) | merged → `dceb551`; Production deployment 7367234156: success |
| PR #20 (Chapter 2) | merged → `71fd4d8`; Production deployment 7368508004: success |
| `main` | `71fd4d8` (merge of PR #20; tree identical to tested head `0dc065d`) |
| Branch `claude/trusting-wright-s27b5f` | fast-forwarded to `71fd4d8` after the merge, then this report and a state update committed on top; pushed; not merged (see §13) |
| History | merge commits only; no force-push, no rebase of shared history |
| Old `/learn` prototype archive | preserved outside the repo (69,346 bytes), untouched |

## 13. Remaining risks, skipped checks and follow-ups

1. **The live pages are not verified from this container.** Open https://connectaditya.vercel.app/learn/client-server and /learn/web-request and spot-check them:
   - Chapter 1's predict panel asks about 80 ms;
   - Chapter 2's figure shows no outcome before Run.
2. **Real screen-reader test** of both figures (VoiceOver or NVDA).
3. **Browser suites are not in the repo.** They live in the session scratchpad and need a locally downloaded axe-core and a running build. Committing a runnable suite would make the evidence reproducible.
4. **Source checks once the official sites are reachable:**
   - RFC 9846's published details;
   - 6265bis publication status;
   - the Idempotency-Key draft's current status;
   - Fetch's clamp wording.
5. **`critters`:** an unused dependency flagged by fallow; pre-existing and out of scope.
6. **This report** is committed on the branch, not merged into main. It lives under `docs/`, which deploys never upload (`.vercelignore`), so merging it is optional.
7. **Next course unit:** mode C, `ip-and-ports` (`course.mjs next`).

## 14. What to review next

1. The two pages, live:
   - `/learn/client-server`: run case C and step through it;
   - `/learn/web-request`: the predict panel.
2. `docs/system-design/chapters/client-server.md`: the spec revisions, evidence and three review blocks.
3. `src/lib/learn/client-server-model.ts` and its tests, the teaching model behind every number in Fig. 1.
4. PR [#20](https://github.com/iamadi11/my-portfolio/pull/20) and PR [#19](https://github.com/iamadi11/my-portfolio/pull/19).
5. `docs/system-design/COURSE_STATE.md`: open issues and next action.
