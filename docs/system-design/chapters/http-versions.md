# HTTP/1.1, HTTP/2 and HTTP/3

Id: http-versions · Stage: 1 · Paths: beginner production (status lives only in CURRICULUM.md)
Prerequisites: http udp-quic · Related: tcp, cloud-networking
Standard: anatomy-3d
Implementation: `src/app/learn/http-versions/page.tsx`, `src/components/learn/http-versions/VersionHold.tsx`,
`src/lib/learn/http-versions-model.ts` (+ `.test.ts`), `src/content/learn/http-versions-sources.ts`.

## Boundary

Objectives (observable, numbered):

1. After one lost carrier, point at the three response bodies on the HTTP/3 run and say that one is held and the other two are delivered.
2. Predict how many responses stay held, for that same loss, on HTTP/1.1, on HTTP/2, and on HTTP/3.
3. Say that a slow, lossy link favours HTTP/3 among these three, because the loss holds only the stream that was in the lost packet, and that this press is one connection.

In scope: three responses coming back, one lost carrier. The body's place (waiting, on the wire, held, delivered) is the mechanism. HTTP/1.1 is one ordered sequence on one connection. HTTP/2 is several streams on one TCP connection. HTTP/3 is one stream each. The same loss holds two, then three, then one.

Deferred: the HTTP message press and the resource exchange → http (`HttpExchange.tsx` is not redrawn). The two-body QUIC bench → udp-quic (`QuicStreams.tsx` is not copied). The packet that would carry the lost response again, and any retransmission timer → not drawn. Flow control, stream identifiers, header compression, server push, and the handshake → later. HTTP/1.1's extra connections, which clients often open so one long response does not block the next (RFC 9112 §9.4) → named and not drawn. Loss detection and the recovery algorithm → not read, so no timer is drawn.

Misconceptions targeted: a lost packet on HTTP/2 holds only the stream that was in it; HTTP/1.1 holds the response that was already ahead of the gap; a slow, lossy link favours HTTP/2 because its streams are independent; the three body shapes are the three versions.

## Concept decomposition

Mental models: three bodies leave a server press toward a client dock. Off the path, a body is held. In the dock, it is delivered. The carrier between them is one trough, one beam with a lock, or three rails.
Mechanisms: the middle carrier is lost while all three are still out. On one ordered connection the middle body and the latest body are held, and the earliest body keeps going. On one TCP connection every body is held. On independent streams only the middle body is held.
Temporal behaviour: each body leaves at its SEND tick. Until LOSS the three versions are the same picture. At LOSS the holds diverge. A body that is still allowed to finish arrives at SEND plus FLIGHT. A time between those ticks is the place `frameAt` returns, including a fractional `along` on the wire.
Quantitative relations: SEND, LOSS, and FLIGHT are assumed tick counts. No duration is taken from RFC 9112, RFC 9113, or RFC 9114. Which carrier is lost is assumed: the middle response. The end counts are 2, 3, and 1.
Failure scenarios: the lost carrier. HTTP/1.1 ends with the earliest delivered and the other two held. HTTP/2 ends with all three held. HTTP/3 ends with the middle held and the other two delivered.
Trade-offs: one response per body makes the hold visible. It hides a second byte of the lost response, a packet that carries more than one stream, and the frame or segment that would send the lost bytes again. One connection makes the HTTP/1.1 hold visible and hides the extra connections §9.4 describes.
Needs space or experiment: the three bodies have to be able to occupy a waiting pocket, the path, a hold fork, or the dock, and deleting a body has to remove the only record of whether that response is held.
Hardest: on one ordered connection the loss holds the later response and lets the earlier one finish — the same carrier, and the earliest body still reaches the dock (A1).
Hardest: several streams on one TCP connection still share that connection's loss — one lost packet holds every stream that was still on it, including the two the packet did not carry (A1).
Hardest: independent streams hold only the stream in the lost packet — the other two still arrive, which is why a slow, lossy link favours this mapping among the three (A1).

## Parts you'll meet

Response: one body. This run has three. The earliest leaves first, the middle is the lost carrier, and the latest leaves last.
Place: waiting, on the wire, held (off the path), or delivered (in the dock).
Lost carrier: the middle response, assumed. It is the only body with `lost` true.
Ordered connection: HTTP/1.1. Responses come back in request order on one connection, so the loss holds the responses after the gap.
Shared TCP connection: HTTP/2. Several streams ride one TCP connection, so one lost packet holds every stream still on it.
Independent streams: HTTP/3. One stream each. The loss holds only the stream that was in the lost packet.

