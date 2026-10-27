# Addresses, packets and ports

Id: ip-and-ports · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Standard: visual-first
Implementation: `src/app/learn/ip-and-ports/page.tsx`, `src/components/learn/ip-and-ports/*`,
`src/lib/learn/demux-model.ts`, `src/lib/learn/datagram-model.ts` (+ `.test.ts`),
`src/content/learn/ip-and-ports-sources.ts`.
Prerequisites: client-server · Related: dns, tcp, udp-quic, cloud-networking, load-balancing

## Boundary

Objectives (observable):

1. Given a packet's destination address, transport protocol and destination port, predict which program on a
   host receives it, or what comes back when none does (TCP reset, ICMP Port Unreachable, or nothing at all).
2. Explain why two connections from the same browser to the same server address and port stay separate (the
   source port; a TCP connection is identified by a pair of sockets).
3. Explain why IP packets can be lost, duplicated or arrive in a different order, and predict what an application
   reads in each case over UDP and over TCP, including the cost TCP's ordering adds.
4. Tell a name (what we seek) from an address (where it is: a machine's interface) from a port (which program on
   that machine), and say how long IPv4 and IPv6 addresses are.

In scope: IPv4/IPv6 addresses as interface identifiers (sizes only), the IP header fields the lookup uses
(destination address, protocol), ports and port ranges, sockets and the TCP connection pair, demultiplexing to a
process, what a host answers for an unused port, IP's lack of delivery guarantees, what UDP and TCP give an
application under loss, delay and duplication. One mechanism: how a packet finds its program, and what can
happen to packets on the way.

Deferred:

- How a name becomes an address → `dns`
- How TCP opens connections, acknowledges, times out and retransmits → `tcp`
- Why QUIC builds reliability on UDP; head-of-line blocking → `udp-quic`
- Subnets, routing tables, NAT, private address ranges, firewalls in depth → `cloud-networking`
- Several servers behind one address → `load-balancing`

Misconceptions targeted:

- "An IP address identifies a user / a request." (It identifies an interface; a request is far higher up.)
- "A port is a physical socket / a property of the cable."
- "Two tabs to the same site share one connection because the address and port are the same."
- "No reply means nothing is listening." (A firewall may drop silently.)
- "Packets travel in a neat line along one path and arrive in order."
- "TCP makes the network reliable." (It recovers in the end hosts, and pays for it in waiting.)

Hard to say in prose: a lookup that happens in stages (address, then protocol, then connection table, then
listener) — a step-through; the timing of arrivals against reads, where order and waiting are the point — a
timeline.

Estimated time: 20–25 minutes (assumption, not measured).

## Parts you'll meet

Interface: a machine's connection to a network; one machine can have several.
IP address: a number that identifies an interface (IPv4: 32 bits; IPv6: 128 bits).
Packet / IP datagram: one unit of data the network carries, with a header saying where it goes.
Protocol field: a number in the IP header naming the transport protocol inside (TCP, UDP, …).
Port: a 16-bit number that identifies a program's endpoint within a transport protocol on a host.
Socket: an address together with a port.
Connection (TCP): identified by a pair of sockets, local and remote.
Listening: a program has asked the host to accept new connections on a port.
Demultiplexing: the host's job of handing each arriving packet to the right program.

## Storyboard

1. **A1, the drawing (reads).** One server machine, drawn as a box with an address tab on its edge
   (203.0.113.10). Inside, two lanes, TCP and UDP; on them, port tabs (443, 8125) leading to process boxes (web
   server, metrics collector). A dimension line shows the address as 32 bits; a note gives IPv6 as 128 bits. A
   legend labels name → address → port → process, with "what / where / which program" beside each.
2. **A2, a packet arrives (predict).** The learner builds a packet: from which browser tab (source port 50001,
   50002, or a new tab 50003), to which address, protocol and destination port; and whether the host answers
   unused ports as the RFCs suggest or a firewall drops them. They predict where it goes from a list.
3. **A2, run, then step.** The drawing shows the packet tag with all five fields. Step 1 highlights the address
   tab (match or not); step 2 the protocol lane; step 3 the connection table (the two open connections, one row
   per source port) then the listener; step 4 the result and what goes back to the sender. Each step names its
   rule and source. The prediction is shown next to the result.
