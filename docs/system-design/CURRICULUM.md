# Curriculum

The learning graph of the system design course. This is the only place chapter ids, prerequisites and status
live. The format is in `.claude/skills/system-design-educator/references/course-state.md`; `course.mjs check`
validates it. Designed in mode B on 2026-10-27.

Product: src/app/learn

## How it is organised

- **119 chapters in 12 stages**, from how a page load works to end-to-end designs. One new core mechanism per
  chapter.
- **Map chapters.** `web-request`, `distributed-trouble` and `security-map` are overviews. They orient the learner,
  give each part one plain paragraph, and link to the chapter that teaches it. Their own idea is the map: the order
  of steps, or the kinds of failure or threat.
- **Mixed review.** Mixed practice comes after topics are learned (interleaving, used late per the skill's
  learning-science notes):
  - `review-foundations` covers stages 1–6.
  - `review-distributed` covers stages 7–11.
  - `capstone` closes the interview path.
- **Prerequisites** are hard dependencies only: what a chapter's explanation relies on. Related chapters are linked
  from chapter specs, not the graph.
- **Concrete before abstract.**
  - Queueing comes after percentiles.
  - Consistency models come after replication lag has shown the problem.
  - CAP comes after the consistency models it is stated in terms of.

## Paths

One graph, three filters. Every path is closed: each chapter's prerequisites are on every path the chapter is on.
This was checked when the graph was built.

| Path         | Chapters | Goal                                                                                                       |
| ------------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| `beginner`   | 57       | Genuine understanding from first principles: the core of stages 1–7 and 9–11, no interview framing         |
| `interview`  | 106      | Interview readiness: everything needed by the method chapter, 12 case studies and the capstone             |
| `production` | 106      | Engineering decisions in production: depth in data, reliability, operations, security, cost and migration |

Chapters on all three paths form the shared core.

- **Interview only:** the method chapter, the case studies and the capstone.
- **Production only:**
  - `cloud-networking`
  - `query-planning`
  - `concurrency-control`
  - `compute-platforms`
  - `membership-gossip`
  - `distributed-tracing`
  - `alerting-incidents`
  - `zero-downtime-migrations`
  - `fault-injection`
  - `privacy-retention`
  - `cost`

## Graph

<!-- graph:start -->

