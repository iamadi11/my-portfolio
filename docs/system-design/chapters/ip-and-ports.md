# Addresses, packets and ports

Id: ip-and-ports · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Standard: visual-first
Implementation: `src/app/learn/ip-and-ports/page.tsx`, `src/components/learn/ip-and-ports/*`,
`src/components/learn/kit/{useClock.ts,Transport.tsx,NearViewport.tsx,verdict.ts}`,
`src/lib/learn/demux-model.ts`, `src/lib/learn/network-model.ts` (+ `.test.ts`),
`src/content/learn/ip-and-ports-sources.ts`.
Prerequisites: client-server · Related: dns, tcp, udp-quic, cloud-networking, load-balancing

## Boundary

Objectives (observable):

1. Given a packet's destination address, transport protocol and destination port, predict which program on a
   host receives it, or what comes back when none does (TCP reset, ICMP Port Unreachable, or nothing at all).
2. Explain why two TCP connections from the same machine to the same server address and port stay separate (the
   source port; a connection is identified by a pair of sockets), and why that does not mean one connection per
   browser tab.
3. Explain why IP packets can be lost, delayed or arrive in a different order, and predict what an application
   reads in each case over UDP and over TCP, including the cost TCP's ordering adds.
4. Tell a name (what we seek) from an address (where it is: a machine's interface) from a port (which program on
   that machine), and say how long IPv4 and IPv6 addresses are.

In scope: IPv4/IPv6 addresses as interface identifiers (sizes only), the IP header fields the lookup uses
(destination address, protocol), ports and port ranges, sockets and the TCP connection pair, demultiplexing to a
process, what a host answers for an unused port, IP's lack of delivery guarantees, what UDP and TCP give an
application under loss, delay and reordering. One mechanism: how a packet finds its program, and what can
happen to packets on the way.

Deferred:

- How a name becomes an address → `dns`
- How TCP opens connections, acknowledges, times out and retransmits; duplicated packets and how TCP discards
  them → `tcp`
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
listener) — a packet that travels through them; packets on different paths overtaking each other, a link that
drops what reaches it, a queue that grows, and an application that waits for a gap — a network the learner
breaks and watches.

Estimated time: 20–25 minutes (assumption, not measured).

## Concept decomposition

Mental models: a host is one address with two transports, each a set of numbered doors (ports) leading to
programs; a network is several routers and links, each packet forwarded on its own.
Mechanisms: demultiplexing in stages (address, firewall rule, protocol field, connection table, listener);
forwarding hop by hop on the router's current route; dropping where a packet cannot be forwarded; queueing at a
busy link; TCP's in-order delivery and resend at the receiving end.
Temporal behaviour: a route change mid-stream lets a later packet overtake an earlier one; a failed link drops
packets until routing reconverges; a resend arrives one timer later; reads held behind a gap.
Quantitative relations: arrival = send + Σ link delays + queue wait; a queue grows when packets arrive faster
than the link serves them (every 2 ticks against 3) and stays empty otherwise; TCP's last read moves from tick
15 to tick 23 after a failure (teaching model, ticks not to scale).
Failure scenarios: unused port (reset or ICMP), firewall drop (silence), wrong address (never arrives), route
change (reorder), link failure (loss), congestion (delay).
Trade-offs: UDP hands data over at once with gaps and disorder; TCP hands it over whole and in order, later.
Needs space or experiment: where in the host a packet stops (space); which packet overtakes which, and where the
queue builds (experiment, in time).
Hardest: two connections from one machine to one server port stay apart — only the source port differs, so the
learner sends packets from 50001, 50002 and 50003 and watches each land on a different row (Fig. 2, A2).
Hardest: why packets arrive out of order or not at all — no single place "loses" or "swaps" them, so the learner
changes a route, cuts a link or slows one and watches packets overtake, drop or queue (Fig. 3, A3).
Hardest: what TCP's ordering costs — the same broken network under UDP and TCP, side by side: TCP reads all five,
but later (Fig. 3, A3, its comparison table).

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