4. **A2, the contrast cases.** Tab 1 and tab 2 to TCP 443 land on different connection rows; a new tab lands on
   the listener; UDP 443 has nobody; with the firewall variant the sender hears nothing for both unused ports.
5. **A3, five datagrams (predict).** A sender transmits 1–5. The learner picks what the network does (nothing,
   lose 3, delay 2, duplicate 4) and the transport (UDP or TCP), and predicts what the application reads.
6. **A3, run.** A timeline with three rows: sent, arrived at the host, read by the application, ticks 0–14
   (assumed unit, not to scale). Lost packets end in ×; held segments are dashed from arrival to read. Readouts:
   the read order, how many reads, the tick of the last read.
7. **A3, compare.** The same network event under UDP and TCP: UDP reads fast but gaps, reorders or repeats; TCP
   reads all five in order but the reads after a gap wait.

## Asset plan

Objective coverage: 1 → A2 · 2 → A2 · 3 → A3 · 4 → A1

### A1. Name, address, port, process

- objective: 4
- type: precision-2d
- learner sees: one host box with its address tab, TCP and UDP lanes, port tabs and process boxes; a bit-length dimension line (32 bits IPv4; note: 128 bits IPv6); a legend mapping name → address → port → process to "what we seek / where it is / which program"
- learner does: reads; the drawing is the reference A2 animates
- model: conceptual illustration: structure shared by every host (an address names an interface; a port within a protocol names a program's endpoint); no quantities beyond the standard bit lengths
- assumptions: one interface and one address per host (real hosts may have several); the example ports 8125 and the process names are assumed; 443 is the default for https (RFC 9110 §4.2.2); guards "an address identifies a user" and "a port is hardware"
- outcome: the learner can say which part answers what / where / which program, and the address sizes
- accessibility: drawing aria-hidden; the same content in the caption and a definition list; text 12 px+ at 375 px; no colour
- tests: browser: figure present, labelled, no overflow at the six sizes; axe clean
- evidence: rfc791 §2.3 names/addresses/routes and §3.1 32-bit addresses (standard-defined); rfc4291 §2 128-bit identifiers for interfaces (standard-defined); rfc9293 §4 socket (standard-defined); rfc5737 §3 documentation addresses (standard-defined); rfc9110 §4.2.2 https default port 443 (standard-defined); 8125 and process names (illustrative)
- built: `src/components/learn/ip-and-ports/HostDrawing.tsx`

### A2. Which program gets this packet?

- objective: 1, 2
- type: simulation
- learner sees: client host (198.51.100.7, three tabs with source ports), the packet tag (protocol, source address:port → destination address:port), the server host with its connection table and listeners, a second host (192.0.2.20); after Run, the path highlighted step by step and a result panel (receiver, what the sender gets back, the rule)
- learner does: picks source tab, destination address, protocol, destination port, and the unused-port behaviour; predicts the outcome; runs; steps through four stages
- model: pure function `demux(packet) → { outcome, receiver, reply, steps }` over a fixed host table: TCP listener 443 (web server), UDP 8125 (metrics collector), two TCP connections 203.0.113.10:443 ↔ 198.51.100.7:50001 and :50002. Rules in order: destination address ≠ this host → never arrives here; protocol selects the transport; TCP: a connection whose (local, remote) sockets match the packet → that connection; else a listener on the port and a new-tab source → a new connection request to the listener; else no connection → reset (RFC behaviour) or nothing (firewall); UDP: a socket bound to the port → that program, whatever the source port; else ICMP Port Unreachable (a SHOULD) or nothing (firewall)
- assumptions: the server runs exactly these programs; one address per host; no NAT, proxies or load balancers between; packets arrive intact; "new tab" packets are connection requests, tab 1/2 packets belong to their open connections; a host following the RFCs replies to an unused port (TCP must; UDP should), while many real hosts and firewalls drop silently instead, so silence proves nothing; guards "IP+port identifies a user", "two tabs share a connection", "no reply means nothing there"
- outcome: the learner predicts the receiver for any packet, and explains why tab 1 and tab 2 never mix (different source port, so a different socket pair)
- accessibility: radio groups with legends; Run and step buttons; one polite live region for the run summary and one for step changes; prediction feedback in text; drawing aria-hidden with a text equivalent (step list); reduced motion: nothing animates (heavy stroke marks the current step)
- tests: model: every combination of inputs (3 × 2 × 2 × 3 × 2 = 72) has exactly one outcome; tab 1 and tab 2 to TCP 443 reach different connections; UDP ignores source port; unused TCP port → reset or silence by variant; unused UDP port → ICMP or silence; other address never reaches the host; steps stop at the deciding stage; leak: the outcome text is absent before Run and cleared when an input changes
- evidence: rfc791 §3.1 destination address and protocol fields (standard-defined); rfc9293 §2.2 ports identify services and multiplex flows, §3.4.1 a connection is defined by a pair of sockets, §3.5.2 reset for a segment to a non-existent connection, §3.9.1.1 passive open/listen (standard-defined); rfc768 Fields destination port within a destination address, source port optional (standard-defined); rfc1122 §4.1.3.1 UDP SHOULD send ICMP Port Unreachable (standard-defined); rfc6335 §6 dynamic ports 49152–65535 for the tabs (standard-defined); firewalls dropping silently (heuristic, labelled); host table (illustrative)
- built: `src/lib/learn/demux-model.ts`, `src/lib/learn/demux-model.test.ts`, `src/components/learn/ip-and-ports/DemuxLab.tsx`

### A3. Five datagrams on the way

- objective: 3
- type: simulation
- learner sees: a timeline (ticks 0–14, labelled "assumed unit, not to scale") with rows sent / arrived / read; numbered tags; × for a loss; dashed holds where TCP waits; readouts: read order, number of reads, last read tick
- learner does: picks the network event (none, lose 3, delay 2, duplicate 4) and the transport (UDP, TCP); predicts what the application reads (all in order / all but out of order / one missing / one twice); runs; switches transport to compare
- model: deterministic discrete time. Datagram i (1–5) sent at tick i−1, arrives 2 ticks later. Lose 3: the first copy never arrives; TCP resends it 6 ticks after the first send (assumed fixed wait). Delay 2: 4 extra ticks. Duplicate 4: a second copy arrives 2 ticks after the first. UDP: the application reads each copy when it arrives. TCP: reads segment k at max(its first arrival, the read of k−1); a later copy of data already received is discarded
- assumptions: one event per run; the network never corrupts data; TCP's real retransmission timing adapts and its acknowledgements, windows and connection set-up are left to the tcp chapter; "segment" and "datagram" counted the same way for comparison; guards "TCP makes the network reliable", "packets arrive in order", "the animation speed is the network's speed" (ticks are not to scale)
- outcome: the learner predicts UDP's and TCP's reads for each event and explains that TCP's ordering makes later data wait for a missing piece
- accessibility: radio groups; Run; the timeline aria-hidden with the same events as an ordered list; one polite live region for the summary; reduced motion: static drawing
- tests: model: conservation (every sent datagram is read, lost, or discarded as a duplicate); TCP always reads 1–5 once each in order; UDP reads = arrivals in arrival order; the quoted numbers (UDP lose 3 → reads 1 2 4 5, last read tick 6; TCP lose 3 → last read tick 10; UDP delay 2 → 1 3 4 5 2; UDP duplicate 4 → 1 2 3 4 5 4); determinism; categories match the prediction choices; leak: no read order shown before Run
- evidence: rfc791 §1.2 and §1.4 no reliability, sequencing or retransmission in IP (standard-defined); rfc768 Introduction delivery and duplicate protection not guaranteed (standard-defined); rfc8085 §3.3 UDP: no retransmission, duplicates, reordering and its causes (standard-defined, BCP); rfc9293 §2.2 reliable in-order byte stream via sequence numbers and retransmission, §3.4 duplicate detection (standard-defined); tick timings (illustrative)
- built: `src/lib/learn/datagram-model.ts`, `src/lib/learn/datagram-model.test.ts`, `src/components/learn/ip-and-ports/DatagramLab.tsx`

## Explanation (14 questions)

1. Problem: a server machine runs several programs; a packet arrives. Which one gets it, and what if packets go
   missing or arrive in the wrong order? (Storyboard 1–2.)
2. Why it matters: every request from chapter 2 rides on this; a wrong mental model makes "connection refused",
   timeouts and duplicate messages mysterious.
3. Beginner's first try: "the address finds the computer, and that's enough"; "packets arrive like letters, in
   order".
4. Why it works at first: one program per machine and a quiet network hide both problems.
5. When it fails: two programs on one machine, two tabs to one server, an unused port, and any real network
   (A2 contrast cases; A3 events).
6. Observe carefully: the packet carries five things (protocol, two addresses, two ports); the host looks at them
   in stages (A2 steps).
7. Mechanism: address → host interface; protocol field → transport; TCP: socket pair → connection, else
   listener; UDP: port → program. IP delivers best effort only; UDP passes that through; TCP numbers bytes and
   resends and reorders in the end hosts (A2, A3).
8. Learner changes and watches: source tab, destination address, protocol, port, unused-port behaviour (A2);
   network event, transport (A3).
9. Alternatives: UDP (messages, no ordering or recovery) vs TCP (ordered stream, recovery); application-level
   recovery on UDP (deferred to udp-quic).
10. Trade-offs: TCP's order costs waiting after a gap (A3 last-read tick); UDP is quicker but the application must
    handle gaps, order and repeats.
11. Choose TCP when the application needs every byte in order and can wait; UDP when late data is useless or the
    application has its own recovery (judgement).
12. Don't reach for UDP "for speed" without a plan for loss, duplicates and order (RFC 8085 §3.3 asks
    applications to handle them).