## Storyboard

1. The learner sees one return press: a server, a carrier, three forks off the path, and a client dock. The question is what one lost carrier does to the other two responses.
2. On Learn, the HTTP/3 run plays. The middle body leaves the path and stays off it. The earliest and the latest reach the dock.
3. In the lab the learner chooses HTTP/1.1, HTTP/2, or HTTP/3, predicts how many responses stay held, and presses Run. The press stays still until then. Choosing a version changes the carrier: one trough, one locked beam, or three rails.
4. HTTP/1.1 ends with two bodies off the path and the earliest in the dock. HTTP/2 ends with all three off the path. HTTP/3 ends with one off the path and two in the dock.

## Asset plan

Objective coverage: 1 → A1 · 2 → A1 · 3 → A1

### A1. Three responses, one lost carrier

- objective: 1, 2, 3
- type: 3d
- object: a server press, a carrier, three hold forks, and a client dock; each body is one response, and its seat is that response's place
- render: anatomy-iso
- fidelity: place, along, lost, and the held count are computed by frameAt(); SEND, LOSS, FLIGHT, and which carrier is lost (the middle response) are assumed; one connection and three responses are scaled down from a page that may open more HTTP/1.1 connections (RFC 9112 §9.4); the hold is the stall, not a timed retransmission; nothing is faked as a packet capture
- pattern: step manipulate predict
- learner sees: a server, a carrier that depends on the version, three forks, a dock, and, once the run starts, three bodies
- animated: each body moves by a screen translate from its rest pose to the pose of its place at this time; on the wire the pose is `along` on that version's carrier; held is that body's fork; delivered is its seat in the dock
- learner does: on Learn, the HTTP/3 loss plays and can be stepped; in the lab, choose HTTP/1.1, HTTP/2, or HTTP/3, predict how many stay held, then run
- notice: the same loss holds two responses, or three, or one; the two that HTTP/3 still delivers are the ones a slow, lossy link keeps
- model: input version (`h1`, `h2`, or `h3`); state is frameAt(version, t) in src/lib/learn/http-versions-model.ts; the moving field is each body's place
- feedback: the line under the drawing is the event sentence plus the place of each response; the lab adds summary() and the prediction verdict when the run has finished
- assumptions: three bodies, one response each, the middle carrier is the one lost, SEND LOSS and FLIGHT ticks, all three are still out when the carrier fails
- outcome: the learner can say how many stay held on each version, and that a slow, lossy link favours HTTP/3 among these three
- accessibility: the step sentence is the text alternative; the drawing is aria-hidden; keyboard Previous and Next; reduced motion jumps from event to event; the lab draws no run until Run
- tests: src/lib/learn/http-versions-model.test.ts for the three endings, the shared picture before the loss, the wire fraction, the lost body, and the event places
- evidence: rfc9114 §1.1, §1.2, §2, §6, read; rfc9112 §2.1, §6, §9, §9.1, §9.2, §9.3, §9.3.2, §9.4, read; rfc9113 §1, §2, §5, §9.1, read
- built: `src/components/learn/http-versions/VersionHold.tsx`, `src/lib/learn/http-versions-model.ts`, `src/lib/learn/http-versions-model.test.ts`, `src/app/learn/http-versions/page.tsx`

## Animation sense

### A1. Animation sense

- Mechanism: three responses come back on one lost carrier; HTTP/1.1 holds the later responses, HTTP/2 holds every stream still on the TCP connection, and HTTP/3 holds only the stream that was in the lost packet.
- Moving quantity: the three response bodies.
- Model field: each body's place. Place is waiting, wire, held, or delivered. While place is wire, `along` is the fraction of that crossing (ticks on the wire divided by FLIGHT).
- Learner predicts: how many responses stay held.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): rfc9112, via: read, 2026-10-29, §2, §2.1, §2.2 (opening), §2.3, §6, §6.1 (opening), §8, §9, §9.1, §9.2, §9.3, §9.3.1, §9.3.2, §9.4, §9.5 (opening); rfc9113, via: read, 2026-10-29, §1, §2, §2.1 (opening), §5 (opening), §5.1 (opening), §8 (opening), §8.1 (opening), §9, §9.1, §9.1.1, §9.2 (opening); rfc9114, via: read, 2026-10-29, §1, §1.1, §1.2, §2, §6, §6.1, §6.2 (opening). RFC 9000 was not re-read and is not cited.

