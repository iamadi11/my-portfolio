# Back-of-envelope estimation

Id: estimation · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: latency-numbers · Related: utilisation-queueing, autoscaling, batch-processing, cost, interview-method
Standard: anatomy-3d
Implementation: `src/app/learn/estimation/page.tsx`, `src/components/learn/estimation/EstimateStack.tsx`,
`src/lib/learn/estimation-model.ts` (+ `.test.ts`), `src/content/learn/estimation-sources.ts`.

## Boundary

Objectives (observable, numbered):

1. Compute requests per second for a described product as assumed daily actions divided by 86,400.
2. Compute bytes stored and bytes per second from that rate and an assumed object size, and label every input assumed.
3. Predict which of the three products change when daily active users change, and which stay when only the object size changes.

In scope: one platform scale, three pans. Each pan's plate count is one product divided by that pan's plate unit. The product is a class notebook, not a company. A day is 24×60×60 seconds, used as a definition.

Deferred: a line of waiting jobs, utilisation, and Little's law → utilisation-queueing. Dividing a rate by an assumed disk operation rate, and rounding a day's bytes up for index overhead, are in the workbook chapter and are not drawn here → autoscaling. Orders of magnitude of one operation → latency-numbers, already taught. Percentiles → percentiles.

Misconceptions targeted: a larger object means more requests per second; storage is the rate rather than the rate times a day times the object size; 86,400 was measured for this notebook; the workbook exercise's query rate is this notebook's traffic.

## Concept decomposition

Mental models: a pan holds plates. The number of plates is a product. Changing one assumed input changes only the products that include that input.
Mechanisms: requests per second = daily active users × actions per user per day / 86,400. Bytes stored = that rate × 86,400 × bytes per object × days retained. Bytes per second = that rate × bytes per object. Plate count = product / plate unit, exact.
Temporal behaviour: Learn adds plates until each pan's count equals its field. The lab shows the learn notebook and does not change a pan until Run.
Quantitative relations: learn case, all inputs assumed: 8,640 users, 20 actions per user per day, 500 bytes per object, kept 1 day. Products: 2 requests per second, 86,400,000 bytes stored, 1,000 bytes per second. Plates: 2, 8, and 5. Plate units, assumed: 1 request per second, 10,800,000 bytes, 200 bytes per second. Doubling the users doubles all three products. Doubling the object size leaves the request rate at 2 and doubles the other two.
Failure scenarios: a non-positive input is rejected. A day's requests that do not divide 86,400 are rejected, so the page never rounds a rate into a plate. This scale does not queue, drop, or retry.
Trade-offs: integer plate units keep the stack a count of the product, and they hide nothing only because the published cases divide evenly. A different object size that does not divide the wire unit is refused rather than drawn as a partial plate.
Needs space or experiment: the learner has to see one pan stay put while the other two grow. The lab is that comparison.
Hardest: requests per second do not contain the object size — when only the size changes, the square pan stays at 2 plates, which the lab shows after Run.
Hardest: bytes stored are the rate times 86,400 times the object size times the days kept, so 2 requests per second become 86,400,000 bytes — the round pan is the tall stack, 8 plates, not a painted 86,400,000.
Hardest: 86,400 is 24×60×60, the definition of a day in this product — the workbook writes the same count as 8.64×10^4 seconds/day, and this page did not measure a day.

## Parts you'll meet

Requests per second: the actions in one day divided by the seconds in that day.
Bytes stored: the rate, times the seconds in a day, times the bytes in one object, times the days the objects are kept.
Bytes per second: the rate times the bytes in one object. Bandwidth in this chapter is that figure.
Assumed: an input nobody measured for this page. The users, the actions, the object size, the days kept, and the three plate units are assumed.
A day: 86,400 seconds, from 24×60×60. A definition, not a measurement.

## Storyboard

1. The learner sees one scale and the question: how many requests, how many bytes stored, how many bytes on the wire.
2. Learn adds plates. The square pan stops at 2, the long pan at 5, the round pan at 8. The readout states the three computed products and labels the inputs assumed.
3. In the lab the pans hold that notebook and wait. The learner changes users or object size, predicts which quantities change height, then presses Run.
4. After Run the pans show the new plate counts. Doubling the users grows all three stacks. Doubling the object size leaves the square pan at 2 plates.

## Asset plan

Objective coverage: 1 → A1 · 2 → A1 · 3 → A1

### A1. Estimate scale