13. Own words: "Explain to a friend why two tabs on the same site never receive each other's data."
14. Transfer: a database server listening on one port with many client connections; a load balancer that
    tracks flows by the same five fields (load-balancing).

## Worked example

Trace "UDP from tab 1 to 203.0.113.10 port 443, host follows the RFCs": (1) address matches this host; (2)
protocol field says UDP; (3) no UDP socket on 443 (the web server listens on TCP 443 only); (4) nobody receives
it; the host should send ICMP Port Unreachable back. Fading: the exercise gives a new host table and asks the
learner to complete steps 3–4.

## Visual

Decision: three assets carry the chapter: a precision drawing for the vocabulary (A1), a step-through
demultiplexing simulation for objectives 1–2 (A2) and a deterministic timeline for objective 3 (A3). 2D only:
nothing here is spatial in depth; 3D would hide labels and cost JS.

## Practice

Retrieval questions (with answers in the page):

- Q1 (recall): Which field tells the host to hand the packet to TCP rather than UDP? → the protocol field of the
  IP header. Wrong: "the port" (ports are inside TCP/UDP and mean nothing until the protocol is known).
- Q2 (predict): Tab 2 sends TCP to 203.0.113.10:443. Which connection receives it? → the one whose remote socket
  is 198.51.100.7:50002. Wrong: "the web server's listener" (the listener only takes new connections).
