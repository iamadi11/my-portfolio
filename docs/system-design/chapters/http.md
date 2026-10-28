# HTTP: methods, status codes and headers

Id: http · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: tcp · Related: tls, udp-quic, http-versions, api-design
Standard: anatomy-3d
Implementation: `src/app/learn/http/page.tsx`, `src/components/learn/http/HttpExchange.tsx`,
`src/lib/learn/http-model.ts` (+ `.test.ts`), `src/content/learn/http-sources.ts`.

## Boundary

Objectives (observable, numbered):

1. Name what a request message carries (method, request target, header fields) and what a response message carries (status code, header fields), and where the message sits.
2. Given GET, PUT, or POST, and whether a current representation is already stored, predict the status this resource sends and whether the stored representation changes.
3. Say that GET leaves the stored representation alone, that 404 on this press means no current representation was found, and that 201 means one or more new resources were created.

In scope: one resource, one message, methods GET, PUT, and POST, and whether a current representation exists before the request. One mechanism: the message is a method, a target, and header fields on the way in, and a status code and header fields on the way back. What the resource does is the model.

Deferred: a lost request or a lost response, and any retry → client-server. TLS, and the `https` scheme named in the RFC abstract → tls. UDP and QUIC → udp-quic. Other methods (HEAD, DELETE, CONNECT, OPTIONS, TRACE), content negotiation, caching, and range requests → later. The choice between 200 and 204 on a successful PUT that modifies an existing representation → this resource sends 200; 204 is named and not drawn. Header-field values, including a Host value and a Location value → the figure does not invent field names or values. Idempotent replay of PUT → named in RFC 9110 §9.2.2 and not run, because this chapter does not repeat a request.

Misconceptions targeted: every method changes the stored representation; 404 means the server is down; 201 means any success; POST replaces the target the way PUT does; a missing target is always 404.

## Concept decomposition

Mental models: the cartridge is the message. The plate in the single slot is the stored representation.
Mechanisms: the cartridge moves from the client nest to the server pad and back. GET leaves the plate. PUT stores the enclosed representation. POST asks this resource to process the request, which changes or creates the plate.
Temporal behaviour: three stops, in order. The request is at the client, then at the server (the method has been applied), then the response is at the client. A time between stops is still the earlier stop. There is no travel fraction.
Quantitative relations: status is 200, 201, or 404, each taken from RFC 9110. `changed` is false for GET and true for PUT and for this resource's POST. No duration is taken from the specification.
Failure scenarios: GET against an empty slot. The plate stays absent and the status is 404. PUT and POST on that empty slot create a representation instead.
Trade-offs: one resource can show the method's effect on one stored representation. It cannot show a POST that creates a different resource, a 204 with no content, or a server that answers 404 in order to hide a representation.
Needs space or experiment: the cartridge has to be in one seat, and the plate has to be able to stay, appear, be replaced, or gain the mark of processing.
Hardest: the cartridge can visit the slot and come back while the plate stays — GET retrieved a representation and did not ask for a change (A1).
Hardest: an empty slot is 404 for GET and 201 when this resource creates — 404 means no current representation was found, and 201 means one was created (A1).
Hardest: PUT leaves the enclosed representation in the slot, and POST leaves this resource's own processing — the same 200 or the same 201 is not the same request (A1).

## Parts you'll meet

Message: the cartridge. A request carries a method, a request target, and header fields. A response carries a status code and header fields.
Place: client (the nest) or server (the pad at the slot).
Plate: the stored representation. Empty, the original, the enclosed representation after PUT, or the result of this resource's processing after POST.
Safe: GET does not request a change to that stored representation.

## Storyboard

1. The learner sees one press: a nest, a short rail, and a single slot with a plate in it. The question is what the plate does when a request visits.
2. On Learn, an open GET cartridge leaves the nest, sits on the pad, and the plate stays. A lit response cartridge returns to the nest. The line says status 200 and that the stored representation did not change.
3. In the lab the learner chooses the method and whether a representation starts in the slot, predicts the status and the plate, and presses Run. The press stays still until then.
4. PUT shows a solid cartridge and leaves a replaced plate. POST shows a toothed cartridge and leaves a plate with a tab. GET on an empty slot leaves the slot empty.

## Asset plan

Objective coverage: 1 → A1 · 2 → A1 · 3 → A1

### A1. One resource

