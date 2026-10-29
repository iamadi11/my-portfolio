# API design: contracts between programs

Id: api-design · Stage: 2 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: http · Related: rest, rpc, graphql, idempotency
Standard: anatomy-3d
Implementation: `src/app/learn/api-design/page.tsx`, `src/components/learn/api-design/ContractPlate.tsx`,
`src/lib/learn/api-design-model.ts` (+ `.test.ts`), `src/content/learn/api-design-sources.ts`.

## Boundary

Objectives (observable, numbered):

1. Name what this plate promises a caller: method GET, the teaching target item, status 200 when that call matches, and status 405 when the method is not allowed.
2. Predict that a call which agrees on the method, the target, and the assigned status is accepted, and that a call which breaks a promised part is refused, with the body seated or not seated accordingly.
3. Say that the caller relies on the status the plate assigns, not on a success it hoped for, and that item is a teaching label rather than a company's API.

In scope: one caller, one contract plate, one body. The contract is the method GET, the target item, and the client error 405 when the method is not GET. A matching call finds a current representation and is assigned 200. A breaking call is POST on the same target and is assigned 405. The body's place, accepted or refused, is the model field.

Deferred: resource-oriented design of many resources → rest. RPC and gRPC → rpc. Client-shaped queries → graphql. Retries and idempotency → idempotency. Header-field values, including the Allow list a 405 response must carry (§15.5.6) → named, not drawn. A target this plate does not provide, assigned 404, is in the model and not played on the figure. Protocol version (§6.2) is not varied. Other methods besides GET and POST. A real product URI. The word "contract" is this chapter's name for what a caller can rely on. RFC 9110 does not use that word. It defines the expected behavior of recipients (§1.1).

Misconceptions targeted: any status the caller hoped for is a success; 405 means the server is down; a method this plate does not allow can still be relied on as 200; the teaching label item is a company's resource; 404 and 405 are the same fact.

## Concept decomposition

Mental models: the body is the call. The caller is the stand it leaves. The plate is the contract. The body either seats or it does not.
Mechanisms: the place is accepted only when the method, the target, and the assigned status all agree. GET on item is assigned 200. POST on item is assigned 405. The caller sees the place the plate assigned, not a success the call merely hoped for.
Temporal behaviour: two stops. The body is with the caller, then it is at the place `judge` assigned. A time between those stops is the body moving. There is no travel duration in the specification.
Quantitative relations: the statuses are 200, 404, and 405, taken from RFC 9110. No duration is taken from the specification.
Failure scenarios: POST on item. The method part fails. The plate assigns 405. The body is refused. A claim of 200 for that POST does not agree.
Trade-offs: one plate can show what a caller may rely on for one target and one allowed method. It cannot show a second resource, a header value, or a product API.
Needs space or experiment: the body has to be able to sit with the caller, seat in the plate, or stand off the seat where the caller can still see it.
Hardest: agreement is three parts at once. A call is accepted only when the method, the target, and the assigned status all hold, so a named error that is "correct" for a disallowed method still leaves the body refused (A1).
Hardest: 405 is a client error the caller can rely on, and it is not a success. The body stays off the seat so the caller does not see 200 (A1).
Hardest: 200 means the request succeeded and the 2xx class means it was accepted. Hoping for 200 when the plate assigned 405 is relying on a status the contract does not give (A1).

## Parts you'll meet

Caller: the stand the body leaves.
Plate: the contract. Method GET, target item, named client error 405.
Body: the call. Its place is accepted or refused.
Accepted: the body has seated. The three promised parts agreed. Status 200.
Refused: the body has not seated. A promised part broke. For the played break, status 405.
Teaching target: the label item. Not a product URI.

## Storyboard

1. The learner sees one caller and one plate, with a single body on the caller. The question is whether the caller can rely on this call.
2. On Learn, the body leaves the caller and seats. The line says status 200 and that the call was accepted. Previous and Next step those two stops.
3. In the lab the learner chooses the matching call or the call that uses POST, predicts accepted or refused, and presses Run. The body stays with the caller until then.
4. After Run the body seats, or it finishes off the seat. The line names 200 or 405. The verdict compares the prediction with the place.

