# Public and private subnets

Id: cloud-networking · Stage: 1 · Paths: production (status lives only in CURRICULUM.md)
Prerequisites: ip-and-ports · Related: load-balancing
Standard: anatomy-3d
Implementation: `src/app/learn/cloud-networking/page.tsx`, `src/components/learn/cloud-networking/SubnetGate.tsx`,
`src/lib/learn/cloud-networking-model.ts` (+ `.test.ts`), `src/content/learn/cloud-networking-sources.ts`.

## Boundary

Objectives (observable, numbered):

1. Point at the packet and say its place: outside, the public subnet, stopped at the boundary, through the NAT, or the private subnet.
2. Predict that an unsolicited packet from outside reaches the machine in the public subnet, and that the same kind of packet aimed at the private machine stops at the boundary and does not arrive.
3. Predict that a private machine reaches the outside only by passing through one NAT door, and that the reply comes back through that door.

In scope: one packet body, two yards a learner can tell apart by height and by an open bay against a wall, one doorway, three trips. Addresses: 203.0.113.5 (RFC 5737 TEST-NET-3, the street), 192.0.2.10 (RFC 5737 TEST-NET-1, the public-subnet machine), 192.168.2.10 (RFC 1918 192.168.0.0/16, the private machine), 198.51.100.10 (RFC 5737 TEST-NET-2, the address the door shows outside). The hop is 4 ticks, assumed.

Deferred: the demultiplexer and the five-machine network → `ip-and-ports` (already drawn; this chapter does not redraw them). Port translation (NAPT) → RFC 3022 §2.2, not drawn. A static inbound map → RFC 3022 §2, not drawn. A second NAT router → RFC 3022 §1. A private host talking to a public host inside the same enterprise → RFC 1918 §3, not drawn. Vendor VPC route tables, internet gateways, and NAT gateways → no vendor document was fetched, so none of that behavior is stated. DNS for private names → RFC 1918 mentions leakage and was not the lesson. Checksums, fragments, and FTP ALGs → RFC 3022 later sections, not read for this lesson.

Misconceptions targeted: a private address is reachable from the street the same way a public address is; the packet is dropped in only one place the RFC names; NAT is a second path into the private yard for unsolicited packets; the reply comes back by some other door; a documentation address is a real routed public address.

## Concept decomposition

Mental models: the packet is one body. The open, lower yard is the public subnet. The tall walled yard is the private subnet. The doorway is the one NAT. The body's place is the whole lesson.
Mechanisms: an outside body aimed at 192.0.2.10 ends in the public subnet. The same kind of body aimed at 192.168.2.10 ends stopped at the boundary. A body that starts in the private subnet passes through the NAT, reaches outside, and the reply passes through the NAT again and ends in the private subnet.
Temporal behaviour: each hop is HOP ticks. The two inbound trips end at HOP. The outbound trip and its reply end at 4 × HOP. Nothing overlaps.
Quantitative relations: along = (t − left) / HOP on an unfinished hop. end(public) = end(private) = HOP. end(nat) = 4 × HOP. HOP = 4, assumed. No measured delay.
Failure scenarios: the unsolicited private trip. The body stops at the boundary. `arrived` stays false. The place is never the private subnet on that trip.
Trade-offs: one door makes the return path obvious and hides a second NAT (RFC 3022 §1 allows more than one, with a caveat). Drawing no static map makes the stop obvious and hides an inbound session the RFC allows. Using TEST-NET for the open yard keeps every printed address inside RFC 5737 or RFC 1918, and it is not a real registry assignment.
Needs space or experiment: the body has to be able to sit outside, inside the open yard, against the wall, in the doorway, and inside the walled yard, and those stations have to be different shapes.
Hardest: the same kind of packet from outside enters the open yard and stops at the wall of the other yard — the place is the difference (A1).
Hardest: a private machine reaches outside only through the one door, and the reply comes back through that same door (A1).
Hardest: which packet is dropped is this model's rule. RFC 1918 says private packets should not be forwarded across inter-enterprise links and does not name this wall. RFC 3022 allows a static inbound map. RFC 5737 says the documentation blocks should not appear on the public Internet, so the open yard's arrival is also a model choice (A1).

## Parts you'll meet

Packet: the one body. Its place is the model field. Chapter 3 already used this word for an IP datagram. This chapter does not reopen how a host picks a program.
Place: outside, public subnet, stopped at the boundary, through the NAT, or private subnet.
Public subnet: the open yard. Its machine is 192.0.2.10, a documentation stand-in for a public host.
Private subnet: the walled yard. Its machine is 192.168.2.10, inside 192.168.0.0/16.
NAT: the one door. Outbound sessions and their replies pass through it. Its outside address in this model is 198.51.100.10.
Tick: an assumed unit of time. Not a measured round trip.
Arrived: true only when the trip has ended at the machine it was for. The private inbound trip does not arrive.

