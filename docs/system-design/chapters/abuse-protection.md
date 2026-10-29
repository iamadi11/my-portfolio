# abuse-protection: How do you protect useful traffic without trusting every client?

Id: abuse-protection · Status lives only in CURRICULUM.md.
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `abuse-protection`; model `bucket`. This compact record references shared code to avoid loading duplicate implementations.

## Boundary

1. Explain: Layer quotas, admission controls and identity-aware policies around costly resources.
2. Predict the observable result after changing requests in this burst or the declared policy.

Limit: A per-IP rule can punish shared networks and miss distributed abuse.
Misconception: A single per-IP limit can distinguish all abusive users from legitimate users.

## Concept decomposition

Hardest: connect this chapter’s rule to the actual state owner: Available tokens, Admitted requests, Rejected requests.
Hardest: distinguish the selected teaching policy from a production guarantee. A per-IP rule can punish shared networks and miss distributed abuse.

## Storyboard

Baseline input: Requests in this burst = 6; policy: One burst. The contrasting policy is One refill between requests.

1. Initial tokens: The bucket starts with three tokens.
2. Request 1: Spend one available token to admit this request.
3. Request 2: Spend one available token to admit this request.
4. Request 3: Spend one available token to admit this request.
5. Request 4: No token remains, so this burst request is rejected.
6. Request 5: No token remains, so this burst request is rejected.
7. Request 6: No token remains, so this burst request is rejected.

For case chapters and capstone, `design-guides.ts` additionally owns the requirement, explicit workload arithmetic, full read/write path, failure, tradeoff and transfer challenge. The mechanism film is a zoom into one decision, not the complete architecture.

## Animation sense

Mechanism: Layer quotas, admission controls and identity-aware policies around costly resources.
Moving quantity: model events between the actual owning components; displayed counts and versions change only from the event trace.
Model field: simulateMechanism('bucket', input).beats; counts, values, from/to and outcome; sampleFilm maps trace time into visible state.
Learner predicts: one of the model’s two outcomes after selecting a changed input and policy.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; static steps and transcript retain the accessible explanation.
Research (before drawing): the relevant source sections below were read before the current mechanism implementation, on 2026-10-29.

## Asset plan

### A1. Model-driven worked example and experiment

- objective: 1, 2
- type: 3d
- object: Available tokens, Admitted requests, Rejected requests, displayed with recognizable service, storage and host geometry
- render: anatomy-iso
- fidelity: computed discrete event trace, quantities and outcome; scaled device geometry and playback timing; assumed finite workload, no benchmark or real network simulation
- pattern: step manipulate predict
- learner sees: before, event and after states for the chapter’s bucket mechanism
- animated: message translation and model-owned visible counts/values change along the causal trace; static stepping shows the committed event state
- learner does: play or step, choose an input and policy, commit a prediction, run and compare
- notice: A single per-IP limit can distinguish all abusive users from legitimate users.
- model: simulateMechanism in experiment-model.ts delegates topic-specific state machines to topic-models.ts when applicable
- feedback: the experiment trace supplies the film, verdict, explanatory boundaries and displayed metrics
- assumptions: A per-IP rule can punish shared networks and miss distributed abuse. Inputs are clamped to 1–8; five-second beats are display time only.
- outcome: Layer quotas, admission controls and identity-aware policies around costly resources.
- accessibility: keyboard transport, transcript, explicit static steps, dynamic reduced motion, HTML state summary, theme tokens and readable text
- tests: every allowed input has a selectable result, finite nonnegative quantities, deterministic seeks and known endpoints; additional misconception invariants
- evidence: source/model implementation; independent review coverage and rendered checks are recorded separately in EXPANSION_QA.md, never inferred from this spec
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/experiment-model.ts`, `src/lib/learn/topic-models.ts`, `src/lib/learn/experiment-model.test.ts`

## Tabs

- Learn: term definition, prerequisite links, model film, takeaway and worked assumptions. Cases add the whole design and workload calculation.
- Lab: changed quantity/policy, required prediction before result, computed trace and explanation.
- Quiz: a changed-input scenario, shuffled correct position, hidden feedback until commitment and an open transfer reflection.

## Explanation (14 questions)

The authored question is “How do you protect useful traffic without trusting every client?” The rule, misconception and boundary live in the compact blueprint. The executable storyboard shows the mechanism rather than replacing it with generic packet motion. Terms are defined before the film; prerequisites are linked. Technical depth is disclosed after the short film. The changed-input quiz requires applying assumptions instead of copying the takeaway. Cases require a defended read/write path, estimate, failure and tradeoff. These are teaching aids, not empirical proof of learning outcomes or comprehensive production training.

## Visual

Shared isometric SVG renderer, genuine message endpoints and model-owned state labels. Quantities beyond the drawn mark budget keep their full numeric count and an abbreviation label. Refusal and delay are not labelled packet loss.

## Practice

Predict All admitted or Some rejected under the selected policy. Run only after choosing. Explain which state changed and why. Recall later under a changed quantity; mixed reviews draw from prerequisite mechanisms. Optional device-local activity is separated into viewed, practiced and recall checked.

## Sources

- id: tokens
title: RFC 3290 Diffserv management model
url: https://www.rfc-editor.org/rfc/rfc3290
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Appendix A, token/leaky bucket models; informational RFC.

- id: authz
title: OWASP authorization guidance
url: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Least privilege, deny by default and per-request resource checks.

## Evidence

Implementation and bounded model tests are tracked in `docs/system-design/EXPANSION_QA.md`. This chapter remains implemented, not tested or verified: a full per-chapter independent review, physical-device check, screen-reader check, axe/Lighthouse and learner outcome study are not claimed.