- objective: 1, 2, 3
- type: 3d
- object: a platform scale with a plinth, feet, screws, a back rail, a mast with tick ledges, and three pans. The plates on each pan are the product.
- render: anatomy-iso
- fidelity: computed — requestsPerSecond, bytesStored, bytesPerSecond, and the three plate counts, all from estimate(). scaled — none; each plate is one unit of that product, and the unit is stated. assumed — daily active users, actions per user per day, bytes per object, days retained, and the three plate units (1 request per second, 10,800,000 bytes, 200 bytes per second). faked — none of the three products. The screws and feet are the instrument.
- pattern: predict step manipulate
- learner sees: Learn, the notebook's plates stacking to 2, 8, and 5. Lab, those same plates, held until Run.
- animated: each pan's stack height. The height is stackTop of the visible plate count, and the visible count stops at that pan's model field.
- learner does: on Learn, play, pause, previous, next, reset. On the lab, choose users or object size, predict which quantities change, press Run.
- notice: the three stacks finish at different heights; after a size change the request stack does not grow.
- model: src/lib/learn/estimation-model.ts. Inputs are positive integers. The day's requests must divide 86,400. Each product must divide its plate unit.
- feedback: the readout states the plate counts and the three products. After Run it states the old and new products and whether the prediction matched.
- assumptions: the notebook is not a company. Days retained is 1, one 24-hour period, the span the workbook multiplies. Plate units exist so the count is an integer. They are not disk sizes.
- outcome: the learner can compute the three products from stated assumptions, and can say which product omits the object size.
- accessibility: the readout is the text alternative; the SVG is aria-hidden. Learn's transport is keyboard reachable. The lab's choices and Run are keyboard reachable. Reduced motion seeks the learn clock to the final plate counts. The lab change is a single replacement of the plate counts, so reduced motion and motion show the same end.
- tests: src/lib/learn/estimation-model.test.ts for 86,400, the learn products, the plate counts, both knobs, the prediction, the stack height, and rejected inputs.
- evidence: sre-nalsd, via: read, sections named in Sources. The notebook's numbers are not in that chapter; they are labelled assumed.
- built: `src/components/learn/estimation/EstimateStack.tsx`, `src/lib/learn/estimation-model.ts`, `src/lib/learn/estimation-model.test.ts`, `src/app/learn/estimation/page.tsx`, `src/content/learn/estimation-sources.ts`

## Animation sense

### A1. Animation sense

- Mechanism: a day's actions divided by the seconds in a day are a request rate; that rate times a record size is bytes on the wire; that rate times the seconds in a day times the record size is bytes stored for one day.
- Moving quantity: the plates on each pan. A pan grows by adding one plate per unit of its product.
- Model field: requestPlates, storagePlates, and wirePlates. Visible plates are min(step, field). At the end of Learn, step is maxPlates and each visible count equals its field. After Run, the visible count equals the new field. Stack height is stackTop(count), with plateZ(0) = 16 and each next plate 3.5 above the last.
- Learner predicts: which of the three quantities change height when the chosen assumption changes.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): sre-nalsd, via: read, 2026-10-29, What Is NALSD, Why Non-Abstract, AdWords Example (Initial Requirements, One Machine Calculations, LogJoiner Calculations, Multidatacenter Calculations).

## Explanation (14 questions)

