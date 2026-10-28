# DNS: from names to addresses

Id: dns · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: ip-and-ports · Related: tcp, udp-quic, http
Standard: anatomy-3d
Implementation: `src/app/learn/dns/page.tsx`, `src/components/learn/dns/DnsWalk.tsx`,
`src/lib/learn/dns-model.ts` (+ `.test.ts`), `src/content/learn/dns-sources.ts`.

## Boundary

Objectives (observable):

1. Predict that a stored address returns from the resolver and that the root, the TLD, and the authoritative server are not asked.
2. Put those three servers in the order a cache miss walks them, and say what each of the first two returns.
3. Predict that a missing name still walks all three servers and that no address comes back.

In scope: the stub asks a resolver; the resolver returns local information or walks referrals; a server answers from local data or refers closer; one name, one server per zone. One mechanism: how a name becomes an address, or a name error.

Deferred: the DNS message format and opcodes → not a chapter yet (RFC 1035, unread here). DNSSEC, TTL expiry as a clock, CNAME chains, and anycast of the root → later security and networking chapters. TCP’s retransmission → tcp.

Misconceptions targeted: the computer asks the root itself; a name is an address; a missing name skips the walk; a stored answer is checked against the authoritative server every time.

## Concept decomposition

Mental models: the resolver is the machine that walks. The computer asks once.
Mechanisms: local information first; otherwise a referral chain from the root toward the name.
Temporal behaviour: each server is one step. A stored answer has no server steps.
Quantitative relations: queries are 0 or 3 in this model. The address is not computed from the name.
Failure scenarios: the authoritative server reports that the name is not in the zone.
Trade-offs: storing the answer avoids the walk and can be stale. This chapter does not play the expiry.
Needs space or experiment: the body has to be on one machine at a time, or the walk is a list.
Hardest: a referral is not the address — the first two servers answer, and the answer is “ask over there”, which the figure shows by the body leaving for the next rack.
Hardest: storage wins — if the resolver already has the address, the question of whether the name exists is not asked, because that question is the walk.

## Parts you'll meet

Name: what we want. Here, www.example.com.
Address: where it is. Here, the documentation address 203.0.113.10, scripted as the zone’s answer.
Resolver: the program that asks name servers and deals with what comes back.
Referral: a response that names other servers closer to the name, instead of the address.
Name error: the server that holds the zone says the name is not in it.

## Storyboard

1. The learner sees a computer, a smaller machine, and three racks. One body sits on the computer. The question is where a name has to go before an address exists.
2. They press play. The body moves to the smaller machine, then to each rack. The line names the step. The first two racks do not keep the body. The last rack does, and the computer’s screen lights when the step’s kind is an answer.
3. In the lab they store the address first. The body returns from the smaller machine and the three racks stay dark.
4. They mark the name missing. The body still reaches the last rack, the screen stays dark, and the line says no address.

## Asset plan

Objective coverage: 1 → A1 · 2 → A1 · 3 → A1

### A1. Query walk

- objective: 1, 2, 3
- type: 3d
- object: a computer (case, screen, keys), a smaller machine with a slot, and three racks told apart by height, vents and a drawer, with one query body
- render: anatomy-iso
- fidelity: the body’s place and the query count are computed by resolve(); the address 203.0.113.10 is assumed, the same documentation address as chapter 3; one server per zone is assumed; time between steps is not a measured round trip
- pattern: step break
- learner sees: the body on the computer, three dark racks
- animated: the body moves to the step’s place (`at`); the screen lights only when the step kind is an answer
- learner does: on Learn, play and step the miss; in the lab, set stored or not and whether the name exists, predict, then run
- notice: a stored answer never reaches the racks; a miss visits them root, then TLD, then authoritative; a missing name still visits all three
- model: inputs cached and exists; state is the step index; rules in src/lib/learn/dns-model.ts; queries are 0 or 3
- feedback: the line under the drawing is the step’s sentence and the count of servers asked; the outcome line appears at the end of a lab run
- assumptions: no second server, no retry, no CNAME, no TTL clock, no packet loss; cached ignores exists
- outcome: the learner can predict the machines visited and whether an address returns
- accessibility: the step sentence is the text alternative; keyboard Previous and Next; reduced motion jumps mark to mark; the drawing is aria-hidden
- tests: src/lib/learn/dns-model.test.ts for cache, walk order, and name error
- evidence: rfc1034 §3.7, §4.1, §5.3.3, read
- built: `src/components/learn/dns/DnsWalk.tsx`, `src/lib/learn/dns-model.ts`, `src/lib/learn/dns-model.test.ts`, `src/app/learn/dns/page.tsx`

