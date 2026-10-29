# Utilisation, queues and Little's law

Id: utilisation-queueing · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: percentiles · Related: vertical-horizontal, async-work
Standard: anatomy-3d
Implementation: `src/app/learn/utilisation-queueing/page.tsx`, `src/components/learn/utilisation-queueing/QueueRow.tsx`,
`src/lib/learn/utilisation-queueing-model.ts` (+ `.test.ts`), `src/content/learn/utilisation-queueing-sources.ts`.

## Boundary

Objectives (observable, numbered):

1. For the assumed rates, state that the mean number in the system equals the arrival rate times the mean time in the system: at 5 per second, 1 = 5 × 0.2 s; at 9 per second, 9 = 9 × 1 s.
2. Predict that the time in the system at 9 arrivals per second is much longer than at 5, for this one-server formula: 1 s against 0.2 s, and the row goes from 1 job to 8.
3. Say that the jobs in the row are the mean number waiting, rounded to a whole job, and that those means are the formula, not a measured run.

In scope: one server. Utilisation ρ = λ/μ. Little's relation L = λW. The M/M/1 mean sojourn (1/μ)/(1 − ρ) for ρ below 1, and the row of jobs waiting, whose count is the mean number waiting rounded to a whole job.

Deferred: percentiles and tail latency, already taught. Where a millisecond comes from goes to latency-numbers. More than one server, a finite row that turns jobs away, a network of queues, and a simulated sample path are not this machine. The 1961 proof is not re-derived; the abstract states the relation this chapter uses.

Misconceptions targeted: waiting time grows in proportion to utilisation, so 0.9 is only a bit worse than 0.5; Little's relation by itself says the wait blows up; the jobs in the row are a count from a simulation; at utilisation 1 the same sojourn formula still applies.

## Concept decomposition

Mental models: one machine finishes jobs one at a time. Jobs that have arrived and not started stand in a row aimed at its mouth. A bin beside the bed holds the jobs that are not in that row.
Mechanisms: ρ = λ/μ. While ρ is below 1, the mean time in the system is (1/μ)/(1 − ρ). The mean number in the system is the arrival rate times that time. The mean delay before service is that time minus one mean service. The mean number waiting is the arrival rate times that delay. The row shows that mean, rounded to a whole job.
Temporal behaviour: Learn plays the arrival rate from 5 per second to 9 per second. The row starts at 1 job and ends at 8. The lab does not move until Run.
Quantitative relations: μ = 10 jobs per second, assumed. λ = 5 gives ρ = 0.5, L = 1, W = 0.2 s, delay before service = 0.1 s, mean waiting = 0.5, row = 1. λ = 9 gives ρ = 0.9, L = 9, W = 1 s, delay = 0.9 s, mean waiting = 8.1, row = 8. Halfway, λ = 7, the row shows 2, so most of the growth is in the second half of the sweep.
Failure scenarios: this model has no steady mean when λ is at or above μ. The note says a single server is then busy all the time. This page does not use the sojourn formula there, and it does not turn jobs away.
Trade-offs: Little's relation holds more generally than the M/M/1 sojourn. The sojourn formula is what makes the time grow as ρ approaches 1, and it is tied to one server, Poisson arrivals, exponential service, infinite room, and first come first served. Rounding the mean waiting to a whole job makes the row a count of bodies; the readout keeps the unrounded mean.
Needs space or experiment: the jobs have to stand in the row, or the longer wait is only a number beside a machine.
Hardest: the time is not proportional to utilisation — 0.9 against 0.5 multiplies the sojourn by 5, from 0.2 s to 1 s, because the factor is 1/(1 − ρ), and the row goes from 1 job to 8.
Hardest: Little's relation does not choose the time. It ties the mean number to whatever time the server formula gives. Delete the formula for W and the relation no longer says the row gets long.
Hardest: the bodies are a rounded mean, not a snapshot of one busy moment. A mean of 0.5 waiting jobs is drawn as 1, and 8.1 as 8, and the readout says both numbers.

## Parts you'll meet