| id | order | stage | title | prereqs | paths | status |
| --- | --- | --- | --- | --- | --- | --- |
| web-request | 1 | 1 | Map: what happens when you open a website |  | beginner interview production | reviewed |
| client-server | 2 | 1 | Clients, servers and request–response | web-request | beginner interview production | planned |
| ip-and-ports | 3 | 1 | Addresses, packets and ports | client-server | beginner interview production | planned |
| dns | 4 | 1 | DNS: from names to addresses | ip-and-ports | beginner interview production | planned |
| tcp | 5 | 1 | TCP: reliable streams over unreliable packets | ip-and-ports | beginner interview production | planned |
| tls | 6 | 1 | TLS: encrypted, authenticated connections | tcp | beginner interview production | planned |
| http | 7 | 1 | HTTP: methods, status codes and headers | tcp | beginner interview production | planned |
| udp-quic | 8 | 1 | UDP and QUIC: when TCP is not the answer | tcp tls | beginner production | planned |
| http-versions | 9 | 1 | HTTP/1.1, HTTP/2 and HTTP/3 | http udp-quic | beginner production | planned |
| cloud-networking | 10 | 1 | Networks inside a cloud: VPCs, subnets and NAT | ip-and-ports | production | planned |
| latency-throughput | 11 | 1 | Latency and throughput | web-request | beginner interview production | planned |
| percentiles | 12 | 1 | Percentiles and tail latency | latency-throughput | beginner interview production | planned |
| latency-numbers | 13 | 1 | Where time goes: memory, disk and network | latency-throughput | beginner interview production | planned |
| estimation | 14 | 1 | Back-of-envelope estimation | latency-numbers | beginner interview production | planned |
| utilisation-queueing | 15 | 1 | Utilisation, queues and Little's law | percentiles | beginner interview production | planned |
| api-design | 16 | 2 | API design: contracts between programs | http | beginner interview production | planned |
| rest | 17 | 2 | Resource-oriented HTTP APIs (REST) | api-design | beginner interview production | planned |
| rpc | 18 | 2 | RPC and gRPC | api-design | beginner interview production | planned |
| graphql | 19 | 2 | GraphQL and client-shaped queries | api-design | interview production | planned |
| realtime | 20 | 2 | Pushing to clients: polling, SSE and WebSockets | http | beginner interview production | planned |
| idempotency | 21 | 2 | Idempotency and safe retries | api-design | beginner interview production | planned |
| pagination | 22 | 2 | Pagination and large results | rest | interview production | planned |
| encoding-evolution | 23 | 2 | Encoding data and evolving schemas | api-design | interview production | planned |
| rate-limiting | 24 | 2 | Rate limiting: token and leaky buckets | api-design | beginner interview production | planned |
| data-modelling | 25 | 2 | Data modelling: entities, relationships and access patterns | api-design | beginner interview production | planned |
| relational-model | 26 | 2 | The relational model and SQL | data-modelling | beginner interview production | planned |
| normalisation | 27 | 2 | Normalisation and denormalisation | relational-model | beginner interview production | planned |
| document-model | 28 | 2 | Document, key-value, wide-column and graph models | relational-model | beginner interview production | planned |
| storage-engines | 29 | 3 | How databases store data: pages, logs, B-trees and LSM-trees | relational-model latency-numbers | beginner interview production | planned |
| indexes | 30 | 3 | Indexes: making reads fast | storage-engines | beginner interview production | planned |
| query-planning | 31 | 3 | Query plans and slow queries | indexes | production | planned |
| transactions | 32 | 3 | Transactions and ACID | relational-model | beginner interview production | planned |
| isolation | 33 | 3 | Isolation levels and anomalies | transactions | interview production | planned |
| concurrency-control | 34 | 3 | Concurrency control: locks and MVCC | isolation storage-engines | production | planned |
| probabilistic-structures | 35 | 3 | Probabilistic structures: Bloom filters and sketches | storage-engines | interview production | planned |
| search-indexes | 36 | 3 | Full-text search and inverted indexes | indexes | interview production | planned |
| geospatial-indexes | 37 | 3 | Geospatial indexes | indexes | interview production | planned |
| analytics-storage | 38 | 3 | Analytics storage: column stores and data warehouses | storage-engines indexes | interview production | planned |
| object-storage | 39 | 3 | Blob and object storage | storage-engines | beginner interview production | planned |
| choosing-a-database | 40 | 3 | Choosing a database | document-model indexes transactions | beginner interview production | planned |
| vertical-horizontal | 41 | 4 | Vertical and horizontal scaling | utilisation-queueing | beginner interview production | planned |
| stateless-services | 42 | 4 | Stateless services and where state goes | vertical-horizontal | beginner interview production | planned |
| load-balancing | 43 | 4 | Load balancing: layer 4, layer 7 and algorithms | stateless-services tcp http | beginner interview production | planned |
| reverse-proxies | 44 | 4 | Reverse proxies and API gateways | load-balancing | beginner interview production | planned |
| health-checks | 45 | 4 | Health checks and failover | load-balancing | beginner interview production | planned |
| compute-platforms | 46 | 4 | Compute platforms: VMs, containers and orchestration | stateless-services | production | planned |
| autoscaling | 47 | 4 | Autoscaling and capacity planning | vertical-horizontal estimation | interview production | planned |
| caching-basics | 48 | 5 | Caching: hits, misses and why it works | latency-numbers | beginner interview production | planned |
| http-caching | 49 | 5 | HTTP caching: Cache-Control and validation | caching-basics http | beginner interview production | planned |
| cdn | 50 | 5 | CDNs and the edge | http-caching dns | beginner interview production | planned |
| app-caching | 51 | 5 | Application caches: cache-aside, write-through and write-back | caching-basics stateless-services | beginner interview production | planned |
| eviction | 52 | 5 | Eviction: LRU, LFU and TTL | caching-basics | beginner interview production | planned |
| cache-invalidation | 53 | 5 | Invalidation and staleness | app-caching | beginner interview production | planned |
| cache-failure-modes | 54 | 5 | Stampedes, hot keys and cache failure | cache-invalidation load-balancing | interview production | planned |
| async-work | 55 | 6 | Synchronous and asynchronous work | utilisation-queueing stateless-services | beginner interview production | planned |
| message-queues | 56 | 6 | Message queues and workers | async-work | beginner interview production | planned |
| delivery-semantics | 57 | 6 | Delivery guarantees: at-most-once, at-least-once, effectively-once | message-queues idempotency | beginner interview production | planned |
| pub-sub | 58 | 6 | Publish/subscribe and fan-out | message-queues | beginner interview production | planned |
| backpressure | 59 | 6 | Backpressure and load shedding | message-queues | interview production | planned |
| logs-streams | 60 | 6 | Logs and event streams | pub-sub storage-engines | interview production | planned |
| stream-processing | 61 | 6 | Stream processing: windows and state | logs-streams | interview production | planned |
| batch-processing | 62 | 6 | Batch processing and MapReduce | storage-engines estimation | interview production | planned |
| event-driven | 63 | 6 | Event-driven architecture: outbox and change data capture | logs-streams transactions | interview production | planned |
| review-foundations | 64 | 6 | Review: mixed practice on stages 1–6 | event-driven cache-failure-modes choosing-a-database | interview production | planned |
| distributed-trouble | 65 | 7 | Map: what breaks in distributed systems | tcp health-checks | beginner interview production | planned |
| replication | 66 | 7 | Replication: leaders and followers | distributed-trouble transactions | beginner interview production | planned |
| replication-lag | 67 | 7 | Replication lag and read-your-writes | replication | beginner interview production | planned |
| multi-leader-leaderless | 68 | 7 | Multi-leader and leaderless replication, quorums | replication-lag | interview production | planned |
| conflict-resolution | 69 | 7 | Conflict resolution and CRDTs | multi-leader-leaderless | interview production | planned |
| consistency-models | 70 | 7 | Consistency models: from linearizable to eventual | replication-lag isolation | interview production | planned |
| cap-pacelc | 71 | 7 | CAP and PACELC, read carefully | consistency-models | interview production | planned |
| partitioning | 72 | 7 | Partitioning (sharding) | replication indexes | beginner interview production | planned |
| consistent-hashing | 73 | 7 | Consistent hashing and rebalancing | partitioning | interview production | planned |
| hot-partitions | 74 | 7 | Hot keys and skew | consistent-hashing | interview production | planned |
| distributed-transactions | 75 | 7 | Distributed transactions: two-phase commit and sagas | partitioning event-driven | interview production | planned |
| time-clocks | 76 | 8 | Time, clocks and ordering | distributed-trouble | interview production | planned |
| unique-ids | 77 | 8 | Generating unique IDs | time-clocks partitioning | interview production | planned |
| leader-election | 78 | 8 | Leader election, leases and fencing | time-clocks health-checks | interview production | planned |
| distributed-locks | 79 | 8 | Distributed locks and their limits | leader-election | interview production | planned |
| consensus | 80 | 8 | Consensus and Raft | leader-election replication | interview production | planned |
| membership-gossip | 81 | 8 | Membership and gossip | distributed-trouble | production | planned |
| coordination-services | 82 | 8 | Coordination services and service discovery | consensus load-balancing | interview production | planned |
| failure-modes | 83 | 9 | Failure modes and blast radius | distributed-trouble | beginner interview production | planned |
| timeouts-retries | 84 | 9 | Timeouts, retries, backoff and jitter | failure-modes idempotency | beginner interview production | planned |
| circuit-breakers | 85 | 9 | Circuit breakers and bulkheads | timeouts-retries | interview production | planned |
| cascading-failures | 86 | 9 | Overload and cascading failures | circuit-breakers backpressure | interview production | planned |
| slos | 87 | 9 | SLIs, SLOs and error budgets | percentiles failure-modes | beginner interview production | planned |
| observability | 88 | 9 | Observability: metrics, logs and traces | slos | beginner interview production | planned |
| distributed-tracing | 89 | 9 | Distributed tracing | observability | production | planned |
| alerting-incidents | 90 | 9 | Alerting, on-call and incident response | observability | production | planned |
| deployments | 91 | 9 | Safe deployments: canaries, feature flags and rollbacks | health-checks observability | interview production | planned |
| zero-downtime-migrations | 92 | 9 | Schema and data migrations without downtime | encoding-evolution deployments replication | production | planned |
| multi-region | 93 | 9 | Multi-region and disaster recovery | replication-lag cdn failure-modes cap-pacelc | interview production | planned |
| fault-injection | 94 | 9 | Testing distributed systems: fault injection and chaos | failure-modes observability | production | planned |
| security-map | 95 | 10 | Map: security in system design | api-design tls | beginner interview production | planned |
| authentication | 96 | 10 | Authentication: sessions, tokens, OAuth and OpenID Connect | security-map | beginner interview production | planned |
| authorization | 97 | 10 | Authorization and access control | authentication | beginner interview production | planned |
| encryption-secrets | 98 | 10 | Encryption at rest, in transit, and secrets management | security-map | interview production | planned |
| web-vulnerabilities | 99 | 10 | Common web vulnerabilities (OWASP Top 10) | authorization | beginner interview production | planned |
| abuse-protection | 100 | 10 | Abuse protection: DDoS, bots and quotas | rate-limiting cdn security-map | interview production | planned |
| privacy-retention | 101 | 10 | Privacy, data minimisation and retention | security-map | production | planned |
| service-boundaries | 102 | 11 | Monoliths, modular monoliths and microservices | stateless-services api-design | beginner interview production | planned |
| service-communication | 103 | 11 | Service-to-service communication | service-boundaries rpc message-queues | interview production | planned |
| cost | 104 | 11 | Cost as a design constraint | estimation autoscaling | production | planned |
| decision-records | 105 | 11 | Making and recording trade-off decisions | service-boundaries | interview production | planned |
| review-distributed | 106 | 11 | Review: mixed practice on stages 7–11 | consensus multi-region service-communication cascading-failures | interview production | planned |
| interview-method | 107 | 12 | The system design interview method | estimation api-design data-modelling | interview | planned |
| case-url-shortener | 108 | 12 | Case: URL shortener | interview-method unique-ids app-caching choosing-a-database | interview | planned |
| case-rate-limiter | 109 | 12 | Case: distributed rate limiter | interview-method rate-limiting app-caching consistency-models | interview | planned |
| case-news-feed | 110 | 12 | Case: news feed | interview-method pub-sub app-caching partitioning | interview | planned |
| case-chat | 111 | 12 | Case: chat system | interview-method realtime message-queues partitioning | interview | planned |
| case-notifications | 112 | 12 | Case: notification system | interview-method delivery-semantics rate-limiting | interview | planned |
| case-web-crawler | 113 | 12 | Case: web crawler | interview-method dns message-queues probabilistic-structures | interview | planned |
| case-search-autocomplete | 114 | 12 | Case: search autocomplete | interview-method search-indexes app-caching | interview | planned |
| case-file-storage | 115 | 12 | Case: file storage and sync | interview-method object-storage cdn conflict-resolution | interview | planned |
| case-video-streaming | 116 | 12 | Case: video streaming | interview-method object-storage cdn batch-processing | interview | planned |
| case-proximity | 117 | 12 | Case: nearby places | interview-method geospatial-indexes app-caching | interview | planned |
| case-payments | 118 | 12 | Case: payments and ledgers | interview-method idempotency distributed-transactions isolation | interview | planned |
| capstone | 119 | 12 | Capstone: design, estimate and defend a system end to end | decision-records review-distributed case-payments | interview | planned |

