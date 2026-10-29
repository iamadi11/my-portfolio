# Independent anatomy/course source review

Reviewer: fresh `anatomy_course_review` subagent, 2026-10-30. Review only; no application-code edits.

Scope: curriculum/objective and blueprint mapping through capstone; authored films; topic and experiment models; shared sampler, layout, hardware, player, clock, comparison and lab source. Read the verification, visual-review, scientific-modeling, interaction-patterns, motion, anatomy and anatomy-GSAP guidance. Findings below describe the inspected implementation before the author's concurrent repairs; disposition/reverification must be appended rather than inferred.

## Findings

1. **Blocking — valid foreign-key input receives a false verdict.** `src/lib/learn/topic-models.ts:455–479` sets the outcome from policy alone. Reproduction: `simulateMechanism('foreignKey', {amount:2, alternative:false})` reports **Orphan accepted**, but its explanation says the reference is valid and its orphan metric is zero. Customer 2 exists. Compute the verdict from the actual constraint/insertion result and cover both existing and absent ids under both policies. Independently checked [PostgreSQL 18 §5.5.5](https://www.postgresql.org/docs/18/ddl-constraints.html#DDL-CONSTRAINTS-FK) and its [foreign-key tutorial](https://www.postgresql.org/docs/16/tutorial-fk.html).

2. **Should-fix — several core lessons do not exercise their declared mechanism.** `academy-lessons.json` maps `async-work` to the worker-capacity `queue` model (`experiment-model.ts:394`): the only changed assumption is one versus two workers, not synchronous completion versus durable acceptance. A matching acceptance/completion model already exists as `communication`. `app-caching` uses the same age/invalidate read model as caching fundamentals, so the stated cache-aside/write-through/write-back ordering cannot be explored. `consistency-models` repeats follower-version lag, without a read/write history capable of distinguishing its claimed consistency guarantees. Replace or explicitly mark these objectives as uncovered until the corresponding mechanism is implemented. Author notified and is repairing these three mappings/models.

3. **Should-fix — reduced/static Play discards reading pace.** The inspected `useClock.ts` reduced branch advances every 900 ms regardless of beat caption duration or selected playback speed, although `paceFilm` allocates seconds from caption length. Long explanations become brief flashes during the accessibility mode. Hold events according to the same declared duration/speed, or require explicit manual stepping. Author notified and is repairing this.

4. **Should-fix — architecture comparison changes two causes together.** `topic-models.ts:1635–1677` changes worker count and provider idempotency together, while `MechanismCompare.tsx:25` says “One input · two conditions”. That cannot isolate why backlog changes versus why duplicate-effect risk changes. Split the controls or identify the bundled design changes explicitly and attribute each result. Applies to foundation review, interview method and capstone. Author notified.

5. **Should-fix — exact quantity-label theme styles do not match the rendered element.** `Scene.tsx:52` assigns `lf-count-label` directly to `<text>`, but `film.css:457` selects a descendant `.lf-count-label text`. There is no such descendant. The quantity label misses its intended theme fill, font and paper halo. Fix the selector; confirm dark-theme legibility in the author's rendered check. This is a source-confirmed selector mismatch, not a measured contrast result.

## Remaining curriculum coverage gaps

These are scoped learning gaps, not claims that the simplified models' explicit limits are false. `CURRICULUM.md` still promises more than these assets exercise:

- Relational model (§objective near line 218): tables, joins and SQL set operations; the asset currently teaches a foreign-key reference check.
- Storage engines (near 224): B-tree versus LSM layout/read-write tradeoff; the asset currently teaches WAL recovery.
- HTTP caching (near 250): Cache-Control and validators; the age/invalidation model has no conditional request or 304 state. [RFC 9111 §4.3](https://www.rfc-editor.org/rfc/rfc9111.html#section-4.3) independently establishes that validation is a separate exchange.
- Distributed transactions (near 282): 2PC versus sagas and coordinator-failure blocking; only saga compensation is executable.
- Unique IDs (near 287): random/time-ordered/range allocation properties; the model demonstrates distinct node prefixes plus counters and explicitly says it is not UUID. The lesson rule nevertheless speaks about UUID variants. [RFC 9562 §5](https://www.rfc-editor.org/rfc/rfc9562.html#section-5) independently confirms the version-specific layouts/generation mechanisms omitted here. Align the rule with the actual demonstration and retain the broader objective as unfinished work.

The capstone now has an explicit paid-learning-platform requirement, assumed workload, read/write/failure/tradeoff script and worksheet. These support review practice; they do not establish that every prerequisite objective above has been taught.

## Positive source/model observations

- `sampleFilm` defers a travelling beat's state/values/counts until arrival, and settled scene seeking lands after that commit boundary. The outbox atomicity and resume tests exercise useful legal-state invariants.
- The experiments' legacy last `add()` parameter does **not** set `FilmBeat.lost`; it only alters the message label. An initial suspected refusal/loss finding was retracted after inspecting this helper. Tests explicitly prohibit experiment transport-loss flags.
- Signals use explicit hardware connector coordinates, and the visibility-grid routes avoid conservative device footprints. Static hardware SVG is built once per kind. These source properties are useful, but do not prove actual silhouette clearance, painter order or readability.
- Full numeric counts remain in the model even when visible marks are abbreviated. Shared HTML summaries and transcripts provide non-motion representations; actual assistive-technology behavior remains unchecked here.

## Evidence and limits

- Direct reproduction: esbuild bundle of the pure experiment model into `/tmp/anatomy-review-model.cjs`; existing-reference/no-constraint result contradicts its metric as recorded in finding 1. Also inspected both architecture outputs at amount 6.
- `npx vitest run src/lib/learn/experiment-model.test.ts src/lib/learn/film-model.test.ts`: **pass, 93 tests**, before concurrent author repairs. This establishes those assertions, not semantic correctness of every outcome; finding 1 passed this suite.
- Independently opened primary sources above. Other course sources were inspected through their records/source mappings, not all independently reread.
- **Rendered review: not performed.** Browser startup failed in the sandbox; the fallback attempt was stopped when the author assigned exclusive browser ownership to avoid conflicts. No screenshots, viewport, keyboard, reduced-motion rendering, contrast, FPS, screen-reader, axe or Lighthouse result is claimed by this reviewer.
- Typecheck, lint, build and full release/browser gates: not run by this review-only subagent; author owns final verification after repairs.
- Visual review/rubric/reject acceptance is intentionally **not asserted**. This source/model review does not satisfy independent rendered acceptance for all 119 chapters or promote any chapter beyond its existing status.

## Independent source/model recheck — 2026-10-30

Rechecked the author's repairs and the new `sqlJoin`, `sqlSets`, `storageLayout`, `httpValidation`, `twoPhase`, `uuidLayout`, `cacheWrite` and `consistencyHistory` models, their chapter mappings and companion-lab integration. No application source was changed by this reviewer.

### Repaired findings

- **Finding 1 repaired:** foreign-key verdict is now based on `alternative && !exists`; both existing and missing references under both policies have truthful accepted/rejected verdicts. Exhaustive valid-range assertions were added.
- **Finding 2 materially repaired:** `async-work` now uses the acceptance/completion `communication` model; app caching owns database/cache write-order state; consistency now includes a completed write, later read, observed value and eventual convergence without rewriting the earlier history.
- **Finding 3 repaired in source:** reduced/static playback receives paced beat durations and divides hold times by selected speed. This review does not claim a rendered timing pass.
- **Finding 4 repaired:** architecture comparisons explicitly identify two design bundles and separately name worker capacity/provider recovery.
- **Finding 5 repaired:** the quantity label selector now matches `.lf-count-label` directly. Actual contrast remains the author's browser check.

### New model review

Within their explicitly bounded scenarios, the eight added traces are coherent: INNER/LEFT join multiplicity and unmatched NULL row; UNION/UNION ALL duplicate handling; mutable B-tree leaf versus LSM memtable/flush/read paths; matching/differing HTTP validators and 304/200 body counts; durable 2PC decision recovery versus in-doubt prepared participants; UUIDv4/v7 layout and a clock-rollback sorting counterexample; stale cache after a missing invalidation versus an ordered update; and nonoverlapping register operations under a stale read. These are reviewed teaching scenarios, not full protocol implementations or benchmark results.

New companion models now provide joins/SQL combination and 2PC practice; the earlier coverage-gap list is historical, not a statement that those assets remain absent. New main mappings provide storage layout, HTTP validators and UUID layout. Remaining scope limits include an executable write-back failure case, a separate causal-dependency history, and allocated-range ID generation; the new text discusses some of these but does not make them executable.

Independently opened [PostgreSQL PREPARE TRANSACTION](https://www.postgresql.org/docs/18/sql-prepare-transaction.html) (durable prepared state and retained locks), [RocksDB Overview](https://github.com/meta/rocksdb/wiki/RocksDB-Overview) (memtable/SST/compaction architecture) and [Microsoft cache-aside](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside) (miss fill and datastore-first invalidation). Earlier independently opened RFC 9111 and RFC 9562 support the new validation and UUID layout checks. This is a relevant-section check, not a complete reread of every course source.

### New integration findings sent to the author

1. **Should-fix — companion labs share native radio names and player identifiers.** At inspection, `AcademyPractice.tsx` qualified its heading id by model, but still used `predict-${lesson.id}` for every companion's radio name and `${lesson.id}-experiment` for every film. Selecting a prediction in one lab can uncheck the native radio in another while the latter's React `guess` remains set; multiple runs duplicate seek/SVG identifiers. Include the model in both identifiers and verify the independent lab state in the author's browser pass.
2. **Should-fix — companion lab question/takeaway inherits an unrelated mechanism.** `AcademyChapter.tsx` constructs companions with `{...lesson, model}`. `AcademyLab` reuses `lesson.question` and `lesson.rule`, so the join/UNION lab film still asks how to reject an order for a nonexistent customer and ends with a foreign-key takeaway. Give companion models truthful questions/takeaways (or model-specific neutral wording) so the result is interpreted as a query operation, not a constraint check.

### Recheck evidence and scope

`npx vitest run src/lib/learn/anatomy-refinement.test.ts src/lib/learn/experiment-model.test.ts src/lib/learn/film-model.test.ts`: **pass, 107 tests across 3 files**. This includes known query/validation/prepared/UUID cases plus all-model valid-range checks and foreign-key verdict guards. No new blocking model defect found in this bounded source recheck. The two companion integration findings above remain open as of this entry until the author records repairs/reverification.

**Rendered review remains not performed by this reviewer.** Main author owns browser validation and final QA. No all-chapter visual, accessibility, performance or learning-outcome acceptance is inferred from these source/model results.

### Companion repair confirmation — same recheck

Independently reread the final `AcademyChapter.tsx` and `AcademyPractice.tsx` changes after the author responded. Both new integration findings are **repaired in source**: prediction radio names and lab film ids now include `lesson.model`; the builder still receives the original chapter-based source id, preserving source anchors. Companion questions now name their actual compared modes, and their takeaways use the companion term definition in both worked examples and labs. No open blocking or should-fix finding remains from this bounded source/model review. The 107-test result above predates these JSX-only repairs; their rendered behavior remains assigned to the author's browser verification.