## Asset plan

Objective coverage: 1 → A1 · 2 → A1 · 3 → A1

### A1. One contract plate

- objective: 1, 2, 3
- type: 3d
- object: one caller stand and one contract plate; the body is the call, and it seats only when the call matches
- render: anatomy-iso
- fidelity: place, status, and the three agreement flags are computed by agrees() and judge(); 200, 404, and 405 are the codes RFC 9110 defines for the cases this plate assigns; the matching call finding a current representation, and this plate allowing only GET, are assumed; item is a teaching label; nothing is faked as a packet capture or a company's API
- pattern: step predict
- learner sees: a caller stand, rails, a plate with a pocket, a block off that pocket, and one body
- animated: the body translates from the caller to the seat when place is accepted, and from the caller to the block off the seat when place is refused; the motion is a screen translate of that place
- learner does: on Learn, play and step the matching call; in the lab, choose the matching call or the call that breaks the method, predict accepted or refused, then run
- notice: the body ends seated only for the call that agrees; the other call ends off the seat, and the status is 405 rather than 200
- model: inputs offer (match or break) and, for a claim, method, target, and status; state is judge() and agrees() in src/lib/learn/api-design-model.ts; place is accepted only when method, target, and the assigned status all agree
- feedback: the line under the drawing is readout(); the lab adds outcome() and the prediction verdict when the body has arrived
- assumptions: one plate, GET only, a current representation for the matching call, no header value drawn, no protocol version, item is not a product
- outcome: the learner can say whether the body was accepted or refused, which status the caller can rely on, and that a hoped-for 200 is not that status when a promised part broke
- accessibility: the step sentence is the text alternative; the drawing is aria-hidden; keyboard Previous and Next; reduced motion jumps from stop to stop; the lab draws no run until Run
- tests: src/lib/learn/api-design-model.test.ts for the three-part agreement, the learn acceptance, the 405 refusal, the 404 target, a false 200, and the readout
- evidence: rfc9110 §1.1, §1.3, §2.4, §3.1, §3.4, §6.2, §7.1, §9.1, §9.3.1, §15, §15.3, §15.3.1, §15.5, §15.5.5, §15.5.6, read
- built: `src/components/learn/api-design/ContractPlate.tsx`, `src/lib/learn/api-design-model.ts`, `src/lib/learn/api-design-model.test.ts`, `src/app/learn/api-design/page.tsx`

## Animation sense

### A1. Animation sense

- Mechanism: a caller offers one call; the plate accepts it only when the method, the target, and the status the plate assigns all agree, and otherwise the caller sees the refusal rather than a success.
- Moving quantity: the call body.
- Model field: place, accepted or refused, from judge().
- Learner predicts: whether that body will be accepted or refused.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): rfc9110, via: read, 2026-10-29, §1.1, §1.3, §2.4, §3.1, §3.4, §6.2, §7.1, §9.1, §9.3.1, §15, §15.3, §15.3.1, §15.5, §15.5.5, §15.5.6.

## Explanation (14 questions)

