# Where time goes: memory, disk and network

Id: latency-numbers · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: latency-throughput · Related: percentiles, estimation, utilisation-queueing, caching-basics
Standard: anatomy-3d
Implementation: `src/app/learn/latency-numbers/page.tsx`, `src/components/learn/latency-numbers/LatencyScale.tsx`,
`src/lib/learn/latency-numbers-model.ts` (+ `.test.ts`), `src/content/learn/latency-numbers-sources.ts`.

## Boundary

Objectives (observable, numbered):

1. For the durations on this bench, predict that the carriage's place is the base-10 logarithm of the nanoseconds, so the L1 fetch sits at magnitude log10(0.5) and the US–Europe packet sits at magnitude log10(150,000,000).
2. Predict that the disk seek is farther than the main-memory fetch by log10(80,000), which this model rounds to 4.903 orders, so the seek is the bottleneck of that pair.
3. Predict which of two chosen stops is farther, and state that a gap under 1 order does not make the farther duration dominate the sum. State that the SSD stop is the script constant 16,000 ns, not a row in the Answers table.

In scope: one bench. One carriage. Its place is the order of magnitude of one operation. The operations are the memory, disk, and network rows in Norvig's Answers table, plus the SSD constant from Scott's script. A pair's bottleneck is the farther stop when the gap is at least one order.

Deferred: latency versus throughput, already taught in latency-throughput. Percentiles and tail latency, already taught in percentiles. A line of waiting jobs, utilisation, and Little's law → utilisation-queueing. Back-of-envelope products of these durations → estimation. Why a cache helps → caching-basics. Scott's year-by-year formulas were not evaluated.

Misconceptions targeted: a disk seek is a bit slower than a main-memory fetch; the carriage's place is the duration itself; the SSD figure is a row in the Answers table; two durations in the same order can be ignored in favor of the slightly larger one.

## Concept decomposition

Mental models: the bench is a scale of orders. Each post is one operation. The carriage is the order of magnitude of the operation it has reached.
Mechanisms: magnitude = log10(duration in nanoseconds). The farther of two stops is the larger magnitude. A gap of at least 1 means the farther duration is at least ten times the nearer, so it is at least 10/11 of their sum.
Temporal behaviour: Learn moves the carriage from the left post, through the L1 fetch, and out to the US–Europe packet, with a mark at every stop. The lab does not move until Run, then visits the nearer stop and then the farther one.
Quantitative relations: magnitude 0 is 1 nanosecond, the table's typical instruction. L1 is 0.5 ns, magnitude log10(0.5). Main memory is 100 ns, magnitude 2. SSD random read is 16,000 ns, magnitude log10(16,000). The 2K network send is 20,000 ns, magnitude log10(20,000). The 1MB memory read is 250,000 ns. The disk seek is 8,000,000 ns. The 1MB disk read is 20,000,000 ns. The packet is 150 milliseconds, written as 150,000,000 ns. The seek is 80,000 times the main-memory fetch, log10(80,000) orders. World x = 48 + magnitude × 28.
Failure scenarios: this bench does not queue a request, drop one, or fan one out. A gap under one order does not dominate. The same operation chosen twice is not a pair. The left post, magnitude −1, is the end of the drawing, not a quoted duration.
Trade-offs: the logarithm makes a factor of ten into one pitch, so a factor of 80,000 is visible. It hides the difference between 16,000 ns and 20,000 ns unless the learner reads the orders. The SSD constant and the Answers rows are different texts; the outcome says so when the pair includes the SSD stop.
Needs space or experiment: the carriage has to stand at the magnitude, or a disk seek and a memory fetch are two numbers with no distance between them.
Hardest: a disk seek is not a small step past RAM — the carriage's place is log10 of the nanoseconds, so 8,000,000 ns and 100 ns are 4.903 orders apart, which the figure shows by the length of the bench between those posts.
Hardest: the slightly larger of two close durations does not dominate their sum — 20,000 ns and 16,000 ns are 0.097 orders apart, and the figure's posts sit within one pitch.
Hardest: the SSD stop is a script constant, not a measured row of the Answers table — the readout says so when the carriage is on that post, and the duration is the integer 16,000.

## Parts you'll meet

