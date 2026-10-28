# Latency and throughput

Id: latency-throughput · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: web-request · Related: percentiles, latency-numbers, utilisation-queueing
Standard: anatomy-3d
Implementation: `src/app/learn/latency-throughput/page.tsx`, `src/components/learn/latency/LatencyBench.tsx`,
`src/lib/learn/latency-model.ts` (+ `.test.ts`), `src/content/learn/latency-sources.ts`.

## Boundary

Objectives (observable):

1. For one bed that stays busy, predict that the first piece finishes at the service time S and that the tray holds the window divided by S.
2. Predict that more beds leave that finish at S, and that the tray rises only until every piece that can finish inside the window has a bed.
3. Predict that a shorter service time does not raise the tray when the next piece has not yet arrived.

In scope: one service time, jobs that arrive one at a time, and 1, 2, or 4 beds. One mechanism: how long one job takes, and how many jobs finish in a fixed window.

Deferred: a line of waiting jobs, utilisation, and Little's law → utilisation-queueing. Spread and tails → percentiles. Where a real millisecond goes (memory, disk, network) → latency-numbers. Link capacity, and the overloaded word bandwidth → not this chapter's machine (RFC 5136, read; the tray counts jobs, not bits).

Misconceptions targeted: more beds make one job finish sooner; a short service time always fills the tray faster; the time for one job and the count of jobs are the same number; this figure is the RFC 1242 benchmark.

## Concept decomposition

Mental models: a bed is one worker. A piece on that bed is one job. The tray is the count of finished jobs.
Mechanisms: a taken job finishes S after it starts. One busy bed finishes a job every S. More beds run more jobs at once until arrivals that can finish inside the window run out.
Temporal behaviour: the piece moves for S. The tray gains a piece only at a finish inside the window.
Quantitative relations: when one bed is busy the whole window, completions = T/S and the rate is 1/S. The first finish is S either way. Completions never exceed the arrivals whose arrival + S lands inside the window.
Failure scenarios: this model does not drop a frame, queue a job, or slow one bed because another is busy. A job that arrives onto a busy bed is not taken.
Trade-offs: more beds raise the tray without shortening one crossing, until arrivals are the scarce part. A shorter S raises the tray only when a piece is waiting to start, which this model does not store.
Needs space or experiment: the piece has to be somewhere on the bed, or the time is a number with no place.
Hardest: a fast crossing is not a full tray — the bed sits empty until the next piece arrives, which the figure shows by a piece that finishes and a tray that does not gain another until that arrival.
Hardest: more beds do not pull one piece along any faster — the piece's place is only that job's own service, which stays S when the other beds are bolted on.
Hardest: one busy bed makes the tray equal the window divided by S — the first finish and the rate are two readings of the same service time, and adding beds splits them apart.

## Parts you'll meet

Service time: how long one piece takes to cross a bed. Here, an assumed 125, 250, or 500 ms.
Window: the stretch of time we count. Here, an assumed 1000 ms.
Arrival: when the next piece shows up. Here, one piece every 250 ms, assumed.
Bed: one worker. It can hold one piece, and that piece takes the service time.
Tray: the pieces that have finished inside the window.

## Storyboard

1. The learner sees one bed on a plate, a piece at the near stop, and an empty tray. The question is how far that piece gets, and how many pieces finish while they watch.
2. Learn plays on its own. The piece slides to the far stop. Each time it arrives, it leaves the bed and a piece sits in the tray. With one busy bed the first finish is the service time and the tray holds the window divided by that time.
3. In the lab they choose a service time and 1, 2, or 4 beds, predict, then press Run. The pieces stay still until Run.
4. A longer service time on one bed finishes fewer pieces. The same service time on more beds leaves the first piece's finish unchanged and can put more pieces in the tray, until a further bed has nothing left that can finish inside the window.

## Asset plan

Objective coverage: 1 → A1 · 2 → A1 · 3 → A1

### A1. Service bench

