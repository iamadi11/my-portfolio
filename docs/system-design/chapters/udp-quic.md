# UDP and QUIC: when TCP is not the answer

Id: udp-quic · Stage: 1 · Paths: beginner production (status lives only in CURRICULUM.md)
Prerequisites: tcp tls · Related: http, http-versions
Standard: anatomy-3d
Implementation: `src/app/learn/udp-quic/page.tsx`, `src/components/learn/udp-quic/QuicStreams.tsx`,
`src/lib/learn/udp-quic-model.ts` (+ `.test.ts`), `src/content/learn/udp-quic-sources.ts`.

## Boundary

Objectives (observable, numbered):

1. After one lost packet, point at the two bodies and say which stream is held and which is delivered when each body is its own stream.
2. Predict whether the later stream stalls, for one ordered byte stream and for one stream each.
3. Say why the packets ride in UDP: UDP does not guarantee delivery or duplicate protection, and QUIC puts packet protection and the feedback for reliable delivery on those datagrams.

In scope: two bodies, one shared path, one lost packet that carries only the earlier stream. The body's place (which stream, on the wire or held or delivered) is the mechanism. The single ordered byte stream is the other input, so the learner can see the later body held.

Deferred: the TCP retransmission timeout and the segment that is sent again → tcp. The TLS handshake and the key schedule → tls. A packet that contains both streams, drawn as its own run → named from RFC 9000 §13 and not drawn. The new STREAM frame that carries lost application data again → named from §13.3 and not drawn. Flow-control credit, stream-identifier bit layout, connection migration, 0-RTT, and congestion control → later. HTTP/3's mapping onto these streams → http-versions. Loss detection and the recovery algorithm → RFC 9002, not read, so no timer is drawn.

Misconceptions targeted: UDP itself resends and encrypts; any lost packet stalls every QUIC stream; a later stream cannot move while an earlier stream is held; a packet that carried two streams would block only one of them.

## Concept decomposition

Mental models: two bodies share one bar. Each body is one stream. Off the bar and not in a far well, the body is held. In a far well, it is delivered.
Mechanisms: the earlier packet is lost while it is on the bar, and that body stays off the bar. On one ordered byte stream the later body is held. On a stream each, the later body stays on the bar and is delivered.
Temporal behaviour: the earlier body is on the wire until LOSS, then held. The later body leaves at GAP. In the per-stream case it is delivered at GAP + FLIGHT. A time between those ticks is the place `frameAt` returns, including a fractional `along` on the wire.
Quantitative relations: LOSS, GAP, and FLIGHT are assumed tick counts. No duration is taken from RFC 9000 or RFC 768. Which packet is lost is assumed: the earlier stream, alone.
Failure scenarios: the lost packet. On one byte stream the later body never reaches a far well. On a stream each, only the earlier body stays held.
Trade-offs: one byte per body makes the hold visible. It hides a second byte of the same stream, a packet that carries both streams, and the frame that sends the lost bytes again.
Needs space or experiment: the two bodies have to be able to occupy the shared bar, a hold off that bar, or a far well, and deleting a body has to remove the only record of which stream is held.
Hardest: a loss on a shared path does not hold every later byte — only the stream that was in the lost packet waits, and the other body still arrives (A1).
Hardest: one ordered byte stream does hold the later body — the same loss, the other input, and the later body never becomes delivered (A1).
Hardest: UDP carried the datagram and did not promise delivery — the protection and the reliable-delivery feedback are QUIC's, and the handshake that makes the keys is not this machine (A1).

## Parts you'll meet

Stream: one body. An ordered sequence of bytes. This run has two.
Place: sender, on the wire (the shared bar), held (off the bar), or delivered (a far well).
Lost packet: the earlier body, assumed. It is the only body with `lost` true.
Byte stream: one ordered sequence, so the later body is held while the earlier byte is missing.
Per stream: each body is its own stream, and there is no order between them.

## Storyboard

1. The learner sees one bench: a sender, one shared bar, two cradles off the bar, and two far wells. The question is what happens to the other body when one packet is lost.
2. On Learn, the per-stream run plays. The earlier body travels part of the bar, then sits off the bar. The later body travels the bar and sits in its far well.
3. In the lab the learner chooses one byte stream or one stream each, predicts whether the later stream stalls, and presses Run. The bench stays still until then.
4. One byte stream ends with both bodies off the bar. One stream each ends with only the earlier body off the bar.

