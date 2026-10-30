# Independent mechanism review · 2026-10-30

## Scope and evidence

Read-only critical review of the existing pure mechanisms and the 99 academy blueprint declarations, compared with the learning objectives in `CURRICULUM.md`. The new load-balancing and partitioned-log pilots are excluded from independent acceptance because this reviewer authored them. Source inspection includes `experiment-model.ts`, `topic-models.ts`, their mechanism definitions, `academy.ts`, selected chapter specs, the shared film sampler and topology construction. The source was a changing working tree; findings below record the observed pre-repair state and must be dispositioned against the final tree.

A temporary esbuild/VM sweep executed all integer inputs between each registered mechanism's min and max, under both policies: **85 existing mechanisms, 1,148 runs**. Every returned outcome belonged to its declared prediction set; counts were finite; event endpoints existed in the generated film topology. This is a structural/integrity check. It does not establish objective completeness, technical correctness, pedagogical effectiveness, mobile legibility or real-world system safety.

No browser acceptance, manual assistive-technology test, production load measurement or learner test was performed by this reviewer. Existing primary-source records were inspected as prior evidence; they were not all reread. Fresh primary-source inspection for the redelivery finding is recorded below. The specialized foundation lessons, API implementations and full case walkthroughs require their separate review evidence; their existence does not extend this source-only sweep to 119 independent acceptances.

## Concrete correctness findings

### M1 · Pagination depicts the wrong collection size · P2

Observed `simulateMechanism('pagination', {amount:4, alternative:true})`:

- The declared dataset is ids 1 through 10; row 1 is deleted.
- `Earlier page ended` and `Delete an earlier row` both set `counts.a=8`.
- The cursor result `5,6,7` is correct. The collection count is not: it should be 10 before deletion and 9 afterwards.

The same count defect occurs at every allowed last-row input under either policy. Repair the two state counts and preserve the shifted-offset/cursor counterexample. This is arithmetic established directly by the model's own input, without requiring an external performance claim.

### M2 · Retained work is animated as delivered to a worker deliberately kept crashed · P2

Observed `simulateMechanism('redelivery', {amount:3, alternative:true})`:

1. `Worker crashes` records `b='crashed'`, with zero saved effects.
2. Three `Redelivery opportunity` beats each emit `from:'a', to:'b'`.
3. Their caption explicitly says the worker stays failed.

The durable-obligation result of one pending job is correct. The animation implies successful arrival at a known unavailable consumer, confusing eligibility for future delivery with actual delivery. A minimal repair keeps opportunity inspection at the broker with no message endpoints; a fuller repair explicitly registers a live/restarted consumer before sending the job.