1. **Fig. 1, explore the parts.** One server drawn as a box: a name tag (www.example.com) with a dashed arrow
   "name → address (dns, chapter 4)", an address tab (203.0.113.10; "32 bits (IPv6: 128)"), TCP and UDP lanes,
   port tabs (443, 8125) and programs (web server, metrics collector). The learner selects Name, Address,
   Protocol, Port or Program: that part is drawn heavy and its role (what we seek, which machine, which
   transport, which program, who receives it) appears beside the drawing (above it on phones). It works before
   any script loads.
2. **Fig. 2, build a packet and predict.** From client 198.51.100.7: source port 50001 or 50002 (each with a
   connection open to 443) or 50003 (nothing open), destination address, protocol, port, firewall on or off
   (rule: allow TCP 443 and UDP 8125). The learner predicts where it goes.
3. **Fig. 2, run.** The packet, a small black square, travels from the sender's packet box to the address tab, through the firewall
   band when on, into the protocol lane, to the connection row, the listening socket or "nobody"; anything that
   comes back (answer, set-up, RST, ICMP) travels back to the sender. Each stage draws the part it reads heavy
   and names its rule and source under the drawing. Play, pause, step, reset, replay. The outcome and the
   verdict on the prediction appear when the run ends.
4. **Fig. 2, contrast.** 50001 and 50002 to TCP 443 land on different rows; 50003 lands on the listening socket;
   UDP 443 lands on "nobody" and ICMP comes back; with the firewall on, TCP 9000 stops at the band and nothing
   comes back.
5. **Fig. 3, break a network and predict.** Five datagrams from the sender to the host across four routers with
   two paths: upper (4 ticks) and lower (7 ticks). The learner picks what happens on the way (nothing, a route
   change, link R2–R4 fails, R2–R4 congested, with how long R2–R4 needs per packet), the transport, and predicts
   what the application reads.
6. **Fig. 3, run.** Numbered tags move along the links; the heavy line is R1's current route and moves when the
   route changes; the failed link turns dashed with ×; a dropped tag shows × at R2; waiting tags line up beside
   R2 with "queue n"; TCP's resends are dashed tags. Under the drawing: the tick and what happened at it, what
   has arrived at the host, what the application has read.
7. **Fig. 3, compare.** When the run ends: the category, the verdict, and the same network under UDP and TCP
   side by side (reads, last read, resent): after the failure UDP reads 1 4 5 by tick 15; TCP reads 1 2 3 4 5
   by tick 23 with 2 resent.

## Asset plan

Objective coverage: 1 → A2 · 2 → A2 · 3 → A3 · 4 → A1

### A1. Name, address, protocol, port, program

