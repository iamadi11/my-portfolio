# Percentiles and tail latency

Id: percentiles · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: latency-throughput · Related: latency-numbers, utilisation-queueing
Standard: anatomy-3d
Implementation: `src/app/learn/percentiles/page.tsx`, `src/components/learn/percentiles/PercentileRow.tsx`,
`src/lib/learn/percentile-model.ts` (+ `.test.ts`), `src/content/learn/percentile-sources.ts`.

## Boundary

Objectives (observable, numbered):

1. For the assumed list, predict that the 50th percentile is 20 ms at rank 50.5, among the short pins, and that the 99th percentile is 198.4 ms at rank 99.99, at the slow end.
2. Predict that adding one 800 ms sample leaves the 50th percentile at 20 ms and moves the 99th percentile to 788 ms.
3. State that this percentile is the rank p times (N + 1) in the sorted list, using the NIST default estimate, and that the value is not a fraction of the slowest duration.

In scope: one fixed list of durations, sorted. A percentile as a rank in that list. The count of samples strictly above that value. One mechanism: the median can sit on the short durations while a high rank sits at the slow end.

Deferred: latency versus throughput, already taught in latency-throughput. A line of waiting jobs, utilisation, and Little's law go to utilisation-queueing. Where a millisecond comes from (memory, disk, network) goes to latency-numbers. Hedged requests, tied requests, and the arithmetic of a fan-out are in the paper and are not this machine. This chapter quotes the paper's 100-server example and does not recompute the 63 percent.

Misconceptions targeted: the median, or half the slowest duration, describes the slow requests; one slow sample moves every percentile; a percentile is a fraction of the tallest pin; every software package uses this same estimate.

## Concept decomposition

Mental models: each pin is one request's duration. The row is those durations sorted from short to long. The finger is a rank in that row.
Mechanisms: sort the samples. The rank is p times (N + 1). The value is the order statistic at that rank, or the point between two order statistics when the rank falls between them. Samples strictly taller than that value are the ones above it.
Temporal behaviour: the finger travels from the start of the row, stops at the median's rank, then travels to the 99th percentile's rank. Learn plays that once. The lab does not move until Run.
Quantitative relations: N is the count of samples. p is a fraction between 0 and 1, not a percent. Rank = p (N + 1) = k + d. If k = 0 the value is the first sample. If k is at least N the value is the last sample. Otherwise the value is Y[k] + d (Y[k + 1] - Y[k]), with Y the sorted durations in milliseconds. On the assumed list, p = 0.5 gives rank 50.5 and 20 ms. p = 0.99 gives rank 99.99 and 198.4 ms. Adding 800 ms makes N = 101, the 50th percentile stays 20 ms, and the 99th becomes 788 ms.
Failure scenarios: this list does not drop a request, queue one, or fan one out across servers. A rank that lands on or past the last sample is that slowest sample, which is the handbook's clamp, not a sign that the tail got healthier.
Trade-offs: the median is stable when one slow sample is added, and it hides that sample. A high percentile moves when the slow end moves, and a short list clamps it to the maximum. Other estimates exist. This chapter uses the handbook's default and says so.
Needs space or experiment: the finger has to stand at the rank, or the percentile is only a number beside a row of pins.
Hardest: the median can be the common duration while the 99th percentile is almost the slow sample — the finger's rank, which the figure shows by stopping among the short pins and then beside the tall pin.
Hardest: one added slow sample changes the neighbors of the high rank and not the value at the middle rank — the new pin stands at the end, and the finger for the 50th percentile stays in the short run.
Hardest: the value between two pins is the interpolated rank, not a percent of the tallest pin, and a rank on or past the last pin is that pin's duration — the figure's finger sits between pins when the rank is fractional.

## Parts you'll meet

Order statistics: the durations sorted from shortest to longest. The rank of a sample is its place in that list, starting at 1.
Percentile: the value at the rank p (N + 1), by the estimate below. p is a fraction. N is how many samples there are.
Median: the 50th percentile. The handbook gives it that name.
Tail: the slow end of the sorted row. Tail latency, in the paper's sense, is a high percentile of the durations. This chapter's tail is the tall pin, not a queue.
Rank: p times (N + 1). It may fall between two pins. The finger's place along the rail is that rank.

## Storyboard

1. The learner sees a plate, a comb of pins sorted short to tall, one tall pin at the far end, and a finger at the start of the rail. The question is where a middle rank sits, and where a high rank sits.
2. Learn plays on its own. The finger travels through the short pins and stops at rank 50.5. That value is 20 ms. It then travels to rank 99.99, between the 40 ms pin and the 200 ms pin. That value is 198.4 ms. One sample is above it.
3. In the lab the pins stay still until Run. The learner picks the 50th or the 99th percentile, and may add an 800 ms pin, predicts where the finger will stop, then presses Run.
4. Adding the slow pin moves the 99th percentile from 198.4 ms to 788 ms. The 50th percentile stays 20 ms.

