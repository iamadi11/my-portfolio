# TCP: reliable streams over unreliable packets

Id: tcp · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: ip-and-ports · Related: dns, tls, http, udp-quic
Standard: anatomy-3d
Implementation: `src/app/learn/tcp/page.tsx`, `src/components/learn/tcp/TcpStream.tsx`,
`src/lib/learn/tcp-model.ts` (+ `.test.ts`), `src/content/learn/tcp-sources.ts`.

## Boundary

Objectives (observable, numbered):

1. Predict that a segment already at the receiver stays unread while an earlier segment is missing.
2. Predict that the sender puts those same bytes on the wire again after the fixed wait, and that the application then reads the gap and the bytes it was holding.
3. Predict that a run with no loss never sends a segment twice, and that losing only the last segment leaves nothing held past a gap.

In scope: one sender, one receiver, one wire, five data segments, at most one lost first copy, a fixed resend delay, in-order delivery to the application. One mechanism: the missing bytes are sent again, and the receiver does not hand the application anything past the gap.

Deferred: the three-way handshake → not this chapter (RFC 9293 §3.5). The connection in the model is already open. Congestion control, including the window → RFC 9293 §3.8.2 requires it; this model leaves it out. The computed retransmission timeout → RFC 9293 §3.8.1 points at RFC 6298, which was not read. Acknowledgments, delayed ACK, SACK, and fast retransmit → named around §3.4 and §3.8.2; the documents those sections point at were not read, and the figure draws no acknowledgment. Checksum failure, duplicates that arrive late, and closing the connection → later. TLS → tls.

Misconceptions targeted: TCP makes the wire reliable (the cartridge still falls); a segment in the tray can be read as soon as it arrives; the second copy is a different range of bytes; the cartridge on the floor is delivered as well as the copy that arrives later.

## Concept decomposition

Mental models: the cartridge is the segment. The lamps are the bytes the application has read.
Mechanisms: a lost first copy leaves the cable; the same bytes travel again after a fixed wait; the application reads only a prefix with no hole.
Temporal behaviour: sends are staggered; a flight takes a fixed number of ticks; the fall finishes when that copy would have arrived; the resend is measured from that segment's own send.
Quantitative relations: five segments, 100 data bytes each, send spacing 5 ticks, flight 4 ticks, fall from halfway over the remaining 2 ticks, resend 26 ticks after send. All of those are assumed. readCount is the length of the arrived prefix.
Failure scenarios: one first copy falls. The resend is not lost. Nothing is corrupted.
Trade-offs: holding bytes costs memory and delay at the receiver. Handing the application a hole would be faster and wrong for an in-order stream. The fixed wait is not a measured timeout.
Needs space or experiment: the cartridge has to be in one place, and the lamps have to be able to stay dark while a cartridge sits in the tray.
Hardest: a cartridge can sit in the tray and stay dark — the application has not read it, because a gap is in front of it (A1).
Hardest: the fallen cartridge is not repaired in place — a second cartridge of the same bytes leaves later, and only that copy is read (A1).
Hardest: losing the last segment holds nothing past a gap, so the first four lamps are already on and the tray is not full of dark cartridges (A1).

## Parts you'll meet

Segment: one cartridge of data bytes. Here, 100 assumed bytes.
Byte stream: the application reads bytes in order, with no hole.
Place: sender, cable, floor, or tray. That is where the cartridge is.
Read: the application has those bytes. The lamp and the cartridge in the tray light.
Hold: the cartridge has reached the tray, and the application has not read it, because an earlier segment is missing.

## Storyboard

1. The learner sees a sender press and a receiver tray on one bench, with a cable between them. Five cartridges sit on the sender. The question is what happens when one of them never reaches the tray.
2. On Learn, segment 3 travels, falls off the cable, and lands on the floor. Segments 4 and 5 reach the tray and stay dark. The line says the application has read 2 of 5.
3. A second cartridge of bytes 200–299 leaves the sender, crosses the cable, and enters the tray. Lamps 3, 4, and 5 light together. The cartridge on the floor stays dark.
4. In the lab the learner chooses which segment falls, or none, predicts the shape of that wait, and presses Run. The bench stays still until then.

## Asset plan

Objective coverage: 1 → A1 · 2 → A1 · 3 → A1

### A1. One wire

