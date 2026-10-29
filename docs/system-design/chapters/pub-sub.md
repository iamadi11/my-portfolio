# pub-sub: How does one event reach several independent consumers?

Id: pub-sub · Status lives only in CURRICULUM.md.
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `pub-sub`; model `fanout`. This compact record references shared code to avoid loading duplicate implementations.

## Boundary

1. Explain: Publish-subscribe distributes an event to independently interested subscribers rather than assigning one shared job to only one worker.
2. Predict the observable result after changing independent subscribers or the declared policy.

Limit: Subscription durability and replay depend on the chosen broker and configuration.
Misconception: A work queue and a broadcast topic have identical delivery behavior.

## Concept decomposition

Hardest: connect this chapter’s rule to the actual state owner: Event publisher, Delivery copies, Subscriber receipts.
Hardest: distinguish the selected teaching policy from a production guarantee. Subscription durability and replay depend on the chosen broker and configuration.

## Storyboard

Baseline input: Independent subscribers = 6; policy: Deliver to one subscriber only. The contrasting policy is Deliver to every subscriber.

1. One published event: 6 independent subscribers each need their own delivery.
2. Deliver to subscriber 1: This copy serves one independent destination; it cannot stand in for another subscriber’s copy.

For case chapters and capstone, `design-guides.ts` additionally owns the requirement, explicit workload arithmetic, full read/write path, failure, tradeoff and transfer challenge. The mechanism film is a zoom into one decision, not the complete architecture.

## Animation sense

Mechanism: Publish-subscribe distributes an event to independently interested subscribers rather than assigning one shared job to only one worker.
Moving quantity: model events between the actual owning components; displayed counts and versions change only from the event trace.
Model field: simulateMechanism('fanout', input).beats; counts, values, from/to and outcome; sampleFilm maps trace time into visible state.
Learner predicts: one of the model’s two outcomes after selecting a changed input and policy.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; static steps and transcript retain the accessible explanation.
Research (before drawing): the relevant source sections below were read before the current mechanism implementation, on 2026-10-29.

## Asset plan

### A1. Model-driven worked example and experiment

- objective: 1, 2
- type: 3d
- object: Event publisher, Delivery copies, Subscriber receipts, displayed with recognizable service, storage and host geometry
- render: anatomy-iso
- fidelity: computed discrete event trace, quantities and outcome; scaled device geometry and playback timing; assumed finite workload, no benchmark or real network simulation
- pattern: step manipulate predict
- learner sees: before, event and after states for the chapter’s fanout mechanism
- animated: message translation and model-owned visible counts/values change along the causal trace; static stepping shows the committed event state
- learner does: play or step, choose an input and policy, commit a prediction, run and compare
- notice: A work queue and a broadcast topic have identical delivery behavior.
- model: simulateMechanism in experiment-model.ts delegates topic-specific state machines to topic-models.ts when applicable
- feedback: the experiment trace supplies the film, verdict, explanatory boundaries and displayed metrics
- assumptions: Subscription durability and replay depend on the chosen broker and configuration. Inputs are clamped to 2–8; five-second beats are display time only.
- outcome: Publish-subscribe distributes an event to independently interested subscribers rather than assigning one shared job to only one worker.
- accessibility: keyboard transport, transcript, explicit static steps, dynamic reduced motion, HTML state summary, theme tokens and readable text
- tests: every allowed input has a selectable result, finite nonnegative quantities, deterministic seeks and known endpoints; additional misconception invariants
- evidence: source/model implementation; independent review coverage and rendered checks are recorded separately in EXPANSION_QA.md, never inferred from this spec
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/experiment-model.ts`, `src/lib/learn/topic-models.ts`, `src/lib/learn/experiment-model.test.ts`

## Tabs

- Learn: term definition, prerequisite links, model film, takeaway and worked assumptions. Cases add the whole design and workload calculation.
- Lab: changed quantity/policy, required prediction before result, computed trace and explanation.
- Quiz: a changed-input scenario, shuffled correct position, hidden feedback until commitment and an open transfer reflection.

## Explanation (14 questions)

The authored question is “How does one event reach several independent consumers?” The rule, misconception and boundary live in the compact blueprint. The executable storyboard shows the mechanism rather than replacing it with generic packet motion. Terms are defined before the film; prerequisites are linked. Technical depth is disclosed after the short film. The changed-input quiz requires applying assumptions instead of copying the takeaway. Cases require a defended read/write path, estimate, failure and tradeoff. These are teaching aids, not empirical proof of learning outcomes or comprehensive production training.

## Visual

Shared isometric SVG renderer, genuine message endpoints and model-owned state labels. Quantities beyond the drawn mark budget keep their full numeric count and an abbreviation label. Refusal and delay are not labelled packet loss.

## Practice

Predict Some subscribers missed or Every subscriber received under the selected policy. Run only after choosing. Explain which state changed and why. Recall later under a changed quantity; mixed reviews draw from prerequisite mechanisms. Optional device-local activity is separated into viewed, practiced and recall checked.

## Sources

- id: rabbit
title: RabbitMQ confirms and acknowledgments
url: https://www.rabbitmq.com/docs/confirms
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Publisher confirms, consumer acknowledgments and redelivery.

- id: kafka
title: Apache Kafka 4.1 design
url: https://kafka.apache.org/41/design/design/
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Partition logs, consumer position and delivery semantics.

- id: rabbit-fanout
title: RabbitMQ publish/subscribe tutorial
url: https://www.rabbitmq.com/tutorials/tutorial-three-javascript
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: independent consumers, fanout exchanges and delivery to each bound queue.

## Evidence

Implementation and bounded model tests are tracked in `docs/system-design/EXPANSION_QA.md`. This chapter remains implemented, not tested or verified: a full per-chapter independent review, physical-device check, screen-reader check, axe/Lighthouse and learner outcome study are not claimed.
