# consistency-models: What does a reader get to assume about other clients' writes?

Id: consistency-models · Stage: 7 · Paths: interview production (status lives only in CURRICULUM.md)
Prerequisites: replication-lag isolation
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `consistency-models`; model `consistencyHistory`.

## Boundary

1. Read a history in which one client’s acknowledged write completes before another client begins reading.
2. Predict whether a stale or coordinated read respects that completed write.
3. Explain why eventual convergence later does not repair a past real-time-order violation.

In scope: One completed write and a nonoverlapping later read of a single illustrative register. Not a proof of an implementation, full concurrent histories, causal delivery or all session guarantees.
Limit: Eventual convergence alone does not guarantee immediate freshness or read-your-writes.
Misconception: Eventual consistency means every read is random forever.

## Concept decomposition

Mechanism: A consistency model defines allowed observations; linearizability respects a single real-time-compatible order of operations.
Temporal behavior: event traces own component values, counts, direction and results; display time is independent of simulated state.
Quantitative relations: values below are finite teaching assumptions, not measured performance.
Hardest: Operation invocation/response order, rather than packet proximity, determines the nonoverlap constraint (A1).
Hardest: Eventual convergence and linearizability answer different questions about a history (A1).

## Parts you will meet

History: recorded operation invocations and responses. Nonoverlapping operations: one response finishes before another invocation begins. Linearizability: operations admit one order respecting real-time nonoverlap.

## Storyboard

Baseline: Version acknowledged by writer = 6; “Read lagging replica”. Comparison: “Coordinate read with completed write”.
1. Initial state: Both replicas start at version 5. The network may delay replication.
2. Write completes: Writer receives success for version 6 before the other client invokes its read.
3. Later read invoked: This read begins after the successful write response: these operations do not overlap.
4. Read response: The lagging follower returns v5. No real-time-compatible order can put this read before the completed write.
5. Replica catches up: The follower eventually receives v6. Later convergence does not change the earlier read history.

## Animation sense

Mechanism: A consistency model defines allowed observations; linearizability respects a single real-time-compatible order of operations.
Moving quantity: Writer, Replica group, Later reader; event messages explain each state transition, not decoration.
Model field: simulateMechanism('consistencyHistory', input).beats; sampleFilm derives a legal frame from that trace.
Learner predicts: History violates linearizability or History respects completed write, then explains the relevant assumption.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; complete static steps and transcript preserve its accessible explanation.
Research (before drawing): primary records below retain their actual earlier access dates; this reconciliation adds no claim that every source was reopened. NGINX methods/health and PostgreSQL WAL were reopened in the 2026-10-30 mission audit.

## Asset plan

### A1. Causal comparison and experiment

- objective: 1, 2, 3
- type: 3d
- object: Writer, Replica group, Later reader, shown as named components using shared recognizable hardware
- render: anatomy-iso
- fidelity: computed trace/counts/values; scaled isometric geometry; assumed workload and playback timing; no latency or throughput benchmark
- pattern: step manipulate predict compare
- learner sees: History: recorded operation invocations and responses. Nonoverlapping operations: one response finishes before another invocation begins. Linearizability: operations admit one order respecting real-time nonoverlap.
- animated: a model message travels between explicit component ports; arrival commits its owned state; refusals and timeouts do not become packet loss
- learner does: play, pause, seek, step, compare the policies, change inputs, commit a prediction, run and reset
- notice: Operation invocation/response order, rather than packet proximity, determines the nonoverlap constraint (A1).
- model: simulateMechanism('consistencyHistory', {amount, alternative}); amount 2–8, default 6; modes: Read lagging replica / Coordinate read with completed write.
- feedback: trace-derived outcome, explanation, visible state and metrics are shown only after the prediction
- assumptions: One completed write and a nonoverlapping later read of a single illustrative register. Not a proof of an implementation, full concurrent histories, causal delivery or all session guarantees. Beat lengths are caption-dependent playback durations from paceFilm, never real system timing.
- outcome: A consistency model defines allowed observations; linearizability respects a single real-time-compatible order of operations.
- accessibility: keyboard controls, transcript, HTML state summary, static steps, reduced motion and theme-aware geometry
- tests: finite-input invariants and misconception counterexamples; current report separates these from browser acceptance
- evidence: source/model correspondence recorded in MISSION_COURSE_AUDIT.md; no independent rendered acceptance inferred
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/topic-models.ts`, `src/lib/learn/anatomy-refinement.test.ts`

## Tabs

- Learn: visual worked comparison, prerequisites and concise rule; deeper assumptions remain disclosed.
- Lab: UI label **Explore**; commit a prediction, change an actual input/policy, run, inspect the trace and reset.
- Quiz: UI label **Assess**; commit scenario answers before feedback; scores and revisit links reflect this attempt only; open transfer remains self-assessed.

## Explanation (14 questions)

1. **Problem:** A user reads an older value after another user’s save already finished.
2. **Why it matters:** The application must know what ordering and freshness assumptions are safe.
3. **First attempt:** Read whichever replica answers without coordination.
4. **When it works:** That can meet an application contract that tolerates older copies.
5. **Failure:** It cannot meet the illustrated linearizable register contract after the completed write.
6. **Closer observation:** Inspect write response before read invocation, then the returned version.
7. **Mechanism:** A completed vN write followed by a new read must return a value compatible with that real-time order.
8. **Experiment:** Change acknowledged version 2–8 and lagging versus coordinated read.
9. **Alternatives:** Allow older replica observations under a weaker contract or coordinate the read.
10. **Tradeoffs:** Coordination can cost communication or availability; this model measures neither.
11. **Choose it when:** Choose guarantees from the actual cross-client invariant and failure requirements.
12. **Do not infer:** Do not infer global real-time ordering merely from eventual convergence or a causal timestamp.
13. **In your own words:** Explain why catching up afterwards does not change what the earlier reader observed.
14. **Transfer:** Apply history reasoning to a stock counter read after a confirmed purchase.

## Visual

A frozen frame must agree with trace state. Device anatomy identifies the state owner; small details are not protocol events. Counts remain exact even where marks are abbreviated. No depth, light or motion effect changes the model verdict.

## Practice

Commit to a prediction, inspect the changed state, then answer: Explain why catching up afterwards does not change what the earlier reader observed.
Transfer: Apply history reasoning to a stock counter read after a confirmed purchase.
Assess recommendations come from missed committed scenarios, including registered companion mechanisms. They are deterministic guidance, not inferred mastery.

## Sources

- id: cap
title: Gilbert and Lynch CAP proof
url: https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Consistency and availability under partition assumptions.

- id: consistency-levels
title: Azure Cosmos DB consistency levels
url: https://learn.microsoft.com/en-us/azure/cosmos-db/consistency-levels
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-30; guarantees, strong and eventual consistency sections.

## Evidence

This author record was reconciled with the actual model/controls in the 2026-10-30 mission. Status remains implemented. Unit/model evidence and browser results belong in the mission audit/QA reports; a spec rewrite does not establish independent technical acceptance, physical-device accessibility or learner outcomes.
