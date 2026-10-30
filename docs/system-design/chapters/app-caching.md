# app-caching: Who updates the cache after the database changes?

Id: app-caching · Stage: 5 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: caching-basics stateless-services
Standard: anatomy-3d
Authoring authority: `src/content/learn/academy-lessons.json` entry `app-caching`; model `cacheWrite`.

## Boundary

1. Trace a database write that leaves a warm cache entry stale when invalidation is missing.
2. Trace the contrasting ordered database-then-cache update before acknowledgement.
3. Explain why the illustrated sequence is not an atomic database/cache transaction and why write-back needs separate recovery.

In scope: Cache-aside with missing invalidation versus one assumed-successful write-through sequence. Write-back, concurrent stale fills, failure between writes and eviction are discussed boundaries, not executable guarantees.
Limit: Write-back needs durable pending work and recovery; a volatile cache is not automatically authoritative storage.
Misconception: Updating the database and cache separately is an atomic operation.

## Concept decomposition

Mechanism: Cache-aside loads on a miss; write-through and write-back put different steps on the write path.
Temporal behavior: event traces own component values, counts, direction and results; display time is independent of simulated state.
Quantitative relations: values below are finite teaching assumptions, not measured performance.
Hardest: A successful database commit does not modify a separately stored cache entry (A1).
Hardest: A coordinated two-step update is not atomic; write-back durability is a different unmodeled contract (A1).

## Parts you will meet

Cache-aside: application fetches and caches on a miss. Write-through here: update database then cache before success. Write-back: acknowledge cached work before later origin persistence, requiring its own durable pending-work policy.

## Storyboard

Baseline: New profile version = 6; “Cache-aside without invalidation”. Comparison: “Write through database then cache”.
1. Warm cache: Database and cache both hold version 5.
2. Write database: Application commits version 6 to the database.
3. Missing invalidation: The database changed but this cache-aside implementation neither deletes nor updates the old cache entry.
4. Read cache hit: A later read hits version 5; it does not fetch the database on a hit.

## Animation sense

Mechanism: Cache-aside loads on a miss; write-through and write-back put different steps on the write path.
Moving quantity: Application, Database, Cache; event messages explain each state transition, not decoration.
Model field: simulateMechanism('cacheWrite', input).beats; sampleFilm derives a legal frame from that trace.
Learner predicts: Stale cached version returned or Updated cached version returned, then explains the relevant assumption.
If the moving part is deleted: the lesson is gone as a temporal causal demonstration; complete static steps and transcript preserve its accessible explanation.
Research (before drawing): primary records below retain their actual earlier access dates; this reconciliation adds no claim that every source was reopened. NGINX methods/health and PostgreSQL WAL were reopened in the 2026-10-30 mission audit.

## Asset plan

### A1. Causal comparison and experiment

- objective: 1, 2, 3
- type: 3d
- object: Application, Database, Cache, shown as named components using shared recognizable hardware
- render: anatomy-iso
- fidelity: computed trace/counts/values; scaled isometric geometry; assumed workload and playback timing; no latency or throughput benchmark
- pattern: step manipulate predict compare
- learner sees: Cache-aside: application fetches and caches on a miss. Write-through here: update database then cache before success. Write-back: acknowledge cached work before later origin persistence, requiring its own durable pending-work policy.
- animated: a model message travels between explicit component ports; arrival commits its owned state; refusals and timeouts do not become packet loss
- learner does: play, pause, seek, step, compare the policies, change inputs, commit a prediction, run and reset
- notice: A successful database commit does not modify a separately stored cache entry (A1).
- model: simulateMechanism('cacheWrite', {amount, alternative}); amount 2–8, default 6; modes: Cache-aside without invalidation / Write through database then cache.
- feedback: trace-derived outcome, explanation, visible state and metrics are shown only after the prediction
- assumptions: Cache-aside with missing invalidation versus one assumed-successful write-through sequence. Write-back, concurrent stale fills, failure between writes and eviction are discussed boundaries, not executable guarantees. Beat lengths are caption-dependent playback durations from paceFilm, never real system timing.
- outcome: Cache-aside loads on a miss; write-through and write-back put different steps on the write path.
- accessibility: keyboard controls, transcript, HTML state summary, static steps, reduced motion and theme-aware geometry
- tests: finite-input invariants and misconception counterexamples; current report separates these from browser acceptance
- evidence: source/model correspondence recorded in MISSION_COURSE_AUDIT.md; no independent rendered acceptance inferred
- built: `src/components/learn/AcademyChapter.tsx`, `src/components/learn/film/AcademyPractice.tsx`, `src/components/learn/film/Scene.tsx`, `src/lib/learn/topic-models.ts`, `src/lib/learn/anatomy-refinement.test.ts`

## Tabs

- Learn: visual worked comparison, prerequisites and concise rule; deeper assumptions remain disclosed.
- Lab: UI label **Explore**; commit a prediction, change an actual input/policy, run, inspect the trace and reset.
- Quiz: UI label **Assess**; commit scenario answers before feedback; scores and revisit links reflect this attempt only; open transfer remains self-assessed.

## Explanation (14 questions)

1. **Problem:** A saved profile still displays its old value.
2. **Why it matters:** Users can act on stale data despite a successful write.
3. **First attempt:** Change only the authoritative database.
4. **When it works:** Later reads are current if no older cached entry is reused.
5. **Failure:** A warm cache returns its old version after the database changes.
6. **Closer observation:** Compare database version, cache version and the returned version.
7. **Mechanism:** The baseline omits invalidation; the alternative updates the cache before acknowledging.
8. **Experiment:** Change the new version 2–8 and the write-path policy.
9. **Alternatives:** Invalidate on database writes, write through, or use a separately designed write-back workflow.
10. **Tradeoffs:** Additional cache writes and coordination cost work; delayed persistence introduces recovery responsibility.
11. **Choose it when:** Use the application’s freshness, failure and durability requirements.
12. **Do not infer:** Do not promise atomicity across independent database and cache writes.
13. **In your own words:** Explain why clearing or updating one cache entry differs from committing the database.
14. **Transfer:** Apply the same stale-derived-copy reasoning to an edge cache or search projection.

## Visual

A frozen frame must agree with trace state. Device anatomy identifies the state owner; small details are not protocol events. Counts remain exact even where marks are abbreviated. No depth, light or motion effect changes the model verdict.

## Practice

Commit to a prediction, inspect the changed state, then answer: Explain why clearing or updating one cache entry differs from committing the database.
Transfer: Apply the same stale-derived-copy reasoning to an edge cache or search projection.
Assess recommendations come from missed committed scenarios, including registered companion mechanisms. They are deterministic guidance, not inferred mastery.

## Sources

- id: redis-evict
title: Redis key eviction
url: https://redis.io/docs/latest/develop/reference/eviction/
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-29; relevant material: Memory limit, LRU/LFU and cache copies.

- id: cache-aside
title: Microsoft cache-aside pattern
url: https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside
via: read
supports: [mechanism, boundary]
accessed: Opened 2026-10-30; solution and staleness-after-writes sections.

## Evidence

This author record was reconciled with the actual model/controls in the 2026-10-30 mission. Status remains implemented. Unit/model evidence and browser results belong in the mission audit/QA reports; a spec rewrite does not establish independent technical acceptance, physical-device accessibility or learner outcomes.
