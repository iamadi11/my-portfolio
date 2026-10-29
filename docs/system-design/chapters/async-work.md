# async-work: When should a request wait for work and when should it enqueue it?

Id: async-work · Status lives only in CURRICULUM.md.
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `async-work`; model `queue`. This compact record references shared code to avoid loading duplicate implementations.

## Boundary

1. Explain: Asynchronous acceptance separates receiving a task from completing its effect.
2. Predict the observable result after changing jobs arriving in one window or the declared policy.

Limit: Accepted is not completed; callers need status, error handling and bounded backlog.
Misconception: A 202-style acceptance means the requested work already succeeded.

## Concept decomposition

Hardest: connect this chapter’s rule to the actual state owner: Pending jobs, Completed jobs, Workers.
Hardest: distinguish the selected teaching policy from a production guarantee. Accepted is not completed; callers need status, error handling and bounded backlog.

## Storyboard

Baseline input: Jobs arriving in one window = 6; policy: One worker; 3 jobs per window. The contrasting policy is Two workers; 6 jobs per window.

1. Arrival burst: 6 jobs arrive in one illustrative service window.
2. Complete job 1: One job leaves the queue only when the model completes it.
3. Complete job 2: One job leaves the queue only when the model completes it.
4. Complete job 3: One job leaves the queue only when the model completes it.

For case chapters and capstone, `design-guides.ts` additionally owns the requirement, explicit workload arithmetic, full read/write path, failure, tradeoff and transfer challenge. The mechanism film is a zoom into one decision, not the complete architecture.

## Animation sense

Mechanism: Asynchronous acceptance separates receiving a task from completing its effect.
Moving quantity: model events between the actual owning components; displayed counts and versions change only from the event trace.
Model field: simulateMechanism('queue', input).beats; counts, values, from/to and outcome; sampleFilm maps trace time into visible state.
Learner predicts: one of the model’s two outcomes after selecting a changed input and policy.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; static steps and transcript retain the accessible explanation.
Research (before drawing): the relevant source sections below were read before the current mechanism implementation, on 2026-10-29.

## Asset plan

### A1. Model-driven worked example and experiment

- objective: 1, 2
- type: 3d
- object: Pending jobs, Completed jobs, Workers, displayed with recognizable service, storage and host geometry
- render: anatomy-iso
- fidelity: computed discrete event trace, quantities and outcome; scaled device geometry and playback timing; assumed finite workload, no benchmark or real network simulation
- pattern: step manipulate predict
- learner sees: before, event and after states for the chapter’s queue mechanism
- animated: message translation and model-owned visible counts/values change along the causal trace; static stepping shows the committed event state
- learner does: play or step, choose an input and policy, commit a prediction, run and compare
- notice: A 202-style acceptance means the requested work already succeeded.
- model: simulateMechanism in experiment-model.ts delegates topic-specific state machines to topic-models.ts when applicable
- feedback: the experiment trace supplies the film, verdict, explanatory boundaries and displayed metrics
- assumptions: Accepted is not completed; callers need status, error handling and bounded backlog. Inputs are clamped to 1–8; five-second beats are display time only.
- outcome: Asynchronous acceptance separates receiving a task from completing its effect.
- accessibility: keyboard transport, transcript, explicit static steps, dynamic reduced motion, HTML state summary, theme tokens and readable text
- tests: every allowed input has a selectable result, finite nonnegative quantities, deterministic seeks and known endpoints; additional misconception invariants
- evidence: source/model implementation; independent review coverage and rendered checks are recorded separately in EXPANSION_QA.md, never inferred from this spec
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/experiment-model.ts`, `src/lib/learn/topic-models.ts`, `src/lib/learn/experiment-model.test.ts`

## Tabs

- Learn: term definition, prerequisite links, model film, takeaway and worked assumptions. Cases add the whole design and workload calculation.
- Lab: changed quantity/policy, required prediction before result, computed trace and explanation.
- Quiz: a changed-input scenario, shuffled correct position, hidden feedback until commitment and an open transfer reflection.

## Explanation (14 questions)

The authored question is “When should a request wait for work and when should it enqueue it?” The rule, misconception and boundary live in the compact blueprint. The executable storyboard shows the mechanism rather than replacing it with generic packet motion. Terms are defined before the film; prerequisites are linked. Technical depth is disclosed after the short film. The changed-input quiz requires applying assumptions instead of copying the takeaway. Cases require a defended read/write path, estimate, failure and tradeoff. These are teaching aids, not empirical proof of learning outcomes or comprehensive production training.

## Visual

Shared isometric SVG renderer, genuine message endpoints and model-owned state labels. Quantities beyond the drawn mark budget keep their full numeric count and an abbreviation label. Refusal and delay are not labelled packet loss.

## Practice

Predict Backlog remains or Backlog drained under the selected policy. Run only after choosing. Explain which state changed and why. Recall later under a changed quantity; mixed reviews draw from prerequisite mechanisms. Optional device-local activity is separated into viewed, practiced and recall checked.

## Sources

- id: sre-overload
title: Google SRE handling overload
url: https://sre.google/sre-book/handling-overload/
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Admission control, queues and capacity.

- id: rabbit
title: RabbitMQ confirms and acknowledgments
url: https://www.rabbitmq.com/docs/confirms
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Publisher confirms, consumer acknowledgments and redelivery.

## Evidence

Implementation and bounded model tests are tracked in `docs/system-design/EXPANSION_QA.md`. This chapter remains implemented, not tested or verified: a full per-chapter independent review, physical-device check, screen-reader check, axe/Lighthouse and learner outcome study are not claimed.
