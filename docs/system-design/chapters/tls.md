# TLS: encrypted, authenticated connections

Id: tls · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: tcp · Related: http, udp-quic, security-map
Standard: anatomy-3d
Implementation: `src/app/learn/tls/page.tsx`, `src/components/learn/tls/TlsHandshake.tsx`,
`src/lib/learn/tls-model.ts` (+ `.test.ts`), `src/content/learn/tls-sources.ts`.

## Boundary

Objectives (observable, numbered):

1. Predict that a body still on the handshake is a step the other side can read, and that the application body has not left yet.
2. Predict that once the application body is on the wire it is sealed, so the wire body is not the plaintext, and that the plaintext exists only inside the receiver after that body arrives.
3. Predict that skipping the check that the server is the expected one still delivers the sealed body, and that the outcome says the name was not checked.

In scope: one client, one server, one wire, four bodies in order (client hello, server hello, one finished step, one application body), a lid that is on only for the application body, and one switch for the name check. One mechanism: application bytes are not what travels until the handshake has finished. Before that, the body on the wire is a handshake message the other side can read as a step. After that, the body on the wire is sealed and the plaintext exists only inside the receiver.

Deferred: the second Finished, EncryptedExtensions, Certificate, and CertificateVerify → RFC 8446 §2 Figure 1 draws them; this model sends one finished body. 0-RTT early data → §2.3, which can put application data on the first flight with weaker guarantees. HelloRetryRequest → §2.1. PSK resumption → §2.2. Record fragmentation, padding, and alerts other than the ones named below → §5 and §6. The key schedule and AEAD construction → §7 and §5.2 name them; this chapter does not compute them. Hostname matching rules → RFC 6066, not read. Certificate path validation → §4.4.2.4 points at RFC 5280, not read. The `unrecognized_name` alert → §6.2, a server saying it has no server for the offered name; this model does not send it. TCP loss and retransmission → tcp. HTTP → http.

Misconceptions targeted: the application's byte is what travels during the handshake; a sealed body on the wire is the plaintext; skipping the name check stops the sealed body from arriving; sealing and checking the name are the same act.

## Concept decomposition

Mental models: the cartridge is the body on the wire. The lid is the seal. The piece in the far pocket is the plaintext, and it is a different object from the cartridge. The plunger is the name check.
Mechanisms: handshake bodies travel open, and the far machine reads each one as a step. The application body leaves only after the finished step has arrived, and it travels sealed. The plaintext is inside the receiver only then. The name check can be skipped without changing that flight.
Temporal behaviour: each body is on the wire for FLIGHT ticks, then rests REST ticks before the next leaves. The name becomes checked at the server hello's arrival when the switch is on. The handshake is finished at the finished step's arrival.
Quantitative relations: four bodies, FLIGHT = 4 ticks, REST = 2 ticks, depart(i) = i × (FLIGHT + REST), along = time in flight / FLIGHT. All of those durations are assumed. `wire` is the step name, or the token `sealed`, which is not `PLAINTEXT`.
Failure scenarios: the client skips the check that the server is the expected one. The sealed body still arrives. The plunger stays up. The outcome says the name was not checked.
Trade-offs: drawing the finished step with the lid off makes the step readable in the picture, and it is less faithful than Figure 1, where that message is already under handshake keys. Checking the name does not add ticks in this model. Skipping it keeps the seal and drops the check the specification expects.
Needs space or experiment: the cartridge has to be in one place, the lid has to be able to be on or off, and the plaintext has to be able to exist only in the far pocket.
Hardest: until the finished step has arrived, the body on the wire is a handshake step the other side reads, and the application body has not left (A1).
Hardest: a sealed cartridge on the wire is not the plaintext — the plaintext is the other piece, and only inside the receiver after arrival (A1).
Hardest: skipping the name check leaves the plunger up and still delivers the sealed body; the outcome says the name was not checked (A1).

## Parts you'll meet

