# load-balancing: Which replica should receive the next request?

Id: load-balancing · Stage: 4 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: stateless-services tcp http
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `load-balancing`; model `loadBalance`.

## Boundary

1. Predict which eligible replica receives a request under round-robin or least-active-connections routing.
2. Distinguish backend connection limits, unequal service times and burst spacing from routing policy.
3. Predict the first request failure before passive detection and subsequent exclusion of that backend.
4. Explain the model’s one-request/one-connection limit and distinguish L4 connection routing from L7 request-aware routing.

In scope: Three interchangeable equal-weight replicas; completion events precede same-tick arrivals. No retry, waiting queue, keepalive, multiplexing, recovery or sticky routing. L4/L7 are explained as scope distinctions, not a packet-stack simulation.
Limit: One request uses one connection in this finite model. Equal weights, no keepalive or multiplexing, no retries or queue, and simplified passive health detection are assumed.
Misconception: A routing policy creates capacity or can avoid a failure it has not detected.

## Concept decomposition

Mechanism: Round robin takes turns among eligible replicas. Least-connections uses observed active connections; health detection and admission limits still affect success.
Temporal behavior: event traces own component values, counts, direction and results; display time is independent of simulated state.
Quantitative relations: values below are finite teaching assumptions, not measured performance.
Hardest: Equal assignment counts can coexist with unequal active load when one server takes longer (A1).
Hardest: Health detection follows evidence; it cannot prevent the first attempt to an unobserved failed backend (A1).
Hardest: A routing algorithm cannot manufacture service slots during a simultaneous burst (A1).

## Parts you will meet

Replica: another instance of the same application, not a storage shard. Active connection: a slot held until the assumed finish tick. Passive detection: a failed attempt supplies evidence to exclude A in this run.

## Storyboard

Baseline: Requests arriving = 9; “Round robin”. Comparison: “Least active connections”.
1. Three replicas, one application: A takes 6 ticks per request; B/C take one. Each admits at most 1 active connections.
2. Request 1 → server A: Tick 0: A accepts the request. Its connection stays active until tick 6.
3. Request 2 → server B: Tick 1: B accepts the request. Its connection stays active until tick 2.
4. Tick 2: connections finish: 1 earlier request finished. Released slots are available before the next arrival.
5. Request 3 → server C: Tick 2: C accepts the request. Its connection stays active until tick 3.
6. Tick 3: connections finish: 1 earlier request finished. Released slots are available before the next arrival.
7. Request 4 → server A: Tick 3: A is at its connection limit and rejects this attempt. No retry or queue is assumed.
8. Request 5 → server B: Tick 4: B accepts the request. Its connection stays active until tick 5.
9. Tick 5: connections finish: 1 earlier request finished. Released slots are available before the next arrival.
10. Request 6 → server C: Tick 5: C accepts the request. Its connection stays active until tick 6.
11. Tick 6: connections finish: 2 earlier requests finished. Released slots are available before the next arrival.
12. Request 7 → server A: Tick 6: A accepts the request. Its connection stays active until tick 12.
13. Request 8 → server B: Tick 7: B accepts the request. Its connection stays active until tick 8.
14. Tick 8: connections finish: 1 earlier request finished. Released slots are available before the next arrival.
15. Request 9 → server C: Tick 8: C accepts the request. Its connection stays active until tick 9.
16. Let admitted work finish: By tick 12, 8 requests completed; 1 were capacity-rejected and 0 failed to connect. Routing does not create capacity.

Explore extends the worked comparison with traffic spacing, A duration, per-replica capacity and A health. Commit a prediction before the trace appears. Inspect every arrival’s active-before vector, chosen replica, result and finish tick. A final drain distinguishes accepted from completed.

## Animation sense

Mechanism: Round robin takes turns among eligible replicas. Least-connections uses observed active connections; health detection and admission limits still affect success.
Moving quantity: Server A, Server B, Server C; event messages explain each state transition, not decoration.
Model field: simulateMechanism('loadBalance', input).beats; sampleFilm derives a legal frame from that trace.
Learner predicts: All requests accepted or At least one request rejected or failed, then explains the relevant assumption.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; complete static steps and transcript preserve its accessible explanation.
Research (before drawing): primary records below retain their actual earlier access dates; this reconciliation adds no claim that every source was reopened. NGINX methods/health and PostgreSQL WAL were reopened in the 2026-10-30 mission audit.

## Asset plan

### A1. Causal comparison and experiment