Order of magnitude: the power of ten in a duration. Here, log10 of the duration in nanoseconds. Magnitude 0 is 1 nanosecond.
Nanosecond: the unit Norvig uses for every row except the packet, which he also writes as 150 milliseconds. 150 milliseconds = 150,000,000 nanoseconds, from that row, so 1 millisecond = 1,000,000 nanoseconds.
Seek: his phrase "fetch from new disk location (seek)". On this bench that duration is 8,000,000 nanoseconds.
Bottleneck of a pair: the farther stop, when its magnitude exceeds the other by at least 1. Then that duration is at least 10/11 of the sum. Under one order, both durations stay in the sum.

## Storyboard

1. The learner sees a bench, a scale of equal pitches, end cheeks, and posts. The question is where a short memory fetch sits, and where a much longer operation sits.
2. Learn plays on its own. The carriage leaves the left post and stops at each magnitude: L1, main memory, the SSD constant, the 2K send, the 1MB memory read, the disk seek, the 1MB disk read, and the US–Europe packet.
3. At the seek, the readout states the orders between that stop and the main-memory fetch. At the packet, the carriage is at the farthest stop.
4. In the lab the carriage stays off the bench until Run. The learner picks two operations, predicts which stop is farther, then presses Run. The carriage visits the nearer stop, then the farther one. The outcome says whether the gap dominates, and names the script constant when that stop is in the pair.

## Asset plan

Objective coverage: 1 → A1 · 2 → A1 · 3 → A1

### A1. Order bench

- objective: 1, 2, 3
- type: 3d
- object: a measuring bench with feet, a bed, two ways, a scale, end cheeks, posts at the operations, and one carriage whose place along the ways is the order of magnitude
- render: anatomy-iso
- fidelity: the carriage's world x is computed by carriageX and xAtClock from magnitude(), which is log10 of the quoted nanoseconds; the Answers-table durations are quoted; the SSD duration is the script constant 16,000 ns, labelled as that constant; pin-free: post position is the magnitude, not a second encoding; the left post at magnitude −1 is the drawing's end, not a quoted duration; the dominate rule (a gap of at least 1) is this bench's arithmetic on those magnitudes
- pattern: step predict
- learner sees: the bench and its scale; on Learn, every post and the carriage already moving; in the lab, no posts and no carriage until Run
- animated: the carriage's screen position is one translate, place() from its rest x to xAtClock(t); t is the magnitude shifted so the left post is clock 0; at each stop, t equals clockOf(durationNs) and the world x equals X0 + magnitude × PITCH
- learner does: on Learn, play and step from the L1 fetch to the packet; in the lab, pick two operations, predict which stop is farther, then run
- notice: the main-memory post and the seek post are several pitches apart; the SSD post and the 2K-send post sit within one pitch; the packet is the farthest post
- model: inputs are two operation ids; state is each duration in nanoseconds and its magnitude; rules in src/lib/learn/latency-numbers-model.ts
- feedback: the line under the drawing is the magnitude the carriage has reached, and at a stop it is that operation's duration; the lab's outcome line appears when the run finishes
- assumptions: Norvig calls the list approximate timings for a typical PC and the fetched page does not date it; the SSD integer is Scott's return value for a year after 2014, not a drive measured for this page; no queue; no percentile
- outcome: the learner can predict the farther stop, can predict that the seek is orders beyond the main-memory fetch, and can say when a gap is too small to dominate
- accessibility: the step sentence is the text alternative; keyboard Previous and Next; reduced motion jumps mark to mark; the drawing is aria-hidden
- tests: src/lib/learn/latency-numbers-model.test.ts for the quoted durations, for log10, for the carriage place equaling the magnitude, for the seek gap, for the close SSD and network pair, and for a rejected pair of the same operation
- evidence: norvig-latency section Answers, read; scott-latency getSSDLatency, read; the dominate threshold is arithmetic on those magnitudes
- built: `src/components/learn/latency-numbers/LatencyScale.tsx`, `src/lib/learn/latency-numbers-model.ts`, `src/lib/learn/latency-numbers-model.test.ts`, `src/app/learn/latency-numbers/page.tsx`

## Animation sense

### A1. Animation sense