<!-- graph:end -->

## Learning objectives

One observable objective per chapter scopes it. Mode C refines these into two to four objectives in the chapter
spec.

### Stage 1. Foundations: how the web works and how to measure it

- `web-request` *(map)*: Trace a page load from typed URL to rendered page, naming each step and where its time goes.
- `client-server`: Explain the roles of client and server and what one request–response exchange contains.
- `ip-and-ports`: Explain how IP addresses and ports identify a process on a machine and why packets can be lost or reordered.
- `dns`: Follow a name lookup through resolvers and authoritative servers and predict the effect of TTLs.
- `tcp`: Explain how acknowledgements, retransmission and flow control turn lossy packets into an ordered stream.
- `tls`: Explain what a TLS handshake establishes (identity, keys) and what it costs in round trips.
- `http`: Read and write HTTP requests and responses and say what each method and status class promises.
- `udp-quic`: Explain head-of-line blocking and why QUIC moves reliability and encryption onto UDP.
- `http-versions`: Compare how each HTTP version uses connections and predict which one a slow, lossy link favours.
- `cloud-networking`: Sketch a private network with public and private subnets and say which traffic can reach what.
- `latency-throughput`: Distinguish latency from throughput and show how improving one can leave the other unchanged.
- `percentiles`: Compute percentiles from samples and explain why averages hide the experience of slow requests.
- `latency-numbers`: Rank memory, SSD, disk and network operations by orders of magnitude and use that to spot bottlenecks.
- `estimation`: Estimate requests per second, storage and bandwidth for a described product, stating every assumption.
- `utilisation-queueing`: Use utilisation and Little's law to predict how waiting time grows as a server approaches full load.