- objective: 4
- type: precision-2d
- pattern: explore
- learner sees: a name tag (www.example.com) with a dashed arrow "name → address (dns, chapter 4)" to one host box with its address tab (203.0.113.10; "32 bits (IPv6: 128)"), TCP and UDP lanes, port tabs (443, 8125) and programs (web server, metrics collector), an unused 9000; a "Select a part" group (Name, Address, Protocol, Port, Program)
- animated: none — selecting a part changes its line weight and fill over 200 ms (none under reduced motion); nothing here happens in time, so nothing travels
- learner does: selects each part (native radio buttons; CSS `:has()`, no script)
- notice: each number answers a different question, and they nest: the address finds the machine, the protocol picks a lane, the port picks a program within that lane
- model: conceptual illustration of the structure every host shares (an address names an interface; a protocol field picks the transport; a port within a protocol names a program's endpoint); the only quantities are the standard bit lengths
- feedback: the selected part is drawn heavy (2.4 px stroke and gray fill) and its role appears beside the drawing (above it on phones), with its sources
- assumptions: one interface and one address per host (real hosts may have several); port 8125 and the program names are assumed examples; 443 is the default for https (RFC 9110 §4.2.2); this server offers nothing on UDP 443 (an HTTP/3 server would, RFC 9114 §3.1); guards "an address identifies a user" and "a port is hardware"
- outcome: the learner says which part answers what, where, which transport and which program, and the address sizes
- accessibility: radio group with a legend, each radio described by its role (aria-describedby); drawing aria-hidden; the roles are text; works without JavaScript; text 12 px+ at 375 px; state by line weight and fill plus text, never colour
- tests: browser: each part shows exactly its role and draws its part heavy; figure present, no overflow at the six sizes; axe clean
- evidence: rfc791 §2.3 names, addresses and routes, §3.1 32-bit addresses and the protocol field (standard-defined); rfc4291 §2 128-bit interface identifiers (standard-defined); rfc5737 §3 and rfc2606 §3 example addresses and names (standard-defined); rfc9110 §4.2.2 https default port 443 (standard-defined); rfc9114 §3.1 HTTP/3 over UDP (standard-defined); rfc9293 §4 socket (standard-defined); 8125 and the program names (illustrative)
- built: `src/components/learn/ip-and-ports/HostExplorer.tsx`

### A2. Which program gets this packet?

- objective: 1, 2
- type: simulation
- pattern: predict, step, break, compare
- learner sees: the packet box (protocol, 198.51.100.7:source port → destination address:port) with an arrow to the server or to another machine (192.0.2.20); the server with a firewall band when on, TCP and UDP lanes, its connection table (rows for 50001 and 50002), the listening socket on 443, the UDP socket on 8125, and "nobody" boxes for unused ports
- animated: the packet (a black square, named in the caption's key) travels from stage to stage (600 ms of travel, then it rests at the part that stage reads, which is drawn heavy); any reply (answer, set-up, RST, ICMP) travels back to the sender as a dashed tag. The motion is the order the host checks the packet in, and where it stops
- learner does: picks source port, destination address, protocol, port and firewall; predicts the outcome; runs; plays, pauses, steps forward and back, resets and replays
- notice: the source port alone separates connections 1 and 2; a new connection goes to the listening socket; the protocol is checked before the port; a firewall stops a packet before any lookup, so no reply proves nothing
- model: pure function `demux(packet) → { outcome, receiver, reply, steps }` over a fixed host: a TCP listening socket on 443 (web server), a UDP socket on 8125 (metrics collector), TCP connections 203.0.113.10:443 ↔ 198.51.100.7:50001 and :50002, a firewall rule (when on) allowing only TCP 443 and UDP 8125. Rules in order: address ≠ this host → never arrives here; firewall on and not allowed → dropped, nothing back; protocol field selects the transport; TCP: matching socket pair → that connection, else a listener and a packet that opens a connection → TCP sets it up, else reset (RST); UDP: a socket on the port → that program, whatever the source port (unconnected socket, a modelling choice), else ICMP Port Unreachable (a SHOULD). The drawing's tag positions are a function of the clock and the step list only
- feedback: the current stage's rule and source under the drawing, the part it reads drawn heavy; when the run ends, the receiver, what the sender gets back and the verdict on the prediction, and the full stage list as buttons (nothing about the outcome before then)
- assumptions: the server runs exactly these programs and has one address; no NAT, proxies or load balancers; packets arrive intact; packets from 50001/50002 belong to their open connections, packets from 50003 open one; the firewall rule is one typical configuration, not a standard; guards "IP and port identify a user or a tab", "two connections from one machine get mixed up", "each tab has its own connection" (page text, RFC 9112 §9.3, RFC 9114 §3.3), "no reply means nothing there", "the program receives the opening packet"
- outcome: the learner predicts the receiver for any packet, and explains why two connections from one machine never mix (a different source port, so a different socket pair) and why that is not one connection per tab
- accessibility: radio groups with legends; Run; a transport group (Play/Pause/Replay, Previous, Next, Reset) with aria-disabled ends; Next keeps focus; one polite live region for the outcome (filled when the run ends), one for step announcements; drawing aria-hidden with the stage list as its text alternative; reduced motion: the tag jumps from stage to stage every 900 ms while playing, no gliding; after Run the drawing and its current step come into view at 375 px
- tests: model: all 72 packets have one outcome and stages in order; two connections by source port; new connection set up by TCP; UDP rule labelled a model choice; reset and ICMP; the firewall drops before the protocol stage; every step cites a source or says "model:"; no step mentions users, requests or tabs. Browser: ten packets against the model; prediction verdicts; four stages for a delivered packet, three for a firewall drop; nothing about the outcome before Run or before the run ends; a change after a run clears it; Next announces "Step 2 of 4, Protocol"; at the end Next is aria-disabled, keeps focus, and the reply has reached the sender; keyboard; reduced motion
- evidence: rfc791 §3.1 destination address and protocol fields (standard-defined); rfc9293 §2.2 ports, §3.4.1 a connection is a pair of sockets, §3.5.2 reset, §3.9.1.1 passive open (standard-defined); rfc768 Introduction (standard-defined); rfc1122 §4.1.3.1 ICMP Port Unreachable SHOULD (standard-defined); rfc6335 §6 dynamic ports (standard-defined); rfc9112 §9.3, rfc9114 §3.3 connection reuse (standard-defined); UDP taking any source port (model choice, labelled); the firewall rule and host table (illustrative); travel timing (illustrative, not to scale)
- built: `src/lib/learn/demux-model.ts`, `src/lib/learn/demux-model.test.ts`, `src/components/learn/ip-and-ports/DemuxLab.tsx`, `src/components/learn/kit/useClock.ts`, `src/components/learn/kit/Transport.tsx`

### A3. Five datagrams through a network

- objective: 3
- type: simulation
- pattern: predict, break, compare, step
- learner sees: sender, routers R1–R4 and host; upper path S–R1–R2–R4–H (link delays 1, 1, 1, 1: 4 ticks) and lower path R1–R3–R4 (3 and 2: 7 ticks in all), each link labelled with its delay; the heavy line is R1's current route; controls for the event, the service time when congested, the transport and the prediction
- animated: numbered tags move along the links at the model's times (2.2 ticks per second, ease-in-out per hop); R1's heavy route moves at the route change or reconvergence; the failed link turns dashed and is labelled "× failed"; dropped tags become × and line up beside R2 for the rest of the run; a key in the caption names every mark; waiting tags line up beside R2 with "queue n"; resends are dashed tags. Every frame is `positionAt(copy, t)` of the model's run
- learner does: picks the event (nothing, route change, link R2–R4 fails, R2–R4 congested with 1, 2 or 3 ticks per packet), the transport (UDP or TCP), predicts (all five in order, all five out of order, some missing), runs, plays, pauses, steps tick by tick, resets and replays
- notice: a later packet on the short path overtakes an earlier one on the long path; a failed link drops what reaches it until R1 reroutes; a queue builds only when the link needs longer than the gap between packets; TCP reads every packet in order but holds those behind a gap
- model: `simulate({ event, transport, service })` in `network-model.ts`, deterministic, ticks (an assumed unit). The sender sends packet n at 2(n−1). Each link adds its delay. R1 forwards on `routeAt(event, t)`: route change, lower until tick 3 then upper; link failure, upper until reconvergence at tick 7 then lower. R2 forwards one packet at a time on R2–R4, first in first out (departure_k = max(arrival_k, departure_k−1) + service); from tick 4 a failed R2–R4 makes R2 drop what reaches it. UDP hands each copy to the application on arrival. TCP keeps the first copy of each packet, reads in order, and resends a lost packet 12 ticks after sending it (a fixed timer, longer than any delay here). Quoted results: none → arrivals 4, 6, 8, 10, 12; route change, UDP → reads 2 1 3 4 5; link failure, UDP → 1 4 5 by tick 15, TCP → 1 2 3 4 5 by tick 23 with 2 and 3 resent at 14 and 16; congestion at 3 ticks → largest queue 2, reads at 6, 9, 12, 15, 18; at 1 or 2 ticks → no queue
- feedback: under the drawing, the tick and what happened at it, what has arrived and what has been read so far; when the run ends, the category, the verdict, a "Why:" line built from the run (which packet overtook which and on which path, what R2 dropped, how the queue grew, what the transport resent or held), a table of the same network under UDP and TCP (reads, last read, resent), and the run as a list
- assumptions: one event per run; links never corrupt or duplicate; no other traffic; routing reconverges in a fixed 3 ticks; TCP's timer is fixed (real TCP adapts it); acknowledgements, windows and connection set-up are left to the tcp chapter; first-in-first-out at R2 is a model choice; guards "packets travel in a line and arrive in order", "TCP makes the network reliable" (the loss still happens under TCP; TCP recovers in the end hosts, later), "the animation's speed is the network's" (ticks, not to scale)
- outcome: the learner predicts what UDP and TCP read for each event, explains reordering by different paths and loss by a link that cannot forward, and states when a queue grows (arrivals faster than service)
- accessibility: radio groups with legends; the service group appears only for congestion; Run and the transport group; Previous/Next announce the tick's events; one polite live region for the outcome when the run ends; drawing aria-hidden with the run as a list (text alternative) and the comparison as a table with caption and headers; reduced motion: tags jump tick by tick every 900 ms, no gliding; after Run the network comes into view at 375 px; the lab's code loads as it nears the viewport, with a fixed-height waiting card
- tests: model (network-model.test.ts, 37): arrivals with no event; the route change reorders 1 and 2 under UDP and TCP holds 2 one tick; the failure drops 2 and 3 at R2 at ticks 4 and 6, UDP reads 1 4 5, TCP resends at 14 and 16 and reads all by tick 23, packet 4 held 10 ticks; congestion at 3 ticks: largest queue 2, reads 6, 9, 12, 15, 18, waits 0 to 4; at 1 and 2 ticks no queue; conservation; determinism; `positionAt` in the queue, on a link and for a lost copy. Browser: six runs against the model; the comparison table's numbers; the service control only for congestion; tags move while playing, stop on Pause, Reset returns to tick 0, Replay plays again; nothing before Run or before the run ends; a change clears it; reduced motion steps; lazy loading
- evidence: rfc791 §1.2 and §1.4 IP has no acknowledgements, retransmission or sequencing (standard-defined); rfc768 Introduction delivery not guaranteed (standard-defined); rfc8085 §3.3 reordering from routing transients, loss, no retransmission in UDP (standard-defined, BCP); rfc9293 §2.2 and §3.4 reliable in-order stream by sequence numbers and retransmission (standard-defined); the topology, link delays, reconvergence time, timer and FIFO queue (illustrative, teaching model, labelled in the caption)
- built: `src/lib/learn/network-model.ts`, `src/lib/learn/network-model.test.ts`, `src/components/learn/ip-and-ports/NetworkLab.tsx`, `src/components/learn/ip-and-ports/LazyLabs.tsx`, `src/components/learn/kit/NearViewport.tsx`, `src/components/learn/kit/verdict.ts`

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
   (A2 contrast cases; A3: a route change, a failed link, a congested link).
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

Decision: three figures carry the chapter, each a different pattern: explore the parts (A1, no script), send a
packet and watch it travel through the host's checks (A2), break a network and watch packets overtake, drop and
queue (A3). Figs. 2 and 3 move because the mechanism happens in time; every frame is a function of one clock and
the model, so pausing and stepping show real states. 2D only: the network and the host are graphs and boxes; 3D
would hide labels, cost JavaScript and teach nothing more (rendering.md).

## Practice

Retrieval questions (with answers in the page):

- Q1 (recall): Which field tells the host to hand the packet to TCP rather than UDP? → the protocol field of the
  IP header. Wrong: "the port" (ports are inside TCP/UDP and mean nothing until the protocol is known).
- Q2 (predict): 198.51.100.7:50002 sends TCP to 203.0.113.10:443. Which connection receives it? → the one whose
  remote socket is 198.51.100.7:50002. Wrong: "the web server's listening socket" (it only takes new
  connections).
- Q3 (predict): A link fails and packets 2 and 3 are dropped. Over TCP, what does the application read, and when?
  → 1 2 3 4 5 in order, the last at tick 23 in Fig. 3; 4 and 5 arrive early and wait for the resent 2 and 3.
  Wrong: "1 4 5" (that is UDP).

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

All on the production build of the working tree after 589aa6d (the pilot with the fourth review's fixes,
committed with this evidence), 2026-10-28. Earlier rounds' evidence is in git history (857aeeb, faa5b85).

- model tests: pass — npx vitest run: 213/213 (demux-model 17: 72 packets one outcome each, stage order, two connections by source port, new connection set up by TCP, UDP rule labelled a model choice, reset/ICMP, firewall before the protocol stage, sources or "model:" on every step, no users/requests/tabs; network-model 37: arrivals with no event, route-change reorder and TCP's hold, link-failure drops, UDP 1 4 5 by 15, TCP resends at 14 and 16 and reads all by 23, congestion queue 2 and reads 6–18 at 3 ticks, no queue at 1 and 2, conservation, determinism, positions in the queue, on a link, and a lost copy staying where it was dropped) (2026-10-28)
- typecheck: pass — npx tsc --noEmit (2026-10-28)
- lint and format: pass — npm run lint (no warnings); npx eslint tests/browser (0 errors; 2 no-shadow warnings in web-request.cjs and client-server.cjs, the same on main); prettier --check src docs tests .claude/skills/system-design-educator (2026-10-28)
- browser suite: pass — tests/browser/ip-and-ports.cjs 77/77: six sizes without horizontal scroll or console errors, before and after runs; axe WCAG 2.2 A/AA at 375 and 1280 on load and after both labs ran; Fig. 3 loads as it is reached; each Fig. 1 part shows its role and draws heavy; nothing about an outcome before Run or before a run ends in either lab (Fig. 2: no stage list, result or live summary mid-run); a change after a run clears it; ten Fig. 2 packets and six Fig. 3 runs against the models; the comparison table; the "Why:" line from the run; both dropped packets stay visible as ×2 ×3; the broken link labelled in text; the rules behind each lab in closed "Ran it?" disclosures; tags move while playing, stop on Pause, Reset returns to tick 0, Replay plays again; citations numbered top-down; links from /learn and chapter 2; sitemap; / renders (2026-10-28)
- keyboard: pass — ip-and-ports.cjs: arrow keys move within radio groups; Enter on Run; a visible focus outline on Run; Next announces "Step 2 of 4, Protocol", keeps focus and is aria-disabled at the end, where the reply has reached the sender; Fig. 3 Previous from mid-tick announces the tick it shows (2026-10-28)
- reduced motion: pass — ip-and-ports.cjs with reducedMotion reduce at 375 px: nothing in the figures transitions or animates; Run waits at whole ticks (no gliding); stepping reaches the outcome and the full list (2026-10-28)
- mobile: pass — ip-and-ports.cjs at 375 px: after Run the Fig. 2 drawing and its current step, and the Fig. 3 network, are fully in view; drawing lettering 13.5 units on phones (about 12.3 px at 375) (2026-10-28)
- regression suites: pass — web-request 69/69, client-server 48/48 (2026-10-28)
- JS budget: pass — tests/browser/js-budget.cjs 9/9 under the course budget (owner, 2026-10-28; COURSE_STATE): /learn/ip-and-ports 109.5 kB first-load (≤ 150) and 25.2 kB on demand (≤ 400); / 115.6 kB (≤ 120, unchanged); next build: the chapter 107 kB, / 110 kB (2026-10-28)
- lighthouse: pass — Lighthouse 12.2.1, /learn/ip-and-ports: mobile performance 99, desktop 100; accessibility, best practices and SEO 100; CLS 0 (2026-10-28)
- screenshots read: pass — every figure at 375, 402, 768, 1280, 1440 and 1920 after runs; every course drawing at 375 after the phone lettering change; Fig. 2 at the end of three packets at 375 and 1280; Fig. 3 after the link failure at 375 and 1280. Found and fixed this round: socket text crowded by the packet tag at phone lettering (now a 12-unit square at the row's edge), the broken link's label on its own line, unnumbered drop marks, reply tags at the box edge (2026-10-28)
- static analysis: pass — npx fallow audit: no issues in the changed files (the cite helper the three chapter pages repeated is now one `citeFor`) (2026-10-28)
- course checks: pass — course.mjs check ok (two legacy warnings: web-request, client-server); course.mjs skill ok; course.test.mjs 36/36, with new cases for review lines read per block and exception lines inside code fences (2026-10-28)

## Review findings

The first three reviews below examined the design that faa5b85 replaced (Fig. 3 as a timeline with "lose 3",
"delay 2" and "duplicate 4"; `DatagramLab`, `datagram-model.ts`): superseded, kept as history. The fourth reviews
the current build.

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

Reviewer: second fresh subagent (check of the fixes 91bea9c..60b5713 on a production build of 60b5713: viewport screenshots at six sizes, every control, keyboard, reduced motion, every new citation in the doc-rfc texts, gaming fixtures for `check`), 2026-10-28
Visual review: text-heavy=no · mechanism-via-visual=yes · every-visual-teaches=yes · claims-defensible=yes · interaction-helps=yes

- [blocking] The new "first → decides" rule in `course.mjs` rejected this chapter's own blocking finding (its title contains "→") → fixed (a finding is closed when an arrow, → or ->, leads to "fixed" or "accepted: <reason>" and none leads to "open"; arrows in the finding's own words don't count; test with this exact finding)
- [should-fix] `revealAfterRender` checked only the top of the result, so step text, readouts or the timeline could stay below the fold (375 px Fig. 2, 768 px Fig. 3) → fixed (reveal.ts scrolls when any part is off-screen; browser checks that the drawing, its current step and the timeline are fully in view at 375 px and the timeline at 768 px)
- [should-fix] `check` still gameable: bare `Standard: legacy`, an ASCII `->` before "→ fixed", "fixed? no", `**[blocking]**` and `[must-fix]` tags, a second findings section, one combined evidence line, `n/a` without a reason, `src/..` paths, "Reviewer: me — not independent" → fixed (each case rejected; course.test.mjs cases and the reviewer's fixtures in review-c3b/game fail)
- [note] Fig. 1: the host outline ran through the "32 bits" label → fixed (size labels above the host, name→address labels left of the arrow)
- [note] Fig. 3: arrows for 2 and 4 both ended on the "2" tag at tick 5 → fixed (an arrow to a stacked tag ends beside it)
- [note] Fig. 2: arrow to another machine ended beside its box → fixed (it turns into the box)
- [note] New-connection result cited §3.4.1 for the set-up → fixed (source reads "§3.4.1 (pair of sockets); the set-up is the TCP chapter")
- [note] Step text shown twice (current step and the full list) → accepted: the full list is the text alternative and lets a learner jump to any stage; the current step is what keeps the drawing and its explanation together
- [note] Stage table in chapter-workflow.md runs A, B, D, C → accepted: it lists mode C steps in order; stage letters name the kind of work, and step 5 is labelled a draft revised in step 6
- [note] Most course.test.mjs fixtures default to `Standard: legacy` → accepted: the visual-first rules have their own fixtures (seven tests); the legacy default keeps the older gate tests focused
- [note] "Two tabs may well share one connection" has no browser-behaviour source → accepted: it is worded as a possibility that follows from RFC 9112 §9.3 and RFC 9114 §3.3, not as a claim about any browser

Reviewer: third fresh subagent (check of 857aeeb on a production build: mouse, keyboard and reduced motion at 375, 402, 768, 1280 and 1440 px; new gaming fixtures for `check`), 2026-10-28
Visual review: text-heavy=no · mechanism-via-visual=yes · every-visual-teaches=yes · claims-defensible=yes · interaction-helps=yes

- [should-fix] This chapter could not reach `verified`: its own finding quoted "fixed? no", and `check` read the first (stale) "Visual review:" line → fixed (no global "fixed?" test; the latest "Visual review:" line counts; tests for both)
- [should-fix] `check` gameable by further wordings (tag variants, headings with a suffix or in setext form, skip words in the key or after "pass", placeholder n/a reasons, symlinks, commented-out Standard lines, reviewer negations, own-words arrows that lead to "fixed") → accepted: deliberately misleading wording can always be bent past a pattern, so `check` targets honest slips and the independent review catches the rest (course-state.md now says so). The slips an honest author can make are now caught, with tests: `[blocker]`, `[critical]`, numbered or emphasised tags; "## Review findings (round 2)"; skip words anywhere on a pass line; "n/a — TBD"; symlinked built paths; HTML comments; an outcome fixed and later reverted
- [should-fix] Fig. 3, Delay 2: arrow 4 ran through the "3" tag → fixed (at a tie the copy sent last keeps the row and the delayed one stacks below; its arrow goes down outside the cluster, then across; screenshots at 375 and 1280 read)
- [note] 768 px: Fig. 2's outcome line just below the fold after Run → fixed (the outcome line sits in the revealed block under the drawing; browser check at 768)
- [note] An own-words "→ open-ended" read as open → fixed (open must end the word)
- [note] The browser suite checks visibility, not drawing collisions → accepted: collisions are checked by reading the screenshots at every size (Evidence, "screenshots read")

Reviewer: fourth fresh subagent (independent review of the skill and of the rendered pilot at faa5b85: six viewport sizes before, during and after runs, every Fig. 3 event under UDP and TCP, seven Fig. 2 packets, keyboard, reduced motion, model numbers recomputed by hand, RFC 8085 §3.3, 9293 §3.5.2, 1122 §4.1.3.1 and 791 checked in the doc-rfc texts; RFC 9110, 9112, 9114, 4291, 6335, 5737, 2606 not re-checked; no Lighthouse, no screen reader), 2026-10-28, rubric visual-review.md
Visual review: text-heavy=no · mechanism-via-visual=yes · every-visual-teaches=yes · claims-defensible=yes · interaction-helps=yes
Visual rubric: education=pass · clarity=fail · interaction=fail · correctness=pass · animation=pass · hierarchy=pass · accessibility=fail · mobile=pass · performance=pass · consistency=pass
Rejects: none

- [should-fix] Fig. 2 showed every stage's text (the outcome) as soon as Run was pressed → fixed (the stage list appears when the run ends; browser check mid-run)
- [should-fix] Prose under Figs. 2 and 3 stated the outcomes to predict → fixed (the rules sit in closed "Ran it? The rules behind what you saw" disclosures; the quoted ticks are gone, the table gives them; browser check)
- [should-fix] Fig. 3 Previous announced a different tick from the one shown → fixed (the target tick is computed, sought and announced together; browser check from mid-tick)
- [should-fix] Fig. 3 had no key for the failed link and ×, and a drop showed for one tick → fixed (a key in the caption names every mark; the link reads "× failed"; dropped packets stay as ×2 ×3 beside R2 for the rest of the run; model and browser tests)
- [should-fix] Fig. 3's outcome did not state the rule that produced it → fixed (a "Why:" line built from the run: which packet overtook which and on which path, what R2 dropped, how the queue grew or why it did not, what TCP resent and held)
- [should-fix] Objective 3 promised duplication, which nothing builds → fixed (objective 3 and the scope say lost, delayed or reordered; duplication and TCP's discarding of duplicates deferred to `tcp`)
- [should-fix] The skill said `useClock` stops offscreen and owns speed; it did neither → fixed (the clock holds while its `target` figure is offscreen and resumes when it returns; both labs pass their figure; motion.md says speed is the figure's `rate`)
- [should-fix] `check` combined review lines from different blocks → fixed (the three lines must sit in the latest "Reviewer:" block; test)
- [should-fix] A3 claimed `quantitative` without a chart → fixed (dropped from A3's pattern)
- [note] Drawing lettering about 11.8 px at 375 px → fixed (13.5 units on phones, about 12.3 px; every course drawing re-read at 375)
- [note] Fig. 3 tags overlap router circles at hop moments → accepted: transient while a tag passes a router, the name stays legible, and at rest no tag covers a router
- [note] The reply travels to the packet box, not a drawn sender; reply tag at the box edge; "Sender gets back: The …" and the reply repeated → fixed (the key says a dashed tag is what comes back to the sender, the packet box being the sender's packet; the tag rests inside the box; lower-case reply text; the current step says only that the reply reached the sender)
- [note] "Arrived at the host, in order"; step text in lower case → fixed ("in arrival order"; first letter capitalised)
- [note] Fig. 1 below the first screen on desktop → fixed (the goals list moved below Fig. 1; its drawing starts at y 489 at 1280×800, was about 750)
- [note] Spec drift (role text position, demux test count, old reviews of a removed design) → fixed (storyboard and A1 say beside the drawing, above on phones; 17; the first three reviews marked superseded)
- [note] Stale references to `visual-science.md`, `visualization-and-simulation.md`, "Nine reference files" → fixed (renamed or annotated; twelve)
- [note] `check` found exception lines inside code fences → fixed (fences stripped first; test)
- [note] The skill's description did not mention visual-first or interactive work → fixed (description names manipulable figures, animation from tested models, and making a chapter more visual or interactive)
