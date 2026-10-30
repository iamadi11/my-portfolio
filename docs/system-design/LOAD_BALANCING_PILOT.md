# Load-balancing pilot · 2026-10-30

## Defect and replacement

The chapter's generic `partition` model distributed synthetic keys to storage owners. That does not explain routing requests among replicas of the same application. This pilot supplies a separate deterministic replica-routing model and uses the existing isometric anatomy / GSAP player, controls, caption pacing, static steps and state summary.

Files: `src/lib/learn/load-balancing.ts`, its invariant tests, `src/components/learn/film/LoadBalancingLab.tsx`, and scoped `load-balancing.css`. Root integration must replace the chapter's partition Learn/Explore/Assess views, update its blueprint and source registry, and retain prerequisites/navigation. A green model suite alone does not establish that integration.

## Teaching contract

Question: which replica should receive the next request?

Misconception: equal request counts imply equal load, or routing can manufacture backend capacity. The three servers run the same application; they are not shards. Server A has a configurable service duration; B/C finish in one invented tick. A request occupies one active connection. A capacity rejection is separate from a connection failure and never becomes a lost-message icon.

Learn compares round robin with least active connections under exactly the same workload. With the default nine arrivals one tick apart, A's service takes six ticks and each replica admits one active request. Round robin sends request 4 to busy A and it is rejected. Least-connections observes unfinished work and chooses a free B/C instead. The default is an example, not a universal superiority claim.

Explore independently controls six inputs: routing policy, request count, arrival spacing, A's service ticks, each replica's admission limit, and A's health/detection state. Predictions remain hidden until committed and run. Reset restores all inputs and clears outcome/trace. The result records the committed inputs and prediction; changing any control clears that result. A table exposes every decision and pre-arrival occupancy without motion. A film is generated from the same trace. An activity flag records experimentation, not mastery.

Two supplied scenario questions distinguish active connections from shard ownership and expose the first-request failure before passive health detection. Root can pass them to the common committed assessment component.

## Primary-source review

Read [NGINX: Using nginx as HTTP load balancer](https://nginx.org/en/docs/http/load_balancing.html), sections **Load balancing methods**, **Least connected load balancing**, and **Health checks**, on 2026-10-30. These support round-robin routing, selection by active connections, and passive detection after observed failure. The document also explains configurable failure thresholds and later probing. It does not establish a universal throughput/latency advantage for this pilot.

## Explicit simplifications

The model has equal weights, deterministic rotating tie breaks, one connection per request, and no multiplexing/keepalive, queue, retry, recovery or real network delay. At a shared tick, completions precede ordered arrivals. Admission limits belong to the modeled application replicas, not a claimed implementation of an NGINX directive. A first refused connection excludes A for the rest of this finite run; real thresholds and recovery are configuration dependent. Health icons show the balancer's discovered state. Display seconds are playback time, not simulated ticks or measured latency.

## Executable evidence

`npx vitest run src/lib/learn/load-balancing.test.ts`: **7 tests passed**, including **9,216** combinations of bounded request count, spacing, service duration, admission limit, policy and health. Assertions cover conservation, observed occupancy, capacity bounds, eligibility, least-connections decisions, finish times, completion-before-arrival ordering, health detection, capacity rejection without false failure, deterministic replay and film-state agreement. The simultaneous burst counterexample rejects excess work under both policies.

Focused ESLint for all new TS/TSX files: passed without warnings. Whole-project TypeScript initially found an unrelated inferred-union fixture error in `assessment.test.ts`; reported to root. No pilot type errors appeared.

## Remaining acceptance

Root must verify final integration, catalog progress, keyboard/prediction/reset/deep links, mobile/desktop, dark/light, static playback and readable labels in the actual browser. No frame-rate, screen-reader, learner-outcome or all-chapter visual-acceptance claim is made by this pilot report. Shared renderer tests cover existing mechanics; this report does not replace rendered acceptance.