Cartridge: the one body. Its place is sender, wire, or receiver.
Lid: on only when that body is sealed. In this model, only the application body.
Plaintext: the application's byte. It is drawn in the far pocket, and only after the sealed body has arrived.
Plunger: down when the client has checked that the server is the expected one. Up otherwise.
Tick: an assumed unit of time in this model. Not a measured round trip.
Handshake: the steps before the application body. Here, three of them.
Sealed: the wire carries a seal token, not the plaintext.

## Storyboard

1. The learner sees two machines on one bench, a cable between them, and a plunger standing up on the near machine. The question is what the cartridge is while it travels, and what arrives inside the far pocket.
2. On Learn, the cartridge leaves the near machine with no lid, reaches the far machine, and comes back the other way as the server's hello. The plunger drops. A third open cartridge, the finished step, goes to the far machine. Then a cartridge with a lid crosses, and a separate piece appears in the far pocket.
3. In the lab the learner keeps the check or skips it, predicts the outcome, and presses Run. The bench stays still until then. Skipping the check leaves the plunger up. The lidded cartridge still arrives, and the piece still appears in the pocket.

## Asset plan

Objective coverage: 1 → A1 · 2 → A1 · 3 → A1

### A1. Sealing bench

- objective: 1, 2, 3
- type: 3d
- object: a sealing bench with a near press and a far pocket, a cable between them, one cartridge, a lid, an inner piece, and a plunger
- render: anatomy-iso
- fidelity: computed: place, along, sealed, wire, plaintextInside, nameChecked, and handshakeDone from frameAt(); assumed: FLIGHT of 4 ticks, REST of 2 ticks, four bodies, one finished step, the name check at the server hello's arrival, and one application byte; the tick is not a measured round trip; nothing is faked as a live capture
- pattern: step break predict
- learner sees: two machines, a cable, a raised plunger, and no cartridge until the run starts
- animated: the cartridge moves to the place and along of the current body; the lid is present only when sealed is true; the inner piece is present only when plaintextInside is true; the plunger is down only when nameChecked is true
- learner does: on Learn, the run plays and the learner can pause and step; in the lab, choose the name check or skip it, predict the outcome, then run
- notice: the lid stays off through the three handshake bodies; the application body is the one with the lid; the inner piece never rides the cable; skipping the check does not take the lid off
- model: input checkName (boolean); state is frameAt(checkName, t) in src/lib/learn/tls-model.ts; wire is the step or the token sealed; that token is not PLAINTEXT; the flights do not depend on checkName
- feedback: the line under the drawing is the event sentence plus place, sealed, plaintextInside, and nameChecked; the lab adds the outcome sentence and the prediction verdict when the sealed body has arrived
- assumptions: one wire, one finished body drawn with the lid off, no certificate message, no 0-RTT, no cipher arithmetic, the name check is a switch timed at the server hello's arrival
- outcome: the learner can say whether the cartridge is a handshake step or sealed, that the sealed wire body is not the plaintext, and that a skipped name check still delivers the sealed body
- accessibility: the step sentence is the text alternative; the drawing is aria-hidden; keyboard Previous and Next; reduced motion jumps from event to event; the lab draws no run until Run
- tests: src/lib/learn/tls-model.test.ts for the order, the along fraction, and that sealed means the wire body is not the plaintext
- evidence: rfc8446 §1, §2, §4.4.2.2, §4.4.2.4, §4.4.4, §5.1, §5.2, Appendix C.2, Appendix C.5, read
- built: `src/components/learn/tls/TlsHandshake.tsx`, `src/lib/learn/tls-model.ts`, `src/lib/learn/tls-model.test.ts`, `src/app/learn/tls/page.tsx`

## Animation sense

### A1. Animation sense

