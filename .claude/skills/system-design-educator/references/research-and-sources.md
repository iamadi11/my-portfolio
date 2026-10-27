# Research and sources

## Contents

- Source hierarchy
- Source record
- Research procedure per chapter
- Checking claims and numbers
- When you can't reach a source
- Oversimplification list

## Source hierarchy

Use the highest tier available for each claim; lower tiers can explain, not establish.

1. **Specifications and primary papers:** RFCs, standards, the original paper (Raft, Dynamo, Spanner, etc.).
2. **Official documentation** of the system named (PostgreSQL, Redis, Kafka, Linux, browser vendors, MDN).
3. **Engineering texts and talks by the system's authors**, and well-reviewed books.
4. **Reputable secondary sources:** surveys, university course notes, curated guides (e.g. System Design Primer,
   CC BY 4.0) to find primary sources and check coverage.
5. **Blogs, forums, Q&A:** leads only, never the source of a claim.

A vendor's own benchmark is evidence of what the vendor measured, not of general behaviour.

## Source record

One per source, in the chapter spec (and in code if the product has a sources model):

```
- id: rfc9110
  title: HTTP Semantics (RFC 9110)
  author: Fielding, Nottingham, Reschke (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9110
  kind: spec | docs | paper | book | talk | guide | article
  published: 2022-06
  checked: <YYYY-MM-DD>
  via: read | search          # read = you read the text; search = you saw it only in search results/snippets
  supports: [claim ids or short claim text]
  note: <section numbers, caveats, what it does NOT say>
```

Required (checked by `course.mjs check`): `id`, `title`, `via`, `supports`. The others are expected; a record
missing them is fixed when found. `via` must be honest:

- `read`: you opened and read the text yourself (the original, or for tier 4 a secondary page you read in full).
- `search`: you saw only a search-result title or snippet, a summary by a tool, or a citation in another source.
- A source you could not reach at all (no text, no search result) is not a source: put it under "Open questions",
  not in Sources. With neither fetch nor search available, research is blocked: the chapter stays below
  `researched`.

A claim supported only by `via: search` sources is marked unverified in the spec. Before `implemented` it must be
read, replaced, or cut (`check` enforces this: such a record must say `supports: none`).

## Research procedure per chapter

1. List the chapter's claims from the boundary and 14-question draft (each a one-line statement).
2. For each claim find a tier 1–2 source; note the section. Cite near the claim in the spec (`[rfc9110 §9.2]`).
3. Look for disagreement and edge cases: where does the claim stop being true?
4. Record open questions instead of guessing.
5. Mark the chapter `researched` only when every claim has a record or is moved to "Open questions".

## Checking claims and numbers

- A claim derived from sourced claims (arithmetic, a formula applied to assumed values) cites the claims it derives
  from and shows the step; it needs no record of its own.
- Numbers (latencies, limits, defaults) need a source and a date or version: defaults change between versions.
- "Latency numbers every programmer should know"-style figures are orders of magnitude from a specific source and
  era; say so and cite the version used.
- Illustrative numbers are fine when labelled "assumed values for this example".
- Never present a simulation output as a measurement of a real system.
- No invented production stories. A real incident is cited from its public post-mortem.

## When you can't reach a source

Some environments block web fetches. Then: use search results to find the canonical location, record
`via: search`, quote nothing you haven't read, mark dependent claims unverified, and list the source under
"Open questions" for a later session that can read it. Say this in the report. The chapter can still reach
`authored`; it cannot reach `implemented` until those claims rest on read sources. Never upgrade `via` because a
snippet "looked complete".

## Oversimplification list

Popular summaries that need a correction or a caveat when taught. When a chapter uses the simple version, it says
so and points to where the fuller version is taught.

- **CAP** is about behaviour during a network partition, with specific definitions of consistency (linearizability)
  and availability; "pick two of three" misleads. PACELC adds the latency/consistency trade-off without partitions.
- **Eventual consistency** is a family of guarantees; say which (read-your-writes, monotonic reads, causal…).
- **Exactly-once delivery** over an unreliable network isn't achievable in general; systems achieve
  effectively-once _processing_ with at-least-once delivery plus idempotency or transactions.
- **Consensus** (Raft/Paxos) needs a majority and makes progress only under certain timing assumptions (FLP
  impossibility for fully asynchronous systems).
- **ACID** letters mean different things across databases; isolation levels vary by implementation.
- **Horizontal scaling** doesn't scale linearly: coordination, contention and hot keys limit it.
- **Caching** always adds a consistency question (invalidation, staleness bounds).
- **Averages hide tails.** Report percentiles; p99 of a fan-out request is dominated by the slowest call.
- **Load balancers** are not free of state or failure; they are part of the system.
- **"NoSQL scales, SQL doesn't"** is false as stated.