### Stage 2. APIs and data modelling

- `api-design`: Describe an API as a contract (resources, operations, errors) and judge it by what callers can rely on.
- `rest`: Design resource URLs and choose methods and status codes that keep HTTP semantics.
- `rpc`: Explain remote procedure calls, what network failure does to "call a function", and when RPC fits.
- `graphql`: Explain what GraphQL moves to the client and what it costs the server (query cost, caching).
- `realtime`: Choose between polling, long polling, server-sent events and WebSockets for a given update pattern.
- `idempotency`: Make an operation safe to retry with idempotency keys and explain why the network forces this.
- `pagination`: Compare offset and cursor pagination and predict which breaks when data changes during paging.
- `encoding-evolution`: Explain backward and forward compatibility and evolve a JSON or Protobuf schema without breaking callers.
- `rate-limiting`: Simulate token-bucket and window limiters and choose limits that protect a service without starving users.
- `data-modelling`: Model a domain as entities and relationships, starting from the queries the product must answer.
- `relational-model`: Express a data model as tables, keys and joins and read a SQL query as a set operation.
- `normalisation`: Normalise a schema to remove update anomalies and justify when to denormalise for reads.
- `document-model`: Match document, key-value, wide-column and graph models to the access patterns each serves well.

### Stage 3. Storage and databases