## Asset plan

Objective coverage: 1 to A1, 2 to A1, 3 to A1

### A1. Percentile row

- objective: 1, 2, 3
- type: 3d
- object: a plate with a comb of pins sorted short to tall, end cheeks, a front rail, and one finger whose place along the rail is the rank
- render: anatomy-iso
- fidelity: the finger's place is computed from percentile().rank by rankX, and the value and the count above it are computed by percentile() and countAbove(); the durations 20, 40, 200, and 800 ms are assumed; pin height is scaled at 0.4 world units per millisecond, so the height ratio matches the duration ratio
- pattern: step manipulate predict
- learner sees: the pins already sorted, one tall pin at the end, the finger still until Learn plays or the lab's Run
- animated: the finger's world x is X0 + (rank - 1) times the pitch, and the rank is the clock; at each stop the clock equals percentile().rank for that percentile
- learner does: on Learn, play and step from the median to the 99th percentile; in the lab, pick 0.50 or 0.99, add or withhold the 800 ms sample, predict, then run
- notice: the finger at the median is still among the short pins; the finger at the 99th percentile is beside the tall pin; the extra pin moves only the high rank's value
- model: inputs are the fraction p and whether the extra sample is included; state is the sorted milliseconds and the rank; rules in src/lib/learn/percentile-model.ts
- feedback: the line under the drawing is the rank the finger has reached, and at a stop it is the percentile value and the count of samples above it; the lab's outcome line appears when the run finishes
- assumptions: one assumed list, not a trace; the NIST default estimate, which that page identifies as Hyndman and Fan R6, not nearest-rank and not the only estimate; no queue; no fan-out
- outcome: the learner can predict the median and the 99th percentile on this list, and can predict which of them moves when one slower sample is added
- accessibility: the step sentence is the text alternative; keyboard Previous and Next; reduced motion jumps mark to mark; the drawing is aria-hidden
- tests: src/lib/learn/percentile-model.test.ts for a known sorted list, for the NIST 90th-percentile example, for p50 and p99, and for adding one slow sample
- evidence: nist-percentile section 7.2.6.2, read; tail-at-scale, the one-server and 100-server examples, read; the row's arithmetic is a teaching model on assumed milliseconds
- built: `src/components/learn/percentiles/PercentileRow.tsx`, `src/lib/learn/percentile-model.ts`, `src/lib/learn/percentile-model.test.ts`, `src/app/learn/percentiles/page.tsx`

## Animation sense

### A1. Animation sense

- Mechanism: sort the durations, then a percentile is the value at the rank p times (N + 1) in that list, so the middle rank can sit on the short samples while a high rank sits at the slow end.
- Moving quantity: the finger on the rail.
- Model field: percentile().rank, a position in the sorted list (1-based, fractional when the rank falls between two samples), mapped along the rail by X0 + (rank - 1) times the pitch. The clock is in that same rank unit, and at each stop it equals that field.
- Learner predicts: whether the finger stops among the short pins, with the value still 20 ms, or at the slow end, with the value far above 20 ms.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): nist-percentile, via: read, 2026-10-29, section 7.2.6.2; tail-at-scale, via: read, 2026-10-29, the section Component-Level Variability Amplified By Scale.

## Explanation (14 questions)