- objective: 1, 2, 3
- type: 3d
- object: one press with a client nest and a single resource slot; the cartridge is the message and the plate is the stored representation
- render: anatomy-iso
- fidelity: status, changed, stored, place, role, and plate are computed by apply() and frameAt(); 200, 201, and 404 are the codes RFC 9110 defines for the cases this resource uses; sending 200 rather than 204 when PUT modifies an existing representation is this resource's choice among the two the specification requires; POST's 200 or 201 is this resource's processing result; the three stops are event indexes, not durations from the specification; nothing is faked as a packet capture
- pattern: step manipulate predict
- learner sees: a nest, a rail, one slot, a plate when a representation is stored, and one cartridge
- animated: the cartridge moves to the client seat or the server seat as place changes; it is an open frame, a solid block, or a toothed block while it is the request, and a lit status cartridge while it is the response; the plate appears, stays, is replaced, or gains a tab as plate and changed say
- learner does: on Learn, play and step the GET that finds the representation; in the lab, choose the method and whether a representation is already stored, predict, then run
- notice: the plate can stay while the cartridge goes and comes back; an empty slot is not always 404; a replaced plate and a processed plate are different objects
- model: inputs method (GET, PUT, POST) and exists; state is frameAt(method, exists, t) in src/lib/learn/http-model.ts; apply() is the receiver
- feedback: the line under the drawing is the event sentence; the lab adds summary() and the prediction verdict when the response is back at the client
- assumptions: one resource, the request succeeds, no loss, no second representation, this resource's POST changes or creates the one slot, this resource's modifying PUT sends 200
- outcome: the learner can say where the message is, what status came back, and whether the stored representation changed
- accessibility: the step sentence is the text alternative; the drawing is aria-hidden; keyboard Previous and Next; reduced motion jumps from event to event; the lab draws no run until Run
- tests: src/lib/learn/http-model.test.ts for the six outcomes, the safe GET, the place order, and that the sentences name the status apply() returned
- evidence: rfc9110 §3.4, §6.2, §6.3, §9.2.1, §9.3.1, §9.3.3, §9.3.4, §15, §15.3.1, §15.3.2, §15.3.5, §15.5.5, read
- built: `src/components/learn/http/HttpExchange.tsx`, `src/lib/learn/http-model.ts`, `src/lib/learn/http-model.test.ts`, `src/app/learn/http/page.tsx`

## Animation sense

### A1. Animation sense

- Mechanism: a request is a method, a target, and header fields; the resource applies that method to one stored representation; the response is a status code and header fields.
- Moving quantity: the message cartridge.
- Model field: place (client or server) from frameAt. The cartridge's shape while it is a request is the method. After RESPONSE_AT its role is response. The plate is frame.plate and lights when changed is true.
- Learner predicts: the status and whether the plate stays, stays empty, is replaced, or shows processing.
- If the moving part is deleted: the lesson is gone.
- Research (before drawing): rfc9110, via: read, 2026-10-29, §3.4, §6.2, §6.3, §9.2.1, §9.3.1, §9.3.3, §9.3.4, §15.3.1, §15.3.2, §15.3.5, §15.5.5.

## Explanation (14 questions)

1. Problem: a program has to ask one resource to do something, and the answer has to say what happened, including whether the stored representation changed.
2. Why it matters: the wrong method stores a new representation, replaces one, or leaves it alone. Callers that guess from the path, or from "it succeeded," get that wrong.
3. What would a beginner try first? Treat every request as a write, and treat every failure as "the server is down."
4. Why does that work at first? A form that only creates things, against a resource that is always there, looks like one kind of request.
5. When does it fail? A GET that was meant only to read replaces the stored representation, or an empty slot is reported as a dead server.
6. What do we observe more carefully? The same cartridge visit leaves the plate alone, replaces it, marks it as processed, or finds the slot empty.
7. What is the real mechanism? The request carries a method, a request target, and may carry header fields. The response carries a status code and may carry header fields. GET transfers a current representation and is safe. PUT creates or replaces the target's state. POST asks the target to process the request by its own semantics. 200 means success, 201 means one or more new resources were created, and 404 means no current representation was found or the server will not disclose that one exists (RFC 9110 §3.4, §6.3, §9.2.1, §9.3.1, §9.3.3, §9.3.4, §15.3.1, §15.3.2, §15.5.5).
8. What can the learner change and watch? The method, and whether a representation is already stored.
9. What alternatives exist? A successful PUT that modifies an existing representation may be 204 instead of 200. A POST may return almost any status. Those choices are in §9.3.3 and §9.3.4. This resource picks one success for each input and says so.
10. What are the trade-offs? One slot makes the change visible. It hides a POST that creates a different resource, a hidden representation answered as 404, and any header field's value.
11. When should you choose it? When the caller needs the uniform meaning of GET, PUT, or POST on one target, and needs the status to say whether a representation was retrieved, left alone, replaced, or created.
12. When should you not treat this picture as the whole protocol? When you need loss, replay, encryption, another method, caching, or a server whose POST does not change this one slot. Those are specified or allowed elsewhere and are not running here.
13. Explain it in your own words. The cartridge is back in the nest. Is the plate the one you started with, and which status is on the response?
14. Where else does this apply? An instrument with one stored sample, a command that either reads it or replaces it, and a reply code, is the same split. It stops being the same when the command's effect depends on a previous command's hidden result. HTTP asks each request to be understandable on its own (§3.4).

