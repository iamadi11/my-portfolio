# Partitioned-log companion · 2026-10-30

## Purpose and integration

The earlier `offsets` experiment illustrated two reader positions but did not expose partition assignment, consumer count, ownership after failure, or the gap between processing an external effect and committing a next offset. This companion adds those mechanisms with the shared anatomy/GSAP player rather than a new animation engine.

Files: `src/lib/learn/partitioned-log.ts`, its invariant tests, `src/components/learn/film/PartitionedLogLab.tsx`, and scoped CSS. Integration exports: named `PartitionedLogLearn`, default `PartitionedLogLab`, `PARTITIONED_LOG_QUESTIONS`, `PARTITIONED_LOG_DEFAULT`, `simulatePartitionedLog`, and `makePartitionedLogFilm`. Root must attach these to `logs-streams`, update registered mechanism/source coverage and assess questions, and verify actual rendering. Learn records explicit viewed activity against the chapter id; Explore records experimentation only after Run.

## Learning contract

Every run begins with a fresh topic. A producer appends batches under explicit example partition keys. Offsets identify positions within each partition. Members of group A share partition ownership; a single member of group B independently reads up to its per-partition budget. The four-node drawing shows producer, broker/topic, group A and group B. Partition cards and an ownership/offset ledger expose the internal structure rather than pretending the broker icon alone explains it.

Learn compares three crash points with a fixed workload: no crash, a crash after a side effect but before its offset commit, and a crash after committing. Processing and committing are distinct events, so every paused frame can expose a legal uncommitted effect. In the default two-member group, a survivor replays one uncommitted record and repeats its unprotected effect.

Explore controls partition count, group A member count, records per partition, group B read budget, crash point, and cross-partition scheduling. The last control creates different legal topic-wide sequences while preserving partition-local order. Extra consumers can be idle. When the only A member fails, the model stops A rather than inventing a replacement; B still reads independently. Outcomes, exact counts, partition cards, ownership history and the film all derive from one deterministic trace. Prediction precedes revelation; input changes clear the prior result, and reset restores the initial state.

## Technical source review

Read [Kafka 4.1 introduction](https://kafka.apache.org/41/getting-started/introduction/), **Main Concepts and Terminology**, on 2026-10-30: topics retain records, partitioning scopes ordering, and producers append to selected partitions.

Read [Kafka 4.1 design](https://kafka.apache.org/41/design/design/), **The Consumer**, **Consumer Position**, **Message Delivery Semantics**, and **Using Transactions**, on 2026-10-30. Consumer positions permit replay. Processing before saving the position can repeat work after a crash. Partition assignment gives one owner per partition within a traditional consumer group. Stronger external-effect guarantees require coordinating output and position. The page's separate Share groups section confirms that share groups are a distinct model; this companion explicitly teaches traditional partition-assigned groups.

## Simplifications and limits

A consumer may own several partitions, but a partition has at most one owner within group A. Assignment is illustrative round robin, not an implementation of a Kafka assignor or rebalance protocol. Consumer A0 fails on its first processed record at the selected point; detection/reassignment has no measured duration. There is no recovery if no survivor remains. Group B is scheduled after A only to make independent positions easy to inspect; this is not a real concurrency schedule guarantee.

Broker storage is assumed available. The experiment omits replication, retention expiry, producer retries, transactions, compaction, batching performance and consumer fetch buffering. A processing count includes repeated side effects; retained count includes each produced record once. A committed offset names the next record, and processing does not delete records. Display seconds are player duration; no throughput claim is made.

## Evidence and outstanding acceptance

`npx vitest run src/lib/learn/partitioned-log.test.ts`: **7 tests passed**, including **1,440** bounded input combinations. Assertions cover offsets/retention, assignment eligibility, active-owner scope, replay versus post-commit crash, no-survivor stalling, group independence, legal cross-partition schedules, monotone durable positions, process/commit separation, exact sampled film snapshots and deterministic normalization/replay. Both policy-specific and counterexample assertions are included.

Focused ESLint passed without warnings. Whole-project `npx tsc --noEmit` passed after the assessment fixture correction from root. Root still needs final production/type checks after integration, rendered mobile/light/dark/static/keyboard/prediction/reset checks, performance measurements, and independent educational review. No learner-study or all-chapter rendered-acceptance claim follows from these pure-model results.