- `storage-engines`: Explain how B-trees and LSM-trees lay out data on disk and what each favours: reads or writes.
- `indexes`: Predict which queries an index speeds up, what it costs writes, and how composite index order matters.
- `query-planning`: Read a query plan, find the expensive step and fix it with an index or a rewrite.
- `transactions`: Explain what atomicity, consistency, isolation and durability each promise, and what they do not.
- `isolation`: Reproduce dirty reads, lost updates and write skew and name the isolation level that prevents each.
- `concurrency-control`: Explain how locking and multi-version concurrency control implement isolation and where each blocks.
- `probabilistic-structures`: Use a Bloom filter or count sketch, stating its error rate and what kind of mistake it can make.
- `search-indexes`: Build an inverted index by hand and explain tokenising, ranking and why search is a separate system.
- `geospatial-indexes`: Find nearby points with a grid, geohash or tree index and explain why plain indexes fail at this.
- `analytics-storage`: Explain why column-oriented storage suits analytical scans and keep analytics off the transactional database.
- `object-storage`: Decide what belongs in object storage rather than a database and serve large files without the app in the path.
- `choosing-a-database`: Choose a database for a workload from its access patterns, consistency needs and operational cost.

### Stage 4. Scaling a service

- `vertical-horizontal`: Compare scaling up and scaling out and identify what stops each from going further.
- `stateless-services`: Move session and file state out of application servers so any instance can serve any request.
- `load-balancing`: Choose a load-balancing layer and algorithm and predict how each behaves with uneven requests.
- `reverse-proxies`: Explain what a reverse proxy or gateway terminates, routes and enforces in front of services.
- `health-checks`: Design liveness and readiness checks and predict failover behaviour when a check is wrong.
- `compute-platforms`: Explain what VMs, containers and an orchestrator each provide for running many service instances.
- `autoscaling`: Choose a scaling signal and headroom and explain why autoscaling lags sudden load.

### Stage 5. Caching