- objective: 1, 2, 3, 4
- type: 3d
- object: Server A, Server B, Server C, shown as named components using shared recognizable hardware
- render: anatomy-iso
- fidelity: computed trace/counts/values; scaled isometric geometry; assumed workload and playback timing; no latency or throughput benchmark
- pattern: step manipulate predict compare
- learner sees: Replica: another instance of the same application, not a storage shard. Active connection: a slot held until the assumed finish tick. Passive detection: a failed attempt supplies evidence to exclude A in this run.
- animated: a model message travels between explicit component ports; arrival commits its owned state; refusals and timeouts do not become packet loss
- learner does: play, pause, seek, step, compare the policies, change inputs, commit a prediction, run and reset
- notice: Equal assignment counts can coexist with unequal active load when one server takes longer (A1).
- model: simulateLoadBalancer in src/lib/learn/load-balancing.ts; the loadBalance adapter calls the same model. Four bounded numeric inputs, two policies and three health conditions.
- feedback: trace-derived outcome, explanation, visible state and metrics are shown only after the prediction
- assumptions: Three interchangeable equal-weight replicas; completion events precede same-tick arrivals. No retry, waiting queue, keepalive, multiplexing, recovery or sticky routing. L4/L7 are explained as scope distinctions, not a packet-stack simulation. Beat lengths are caption-dependent playback durations from paceFilm, never real system timing.
- outcome: Round robin takes turns among eligible replicas. Least-connections uses observed active connections; health detection and admission limits still affect success.
- accessibility: keyboard controls, transcript, HTML state summary, static steps, reduced motion and theme-aware geometry
- tests: finite-input invariants and misconception counterexamples; current report separates these from browser acceptance
- evidence: source/model correspondence recorded in MISSION_COURSE_AUDIT.md; no independent rendered acceptance inferred
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/LoadBalancingLab.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/load-balancing.ts`, `src/lib/learn/load-balancing.test.ts`

## Tabs

- Learn: visual worked comparison, prerequisites and concise rule; deeper assumptions remain disclosed.
- Lab: UI label **Explore**; commit a prediction, change an actual input/policy, run, inspect the trace and reset.
- Quiz: UI label **Assess**; commit scenario answers before feedback; scores and revisit links reflect this attempt only; open transfer remains self-assessed.

## Explanation (14 questions)

1. **Problem:** Three copies serve one application, but one stays busy longer.
2. **Why it matters:** A new request can fail even while another replica has spare capacity.
3. **First attempt:** Take turns among eligible replicas.
4. **When it works:** That spreads assignments when request duration and capacity are comparable.
5. **Failure:** A long-running request still occupies A when round robin returns to it.
6. **Closer observation:** Inspect active connections before each arrival, not only cumulative request counts.
7. **Mechanism:** Round robin rotates; least-connections selects a minimum active count with a rotating tie break in this model.
8. **Experiment:** Choose 1–12requests,0–3tick spacing,1–8tick A duration,1–4slots, routing policy and A health state.
9. **Alternatives:** Round robin, least-connections and explicit health exclusion are modeled; weighted/sticky policies are deferred.
10. **Tradeoffs:** Load signals can be imperfect; detection takes evidence; balanced counts do not guarantee balanced CPU.
11. **Choose it when:** Choose the signal and routing layer that match observed application traffic and transport behavior.
12. **Do not infer:** Do not confuse key-to-shard ownership with choosing an interchangeable application replica.
13. **In your own words:** Explain why least-connections can change the outcome without changing total physical capacity.
14. **Transfer:** Apply the same finite-capacity reasoning to a pool of background workers.

## Visual

A frozen frame must agree with trace state. Device anatomy identifies the state owner; small details are not protocol events. Counts remain exact even where marks are abbreviated. No depth, light or motion effect changes the model verdict.

## Practice

Commit to a prediction, inspect the changed state, then answer: Explain why least-connections can change the outcome without changing total physical capacity.
Transfer: Apply the same finite-capacity reasoning to a pool of background workers.
Assess recommendations come from missed committed scenarios, including registered companion mechanisms. They are deterministic guidance, not inferred mastery.

## Sources

- id: nginx-lb
title: NGINX HTTP load balancing
url: https://nginx.org/en/docs/http/load_balancing.html
via: read
supports: [mechanism, boundary]
accessed: Read load balancing methods, least connected load balancing and health checks via web on 2026-10-30.

- id: sre-lb
title: Google SRE load balancing
url: https://sre.google/sre-book/load-balancing-datacenter/
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Backend selection, interchangeable processes and routing.

## Evidence

This author record was reconciled with the actual model/controls in the 2026-10-30 mission. Status remains implemented. Unit/model evidence and browser results belong in the mission audit/QA reports; a spec rewrite does not establish independent technical acceptance, physical-device accessibility or learner outcomes.