- objective: 1, 2, 3
- type: 3d
- object: a plate with one to four beds, each a track with end stops, and one piece per busy bed that slides to a tray
- render: anatomy-iso
- fidelity: the piece's place is computed by along() and the tray count is computed by completionsAt(); the service times 125, 250, and 500 ms, the 1000 ms window, and arrivals every 250 ms are assumed; the rate 1/S is computed by busyRate() only when one bed stays busy for the whole window
- pattern: step manipulate predict
- learner sees: the beds bolted on for the chosen worker count, stops at each end, an empty tray until a job finishes
- animated: the piece's place along the bed equals along(job, t); each piece that appears in the tray equals one job in completionsAt(run, t)
- learner does: on Learn, play and step the one busy bed; in the lab, set S and W, predict, then run
- notice: the first piece still takes S when more beds are bolted on; the tray rises with the beds only while arrivals can finish inside the window; a faster bed can sit empty
- model: inputs serviceMs and workers; state is each job's start and finish; rules in src/lib/learn/latency-model.ts; first finish is S; completions are finishes at or before 1000 ms
- feedback: the line under the drawing is the elapsed service of the furthest piece and the tray count; the outcome line appears at the end of a lab run
- assumptions: no queueing delay, no contention, not a benchmark, not a link; a job that finds every bed busy is not taken
- outcome: the learner can predict the first finish and the tray for one busy bed, for more beds, and for a bed that waits on the next arrival
- accessibility: the step sentence is the text alternative; keyboard Previous and Next; reduced motion jumps mark to mark; the drawing is aria-hidden
- tests: src/lib/learn/latency-model.test.ts for W=1, for W>1, and for a service time shorter than the arrival spacing
- evidence: rfc1242 §3.8 and §3.17, rfc5136 §2.2, §2.3.2, and §3.4, read; the bench's arithmetic is a teaching model, not those procedures
- built: `src/components/learn/latency/LatencyBench.tsx`, `src/lib/learn/latency-model.ts`, `src/lib/learn/latency-model.test.ts`, `src/app/learn/latency-throughput/page.tsx`

## Animation sense

### A1. Animation sense

- Mechanism: a job that gets a free bed takes the service time to finish, and the count of finishes in a fixed window is set by the beds until the arrivals that can finish inside the window run out.
- Moving quantity: the piece on a bed, and each piece that joins the tray.
- Model field: along(job, t), the fraction of that job's service elapsed, mapped along the bed; completionsAt(run, t), the count of jobs finished by t inside the window.
- Learner predicts: whether the first piece finishes before the service time, and whether the tray beats one bed.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): rfc1242, via: read, 2026-10-28, §3.8 and §3.17; rfc5136, via: read, 2026-10-28, §2.2, §2.3.2, and §3.4.

## Explanation (14 questions)