1. Problem: a row of requests can be mostly quick while a few are much slower. A single typical duration hides the slow ones.
2. Why does it matter? Dean and Barroso describe a server that typically responds in 10 ms with a 99th-percentile latency of one second, so one request in 100 on that one server is slow. They also say that a request which must collect 100 such servers in parallel takes more than one second for 63 percent of user requests. On a service they measured, the 99th percentile for one request to finish was 10 ms and the 99th percentile for all requests to finish was 140 ms, and waiting for the slowest 5 percent accounted for half of that 140 ms. Those are their reports, not this row. This row is here so the rank can be seen.
3. What would a beginner try first? Read the middle of the list, or take half the slowest duration, and treat that as the experience of the requests.
4. Why does that work at first? On this assumed list the median is 20 ms, and 98 of the 100 samples are 20 ms. The middle really is the common case. The arithmetic mean of the same list is (98 times 20 + 40 + 200) / 100 = 22 ms, also near the common case.
5. When does it fail? The slow sample is at the far end. The 99th percentile is 198.4 ms, not 20 ms and not 22 ms. Half of 200 ms is 100 ms, and that is not the median either. One added 800 ms sample leaves the median at 20 ms and moves the 99th percentile to 788 ms.
6. What do we observe more carefully? The finger's place, which is the rank, and which pins stand beside that rank.
7. What is the real mechanism? Sort into order statistics Y[1] through Y[N], milliseconds, shortest first. For a fraction p strictly between 0 and 1, the rank is p (N + 1) = k + d, k an integer and d the fractional part in the half-open interval from 0 up to but not including 1. If k = 0, the value is Y[1]. If k is at least N, the value is Y[N]. Otherwise the value is Y[k] + d (Y[k + 1] - Y[k]). The handbook calls the 50th percentile the median. It identifies this default as method R6 of Hyndman and Fan. Hyndman and Fan's paper was not opened; the name is the handbook's. Assumed values: 98 samples at 20 ms, one at 40 ms, one at 200 ms. N = 100. For p = 0.5, rank = 50.5, k = 50, d = 0.5, both neighboring samples are 20 ms, so the value is 20 ms. Two samples are above it. For p = 0.99, rank = 99.99, k = 99, d = 0.99, Y[99] = 40 ms, Y[100] = 200 ms, so the value is 40 + 0.99 times 160 = 198.4 ms. One sample is above it. With the extra 800 ms sample, N = 101. The 50th percentile has rank 51 and value 20 ms. The 99th has rank 100.98 and value 200 + 0.98 times 600 = 788 ms.
8. What can the learner change and watch? The fraction, 0.50 or 0.99, and whether the 800 ms sample is on the row.
9. What alternatives exist? The median. A high percentile, here the 99th. The arithmetic mean of the same assumed list, 22 ms, which also sits with the short samples. Another estimate: the handbook says there is no single accepted interpolation, names R7 (Excel and the default in R) and R8, and describes an elementary method that rounds p N up. This chapter does not implement those.
10. What are the trade-offs? The median resists one slow sample and hides it. A high percentile follows the slow end and, on a short list, collapses to the slowest sample when the rank reaches N. Quoting a percentile without naming the estimate mixes numbers that the handbook says are close but not the same, especially for a small N. The paper's fan-out is a different mechanism: many servers, not a longer list.
11. When should you choose it? When the question is what the common request did, read the median. When the question is the slow end of the requests you have, read a high percentile and say which estimate, and keep enough samples that the rank is not clamped to the last one.
12. When should you not? When the requests would have to wait in line. That is utilisation-queueing. When you need where a millisecond goes. That is latency-numbers. When you need the paper's hedged or tied requests. This row does not send a second request. When N is so small that p (N + 1) is at least N, this estimate is just the slowest sample. The handbook states that clamp.
13. Explain it in your own words. The finger is at rank 50.5, and both pins there are short. What does the slow pin do to that value, and what does it do to the finger at rank 99.99?
14. Where else does this apply? A service can look fine at the median and still be slow for the requests at a high rank. The paper's 100-server case is the same shape at a larger scale: one slow reply in a hundred becomes common when many replies are required together. This row does not draw those servers.

## Worked example

Assumed list, not a trace. Sort it: 98 values of 20 ms, then 40 ms, then 200 ms. N = 100.

50th percentile. p = 0.5. Rank = 0.5 times 101 = 50.5. k = 50, d = 0.5. Y[50] = 20 ms, Y[51] = 20 ms. Value = 20 + 0.5 times 0 = 20 ms. Samples strictly above 20 ms: the 40 ms sample and the 200 ms sample, so 2.

99th percentile. p = 0.99. Rank = 0.99 times 101 = 99.99. k = 99, which is less than 100, so this list does not hit the clamp. d = 0.99. Y[99] = 40 ms, Y[100] = 200 ms. Value = 40 + 0.99 times 160 = 198.4 ms. Samples strictly above 198.4 ms: the 200 ms sample, so 1.

Add one assumed 800 ms sample. N = 101. The sorted list ends 40, 200, 800.

50th percentile. Rank = 0.5 times 102 = 51. Y[51] = 20 ms. Value stays 20 ms. Samples above it: 3.

99th percentile. Rank = 0.99 times 102 = 100.98. k = 100, d = 0.98. Y[100] = 200 ms, Y[101] = 800 ms. Value = 200 + 0.98 times 600 = 788 ms. Samples above it: 1.

Check against the handbook's own example, not used as a latency: 12 resistivity order statistics, p = 0.9, rank = 0.9 times 13 = 11.7, value = 95.1959 + 0.7 times (95.1990 - 95.1959), which the page rounds to 95.1981 ohm cm. The model test uses that example.

## Visual