## Asset plan

Objective coverage: 1 → A1 · 2 → A1 · 3 → A1

### A1. Two bodies, one bar

- objective: 1, 2, 3
- type: 3d
- object: a sender, one shared bar, two side cradles, and a receiver with two wells; each body is one stream, and its seat is that body's place
- render: anatomy-iso
- fidelity: place, stream, along, lost, and laterStalls are computed by frameAt(); LOSS, GAP, FLIGHT, and which packet is lost (the earlier stream alone) are assumed; the hold is the stall, not a timed retransmission; nothing is faked as a packet capture
- pattern: step manipulate predict
- learner sees: a sender, one bar, two cradles, two wells, and, once the run starts, two bodies
- animated: each body moves by a screen translate from its rest pose to the pose of its place at this time; on the wire the pose is `along` on the one shared segment, for either stream; held is that stream's cradle; delivered is that stream's well
- learner does: on Learn, the per-stream loss plays and can be stepped; in the lab, choose one byte stream or one stream each, predict whether the later stream stalls, then run
- notice: the later body can finish while the earlier body stays off the bar; the same loss holds the later body when both are one ordered sequence
- model: input mode (`byte` or `perStream`); state is frameAt(mode, t) in src/lib/learn/udp-quic-model.ts; the moving field is each body's stream and place
- feedback: the line under the drawing is the event sentence plus the place of each stream; the lab adds summary() and the prediction verdict when the run has finished
- assumptions: two bodies, one byte each, the earlier packet is the one lost, LOSS GAP and FLIGHT ticks, the lost packet contains only the earlier stream
- outcome: the learner can say which stream is held, whether the later stream stalled, and that UDP did not provide the delivery guarantee
- accessibility: the step sentence is the text alternative; the drawing is aria-hidden; keyboard Previous and Next; reduced motion jumps from event to event; the lab draws no run until Run
- tests: src/lib/learn/udp-quic-model.test.ts for the two endings, the wire fraction, the lost body, and the event places
- evidence: rfc9000 §1, §1.2, §2, §2.2, §12, §12.1, §13, §13.3, read; rfc768 Introduction, read
- built: `src/components/learn/udp-quic/QuicStreams.tsx`, `src/lib/learn/udp-quic-model.ts`, `src/lib/learn/udp-quic-model.test.ts`, `src/app/learn/udp-quic/page.tsx`

## Animation sense

### A1. Animation sense

- Mechanism: two streams share a path; a lost packet holds only the stream whose data was in it, and the other stream's bytes still arrive.
- Moving quantity: the two bodies.
- Model field: each body's place, together with which stream it is. Place is sender, wire, held, or delivered. While place is wire, `along` is the fraction of the shared path (ticks on the wire divided by FLIGHT).
- Learner predicts: whether the later stream stalls.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): rfc9000, via: read, 2026-10-29, §1, §1.2, §2, §2.2, §12, §12.1, §13, §13.3; rfc768, via: read, 2026-10-29, Introduction.

## Explanation (14 questions)