- Q3 (predict): Datagram 3 of 5 is lost, over TCP. What does the application read, and what does it cost? → 1–5
  in order; 4 and 5 wait until 3 is resent. Wrong: "1 2 4 5" (that is UDP).

Exercise (apply): a host has TCP 5432 (database) listening and one connection from 198.51.100.7:50010, and UDP
514 (log collector, assumed). Predict three packets' fates, then check the answers.

Spaced review: `tcp` re-asks Q3 with real retransmission timing; `load-balancing` re-asks Q2 as "which backend
gets this flow".

## Sources

- id: rfc791
  title: Internet Protocol (RFC 791, STD 5)
  author: J. Postel (ed.)
  url: https://www.rfc-editor.org/rfc/rfc791
  kind: spec
  published: 1981-09
  checked: 2026-10-27
  via: read
  supports: [names, addresses and routes are distinct: a name is what we seek, an address where it is (§2.3); IP delivers datagrams from source to destination with no mechanisms for end-to-end reliability, flow control or sequencing (§1.2); no acknowledgements, no retransmissions, no flow control (§1.4); the header carries source and destination addresses (32 bits each in IPv4) and a protocol field naming the next-level protocol, and a time to live (§3.1)]
  note: >-
    Published text from the Ubuntu noble doc-rfc 20230121 package (rfc791.txt; metadata: Internet Standard, not
    obsoleted, updated by RFC 1349, 2474, 6864 as of that snapshot). rfc-editor.org is unreachable from this
    container, so the status is as of the package snapshot (January 2023).
