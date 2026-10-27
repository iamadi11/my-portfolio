# Curriculum design

## Contents

- Principles for the learning graph
- Stages (minimum coverage)
- Paths
- Chapter sizing and objectives
- Changing the graph

## Principles

- **A graph, not a list.** Chapters depend on chapters. A prerequisite is something the explanation relies on, not
  something merely related. Related-but-not-required links go in the chapter spec, not the graph.
- **Concrete before abstract.** Start from something the learner has done (opened a page, waited for a spinner) and
  build vocabulary from it; abstract models (consistency models, queueing) come after a concrete case motivates them.
- **One new mechanism per chapter.** A chapter that needs two new mechanisms to explain is two chapters. This is the
  segmenting and pre-training idea (learning-science.md): name the parts before the process.
- **Map chapters are the exception.** An overview chapter (e.g. "what happens when you open a website") may name
  several mechanisms, but only as parts of a journey: each gets a plain one-paragraph account and a link to the
  chapter that teaches it. Its own mechanism is the journey (the order of steps and where time goes).
- **Spiral.** Big ideas return at greater depth (caching appears in the web-request chapter as "the browser keeps a
  copy", later as invalidation and consistency). Each return is planned in the graph and cites the earlier chapter.
- **Practice mixes topics late.** Early exercises stay on the chapter's topic; capstone and review units mix topics
  (interleaving; see learning-science.md for how strong that evidence is).
- **Case studies are capstones.** "Design X" problems come after the building blocks they use, and say which chapters
  they draw on.

## Stages (minimum coverage)

This is the floor the graph must cover, not its final shape. Mode B decides chapters, order and wording.

1. **Foundations:** what happens when you open a website; client/server, HTTP, DNS, TCP/TLS at the level needed;
   latency vs throughput; units and back-of-envelope estimation.
2. **One machine to many:** vertical vs horizontal scaling; load balancing; stateless services; reverse proxies;
   CDNs; caching (where, eviction, invalidation).
3. **Data:** relational basics, indexes, transactions and isolation; replication; partitioning/sharding; NoSQL
   families and when they fit; consistency models; CAP and PACELC (with their limits).
4. **Asynchrony:** queues, pub/sub, logs; delivery semantics (at-most/at-least/effectively-once); backpressure;
   idempotency; batch vs stream.
5. **Reliability:** failure modes; timeouts, retries with backoff and jitter, circuit breakers, bulkheads, rate
   limiting; queueing and tail latency; SLIs/SLOs/error budgets; observability.
6. **Coordination:** time and clocks; leader election; consensus (Raft/Paxos at intuition level, then mechanism);
   distributed transactions and sagas.
7. **Practice:** interview method (requirements, estimates, API, data model, high-level design, deep dives,
   trade-offs); case studies (URL shortener, rate limiter, feed, chat, web crawler, etc.); production concerns
   (security, cost, migrations, multi-region).

## Paths

One graph, several paths. A path is a filter over chapters plus a recommended order, never a separate copy.

- **beginner:** stages 1–4 core chapters, gentle pace, no interview framing.
- **interview:** foundations needed for case studies, the interview method, case studies, quick-review units.
- **production:** reliability, data, coordination and operations in depth.

Every chapter is on at least one path; core chapters are on all three.

## Chapter sizing and objectives

- Size target (a hypothesis, not a finding): one chapter fits one sitting, about 15–30 minutes of reading and doing.
  Nothing in the research here establishes that length. Record each chapter's estimate in its spec as an
  assumption; revise the target once real reading times or learner feedback exist.
- Objectives are observable: "explain why a retry without jitter can synchronise clients", not "understand
  retries". Two to four per chapter.
- Each chapter names the misconceptions it targets (e.g. "more servers always means faster").

## Changing the graph

- Ids never change once a chapter is `researched` or above; if a rename is unavoidable, record old → new in
  COURSE_STATE Decisions and update every reference.
- Splitting a chapter: the new chapters start at `planned` unless the existing spec fully covers one of them.
- Removing a chapter: record why; check nothing lists it as a prerequisite (`course.mjs check`).