- Mechanism: application bytes are not what travels until the handshake has finished; the body on the wire is then sealed, and the plaintext exists only inside the receiver.
- Moving quantity: the cartridge, including whether its lid is on.
- Model field: place (sender, wire, or receiver) and along (0 at the sending end of this trip to 1 at the receiving end), plus sealed (true only for the application body), all from frameAt, in assumed ticks. The plunger's height equals nameChecked. The inner piece is present only when plaintextInside is true.
- Learner predicts: that the sealed body arrives either way, and that the outcome says the name was checked or was not checked.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): rfc8446, via: read, 2026-10-29, §1, §2, §4.4.2.2, §4.4.2.4, §4.4.4, §5.1, §5.2, Appendix C.2, Appendix C.5. Fetched https://www.rfc-editor.org/rfc/rfc8446.txt.

## Explanation (14 questions)

1. Problem: the application has a byte to send to a named server. Before these two machines agree, that byte is not what should be on the wire.
2. Why it matters: someone who can read or change the wire can see the byte, or can stand in as the server. RFC 8446 §1 says the channel is meant to stop eavesdropping, tampering, and forgery, and that the server side is authenticated.
3. What would a beginner try first? Put the application's byte on the wire as the first body, and treat a reply as proof that the far machine is the right one.
4. Why does that work at first? On a wire nobody else can touch, the byte arrives, and the machine that answers is the one you plugged in.
5. When does it fail? When someone else can read the wire, or can answer in the server's place. Appendix C.5 says that using a key from a certificate without validating the chain or its contents has no protection against an active attacker in the middle.
6. What do we observe more carefully? The first three cartridges have no lid, and the far machine reads each one as a step. The fourth cartridge has a lid. The inner piece appears only in the far pocket, and only after that cartridge arrives. Skipping the check leaves the plunger up and does not remove the lid.
7. What is the real mechanism? The handshake establishes shared keying material and, once complete, the peers protect application traffic with those keys (RFC 8446 §2). Application data must not be sent before Finished, except the early data in §2.3, which this model does not draw. While record protection is off, a plaintext record is written on the wire; application data records are always protected and must not be written unprotected (§5.1). Protection turns plaintext into ciphertext, and opening it yields plaintext or a failure (§5.2). In this model, depart(i) = i × (FLIGHT + REST) and arrive(i) = depart(i) + FLIGHT, with FLIGHT = 4 ticks and REST = 2 ticks, both assumed. along = time in flight / FLIGHT. The wire value is the step name, or `sealed`. `sealed` is not the plaintext string. Worked times, assumed: client hello 0→4, server hello 6→10, finished 12→16, application 18→22. At tick 20 the application body is on the wire, along = 0.5, sealed, plaintextInside false. At tick 22 it is in the receiver and plaintextInside is true.
8. What can the learner change and watch? Whether the client checks that the server is the expected one. The flights stay the same. The plunger and the outcome sentence change.
9. What alternatives exist? The full handshake in Figure 1 (§2), which also sends encrypted extensions and, when a certificate is used, a certificate and a certificate verify, and a Finished from each side. PSK resumption (§2.2), which does not send a certificate. 0-RTT early data (§2.3), which can send application data on the first flight. An unprotected byte on the wire, which is the beginner's design in question 3.
10. What are the trade-offs? The full handshake pays the flights in Figure 1 and gets the properties in §1. 0-RTT saves a wait and §2.3 says its data is not forward secret and has weaker replay protection. Skipping the name check saves no ticks here and, by Appendix C.5, drops protection against an active attacker in the middle. Drawing Finished with the lid off keeps one moving cartridge readable as a step, and it hides that Figure 1 already protects that message with handshake keys.
11. When should you choose it? When the application needs the byte hidden from the wire and needs the far machine to be the expected one. This picture is the moment the body changes from a handshake step to a sealed application body.
12. When should you not treat this picture as the whole protocol? When you need both Finished messages, the certificate, 0-RTT, a computed timeout, or the cipher arithmetic. TCP loss is the previous chapter. HTTP, which rides on this channel, is the next one, and it is not written yet.
13. Explain it in your own words. The lid is on and the cartridge is halfway across. Where is the application's byte, and has the name been checked?
14. Where else does this apply? A later hop that seals a message before the far name is checked has the same split: the body can arrive sealed while the check was skipped. QUIC carries a related handshake in a later chapter.