## Explanation (14 questions)

1. Problem: three responses have to come back, and one carrier on the way is lost. The client needs the other responses to keep moving.
2. Why it matters: a page asks for more than one response. On a slow, lossy link, a loss that holds every later response, or every stream on the connection, is the difference between one missing piece and a stalled page.
3. What would a beginner try first? One ordered sequence on one connection, and then several streams on that same TCP connection, expecting the streams to save the other responses.
4. Why does that work at first? One sequence is enough when nothing is lost. Streams on one TCP connection do keep a merely stalled response from blocking the others.
5. When does it fail? One carrier is lost. On the ordered connection the later response is held. On the shared TCP connection every stream that was still on it is held, including streams the lost packet did not carry.
6. What do we observe more carefully? The same loss, with each response on its own stream: the middle body stays held, and the other two are delivered.
7. What is the real mechanism? HTTP/1.1 presumes in-order delivery of responses and pairs each response with the next unfinished request (RFC 9112 §9, §9.2). Pipelined responses are sent in request order (§9.3.2). A response can carry a message body, and reusing the connection means reading that whole body (§6, §9.3). HTTP/2 runs over TCP and gives each exchange its own stream, interleaved on one connection (RFC 9113 §2, §5). A stalled response does not by itself stop the other streams (§2), and TCP head-of-line blocking is not addressed (§1). Because that multiplexing is invisible to TCP's loss recovery, a lost packet stalls every active transaction whether or not it was in the packet (RFC 9114 §1.1). HTTP/3 maps each request and response to one QUIC stream. The streams are independent, so packet loss on one does not stop the others (RFC 9114 §2). A QUIC stream is ordered on its own bytes and makes no order guarantee against another stream (§6). HTTP/3 relies on QUIC for reliable, in-order, per-stream delivery (§1.2).
8. What can the learner change and watch? The version: HTTP/1.1, HTTP/2, or HTTP/3. The lost carrier, the tick counts, and the three bodies stay fixed.
9. What alternatives exist? One ordered connection. Several streams on one TCP connection. One QUIC stream each. Several HTTP/1.1 connections, which §9.4 says are the usual way to avoid one request blocking the next, and which this press does not draw.
10. What are the trade-offs? One ordered connection is simple and holds every response after a gap. One TCP connection carries many streams and then a single loss holds all of them. Independent streams keep the other responses moving and move the loss recovery down to the stream.
11. When should you choose it? When several responses share a slow, lossy path and a loss in one of them must not hold the others. Among these three mappings, that is HTTP/3.
12. When should you not treat this picture as the whole protocol? When you need the retransmission, the handshake, a second byte of the lost response, header compression, or the extra HTTP/1.1 connections a client often opens. Those are specified elsewhere and are not running here. The HTTP chapter already showed one request and one response; this picture does not draw that press again. The QUIC chapter already showed two streams and one lost packet; this picture does not draw that bench again.
13. Explain it in your own words. The run has finished. How many bodies are held, how many are delivered, and which version did you run?
14. Where else does this apply? A page that fetches three files on a lossy link, where a missing piece of the middle file must not stop the other two from being written out. It stops being the same when all three files' bytes were placed in the one packet that was lost, or when the client opened a separate HTTP/1.1 connection for each file.

## Worked example

Learn, locked by `LEARN_VERSION`: `h3`. Assumed values: SEND = 0, 2, and 4 ticks, LOSS = 5 ticks, FLIGHT = 8 ticks, end = 4 + 8 = 12 ticks. The lost carrier is the middle response. Until tick 5 the other two versions match this picture.

- At t = 0 the earliest body is on the wire, along = 0. The other two are waiting.
- At t = 2 the middle body is on the wire, along = 0. The earliest body is on the wire, along = 2/8 = 0.25.
- At t = 4 the latest body is on the wire, along = 0. The earliest body is along 0.5. The middle body is along (4 − 2) / 8 = 0.25.
- At t = 4.9 all three are still on the wire, on every version. `held` is 0.
- At t = 5 the middle body is held, along = (5 − 2) / 8 = 0.375. On HTTP/3 the other two stay on the wire: earliest along 5/8 = 0.625, latest along (5 − 4) / 8 = 0.125.
- At t = 8 the earliest body is delivered. The latest body is on the wire, along = (8 − 4) / 8 = 0.5. The middle body is still held.
- At t = 12 the latest body is delivered. The middle body is still held. `heldCount` is 1. `lossyLinkFavours` is `h3`.

