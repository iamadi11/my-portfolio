# http-caching: When can a browser reuse a response without downloading it again?

Id: http-caching · Stage: 5 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: caching-basics http
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `http-caching`; model `httpValidation`.

## Boundary

1. Predict 304 with reuse of a stored body when its validator still matches.
2. Predict 200 with a replacement body when the origin representation has changed.
3. Distinguish no-cache validation from no-store and from freshness without validation.

In scope: One browser and origin, one validator and stored body. Freshness policy is explained; the model specifically executes required validation, not TTL timing, intermediaries, Vary or authorization rules.
Limit: A validation response still requires communication; cache policy is not an authorization mechanism.
Misconception: A 304 response contains a complete replacement representation.

## Concept decomposition

Mechanism: Freshness rules govern reuse; validation can confirm a stored representation without retransmitting the whole body.
Temporal behavior: event traces own component values, counts, direction and results; display time is independent of simulated state.
Quantitative relations: values below are finite teaching assumptions, not measured performance.
Hardest: A body can be reused even though a network validation exchange still occurs (A1).
Hardest: A 304 has no replacement representation body; the rendered bytes come from the stored response (A1).

## Parts you will meet

Validator: metadata identifying a representation version, here an ETag. Conditional request: a request that supplies that validator. 304: validation permits reuse of the stored body; it is not a new body.

## Storyboard

Baseline: Origin representation version = 6; “Stored validator still matches”. Comparison: “Stored validator differs”.
1. Stored response needs validation: Cache holds body v6, ETag "v6", and Cache-Control: no-cache. no-cache permits storage but requires validation before reuse.
2. Send conditional request: Browser sends If-None-Match: "v6". Validation requires a network exchange.
3. Compare validator: The validator matches; return 304 with metadata and no response body.
4. Render representation: Update applicable cache metadata and render the body already stored.

## Animation sense

Mechanism: Freshness rules govern reuse; validation can confirm a stored representation without retransmitting the whole body.
Moving quantity: Browser cache, Origin, Rendered representation; event messages explain each state transition, not decoration.
Model field: simulateMechanism('httpValidation', input).beats; sampleFilm derives a legal frame from that trace.
Learner predicts: 304 reuses stored body or 200 replaces stored body, then explains the relevant assumption.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; complete static steps and transcript preserve its accessible explanation.
Research (before drawing): primary records below retain their actual earlier access dates; this reconciliation adds no claim that every source was reopened. NGINX methods/health and PostgreSQL WAL were reopened in the 2026-10-30 mission audit.

## Asset plan

### A1. Causal comparison and experiment

- objective: 1, 2, 3
- type: 3d
- object: Browser cache, Origin, Rendered representation, shown as named components using shared recognizable hardware
- render: anatomy-iso
- fidelity: computed trace/counts/values; scaled isometric geometry; assumed workload and playback timing; no latency or throughput benchmark
- pattern: step manipulate predict compare
- learner sees: Validator: metadata identifying a representation version, here an ETag. Conditional request: a request that supplies that validator. 304: validation permits reuse of the stored body; it is not a new body.
- animated: a model message travels between explicit component ports; arrival commits its owned state; refusals and timeouts do not become packet loss
- learner does: play, pause, seek, step, compare the policies, change inputs, commit a prediction, run and reset
- notice: A body can be reused even though a network validation exchange still occurs (A1).
- model: simulateMechanism('httpValidation', {amount, alternative}); amount 2–8, default 6; modes: Stored validator still matches / Stored validator differs.
- feedback: trace-derived outcome, explanation, visible state and metrics are shown only after the prediction
- assumptions: One browser and origin, one validator and stored body. Freshness policy is explained; the model specifically executes required validation, not TTL timing, intermediaries, Vary or authorization rules. Beat lengths are caption-dependent playback durations from paceFilm, never real system timing.
- outcome: Freshness rules govern reuse; validation can confirm a stored representation without retransmitting the whole body.
- accessibility: keyboard controls, transcript, HTML state summary, static steps, reduced motion and theme-aware geometry
- tests: finite-input invariants and misconception counterexamples; current report separates these from browser acceptance
- evidence: source/model correspondence recorded in MISSION_COURSE_AUDIT.md; no independent rendered acceptance inferred
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/topic-models.ts`, `src/lib/learn/anatomy-refinement.test.ts`

## Tabs

- Learn: visual worked comparison, prerequisites and concise rule; deeper assumptions remain disclosed.
- Lab: UI label **Explore**; commit a prediction, change an actual input/policy, run, inspect the trace and reset.
- Quiz: UI label **Assess**; commit scenario answers before feedback; scores and revisit links reflect this attempt only; open transfer remains self-assessed.

## Explanation (14 questions)

1. **Problem:** A browser already has bytes; must it download the same representation again?
2. **Why it matters:** Unnecessary bodies cost transfer, but stale or forbidden reuse is incorrect.
3. **First attempt:** Reuse anything already saved.
4. **When it works:** That is allowed while the applicable freshness policy permits reuse.
5. **Failure:** A response requiring validation cannot be reused merely because bytes are present.
6. **Closer observation:** Watch the validator exchange separately from body downloads.
7. **Mechanism:** The model sends If-None-Match and compares the current ETag; matching yields 304, changed yields 200 plus body.
8. **Experiment:** Change origin version 2–8 and whether the saved validator matches.
9. **Alternatives:** Fresh reuse, conditional validation and no-store serve different policies.
10. **Tradeoffs:** Validation saves an unchanged body transfer but still incurs communication.
11. **Choose it when:** Use the representation’s actual cache directives and cache-key requirements.
12. **Do not infer:** Do not use cache directives as authorization or assume no-cache forbids storage.
13. **In your own words:** Explain where the visible page body came from after 304.
14. **Transfer:** Apply conditional retrieval to an API representation whose data changes infrequently.

## Visual

A frozen frame must agree with trace state. Device anatomy identifies the state owner; small details are not protocol events. Counts remain exact even where marks are abbreviated. No depth, light or motion effect changes the model verdict.

## Practice

Commit to a prediction, inspect the changed state, then answer: Explain where the visible page body came from after 304.
Transfer: Apply conditional retrieval to an API representation whose data changes infrequently.
Assess recommendations come from missed committed scenarios, including registered companion mechanisms. They are deterministic guidance, not inferred mastery.

## Sources

- id: http-cache
title: RFC 9111 HTTP caching
url: https://www.rfc-editor.org/rfc/rfc9111.html
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Freshness, validation and invalidation.

## Evidence

This author record was reconciled with the actual model/controls in the 2026-10-30 mission. Status remains implemented. Unit/model evidence and browser results belong in the mission audit/QA reports; a spec rewrite does not establish independent technical acceptance, physical-device accessibility or learner outcomes.