One plate. Feet, screws, a back lip, two end cheeks, and a front rail with a tick at every pin and a longer tick every tenth rank. The pins are the samples, short to tall. The only lit part is the finger on the rail. Its center is the rank. Words stay in the line under the drawing. No percentile is painted on a pin.

## Practice

Retrieval: the 50th and 99th percentiles of the assumed list; why the 50th is not half of 200 ms; what adding 800 ms does to each.
Exercise: run the 99th percentile, then add the 800 ms sample and run it again, then run the 50th percentile with the extra sample. The model's ranks and values are the check.
Spaced review: utilisation-queueing re-asks a request that has to wait, which this sorted list does not contain.

## Tabs

- Learn: auto-plays the assumed list, one tall pin already on the row. The finger stops at the median, then at the 99th percentile. Adding a sample is not this tab.
- Lab: the same model. The learner picks the 50th or the 99th percentile, may add the 800 ms sample, predicts, then presses Run. The outcome waits until the run finishes.
- Quiz: three questions. The answer stays behind the disclosure.

## Sources

- id: nist-percentile
  title: NIST/SEMATECH e-Handbook of Statistical Methods, section 7.2.6.2, Percentiles
  author: NIST / SEMATECH
  url: https://www.itl.nist.gov/div898/handbook/prc/section2/prc262.htm
  kind: guide
  published: no revision date on the fetched page
  checked: 2026-10-29
  via: read
  supports: [order statistics are the measurements sorted by increasing magnitude, and the rank is that position; the pth percentile is a value such that at most 100p percent of the measurements are less than it and at most 100(1-p) percent are greater; the 50th percentile is the median; the default estimate sets p(N+1) equal to k + d and interpolates Y[k] + d (Y[k+1] - Y[k]) when 0 is less than k and k is less than N, uses the first sample when k = 0, and uses the last sample when k is at least N; any p at or above N/(N+1) is the maximum; the page's 12 resistivity measurements give a 90th percentile of 95.1981 ohm cm by that method; the page identifies the default as Hyndman and Fan R6 and says other methods, including R7 and an elementary round-up of p N, are also used]
  note: >-
    Fetched and read from itl.nist.gov on 2026-10-29. Section 7.2.6.2. The page
    showed no revision date. Hyndman and Fan 1996 was not opened. This chapter
    implements the default formula on that page, not the elementary round-up.
    The resistivity numbers are a check of the formula. They are not latencies.

- id: tail-at-scale
  title: The Tail at Scale
  author: Jeffrey Dean, Luiz André Barroso
  url: https://cacm.acm.org/research/the-tail-at-scale/
  kind: paper
  published: 2013-02-01
  checked: 2026-10-29
  via: read
  supports: [a server that typically responds in 10 ms can have a 99th-percentile latency of one second, so one user request in 100 handled on that one server is slow; if a user request must collect responses from 100 such servers in parallel, 63 percent of user requests take more than one second; both of those are the paper's hypothetical; in their Table 1 discussion, the 99th percentile for a single random request to finish, measured at the root, is 10 ms, the 99th percentile for all requests to finish is 140 ms, the 99th percentile for 95 percent of the requests finishing is 70 ms, and waiting for the slowest 5 percent accounts for half of that 140 ms]
  note: >-
    Fetched and read from cacm.acm.org/research/the-tail-at-scale/ on 2026-10-29.
    The HTML prose states the 10 ms, 1 second, 63 percent, 10 ms, 140 ms, and 70 ms
    figures. It does not define the arithmetic of a percentile. This chapter does
    not recompute the 63 percent and does not draw a fan-out. The pin durations
    are assumed and are not these measurements.

## Open questions / unverified

- Hyndman and Fan, "Sample Quantiles in Statistical Packages" (1996), was not fetched. The label R6 is taken from the NIST page only.
- The handbook page showed no revision date.
- src/content/learn/source-catalog.ts was not edited, by instruction for this unit. The chapter's citation links point at /learn/sources anchors that are not on that page until a later unit wires them.
- The animation was not run in a browser. The finger's place is the rank in the source, and that equality was not watched on a screen.

## Evidence

- model tests: pass — `npx vitest run src/lib/learn/percentile-model.test.ts` (8 passed) (2026-10-29)
- eslint: pass — `npx eslint` on the five new source files (2026-10-29)
- typecheck: not run
- browser: not run — the shared browser was not used, and the dev server was not restarted (2026-10-29)
- motion check: not run — same reason (2026-10-29)
- spec review: not run — no fresh reviewer in this unit (2026-10-29)

## Review findings

Reviewer: not run. No fresh reviewer in this unit.

- [note] The rendered page was not opened. Reduced motion, keyboard stops, and the finger's screen position were not watched. → open
