# Caching pilot · 30 October 2026

Uses the revised system-design-educator skill's acceptance and production references. New files: `cache-lab.ts`, its test, `film/CacheLab.tsx` and `cache-lab.css`. The parent owns chapter registration and final browser/budget validation.

The earlier age/policy exercise could not independently teach capacity, replacement, request locality and origin changes. The new finite model exposes equal-size slot capacity, insertion TTL, exact LRU/FIFO/LFU, four inspectable request patterns, an optional origin write and delivered/lost invalidation. Hit rate is derived, never an independent fake knob. A read has an actual returned version, current origin version and hit/miss/bypass outcome. Metrics count hits, misses, older-version reads, origin loads, capacity evictions and expirations.

Learn compares the same ten reads with only invalidation delivery changed. The default lost-message run returns A v1 after the origin writes A v2; delivered invalidation prevents that older read. Both complete runs make **7 origin loads**: the delivered case refills earlier, changing its later expiration. This is an instructive counterexample to claiming that invalidation must increase aggregate backend work. The actual baseline is 3 hits, 7 misses, 1 older-version read, 4 evictions and 1 expiration. Delivered invalidation gives 3 hits, 7 misses, 0 older-version reads, 4 evictions and 0 expirations.

Explore requires a prediction before revealing results/animation, remounts each run to restart playback and resets inputs/result. The table records every read, write and expiration, with actual eviction order, read frequencies and returned/origin versions. The shared player provides static steps, transcript and state summary. `CacheLearn` and `CacheLab` accept `chapterId`; `makeCacheFilm(input, suffix, chapterId)` supplies the corresponding source anchor and unique id, supporting related chapters without cloning the simulation. Three exported scenario questions cover version freshness, recency versus insertion order, and bypass behavior.

## Accuracy and boundaries

The cache layer is a logical read-through abstraction; it is not an implementation of a particular Redis client or the full HTTP cache protocol. Ticks are invented event times. Reads sharing a tick complete serially. Every origin value begins at v1; the optional writer changes A to v2 at tick 4, then attempts invalidation before reads at that tick. Entries expire at the boundary before subsequent events. Hits do not extend TTL. TTL 0 explicitly bypasses storage; it is not Redis `EX 0` syntax.

LFU counts reads since insertion and breaks ties using the oldest read. Its counters reset on refill and do not decay. LRU/FIFO are also exact finite algorithms; Redis's sampled/probabilistic implementations are separately identified. The frequency workload starts A,A,B,C: with two slots, LRU evicts A while LFU evicts B. No policy is presented as universally optimal.

“Older-version read” compares the response with the current origin, separately from RFC 9111's protocol freshness/expiration terms. Lost invalidation does not imply a stale read if the entry was already evicted, expired or bypassed. A dropped invalidation is the only simulated lost message; a healthy cache is not drawn as a failed component. Expiration bounds reuse of a previous fill **in this serial model**. Real concurrent stale-fill races, stampedes, distributed coherence, validators, background refresh and write-back are omitted. No latency, FPS, bandwidth or hardware benchmark is fabricated.

Primary sections read through the web tool on 30 October 2026:

- [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html), §4.2 Freshness and §4.4 Invalidating Stored Responses: expiration permits bounded reuse; invalidation/validation has distinct rules. The model does not claim every database write automatically invalidates an HTTP cache.
- [Redis key eviction](https://redis.io/docs/latest/develop/reference/eviction/), eviction policies, approximated LRU and LFU: policy depends on access pattern; real implementations use approximations. FIFO is an explicit basic teaching comparison, not a claimed Redis configuration option.
- [Redis client-side caching](https://redis.io/docs/latest/develop/clients/client-side-caching/), updating data: server-assisted invalidation removes copies when tracked data changes. Real clients flush on connection loss; this model's intentional dropped invalidation is a general failure exercise, not a claim that compliant Redis tracking silently ignores that safeguard.

## Checks

`npm test -- --reporter=dot src/lib/learn/cache-lab.test.ts` passed **9 tests**. It checks all **1,728** bounded configurations for conservation, unique capacity-limited entries, legal TTLs, origin versions, frequency/recency counterexamples and deterministic replay. Representative films are sampled before/after response arrival, including LFU, TTL bypass, lost/delivered invalidation and a workload gap. Tests verify exact visible counts, actual trace correspondence, no invented component failure and ≤25-word captions in those films. Focused ESLint and whole-project `npx tsc --noEmit` passed during this subtask before the parent's final integration.

No new dependencies, bitmap assets or renderer were added. Existing GSAP-owned playback and anatomy SVG are reused. Parent integration must add the source records/terms and measure production payloads. This subtask did not claim browser layout, keyboard, theme, reduced-motion or all-chapter acceptance; those are separate final mission evidence.