1. What is the problem? A piece takes some time to cross a bed, and a tray fills with some number of pieces. Those are easy to treat as one fact.
2. Why does it matter? A short crossing can still leave few pieces finished, and a long crossing on several beds can finish many. Mixing the two numbers picks the wrong change.
3. What would a beginner try first? Make the one bed faster, or bolt on beds, and expect both numbers to improve together.
4. Why does that work at first? On one bed that never sits idle, the first finish is S and the tray holds T/S. Speeding that bed shortens S and, while it stays busy, raises the tray.
5. When does it fail? When the next piece has not arrived, a faster bed sits empty and the tray does not gain the pieces T/S would suggest. When pieces arrive faster than one bed finishes them, more beds raise the tray and still do not shorten one crossing.
6. What do we observe more carefully? The piece's place along the bed, and the count in the tray, at the same moment.
7. What is the real mechanism? A taken job starts at its arrival and finishes S later. The first job starts at 0, so the first finish is S. Completions are finishes at or before the window T. With one bed busy the whole window, completions = T/S, so the rate is 1/S jobs per millisecond. With W beds and no contention, more jobs can be in service, and the tray stops rising once every arrival that can finish inside the window has a bed. Assumed values: S is 125, 250, or 500 ms, T is 1000 ms, and a piece arrives every 250 ms. At S = 250 and W = 1 the first finish is 250 ms and the tray holds 4. At S = 500 and W = 1 the tray holds 2. At S = 500 and W = 4 the first finish is still 500 ms and the tray holds 3. At S = 125 and W = 1 the first finish is 125 ms and the tray holds 4, not 8.
8. What can the learner change and watch? The service time, and whether 1, 2, or 4 beds are bolted on.
9. What alternatives exist? One bed (this chapter's busy case). More beds with the same service time. A shorter service time. A link's capacity, which is a different quantity (RFC 5136) and not a bed.
10. What are the trade-offs? More beds cost beds and do not shorten one job. A shorter service time shortens one job and raises the tray only while a piece is ready to start. This model refuses a job rather than making it wait, so it hides the wait a real queue would add.
11. When should you choose it? When you need the time for one job, count one crossing. When you need how many finish, count the tray, and add beds only while arrivals are still waiting on a free bed.
12. When should you not? When the piece would have to wait, or when beds interfere. Those are later. When you need a link's bit rate, this tray is the wrong instrument. When you need the slow tail rather than one service time, that is a later chapter.
13. Explain it in your own words. The service time stays 500 ms and you bolt on beds. What happens to the first piece, and what happens to the tray?
14. Where else does this apply? A wide server can finish many slow requests while each request still takes its own service time. A fast handler can still finish few requests when the next one has not arrived.

## Visual

One plate. Each worker is a bed with a back rail, an infeed stop, an outfeed stop, and a tick strip. Each piece that is crossing is lit. Finished pieces stack on a tray at the outfeed. Words stay in the line under the drawing. The service times and the window are named in the caption, not on the metal.

## Tabs

- Learn: auto-plays one bed at 250 ms. The piece crosses, and the tray holds four when the window ends. The other service times and the extra beds are not this tab.
- Lab: the same model. The learner sets the service time and 1, 2, or 4 beds, predicts, then presses Run. The outcome waits until the run finishes.
- Quiz: three questions. The answer stays behind the disclosure.

## Practice

Retrieval: the first finish and the tray for one busy bed at 250 ms; whether four beds at 500 ms shorten the first piece; why 125 ms on one bed does not hold eight pieces.
Exercise: run S = 500 on one bed, then on four beds, and run S = 125 on one bed. The model's finishes and tray counts are the check.
Spaced review: percentiles re-asks what one service time hides; utilisation-queueing re-asks what happens when a piece has to wait.

## Sources

- id: rfc1242
  title: Benchmarking Terminology for Network Interconnection Devices (RFC 1242)
  author: S. Bradner (editor)
  url: https://www.rfc-editor.org/rfc/rfc1242
  kind: spec
  published: 1991-07
  checked: 2026-10-28
  via: read
  supports: [latency is a time interval for one frame: for a store-and-forward device, from the last bit of the input frame at the input port to the first bit of the output frame at the output port, and for a bit-forwarding device, from the end of the first bit in to the start of the first bit out (§3.8); throughput is the maximum rate at which none of the offered frames are dropped by the device, reported in frames per second or bits per second (§3.17)]
  note: >-
    Published text fetched from rfc-editor.org on 2026-10-28 (rfc1242.txt). Section numbers are from that text.
    The memo is terminology for benchmarking network interconnection devices. This chapter's bench is not that test.

- id: rfc5136
  title: Defining Network Capacity (RFC 5136)
  author: P. Chimento, J. Ishac
  url: https://www.rfc-editor.org/rfc/rfc5136
  kind: spec
  published: 2008-02
  checked: 2026-10-28
  via: read
  supports: [nominal physical link capacity is the theoretical maximum amount of data a link can support, illustrated there with an OC-3 link at 155.520 Mbit/s (§2.2); IP-layer link capacity is the maximum number of IP-layer bits transmitted and correctly received over an interval, divided by the length of that interval (§2.3.2); literature overloads bandwidth for that capacity, as when one 802.11b link is called 11 Mbit/s, 25 MHz, or an observed 8 Mbit/s (§3.4)]
  note: >-
    Published text fetched from rfc-editor.org on 2026-10-28 (rfc5136.txt). Section numbers are from that text.
    The tray in this chapter counts jobs. It is not a link capacity and not a bandwidth figure.
