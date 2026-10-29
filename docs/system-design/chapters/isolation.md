# isolation: Can two individually correct updates lose one increment?

Id: isolation · Status lives only in CURRICULUM.md.
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `isolation`; model `isolation`. This compact record references shared code to avoid loading duplicate implementations.

## Boundary

1. Explain: Concurrent read-modify-write operations can overwrite one another unless the chosen coordination prevents that anomaly.
2. Predict the observable result after changing starting counter value or the declared policy.

Limit: Isolation guarantees are engine-specific; serializable transactions may need retries.
Misconception: A transaction boundary alone prevents every concurrency anomaly.

## Concept decomposition

Hardest: connect this chapter’s rule to the actual state owner: Writer A, Writer B, Stored counter.
Hardest: distinguish the selected teaching policy from a production guarantee. Isolation guarantees are engine-specific; serializable transactions may need retries.

## Storyboard

Baseline input: Starting counter value = 6; policy: Unprotected read-modify-write. The contrasting policy is Serialize both increments.

1. Two writers start: Both operations intend to increment one counter.
2. First increment: The first writer stores 7.
3. Second increment: The second writer stores a value computed from its earlier stale read.

For case chapters and capstone, `design-guides.ts` additionally owns the requirement, explicit workload arithmetic, full read/write path, failure, tradeoff and transfer challenge. The mechanism film is a zoom into one decision, not the complete architecture.

## Animation sense

Mechanism: Concurrent read-modify-write operations can overwrite one another unless the chosen coordination prevents that anomaly.
Moving quantity: model events between the actual owning components; displayed counts and versions change only from the event trace.
Model field: simulateMechanism('isolation', input).beats; counts, values, from/to and outcome; sampleFilm maps trace time into visible state.
Learner predicts: one of the model’s two outcomes after selecting a changed input and policy.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; static steps and transcript retain the accessible explanation.
Research (before drawing): the relevant source sections below were read before the current mechanism implementation, on 2026-10-29.

## Asset plan

### A1. Model-driven worked example and experiment

- objective: 1, 2
- type: 3d
- object: Writer A, Writer B, Stored counter, displayed with recognizable service, storage and host geometry
- render: anatomy-iso
- fidelity: computed discrete event trace, quantities and outcome; scaled device geometry and playback timing; assumed finite workload, no benchmark or real network simulation
- pattern: step manipulate predict
- learner sees: before, event and after states for the chapter’s isolation mechanism
- animated: message translation and model-owned visible counts/values change along the causal trace; static stepping shows the committed event state
- learner does: play or step, choose an input and policy, commit a prediction, run and compare
- notice: A transaction boundary alone prevents every concurrency anomaly.
- model: simulateMechanism in experiment-model.ts delegates topic-specific state machines to topic-models.ts when applicable
- feedback: the experiment trace supplies the film, verdict, explanatory boundaries and displayed metrics
- assumptions: Isolation guarantees are engine-specific; serializable transactions may need retries. Inputs are clamped to 1–8; five-second beats are display time only.
- outcome: Concurrent read-modify-write operations can overwrite one another unless the chosen coordination prevents that anomaly.
- accessibility: keyboard transport, transcript, explicit static steps, dynamic reduced motion, HTML state summary, theme tokens and readable text
- tests: every allowed input has a selectable result, finite nonnegative quantities, deterministic seeks and known endpoints; additional misconception invariants
- evidence: source/model implementation; independent review coverage and rendered checks are recorded separately in EXPANSION_QA.md, never inferred from this spec
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/experiment-model.ts`, `src/lib/learn/topic-models.ts`, `src/lib/learn/experiment-model.test.ts`

## Tabs

- Learn: term definition, prerequisite links, model film, takeaway and worked assumptions. Cases add the whole design and workload calculation.
- Lab: changed quantity/policy, required prediction before result, computed trace and explanation.
- Quiz: a changed-input scenario, shuffled correct position, hidden feedback until commitment and an open transfer reflection.

## Explanation (14 questions)

The authored question is “Can two individually correct updates lose one increment?” The rule, misconception and boundary live in the compact blueprint. The executable storyboard shows the mechanism rather than replacing it with generic packet motion. Terms are defined before the film; prerequisites are linked. Technical depth is disclosed after the short film. The changed-input quiz requires applying assumptions instead of copying the takeaway. Cases require a defended read/write path, estimate, failure and tradeoff. These are teaching aids, not empirical proof of learning outcomes or comprehensive production training.

## Visual

Shared isometric SVG renderer, genuine message endpoints and model-owned state labels. Quantities beyond the drawn mark budget keep their full numeric count and an abbreviation label. Refusal and delay are not labelled packet loss.

## Practice

Predict One increment lost or Both increments kept under the selected policy. Run only after choosing. Explain which state changed and why. Recall later under a changed quantity; mixed reviews draw from prerequisite mechanisms. Optional device-local activity is separated into viewed, practiced and recall checked.

## Sources

- id: pg-isolation
title: PostgreSQL 18 isolation
url: https://www.postgresql.org/docs/18/transaction-iso.html
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Isolation phenomena and serializable retries.

## Evidence

Implementation and bounded model tests are tracked in `docs/system-design/EXPANSION_QA.md`. This chapter remains implemented, not tested or verified: a full per-chapter independent review, physical-device check, screen-reader check, axe/Lighthouse and learner outcome study are not claimed.