Utilisation: ρ = λ/μ, the arrival rate divided by the service rate. Dimensionless.
Arrival rate: λ, jobs per second. On this page, 5 or 9, assumed.
Service rate: μ, jobs the one machine finishes per second. On this page, 10, assumed.
Mean number in the system: L, or l in the sample-path note. Jobs in service and jobs waiting, as a long-run mean.
Mean time in the system: W, or w. Seconds from arrival to departure, as a mean.
Little's relation: L = λW. The mean number equals the arrival rate times the mean time.
Delay before service: the sojourn minus one mean service time, from the note's split of the sojourn into the customers already there plus the job's own service.
Mean number waiting: the arrival rate times that delay. The row count rounds it to a whole job.

## Storyboard

1. The learner sees one machine on a bench, a bed of ways aimed at its mouth, and jobs stacked in a bin beside the bed. The question is what happens to the row as arrivals approach the rate the machine can finish.
2. Learn plays on its own. The arrival rate rises from 5 per second to 9. One job stands in the row at the start. Eight stand in the row at the end. The readout states L = λW at the rate the clock has reached.
3. In the lab the jobs stay in the bin until Run. The learner picks utilisation 0.5 or 0.9, predicts whether the wait stays short or grows sharply, then presses Run.
4. The low run leaves 1 job in the row and a mean time of 0.2 s. The high run ends at 8 jobs and a mean time of 1 s.

## Asset plan

Objective coverage: 1 to A1, 2 to A1, 3 to A1

### A1. Queue row

- objective: 1, 2, 3
- type: 3d
- object: a single-bay machine on a plate, with a bed of ways into its mouth, and job bodies that leave a side bin and stand in a single file on the ways
- render: anatomy-iso
- fidelity: L, W, the delay before service, and the mean number waiting are computed by station(); the arrival rates 5 and 9 per second and the service rate 10 per second are assumed; the row count is round of the mean number waiting, so 0.5 is drawn as 1 job and 8.1 as 8; the waits are the M/M/1 formulas, not a measurement and not a simulated sample
- pattern: predict step
- learner sees: the machine, the bin, and the file of jobs; Learn already moving from the short file to the long one; the lab still until Run
- animated: each job's transform is its slot on the bed when its index is below station().present, and its place in the bin otherwise. The count present is the clock's model field
- learner does: on Learn, play and step from the short row to the long row; in the lab, pick the low or the high utilisation, predict, then run
- notice: the file is short at ρ = 0.5 and much longer at ρ = 0.9; the readout's product matches the mean number in the system
- model: inputs are the arrival rate and the fixed service rate; state is the station, including present; rules in src/lib/learn/utilisation-queueing-model.ts
- feedback: the line under the drawing is the row count, the mean waiting, the mean time, and L = λW; the lab's outcome line appears when the run finishes
- assumptions: one assumed service rate and two assumed arrival rates, not a trace; FIFO M/M/1 with ρ below 1; rounding of the mean waiting to a whole job
- outcome: the learner can predict that the high utilisation makes the time and the row grow sharply, and can state L = λW for both assumed rates
- accessibility: the step sentence is the text alternative; keyboard Previous and Next; reduced motion jumps from the short row to the long row; the drawing is aria-hidden
- tests: src/lib/learn/utilisation-queueing-model.test.ts for L = λW at both taught rates, for the M/M/1 sojourn, for the high wait exceeding the low wait, and for the row counts 1 and 8
- evidence: little-1961 Abstract, read; sigman-littles-law §1.1 and §1.2, read; the arithmetic is a teaching model on assumed rates
- built: `src/components/learn/utilisation-queueing/QueueRow.tsx`, `src/lib/learn/utilisation-queueing-model.ts`, `src/lib/learn/utilisation-queueing-model.test.ts`, `src/app/learn/utilisation-queueing/page.tsx`

## Animation sense

### A1. Animation sense

