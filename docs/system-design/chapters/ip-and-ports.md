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
2. Explain why two TCP connections from the same machine to the same server address and port stay separate (the
   source port; a connection is identified by a pair of sockets), and why that does not mean one connection per
   browser tab.
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
- "Two connections from one machine to one server port must get mixed up." (Different source ports, different
  socket pairs.)
- "Each browser tab has its own connection." (One connection can carry many requests, RFC 9112 §9.3; an HTTP/3
  client should avoid duplicate connections, RFC 9114 §3.3; telling tabs' requests apart is HTTP's job →
  `http-versions`.)
- "No reply means nothing is listening." (A firewall drops by rule, used port or not, before any lookup.)
- "Web servers never use UDP 443." (HTTP/3 runs over UDP, RFC 9114 §3.1; this model's server just doesn't
  offer it.)
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

1. **A1, the drawing (reads).** A name (www.example.com) with a dashed arrow, "name → address (DNS, chapter 4)",
   to one server machine, drawn as a box with an address tab on its edge (203.0.113.10, "32 bits, IPv6: 128").
   Inside, two lanes, TCP and UDP; on them, port tabs (443, 8125) leading to program boxes (web server, metrics
   collector) and an unused 9000. Beside it, a key: name = what we seek, address = where it is, TCP or UDP =
   which transport, port = which program.
2. **A2, a packet arrives (predict).** The learner builds a packet from client 198.51.100.7: source port 50001
   or 50002 (each with a TCP connection open to port 443) or 50003 (nothing open), destination address,
   protocol and port, and whether the server's firewall is on (rule: allow TCP 443 and UDP 8125). They predict
   where it goes from a list.
3. **A2, run, then step.** The drawing shows the packet tag with all five fields and an arrow to the machine the
   address names. Step by step, with the current step's text and Previous/Next right under the drawing: the
   address tab; the firewall band at the host's edge (when on); the protocol lane; the connection table (one
   row per source port), then the listening socket; the result and what goes back to the sender. Each step
   names its rule and source, or says it is a modelling choice. The prediction is shown next to the result.
4. **A2, the contrast cases.** 50001 and 50002 to TCP 443 land on different connection rows; 50003 lands on the
   listening socket, and TCP sets the new connection up; UDP 443 has nobody here; with the firewall on, TCP
   9000 and UDP 443 are dropped at the edge, before the protocol stage, and nothing comes back.
5. **A3, five datagrams (predict).** A sender transmits 1–5. The learner picks what the network does (nothing,
   lose 3, delay 2, duplicate 4) and the transport (UDP or TCP), and predicts what the application reads.
6. **A3, run.** A timeline with three rows: sent, arrived at the host, read by the application, ticks 0–14
   (assumed unit, not to scale). One line style per meaning, with a key in the figure: solid arrow sent and
   arrived, dashed arrow resent by TCP, dotted arrow a copy the network made (forked from the original, not sent
   again), × lost or thrown away, a bracket on the read row for waiting in the host. Readouts: the read order,
   how many reads, the tick of the last read.
7. **A3, compare.** The same network event under UDP and TCP: UDP reads fast but gaps, reorders or repeats; TCP
   reads all five in order but the reads after a gap wait.

## Asset plan

Objective coverage: 1 → A2 · 2 → A2 · 3 → A3 · 4 → A1

### A1. Name, address, port, process