- `caching-basics`: Compute effective latency from hit rate and explain locality as the reason caches work.
- `http-caching`: Set Cache-Control and validators so browsers and proxies reuse responses safely.
- `cdn`: Explain how a CDN routes users to nearby copies and what can and cannot be cached there.
- `app-caching`: Choose a cache write strategy and predict the stale or lost data each one risks.
- `eviction`: Simulate LRU, LFU and TTL eviction on an access trace and compare their hit rates.
- `cache-invalidation`: Design invalidation for a cached read path and state the staleness bound it gives.
- `cache-failure-modes`: Predict a cache stampede and a hot key and apply request coalescing, jitter or replication.

### Stage 6. Asynchronous work: queues and streams

- `async-work`: Decide which work must finish within the request and which can be deferred, and what deferral costs.
- `message-queues`: Explain how a queue decouples producers from workers and how backlog absorbs bursts.
- `delivery-semantics`: Explain why exactly-once delivery is unachievable over a lossy network and how idempotent processing gives effectively-once results.
- `pub-sub`: Compare queues and topics and design fan-out to many consumers.
- `backpressure`: Choose between buffering, backpressure and shedding when consumers fall behind.
- `logs-streams`: Explain a partitioned, replayable log, ordering per partition, and consumer groups.
- `stream-processing`: Aggregate events over time windows and explain event time, late data and processing state.
- `batch-processing`: Express a large computation as map and reduce steps and compare batch with stream processing.
- `event-driven`: Publish events reliably from a database write with an outbox or change data capture.
- `review-foundations` *(mixed review)*: Solve mixed problems that require choosing between networking, data, caching and queueing ideas.

### Stage 7. Distributed data: replication, partitioning, consistency

- `distributed-trouble` *(map)*: Name partial failure, unreliable networks, process pauses and unreliable clocks, and why each surprises.
- `replication`: Explain single-leader replication, synchronous versus asynchronous followers, and failover.
- `replication-lag`: Predict the anomalies replication lag causes and apply read-your-writes and monotonic reads.
- `multi-leader-leaderless`: Explain quorum reads and writes (W + R > N) and what they do and do not guarantee.
- `conflict-resolution`: Resolve concurrent writes with last-write-wins, version vectors or CRDTs and state what each loses.
- `consistency-models`: Place linearizability, causal and eventual consistency on a ladder and test a history against each.
- `cap-pacelc`: State CAP precisely (a partition forces a choice) and use PACELC for the latency trade-off without partitions.
- `partitioning`: Partition data by key range or hash and route queries, including secondary-index queries.
- `consistent-hashing`: Show how consistent hashing limits data movement when nodes join or leave.
- `hot-partitions`: Detect a hot partition and spread its load by key salting, splitting or caching.
- `distributed-transactions`: Compare two-phase commit with sagas and compensations, including what blocks when a coordinator fails.

### Stage 8. Coordination

- `time-clocks`: Explain why wall clocks disagree and order events with logical clocks instead.
- `unique-ids`: Design an ID scheme (random, time-ordered or allocated ranges) and state its collision and ordering properties.
- `leader-election`: Elect a leader with leases and use fencing tokens so an old leader cannot corrupt data.
- `distributed-locks`: Explain when a distributed lock is safe, when it is only an optimisation, and how pauses break it.
- `consensus`: Walk through Raft leader election and log replication and explain why a majority is required.
- `membership-gossip`: Explain how gossip spreads membership and failure suspicion without a central server.
- `coordination-services`: Use a coordination service (e.g. etcd or ZooKeeper) for configuration, discovery and leader election.

### Stage 9. Reliability and operations

- `failure-modes`: Classify failures (crash, slow, wrong, partial) and limit the blast radius of each by design.
- `timeouts-retries`: Set timeouts and retry with exponential backoff and jitter, and predict a retry storm without them.
- `circuit-breakers`: Isolate a failing dependency with a circuit breaker and bulkheads and predict the behaviour of each state.
- `cascading-failures`: Trace how overload spreads between services and stop it with shedding, limits and degradation.
- `slos`: Define SLIs and SLOs for a service and use an error budget to decide between features and reliability.
- `observability`: Choose metrics, logs and traces to answer a given production question and explain the cost of each.
- `distributed-tracing`: Follow one request across services with trace context and find where its latency went.
- `alerting-incidents`: Alert on symptoms tied to SLOs, run an incident, and write a blameless review.
- `deployments`: Release a change gradually with canaries and flags and roll back on a measured signal.
- `zero-downtime-migrations`: Plan an expand–migrate–contract change that keeps old and new code working throughout.
- `multi-region`: Choose active-passive or active-active across regions with explicit recovery time and data loss targets.
- `fault-injection`: Design a fault-injection experiment with a hypothesis, a blast-radius limit and a stop condition.