- Mechanism: one server finishes jobs one at a time. As the arrival rate approaches the service rate, the mean time in the system grows as (1/μ)/(1 − ρ), and Little's relation puts a matching mean number in the system. The jobs waiting stand in a row.
- Moving quantity: the jobs in the row.
- Model field: station().present, the mean number waiting rounded to a whole job. At the learn clock's start that field is 1. At the end it is 8. Each body's transform is its slot on the bed when its index is below that field, and its place in the bin otherwise.
- Learner predicts: whether the wait stays short, with one job in the row, or grows sharply, with eight jobs in the row.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): little-1961, via: read, 2026-10-29, Abstract; sigman-littles-law, via: read, 2026-10-29, §1.1 Theorem 1.1 and §1.2 through the FIFO M/M/1 application.

## Explanation (14 questions)

1. Problem: a machine that is busy most of the time can still make a job wait much longer than its own service. A single utilisation number hides that.
2. Why does it matter? The mean time in the system for this one-server formula is (1/μ)/(1 − ρ). At the assumed ρ of 0.5 that is 0.2 s. At the assumed ρ of 0.9 that is 1 s, ten mean service times of 0.1 s. Little's relation then says the mean number in the system is 9, not a number near 1. The row shows 8 jobs waiting. These are the formulas on assumed rates, not a measurement of a service.
3. What would a beginner try first? Scale the wait with the utilisation, and treat 0.9 as a bit worse than 0.5. Or read L = λW as the sentence that, by itself, says the wait blows up.
4. Why does that work at first? At ρ = 0.5 the mean time is two service times, and one job in the row matches a machine that is idle half the time. The relation L = λW is true at both rates, so it feels like the whole story.
5. When does it fail? Moving from ρ = 0.5 to ρ = 0.9 multiplies 1/(1 − ρ) by 5, so the mean time goes from 0.2 s to 1 s. The mean number waiting goes from 0.5 to 8.1, and the row goes from 1 job to 8. Halfway along the sweep, at 7 arrivals per second, the row shows only 2 jobs. Most of the growth is near the high end. And L = λW does not pick the 1 s. The server formula does.
6. What do we observe more carefully? How many jobs are standing in the row, and the mean time the readout states at that arrival rate.
7. What is the real mechanism? ρ = λ/μ. For a FIFO M/M/1 queue with ρ below 1, the note gives the mean number in the system l = ρ/(1 − ρ) and the mean sojourn w = (1/μ)/(1 − ρ), which it also writes as (1/μ)(1 + l). This page sets W = l/λ, which matches 1/(μ − λ). The mean service time is 1/μ. The delay before service is W − 1/μ, using the note's split of the sojourn into the customers found plus the job's own service. The mean number waiting is λ times that delay, which is the note's Q = λd applied to that delay. The row count is that mean rounded to a whole job: 0.5 rounds to 1, and 8.1 rounds to 8. Little's abstract states L = λW when the means are finite, the processes are strictly stationary, and the arrival process is metrically transitive with a nonzero mean. The sample-path theorem states l = λw when λ and w exist and are finite. Assumed values: μ = 10 per second, λ = 5 and λ = 9. At λ = 5, ρ = 0.5, L = 1, W = 0.2 s, delay = 0.1 s, mean waiting = 0.5, row = 1, and 5 × 0.2 s = 1. At λ = 9, ρ = 0.9, L = 9, W = 1 s, delay = 0.9 s, mean waiting = 8.1, row = 8, and 9 × 1 s = 9.
8. What can the learner change and watch? The arrival rate, 5 or 9 per second. The service rate stays 10 per second.
9. What alternatives exist? A utilisation by itself. The mean service time alone, 0.1 s, which is the time when nobody is waiting. Little's relation without the server formula, which relates the three means and does not choose them. A second server, or a finite row, which this model does not draw.
10. What are the trade-offs? The M/M/1 means are closed formulas, so the page can show them without pretending a random run was measured. They hold for this arrival process, this service distribution, one server, infinite room, and first come first served. Little's relation survives a change of those details when its own conditions hold, but then W has to come from somewhere else. Rounding to a whole job makes 0.5 look like one job; the readout keeps 0.5 so the picture does not replace the mean.
11. When should you choose it? When the question is how the wait and the number present grow as one server's arrival rate approaches its service rate, and the arrival and service assumptions match this formula.
12. When should you not? When ρ is at or above 1: the note gives the busy fraction as min{ρ, 1}, and this page does not use the sojourn formula there. When the service has more than one server, or the row turns jobs away. When the question is a percentile of one sample of durations. That is the percentiles chapter. When you need a measured wait from a running service. This page does not have one.
13. Explain it in your own words. At 5 arrivals per second the row shows one job and the mean time is 0.2 s. What does the same machine do at 9 arrivals per second, and which formula picked the time?
14. Where else does this apply? Any single server whose arrivals and service match these assumptions gets a long mean wait as utilisation approaches 1, and Little's relation then requires a long mean number in the system. A checkout, a disk, or a request handler can have that shape. This bench is one machine and an infinite row, not those systems.