1. Problem: a learner is handed a product and asked for requests per second, storage, and bandwidth, and has no measured traffic.
2. Why does it matter? A design that skips the product cannot say whether one machine, a disk, or a link is in range. The workbook treats that estimate as the step that makes a whiteboard design concrete.
3. What would a beginner try first? Multiply users by object size and call the result the request rate. Or treat the actions in a day as the per-second rate.
4. Why does that work at first? At a tiny notebook the numbers are small either way, and a larger note does feel like "more."
5. When does it fail? The request rate does not contain the object size. Doubling a 500-byte object leaves the rate at 2 requests per second and doubles the bytes. Treating 172,800 daily actions as the rate overstates the rate by 86,400.
6. What do we observe more carefully? Which pans change height. Users move all three. Object size moves the round pan and the long pan and leaves the square pan at 2 plates.
7. What is the real mechanism? See the equations in Concept decomposition. Every input the learner sees is assumed. 86,400 is 24×60×60, not a measurement. The workbook writes that count as 8.64×10^4 seconds/day inside a 24-hour volume: rate × seconds/day × bytes per record. Bytes on the wire in that chapter are rate × bytes per record.
8. What can the learner change and watch? Daily active users (8,640 or 17,280) or object size (500 or 1,000 bytes). Actions per user per day stay 20. Days retained stay 1.
9. What alternatives exist? Start from an assumed rate, as the workbook's exercise does, and multiply. Or start from an assumed daily count and divide by the seconds in a day, which is the same relation run the other way. Or round the day's bytes up for overhead, which that chapter also does and this scale does not.
10. What are the trade-offs? Dividing a daily count makes the rate easy to see and hides bursts inside the day. Starting from a rate skips the daily count and needs the rate as its own assumption. Rounding up for indexes changes the byte total and is a second assumption, not the product itself.
11. When should you choose it? When the question is the order of the load and the storage for a product whose inputs you are willing to state.
12. When should you not? When requests wait in line. That is utilisation-queueing. When you need a percentile. That is percentiles. When you need the number of disks or machines. The workbook does that next, and this scale does not. When you have a measurement. Replace the assumed input, and say so.
13. Explain it in your own words. The square pan stays at 2 plates when the object doubles. What was multiplied, and what was not?
14. Where else does this apply? A later capacity check multiplies a rate by a cost or by a machine's limit. autoscaling and cost re-ask this product. This scale does not draw a queue or a price.

## Worked example

Assumed, not taken from the workbook's exercise. Daily active users 8,640. Actions per user per day 20. Bytes per object 500. Days retained 1. Seconds in a day 86,400, the definition 24×60×60.

Requests in a day = 8,640 × 20 = 172,800. Requests per second = 172,800 / 86,400 = 2. Bytes per second = 2 × 500 = 1,000. Bytes stored = 2 × 86,400 × 500 × 1 = 86,400,000.

Plate units, assumed: 1 request per second, 10,800,000 bytes, 200 bytes per second. Plates = 2, 8, and 5. Check: 8 × 10,800,000 = 86,400,000. 5 × 200 = 1,000.

Users doubled, still assumed: 17,280. Requests per second 4. Bytes stored 172,800,000. Bytes per second 2,000. Plates 4, 16, and 10.

Object doubled, still assumed: 1,000 bytes. Requests per second stay 2. Bytes stored 172,800,000. Bytes per second 2,000. Plates 2, 16, and 10.

The workbook's own example, not used as this notebook: it assumes 500,000 queries per second and 10,000 clicks per second, rounds a query log entry up to 2 KB, and writes (5×10^5 queries/sec) × (8.64×10^4 seconds/day) × (2×10^3 bytes) = 86.4 TB/day. Checked here by arithmetic: 500,000 × 86,400 × 2,000 = 86,400,000,000,000 bytes = 86.4×10^12 bytes. It then rounds 86.4 TB up to 100 TB. A wire example: (10^4 clicks/sec) × (2×10^3 bytes) = 20 MB/sec. Those figures stay in the source. They are not inputs on the scale.

## Visual

One platform scale. Feet, a plinth, a deck, corner screws, a blank nameplate, a back rail, two short posts, a collar, a mast, four tick ledges at stackTop of 4, 8, 12, and 16 plates, three pans with rims and a clamp each. Square plates, round plates, long plates. The lit face is the top plate of a stack. Words stay in the line under the drawing. No quantity is painted on a plate.

## Practice

Retrieval: the three learn products; why the request plates stay at 2 when the object doubles; what 86,400 is.
Exercise: run the users change, then the size change. estimate(), movedQuantities(), and expectedPrediction() are the check.
Spaced review: autoscaling and cost re-ask a rate times a size. utilisation-queueing re-asks a request that has to wait, which this scale does not contain.

## Tabs

- Learn: auto-plays the assumed notebook until each pan's plate count equals its field, and shows the three computed quantities. The lab's prediction is not this tab.
- Lab: the same model. The learner changes daily active users or object size, predicts which quantities change height, then presses Run. The pans wait until the run.
- Quiz: three questions. The answer stays behind the disclosure.

## Sources