- objective: 1, 2, 3
- type: 3d
- object: a sender press and a receiver tray on one bench, joined by a cable, with one cartridge per segment
- render: anatomy-iso
- fidelity: place, along, drop, and read are computed by frameAt(); five segments, 100 data bytes, 5-tick spacing, 4-tick flight, the halfway fall, and the 26-tick resend wait are assumed; the tick is not a measured round trip; nothing is faked as a live capture
- pattern: step break predict
- learner sees: five cartridges on the sender, a cable, an empty tray, five dark lamps
- animated: each cartridge moves to the place, along, and drop of its body; a lamp and a cartridge in the tray light only when read is true
- learner does: on Learn, play and step the loss of segment 3; in the lab, choose which segment is lost or none, predict, then run
- notice: a later cartridge can sit in the tray dark; the same bytes travel again; the floor copy never lights; losing the last segment leaves nothing dark in the tray past a gap
- model: input lost (null or 1..5); state is frameAt(lost, t) in src/lib/learn/tcp-model.ts; readCount is the arrived prefix; the resend exists only for the lost segment
- feedback: the line under the drawing is the event sentence plus how many segments are read and which are held; the lab adds the settle counts and the prediction verdict when the run finishes
- assumptions: one wire, one loss, the resend is not lost, no acknowledgment is drawn, no congestion window, the connection is already open, byte numbers count data from 0
- outcome: the learner can predict the lamps at the end of the first trips, and that a second cartridge of the missing bytes is what fills the gap
- accessibility: the step sentence is the text alternative; the drawing is aria-hidden; keyboard Previous and Next; reduced motion jumps from event to event; the lab draws no run until Run
- tests: src/lib/learn/tcp-model.test.ts for the prefix rule, the fall, the resend, the three outcomes, and that read matches place
- evidence: rfc9293 §2.2, §3.1, §3.5, §3.8, §3.8.1, §3.8.2, §3.10.7, §3.10.8, read
- built: `src/components/learn/tcp/TcpStream.tsx`, `src/lib/learn/tcp-model.ts`, `src/lib/learn/tcp-model.test.ts`, `src/app/learn/tcp/page.tsx`

## Animation sense

### A1. Animation sense

- Mechanism: a lost segment is sent again, and the receiver does not deliver bytes that sit past the gap.
- Moving quantity: the segment cartridge.
- Model field: place (sender, wire, lost, or receiver), along (0 at the sender end of the wire to 1 at the receiver end), drop (0 on the wire to 1 on the floor), and read (whether the application has those bytes), all from frameAt, in assumed ticks.
- Learner predicts: which lamps are lit when every first trip has finished, and that a second cartridge of the lost bytes travels later.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): rfc9293, via: read, 2026-10-28, §2.2, §3.8, §3.10.7, §3.10.8.

## Explanation (14 questions)

1. Problem: IP can drop a segment. The application still needs every byte, in order.
2. Why it matters: a hole in the stream is a hole in the file, the request, or the message the application is reading.
3. What would a beginner try first? Hand the application every segment as soon as it reaches the receiver.
4. Why does that work at first? On one quiet wire, with nothing lost, arrival order matches send order.
5. When does it fail? One cartridge falls, a later one arrives, and the application would see a hole.
6. What do we observe more carefully? The later cartridge sits in the tray, and its lamp stays dark.
7. What is the real mechanism? TCP offers a reliable, in-order byte stream. Segments ride in IP datagrams. A lost segment is transmitted again. The receiver processes a segment that begins at the next byte it still needs, and holds a segment that starts later (RFC 9293 §2.2, §3.8, §3.10.7, §3.10.8).
8. What can the learner change and watch? Which of the five first copies falls, or none.
9. What alternatives exist? An application that can accept a hole can use a datagram protocol. That choice is a later chapter. Fast retransmit is named in §3.8.2 and lives in documents this chapter did not read.
10. What are the trade-offs? Holding bytes uses memory and adds delay. Delivering past a gap would be sooner and would break the in-order stream. A fixed wait is simple to watch and is not how a real timeout is chosen.
11. When should you choose it? When the application needs every byte, in order, and a missing piece must be sent again.
12. When should you not treat this picture as the whole protocol? When you need the handshake, the congestion window, or a timeout computed from round-trip time. Those are required or specified elsewhere in RFC 9293 and are not running here.
13. Explain it in your own words. Where is segment 4, and is its lamp on, while segment 3 is on the floor?
14. Where else does this apply? A consumer that refuses to apply record 4 until record 3 has arrived is the same hold. It stops being the same when later records are allowed to apply and the gap is filled by a different path.

## Worked example

Assumed inputs: segment 3 is the one that falls. Segment n is sent at (n−1) × 5 ticks. A successful flight takes 4 ticks. The lost copy leaves the cable at 2 ticks and is on the floor at 4 ticks. The resend leaves 26 ticks after that segment's send.