## Worked example

Assumed rates, not a trace. The machine finishes μ = 10 jobs per second. Mean service time 1/μ = 0.1 s.

Low. λ = 5 per second. ρ = 5/10 = 0.5. Mean number in the system L = 0.5 / 0.5 = 1. Mean time in the system W = 1 / (10 − 5) = 0.2 s, and also (1/10) / (1 − 0.5) = 0.2 s. Check L = λW: 5 × 0.2 s = 1. Delay before service = 0.2 s − 0.1 s = 0.1 s. Mean number waiting = 5 × 0.1 s = 0.5. The row shows round(0.5) = 1 job.

High. λ = 9 per second. ρ = 0.9. L = 0.9 / 0.1 = 9. W = 1 / (10 − 9) = 1 s, and also (0.1) / 0.1 = 1 s. Check L = λW: 9 × 1 s = 9. Delay = 1 s − 0.1 s = 0.9 s. Mean number waiting = 9 × 0.9 s = 8.1. The row shows round(8.1) = 8 jobs.

The high time is larger than the low time: 1 s > 0.2 s. The high delay is larger than the low delay: 0.9 s > 0.1 s. The ratio of the sojourns is 5, while the ratio of the utilisations is 1.8.

Halfway along the learn sweep, λ = 7 per second, ρ = 0.7, and the row shows 2 jobs. The long row is the high end, not a steady lengthening from the first moment.

## Visual

One plate on four feet. A machine stands at one end: a plinth, a housing, two posts, a lintel over the mouth, and a spindle. A bed runs from that mouth, with two rails, a ruler strip, and an end stop. Jobs are bodies. The ones in the row stand in single file on the bed. The others sit in a bin in front of the far end. The only lit parts are the jobs whose index is below the model count. Words stay in the line under the drawing. No word is painted on the metal.

## Practice

Retrieval: L and W at 5 per second and at 9 per second; why 0.9 is not a small step up from 0.5; why L = λW does not, by itself, make the time long.
Exercise: run the low utilisation, then the high one. The model's times and the row counts 1 and 8 are the check.
Spaced review: vertical scaling and horizontal scaling re-ask what to do when one server's utilisation is this close to 1. This chapter does not add a second server.

## Tabs

- Learn: auto-plays the assumed sweep from 5 arrivals per second to 9. The row grows from 1 job to 8. Choosing a rate is not this tab.
- Lab: the same model. The learner picks the low or the high utilisation, predicts whether the wait stays short or grows sharply, then presses Run. The row waits until Run. The outcome waits until the run finishes.
- Quiz: three questions. The answer stays behind the disclosure.

## Sources

- id: little-1961
  title: A Proof for the Queuing Formula: L = λW
  author: John D. C. Little
  url: https://pubsonline.informs.org/doi/pdf/10.1287/opre.9.3.383
  kind: paper
  published: 1961-06-01
  checked: 2026-10-29
  via: read
  supports: [1/λ is the mean time between arrivals of two consecutive units, L is the mean number of units in the system, and W is the mean time spent by a unit in the system; if those three means are finite, the corresponding stochastic processes are strictly stationary, and the arrival process is metrically transitive with nonzero mean, then L = λW]
  note: >-
    Fetched and read on 2026-10-29 from the INFORMS pdf URL. The fetched page
    contained the title, the author, the publication line "Published Online:
    1 Jun 1961", and the Abstract. The proof in the paper body was not in that
    response. No section number inside the paper was visible, so this chapter
    cites the Abstract only. The formula used here is the one the Abstract states.