### Stage 10. Security

- `security-map` *(map)*: Identify assets, trust boundaries and threats in an architecture diagram.
- `authentication`: Compare session cookies and tokens and follow an OAuth/OpenID Connect login flow.
- `authorization`: Enforce role- or attribute-based access checks on every request and find a broken access check.
- `encryption-secrets`: Decide what to encrypt where, manage keys and secrets, and rotate them without downtime.
- `web-vulnerabilities`: Recognise injection, broken access control and other common flaws and apply the matching defence.
- `abuse-protection`: Layer edge filtering, rate limits and quotas to keep a service up under abusive traffic.
- `privacy-retention`: Design data collection, retention and deletion so personal data is kept only as long as needed.

### Stage 11. Architecture decisions

- `service-boundaries`: Choose a service boundary from team, data and deployment needs and state what splitting costs.
- `service-communication`: Choose synchronous calls or events between services and predict how failures propagate through each.
- `cost`: Estimate the running cost of a design and find the component that dominates it.
- `decision-records`: Write a decision record that states options, trade-offs and the conditions that would change the choice.
- `review-distributed` *(mixed review)*: Solve mixed problems across replication, coordination, reliability and architecture choices.

### Stage 12. Practice: the interview method and case studies

- `interview-method`: Run a design interview: requirements, estimates, API, data model, high-level design, deep dives, trade-offs.
- `case-url-shortener`: Design a URL shortener end to end, including ID generation, storage, caching and redirects.
- `case-rate-limiter`: Design a rate limiter shared by many servers and state its accuracy under concurrency and failure.
- `case-news-feed`: Design a feed, choosing fan-out on write or read and handling very popular accounts.
- `case-chat`: Design one-to-one and group chat with delivery receipts, ordering and offline delivery.
- `case-notifications`: Design multi-channel notifications with retries, deduplication and user preferences.
- `case-web-crawler`: Design a polite, deduplicating crawler and estimate its throughput.
- `case-search-autocomplete`: Design low-latency prefix suggestions and explain how they are built and refreshed.
- `case-file-storage`: Design file upload, storage and sync across devices, including conflicting edits.
- `case-video-streaming`: Design video upload, transcoding and adaptive delivery through a CDN.
- `case-proximity`: Design a "places near me" service with a geospatial index and caching.
- `case-payments`: Design a payment flow and ledger that stay correct under retries, timeouts and partial failure.
- `capstone` *(mixed review)*: Design a system from a brief, estimate it, and defend each trade-off in a written decision record.

## Coverage