## Storyboard

1. The learner sees two yards on one base. One is lower, with an open side toward the street and a short cabinet. The other is walled and taller, with a taller cabinet and one doorway. No word on the metal names them. The question is where a packet from the street is allowed to go.
2. On Learn, a packet leaves the street aimed at the tall cabinet. It moves to the solid wall beside the door and stops. It does not enter the doorway and it does not enter the walled yard.
3. In the lab the learner chooses the public machine, the private machine, or the private machine going out through NAT, predicts whether it arrives, and presses Run. The yards stay still until then. The public trip ends in the open yard. The private trip stops at the wall. The NAT trip leaves through the door, reaches the street, and the reply returns through the door to the tall cabinet.

## Asset plan

Objective coverage: 1 → A1 · 2 → A1 · 3 → A1

### A1. Subnet gate

- objective: 1, 2, 3
- type: 3d
- object: a gate compound with an open lower yard, a taller walled yard, one doorway, two cabinets of different heights, and one packet
- render: anatomy-iso
- fidelity: computed: place, from, along, and arrived from frameAt(); assumed: HOP of 4 ticks, one door, one body, and the four addresses; the open yard's arrival and the boundary stop are model rules where the RFCs allow more; nothing is faked as a live capture or as a vendor console
- pattern: step predict
- learner sees: two yards, a wall with one door, no packet until the run starts
- animated: the packet's screen position is one translate from the place and along of frameAt; nothing else moves
- learner does: on Learn, the failed trip plays and the learner can pause and step; in the lab, choose the destination, predict arrival, then run
- notice: the inbound private packet stops on the solid wall, not in the doorway; the public packet ends in the open yard; the outbound packet and the reply both pass the doorway
- model: input trip (public, private, or nat) and t in ticks; state is frameAt(trip, t) in src/lib/learn/cloud-networking-model.ts; place is the station of the current hop; along is 0 at from and 1 at place; arrived is true only at the end of public and nat
- feedback: the line under the drawing is the event sentence, and while a hop is unfinished it adds that the body is still short of the next place; the lab adds the arrival sentence and the prediction verdict when the trip has ended
- assumptions: one door, no static map, no port translation, no path between the yards, documentation addresses standing in for a registry address and for the door's outside address, the stop located at this boundary
- outcome: the learner can name the body's place, say which inbound trip arrives, and say that the reply uses the same door
- accessibility: the step sentence is the text alternative; the drawing is aria-hidden; keyboard Previous and Next; reduced motion jumps from event to event because useClock holds marks when that setting is on; the lab draws no run until Run
- tests: src/lib/learn/cloud-networking-model.test.ts for the two inbound endings, the NAT out-and-back, the along fraction, and the addresses
- evidence: rfc1918 §2, §3, §5, read; rfc5737 §3, §4, read; rfc3022 §1, §2, §2.1, §2.2, read
- built: `src/components/learn/cloud-networking/SubnetGate.tsx`, `src/lib/learn/cloud-networking-model.ts`, `src/lib/learn/cloud-networking-model.test.ts`, `src/app/learn/cloud-networking/page.tsx`

## Animation sense

### A1. Animation sense

- Mechanism: a packet from outside can reach a machine in the public subnet; the same kind of packet aimed at a machine in the private subnet stops at the boundary and does not arrive; a private machine reaches the outside only through one NAT door, and the reply comes back through that door.
- Moving quantity: the packet body.
- Model field: place (outside, public subnet, stopped at the boundary, through the NAT, or private subnet), with along from 0 at the station left to 1 at that place, from frameAt, in assumed ticks.
- Learner predicts: whether the body arrives or stops short, for the destination they chose.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): rfc1918, rfc5737, and rfc3022, via: read, 2026-10-29. Fetched https://www.rfc-editor.org/rfc/rfc1918.txt (§2 categories, §3 private blocks and forwarding, §5 public and private subnets and border filters), https://www.rfc-editor.org/rfc/rfc5737.txt (§3 documentation blocks, §4 they should not appear on the public Internet), and https://www.rfc-editor.org/rfc/rfc3022.txt (§1 same NAT router for a session, §2 traditional NAT is outbound and a static map can allow the other direction, §2.1 return path translation, §2.2 NAPT and ports). No vendor VPC document was fetched. No section number below is from a file that was not read.

## Explanation (14 questions)