The other inputs, at the same loss:

- HTTP/1.1 at t = 5: the earliest body is still on the wire, along = 0.625. The middle and the latest are held. At t = 8 the earliest body is delivered. `heldCount` is 2. The end is tick 8.
- HTTP/2 at t = 5: all three are held, along 0.625, 0.375, and 0.125. None is delivered. `heldCount` is 3. The end is tick 5.

## Visual

One return press. Feet, screws, a base, a blank nameplate, and a ruler strip. The server is a housing with cheeks, a back plate, a bed, three pockets, a knob, and a pin. The client is a dock with three seats, a riser, and two rods. Three forks sit off the path. The carrier is the version: HTTP/1.1 is one trough with a rail and two links; HTTP/2 is one beam with a lock across it; HTTP/3 is three rails, each with its own shoe. The three bodies are an open cartridge, a solid block, and a block with a rib. Words stay in the step line. The caption names places and counts. It does not say what a shape means.

## Practice

Retrieval questions (answer, and why the wrong reading fails):

1. Two bodies are in the dock and one is off the path. Right: HTTP/3, because a loss holds the stream that suffered it and the others still arrive (RFC 9114 §2). A slow, lossy link favours that mapping among these three. Wrong: "every active transaction stalls" is the shared TCP connection (RFC 9114 §1.1), the run where all three stay off the path.
2. All three bodies are off the path. Right: they share one TCP connection, and a lost packet stalls every active transaction on it (RFC 9113 §2, RFC 9114 §1.1). Wrong: "only the middle one was in the packet, so only the middle one waits" is the independent-stream rule, not this ending.
3. The earliest body is in the dock and the other two are off the path. Right: one HTTP/1.1 connection delivers responses in order, so the latest stays held while the middle one is unfinished (RFC 9112 §9.2, §9.3.2). The earliest one was ahead of the gap, so it still arrives. Wrong: "the latest packet was the one that was lost" contradicts the assumed lost carrier, which is the middle response in every version.

Exercise: run all three versions. Say the place of each body at the end, and say which version held the fewest.
Spaced review: a later chapter that places several files on one lossy path can ask which mapping still delivers the files that were not in the lost packet. The QUIC chapter's two-stream question is not asked again here.

## Tabs

- Learn: the HTTP/3 loss, watched, and the rule that a lost packet holds only the stream that was in it. This tab does not ask for a prediction and does not offer the other two versions.
- Lab: the learner chooses HTTP/1.1, HTTP/2, or HTTP/3, predicts how many responses stay held, and presses Run. The press stays still until then. This tab does not restate the HTTP/3 stream paragraph.
- Quiz: three questions, answers inside `<details>`. This tab does not repeat the Learn caption or the Lab readout.

## Sources

- id: rfc9114
  title: HTTP/3 (RFC 9114)
  author: Bishop (ed.)
  url: https://www.rfc-editor.org/rfc/rfc9114
  kind: spec
  published: 2022-06
  checked: 2026-10-29
  via: read
  supports: [HTTP/3 maps HTTP semantics over QUIC (§1, §1.2); HTTP/2's multiplexing is not visible to TCP's loss recovery, so a lost or reordered packet stalls every active transaction whether or not that transaction was in the packet (§1.1); HTTP/3 relies on QUIC for reliable, in-order, per-stream delivery (§1.2); each request-response pair consumes a single QUIC stream, and streams are independent, so one stream that is blocked or suffers packet loss does not prevent progress on other streams (§2); a QUIC stream provides reliable in-order delivery of its own bytes and makes no order guarantee against bytes on other streams; HTTP does no separate multiplexing on top of QUIC, and data on a QUIC stream maps to one HTTP transaction or to the whole connection (§6); client-initiated bidirectional streams carry the requests and responses (§6.1)]
  note: Read from rfc-editor.org/rfc/rfc9114.txt on 2026-10-29. Sections actually read: the header and abstract, §1, §1.1, §1.2, §2 through the QPACK paragraph, §6, §6.1, §6.2 (opening sentence on stream type). RFC 9000 was not opened again. §2 and §6 point at RFC 9000 for QUIC streams; the sentences cited here are the ones this document states. No duration and no identity of the lost packet were taken from this document.

