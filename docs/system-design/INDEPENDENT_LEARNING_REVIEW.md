# Independent learning/model review — 2026-10-29

Reviewer: fresh course-learning subagent, source/model review. This is **not** the required rendered-page visual review. The author owns the browser; no screenshots, keyboard, contrast, screen-reader, mobile, performance or reduced-motion UI checks were performed in this review. No empirical learning-outcome validation is claimed. Findings apply to the source inspected during this working session; the author may append fix outcomes.

Reviewed the verification, learning-and-motion, scientific-modeling, motion, interaction-patterns and visual-review references; `academy-lessons.json`, `academy.ts`, `AcademyChapter.tsx`, `AcademyPractice.tsx`, `experiment-model.ts`, `film-model.ts`, `LessonFilm.tsx`, `Scene.tsx`, `useClock.ts`, `ChapterTabs.tsx`, and the dynamic chapter route.

## Blocking

### B1. Chapters present a mechanism unrelated to their question as the explanatory film

`src/content/learn/academy-lessons.json:47` (`data-modelling`), `:59` (`relational-model`), `:82` (`document-model`), `:172` (`search-indexes`), `:205` (`object-storage`) and other mappings are consumed without a chapter-specific trace by `src/components/learn/AcademyChapter.tsx:14`.

Examples: relational-model asks how to reject an order with a nonexistent customer, then animates debit/credit rollback between bank accounts. Search-indexes asks how a word identifies documents, then searches numeric sorted rows. Document-model asks about embedding/reference relationships, then also searches numeric rows. Object-storage animates WAL recovery rather than object bytes, keys, metadata and upload state. Deployments, compute-platforms, fault-injection, interview-method and capstone all use the same worker queue. The last two have a useful worksheet, but the explanatory film still does not depict their question. A disclaimer about simplifying a model does not make this teach the missing mechanism.

Fix: add a trace that actually contains each chapter's core state and transition, or explicitly label these as a prerequisite exercise and avoid claiming the chapter itself is fully taught/complete. Preserve honest coverage states if remaining mechanisms cannot be authored in this pass.