1. Problem: a machine on the street sends a packet at a machine inside a private network. Some of those machines are meant to be reachable. Some are not. A machine that is not reachable still needs a way to start a conversation outward and get the reply.
2. Why it matters: if every internal address were reachable from the street, the private addresses would be in the global routing system, which is what RFC 1918 §3 says they are not. If the reply took a different door from the request, the session would break: RFC 3022 §1 requires requests and responses to use the same NAT router.
3. What would a beginner try first? Give every machine an address and let any packet from the street through to it. Treat "private" as a label on the same path.
4. Why does that work at first? Inside one enterprise, private hosts can communicate with other hosts, public and private (RFC 1918 §3). On a network nobody outside can send into, the label does not matter.
5. When does it fail? When the packet comes from outside the enterprise and the destination is a private address. Those packets should not be forwarded across inter-enterprise links (RFC 1918 §3). The symptom in this model is a body stopped at the boundary, not a body in the private subnet.
6. What do we observe more carefully? The body aimed at 192.0.2.10 ends in the open yard. The body aimed at 192.168.2.10 stops on the wall, beside the door, and never takes the doorway. A body that starts behind the wall does take the doorway, reaches the street, and the reply takes the doorway again.
7. What is the real mechanism? RFC 1918 §2 calls hosts that need network-layer access outside the enterprise public, and the others private. §3: private hosts have no IP connectivity outside, except through a mediating gateway; public hosts do. §5: plan public subnets where that connectivity is needed, and keep the two kinds on separate media; filter at the border. RFC 3022 §2: traditional NAT sessions are uni-directional, outbound; a static map can allow the other direction. §2.1: the return path is translated the same way. §1: one session stays on one NAT router. In this model, departures are 0 and arrivals are k × HOP, HOP = 4 ticks, assumed. along = (t − left) / HOP. Worked, assumed: public and private both run from tick 0 to tick 4. At tick 2 the public place is the public subnet, along 0.5, arrived false. At tick 2 the private place is stopped at the boundary, along 0.5, arrived false. At tick 4 the public body has arrived and the private body has not. The NAT trip is private subnet (0), through the NAT (4), outside (8), through the NAT (12), private subnet (16). Arrived becomes true at tick 16.
8. What can the learner change and watch? The destination: public machine, private machine, or private machine going out through NAT. The place at the end changes. The hop length does not.
9. What alternatives exist? A public host with a globally unique address and no translation (RFC 1918 §3). Traditional NAT with a static inbound map for a chosen host (RFC 3022 §2). NAPT, many inside addresses sharing one outside address and a port (RFC 3022 §2.2). Two NAT routers, which §1 says is possible and fragile if a flow moves. This model is one door and no static map.
10. What are the trade-offs? Globally unique addresses need a registry and need no translation. NAT hides the private address and forces the reply through the same router; a static map punches a hole. NAPT saves addresses and breaks protocols that carry addresses inside the payload (named in RFC 3022, not drawn). Putting the stop only at this wall is easier to see and less faithful than filters that can sit on more than one router (§5).
11. When should you choose it? When some machines must be reachable from outside and others must not, and the hidden machines still start sessions outward. This picture is that split, with one door for the return path.
12. When should you not treat this picture as the whole network? When you need a static inbound map, a second NAT, port translation, the path between the two subnets, a measured delay, or a vendor's route table. No vendor document was read, so this chapter does not say how any cloud console does this. Chapter 3 already showed how a host hands a packet to a program; this picture does not.
13. Explain it in your own words. The body is against the wall, beside the door. Has it arrived at 192.168.2.10, and what would have to be different for a reply to a session the private machine started?
14. Where else does this apply? Any later service that is not given a public address still reaches the outside only by a translator that sees both directions of the session. Load balancing, later in the course, sits in front of machines that have already been placed in a subnet like one of these two.

## Worked example

Assumed values: HOP = 4 ticks. Inbound trips arrive at tick 4. The NAT trip's marks are 0, 4, 8, 12, 16.

1. Public. Tick 0: outside, aimed at 192.0.2.10. Tick 2: place is the public subnet, from outside, along 0.5, arrived false. Tick 4: in the public subnet, arrived true.
2. Private, the Learn run. Tick 0: outside, aimed at 192.168.2.10. Tick 2: place is stopped at the boundary, along 0.5. Tick 4: still that place, along 1, arrived false. No sample on this trip has place private subnet or through the NAT.
3. NAT. Tick 0: private subnet. Tick 2: through the NAT, from the private subnet, along 0.5. Tick 4: through the NAT, the door shows 198.51.100.10. Tick 8: outside. Tick 10: through the NAT, from outside, along 0.5 (the reply). Tick 12: through the NAT. Tick 16: private subnet, arrived true.
4. Addresses. 192.168.2.10 is inside RFC 1918 §3 192.168.0.0/16. 192.0.2.10, 203.0.113.5, and 198.51.100.10 are RFC 5737 §3 TEST-NET-1, TEST-NET-3, and TEST-NET-2. None of them is a registry assignment. The examples drawn in RFC 3022 (10.33.96.5, 198.76.29.7, 138.76.28.4, and the rest) are not used here.

