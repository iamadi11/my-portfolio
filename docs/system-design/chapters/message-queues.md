# message-queues: What happens to work when a worker crashes before acknowledging it?

Id: message-queues · Status lives only in CURRICULUM.md.
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `message-queues`; model `redelivery`. This compact record references shared code to avoid loading duplicate implementations.

## Boundary

1. Explain: A broker can keep work pending until acknowledgment and redeliver under the selected policy.
2. Predict the observable result after changing replacement work requests after a crash or the declared policy.

Limit: Redelivery can repeat an effect; acknowledgments and side effects need coordinated design.
Misconception: Receiving a message once guarantees its effect executes exactly once.

## Concept decomposition

Hardest: connect this chapter’s rule to the actual state owner: Broker, Worker, Durable effects.
Hardest: distinguish the selected teaching policy from a production guarantee. Redelivery can repeat an effect; acknowledgments and side effects need coordinated design.

## Storyboard

Baseline input: Replacement work requests after a crash = 3. Policies: acknowledge before processing versus retain the obligation until durable processing finishes.

1. A ready worker receives one job; delivery and durable effect are separate states.
2. Under early acknowledgment, the broker drops its obligation before that worker crashes. A live replacement makes three work requests and receives empty results.
3. Under late acknowledgment, channel closure requeues the job. Before every replacement delivery, the trace starts a live replacement and records its work request.
4. Every receiving replacement crashes before saving an effect or acknowledging; the same one obligation remains. Three replacements therefore add three actual deliveries but no saved effects.

This intentionally repeated-failure run illustrates retention, not successful completion or a guarantee of progress. Broker availability, connection-closure detection and successful requeue are assumptions. A crash after durable effect but before acknowledgment is a different duplicate-effect example.

For case chapters and capstone, `design-guides.ts` additionally owns the requirement, explicit workload arithmetic, full read/write path, failure, tradeoff and transfer challenge. The mechanism film is a zoom into one decision, not the complete architecture.

## Animation sense

Mechanism: A broker can keep work pending until acknowledgment and redeliver under the selected policy.
Moving quantity: model events between the actual owning components; displayed counts and versions change only from the event trace.
Model field: simulateMechanism('redelivery', input).beats; counts, values, from/to and outcome; sampleFilm maps trace time into visible state.
Learner predicts: one of the model’s two outcomes after selecting a changed input and policy.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; static steps and transcript retain the accessible explanation.
Research (before drawing): the relevant source sections below were read before the current mechanism implementation, on 2026-10-29.

## Asset plan

### A1. Model-driven worked example and experiment

- objective: 1, 2
- type: 3d
- object: Broker, Worker, Durable effects, displayed with recognizable service, storage and host geometry
- render: anatomy-iso
- fidelity: computed discrete event trace, quantities and outcome; scaled device geometry and playback timing; assumed finite workload, no benchmark or real network simulation
- pattern: step manipulate predict
- learner sees: before, event and after states for the chapter’s redelivery mechanism
- animated: message translation and model-owned visible counts/values change along the causal trace; static stepping shows the committed event state
- learner does: play or step, choose an input and policy, commit a prediction, run and compare
- notice: Receiving a message once guarantees its effect executes exactly once.
- model: simulateMechanism in experiment-model.ts delegates topic-specific state machines to topic-models.ts when applicable
- feedback: the experiment trace supplies the film, verdict, explanatory boundaries and displayed metrics
- assumptions: Redelivery can repeat an effect; acknowledgments and side effects need coordinated design. Inputs are clamped to 1–4; player seconds are display time only. Channel closure requeues unacknowledged work; every actual job delivery requires a live receiver.
- outcome: A broker can keep work pending until acknowledgment and redeliver under the selected policy.
- accessibility: keyboard transport, transcript, explicit static steps, dynamic reduced motion, HTML state summary, theme tokens and readable text
- tests: every allowed input has a selectable result, finite nonnegative quantities, deterministic seeks and known endpoints; additional misconception invariants
- evidence: source/model implementation; independent review coverage and rendered checks are recorded separately in EXPANSION_QA.md, never inferred from this spec
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/experiment-model.ts`, `src/lib/learn/topic-models.ts`, `src/lib/learn/experiment-model.test.ts`

## Tabs

- Learn: term definition, prerequisite links, model film, takeaway and worked assumptions. Cases add the whole design and workload calculation.
- Explore: changed quantity/policy, required prediction before result, computed trace and explanation.
- Assess: a changed-input scenario, shuffled correct position, hidden feedback until commitment and an open transfer reflection.

## Explanation (14 questions)

The authored question is “What happens to work when a worker crashes before acknowledging it?” The rule, misconception and boundary live in the compact blueprint. The executable storyboard shows the mechanism rather than replacing it with generic packet motion. Terms are defined before the film; prerequisites are linked. Technical depth is disclosed after the short film. The changed-input quiz requires applying assumptions instead of copying the takeaway. Cases require a defended read/write path, estimate, failure and tradeoff. These are teaching aids, not empirical proof of learning outcomes or comprehensive production training.

## Visual

Shared isometric SVG renderer, genuine message endpoints and model-owned state labels. Quantities beyond the drawn mark budget keep their full numeric count and an abbreviation label. Refusal and delay are not labelled packet loss.

## Practice

Predict Work lost after early ack or Work retained for redelivery under the selected policy. Run only after choosing. Explain which state changed and why. Recall later under a changed quantity; mixed reviews draw from prerequisite mechanisms. Optional device-local activity is separated into viewed, practiced and recall checked.

## Sources

- id: rabbit
title: RabbitMQ confirms and acknowledgments
url: https://www.rabbitmq.com/docs/confirms
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Publisher confirms, consumer acknowledgments and redelivery.

## Evidence

Implementation and bounded model tests are tracked in `docs/system-design/EXPANSION_QA.md`. This chapter remains implemented, not tested or verified: a full per-chapter independent review, physical-device check, screen-reader check, axe/Lighthouse and learner outcome study are not claimed.

## Mission repair M2

Removed arrivals at a worker kept crashed. The model explicitly starts each receiving replacement before delivery; early acknowledgment produces empty broker responses instead of invented jobs. The quantity controls actual work requests under both policies. `src/lib/learn/redelivery.test.ts` checks legal intermediate receiver states, retained obligations, delivery counts, repeated failures and early-ack loss across all bounded inputs. Primary RabbitMQ source was reread 2026-10-30, section “When Consumers Fail or Lose Connection: Automatic Requeueing”. Rendered acceptance remains separate.
