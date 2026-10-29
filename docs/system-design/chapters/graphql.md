# graphql: Can a screen ask for exactly the fields it needs?

Id: graphql · Stage: 2 · Status lives in CURRICULUM.md.
Standard: anatomy-3d
Implementation: `src/app/learn/[chapter]/page.tsx`, `src/content/learn/api-lessons.ts`, `src/content/learn/films.ts`.

## Boundary

1. Explain: The query selects fields; the server still controls the schema and performs the work.
2. Predict a changed-input result in the semantic lab and explain the misconception.

In scope: this film’s mechanism and one contrasting input. Deferred: production implementation and comprehensive protocol coverage.

## Concept decomposition

Hardest: distinguish the message visible on the wire from the server’s internal work; the packet is a message, not a function executing inside the client.
Hardest: distinguish the intended semantic result from a network guarantee; replaying the animation does not prove delivery in production.

## Storyboard

1. Describe this screen: The screen needs a user’s name and post titles, not every available field.
2. Send a shaped query: The query selects nested fields from the schema.
3. Resolve the user: A resolver obtains the selected user fields.
4. Resolve related data: Nested fields can cause more backend work. One client request does not guarantee one database query.
5. Return the selected shape: The response follows the selected fields. Authorization and query cost still need server-side controls.

## Animation sense

Mechanism: The query selects fields; the server still controls the schema and performs the work.
Moving quantity: message body moving between the actual sending and receiving components.
Model field: sampleFilm().packet.x/y in teaching world coordinates; states and values describe the current event.
Learner predicts: the outcome of the changed input, before running the lab.
If the moving part is deleted: the lesson is gone as a temporal explanation; a static transcript remains as its accessible alternative.
Research (before drawing): primary sources below opened and relevant sections read on 2026-10-29; via: read.

## Asset plan

### A1. Causal short film and semantic experiment

- objective: 1, 2
- type: 3d
- object: actual browser, service and data components connected by message paths; recognizable devices, no metaphor machinery
- render: anatomy-iso
- fidelity: computed message position, event index and semantic lab outcome; assumed example workload and values; scaled geometry and five-second beats; no measured timings or benchmarks faked
- pattern: step predict manipulate
- learner sees: the topology and per-event state from this chapter’s films.ts record
- animated: message translation equals sampleFilm().packet coordinates; failure stops the message before delivery
- learner does: play, step, scrub, then change a semantic input, predict and run
- notice: the changed input yields a different observable result
- model: sampleFilm in film-model.ts and experiment in api-experiment.ts
- feedback: event caption plus lab verdict derived from experiment output
- assumptions: discrete semantic teaching examples; no real network IO; playback time is not protocol latency
- outcome: the chapter’s stated takeaway and computed lab result
- accessibility: keyboard transport, transcript, reduced-motion steps, labelled inputs, light/dark themes
- tests: bounds and seek determinism, loss never delivers, semantic outcome invariants
- evidence: implementation pending validation; no independent review claimed
- built: `src/components/learn/film/LessonFilm.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/film-model.ts`, `src/lib/learn/film-model.test.ts`, `src/lib/learn/api-experiment.ts`, `src/lib/learn/api-experiment.test.ts`

## Tabs

- Learn: the short film and optional technical depth.
- Lab: one changed semantic input, prediction and computed observable result.
- Quiz: scenario retrieval; answers hidden until choice.

## Explanation (14 questions)

The film’s five beats carry problem, mechanism, contrasting case and limits; prerequisites and optional detail live in api-lessons.ts. The lab checks transfer rather than repeating the captions. The historical fourteen-question essay is not duplicated in learner-facing prose.

## Visual

Isometric solid hosts, service racks, connected stores and one message body. HTML captions and transcript carry the complete text alternative.

## Practice

Predict the outcome of the selected input before Run experiment. Then answer the distinct scenario question in Quiz.

## Sources

- id: graphql-query
title: GraphQL queries: fields and nested selection
url: https://graphql.org/learn/queries/
via: read
supports: [mechanism, boundary]
accessed: 2026-10-29 via browser tool; relevant sections inspected

- id: graphql-execution
title: GraphQL October 2021 specification §6.3, selection execution
url: https://spec.graphql.org/October2021/#sec-Execution
via: read
supports: [mechanism, boundary]
accessed: 2026-10-29 via browser tool; relevant sections inspected

## Evidence

- implementation: pass — generated static route and shared 3D player, 2026-10-29
- typecheck: pass — tsc --noEmit and production build
- lint: pass — ESLint and production build
- model tests: pass — 377 unit tests including all films and API experiments
- browser: pass — production route/scene smoke and six responsive sizes; new lab/quiz flow
- keyboard: pass — shared scene controls; REST timeline End and tab ArrowRight exercised
- reduced motion: not run — system preference emulation not available through the selected browser capability; shared useClock stepping reused
- animation sense: not run — full independent teaching review remains open
- accessibility audit: not run — axe, Lighthouse and real screen-reader session remain open

See `docs/system-design/VISUAL_COURSE_QA.md` for scope and limits.
- independent review: not run

## Review findings

Audit: author, 2026-10-29. Independent review and manual screen-reader check remain open; do not mark verified.
