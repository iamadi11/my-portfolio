# unique-ids: Can several machines create identifiers without calling one counter?

Id: unique-ids · Stage: 8 · Paths: interview production (status lives only in CURRICULUM.md)
Prerequisites: time-clocks partitioning
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `unique-ids`; model `uuidLayout`.

## Boundary

1. Recognize fixed version/variant positions in illustrative UUIDv4 and UUIDv7 values.
2. Distinguish v4 without a time prefix from v7 with a 48-bit millisecond time prefix.
3. Predict lexical reordering when the clock rolls backward and no monotonic correction is assumed.

In scope: Valid illustrative v4/v7 layouts with a rollback of1–8 ms. Entropy generation, collision probability, secure implementation, monotonic correction and range allocation are not simulated.
Limit: Uniqueness assumptions and information leakage depend on the chosen variant and implementation.
Misconception: An identifier that sorts by time automatically proves causal order.

## Concept decomposition

Mechanism: UUID variants use defined bit layouts and generation rules to reduce coordination needs.
Temporal behavior: event traces own component values, counts, direction and results; display time is independent of simulated state.
Quantitative relations: values below are finite teaching assumptions, not measured performance.
Hardest: A timestamp prefix is a layout, not evidence of causal or generation order under rollback (A1).
Hardest: Fixed illustrative UUID values are not an entropy source, collision experiment or production generator (A1).

## Parts you will meet

UUID: identifier with defined 128-bit layout. Version: bits selecting the generation format. Variant: bits identifying the layout family. Timestamp prefix: v7’s leading 48-bit Unix-time field in milliseconds.

## Storyboard

Baseline: Clock rollback between generations (ms) = 3; “UUID version 4 layout”. Comparison: “UUID version 7 layout”.
1. Declare illustrative fields: These fixed example bits illustrate layout, not a secure UUID generator or a measured collision rate.
2. Create first identifier: ffffffff-ffff-4fff-8fff-ffffffffffff
3. Clock moves backwards: The observed clock moves from 1000 ms to 997 ms before the next generation. No monotonic correction is assumed.
4. Create later identifier: 00000000-0000-4000-8000-000000000001
5. Inspect sorting: v4 has no time prefix. Lexical sorting does not recover generation order.

## Animation sense

Mechanism: UUID variants use defined bit layouts and generation rules to reduce coordination needs.
Moving quantity: Generator, First identifier, Later identifier; event messages explain each state transition, not decoration.
Model field: simulateMechanism('uuidLayout', input).beats; sampleFilm derives a legal frame from that trace.
Learner predicts: No timestamp prefix or Timestamp prefix visible, then explains the relevant assumption.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; complete static steps and transcript preserve its accessible explanation.
Research (before drawing): primary records below retain their actual earlier access dates; this reconciliation adds no claim that every source was reopened. NGINX methods/health and PostgreSQL WAL were reopened in the 2026-10-30 mission audit.

## Asset plan

### A1. Causal comparison and experiment

- objective: 1, 2, 3
- type: 3d
- object: Generator, First identifier, Later identifier, shown as named components using shared recognizable hardware
- render: anatomy-iso
- fidelity: computed trace/counts/values; scaled isometric geometry; assumed workload and playback timing; no latency or throughput benchmark
- pattern: step manipulate predict compare
- learner sees: UUID: identifier with defined 128-bit layout. Version: bits selecting the generation format. Variant: bits identifying the layout family. Timestamp prefix: v7’s leading 48-bit Unix-time field in milliseconds.
- animated: a model message travels between explicit component ports; arrival commits its owned state; refusals and timeouts do not become packet loss
- learner does: play, pause, seek, step, compare the policies, change inputs, commit a prediction, run and reset
- notice: A timestamp prefix is a layout, not evidence of causal or generation order under rollback (A1).
- model: simulateMechanism('uuidLayout', {amount, alternative}); amount 1–8, default 3; modes: UUID version 4 layout / UUID version 7 layout.
- feedback: trace-derived outcome, explanation, visible state and metrics are shown only after the prediction
- assumptions: Valid illustrative v4/v7 layouts with a rollback of1–8 ms. Entropy generation, collision probability, secure implementation, monotonic correction and range allocation are not simulated. Beat lengths are caption-dependent playback durations from paceFilm, never real system timing.
- outcome: UUID variants use defined bit layouts and generation rules to reduce coordination needs.
- accessibility: keyboard controls, transcript, HTML state summary, static steps, reduced motion and theme-aware geometry
- tests: finite-input invariants and misconception counterexamples; current report separates these from browser acceptance
- evidence: source/model correspondence recorded in MISSION_COURSE_AUDIT.md; no independent rendered acceptance inferred
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/topic-models.ts`, `src/lib/learn/anatomy-refinement.test.ts`

## Tabs

- Learn: visual worked comparison, prerequisites and concise rule; deeper assumptions remain disclosed.
- Lab: UI label **Explore**; commit a prediction, change an actual input/policy, run, inspect the trace and reset.
- Quiz: UI label **Assess**; commit scenario answers before feedback; scores and revisit links reflect this attempt only; open transfer remains self-assessed.

## Explanation (14 questions)

1. **Problem:** Several machines need identifiers without synchronously incrementing one counter.
2. **Why it matters:** The identifier must fit uniqueness assumptions and information-disclosure requirements.
3. **First attempt:** Use current time as if time alone established identity and order.
4. **When it works:** Increasing clocks can give superficially sorted examples, but that is not a uniqueness proof.
5. **Failure:** A later generation observes an earlier clock time.
6. **Closer observation:** Inspect actual version bits and compare the two identifier strings.
7. **Mechanism:** The fixed examples contrast v4 payload layout with a v7 time prefix.
8. **Experiment:** Choose v4/v7 and rollback 1–8milliseconds.
9. **Alternatives:** Randomized identifiers, time-ordered formats or coordinated allocation have different assumptions.
10. **Tradeoffs:** Time structure can expose timing; randomized generation needs adequate entropy and a correct implementation.
11. **Choose it when:** Choose a documented generator and format compatible with storage and privacy requirements.
12. **Do not infer:** Do not use an identifier as an authorization token or claim lexical order proves causality.
13. **In your own words:** Explain why the second v7 example sorts before the first.
14. **Transfer:** Apply the same caution to sorting distributed events by generated IDs.

## Visual

A frozen frame must agree with trace state. Device anatomy identifies the state owner; small details are not protocol events. Counts remain exact even where marks are abbreviated. No depth, light or motion effect changes the model verdict.

## Practice

Commit to a prediction, inspect the changed state, then answer: Explain why the second v7 example sorts before the first.
Transfer: Apply the same caution to sorting distributed events by generated IDs.
Assess recommendations come from missed committed scenarios, including registered companion mechanisms. They are deterministic guidance, not inferred mastery.

## Sources

- id: uuid
title: RFC 9562 UUIDs
url: https://www.rfc-editor.org/rfc/rfc9562.html
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Identifier layouts and generation considerations.

## Evidence

This author record was reconciled with the actual model/controls in the 2026-10-30 mission. Status remains implemented. Unit/model evidence and browser results belong in the mission audit/QA reports; a spec rewrite does not establish independent technical acceptance, physical-device accessibility or learner outcomes.