- t = 0, segment 1 leaves (bytes 0–99). t = 4, it arrives and is read. readCount = 1.
- t = 5, segment 2 leaves (bytes 100–199). t = 9, it arrives and is read. readCount = 2.
- t = 10, segment 3 leaves (bytes 200–299). t = 14, it is on the floor. readCount stays 2.
- t = 15, segment 4 leaves (bytes 300–399). t = 19, it is in the tray, unread.
- t = 20, segment 5 leaves (bytes 400–499). t = 24, it is in the tray, unread. Held: 4 and 5. This is FIRST_SETTLE. The resend has not left.
- t = 36, segment 3 is sent again. t = 40, it arrives. readCount becomes 5. Lamps 3, 4, and 5 light. The floor copy stays unread.

Nothing lost: arrivals at 4, 9, 14, 19, and 24, readCount 1 through 5, no second copy. Last segment lost: at t = 24, readCount is 4 and held is empty.

## Visual

One bench. The sender is a press with a bed, a knob, a pin, and a gland at the cable. Two posts and two saddles carry the cable. The receiver is a tray with five wells, a back riser, a rail, and five lamps. The only moving parts are the cartridges. Words stay in the step line. Lit means the application has read that segment.

## Practice

Retrieval: what the application has read when segment 3 is on the floor and 4 and 5 are in the tray; what lights when the second copy of segment 3 arrives; how many trips each segment makes when nothing is lost.
Exercise: run the lab with none lost, with segment 1 lost, and with segment 5 lost. The model's settle counts are the check: 5 and nothing held; 0 read and 2–5 held; 4 read and nothing held.
Spaced review: tls can ask what is already true of the byte stream before anything is encrypted. http can ask why a response body is read in order. udp-quic can ask what this chapter refused to hand the application.

## Tabs

- Learn: auto-plays segment 3 falling and the same bytes crossing again. It does not ask for a prediction, and it does not offer the other loss cases.
- Lab: the same model. The learner chooses the lost segment or none, predicts, and presses Run. The bench stays still until then. The verdict uses tick 24, the end of the first trips.
- Quiz: three questions. The answer stays behind the disclosure. The questions do not paste the Learn caption or the lab readout.

## Sources

- id: rfc9293
  title: Transmission Control Protocol (TCP) (RFC 9293)
  author: W. Eddy (ed.)
  url: https://www.rfc-editor.org/rfc/rfc9293
  kind: spec
  published: 2022-08
  checked: 2026-10-28
  via: read
  supports: [TCP provides a reliable, in-order byte stream, segments are carried in IP datagrams, and loss is corrected by retransmission (§2.2); the first data octet is ISN+1 when SYN is set (§3.1); the three-way handshake establishes a connection (§3.5); segments may be lost and TCP retransmits to deliver every segment (§3.8); the retransmission timeout must be computed, currently by the algorithm in RFC 6298 (§3.8.1); congestion control is required and is not specified in full here (§3.8.2); an idealized segment is processed when it begins at RCV.NXT, and a segment with a higher starting sequence number should be held (§3.10.7, SHLD-31); when the retransmission timeout expires, send the segment at the front of the retransmission queue again (§3.10.8)]
  note: >-
    Published text fetched from https://www.rfc-editor.org/rfc/rfc9293.txt on 2026-10-28.
    Section numbers are from that file. RFC 6298 is reference [10] in that file and was not read.
    The 26-tick wait is an assumption of this chapter, not that algorithm.

## Open questions / unverified

- RFC 6298 was not fetched. The fixed wait must not be described as its algorithm.
- Fast retransmit and selective acknowledgment are named from RFC 9293 §3.8.2 and were not read.
- The figure was not played in a browser in this unit, so the cartridge's visibility on the cable is unverified.

## Evidence

- model tests: pass — `npx vitest run src/lib/learn/tcp-model.test.ts` (2026-10-28)
- eslint: pass — `npx eslint` on the chapter files (2026-10-28)
- browser: not run — the shared browser was not driven in this unit
- animation sense: not run — the figure was not played in a browser, so this line is not a pass
- spec review: not run — no fresh reviewer in this unit

## Review findings

- spec review: not run — browser check and an independent reviewer were outside this unit


## Film upgrade · 2026-10-29

Objective: TCP exposes an ordered byte stream; later bytes wait behind missing bytes.

Topology: Your browser, Receive buffer, App server.

1. Split the stream — TCP carries bytes in segments. Sequence numbers identify their place in the byte stream.
2. Receive later bytes — A later segment arrives before the missing one. The receiver can buffer it.
3. Hold the gap — The application does not receive later bytes as if the missing bytes had arrived.
4. Retransmit missing bytes — A retransmission fills the gap. The receiver can now assemble a continuous prefix.
5. Deliver in order — The application receives the ordered bytes. Arrival order and delivery order can differ.

Motion: sampleFilm().packet.x/y is message progress between named endpoints. Event state and captions share the same beat record. Five-second playback beats and geometry are scaled teaching aids, not network timings. Existing source records support reused claims; no new source access claimed. New film needs browser validation; old review evidence does not verify this upgrade.