1. Problem: two streams of bytes share one path, and one packet on that path is lost. The sender needs the other stream to keep moving.
2. Why it matters: if every later byte waits, a loss in one stream stalls the others that share the path. Callers that put independent work on one ordered byte stream wait on the slowest gap.
3. What would a beginner try first? One ordered byte stream for everything, and UDP left to deliver whatever it can.
4. Why does that work at first? One sequence is enough when there is only one thing to deliver, and a path that drops nothing never shows the stall.
5. When does it fail? One packet is lost. On the single sequence, the later body is held. It is not delivered.
6. What do we observe more carefully? The same loss, with each body its own stream: the earlier body stays held, and the later body is delivered.
7. What is the real mechanism? QUIC streams are ordered sequences of bytes, and QUIC does not order bytes across streams (RFC 9000 §2, §1.2). A STREAM frame carries a stream identifier and an offset (§2.2, §19.8). Packets can interleave frames from one or more streams (§13). QUIC packets are carried in UDP datagrams (§1, §1.2, §12). UDP does not guarantee delivery or duplicate protection (RFC 768, Introduction). QUIC authenticates each packet, encrypts as much as is practical, and provides the feedback used for reliable delivery (§1, §12, §12.1). When a packet is lost, only streams with data in that packet are blocked; other streams can continue (§13). Lost application data is sent again in a new STREAM frame (§13.3). This run does not draw that frame.
8. What can the learner change and watch? The ordering: one byte stream, or one stream each. The lost packet, the tick counts, and the two bodies stay fixed.
9. What alternatives exist? One ordered byte stream. QUIC's per-stream reliability on UDP. A design that puts several streams in the lost packet, which §13 says blocks all of those streams. Leaving reliability to UDP, which RFC 768 does not provide.
10. What are the trade-offs? One sequence is simpler and stalls every later byte. Per-stream delivery keeps the other stream moving and adds the packet protection and the loss recovery QUIC specifies. Packing many streams into one packet saves datagrams and reintroduces the stall for every stream in the lost packet.
11. When should you choose it? When independent byte streams share a path and a loss in one of them must not hold the others, and the datagrams underneath do not themselves guarantee delivery.
12. When should you not treat this picture as the whole protocol? When you need the retransmission timer, the handshake, a second byte on the lost stream, connection migration, or HTTP/3's stream mapping. Those are specified elsewhere and are not running here. The TCP resend chapter already showed one ordered byte stream's retransmission; this picture does not draw it again.
13. Explain it in your own words. The run has finished. Which body is held, which body is delivered, and which ordering did you run?
14. Where else does this apply? Two independent files on one path, where a missing piece of the first file must not stop the second file from being written out. It stops being the same when both files' bytes were placed in the one packet that was lost.

## Worked example

Learn, locked by `LEARN_MODE`: `perStream`. Assumed values: LOSS = 2 ticks, GAP = 4 ticks, FLIGHT = 6 ticks, end = GAP + FLIGHT = 10 ticks. The lost packet is the earlier stream alone.

- At t = 0 the earlier body is on the wire, along = 0. The later body is at the sender.
- At t = 2 the earlier body is held, along = 2/6. The later body is still at the sender.
- At t = 4 the later body is on the wire, along = 0. The earlier body is still held.
- At t = 7 the later body is on the wire, along = (7 − 4) / 6 = 0.5. The earlier body is still held.
- At t = 10 the later body is delivered. The earlier body is still held. `laterStalls` is false. The outcome is `passes`.

The other input, `byte`, at the same ticks:

- Through t = 2, the same as above. The loss does not depend on the mode.
- At t = 4 and at t = 10 the later body is held. It is never on the wire and never delivered. `laterStalls` is true. The outcome is `stalls`.

## Visual

One bench. Feet, screws, a base, a blank nameplate, and a ruler strip. The sender is a housing with cheeks, a bed, a waiting bay, a knob, and a pin. One bar runs to the receiver, with a rail, two saddles, two stops, and two posts. Two cradles sit off the bar. The receiver has two wells, a divider, a riser, and two rods. The two bodies are the only parts that change seat. Words stay in the step line.

## Practice

Retrieval questions (answer, and why the wrong reading fails):

1. The earlier body is off the bar and the later body is in a far well. Right: the lost packet held only the stream that was in it (RFC 9000 §13). Wrong: "every stream waits" is the single ordered sequence, not this ending. Wrong: "UDP delivered the later body" gives UDP a guarantee RFC 768 does not make.
2. Both bodies are off the bar. Right: one ordered byte stream, because bytes are not delivered past a gap (§2.2). Wrong: "the later packet was the one that was lost" contradicts the assumed lost packet, which is the earlier stream in both modes.
3. What the datagram did not promise. Right: delivery and duplicate protection (RFC 768, Introduction). QUIC authenticates and encrypts as much as is practical, and it supplies the reliable-delivery feedback (§1). Wrong: "UDP encrypted the payload" puts the protection on the datagram.

Exercise: run both inputs. Say the place of each body at the end, and say which input held the later stream.
Spaced review: http-versions can ask which stream a loss holds, once HTTP/3 is written. The TCP chapter's resend question is not asked again here.

## Tabs

- Learn: the per-stream loss, watched, and the rule that a lost packet holds only the streams that were in it. This tab does not ask for a prediction and does not offer the byte-stream input.
- Lab: the learner chooses one byte stream or one stream each, predicts whether the later stream stalls, and presses Run. The bench stays still until then. This tab does not restate the UDP paragraph.
- Quiz: three questions, answers inside `<details>`. This tab does not repeat the Learn caption or the Lab readout.

## Sources

