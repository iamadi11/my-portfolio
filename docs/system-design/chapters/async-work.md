# async-work: When should a request wait for work and when should it enqueue it?

Id: async-work · Stage: 6 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: utilisation-queueing stateless-services
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `async-work`; model `communication`.

## Boundary

1. Distinguish an accepted reply from a completed-work reply.
2. Predict that the same jobs still need the same modeled worker time in synchronous and asynchronous modes.
3. Explain what status and recovery contract the caller needs after early acceptance.

In scope: A request, a durable pending-work boundary and one worker. Each job takes one invented tick. No cancellation, duplicate processing, crash/recovery or queue-capacity experiment is implemented here.
Limit: Accepted is not completed; callers need status, error handling and bounded backlog.
Misconception: A 202-style acceptance means the requested work already succeeded.

## Concept decomposition

Mechanism: Asynchronous acceptance separates receiving a task from completing its effect.
Temporal behavior: event traces own component values, counts, direction and results; display time is independent of simulated state.
Quantitative relations: values below are finite teaching assumptions, not measured performance.
Hardest: An early successful acceptance does not prove the requested effect completed (A1).
Hardest: Moving waiting off the caller does not remove processing work or backlog (A1).

## Parts you will meet

Synchronous reply: waits for the modeled jobs to finish. Asynchronous acceptance: confirms the modeled jobs were saved for later work. Completion status: a later report of the effect’s outcome.

## Storyboard

Baseline: Background jobs required = 6; “Wait synchronously for all work”. Comparison: “Persist work and acknowledge acceptance”.
1. Request needs later work: 6 jobs each take one illustrative tick on a single worker.
2. Acceptance boundary: Keep the caller waiting until all jobs complete.
3. Worker completes jobs: The worker completes 6 jobs over 6 ticks in both modes.

## Animation sense

Mechanism: Asynchronous acceptance separates receiving a task from completing its effect.
Moving quantity: Request handler, Durable queue, Worker; event messages explain each state transition, not decoration.
Model field: simulateMechanism('communication', input).beats; sampleFilm derives a legal frame from that trace.
Learner predicts: Reply waits for completion or Reply means accepted only, then explains the relevant assumption.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; complete static steps and transcript preserve its accessible explanation.
Research (before drawing): primary records below retain their actual earlier access dates; this reconciliation adds no claim that every source was reopened. NGINX methods/health and PostgreSQL WAL were reopened in the 2026-10-30 mission audit.

## Asset plan

### A1. Causal comparison and experiment

- objective: 1, 2, 3
- type: 3d
- object: Request handler, Durable queue, Worker, shown as named components using shared recognizable hardware
- render: anatomy-iso
- fidelity: computed trace/counts/values; scaled isometric geometry; assumed workload and playback timing; no latency or throughput benchmark
- pattern: step manipulate predict compare
- learner sees: Synchronous reply: waits for the modeled jobs to finish. Asynchronous acceptance: confirms the modeled jobs were saved for later work. Completion status: a later report of the effect’s outcome.
- animated: a model message travels between explicit component ports; arrival commits its owned state; refusals and timeouts do not become packet loss
- learner does: play, pause, seek, step, compare the policies, change inputs, commit a prediction, run and reset
- notice: An early successful acceptance does not prove the requested effect completed (A1).
- model: simulateMechanism('communication', {amount, alternative}); amount 1–8, default 6; modes: Wait synchronously for all work / Persist work and acknowledge acceptance.
- feedback: trace-derived outcome, explanation, visible state and metrics are shown only after the prediction
- assumptions: A request, a durable pending-work boundary and one worker. Each job takes one invented tick. No cancellation, duplicate processing, crash/recovery or queue-capacity experiment is implemented here. Beat lengths are caption-dependent playback durations from paceFilm, never real system timing.
- outcome: Asynchronous acceptance separates receiving a task from completing its effect.
- accessibility: keyboard controls, transcript, HTML state summary, static steps, reduced motion and theme-aware geometry
- tests: finite-input invariants and misconception counterexamples; current report separates these from browser acceptance
- evidence: source/model correspondence recorded in MISSION_COURSE_AUDIT.md; no independent rendered acceptance inferred
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/topic-models.ts`, `src/lib/learn/anatomy-refinement.test.ts`

## Tabs

- Learn: visual worked comparison, prerequisites and concise rule; deeper assumptions remain disclosed.
- Lab: UI label **Explore**; commit a prediction, change an actual input/policy, run, inspect the trace and reset.
- Quiz: UI label **Assess**; commit scenario answers before feedback; scores and revisit links reflect this attempt only; open transfer remains self-assessed.

## Explanation (14 questions)

1. **Problem:** A request starts work that takes longer than a screen should wait.
2. **Why it matters:** Calling acceptance completion can falsely assure a user that work succeeded.
3. **First attempt:** Keep the caller waiting for every job.
4. **When it works:** That gives a completion answer when the delay is acceptable and the connection survives.
5. **Failure:** Long work exceeds the caller’s waiting budget or interrupts the user flow.
6. **Closer observation:** Separate reply semantics from worker completion ticks.
7. **Mechanism:** Both modes process all jobs; asynchronous mode persists work before returning accepted.
8. **Experiment:** Change job count 1–8 and whether the caller waits for completion.
9. **Alternatives:** Wait for completion or return a durable work identity/status contract after acceptance.
10. **Tradeoffs:** Early replies reduce waiting in that request but add later status, retry and recovery responsibilities.
11. **Choose it when:** Choose early acceptance when the user can tolerate deferred completion with honest status.
12. **Do not infer:** Do not return accepted for work that has not crossed the declared durable boundary.
13. **In your own words:** Explain what a user safely knows immediately after acceptance.
14. **Transfer:** Apply accepted-versus-completed states to a notification send or file conversion.

## Visual

A frozen frame must agree with trace state. Device anatomy identifies the state owner; small details are not protocol events. Counts remain exact even where marks are abbreviated. No depth, light or motion effect changes the model verdict.

## Practice

Commit to a prediction, inspect the changed state, then answer: Explain what a user safely knows immediately after acceptance.
Transfer: Apply accepted-versus-completed states to a notification send or file conversion.
Assess recommendations come from missed committed scenarios, including registered companion mechanisms. They are deterministic guidance, not inferred mastery.

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

This author record was reconciled with the actual model/controls in the 2026-10-30 mission. Status remains implemented. Unit/model evidence and browser results belong in the mission audit/QA reports; a spec rewrite does not establish independent technical acceptance, physical-device accessibility or learner outcomes.