- id: rfc4291
  title: IP Version 6 Addressing Architecture (RFC 4291)
  author: R. Hinden, S. Deering
  url: https://www.rfc-editor.org/rfc/rfc4291
  kind: spec
  published: 2006-02
  checked: 2026-10-27
  via: read
  supports: [IPv6 addresses are 128-bit identifiers for interfaces and sets of interfaces (§2)]
  note: doc-rfc 20230121 package text; updated by RFC 5952, 6052, 7136, 7346, 7371, 8064 (none changes the size).
- id: rfc9293
  title: Transmission Control Protocol (TCP) (RFC 9293, STD 7)
  author: W. Eddy (ed.)
  url: https://www.rfc-editor.org/rfc/rfc9293
  kind: spec
  published: 2022-08
  checked: 2026-10-27
  via: read
  supports: [TCP provides a reliable, in-order byte stream; reliability is detecting losses via sequence numbers and errors via checksums, and correcting by retransmission; each segment is sent as an IP datagram; ports identify application services and multiplex flows between hosts (§2.2); every octet has a sequence number, allowing duplicate detection (§3.4); a connection is defined by a pair of sockets (§3.4.1); if the connection does not exist a reset is sent in response to any incoming segment except another reset (§3.5.2); a passive OPEN waits for incoming connections (§3.9.1.1); socket = an Internet address with a TCP port (§4)]
  note: doc-rfc 20230121 package text; Internet Standard, obsoletes RFC 793; not obsoleted as of that snapshot.
- id: rfc768
  title: User Datagram Protocol (RFC 768, STD 6)
  author: J. Postel
  url: https://www.rfc-editor.org/rfc/rfc768
  kind: spec
  published: 1980-08
  checked: 2026-10-27
  via: read
  supports: [UDP lets programs send messages with minimal mechanism; delivery and duplicate protection are not guaranteed; ordered reliable streams should use TCP (Introduction); the source port is optional; the destination port has meaning within a destination address (Fields)]
  note: doc-rfc 20230121 package text. RFC 768 has no numbered sections; cited by heading.
- id: rfc1122
  title: Requirements for Internet Hosts — Communication Layers (RFC 1122, STD 3)
  author: R. Braden (ed.)
  url: https://www.rfc-editor.org/rfc/rfc1122
  kind: spec
  published: 1989-10
  checked: 2026-10-27
  via: read
  supports: [if a datagram arrives for a UDP port with no pending listen, UDP SHOULD send ICMP Port Unreachable (§4.1.3.1); Port Unreachable is used when the transport cannot demultiplex the datagram; TCP has its own mechanism (RST) (§3.2.2.1)]
  note: doc-rfc 20230121 package text; updated by several RFCs including RFC 9293 (TCP parts), none of which changes §4.1.3.1 in the package text.
- id: rfc8085
  title: UDP Usage Guidelines (RFC 8085, BCP 145)
  author: L. Eggert, G. Fairhurst, G. Shepherd
  url: https://www.rfc-editor.org/rfc/rfc8085
  kind: spec
  published: 2017-03
  checked: 2026-10-27
  via: read
  supports: [UDP does not retransmit lost packets; applications needing reliability must implement it; UDP does not protect against duplication; applications needing order must restore it; the Internet can delay some packets relative to others (routing transients, intermittent connectivity, mobility), causing reordering; ECMP load balancing can reorder across sessions; no well-defined upper bound on reordering delay (§3.3)]
  note: doc-rfc 20230121 package text (best-current-practice); obsoletes RFC 5405.