## Animation sense

### A1. Animation sense

- Mechanism: a resolver returns stored data, or follows referrals from the root toward the name until a server answers or reports a name error.
- Moving quantity: the query body.
- Model field: the step’s place (client, resolver, root, tld, or auth) and whether that step is an answer.
- Learner predicts: which machines the body will stand on, and whether the screen lights.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): rfc1034, via: read, 2026-10-28, §5.3.3 steps 1 and 4 and §4.1.

## Explanation (14 questions)

1. What is the problem? The computer has a name and needs an address.
2. Why does it matter? The wrong machine, or no machine, is what the packet in chapter 3 would be sent toward.
3. What would a beginner try first? Ask one server that knows every name.
4. Why does that work at first? A single file of names is enough for a small set of machines.
5. When does it fail? No one server can hold every name, and it cannot be updated everywhere at once.
6. What do we observe more carefully? A server either has the answer in its own data or points at servers closer to the name.
7. What is the real mechanism? The resolver looks locally first. On a miss it asks the root, follows referrals, and stops at an answer or a name error.
8. What can the learner change and watch? Whether an address is stored, and whether the name exists in the last zone.
9. What alternatives exist? The resolver walks (this chapter). A server may instead pursue the query itself, which the specification allows and does not require.
10. What are the trade-offs? Walking spreads the load and adds round trips. A stored answer skips the walk and can be out of date.
11. When should you choose it? When the name is not already stored and the zones are delegated.
12. When should you not? When you already have the address and it is still within its lifetime. This model does not show that lifetime.
13. Explain it in your own words. Where does the body go if the resolver already stored the address?
14. Where else does this apply? A cache in front of a service is the same first step: return what you stored, or go ask.

## Visual

One plate. The computer has a case, a screen and keys. The resolver is the smaller machine with a slot. The three racks differ by height, by vents, and by a drawer. The query is the only body that moves. Its place is the step. The screen lights only when that step’s kind is an answer. Words are in the step line, not on the faces.

## Tabs

- Learn: plays a cache miss for a name that exists. The body visits the resolver and then the three servers. The stored case is not this tab.
- Lab: the same model. The learner sets stored or not, and whether the name exists, predicts, then runs. The outcome waits until the run finishes.
- Quiz: three questions. The answer stays behind the disclosure.

## Practice

Retrieval: which machines a stored answer visits; the order of the three servers; what a missing name returns after the walk.
Exercise: trace www.example.com with nothing stored, then with the address stored. The model’s answers are the check.

## Sources

- id: rfc1034
  title: Domain Names — Concepts and Facilities (RFC 1034)
  author: P. Mockapetris
  url: https://www.rfc-editor.org/rfc/rfc1034
  kind: spec
  published: 1987-11
  checked: 2026-10-28
  via: read
  supports: [the user asks a resolver, which sends queries and handles referrals and errors (§3.7); a name server answers from local data with the answer or a referral to closer servers (§4.1); the resolver returns local information if it has it, otherwise follows a better delegation until an answer or a name error, and caches that (§5.3.3 steps 1 and 4)]
  note: >-
    Published text fetched from rfc-editor.org on 2026-10-28 (rfc1034.txt). Section numbers are from that text.