| Area (owner's brief)                 | Chapters                                                                                                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Networking                           | web-request, client-server, ip-and-ports, dns, tcp, tls, http, udp-quic, http-versions, cloud-networking                                                                                                                                    |
| Latency                              | latency-throughput, percentiles, latency-numbers, estimation, utilisation-queueing                                                                                                                                                         |
| APIs                                 | api-design, rest, rpc, graphql, realtime, idempotency, pagination, encoding-evolution, rate-limiting                                                                                                                                        |
| Data modelling                       | data-modelling, relational-model, normalisation, document-model                                                                                                                                                                             |
| Databases and indexing               | storage-engines, indexes, query-planning, transactions, isolation, concurrency-control, probabilistic-structures, search-indexes, geospatial-indexes, analytics-storage, object-storage, choosing-a-database                                |
| Caching                              | caching-basics, http-caching, cdn, app-caching, eviction, cache-invalidation, cache-failure-modes                                                                                                                                           |
| Queues and streams                   | async-work, message-queues, delivery-semantics, pub-sub, backpressure, logs-streams, stream-processing, batch-processing, event-driven                                                                                                      |
| Consistency, replication, partitions | distributed-trouble, replication, replication-lag, multi-leader-leaderless, conflict-resolution, consistency-models, cap-pacelc, partitioning, consistent-hashing, hot-partitions, distributed-transactions                                |
| Distributed coordination             | time-clocks, unique-ids, leader-election, distributed-locks, consensus, membership-gossip, coordination-services                                                                                                                           |
| Reliability                          | failure-modes, timeouts-retries, circuit-breakers, cascading-failures, slos, deployments, zero-downtime-migrations, multi-region, fault-injection                                                                                          |
| Observability                        | observability, distributed-tracing, alerting-incidents                                                                                                                                                                                      |
| Security                             | security-map, authentication, authorization, encryption-secrets, web-vulnerabilities, abuse-protection, privacy-retention                                                                                                                  |
| Scaling                              | vertical-horizontal, stateless-services, load-balancing, reverse-proxies, health-checks, compute-platforms, autoscaling                                                                                                                     |
| End-to-end design                    | service-boundaries, service-communication, cost, decision-records, interview-method, the 12 `case-*` chapters, capstone                                                                                                                    |

**Added beyond the brief (found while scoping):**

- encoding and schema evolution
- batch processing
- outbox and change data capture
- conflict resolution and CRDTs
- probabilistic structures
- geospatial and analytics storage
- membership and gossip
- cloud networking
- compute platforms
- zero-downtime migrations
- fault injection
- privacy and retention
- cost
- decision records

**Known gaps (not in the graph yet; candidates for a later mode B):**

- Offline-first clients and sync, beyond what `case-file-storage` needs.
- Machine-learning serving and feature pipelines.
- Search ranking in depth.
- A beginner-path capstone: beginners have no end-to-end unit, and the case studies are interview-only.
- Cases for a ticketing/booking system and a collaborative editor.

## Scoping sources

These sources informed which topics to cover and in what order. No chapter content is drawn from them yet; each
chapter does its own research in mode C. Access is recorded honestly. Direct fetches of pdos.csail.mit.edu,
sre.google and owasp.org failed with DNS errors on 2026-10-27.

| Source | What it informed | Access |
| --- | --- | --- |
| System Design Primer (donnemartin, CC BY 4.0), README topic index and solution list | Topic checklist (performance vs scalability, latency vs throughput, CAP, consistency/availability patterns, DNS, CDN, load balancer, reverse proxy, application layer, databases, cache, asynchronism, communication, security) and case list | **Read** (local clone) |
| Kleppmann, *Designing Data-Intensive Applications* (2017), chapter list | Data stages: data models, storage and retrieval, encoding and evolution, replication, partitioning, transactions, trouble with distributed systems, consistency and consensus, batch, stream | Snippet only |
| MIT 6.5840 Distributed Systems (course site, older schedule copies) | Coordination and consistency topics (RPC, linearizability, consensus, replication) | Snippet only |
| Google, *Site Reliability Engineering*, table of contents (ch. 3, 4, 6, 21, 22) | SLOs and error budgets, monitoring, overload, cascading failures | Snippet only |
| OWASP Top 10 (2021) | Web vulnerabilities chapter scope (A01 Broken Access Control, A02 Cryptographic Failures, …) | Snippet only |
| AWS Well-Architected Framework (six pillars) | Production lens: operations, security, reliability, performance, cost, sustainability | Snippet only |
| RFC 9110, 9111, 9000, 8446, 9293 | Networking stage boundaries (HTTP semantics and caching, QUIC, TLS 1.3, TCP) | Snippet only |
| Ongaro & Ousterhout 2014 (Raft); DeCandia et al. 2007 (Dynamo); Shapiro et al. 2011 (CRDTs) | Consensus, leaderless replication/quorums/consistent hashing, conflict resolution | Snippet only |
| Dean & Barroso 2013 (*The Tail at Scale*); Little 1961 (L = λW) | Percentiles/tail latency and queueing chapters | Snippet only |
| Jepsen consistency models | Consistency-models chapter scope (linearizable, serializable, strict serializable) | Snippet only |
| OpenTelemetry specification status (signals) | Observability scope (traces, metrics, logs) | Snippet only |

**Searched but not found in results:**

- Lamport 1978, *Time, Clocks*
- Karger et al. 1997, consistent hashing
- Corbett et al. 2012, Spanner
- Abadi 2012, PACELC
- Fischer, Lynch & Paterson 1985
- PostgreSQL isolation docs

Their chapters (`time-clocks`, `consistent-hashing`, `cap-pacelc`, `consensus`, `isolation`) must find and read
sources in mode C.