- objective: 4
- type: precision-2d
- learner sees: a name tag (www.example.com) with a dashed arrow "name → address (DNS, chapter 4)" to one host box with its address tab (203.0.113.10; "32 bits, IPv6: 128"), TCP and UDP lanes, port tabs and program boxes, an unused port 9000; beside it a key: name = what we seek, address = where it is (which machine), TCP or UDP = which transport, port = which program
- learner does: reads; the drawing is the reference A2 animates
- model: conceptual illustration: structure shared by every host (an address names an interface; a port within a protocol names a program's endpoint); no quantities beyond the standard bit lengths
- assumptions: one interface and one address per host (real hosts may have several); the example ports 8125 and the process names are assumed; 443 is the default for https (RFC 9110 §4.2.2); guards "an address identifies a user" and "a port is hardware"
- outcome: the learner can say which part answers what / where / which program, and the address sizes
- accessibility: drawing aria-hidden; the same content in the caption and a definition list; text 12 px+ at 375 px; no colour
- tests: browser: figure present, labelled, no overflow at the six sizes; axe clean
- evidence: rfc791 §2.3 names/addresses/routes and §3.1 32-bit addresses (standard-defined); rfc4291 §2 128-bit identifiers for interfaces (standard-defined); rfc5737 §3 and rfc2606 §3 example addresses and names (standard-defined); rfc9110 §4.2.2 https default port 443 (standard-defined); rfc9114 §3.1 HTTP/3 runs over QUIC on UDP, so a server may use UDP 443 (standard-defined); 8125 and program names (illustrative)
- built: `src/components/learn/ip-and-ports/HostDrawing.tsx`

### A2. Which program gets this packet?

- objective: 1, 2
- type: simulation
- learner sees: the packet tag (protocol, 198.51.100.7:source port → destination address:port) with an arrow to the server or the other machine; the server host with a firewall band at its edge when on, its connection table and listening sockets; another host (192.0.2.20); after Run, the current step's text and Previous/Next under the drawing, the element that step reads drawn heavy, a result line (receiver, what the sender gets back, the verdict on the prediction) and the full list of steps
- learner does: picks the source port (50001 or 50002, each with a connection open to 443, or 50003 with nothing open), destination address, protocol, destination port and firewall on or off; predicts the outcome; runs; steps through the stages
- model: pure function `demux(packet) → { outcome, receiver, reply, steps }` over a fixed host: a TCP listening socket on 443 (web server), a UDP socket on 8125 (metrics collector), two TCP connections 203.0.113.10:443 ↔ 198.51.100.7:50001 and :50002, and a firewall rule (when on) allowing only TCP 443 and UDP 8125. Rules in order: destination address ≠ this host → never arrives here; firewall on and not allowed → dropped at the edge, nothing back; protocol field selects the transport; TCP: a connection whose socket pair matches → that connection; else a listening socket and a source with nothing open (the packet opens a connection) → TCP sets up a new connection for the listening socket; else → reset (RST); UDP: a socket on the port → that program, whatever the source port (an unconnected socket, a modelling choice); else → ICMP Port Unreachable (a SHOULD)
- assumptions: the server runs exactly these programs and has one address; no NAT, proxies or load balancers; packets arrive intact; packets from 50001/50002 belong to their open connections, packets from 50003 open one; the firewall rule is one typical configuration, not a standard, and rules can also drop ports in use; guards "IP+port identifies a user or a tab", "two connections from one machine get mixed up", "each tab has its own connection" (page text, RFC 9112 §9.3, RFC 9114 §3.3), "no reply means nothing there", "the program receives the opening packet" (TCP sets the connection up first), "web servers never use UDP 443" (Fig. 1 caption)
- outcome: the learner predicts the receiver for any packet, and explains why two connections from one machine never mix (different source port, so a different socket pair) and why that is not one connection per tab
- accessibility: radio groups with legends; Run and step buttons; one polite live region for the run summary and one for step changes; prediction feedback in text; drawing aria-hidden with a text equivalent (step list); reduced motion: nothing animates (heavy stroke marks the current step)
- tests: model: all 72 packets have one outcome and stages in order; 50001 and 50002 to TCP 443 reach different connections; 50003 → new connection set up by TCP; UDP ignores the source port and the rule is labelled a model choice; unused TCP port → reset, unused UDP port → ICMP (a SHOULD); the firewall drops before the protocol stage and changes nothing for allowed packets; every step cites a source or says "model:"; no step mentions users, requests or tabs. Browser: ten cases against the model, prediction verdicts, the current step under the drawing, step announcements, firewall stages, keyboard, a run at 375 px brings the drawing into view, leak checks before Run and after a change
- evidence: rfc791 §3.1 destination address and protocol fields (standard-defined); rfc9293 §2.2 ports identify services and multiplex flows, §3.4.1 a connection is defined by a pair of sockets, §3.5.2 reset for a segment to a non-existent connection, §3.9.1.1 passive open (standard-defined); rfc768 Introduction no acknowledgement (standard-defined); rfc1122 §4.1.3.1 UDP SHOULD send ICMP Port Unreachable (standard-defined); rfc6335 §6 dynamic ports 49152–65535 for the source ports (standard-defined); rfc9112 §9.3 and rfc9114 §3.3 connection reuse (standard-defined); UDP taking any source port (model choice, labelled); the firewall rule (illustrative configuration, labelled); host table (illustrative)
- built: `src/lib/learn/demux-model.ts`, `src/lib/learn/demux-model.test.ts`, `src/components/learn/ip-and-ports/DemuxLab.tsx`

### A3. Five datagrams on the way

- objective: 3
- type: simulation
- learner sees: a timeline (ticks 0–14, labelled "assumed unit, not to scale") with rows sent / arrived / read; numbered tags (copies arriving at the same tick stacked); a key with one line style per meaning (solid sent, dashed resent, dotted network copy, × lost or thrown away, bracket waiting); readouts: read order, number of reads, last read tick; the timeline as a list
- learner does: picks the network event (none, lose 3, delay 2, duplicate 4) and the transport (UDP, TCP); predicts what the application reads (all in order / all but out of order / one missing / one twice); runs; switches transport to compare
- model: deterministic discrete time. Datagram i (1–5) sent at tick i−1, arrives 2 ticks later. Lose 3: the first copy never arrives; TCP resends it 7 ticks after the first send (assumed fixed timer, longer than the delayed segment's round trip of 4 + 2 ticks, so a late segment is never resent). Delay 2: 2 extra ticks. Duplicate 4: the network makes a second copy that arrives 2 ticks after the first (not sent again). UDP: the application reads each copy when it arrives. TCP: reads segment k at max(its first arrival, the read of k−1); a later copy of data already received is discarded
- assumptions: one event per run; the network never corrupts data; TCP's real retransmission timer adapts and can resend a late segment, and its acknowledgements, windows and connection set-up are left to the tcp chapter (caption says so); "segment" and "datagram" counted the same way; guards "TCP makes the network reliable" (the loss still shows under TCP; text says TCP recovers in the end hosts), "packets arrive in order", "a duplicate means the sender sent twice" (dotted fork), "the animation speed is the network's speed" (ticks not to scale)
- outcome: the learner predicts UDP's and TCP's reads for each event and explains that TCP's ordering makes later data wait for a missing piece
- accessibility: radio groups; Run; the timeline aria-hidden with the same events as an ordered list; one polite live region for the summary; reduced motion: static drawing
- tests: model: conservation (every sent copy is read, lost or discarded); TCP always reads 1–5 once each in order; UDP reads = arrivals in arrival order; a late segment is never resent and its acknowledgement could return before the timer; a network duplicate has the original's send tick; the quoted numbers (UDP lose 3 → reads 1 2 4 5, last read tick 6; TCP lose 3 → resent at 9, last read tick 11; UDP delay 2 → 1 3 2 4 5; UDP duplicate 4 → 1 2 3 4 5 4); determinism; categories match the prediction choices. Browser: seven cases against the model, the duplicate drawn with five sent tags, a run at 375 px brings the timeline into view, leak checks
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
5. When it fails: two programs on one machine, two connections from one machine to one server, an unused port, a
   firewall, and any real network
   (A2 contrast cases; A3 events).
6. Observe carefully: the packet carries five things (protocol, two addresses, two ports); the host looks at them
   in stages (A2 steps).
7. Mechanism: address → host interface; protocol field → transport; TCP: socket pair → connection, else
   listener; UDP: port → program. IP delivers best effort only; UDP passes that through; TCP numbers bytes and
   resends and reorders in the end hosts (A2, A3).
8. Learner changes and watches: source port, destination address, protocol, port, firewall on/off (A2);
   network event, transport (A3).
9. Alternatives: UDP (messages, no ordering or recovery) vs TCP (ordered stream, recovery); application-level
   recovery on UDP (deferred to udp-quic).
10. Trade-offs: TCP's order costs waiting after a gap (A3 last-read tick); UDP is quicker but the application must
    handle gaps, order and repeats.
11. Choose TCP when the application needs every byte in order and can wait; UDP when late data is useless or the
    application has its own recovery (judgement).
12. Don't reach for UDP "for speed" without a plan for loss, duplicates and order (RFC 8085 §3.3 asks
    applications to handle them).
13. Own words: "Explain to a friend how a server keeps two connections from the same laptop apart, and why that
    does not mean each browser tab has its own connection."
14. Transfer: a database server listening on one port with many client connections; a load balancer that
    tracks flows by the same five fields (load-balancing).

## Worked example

Trace "UDP from 198.51.100.7:50001 to 203.0.113.10 port 443, firewall off": (1) address matches this host; (2)
protocol field says UDP; (3) no UDP socket on 443 (the web server listens on TCP 443 only; this server doesn't
offer HTTP/3); (4) nobody receives it; the host should send ICMP Port Unreachable back. Fading: the exercise gives
a new host table and asks the learner to work through the same stages for three packets.

## Visual

Decision: three assets carry the chapter: a precision drawing for the vocabulary (A1), a step-through
demultiplexing simulation for objectives 1–2 (A2) and a deterministic timeline for objective 3 (A3). 2D only:
nothing here is spatial in depth; 3D would hide labels and cost JS.

## Practice

Retrieval questions (with answers in the page):

- Q1 (recall): Which field tells the host to hand the packet to TCP rather than UDP? → the protocol field of the
  IP header. Wrong: "the port" (ports are inside TCP/UDP and mean nothing until the protocol is known).
- Q2 (predict): 198.51.100.7:50002 sends TCP to 203.0.113.10:443. Which connection receives it? → the one whose
  remote socket is 198.51.100.7:50002. Wrong: "the web server's listening socket" (it only takes new
  connections).
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
- id: rfc2606
  title: Reserved Top Level DNS Names (RFC 2606, BCP 32)
  author: D. Eastlake, A. Panitz
  url: https://www.rfc-editor.org/rfc/rfc2606
  kind: spec
  published: 1999-06
  checked: 2026-10-28
  via: read
  supports: [example.com, example.net and example.org are reserved for use as examples (§3)]
  note: doc-rfc 20230121 package text; updated by RFC 6761 as of that snapshot (the reservation stands).
- id: rfc9112
  title: HTTP/1.1 (RFC 9112, STD 99)
  author: Fielding, Nottingham, Reschke (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9112
  kind: spec
  published: 2022-06
  checked: 2026-10-28
  via: read
  supports: [HTTP/1.1 defaults to persistent connections, carrying multiple requests and responses over a single connection (§9.3)]
  note: doc-rfc 20230121 package text (rfc9112.txt).
- id: rfc9114
  title: HTTP/3 (RFC 9114)
  author: M. Bishop (ed.)
  url: https://www.rfc-editor.org/rfc/rfc9114
  kind: spec
  published: 2022-06
  checked: 2026-10-28
  via: read
  supports: [a client may reach an https resource by opening a QUIC connection to the address on the indicated port; servers may serve HTTP/3 on any UDP port; QUIC runs over UDP (§3.1); a client may open several HTTP/3 connections to one address and port but should avoid creating several with the same configuration (§3.3)]
  note: doc-rfc 20230121 package text; Proposed Standard, not obsoleted as of that snapshot. "UDP 443" for https is derived from §3.1 ("on the indicated port") with the https default port of RFC 9110 §4.2.2.
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

All on the production build of the working tree after 91bea9c with the review fixes (committed with this
evidence), 2026-10-28.

- model tests: pass — npx vitest run: 194/194 (demux-model 16: 72 packets one outcome each, stage order, two connections by source port, new connection set up by TCP, UDP rule labelled a model choice, reset/ICMP, firewall at the edge before the protocol stage, sources or "model:" on every step, no users/requests/tabs; datagram-model 18: conservation, TCP in order, UDP = arrivals, a late segment never resent, a network duplicate not sent again, every number the page quotes) (2026-10-28)
- typecheck: pass — npx tsc --noEmit (2026-10-28)
- lint and format: pass — npm run lint; npx eslint tests/browser (0 errors); prettier --check src docs tests README.md .claude/skills (2026-10-28)
- browser suite: pass — tests/browser/ip-and-ports.cjs 62/62: six sizes without horizontal scroll or console errors, axe WCAG 2.2 A/AA at 375 and 1280 on load and after runs, leak checks before Run and after a change, ten demux cases and seven datagram cases against the model, prediction verdicts, current step under the drawing, step announcements, firewall stages, duplicate drawn as a network copy, citations numbered top-down, the text's quoted numbers, keyboard, a run at 375 px brings each result into view, reduced motion, links from /learn and chapter 2, sitemap, / renders (2026-10-28)
- keyboard: pass — ip-and-ports.cjs: arrow keys move within radio groups, Enter on Run shows the result, focus outline on Run, Next keeps focus and is aria-disabled at the last step (2026-10-28)
- reduced motion: pass — ip-and-ports.cjs with reducedMotion reduce: nothing in the figures transitions or animates; the post-Run scroll jumps instead of gliding; steps and readouts complete (2026-10-28)
- regression suites: pass — web-request 69/69, client-server 48/48 (2026-10-28)
- JS budget: pass — tests/browser/js-budget.cjs: /learn/ip-and-ports 116.2 kB, / 115.6 kB, all five routes ≤ 120 kB; next build: the chapter 114 kB first-load, / unchanged at 110 kB (2026-10-28)
- lighthouse: pass — Lighthouse 12.2.1 on the final build: /learn/ip-and-ports mobile 100 and 99, desktop 100; accessibility, best practices and SEO 100; CLS 0. Before the review fixes: mobile 91 on the first run after a server start (TBT 310 ms), then 99 and 100 (2026-10-28)
- screenshots read: pass — every figure at 375, 402, 768, 1280, 1440 and 1920 read by eye after the fixes; overlapping arrival tags (delay 2) and the hidden "IPv6: 128" label found and fixed this round (2026-10-28)
- pre-commit audit: pass — npx fallow audit: no dead code, no complexity finding; one duplication warning (the cite helper shared by the three chapter pages) (2026-10-28)
- course checks: pass — course.mjs check ok (two legacy warnings: web-request, client-server); course.mjs skill ok; course.test.mjs 32/32 (2026-10-28)

## Review findings

Reviewer: fresh subagent (independent review of the upgraded skill and of the rendered pilot at 91bea9c: six viewport sizes, every control, keyboard, reduced motion, sources in the doc-rfc texts), 2026-10-28, rubric verification.md, visual-design.md, visual-science.md
Visual review: text-heavy=no · mechanism-via-visual=yes · every-visual-teaches=no · claims-defensible=no · interaction-helps=yes

- [blocking] "Two tabs → two connections, never each other's data" taught as fact; browsers reuse connections across tabs → fixed (sources are client source ports 50001/50002/50003, not tabs; objective 2, page text, Q2, own-words and misconceptions reworded; page says one connection can carry many requests, RFC 9112 §9.3, and an HTTP/3 client should avoid duplicate connections, RFC 9114 §3.3; model test: no step mentions tabs)
- [should-fix] Firewall acted after the transport lookup and only on unused ports, citing a reset rule → fixed (firewall is a rule at the host's edge, checked after the address and before the protocol, drawn as a band; drops whatever the rule says; labelled a configuration, not a standard; tests on stage order)
- [should-fix] Delay 2 contradicted the TCP timer (arrival at the resend time) → fixed (delay 2 ticks, timer 7 ticks, longer than the delayed round trip of 4 + 2; caption says real TCP can resend a late segment; test that a late segment is never resent; quoted numbers updated: TCP lose 3 last read tick 11, UDP delay 2 reads 1 3 2 4 5)
- [should-fix] A network duplicate drawn and listed as sent twice → fixed (dotted copy forked from the original arrow; no second sent tag; list says "made by the network"; model and browser tests)
- [should-fix] "Another machine" drew the packet arrow into this server's address → fixed (arrow runs down the right edge to the other machine)
- [should-fix] Step highlight off-screen while stepping; Run's result below the fold at 375 px → fixed (current step and Previous/Next directly under the drawing; after Run the drawing or timeline scrolls into view, jumping under reduced motion; browser tests at 375 px)
- [should-fix] A browser tab sending UDP with its TCP source port → fixed (sender is "client 198.51.100.7, source port …"; no tabs)
- [should-fix] UDP 443 presented as unused without caveat → fixed (Fig. 1 caption: this server offers nothing on UDP 443; a server that speaks HTTP/3 would, RFC 9114 §3.1; worked example says so)
- [should-fix] "The web server receives the opening packet of a new connection" → fixed (TCP on the server sets up the connection for the listening socket; the program gets it once it is set up; page and model reworded)
- [should-fix] Fig. 1 did not show "name" nor the what/where/which key → fixed (name tag www.example.com, RFC 2606 §3, dashed arrow "name → address (DNS, chapter 4)"; key beside the drawing)
- [should-fix] "× LOST" label crossed datagram 4's arrow → fixed (× at the end of the lost stub, no text across arrows; the key explains ×)
- [note] UDP "whatever the source port" cited RFC 768 Fields, which doesn't say it → fixed (labelled "model: an unconnected UDP socket")
- [note] Dead branch in the TCP reset text; 50001 to TCP 9000 contradicted the caption → fixed (lookup says "its open connection is to port 443, not 9000"; test)
- [note] Fig. 3 used dashed for three meanings and dash-dot baselines → fixed (one style per meaning, key in the figure, solid thin baselines)
- [note] Exercise (b) did not say whether the packet opens a connection; no faded version → fixed (question says it opens one; "work through the stages of Fig. 2"; answer firm)
- [note] Add that the network still loses packets under TCP → fixed (page text and Fig. 3 caption)
- [note] "waited 1 ticks"; the "14" tick label clipped; spec promised a drawn client host; Evidence named the wrong commit → fixed (plural; axis shortened; spec matches the build; this Evidence names the right base)
- [note] Fig. 2's step list is itself prose cards; the drawing changes only by a highlight → accepted: each step's text is one or two sentences tied to a highlighted element and the current step sits under the drawing; a packet animation would add motion without new information (visual-design.md, Motion)
- [note] One asset can cover every objective in `check` → accepted: structure only; reviewers judge coverage (verification.md, five questions)
