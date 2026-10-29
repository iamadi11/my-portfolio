# choosing-a-database: How do you choose storage before choosing a brand?

Id: choosing-a-database · Status lives only in CURRICULUM.md.
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `choosing-a-database`; model `storageChoice`. This compact record references shared code to avoid loading duplicate implementations.

## Boundary

1. Explain: Start with access patterns, constraints and failure requirements, then compare storage models against them.
2. Predict the observable result after changing related rows in atomic update or the declared policy.

Limit: One product label cannot determine consistency, cost and operational behavior for every deployment.
Misconception: The database with the most features is always the right choice.

## Concept decomposition

Hardest: connect this chapter’s rule to the actual state owner: Atomic row requirement, Selected storage, Decision record.
Hardest: distinguish the selected teaching policy from a production guarantee. One product label cannot determine consistency, cost and operational behavior for every deployment.

## Storyboard

Baseline input: Related rows in atomic update = 4; policy: Choose object bytes only. The contrasting policy is Choose transactional row store.

1. State the invariant: All 4 related row changes must commit or roll back together.
2. Match the capability: An object API writes bytes under keys; that alone does not supply the required multi-row transaction.
3. Record consequence: The required invariant needs additional coordination or another storage boundary.

For case chapters and capstone, `design-guides.ts` additionally owns the requirement, explicit workload arithmetic, full read/write path, failure, tradeoff and transfer challenge. The mechanism film is a zoom into one decision, not the complete architecture.

## Animation sense

Mechanism: Start with access patterns, constraints and failure requirements, then compare storage models against them.
Moving quantity: model events between the actual owning components; displayed counts and versions change only from the event trace.
Model field: simulateMechanism('storageChoice', input).beats; counts, values, from/to and outcome; sampleFilm maps trace time into visible state.
Learner predicts: one of the model’s two outcomes after selecting a changed input and policy.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; static steps and transcript retain the accessible explanation.
Research (before drawing): the relevant source sections below were read before the current mechanism implementation, on 2026-10-29.

## Asset plan

### A1. Model-driven worked example and experiment

- objective: 1, 2
- type: 3d
- object: Atomic row requirement, Selected storage, Decision record, displayed with recognizable service, storage and host geometry
- render: anatomy-iso
- fidelity: computed discrete event trace, quantities and outcome; scaled device geometry and playback timing; assumed finite workload, no benchmark or real network simulation
- pattern: step manipulate predict
- learner sees: before, event and after states for the chapter’s storageChoice mechanism
- animated: message translation and model-owned visible counts/values change along the causal trace; static stepping shows the committed event state
- learner does: play or step, choose an input and policy, commit a prediction, run and compare
- notice: The database with the most features is always the right choice.
- model: simulateMechanism in experiment-model.ts delegates topic-specific state machines to topic-models.ts when applicable
- feedback: the experiment trace supplies the film, verdict, explanatory boundaries and displayed metrics
- assumptions: One product label cannot determine consistency, cost and operational behavior for every deployment. Inputs are clamped to 2–8; five-second beats are display time only.
- outcome: Start with access patterns, constraints and failure requirements, then compare storage models against them.
- accessibility: keyboard transport, transcript, explicit static steps, dynamic reduced motion, HTML state summary, theme tokens and readable text
- tests: every allowed input has a selectable result, finite nonnegative quantities, deterministic seeks and known endpoints; additional misconception invariants
- evidence: source/model implementation; independent review coverage and rendered checks are recorded separately in EXPANSION_QA.md, never inferred from this spec
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/experiment-model.ts`, `src/lib/learn/topic-models.ts`, `src/lib/learn/experiment-model.test.ts`

## Tabs

- Learn: term definition, prerequisite links, model film, takeaway and worked assumptions. Cases add the whole design and workload calculation.
- Lab: changed quantity/policy, required prediction before result, computed trace and explanation.
- Quiz: a changed-input scenario, shuffled correct position, hidden feedback until commitment and an open transfer reflection.

## Explanation (14 questions)

The authored question is “How do you choose storage before choosing a brand?” The rule, misconception and boundary live in the compact blueprint. The executable storyboard shows the mechanism rather than replacing it with generic packet motion. Terms are defined before the film; prerequisites are linked. Technical depth is disclosed after the short film. The changed-input quiz requires applying assumptions instead of copying the takeaway. Cases require a defended read/write path, estimate, failure and tradeoff. These are teaching aids, not empirical proof of learning outcomes or comprehensive production training.

## Visual

Shared isometric SVG renderer, genuine message endpoints and model-owned state labels. Quantities beyond the drawn mark budget keep their full numeric count and an abbreviation label. Refusal and delay are not labelled packet loss.

## Practice

Predict Required invariant unsupported or Required invariant supported under the selected policy. Run only after choosing. Explain which state changed and why. Recall later under a changed quantity; mixed reviews draw from prerequisite mechanisms. Optional device-local activity is separated into viewed, practiced and recall checked.

## Sources

- id: pg-tx
title: PostgreSQL 18 transaction tutorial
url: https://www.postgresql.org/docs/18/tutorial-transactions.html
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Atomic grouped changes, commit and rollback.

- id: mongo
title: MongoDB data modelling
url: https://www.mongodb.com/docs/manual/data-modeling/
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Embedding, references and access patterns.

- id: s3
title: Amazon S3 overview
url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Object keys, object data and storage boundaries.

## Evidence

Implementation and bounded model tests are tracked in `docs/system-design/EXPANSION_QA.md`. This chapter remains implemented, not tested or verified: a full per-chapter independent review, physical-device check, screen-reader check, axe/Lighthouse and learner outcome study are not claimed.