- id: sre-nalsd
  title: Introducing Non-Abstract Large System Design
  author: Salim Virji, James Youngman, Henry Robertson, Stephen Thorne, Dave Rensin, and Zoltan Egyed, with Richard Bondi
  url: https://sre.google/workbook/non-abstract-design/
  kind: book
  published: 2018
  checked: 2026-10-29
  via: read
  supports: [the chapter says examples of assumption making matter more than the final values, and that early assumptions heavily influence the results; making perfect assumptions is not required; the exercise assumes 500,000 search queries per second and 10,000 ad clicks per second; query log entries are rounded up to 2 KB; a 24-hour volume is (5×10^5 queries/sec) × (8.64×10^4 seconds/day) × (2×10^3 bytes) = 86.4 TB/day; that total is rounded up to 100 TB for overhead; bytes on the wire include (10^4 clicks/sec) × (2×10^3 bytes) = 20 MB/sec and (1.02×10^6 queries/sec) × (2×10^3 bytes) = 2.04 GB/sec; one day of ClickMap is (10^4 clicks/sec) × (8.64×10^4 seconds/day) × 16 bytes = 14 GB/day, rounded up to 20 GB]
  note: >-
    Fetched and read from sre.google/workbook/non-abstract-design/ on 2026-10-29.
    https://sre.google/workbook/non-abstract-large-system-design/ returned 404 the same day.
    The table of contents at https://sre.google/workbook/table-of-contents/ named this URL.
    Sections read: What Is NALSD?, Why "Non-Abstract"?, AdWords Example (Initial Requirements,
    One Machine including Calculations, the LogJoiner Calculations, the Multidatacenter Calculations).
    The HTML dropped some superscripts; 5×10^5, 8.64×10^4, and 2×10^3 were checked against the
    stated 500,000 queries per second, the 2 KB rounding, and the stated 86.4 TB/day.
    The notebook on this page does not use 500,000, 10,000, or 2 KB. Those stay the exercise's
    assumptions. 86,400 is this chapter's writing of 8.64×10^4 as 864×10^2, and the page calls
    it the definition 24×60×60, which the fetched page does not spell out. The page says "a
    24-hour period" and "8.64×10^4 seconds/day". Disk IOPS and the machine count in that chapter
    are not on this scale. The SLO sentence that lost its duration in the HTML was not used.

## Open questions / unverified

- The fetched page showed no revision date beyond Copyright 2018. The 2018 date is that copyright line.
- Superscripts in the formulas were flattened by the HTML conversion. The arithmetic check above is what made 8.64×10^4 and 86.4 TB legible. A figure that failed that check was not used.
- The workbook does not derive a rate from daily active users. This chapter divides an assumed daily count by 86,400, which is their product run backwards. The daily count is assumed, not read from the exercise.
- src/content/learn/source-catalog.ts was not edited, by instruction for this unit. Citation links point at /learn/sources anchors that are not on that page until a later unit wires them.
- The animation was not run in a browser. Plate height is stackTop of the plate count in the model, and that equality was not watched on a screen.
- Chapter 15's page exists at src/app/learn/utilisation-queueing/page.tsx. This chapter links to it and does not edit that chapter's files.

## Evidence

- model tests: pass — `npx vitest run src/lib/learn/estimation-model.test.ts` (9 passed) (2026-10-29)
- eslint: pass — `npx eslint` on the five new source files (2026-10-29)
- typecheck: fail — `npx tsc --noEmit` (2026-10-29). 12 errors, all under `.next/types` for about, contact, and tech-stack. None name the estimation files.
- browser: not run — the browser was not used, and the dev server was not restarted (2026-10-29)
- motion check: not run — same reason (2026-10-29)
- spec review: not run — no fresh reviewer in this unit (2026-10-29)

## Review findings

Reviewer: not run. No fresh reviewer in this unit.

- [note] The rendered page was not opened. Reduced motion, keyboard steps, and the pan heights were not watched. → open


## Film upgrade · 2026-10-29

Objective: Keep units visible and separate an average from a peak.

Topology: Your browser, Requests per second, Capacity estimate.

1. Start with an assumption — Assume one million requests per day. This is an example workload, not a production measurement.
2. Convert the time unit — One day has 86,400 seconds. Divide requests per day by seconds per day.
3. Find the average — The average is about 11.6 requests per second. Keep the unit in the answer.
4. Allow for peaks — Assume a peak ten times the average. The corresponding peak is about 116 requests per second.
5. Ask what is missing — Real sizing also needs request cost, bytes, storage, availability requirements and measured headroom.

Motion: sampleFilm().packet.x/y is message progress between named endpoints. Event state and captions share the same beat record. Five-second playback beats and geometry are scaled teaching aids, not network timings. Existing source records support reused claims; no new source access claimed. New film needs browser validation; old review evidence does not verify this upgrade.