## Worked example

Learn, locked by `LEARN_METHOD` and `LEARN_EXISTS`: GET, and a representation is already stored.

- Before APPLY_AT the cartridge is at the client, the role is request, the status is not chosen yet, and the plate is original.
- From APPLY_AT until RESPONSE_AT the cartridge is at the server. apply() has run: status 200, changed false, stored true, plate original.
- At RESPONSE_AT the cartridge is at the client again, the role is response, and the plate is still original.

The other five inputs, from apply():

- GET, nothing stored: 404, changed false, plate empty.
- PUT, representation stored: 200, changed true, plate replaced. This resource sends 200. §9.3.4 also allows 204.
- PUT, nothing stored: 201, changed true, plate replaced.
- POST, representation stored: 200, changed true, plate processed. This is this resource's processing, not every POST.
- POST, nothing stored: 201, changed true, plate processed, because this resource's processing created a representation.

## Visual

One press. Feet, screws, a base, and a blank nameplate. The client side is a nest with a bed, two walls, a knob, and a pin. A rail with two bushings and two stops joins it to the slot. The slot is a body, a recess, two jaws, a back riser, two guide rods, a stamp, a cap, and a clamp. The cartridge is the only part that changes seat. An open frame is GET, a solid block is PUT, a block with a tooth is POST, and the lit block is the response. The plate is plain, replaced by a thicker block, or given a tab. Words stay in the step line.

## Practice

Retrieval: what the plate does on the Learn GET; what status an empty slot returns for GET; what PUT and POST each ask for when both can return 201 here.
Exercise: run the lab for GET with the slot full, GET with the slot empty, PUT with the slot empty, and POST with the slot full. The model's summaries are the check: 200 and unchanged; 404 and nothing stored; 201 and a created representation; 200 and processing that changed the stored representation.
Spaced review: http-versions can ask what this chapter already fixed about one message. api-design can ask which method leaves a stored representation alone. The lost-response cases stay in client-server.

## Tabs

- Learn: auto-plays a GET that finds the representation. The specification states that retrieval, and that GET is safe, directly. A 201 is a creation result, so it is not the pass Learn plays. Learn does not ask for a prediction and does not offer the other methods.
- Lab: the same model. The learner chooses the method and whether a representation is already stored, predicts, and presses Run. The press stays still until then. The verdict uses the response stop.
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
  supports: [A request message has a method and a request target, and may have header fields; a response message includes a status code and may have header fields (§3.4); request control data includes the method and request target, and response control data includes a status code (§6.2); header fields are fields sent before the content (§6.3); a safe method does not request a state change on the origin server, and GET, HEAD, OPTIONS, and TRACE are safe (§9.2.1); GET requests transfer of a current selected representation, and retrieval is usually a GET that can provide it in a 200 (OK) (§9.3.1); POST asks the target to process the representation by its own semantics, and a creation should be answered with 201 (§9.3.3); PUT creates or replaces the target state, a creation must be 201, and a successful modification must be 200 or 204 (§9.3.4); a status code is a three-digit integer from 100 to 599 and the first digit is the class (§15); 200 means the request succeeded, and for GET the content is a representation of the target resource, for POST the status or results of the action, for PUT the status of the action (§15.3.1); 201 means one or more new resources were created (§15.3.2); 204 means success with no content to send (§15.3.5); 404 means the origin server did not find a current representation or will not disclose that one exists (§15.5.5)]
  note: >-
    Published text fetched from https://www.rfc-editor.org/rfc/rfc9110.txt on 2026-10-29.
    Section numbers are from that file. No other copy was needed.

## Open questions / unverified

- The figure was not played in a browser. Reduced motion, keyboard steps, and the cartridge's seat on screen are unverified.
- RFC 9110 §10.2.2 (the Location field definition) was not read. The page does not name Location.
- The sources page does not list this chapter yet. Citations link to anchors that are not on that page until the catalog is wired.

## Evidence

- model tests: pass — `npx vitest run src/lib/learn/http-model.test.ts` (14 tests, 2026-10-29)
- eslint: pass — `npx eslint` on the chapter files (2026-10-29)
- browser: not run — the shared browser was not used
- animation sense: not run — the figure was not played in a browser, so this line is not a pass
- spec review: not run — no fresh reviewer in this unit

## Review findings

- spec review: not run — browser check and an independent reviewer were outside this unit
