# storage-engines: How does a write survive before its data page is updated?

Id: storage-engines · Status lives only in CURRICULUM.md.
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `storage-engines`; model `log`. This compact record references shared code to avoid loading duplicate implementations.

## Boundary

1. Explain: Write-ahead logging records a change durably before the corresponding page update is considered durable.
2. Predict the observable result after changing committed log entries or the declared policy.

Limit: This log-and-page model omits real buffering, checksums, compaction and hardware failures.
Misconception: Acknowledging a change in RAM alone proves it survives a crash.

## Concept decomposition

Hardest: connect this chapter’s rule to the actual state owner: Durable log, Data page, Recovery.
Hardest: distinguish the selected teaching policy from a production guarantee. This log-and-page model omits real buffering, checksums, compaction and hardware failures.

## Storyboard

Baseline input: Committed log entries = 6; policy: Crash before page update. The contrasting policy is Replay the durable log.

1. Append durable records: 6 committed records are assumed durable before the data page changes.
2. Crash before page update: The page remains behind; recovery can consult the durable log.
3. Inspect without replay: Without replay, the page remains behind the log.

For case chapters and capstone, `design-guides.ts` additionally owns the requirement, explicit workload arithmetic, full read/write path, failure, tradeoff and transfer challenge. The mechanism film is a zoom into one decision, not the complete architecture.

## Animation sense

Mechanism: Write-ahead logging records a change durably before the corresponding page update is considered durable.
Moving quantity: model events between the actual owning components; displayed counts and versions change only from the event trace.
Model field: simulateMechanism('log', input).beats; counts, values, from/to and outcome; sampleFilm maps trace time into visible state.
Learner predicts: one of the model’s two outcomes after selecting a changed input and policy.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; static steps and transcript retain the accessible explanation.
Research (before drawing): the relevant source sections below were read before the current mechanism implementation, on 2026-10-29.

## Asset plan

### A1. Model-driven worked example and experiment

- objective: 1, 2
- type: 3d
- object: Durable log, Data page, Recovery, displayed with recognizable service, storage and host geometry
- render: anatomy-iso
- fidelity: computed discrete event trace, quantities and outcome; scaled device geometry and playback timing; assumed finite workload, no benchmark or real network simulation
- pattern: step manipulate predict
- learner sees: before, event and after states for the chapter’s log mechanism
- animated: message translation and model-owned visible counts/values change along the causal trace; static stepping shows the committed event state
- learner does: play or step, choose an input and policy, commit a prediction, run and compare
- notice: Acknowledging a change in RAM alone proves it survives a crash.
- model: simulateMechanism in experiment-model.ts delegates topic-specific state machines to topic-models.ts when applicable
- feedback: the experiment trace supplies the film, verdict, explanatory boundaries and displayed metrics
- assumptions: This log-and-page model omits real buffering, checksums, compaction and hardware failures. Inputs are clamped to 1–8; five-second beats are display time only.
- outcome: Write-ahead logging records a change durably before the corresponding page update is considered durable.
- accessibility: keyboard transport, transcript, explicit static steps, dynamic reduced motion, HTML state summary, theme tokens and readable text
- tests: every allowed input has a selectable result, finite nonnegative quantities, deterministic seeks and known endpoints; additional misconception invariants
- evidence: source/model implementation; independent review coverage and rendered checks are recorded separately in EXPANSION_QA.md, never inferred from this spec
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/experiment-model.ts`, `src/lib/learn/topic-models.ts`, `src/lib/learn/experiment-model.test.ts`

## Tabs

- Learn: term definition, prerequisite links, model film, takeaway and worked assumptions. Cases add the whole design and workload calculation.
- Lab: changed quantity/policy, required prediction before result, computed trace and explanation.
- Quiz: a changed-input scenario, shuffled correct position, hidden feedback until commitment and an open transfer reflection.

## Explanation (14 questions)

The authored question is “How does a write survive before its data page is updated?” The rule, misconception and boundary live in the compact blueprint. The executable storyboard shows the mechanism rather than replacing it with generic packet motion. Terms are defined before the film; prerequisites are linked. Technical depth is disclosed after the short film. The changed-input quiz requires applying assumptions instead of copying the takeaway. Cases require a defended read/write path, estimate, failure and tradeoff. These are teaching aids, not empirical proof of learning outcomes or comprehensive production training.

## Visual

Shared isometric SVG renderer, genuine message endpoints and model-owned state labels. Quantities beyond the drawn mark budget keep their full numeric count and an abbreviation label. Refusal and delay are not labelled packet loss.

## Practice

Predict Page behind log or Page recovered under the selected policy. Run only after choosing. Explain which state changed and why. Recall later under a changed quantity; mixed reviews draw from prerequisite mechanisms. Optional device-local activity is separated into viewed, practiced and recall checked.

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

## Evidence

Implementation and bounded model tests are tracked in `docs/system-design/EXPANSION_QA.md`. This chapter remains implemented, not tested or verified: a full per-chapter independent review, physical-device check, screen-reader check, axe/Lighthouse and learner outcome study are not claimed.