- id: sigman-littles-law
  title: Notes on Little's Law (l = λw)
  author: Karl Sigman
  url: https://www.columbia.edu/~ks20/stochastic-I/stochastic-I-LL.pdf
  kind: note
  published: 2009
  checked: 2026-10-29
  via: read
  supports: [§1.1 defines λ as the limit of N(t)/t, w as the average sojourn, and l as the time average of the number in system; Theorem 1.1 says that if λ and w exist and are finite then l exists and l = λw; §1.2 item 1 says that if the system is the queue area, the relation becomes Q = λd, the mean number waiting equal to the arrival rate times the mean delay in queue; §1.2 item 3 says that for a single server with arrival rate λ and mean service 1/μ the long-run fraction of time the server is busy is min{ρ, 1}; §1.2 item 4, FIFO M/M/1 with ρ < 1, states Pn = (1 − ρ)ρ^n, l = ρ/(1 − ρ), and w = (1/μ)/(1 − ρ) = (1/μ)(1 + l)]
  note: >-
    Fetched and read on 2026-10-29. Sections read: the opening through §1.1,
    including Theorem 1.1, and §1.2 through the FIFO M/M/1 application (items
    1 to 4). The note says the balance equations were solved earlier; that
    earlier derivation was not in this file. This chapter uses the sojourn
    the note states, and it takes the delay before service to be that sojourn
    minus one mean service time because the note counts the job's own service
    as the extra one in (1 + l) service times. It does not present those
    seconds as a measurement. The arrival rates 5 and 9 per second, and the
    service rate 10 per second, are assumptions.

## Open questions / unverified

- The body of Little's 1961 paper, including any numbered proof sections, was not in the fetched page. Only the Abstract was read.
- Sigman's note attributes Pn = (1 − ρ)ρ^n to balance equations solved earlier. Those equations were not in the fetched note.
- The row count rounds the mean number waiting. It is not a distribution of the queue length, and the note's Pn was not drawn.
- src/content/learn/source-catalog.ts was not edited, by instruction for this unit. The chapter's citation links point at /learn/sources anchors that are not on that page until a later unit wires them.
- The animation was not run in a browser. The row count is station().present in the source, and that equality was not watched on a screen.
- Chapter 16, API design, has no page under src/app/learn/. The next link says it is planned and not written.

## Evidence

- model tests: pass — `npx vitest run src/lib/learn/utilisation-queueing-model.test.ts` (8 passed) (2026-10-29)
- eslint: pass — `npx eslint` on the five new source files (2026-10-29)
- typecheck: no errors naming these files — `npx tsc --noEmit` filtered for utilisation-queueing (2026-10-29). Other project errors were not treated as this chapter's.
- browser: not run — the browser was not used, and the dev server was not restarted (2026-10-29)
- motion check: not run — same reason (2026-10-29)
- spec review: not run — no fresh reviewer in this unit (2026-10-29)

## Review findings

Reviewer: not run. No fresh reviewer in this unit.

- [note] The rendered page was not opened. Reduced motion, keyboard stops, and the row's screen position were not watched. → open


## Film upgrade · 2026-10-29

Objective: As arrivals approach service capacity, waiting can dominate.

Topology: Your browser, Queue, One worker.

1. A worker has a limit — This teaching example has one worker and a finite service rate.
2. Work starts to collect — When arrivals temporarily exceed departures, waiting work accumulates.
3. Use spare capacity — The worker drains work when service can keep up.
4. Do not confuse busy with stable — Sustained arrivals above capacity keep growing this unbounded teaching queue.
5. Apply the right assumptions — Little’s law relates long-run averages in a stable system: work in system equals arrival rate times time in system.

Motion: sampleFilm().packet.x/y is message progress between named endpoints. Event state and captions share the same beat record. Five-second playback beats and geometry are scaled teaching aids, not network timings. Existing source records support reused claims; no new source access claimed. New film needs browser validation; old review evidence does not verify this upgrade.