Fresh source: [RabbitMQ Consumer Acknowledgements and Publisher Confirms](https://www.rabbitmq.com/docs/confirms#when-consumers-fail), **When Consumers Fail or Lose Connection: Automatic Requeueing**, read 2026-10-30. Unacknowledged deliveries are requeued after channel/connection closure, and another consumer may receive a redelivery; detecting unavailability takes time. The model should distinguish retained eligibility from delivery to a live consumer.

## High-impact objective gaps

These are incomplete teaching coverage, not claims that the bounded results below are mathematically false. Do not erase course objectives merely to make a coverage flag green.

| Chapter(s) | Declared curriculum capability | What the current model demonstrates | Missing acceptance example |
|---|---|---|---|
| caching-basics | Compute effective latency from hit rate and explain locality | Cache age 2 returns policy-permitted old v1; age 3 or invalidation fetches v2 | Compare a declared hit rate and hit/miss costs, derive expected latency, then change locality/request trace |
| indexes | Query suitability, write cost and composite-key order | Binary-search proxy for the final scalar key | Contrast `(tenant, time)` access with a predicate that lacks its leading key, and account for index maintenance on a write |
| query-planning | Read a query plan and fix an expensive step | Compare invented scan/index cost formulas | Inspect an actual explicitly illustrative plan tree, distinguish estimated/actual rows and find the dominant operator |
| isolation | Dirty reads, lost updates, write skew and preventing levels | One stale read-modify-write counter update; dirty-read visibility is in concurrency-control | Two transactions preserve a local predicate but jointly violate an invariant; demonstrate the selected engine-specific prevention/retry boundary |
| transactions | Explain all ACID properties | Atomic rollback of a two-account transfer | Distinguish declared consistency constraints, isolation and durability; atomicity alone cannot establish the other three |
| eviction | Simulate LRU, LFU and TTL on traces and compare hit rates | Exact one-insertion LRU versus keeping every entry | A repeated trace where recency/frequency select different victims and expiry is an independent rule |
| cache-invalidation | Design invalidation and state a staleness bound | One policy-age check versus invalidating before a read | Race a stale fill with invalidation or explicitly bound freshness under stated TTL/propagation assumptions |
| cdn | Routing to nearby copies and cacheable content | Same single-cache age model | Separate edge selection from cache freshness and show a cache-key/private-content counterexample |
| conflict-resolution | LWW, version vectors or CRDTs with loss/tradeoffs | Grow-only componentwise-max counter | Trace concurrent non-counter edits or deletion; justify a chosen resolution rule rather than extending this counter arbitrarily |
| consistency-models | Test linearizable, causal and eventual histories | One nonoverlapping write/read history plus convergence; causal semantics are only a boundary sentence | A causally dependent read versus an independent client read, with admissible/forbidden observations |
| partitioning / hot-partitions | Range/hash routing, secondary queries and mitigation | Synthetic modulo keys versus one hot key, fixed per-shard capacity | A query without the partition key and a changed key design/salt requiring read fan-in |
| coordination-services | Configuration, discovery and leader election | Exactly the same fencing-token comparison as distributed-locks | Versioned config/watch, stale discovery after disconnect and lease-scoped registration; do not equate fencing alone with the service |
| timeouts-retries | Backoff/jitter, bounded amplification, safe effects | Counts one delayed retry versus two immediate retries | Visible attempt schedules from a deterministic jitter seed and a layered-retry amplification counterexample |
| health-checks | Liveness/readiness design and incorrect-probe behavior | Routes away from an unready worker | Separate restart decision from traffic eligibility and expose a shallow/aggressive probe counterexample |

The full-course inventory report can attach these gaps to individual rows. A generic shared renderer improvement does not fill them.

## Family coverage

All rows below had definitions, trace logic and boundary execution examined. “Source review” means checking internal correspondence and stated simplifications; it does not mean fresh primary verification or rendered acceptance.

| Family | Existing mechanisms in this review | Finding / evidence boundary |
|---|---|---|
| Data modelling (5) | embedding, sqlJoin, sqlSets, foreignKey, copies | Join/set/FK distinctions retained. Embedding is a co-read bounded example, not an endorsement for every relationship. Normalisation lacks a worked schema decomposition. |
| Storage/transactions (10) | storageLayout, planner, mvcc, index, transaction, isolation, log, storageChoice, columns | Layout/recovery split is explicit in current parent changes. Binary search, invented costs and dirty-read visibility have stated scope; broad objectives remain above. |
| Cache (5) | cache, httpValidation, cacheWrite, eviction, coalesce | Conditional validation and stale-cache behavior are internally coherent. Coalescing combines identical reusable work, not subscriber deliveries. Richer declared workload/policy objectives remain. |
| API/data contracts (5) | pagination, version, dedup, bucket, sharedQuota | M1 count defect. Dedup assumes coordinated durable keys; shared quota explicitly serializes one allowance. Codec and rate-limiter families are narrower than their complete topics. |
| Serving/compute (6) | session, proxy, replacement, scaleLag, queue, health | Ready capacity and session state are distinct. Startup/detection windows are illustrative; no measured scaling guarantee follows. Health coverage gap above. |
| Messaging/processing (8) | redelivery, flow, offsets, mapReduce, outbox, fanout, communication, window | M2 arrival depiction. Outbox correctly has one local atomic boundary. Watermark progress is not certainty. Old offsets model uses a numbered-entry abstraction, not the new Kafka next-offset companion. |
| Distributed data (9) | uncertain, readQuorum, replication, quorum, merge, partition, hashring, consistencyHistory, partitionChoice | Known parent quorum fixes included in integrity sweep but not treated as a new finding. Fixed version-order assumptions and quorum-vs-linearizability limits are visible. Broad coverage gaps remain above. |
| Coordination (9) | twoPhase, saga, election, gossip, consensusLog, clock, lease, unique, uuidLayout | Bounded current-term commit, compensating actions, grow-only namespaces and illustrative UUID bits retain limits. Fencing-token values ≥3 are valid accepted cases; calling all of them an “old worker” is imprecise wording, not a false rejection verdict. Discovery/configuration is missing. |
| Reliability/operations (10) | bulkhead, retry, breaker, canary, migration, recovery, injection, budget, signals, trace | Parent bulkhead repair is represented in sweep. Parallel span max assumes equal start/no parent overhead. Canary cohorts/assumptions and deterministic fault tests do not establish production guarantees. Retry timing gap above. |
| Security/privacy (5) | sql, gate, identity, rotation, retention | Parameter binding, object authorization, expiry and retired-key generation remain distinct. Expired/retired credentials are kept within the declared valid example ranges. Retention covers modeled copies, not a legal guarantee or complete backup policy. |
| Domain mechanisms (9) | upload, feed, chat, crawler, prefix, inverted, fileVersions, segments, spatial | Receipt scope, eligible frontier, preserved conflict and Cartesian distance limits are stated. Full case architectures and every real protocol detail were not independently reverified here. |
| Architecture/cost (4) | boundaries, architecture, cost, decision | Bundled worker-capacity/provider-dedup changes are explicitly declared. Toy plan units and self-assessed design work are not benchmarks or automated grading. |

## Unreviewed and release status

Excluded from independent acceptance: reviewer-authored pilots; specialized foundation/API model implementation; every case-guide request/failure path; every rendered chapter/theme/viewport; screen-reader behavior; physical devices; actual frame timing; learner outcomes; new implementations made after this snapshot. Primary-source claims outside the freshly read RabbitMQ section rely on separately recorded earlier research and require targeted rechecks when their behavior changes.

Do not mark a chapter verified because its mechanism appears in this report. Disposition M1/M2 with changed-code evidence and regressions, then carry the explicit objective gaps into the course quality matrix and the next implementation batches.
