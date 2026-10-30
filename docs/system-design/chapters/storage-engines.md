# storage-engines: Where does a database put a write, and how can it recover after a crash?

Id: storage-engines · Stage: 3 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: relational-model latency-numbers
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `storage-engines`; model `storageLayout` and companion `log`.

## Boundary

1. Contrast a B-tree leaf update with buffering and flushing an LSM sorted run.
2. Locate a later read through a tree or across candidate LSM structures without treating the illustration as an I/O benchmark.
3. Predict the state of a data page after a crash before page update, then after replay of the durable committed log.

In scope: A1 teaches layout; A2 teaches crash/replay. Real compaction policy, torn writes, checksums and hardware failures are outside both models.
Limit: These separate layout and recovery models omit real buffering, checksums, compaction, torn writes and hardware failures.
Misconception: Acknowledging a change in RAM alone proves it survives a crash.

## Concept decomposition

Mechanism: B-trees update sorted pages; LSM designs buffer writes and flush sorted runs. A durable write-ahead log supports recovery before data pages catch up.
Temporal behavior: event traces own component values, counts, direction and results; display time is independent of simulated state.
Quantitative relations: values below are finite teaching assumptions, not measured performance.
Hardest: Separate the physical write layout from recovery: a sorted file is not a substitute for a durable log (A1/A2).
Hardest: Keep acknowledgement and page persistence separate: recovery can redo a durable record before the page has caught up (A2).

## Parts you will meet

Page: a block managed by the database. WAL: durable change records used for recovery. Memtable: the mutable in-memory ordered structure in this LSM example. Sorted run: a persisted ordered file of entries.

## Storyboard

Baseline: Key to update = 6; “B-tree leaf update”. Comparison: “LSM buffer and flush”.
1. Record recoverable update: Illustrative key 6 receives a new value. Assume its write-ahead record is durable before acknowledgment.
2. Update mutable structure: Locate leaf [5..8] through the B-tree and change that leaf page in memory.
3. Persist data structure: Write the dirty leaf page to durable storage under the recovery protocol.
4. Locate a later read: Follow tree separators to the leaf containing the key.

Recovery companion: assume committed log records are durable; crash before page update; inspect the behind page; replay the same records and compare the recovered page count. Layout and recovery are two views, not competing policies.

## Animation sense

Mechanism: B-trees update sorted pages; LSM designs buffer writes and flush sorted runs. A durable write-ahead log supports recovery before data pages catch up.
Moving quantity: WAL, Mutable structure, Durable pages / runs; event messages explain each state transition, not decoration.
Model field: simulateMechanism('storageLayout', input).beats; sampleFilm derives a legal frame from that trace.
Learner predicts: Leaf page updated or Sorted run written, then explains the relevant assumption.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; complete static steps and transcript preserve its accessible explanation.
Research (before drawing): primary records below retain their actual earlier access dates; this reconciliation adds no claim that every source was reopened. NGINX methods/health and PostgreSQL WAL were reopened in the 2026-10-30 mission audit.

## Asset plan

### A1. Causal comparison and experiment