- Mechanism: an operation's order of magnitude is the base-10 logarithm of its duration in nanoseconds, so a disk seek sits orders of magnitude beyond a main-memory fetch.
- Moving quantity: the carriage on the bench.
- Model field: magnitude(durationNs), which is log10 of the duration in nanoseconds. The carriage's world x equals that magnitude: X0 + magnitude × PITCH, with X0 = 48 and PITCH = 28. The clock is that magnitude minus CLOCK_SHIFT (−1), because the shared clock starts at 0. At each stop the clock equals clockOf(durationNs), and the world x equals carriageX(durationNs).
- Learner predicts: which of the two chosen stops is farther along the bench.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): norvig-latency, via: read, 2026-10-29, section Answers; scott-latency, via: read, 2026-10-29, the else branch of getSSDLatency.

## Explanation (14 questions)

1. Problem: a main-memory fetch and a disk seek are both "waits", and a learner can treat the seek as a bit slower. The times differ by orders of magnitude.
2. Why does it matter? On these quoted numbers the seek is 8,000,000 ns and the main-memory fetch is 100 ns. Their ratio is 80,000. A request that does both spends almost all of that sum in the seek. The US–Europe packet is 150,000,000 ns, farther still. The SSD figure, 16,000 ns, sits near the 20,000 ns network send, so those two do not separate the way memory and disk do.
3. What would a beginner try first? Lay the durations on a straight scale, or call the disk "a bit slower than RAM", and call every network trip the slow part.
4. Why does that work at first? The names already have an order: memory, then disk, then a packet across an ocean. The packet is the farthest stop. A straight scale would still put the packet at the end.
5. When does it fail? A straight scale of nanoseconds would put 100 and 8,000,000 so far apart that the memory fetch disappears against the seek, and it would also hide that 16,000 and 20,000 are the same order. The seek is 4.903 orders past the memory fetch. The packet is only log10(18.75) orders past the seek, about 1.273, so the wide gap on this list is memory to disk, and the ocean packet is a further order, not a different kind of number.
6. What do we observe more carefully? The carriage's place, which is the magnitude, and which posts stand at that place.
7. What is the real mechanism? For a duration d nanoseconds, d > 0, the magnitude is log10(d). The carriage's world x is 48 + log10(d) × 28. Magnitude 0 is the table's 1 nanosecond instruction; the carriage does not stop there. Stops, with d copied from the texts: L1 cache fetch 0.5; main memory 100; SSD random read 16,000 (script constant); send 2K bytes over 1Gbps network 20,000; read 1MB sequentially from memory 250,000; disk seek 8,000,000; read 1MB sequentially from disk 20,000,000; packet US to Europe and back 150,000,000. The orders between two stops are the absolute difference of the logs, which equals log10 of the ratio of the durations. The farther stop is the larger magnitude. If that difference is at least 1, the farther duration is at least 10 times the nearer, and at least 10/11 of the sum. The same table also lists a branch misprediction at 5 ns, an L2 fetch at 7 ns, and a mutex lock/unlock at 25 ns. Those three are not stops.
8. What can the learner change and watch? Which two operations are in the pair.
9. What alternatives exist? Compare the raw nanoseconds. Compare the orders. Add the two durations when the gap is under one order. This chapter does both the orders and the ratio, and it adds only as the reason the dominate rule stops.
10. What are the trade-offs? The log makes a factor of 80,000 readable and makes a factor of 1.25 look like a short step, which is the point, and the readout still states the ratio. Mixing the 16,000 ns constant with the Answers rows compares two texts. The outcome says when the SSD stop is in the pair.
11. When should you choose it? When the question is which of two operations on this list dominates the time. Read the magnitudes. If the gap is at least one order, the farther stop is the bottleneck of the pair.
12. When should you not? When the requests would have to wait in line. That is utilisation-queueing. When you need a percentile of many samples. That is percentiles. When you need a product of rates and sizes for a whole design. That is estimation. When the gap is under one order, keep both durations. When you need a measured SSD latency from the paper Scott cites. This page did not open that paper.
13. Explain it in your own words. The carriage is at the seek, magnitude log10(8,000,000). The main-memory fetch is magnitude 2. What does the distance between them say about a request that does both?
14. Where else does this apply? A later estimate multiplies these kinds of durations by how many times each happens. Caching-basics asks why avoiding a trip to a farther stop changes the time. This bench does not draw a cache or a queue.