## Visual

Decision: one gate compound (A1), render anatomy-iso. The packet's place is the mechanism. The open bay, the wall, and the door are how the yards differ. No second figure. The chapter 3 cutaway and the five-machine network are not redrawn.

## Practice

Retrieval questions (with answer and why each wrong option is wrong):

1. The body is against the wall and has not taken the door. Did it arrive at 192.168.2.10? Answer: no. Place is stopped at the boundary. A wrong answer is "yes, private addresses are just another destination" — RFC 1918 §3 says those packets should not be forwarded across inter-enterprise links. A wrong answer is "the RFC names this wall as the only drop" — §5 recommends filters on the border routers and does not pick this one face. The location of the stop is the model's rule.
2. A private machine sends a body out. Where does the reply come back? Answer: through the same door, into the private subnet. A wrong answer is "through a second door" — this model has one, and RFC 3022 §1 requires the session's requests and responses on the same NAT router. A wrong answer is "it cannot come back" — §2.1 translates the return path.
3. The body aimed at 192.0.2.10 has finished. Where is it? Answer: in the public subnet. It arrived. A wrong answer is "TEST-NET-1 is a public route on the Internet" — RFC 5737 §4 says these blocks should not appear there. The arrival is the model's rule, using a documentation address in place of a registry address. A wrong answer is "it also stopped at the wall" — that is the private trip, which takes the same hop length and a different place.

Exercise (apply/transfer): A service has no static map and no second door. A packet from 203.0.113.5 is aimed at 192.168.2.10, and a moment later the private machine opens its own session outward. Say the place at the end of each trip, and which of those endings is the model's choice rather than the only reading of the RFC.
Spaced review: load-balancing can ask which of these two machines a street client can open a session to before any balancer is added. A later security chapter can ask what a static map would change about the private trip.

## Tabs