1. Problem: one program calls another. The caller has to know which calls the other program will stand behind, and what it will say when a call does not fit.
2. Why it matters: a caller that treats every answer as success will store a result the plate never promised. A caller that treats every client error as a dead server will retry a call the plate has already refused.
3. What would a beginner try first? Send the method they find convenient, and read any response that comes back as success.
4. Why does that work at first? A single caller, a single target, and a server that happens to allow that method, looks like one kind of call.
5. When does it fail? The method is one the plate does not allow. The caller still looks for status 200. The plate assigned 405.
6. What do we observe more carefully? The same body either seats, and the line says 200, or it finishes off the seat, and the line says 405.
7. What is the real mechanism? A request carries a method and a request target, and may carry header fields. A response carries a status code, and may carry header fields and content (RFC 9110 §3.4, §6.2). The client uses the status code to see whether its intention was carried out (§1.3). GET on the teaching target item, with a current representation, is assigned 200, which means the request succeeded and, for GET, the content is a representation of the target (§9.3.1, §15.3.1, §15.3). A recognized method this plate does not allow is assigned 405, a client error, not a success (§9.1, §15.5.6, §15, §15.5). The place is accepted only when the method, the target, and that assigned status all agree. The chapter calls those three parts the contract. The RFC's words are the expected behavior of recipients (§1.1), not the word contract.
8. What can the learner change and watch? The offer: the matching call, or POST on the same target. The prediction is accepted or refused.
9. What alternatives exist? A target this plate does not provide is assigned 404, which means no current representation was found or the server will not disclose one (§15.5.5). The figure does not play that offer. A 405 response must also carry Allow (§15.5.6). This page does not draw that field. A client must understand the class of a status code, the first digit, even when the exact code is unfamiliar (§15).
10. What are the trade-offs? One plate makes the promise visible. It hides every other resource, every header value, and any server that answers a disallowed method with something other than 405. Section 9.1 says the server should send 405 in that case. This plate does.
11. When should you choose it? When the caller needs a stable method, a stable target, and a status it can read without guessing, including the client error for a method the resource does not allow.
12. When should you not treat this picture as an API design? When you need many resources, a method's idempotency, a header value, or a product's real URI. Those are later chapters or a real interface, and they are not running here.
13. Explain it in your own words. The body has stopped. Is it seated, and which status is the one the caller can rely on?
14. Where else does this apply? A ticket window that honors one kind of request for one window, and hands back a marked refusal for any other kind, is the same split. It stops being the same when the refusal depends on a header this plate does not show, or on a second window.

## Worked example

Learn, locked by judge('match'): method GET, target item, status 200, place accepted, broken null.

- At clock 0 the body is with the caller. The place has not been shown yet.
- At clock 1 the body is seated. agrees() is true for the method, the target, and the assigned status. The line says the call was accepted and names status 200.

The break, from judge('break'):

- Method POST, target item. assignedStatus is 405. The method part fails, so the place is refused even though 405 is the error the plate names for that method.
- A claim that this POST returned 200 fails the error part as well. The plate does not assign 200. The body is refused. The caller sees 405, not a success.

A different target, not played on the figure: GET on other is assigned 404. The target part fails. The place is refused. Claiming 200 for it is also refused.

## Visual

One caller and one plate. Feet, screws, a base, and a blank nameplate. The caller is a plinth, a bed, a back wall, two cheeks, a post, and a knob. Two rails, four bushings, and a ticked strip join it to the plate. The plate is a plinth, a pocket floor, a back jaw, two side jaws, a low lip, three pins, and two clamp screws. A pedestal stands off the pocket. The body is the only part that translates. It ends in the pocket when the place is accepted, and on the pedestal when the place is refused. Words stay in the step line.

## Practice

Retrieval: what the body does on the Learn call; what status POST on item is assigned; why a hoped-for 200 on that POST is not the status the caller can rely on.
Exercise: run the lab for the matching call and for the POST. The model's outcomes are the check: accepted and 200; refused and 405, not 200.
Spaced review: rest can ask which part of this contract a resource-oriented interface still has to keep. idempotency can ask what this chapter already fixed about relying on a status. The Allow field's value stays unnamed.

## Tabs

- Learn: auto-plays the GET on item that finds a current representation. The body seats and the line says status 200. Previous and Next step the caller stop and the seated stop. Learn does not ask for a prediction and does not offer POST.
- Lab: the same model. The learner chooses the matching call or the POST, predicts accepted or refused, and presses Run. The body stays with the caller until then. The verdict uses the place after the body has arrived.
- Quiz: three questions. The answer stays behind the disclosure. The questions do not paste the Learn caption or the lab readout.

## Sources