## Worked example

Quoted, not a trace. Norvig's Answers table, and Scott's integer.

Main memory and the seek. d_memory = 100 ns. d_seek = 8,000,000 ns. Magnitude of memory = log10(100) = 2. Magnitude of the seek = log10(8,000,000). Ratio = 8,000,000 / 100 = 80,000. Orders = log10(80,000), which the formatter rounds to 4.903. 4.903 ≥ 1, so the seek dominates. Sum = 8,000,100 ns. The seek is 8,000,000 / 8,000,100 of that sum, which is more than 10/11.

SSD constant and the 2K send. d_ssd = 16,000 ns, the script's return value. d_net = 20,000 ns, the Answers row. Ratio = 20,000 / 16,000 = 1.25. Orders = log10(1.25), which the formatter rounds to 0.097. 0.097 < 1, so the send is farther and does not dominate. Sum = 36,000 ns. Both terms stay.

Seek and the packet. d_packet = 150,000,000 ns, which the same row writes as 150 milliseconds. Ratio = 150,000,000 / 8,000,000 = 18.75. Orders = log10(18.75) ≥ 1, so the packet dominates that pair. The memory-to-seek gap is still the wider one on this list.

Check the place. World x of the memory fetch = 48 + 2 × 28 = 104. World x of the seek = 48 + log10(8,000,000) × 28. The difference of those x values, divided by 28, is the orders.

Using the packet's own equality, 150 milliseconds = 150,000,000 ns, so 1 millisecond = 1,000,000 ns. Then 8,000,000 ns = 8 milliseconds. That division is derived from his equality. He wrote the seek as 8,000,000 nanosec, and the page shows that figure.

## Visual

One bench. Feet, screws, a plate, a raised bed, two ways, a lead screw, a front scale with a long tick at each integer magnitude and a short tick at each half, two end cheeks, two dogs, a blank nameplate, and a post at each operation on the tour. The only lit part is the tool post on the carriage. The carriage is one group: apron, two shoes, saddle, gib, a short lip toward the scale, the tool post, and a clamp. Its screen position is one translate. Words stay in the line under the drawing. No operation name is painted on a post.

## Practice

Retrieval: the magnitudes of the main-memory fetch and the seek; the orders between them; why 16,000 ns is not an Answers-table row; which of 16,000 ns and 20,000 ns is farther.
Exercise: run main memory against the seek, then run the SSD constant against the 2K send. The model's magnitudes, the ratio, and dominates() are the check.
Spaced review: estimation re-asks these durations as inputs to a larger product. utilisation-queueing re-asks a request that has to wait, which this bench does not contain.

## Tabs

- Learn: auto-plays the walk from the L1 fetch out to the US–Europe packet, stopping on each magnitude. Choosing a pair is not this tab.
- Lab: the same model. The learner picks two operations, predicts which stop is farther, then presses Run. The outcome waits until the run finishes.
- Quiz: three questions. The answer stays behind the disclosure.

## Sources

- id: norvig-latency
  title: Teach Yourself Programming in Ten Years, section Answers
  author: Peter Norvig
  url: https://norvig.com/21-days.html
  kind: article
  published: no revision date on the fetched page
  checked: 2026-10-29
  via: read
  supports: [the Answers section gives approximate timing for various operations on a typical PC; execute typical instruction is 1/1,000,000,000 sec = 1 nanosec; fetch from L1 cache memory is 0.5 nanosec; branch misprediction is 5 nanosec; fetch from L2 cache memory is 7 nanosec; Mutex lock/unlock is 25 nanosec; fetch from main memory is 100 nanosec; send 2K bytes over 1Gbps network is 20,000 nanosec; read 1MB sequentially from memory is 250,000 nanosec; fetch from new disk location (seek) is 8,000,000 nanosec; read 1MB sequentially from disk is 20,000,000 nanosec; send packet US to Europe and back is 150 milliseconds = 150,000,000 nanosec]
  note: >-
    Fetched and read from norvig.com/21-days.html on 2026-10-29. The heading is
    Answers. The line under it is "Approximate timing for various operations on
    a typical PC". The page showed no revision date. The branch, L2, and mutex
    rows are quoted and are not stops. The instruction is magnitude 0 and is not
    a stop. 8 milliseconds for the seek is this chapter's division of 8,000,000
    by 1,000,000, using the packet row's own equality, and the page shows the
    nanosecond figure.