- id: rfc9000
  title: QUIC: A UDP-Based Multiplexed and Secure Transport (RFC 9000)
  author: Iyengar, Thomson (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9000
  kind: spec
  published: 2021-05
  checked: 2026-10-29
  via: read
  supports: [QUIC streams are ordered byte streams and a connection can carry several; QUIC does not order bytes across streams (§2, §1.2); STREAM frames carry a stream identifier and an offset and an endpoint delivers each stream as an ordered byte stream, buffering out-of-order data (§2.2); STREAM frame layout (§19.8); QUIC packets are carried in UDP datagrams, and one or more QUIC packets can be encapsulated in a single UDP datagram (§1, §1.2, §12); QUIC authenticates each packet and encrypts as much as is practical, and it provides the feedback used to implement reliable delivery (§1); packets have confidentiality and integrity protection, with the protection overview in §12.1 and the details deferred to another document; stream multiplexing interleaves STREAM frames, and on loss only streams with data in that packet are blocked while other streams can continue; a packet that includes several streams blocks all of those streams (§13); lost QUIC packets are not retransmitted whole; application data is sent again in new STREAM frames (§13.3)]
  note: Read from rfc-editor.org/rfc/rfc9000.txt on 2026-10-29. Sections actually read: §1, §1.1 (document map only), §1.2, §2, §2.1 (stream identifiers, not used as a control), §2.2, §12, §12.1, §12.2 (opening), §13 through the head-of-line paragraph, §13.3, §19.8. RFC 9001 and RFC 9002 were not opened. §12.1 points at QUIC-TLS for packet-protection details; those details are not claimed here. No duration and no identity of the lost packet were taken from this document.

- id: rfc768
  title: User Datagram Protocol (RFC 768)
  author: Postel
  url: https://www.rfc-editor.org/rfc/rfc768
  kind: spec
  published: 1980-08-28
  checked: 2026-10-29
  via: read
  supports: [UDP does not guarantee delivery or duplicate protection; applications that need ordered reliable delivery of streams are directed to TCP (Introduction)]
  note: Read from rfc-editor.org/rfc/rfc768.txt on 2026-10-29. RFC 768 has no numbered sections. The Introduction was read, plus the Format and Fields pages so the datagram was not cited from a fragment. The header layout is not drawn. The TCP citation inside RFC 768 is RFC 761, which was not opened; this chapter does not use it.

## Open questions / unverified

- RFC 9001 (QUIC-TLS) was not read. Packet-protection details beyond the overview in RFC 9000 §1 and §12.1 are not claimed.
- RFC 9002 (loss detection and congestion control) was not read. The picture does not time a retransmission. LOSS, GAP, and FLIGHT are assumptions.
- The sources page does not yet list this chapter. `src/content/learn/source-catalog.ts` was left unchanged on purpose. The chapter links to `/learn/sources#udp-quic` anyway.

## Evidence

- model tests: pass — `npx vitest run src/lib/learn/udp-quic-model.test.ts` (10 tests, 2026-10-29)
- eslint: pass — `npx eslint` on the five new TypeScript files (2026-10-29)
- tsc: `npx tsc --noEmit` reported no error naming these files (2026-10-29). The repo's existing `.next` type failures are not this chapter's.
- browser: not run — the unit was told not to use the browser
- animation sense: not run — the browser check was not run

## Review findings

Reviewer: not run — no fresh reviewer was started, and the browser was not opened.

- [note] animation check in the browser was not run → open
- [note] the sources catalog was not updated, so `/learn/sources#udp-quic` has no section yet → open


## Film upgrade · 2026-10-29

Objective: QUIC has reliable streams over UDP; loss in one stream need not block ordered delivery in another.

Topology: Your browser, QUIC stream A, QUIC stream B.

1. Separate streams — QUIC carries distinct reliable byte streams inside a connection.
2. Lose bytes from A — A packet carrying some of stream A is lost. Those missing bytes need recovery.
3. B still arrives — Data for stream B can be delivered when its own ordered bytes are available.
4. Repair A — Recovery supplies missing data for A. Reliability has not been removed.
5. Share the network — Streams still share connection-level resources and congestion control. Independence does not mean unlimited bandwidth.

Motion: sampleFilm().packet.x/y is message progress between named endpoints. Event state and captions share the same beat record. Five-second playback beats and geometry are scaled teaching aids, not network timings. Existing source records support reused claims; no new source access claimed. New film needs browser validation; old review evidence does not verify this upgrade.
