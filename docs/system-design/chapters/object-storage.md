# object-storage: Where should an application put a large uploaded file?

Id: object-storage · Status lives only in CURRICULUM.md.
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `object-storage`; model `upload`. This compact record references shared code to avoid loading duplicate implementations.

## Boundary

1. Explain: Store object bytes under a key and keep application metadata and access rules separately coordinated.
2. Predict the observable result after changing chunks needed for object or the declared policy.

Limit: A durable object does not make metadata updates and object writes one atomic transaction.
Misconception: A successful metadata write proves the file upload also completed.

## Concept decomposition

Hardest: connect this chapter’s rule to the actual state owner: Upload session, Object bytes, Published metadata.
Hardest: distinguish the selected teaching policy from a production guarantee. A durable object does not make metadata updates and object writes one atomic transaction.

## Storyboard

Baseline input: Chunks needed for object = 4; policy: Publish metadata before upload. The contrasting policy is Publish after completed upload.

1. Reserve object key: Object photo/42 requires 4 chunks. The final chunk will fail.
2. Publish too early: Metadata points to an object that is not yet complete.
3. Upload chunk 1: Partial upload bytes are not a complete object.
4. Upload chunk 2: Partial upload bytes are not a complete object.
5. Upload chunk 3: Partial upload bytes are not a complete object.
6. Final chunk fails: A reader follows published metadata to missing object bytes.

For case chapters and capstone, `design-guides.ts` additionally owns the requirement, explicit workload arithmetic, full read/write path, failure, tradeoff and transfer challenge. The mechanism film is a zoom into one decision, not the complete architecture.

## Animation sense

Mechanism: Store object bytes under a key and keep application metadata and access rules separately coordinated.
Moving quantity: model events between the actual owning components; displayed counts and versions change only from the event trace.
Model field: simulateMechanism('upload', input).beats; counts, values, from/to and outcome; sampleFilm maps trace time into visible state.
Learner predicts: one of the model’s two outcomes after selecting a changed input and policy.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; static steps and transcript retain the accessible explanation.
Research (before drawing): the relevant source sections below were read before the current mechanism implementation, on 2026-10-29.

## Asset plan

### A1. Model-driven worked example and experiment

- objective: 1, 2
- type: 3d
- object: Upload session, Object bytes, Published metadata, displayed with recognizable service, storage and host geometry
- render: anatomy-iso
- fidelity: computed discrete event trace, quantities and outcome; scaled device geometry and playback timing; assumed finite workload, no benchmark or real network simulation
- pattern: step manipulate predict
- learner sees: before, event and after states for the chapter’s upload mechanism
- animated: message translation and model-owned visible counts/values change along the causal trace; static stepping shows the committed event state
- learner does: play or step, choose an input and policy, commit a prediction, run and compare
- notice: A successful metadata write proves the file upload also completed.
- model: simulateMechanism in experiment-model.ts delegates topic-specific state machines to topic-models.ts when applicable
- feedback: the experiment trace supplies the film, verdict, explanatory boundaries and displayed metrics
- assumptions: A durable object does not make metadata updates and object writes one atomic transaction. Inputs are clamped to 2–8; five-second beats are display time only.
- outcome: Store object bytes under a key and keep application metadata and access rules separately coordinated.
- accessibility: keyboard transport, transcript, explicit static steps, dynamic reduced motion, HTML state summary, theme tokens and readable text
- tests: every allowed input has a selectable result, finite nonnegative quantities, deterministic seeks and known endpoints; additional misconception invariants
- evidence: source/model implementation; independent review coverage and rendered checks are recorded separately in EXPANSION_QA.md, never inferred from this spec
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/experiment-model.ts`, `src/lib/learn/topic-models.ts`, `src/lib/learn/experiment-model.test.ts`

## Tabs

- Learn: term definition, prerequisite links, model film, takeaway and worked assumptions. Cases add the whole design and workload calculation.
- Lab: changed quantity/policy, required prediction before result, computed trace and explanation.
- Quiz: a changed-input scenario, shuffled correct position, hidden feedback until commitment and an open transfer reflection.

## Explanation (14 questions)

The authored question is “Where should an application put a large uploaded file?” The rule, misconception and boundary live in the compact blueprint. The executable storyboard shows the mechanism rather than replacing it with generic packet motion. Terms are defined before the film; prerequisites are linked. Technical depth is disclosed after the short film. The changed-input quiz requires applying assumptions instead of copying the takeaway. Cases require a defended read/write path, estimate, failure and tradeoff. These are teaching aids, not empirical proof of learning outcomes or comprehensive production training.

## Visual

Shared isometric SVG renderer, genuine message endpoints and model-owned state labels. Quantities beyond the drawn mark budget keep their full numeric count and an abbreviation label. Refusal and delay are not labelled packet loss.

## Practice

Predict Dangling metadata exposed or Incomplete upload hidden under the selected policy. Run only after choosing. Explain which state changed and why. Recall later under a changed quantity; mixed reviews draw from prerequisite mechanisms. Optional device-local activity is separated into viewed, practiced and recall checked.

## Sources

- id: s3
title: Amazon S3 overview
url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Object keys, object data and storage boundaries.

## Evidence

Implementation and bounded model tests are tracked in `docs/system-design/EXPANSION_QA.md`. This chapter remains implemented, not tested or verified: a full per-chapter independent review, physical-device check, screen-reader check, axe/Lighthouse and learner outcome study are not claimed.