- id: scott-latency
  title: Latency Numbers Every Programmer Should Know (interactive_latency.html)
  author: Colin Scott
  url: https://raw.githubusercontent.com/colin-scott/interactive_latencies/master/interactive_latency.html
  kind: article
  published: no date on the fetched file
  checked: 2026-10-29
  via: read
  supports: [getSSDLatency returns 16000 when the year is greater than 2014; that return is passed to Metric, whose first parameter is named ns; the display string for that metric is "SSD random read"; the file says any numbers without a citation are from Norvig's article at http://norvig.com/21-days.html#answers]
  note: >-
    The published page https://colin-scott.github.io/personal_website/research/interactive_latency.html
    was fetched on 2026-10-29 and the conversion omitted the script. The raw file
    at the url above was fetched and read the same day. The else branch is
    `return 16000` when year > 2014. The comment above the formula says
    "20 us = 2*10^4 ns in 2012" and names a FAST 2012 paper. That paper was not
    opened, and the year-dependent formula was not run. getDCRTT returns 500000
    with the comment "Assume this doesn't change much?" and is not a stop on
    this bench. The gist https://gist.githubusercontent.com/jboner/2841832/raw
    was fetched the same day and is not a source: it is a compilation, it writes
    the seek as 10,000,000 ns, and it adds rows it dates to 2026.

## Open questions / unverified

- Norvig's page showed no revision date. Scott's script says Norvig's original numbers were from 2002. Norvig's page, as fetched, does not say 2002. The 2002 date is not used.
- The FAST 2012 paper named in the SSD comment was not fetched. 16,000 ns is the else-branch integer, not a figure read from that paper.
- getDCRTT's 500,000 ns is commented as an assumption and is not on the bench.
- Scott's year-dependent formulas were not evaluated, so this chapter does not show a 2026 extrapolation.
- src/content/learn/source-catalog.ts was not edited, by instruction for this unit. The chapter's citation links point at /learn/sources anchors that are not on that page until a later unit wires them.
- The animation was not run in a browser. The carriage's place is the magnitude in the source, and that equality was not watched on a screen.

## Evidence

- model tests: pass — `npx vitest run src/lib/learn/latency-numbers-model.test.ts` (8 passed) (2026-10-29)
- eslint: pass — `npx eslint` on the five new source files (2026-10-29)
- typecheck: fail — `npx tsc --noEmit` (2026-10-29). 12 errors, all under `.next/types` for about, contact, and tech-stack. None name the latency-numbers files.
- browser: not run — the shared browser was not used, and the dev server was not restarted (2026-10-29)
- motion check: not run — same reason (2026-10-29)
- spec review: not run — no fresh reviewer in this unit (2026-10-29)

## Review findings

Reviewer: not run. No fresh reviewer in this unit.

- [note] The rendered page was not opened. Reduced motion, keyboard stops, and the carriage's screen position were not watched. → open


## Film upgrade · 2026-10-29

Objective: Work includes access, transfer and waiting. Distance and bytes can matter as much as CPU work.

Topology: Your browser, Memory, Disk, Remote host.

1. Choose where the data lives — A read can hit local memory, local storage or a remote machine.
2. Local memory — A local memory access avoids a network round trip. Exact costs depend on hardware.
3. Local storage — Storage access introduces different access and transfer costs. Caching can change the path.
4. Across the network — A remote read also pays for the network path and the remote work.
5. Use measured inputs — The animation timing is illustrative. Use measured access delay, bandwidth and size for a real estimate.

Motion: sampleFilm().packet.x/y is message progress between named endpoints. Event state and captions share the same beat record. Five-second playback beats and geometry are scaled teaching aids, not network timings. Existing source records support reused claims; no new source access claimed. New film needs browser validation; old review evidence does not verify this upgrade.