- Learn: the compound plays the failed trip, outside toward the private machine, ending stopped at the boundary. The prose names the rule, the documentation addresses, and the limit (the stop is the model's choice; a static map is not drawn). This tab does not offer the destination switch or a prediction.
- Lab: the learner chooses the public machine, the private machine, or the private machine going out through NAT, predicts whether it arrives, and presses Run. The figure stays still until Run. This tab does not replay the Learn tour as the only trip, and it does not paste the Learn caption.
- Quiz: three questions after the lab. The answer stays inside a disclosure until the learner opens it. The questions do not paste the Learn caption or the lab readout.

## Sources

- id: rfc1918
  title: Address Allocation for Private Internets (RFC 1918)
  author: Y. Rekhter, B. Moskowitz, D. Karrenberg, G. J. de Groot, E. Lear
  url: https://www.rfc-editor.org/rfc/rfc1918
  kind: spec
  published: 1996-02
  checked: 2026-10-29
  via: read
  supports: [an enterprise chooses its own addressing plan (§1); category 3 hosts need globally unambiguous addresses and are called public, and the other categories are private (§2); IANA reserved 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16 for private internets; private addresses are unique only inside the cooperating enterprises; private hosts can communicate inside the enterprise but cannot have IP connectivity outside, though they can use mediating gateways; public hosts use globally unique registry space and can reach public hosts outside; private addresses have no global meaning, so routing information about them shall not be propagated on inter-enterprise links, and packets with private source or destination addresses should not be forwarded across such links (§3); one layout plans the private part first, then public subnets where outside connectivity is needed, and separate media for public and private subnets; border routers should have packet and routing filters (§5)]
  note: >-
    Published text fetched from https://www.rfc-editor.org/rfc/rfc1918.txt on 2026-10-29.
    Section numbers are from that file. §4 and §6 were not used. §6 says security
    issues are not addressed. The 4-tick hop is an assumption of this chapter.
    The decision to stop the unsolicited packet on this one wall, rather than on
    whatever router is filtering, is a model choice.

- id: rfc5737
  title: IPv4 Address Blocks Reserved for Documentation (RFC 5737)
  author: J. Arkko, M. Cotton, L. Vegoda
  url: https://www.rfc-editor.org/rfc/rfc5737
  kind: spec
  published: 2010-01
  checked: 2026-10-29
  via: read
  supports: [192.0.2.0/24 (TEST-NET-1), 198.51.100.0/24 (TEST-NET-2), and 203.0.113.0/24 (TEST-NET-3) are for documentation (§3); addresses in those blocks should not appear on the public Internet, and operators should treat them as non-routeable (§4)]
  note: >-
    Published text fetched from https://www.rfc-editor.org/rfc/rfc5737.txt on 2026-10-29.
    192.0.2.10, 198.51.100.10, and 203.0.113.5 are inside those blocks. Using
    192.0.2.10 as a machine the model treats as reachable is a model choice.
    The RFC says the block should not appear on the public Internet. It stands
    in for a registry address this page does not have.

- id: rfc3022
  title: Traditional IP Network Address Translator (Traditional NAT) (RFC 3022)
  author: P. Srisuresh, K. Egevang
  url: https://www.rfc-editor.org/rfc/rfc3022
  kind: spec
  published: 2001-01
  checked: 2026-10-29
  via: read
  supports: [requests and responses of a session must be routed via the same NAT router (§1); traditional NAT lets private hosts reach the external network in most cases; sessions are uni-directional, outbound; the opposite direction may be allowed with static address maps; Basic NAT translates addresses, NAPT also translates a transport identifier (§2); a private source is translated to a global address before the packet is forwarded, and the return path is translated the same way (§2.1); NAPT maps an inside address and port to one registered address and an assigned port, and a static port map can direct an inbound service at one inside node (§2.2)]
  note: >-
    Published text fetched from https://www.rfc-editor.org/rfc/rfc3022.txt on 2026-10-29.
    Also opened, and not used as a section citation: the preface, the abstract,
    and §5.3's statement that a NAT router should not advertise private networks
    to the backbone. The worked examples in the RFC (10.33.96.5, 198.76.29.7,
    138.76.28.4, 10.0.0.10, 138.76.29.7) were read and were not copied into the
    picture, because several of them are not RFC 1918 or RFC 5737 addresses.
    The door address 198.51.100.10 is a documentation stand-in. This model does
    not translate a port and does not install a static map. Both omissions are
    stated on the page. Checksum adjustment, ICMP, and the FTP ALG were not used.

## Open questions / unverified

- No vendor VPC, subnet, or NAT-gateway document was fetched. The page does not state AWS, GCP, or Azure behavior.
- RFC 5737 §4 says the documentation blocks should not appear on the public Internet. The model's rule that a body aimed at 192.0.2.10 arrives is a teaching choice about the open yard, labelled as such.
- RFC 3022 §2 allows a static inbound map. This model drops the unsolicited packet. That drop is labelled as a model choice.
- The figure was not played in a browser in this unit, so the packet's screen position against the wall is unverified.
- `src/content/learn/source-catalog.ts` and `src/content/learn/chapters.ts` were left unchanged, so the course index and the sources page do not list this chapter yet. The page links to `/learn/sources#cloud-networking` anyway.

## Evidence

- model tests: pass — `npx vitest run src/lib/learn/cloud-networking-model.test.ts`, 6 tests (2026-10-29)
- lint: pass — `npx eslint` on the five new source files (2026-10-29)
- typecheck: not run as a pass — `npx tsc --noEmit` reports the existing `.next/types` errors for about, contact, and tech-stack. No cloud-networking file was in that list
- browser: not run — the shared browser was not used, and the dev server was not restarted
- keyboard: not run — the figure was not operated in a browser
- reduced motion: not run — prefers-reduced-motion was not exercised in a browser; useClock jumps mark to mark when that setting is on
- animation sense: not run — the figure was not played in a browser, so this line is not a pass

## Review findings

- spec review: not run — an independent reviewer was outside this unit


## Film upgrade · 2026-10-29

Objective: Routing chooses a next hop; NAT rewrites addresses. Neither replaces security policy.

Topology: Private app, NAT gateway, Public service.

1. Start inside a private network — A private address belongs inside the network. This example app has no public address.
2. Follow the route — The subnet route sends outbound traffic toward a NAT gateway.
3. Translate the source — NAT substitutes a public source address and tracks the mapping.
4. Map the reply back — The gateway uses its mapping to send the returning reply to the private app.
5. Keep policies separate — A valid route and NAT mapping do not guarantee that firewall rules allow the traffic.

Motion: sampleFilm().packet.x/y is message progress between named endpoints. Event state and captions share the same beat record. Five-second playback beats and geometry are scaled teaching aids, not network timings. Existing source records support reused claims; no new source access claimed. New film needs browser validation; old review evidence does not verify this upgrade.