## Worked example

Assumed values: FLIGHT = 4 ticks, REST = 2 ticks. depart(i) = i × 6. arrive(i) = depart(i) + 4.

1. Tick 0–4: client's hello, open, client to server. At tick 4 the server has read that step.
2. Tick 6–10: server's hello, open, server to client. At tick 10, if checkName is true, nameChecked becomes true. If false, it stays false. The body fields match either way.
3. Tick 12–16: finished, open, client to server. handshakeDone becomes true at tick 16. The application body has not left.
4. Tick 18–22: application, sealed. At tick 20, place is wire, along is 0.5, wire is `sealed`, plaintextInside is false. At tick 22, place is receiver, plaintextInside is true.
5. Outcome at tick 22: `checked` if the switch was on, `unchecked` if it was skipped. The sealed body has arrived in both runs.

## Visual

Decision: one sealing bench (A1), render anatomy-iso. The cartridge's place and lid are the mechanism. The plunger is the name-check fault. No second figure.

## Practice

Retrieval questions (with answer and why each wrong option is wrong):

1. The lid is on and the cartridge is on the cable. Where is the application's byte? Answer: not on the cable, and not inside yet. It appears in the far pocket only when the sealed body arrives. A wrong answer is "in the cartridge, readable on the wire" — that treats the seal token as the plaintext. A wrong answer is "already inside" — plaintextInside is false until place is receiver.
2. The server's hello has just arrived. Has the application body left? Answer: no. Finished leaves next, at tick 12, and the application body at tick 18. A wrong answer is "yes, the hello was enough" — §2 says application data must not be sent before Finished, apart from early data this model does not draw.
3. The check is skipped and the sealed body has arrived. What is true? Answer: the byte is inside, and the name was not checked. A wrong answer is "the body never left" — the flights do not depend on the check. A wrong answer is "sealing failed" — sealed is still true. Appendix C.5 is why the skipped check still matters.

Exercise (apply/transfer): A service seals the request body and does not compare the server name. Say what this model would show at tick 22, and what Appendix C.5 says that picture leaves out.
Spaced review: http can ask where the request byte is while the handshake cartridge is still open. udp-quic can ask which of these bodies would move if the handshake were carried on another transport. security-map can ask what remains when the seal arrives and the name was not checked.

## Tabs

- Learn: the bench plays the checked handshake, then the sealed application body. The prose names the rule and the limit (Finished is drawn open here; Figure 1 already protects it). This tab does not offer the skip switch or a prediction.
- Lab: the learner chooses the name check, predicts the outcome, and presses Run. The flights match Learn. The plunger and the outcome sentence show the skip. This tab does not repeat the handshake tour.
- Quiz: three questions after the lab. The answer stays inside a disclosure until the learner opens it. The questions do not paste the Learn caption or the lab readout.

## Sources