- objective: 1, 2
- type: 3d
- object: WAL, Mutable structure, Durable pages / runs, shown as named components using shared recognizable hardware
- render: anatomy-iso
- fidelity: computed trace/counts/values; scaled isometric geometry; assumed workload and playback timing; no latency or throughput benchmark
- pattern: step manipulate predict compare
- learner sees: Page: a block managed by the database. WAL: durable change records used for recovery. Memtable: the mutable in-memory ordered structure in this LSM example. Sorted run: a persisted ordered file of entries.
- animated: a model message travels between explicit component ports; arrival commits its owned state; refusals and timeouts do not become packet loss
- learner does: play, pause, seek, step, compare the policies, change inputs, commit a prediction, run and reset
- notice: Separate the physical write layout from recovery: a sorted file is not a substitute for a durable log (A1/A2).
- model: simulateMechanism('storageLayout', {amount, alternative}); amount 1–8, default 6; modes: B-tree leaf update / LSM buffer and flush.
- feedback: trace-derived outcome, explanation, visible state and metrics are shown only after the prediction
- assumptions: A1 teaches layout; A2 teaches crash/replay. Real compaction policy, torn writes, checksums and hardware failures are outside both models. Beat lengths are caption-dependent playback durations from paceFilm, never real system timing.
- outcome: B-trees update sorted pages; LSM designs buffer writes and flush sorted runs. A durable write-ahead log supports recovery before data pages catch up.
- accessibility: keyboard controls, transcript, HTML state summary, static steps, reduced motion and theme-aware geometry
- tests: finite-input invariants and misconception counterexamples; current report separates these from browser acceptance
- evidence: source/model correspondence recorded in MISSION_COURSE_AUDIT.md; no independent rendered acceptance inferred
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/topic-models.ts`, `src/lib/learn/anatomy-refinement.test.ts`

### A2. Crash and recover the page

- objective: 3
- type: 3d
- object: durable log, data page and recovery controller using shared hardware
- render: anatomy-iso
- fidelity: computed committed-record and applied-page counts; assumed durable log and simplified crash; scaled geometry
- pattern: step manipulate predict compare
- learner sees: durable records with no applied page updates after a crash
- animated: replay transfers the retained changes to the page; a crash does not erase the durable log
- learner does: change committed records1–8, predict before running, compare no replay with replay
- notice: acknowledged durability and page freshness are separate states
- model: simulateMechanism('log', input), registered as storage-engines companion in COMPANION_MODELS
- feedback: durable records versus applied page updates and the actual recovered/behind outcome
- assumptions: all modeled committed records are already durable; no corrupt log, partial record, torn page or repeated recovery cycle
- outcome: replay reconstructs missing page state from durable committed log records
- accessibility: same player controls, static steps, transcript and HTML quantities as A1
- tests: finite log model and companion-film coverage invariants
- evidence: PostgreSQL WAL section and the source-only mission audit; rendered acceptance is separate
- built: `src/components/learn/AcademyChapter.tsx`, `src/lib/learn/experiment-model.ts`, `src/lib/learn/experiment-model.test.ts`, `src/lib/learn/anatomy-refinement.test.ts`

## Tabs

- Learn: visual worked comparison, prerequisites and concise rule; deeper assumptions remain disclosed.
- Lab: UI label **Explore**; commit a prediction, change an actual input/policy, run, inspect the trace and reset.
- Quiz: UI label **Assess**; commit scenario answers before feedback; scores and revisit links reflect this attempt only; open transfer remains self-assessed.

## Explanation (14 questions)

1. **Problem:** A database acknowledges a write before every data page is current.
2. **Why it matters:** Losing an acknowledged update breaks a user’s expectation of durability.
3. **First attempt:** Change a page in RAM and report success.
4. **When it works:** RAM can answer later reads while the process stays alive.
5. **Failure:** A crash discards the RAM state before a durable page write.
6. **Closer observation:** Compare the durable log with the applied-page count, not the number of animations played.
7. **Mechanism:** A1 contrasts tree leaves with buffered sorted runs; A2 replays assumed-durable committed records.
8. **Experiment:** Choose key 1–8 and layout in A1; choose committed-record count and replay policy in A2.
9. **Alternatives:** B-tree and LSM are layout alternatives; WAL recovery is a separate responsibility.
10. **Tradeoffs:** Tree page updates and LSM buffering/compaction move costs differently; this model measures no amplification.
11. **Choose it when:** Choose from real access patterns, update frequency and recovery requirements.
12. **Do not infer:** Do not choose storage from a single illustrative write or assume volatile buffering proves durability.
13. **In your own words:** Explain how a change can be durable while its data page is behind.
14. **Transfer:** Apply the same log-before-derived-state reasoning to rebuilding a service projection.

## Visual

A frozen frame must agree with trace state. Device anatomy identifies the state owner; small details are not protocol events. Counts remain exact even where marks are abbreviated. No depth, light or motion effect changes the model verdict.

## Practice

Commit to a prediction, inspect the changed state, then answer: Explain how a change can be durable while its data page is behind.
Transfer: Apply the same log-before-derived-state reasoning to rebuilding a service projection.
Assess recommendations come from missed committed scenarios, including registered companion mechanisms. They are deterministic guidance, not inferred mastery.

## Sources

- id: pg-storage
title: PostgreSQL 18 page layout
url: https://www.postgresql.org/docs/18/storage-page-layout.html
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Pages, item pointers and stored tuples.

- id: pg-wal
title: PostgreSQL 18 write-ahead logging
url: https://www.postgresql.org/docs/18/wal-intro.html
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Log-before-page durability and crash recovery.

- id: rocks-layout
title: RocksDB overview
url: https://github.com/meta/rocksdb/wiki/RocksDB-Overview
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-30; Memtables, immutable sorted files, flush and compaction.

- id: pg-index
title: PostgreSQL 18 index types
url: https://www.postgresql.org/docs/18/indexes-types.html
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: B-tree access and supported comparisons.

## Evidence

This author record was reconciled with the actual model/controls in the 2026-10-30 mission. Status remains implemented. Unit/model evidence and browser results belong in the mission audit/QA reports; a spec rewrite does not establish independent technical acceptance, physical-device accessibility or learner outcomes.