- id: rfc9110
  title: HTTP Semantics (RFC 9110)
  author: R. Fielding, M. Nottingham, J. Reschke (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9110
  kind: spec
  published: 2022-06
  checked: 2026-10-29
  via: read
  supports: [A request has a method and a request target and may have header fields, and a response includes a status code and may have header fields and content (§3.4); request control data includes the method and request target, and response control data includes a status code (§6.2); the client examines status codes to see whether its intentions were carried out (§1.3); the method is the primary source of request semantics and says what the client expects on success, POST is a defined method, and a recognized method that is not allowed for the target should be answered 405 (§9.1); the target of a request is a resource, and a resource cannot treat a request inconsistently with the method (§3.1); the request target identifies that resource (§7.1); GET requests a current representation and retrieval is usually a 200 (§9.3.1); 200 means the request succeeded, and for GET the content is a representation of the target (§15.3.1); the 2xx class means the request was received, understood, and accepted (§15.3); the first digit is the class, 2xx is successful, and 4xx is a client error (§15); a recipient must interpret a protocol element by the semantics defined for it (§2.4); 404 means no current representation was found or the server will not disclose that one exists (§15.5.5); 405 means the method is known by the origin server but not supported by the target resource, and a 405 response must include Allow (§15.5.6); the specification defines expected recipient behavior rather than what happens behind the interface (§1.1)]
  note: >-
    Published text fetched from https://www.rfc-editor.org/rfc/rfc9110.txt on 2026-10-29.
    Sections read in that file: §1.1, §1.2, §1.3, §2.4, §3.1, §3.2, §3.3, §3.4, §3.5 (opening, through the sentence that a user agent need not have a human present), §6.2, §6.3, §6.4 (opening definition of content), §7.1, §7.2 (opening sentence), §9.1 including Table 4, §9.2.1 through the sentence that a user agent should distinguish safe and unsafe methods, §9.3.1, §15 introduction, §15.1, §15.2 opening through the proxy forwarding rule, §15.3, §15.3.1, §15.3.2 opening, §15.5, §15.5.1, §15.5.2, §15.5.3, §15.5.4, §15.5.5, §15.5.6, §15.5.7 opening sentence.
    Section numbers are from that file. §9.3.3 was not read. POST is cited only from the §9.1 table. §10.2.1 was not read. Allow is cited only from the requirement in §15.5.6, and no field value is invented. The word contract is not in the sections read.

## Open questions / unverified

- The figure was not played in a browser. Reduced motion, keyboard steps, and the body's seat on screen are unverified.
- RFC 9110 §10.2.1 (Allow) was not read. The page names the obligation from §15.5.6 and does not describe the field's syntax.
- RFC 9110 §9.3.3 (POST) was not read. The page does not describe POST's processing rules.
- The sources page does not list this chapter yet. Citations link to anchors that are not on that page until the catalog is wired.

## Evidence

- model tests: pass — `npx vitest run src/lib/learn/api-design-model.test.ts` (11 tests, 2026-10-29)
- eslint: pass — `npx eslint` on the chapter files (2026-10-29)
- browser: not run — the shared browser was not used
- animation sense: not run — the figure was not played in a browser, so this line is not a pass
- spec review: not run — no fresh reviewer in this unit

## Review findings

- spec review: not run — browser check and an independent reviewer were outside this unit


## Film upgrade · 2026-10-29

Objective: An API is a contract: callers rely on documented inputs, outputs and errors.

Topology: Your browser, API contract, App server.

1. Agree before calling — An application programming interface, or API, specifies how one program can use another.
2. Send a matching call — The client supplies the promised method and target.
3. Execute the operation — The service handles the call according to its contract.
4. Return a documented result — The caller can distinguish success from a documented error.
5. Reject a mismatched method — A disallowed method does not silently become a successful read.

Motion: sampleFilm().packet.x/y is message progress between named endpoints. Event state and captions share the same beat record. Five-second playback beats and geometry are scaled teaching aids, not network timings. Existing source records support reused claims; no new source access claimed. New film needs browser validation; old review evidence does not verify this upgrade.