- id: rfc8446
  title: The Transport Layer Security (TLS) Protocol Version 1.3 (RFC 8446)
  author: E. Rescorla
  url: https://www.rfc-editor.org/rfc/rfc8446
  kind: spec
  published: 2018-08
  checked: 2026-10-29
  via: read
  supports: [TLS provides a channel against eavesdropping, tampering, and forgery; the server side is authenticated and the client side is optional; confidentiality and integrity apply to data after establishment (§1); the handshake negotiates version and algorithms, optionally authenticates, and establishes shared keys; once complete, those keys protect application traffic; Figure 1 marks Finished with handshake traffic keys and Application Data with application traffic keys; everything after the key-exchange phase is encrypted; Application Data must not be sent before Finished except as in §2.3 (§2); 0-RTT early data has weaker forward secrecy and replay properties (§2.3); server_name guides certificate selection and clients should send it when applicable (§4.4.2.2); detailed certificate validation is out of scope for TLS (§4.4.2.4); Finished is the last message in the authentication block; a side may send application data once it has sent Finished and received and validated the peer's Finished, with two stated exceptions (§4.4.4); before record protection, TLSPlaintext is written on the wire; application data is always protected and must not be written unprotected (§5.1); record protection turns plaintext into ciphertext and deprotection yields plaintext or an error (§5.2); implementations are responsible for verifying certificates (§Appendix C.2); using a public key in a certificate without validating the chain or its contents is vulnerable to a man-in-the-middle and unsafe for general use, and applications must not use TLS that way without an explicit configuration or profile (§Appendix C.5)]
  note: >-
    Published text fetched from https://www.rfc-editor.org/rfc/rfc8446.txt on 2026-10-29.
    Section numbers are from that file. Also opened, and not used as the lesson:
    the HandshakeType enum at the start of §4, the signature_algorithms requirement
    that a client which wants certificate authentication must send that extension (§4.2.3),
    the CertificateVerify structure and the rule that the receiver must verify it (§4.4.3),
    and the unrecognized_name alert (§6.2). RFC 6066, RFC 5280, RFC 5116, and RFC 7250
    are cited from this file and were not read. The key schedule in §7 was not read.
    The 4-tick flight and the 2-tick rest are assumptions of this chapter.
    A course note says RFC 9846 obsoletes this document; that file was not opened
    in this unit, so no section number here is taken from it.

## Open questions / unverified

- RFC 9846 was not fetched. The course scoping note says it obsoletes RFC 8446 and that its section numbers differ. This chapter cites only RFC 8446, which was the file actually read.
- RFC 6066 (server name matching), RFC 5280 (path validation), and RFC 5116 (AEAD) were not read. The name check in the model is an assumed switch, not those algorithms.
- The figure was not played in a browser in this unit, so the cartridge's position on the cable is unverified.
- `src/content/learn/source-catalog.ts` and `src/content/learn/chapters.ts` were left unchanged, so the course index and the sources page do not list this chapter yet. The page links to `/learn/sources#tls` anyway.

## Evidence

- model tests: pass — `npx vitest run src/lib/learn/tls-model.test.ts` (2026-10-29)
- lint: pass — `npx eslint` on the chapter files (2026-10-29)
- typecheck: not run — `npx tsc --noEmit` exits 1 on existing `.next/types` errors for about, contact, and tech-stack (12 errors). No tls file was in that list, so this unit does not record a pass
- browser: not run — the shared browser was not used, and the dev server was not restarted
- keyboard: not run — the figure was not operated in a browser
- reduced motion: not run — prefers-reduced-motion was not exercised in a browser; useClock jumps mark to mark when that setting is on
- animation sense: not run — the figure was not played in a browser, so this line is not a pass

## Review findings

- spec review: not run — browser check and an independent reviewer were outside this unit


## Film upgrade · 2026-10-29

Objective: TLS authenticates the peer and protects application data; it does not make the application itself trustworthy.

Topology: Your browser, Network observer, App server.

1. Agree on protection — The client begins a handshake, offering supported parameters and key exchange information.
2. Prove the server identity — The server sends authentication information. The browser checks the certificate and handshake proof.
3. Derive traffic keys — Both ends derive keys. These keys protect the following application data.
4. Send encrypted data — An observer on the network sees encrypted traffic rather than the plaintext application message.
5. Know the boundary — A secure channel to a malicious service is still a secure channel to a malicious service.

Motion: sampleFilm().packet.x/y is message progress between named endpoints. Event state and captions share the same beat record. Five-second playback beats and geometry are scaled teaching aids, not network timings. Existing source records support reused claims; no new source access claimed. New film needs browser validation; old review evidence does not verify this upgrade.