- id: rfc6335
  title: IANA Procedures for the Management of the Service Name and Transport Protocol Port Number Registry (RFC 6335, BCP 165)
  author: M. Cotton, L. Eggert, J. Touch, M. Westerlund, S. Cheshire
  url: https://www.rfc-editor.org/rfc/rfc6335
  kind: spec
  published: 2011-08
  checked: 2026-10-27
  via: read
  supports: [port ranges: System Ports 0–1023, User Ports 1024–49151, Dynamic (ephemeral) Ports 49152–65535, never assigned (§6)]
  note: doc-rfc 20230121 package text.
- id: rfc5737
  title: IPv4 Address Blocks Reserved for Documentation (RFC 5737)
  author: J. Arkko, M. Cotton, L. Vegoda
  url: https://www.rfc-editor.org/rfc/rfc5737
  kind: spec
  published: 2010-01
  checked: 2026-10-27
  via: read
  supports: [192.0.2.0/24, 198.51.100.0/24 and 203.0.113.0/24 are for documentation (§3)]
  note: doc-rfc 20230121 package text; every address in the chapter is from these blocks.
- id: rfc9110
  title: HTTP Semantics (RFC 9110, STD 97)
  author: Fielding, Nottingham, Reschke (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9110
  kind: spec
  published: 2022-06
  checked: 2026-10-27
  via: read
  supports: [the https scheme's default port is TCP 443 (§4.2.2)]
  note: the HTTP WG rendering read for web-request and client-server (httpwg/httpwg.github.io @ ce03dd5); §4.2.2 re-read 2026-10-27 ("If the port subcomponent is empty or not given, TCP port 443 … is the default").

## Open questions / unverified

- Real screen-reader test not run (no screen reader in the authoring environment). The manual items for this
  chapter are in `SCREEN_READER_CHECKLIST.md`; run them on VoiceOver or NVDA.
- Every RFC's status is as of the doc-rfc package snapshot (January 2023); rfc-editor.org and Datatracker are
  unreachable from this container. Re-check before the chapter is released.

## Evidence

All on the production build of the working tree after 904d678 (the commit that carries this evidence), 2026-10-27.

- model tests: pass — npx vitest run: 191/191 (demux-model 15: all 72 packets have one outcome, stage order, two tabs → two connections, UDP ignores source port, unused-port replies by variant, misconception guards; datagram-model 13: conservation, TCP in order, UDP = arrivals, every number the page quotes) (2026-10-27)
- typecheck: pass — npx tsc --noEmit (2026-10-27)
- lint and format: pass — npm run lint; npx eslint tests/browser (0 errors); prettier --check src docs tests (2026-10-27)
- browser suite: pass — tests/browser/ip-and-ports.cjs 55/55: six sizes without horizontal scroll and without console errors, axe WCAG 2.2 A/AA at 375 and 1280 on load and after runs, answer-leak checks before Run and after a change, nine demux cases and seven datagram cases against the model, prediction verdicts, step announcements and focus at the last step, keyboard-only run, reduced motion, links from /learn and chapter 2, sitemap, / renders (2026-10-27)
- regression suites: pass — web-request 69/69, client-server 48/48 (both pages now use the shared Question component) (2026-10-27)
- JS budget: pass — tests/browser/js-budget.cjs: /learn/ip-and-ports 115.3 kB, / 115.6 kB, all five routes ≤ 120 kB; next build reports 113 kB first-load for the chapter and / unchanged at 110 kB (2026-10-27)
- lighthouse: pass — Lighthouse 12.2.1, /learn/ip-and-ports mobile 91 (first run after a server start, TBT 310 ms), then 99 and 100; desktop 100; accessibility, best practices and SEO 100; CLS 0 (2026-10-27)
- screenshots read: pass — every figure at 375, 402, 768, 1280, 1440 and 1920 read by eye; label overflow in Fig. 2 and a cramped row label in Fig. 3 fixed before this run (2026-10-27)
- pre-commit audit: pass — npx fallow audit: no dead code; one duplication warning (the cite helper shared by the three chapter pages) (2026-10-27)
- course checks: pass — course.mjs check ok; course.test.mjs 29/29 (2026-10-27)

## Review findings