- id: rfc9112
  title: HTTP/1.1 (RFC 9112)
  author: Fielding, Nottingham, Reschke (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9112
  kind: spec
  published: 2022-06
  checked: 2026-10-29
  via: read
  supports: [an HTTP/1.1 message is a request or a response and may carry a message body (§2.1, §6); HTTP presumes a reliable transport with in-order delivery of responses (§9); each HTTP connection maps to one underlying transport connection (§9.1); with no request identifier, response order on a connection matches request order, and the client associates each response with the first outstanding request that has no final response (§9.2); a persistent connection carries multiple requests and responses, and a client that reuses it reads the entire response message body (§9.3); a server sends pipelined responses in the order the requests were received (§9.3.2); multiple connections are typically used so one long response does not block later requests on the same connection (§9.4)]
  note: Read from rfc-editor.org/rfc/rfc9112.txt on 2026-10-29. Sections actually read: the header and abstract, §2, §2.1, §2.2 through the US-ASCII parsing paragraph, §2.3, §6, §6.1 through the MIME comparison, §8, §9, §9.1, §9.2, §9.3, §9.3.1, §9.3.2, §9.4, §9.5 through the timeout paragraph. The incomplete-message rules in §8 are not what this picture runs. No duration and no identity of the lost carrier were taken from this document.

- id: rfc9113
  title: HTTP/2 (RFC 9113)
  author: Thomson, Benfield (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9113
  kind: spec
  published: 2022-06
  checked: 2026-10-29
  via: read
  supports: [HTTP/1.1 pipelining still has application-layer head-of-line blocking, and TCP head-of-line blocking is not addressed by HTTP/2 (§1); HTTP/2 runs over a TCP connection; each request-response exchange has its own stream; streams are largely independent, so a blocked or stalled response does not prevent progress on other streams (§2); one connection can contain multiple concurrently open streams, and their frames are interleaved (§5); a server sends the response on the request's stream (§8.1); clients SHOULD NOT open more than one HTTP/2 connection to a given host and port pair, and the connection is persistent (§9.1)]
  note: Read from rfc-editor.org/rfc/rfc9113.txt on 2026-10-29. Sections actually read: the header and abstract, §1, §2, §2.1 (opening), §5 through the stream characteristic bullets, §5.1 opening and the start of the state figure, §8 opening, §8.1 through the rule that other frames must not occur between a HEADERS frame and its CONTINUATION frames, §9, §9.1, §9.1.1, §9.2 (the TLS version sentence). The stall of every active transaction on a lost packet is cited from RFC 9114 §1.1, which was read, not invented from this document's §2. §2's independence is the case of a stalled response, and the page says so. No duration and no identity of the lost packet were taken from this document.

## Open questions / unverified

- RFC 9000 was not re-read for this chapter. Stream facts are cited only where RFC 9114 states them.
- RFC 9002 (loss detection) was not read. The picture does not time a retransmission. SEND, LOSS, and FLIGHT are assumptions. Which carrier is lost — the middle response — is an assumption.
- The sources page does not yet list this chapter. `src/content/learn/source-catalog.ts` was left unchanged on purpose. The chapter links to `/learn/sources#http-versions` anyway.
- `CURRICULUM.md` and `COURSE_STATE.md` were left unchanged on purpose. Another unit owns those files.

## Evidence

- model tests: pass — `npx vitest run src/lib/learn/http-versions-model.test.ts` (13 tests, 2026-10-29)
- eslint: pass — `npx eslint` on the five new TypeScript files (2026-10-29)
- tsc: `npx tsc --noEmit` reported no error naming these files (2026-10-29). Errors that name other chapters, and the repo's existing `.next` type failures, are not this chapter's.
- browser: not run — the unit was told not to use the browser
- animation sense: not run — the browser check was not run

## Review findings

Reviewer: not run — no fresh reviewer was started, and the browser was not opened.

- [note] animation check in the browser was not run → open
- [note] the sources catalog was not updated, so `/learn/sources#http-versions` has no section yet → open