Independent source checks: [PostgreSQL 18 foreign keys](https://www.postgresql.org/docs/18/ddl-constraints.html#DDL-CONSTRAINTS-FK) supports an explicit referenced-row membership check; [PostgreSQL text-search indexes](https://www.postgresql.org/docs/18/textsearch-indexes.html) describes lexemes and matching locations. Neither is the account-transfer/binary-search model currently substituted for it.

### B2. One generic fan-out control collapses independent delivery into shared computation

`src/lib/learn/experiment-model.ts:953` (fanout), reused by `pub-sub`, `batch-processing`, `membership-gossip`, `failure-modes`, `service-boundaries`, `case-news-feed` and `cache-failure-modes` in `src/content/learn/academy-lessons.json`.

Its modes offer “one copy per recipient” versus “one shared/coalesced operation,” but the latter produces one downstream operation regardless of independent recipient requirements. That is meaningful for identical cache misses, while a broadcast must still deliver to every bound independent queue. The picture has one dispatch-to-downstream cable and never represents recipients independently. In gossip it also implies a central dispatch rather than peer dissemination; in news feeds it never models the later read that performs deferred work.

Fix: restrict coalescing to identical work; give pub/sub separate recipient queues and count deliveries, news feeds a read/write work axis, and gossip peer rounds. Otherwise change the stated objective and indicate the unimplemented mechanism.

Independent check: [RabbitMQ publish/subscribe tutorial](https://www.rabbitmq.com/tutorials/tutorial-three-javascript) defines fanout as delivery to every bound queue. Shared computation is a separate contract.

### B3. Application rejection and propagation delay are displayed as lost messages

`src/components/learn/film/Scene.tsx:274` renders `packet.lost` as “× message lost.” `experiment-model.ts` uses the same `lost` flag for denied authorization (`gate`), exhausted token buckets, expired credentials, unready routing and a merely lagging follower. A request deliberately denied after a policy check is not a lost packet; an unapplied asynchronous update is not necessarily lost.

Fix: distinguish network loss, application denial/failure and pending propagation in the event schema and renderer, with chapter-specific terminal states. A denied operation should reach the policy boundary; a pending update should not silently become a loss.

## Should fix

### S1. Ordinary paused Next/scene selection shows the previous state under the current event caption

`src/lib/learn/film-model.ts:52` defers a current traveling event's counts/values until travel completes. `src/components/learn/film/LessonFilm.tsx` scene buttons seek `i * BEAT_SECONDS`; `src/components/learn/kit/useClock.ts:103` Next likewise seeks beat starts. The +0.8-beat compensation exists only for reduced/static mode.

Reproduced by bundling the pure models with esbuild: queue(6, one worker), t=5 reads “Complete job 1” but has pending=6/completed=0; at t=8.9 the same event correctly has pending=5/completed=1. At t=10 Next says job 2 but shows only one completion. This makes the stepped path misleading until the learner presses Play or selects static mode.

Fix: define event-boundary semantics and make manual event navigation land on a deterministic committed state, with an explicit separate in-flight state if needed. Test ordinary stepping as well as reduced mode.

### S2. Column-read badge contradicts the full cell count

`src/lib/learn/experiment-model.ts:1290` stores `Math.min(8, cells)` as the actual model count. For six columns/four rows, the value and metric say 24 cells, but the badge says “8 total · abbreviated” (`src/components/learn/film/Scene.tsx` count label). The renderer already caps visible objects independently, so this early cap corrupts the count.

Fix: retain the full `cells` count in the model; abbreviate only geometry. Also inspect pagination's hardcoded eight-row badge for its ten-row collection.

### S3. Watermark is conflated with arrival processing time

`src/lib/learn/experiment-model.ts:994` decides lateness with arrival tick `n > 5`, while the caption says event timestamp=3 and watermark=5 for all arrivals. No event-time window end or watermark advancement is modeled. This teaches “arrival clock beyond five means late” without the relationship needed to explain watermarks.

Fix: explicitly model event timestamp, window end and watermark at arrival; late follows watermark progress beyond that window end. Alternatively label the example as a processing-time deadline and remove the watermark claim.

Independent check: [Apache Beam watermarks and late data](https://beam.apache.org/documentation/programming-guide/#watermarks-and-late-data) distinguishes event time from processing time, explains source-specific watermark progress, and defines late data relative to window completion. This model's boundary assumptions need to make that distinction visible.

### S4. “Recall” currently checks recognition of an already printed sentence

`src/content/learn/academy.ts:47` constructs every quiz from the exact `lesson.rule` shown on Learn and the exact misconception shown in its detail. The prompt is the same chapter question and feedback is only `lesson.limit`. No new scenario, changed assumption, numerical prediction or reason for the specific wrong choice is authored. Correct positions are mixed, which is useful, but does not turn recognition into retrieval/transfer.

Fix: author one small changed scenario per mechanism family, derive its expected result from the model, and explain why each answer follows/fails. Keep progress named recall checked rather than mastery. The current reflection prompt is an honest self-assessment, but does not replace that scenario.

### S5. Beginner prerequisite recall and term definitions are absent from academy chapters

`src/content/learn/academy.ts:31` computes prerequisites, but `src/components/learn/AcademyChapter.tsx` never renders them or a needed-idea recall. Blueprint has no term definitions. Later chapters introduce terms such as MVCC, serializable, SLI, watermark and fencing directly. This falls short of the fresh-graduate path and the skill's first-use term rule.

Fix: add a compact “bring this idea” prerequisite link/recall plus only the terms necessary for this chapter, with their plain-language meanings. Do not expand every lesson into an essay.

## Notes and evidence boundaries

- Pure models are deterministic, invalid numeric inputs clamp, budgets/costs/ticks are generally labeled illustrative, prediction results are conditionally mounted only after Run, and correct-choice positions are mixed. These are useful foundations.
- Lab controls clear prior results; quizzes require commitment; optional local progress distinguishes viewed, practiced and recall checked. No mastery claim was observed.
- Only four primary source pages were independently read for these findings: PostgreSQL constraints, PostgreSQL text search, RabbitMQ publish/subscribe and Apache Beam programming guide. Remaining source registry records were not individually verified in this review.
- Required rendered review remains **not run** by this reviewer. Five visual questions/ten visual dimensions cannot honestly be marked pass from source inspection. Open B/S findings prevent declaring the batch verified.
- Reproduction command: bundle `src/lib/learn/experiment-model.ts` and `src/lib/learn/film-model.ts` separately using installed esbuild, then call `makeExperimentFilm`, `sampleFilm` and `simulateMechanism` with the values above. This is a focused model probe, not a replacement for the project's required test/build/browser gates.

## Recheck of revisions — 2026-10-29

Latest review: source/model recheck of `topic-models.ts`, revised academy mappings, `design-guides.ts`, term primer, scenario-derived quiz, watermark, counts and player. The original findings above are retained as history; use the outcomes below for current status. This still does not establish rendered visual acceptance or verify all 119 chapters.

### Original findings: outcomes

| Finding | Current outcome | Evidence / limitation |
| --- | --- | --- |
| B1 unrelated chapter mappings | Substantially addressed for the named concrete failures | Relational model now uses foreign-key membership; text search uses lexeme postings; document modeling uses bounded embedding; object upload has completion/publication states; deployments uses canary cohorts; distributed transactions uses saga compensation. Cases have product requirements/read-write paths/failure challenges plus a separate decision zoom. Broad titles such as consensus, consistency models, coordination services, CAP/PACELC and alerting still show one narrow submechanism, not their entire topic. Keep those scope limits explicit. New case overview animation has its own issue R2 below. |
| B2 fanout/coalescing conflation | Resolved in source | `fanout` explicitly counts independent subscriber deliveries; `coalesce` is restricted to identical reusable misses; `feed` separates publishing work and later reads; `gossip` has peer rounds; batch work uses disjoint map/reduce counts. Geometry still aggregates recipients rather than depicting each independent destination, so visual legibility/causal sufficiency need rendered review. |
| B3 denial/delay labeled packet loss | Resolved in source | Academy event construction no longer sets `lost`; original protocol films can still represent actual lost messages. Non-network failure captions now retain their own semantics. |
| S1 ordinary stepping mismatch | Partly resolved; continuation defect remains R3 | Paused event-boundary frames sample a settled state, but Play removes the sample offset without moving the clock. |
| S2 capped column count | Resolved in source | `columns` retains the full count; renderer alone abbreviates geometry. Model retains 24 cells for 4×6. Pagination now starts at 10 then changes to 9. |
| S3 watermark / processing-time conflation | Resolved in source | Explicit event-time window [0,5), variable source watermark, fixed event timestamp 3 and late-data correction policy. Boundary uses watermark ≥5 for this half-open window. |
| S4 verbatim rule recognition | Resolved for the specific issue | Quiz now gives changed numeric input/policy and derives the expected outcome and feedback from the model. Most alternatives are two named outcome categories; deeper causal explanation remains self-assessed and no empirical learning gain is established. |
| S5 missing prerequisite/terms support | Addressed as a compact foundation | Primer renders a mechanism definition and prerequisite links. It is not a complete first-use glossary or explicit recall of every required prerequisite idea; broader coverage is a further teaching-quality opportunity. |

### Remaining/new blocking

**R1 — Transactional outbox animation commits business data before the atomic outbox boundary.** `src/lib/learn/topic-models.ts:835` starts the alternative run with a beat labeled “Commit business changes,” state `a = 6 committed`, without any outbox state. Only its next beat creates the supposedly same-transaction outbox rows. A paused frame between these beats is the unsafe split commit the outbox is meant to prevent. Model probe confirmed the first beat contains only committed business rows. Stage both writes, then atomically expose both committed states in one event. If rows are shown separately before commit, label both uncommitted and allow neither to imply durable publication intent. Independently checked the [transactional outbox pattern author's explanation](https://microservices.io/patterns/data/transactional-outbox.html): business entities and publication intent belong in one database transaction, then a separate relay sends the messages. A final-count test alone does not guard intermediate atomicity.

**R2 — Case-design “failure scenario” packets are narration, not a modeled failure.** `src/content/learn/design-guides.ts:222` sends a generic `Failure scenario` packet from the API to whichever component occupies role 3 and sets its value to `observe uncertainty / failure`; `:230` sends an `Explain consequence` packet to the user. These are concepts, not system messages. For example a cache-loss discussion dispatches a “failure scenario” to the cache rather than changing its availability/content; a privacy update never invalidates a copied feed entry. This repeats the skill's explicit rejected pattern of a packet traveling between captions. The written case requirements, challenges and worked workload are useful; the generic motion does not establish that the end-to-end design works. Prefer a labeled static conceptual architecture overview for these guides, keeping only real request/write/read messages where their state is represented. The existing decision zoom can remain the executable animation. Alternatively author actual case-specific fault events. Do not present the generic tour as a complete simulated design.

### Remaining/new should fix

**R3 — Play after a settled manual step rewinds committed state.** `src/components/learn/film/LessonFilm.tsx:55` computes `stateTime=t+4` while paused at a five-second boundary but uses `t` immediately after Play. The clock itself still holds the earlier boundary. Reproduced with queue(6, baseline): paused Next at clock 5 samples 9 → pending 5/completed 1; Play samples 5 → pending 6/completed 0. The completed job visibly returns to the queue and then completes again. Fix by storing the actual settled clock position or by defining a monotone step/resume transition. Add a guard for Next → Play and scene-selection → Play, not just static Next snapshots.

**R4 — Canary input counts requests but is capped by unique users without a one-request-per-user assumption.** `src/lib/learn/topic-models.ts` canary definition labels `amount` “Bad requests before rollback signal,” but its simulation computes `bad = min(amount, exposed users)`. Selecting amount 4 with a two-user canary reports two bad requests rather than the requested four; the same user can make multiple requests. Either explicitly model one request per exposed user and label the input accordingly, or keep request count distinct from exposed user count and model when stop/rollback occurs. Probe: canary(4, alternative) returns users=2, bad requests=2.

### Current evidence and limits

No application files edited by this reviewer. Source checks establish improvements to the eight original findings and expose the four current issues above. Pure-model probes independently reproduced R1, R3 and R4. Source registry records were not all independently reread; the recheck added the primary outbox-pattern author to the previously inspected sources. Screenshots, real keyboard interaction, assistive technology, target-viewport inspection, timing/performance measurement and empirical beginner learning tests remain outside this review. The shared renderer/player has not received a blanket visual pass, and course route coverage is not equivalent to every chapter being verified.

## Final focused recheck — 2026-10-29

This disposition supersedes the open status of R1–R4 above for the inspected source. It is limited to those fixes and the additional consensus/CAP traces; it is not an all-chapter acceptance or a rendered visual review.

| Item | Disposition | Independently checked evidence |
| --- | --- | --- |
| R1 outbox intermediate commit | Resolved in the pure model | `topic-models.ts` now stages both sides as uncommitted, then writes business and outbox committed counts in one non-traveling event. Probed amounts 1–8 at 0.1-second sample intervals across each complete alternative film: no sample had unequal business/outbox committed counts. |
| R2 abstract case packets | Resolved for the reported false motion | `design-guides.ts` now selects concrete per-case fault states: unavailable cache/quota store, durable post plus pending fan-out, committed provider effect with uncertain reply, divergent versions and exact distance rejection. Abstract `Failure scenario` and `Explain consequence` packets are absent from all 12 generated case/capstone guides. Actual lost reply packets remain for chat/payment uncertainty. The guides are still compact conceptual case overviews, not a complete executable architecture/fault-injection simulator; the separate mechanism zoom carries the input-dependent model. Their visual teaching quality remains unreviewed. |
| R3 manual step → Play rewind | Resolved in source and focused model probe | `LessonFilm.tsx` now stores settled marks at (beat index +0.8)×5 seconds; scene selection seeks that actual time and rendering samples the clock directly in paused and playing states. Queue example at t=9 and t=9.01 consistently retains pending=5/completed=1. No pause-only sampling offset remains. This checks the previous causal rewind, not real browser control behavior. |
| R4 canary requests/users | Resolved by explicit scenario boundary | The control now specifies request observations with at most one per user; the first beat explicitly assumes one request per exposed user before the stop signal. The min(observation budget, exposed cohort) arithmetic is coherent under this small illustrative scenario. It does not estimate repeated-request production exposure or detection delay. |

Additional focused checks: `consensus` maps to `consensusLog` and now depicts an initially uncommitted current-term leader entry, durable follower replication and a majority commit boundary under an already-valid election. Model probes for one/two/three durable replicas yield zero/one/one committed entries. The limits explicitly omit previous-term/log-matching/recovery/configuration cases. `cap-pacelc` maps to `partitionChoice`: under a partition the isolated copy returns v4 while the majority has v6, or a strict read policy returns no value; those two outcomes were reproduced. This is a bounded CAP failure scenario; the film does not model PACELC network-latency tradeoffs outside a partition.

No reported blocking or should-fix defect remains open **within this focused source/model review scope**. This is not a claim that the 119 chapters pass the full teaching rubric. Required rendered viewport/keyboard/reduced-motion/assistive-technology/performance review remains outside this review. Full registry source verification, first-use vocabulary completeness, deeper chapter-specific mechanisms, open-ended design feedback, and empirical learner testing remain separate work. Keep route coverage, source/model confidence, rendered acceptance and learning-outcome evidence separate in release notes.
