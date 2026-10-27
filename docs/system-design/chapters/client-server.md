# Clients, servers and request–response

Id: client-server · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Implementation: `src/app/learn/client-server/page.tsx`, `src/components/learn/client-server/ExchangeStepper.tsx`,
`src/lib/learn/client-server-model.ts` (+ `.test.ts`), `src/content/learn/client-server-sources.ts` (owner
authorized integration on 2026-10-27).
Prerequisites: web-request · Related: http, idempotency, timeouts-retries, stateless-services, realtime,
message-queues, ip-and-ports

## Boundary

Objectives (observable):

1. Say which program is the client and which is the server in a described exchange, including a program that is a
   server on one connection and a client on another.
2. Name the parts of one HTTP request (method, target, header fields, optional body) and of one response (status
   code, header fields, optional body), given the raw text of an HTTP/1.1 exchange.
3. Explain what a client can and cannot know when no response arrives, use that to say which requests are safe
   to send again automatically (and under which assumptions), and describe how an idempotency key lets a server
   recognise a repeated `POST`.
4. Explain what "HTTP is stateless" means and how a site still remembers a visitor between requests.

In scope: the two roles, who starts an exchange, what one request and one response contain, statelessness and
where state goes instead, and the one failure every client must reason about: no response. One mechanism: a
request–response exchange between two roles, and what each side knows.

Deferred:

- Addresses, packets and ports, and why a server can't simply open a connection to a phone → `ip-and-ports`,
  `cloud-networking`
- Every method, status code and header in detail; how HTTP/1.1 frames a message → `http`
- HTTP/2 and HTTP/3, where messages are not plain text → `http-versions`
- Idempotency keys in depth (key expiry, payload fingerprints, storage, keys across a server fleet) → `idempotency`
- Choosing timeouts, retry limits and backoff → `timeouts-retries`
- Where session state lives in a server fleet → `stateless-services`, `load-balancing`
- Server push (polling, server-sent events, WebSockets) → `realtime`
- Handing work to a queue and collecting the result later → `message-queues`
- Proxies, gateways and caches between client and server → `reverse-proxies`, `cdn`, `http-caching`

Misconceptions targeted:

- "A server is a special, powerful computer; a client is my laptop." Client and server are roles a program plays on
  one connection. The same program can be a client on one connection and a server on another. [rfc9110 §3.3;
  pg-architecture]
- "The server can send me something whenever it wants." In request–response, the client always starts the
  exchange; servers answer requests. Server-initiated messages need extra mechanisms. [mdn-http-overview; rfc9110
  §3.4; mdn-sse]
- "No response means the request didn't happen." The client cannot tell a lost request from a lost or late
  response. The server may have done the work. [rfc9110 §7.5, §9.2.2]
- "An error, so I'll just try again." Sending a request again is safe only when repeating it has the same intended
  effect as sending it once (an idempotent method). [rfc9110 §9.2.2]
- "The server remembers me because I'm still connected." HTTP is stateless: each request is understood on its own,
  and a server must not assume that two requests on one connection come from the same user agent. State travels in
  the requests themselves, for example in cookies. [rfc9110 §3.3; rfc6265 §3; mdn-cookies]

## Parts you'll meet

Terms already taught in `web-request` (client and server, user agent, connection, request and response, status
code, round trip) are used with the same meaning. New or sharpened here:

- **Program:** running software. "Client" and "server" name what a program does, not what kind of computer it runs
  on.
- **Client:** the program that opens a connection to send one or more requests. [rfc9110 §3.3]
- **Server:** the program that accepts connections and answers requests with responses. [rfc9110 §3.3]
- **Origin server:** the server that can give the authoritative response for a resource; what people usually mean
  by "the website's server". [rfc9110 §3.6]
- **Intermediary:** a program between client and origin server that passes messages on, such as a proxy. On each
  connection it is still a client or a server. [rfc9110 §3.7] (Details: `reverse-proxies`.)
- **Exchange:** one request and the response(s) it gets.
- **Method:** the word at the start of a request that says what the client wants done, such as `GET` (fetch) or
  `POST` (process this data). [rfc9110 §9.1, §9.3.1, §9.3.3]
- **Target:** the resource the request is about, written as a path such as `/orders/42` in an HTTP/1.1 request
  line. [rfc9110 §7.1; rfc9112 §3, §3.2]
- **Header field:** a `Name: value` line that carries extra information (metadata) about the message, such as
  `Host` or `Content-Type`. [rfc9110 §3.4, §6.3]
- **Body:** the data a message carries after its header fields, such as form data or a page. RFC 9110 calls it
  *content*; this course says *body*, as MDN does. [rfc9110 §6.4; mdn-messages] (Simplified: in HTTP/1.1 the
  "message body" can arrive encoded in chunks, and RFC 9110's "content" is the data after decoding → `http`.)
- **Status code:** the three-digit result at the start of a response; the first digit gives the class (1xx
  informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error). [rfc9110 §15]
- **Stateless:** each request can be understood on its own, without knowing which requests came before it on the
  connection. [rfc9110 §3.3]
- **Cookie:** a small name=value item a server asks the browser to store (with `Set-Cookie`) and the browser sends
  back with later requests (in `Cookie`). [rfc6265 §1, §3; mdn-cookies]
- **Timeout:** how long a client waits for a response before giving up. HTTP does not fix one: clients may abandon
  a request whenever they judge a response has taken too long. [rfc9110 §7.5]
- **Safe method:** one whose meaning is read-only; the client asks for no change on the server (`GET`, `HEAD`,
  `OPTIONS`, `TRACE`). [rfc9110 §9.2.1]
- **Idempotent method:** one where sending the same request several times has the same intended effect as sending
  it once (`PUT`, `DELETE` and the safe methods). [rfc9110 §9.2.2]

Glossary rules for the course (added here):

- Say "client" and "server" for roles on a connection, never for kinds of machine.
- Say "body" for message content (RFC 9110: "content").
- Say "no response" for what the client observes, and "lost request", "lost response" or "late response" only for
  what actually happened, which the client cannot see.

## Explanation (14 questions)

1. **Problem.** You press "Place order" in a shop's app. The spinner turns for a while, then: "Network error".
   Did you buy the lamp or not? Should you press the button again? To answer, you need to know who said what to
   whom, and what each side can know.

2. **Why it matters.** Nearly every design in this course is built from programs asking other programs for
   things: browsers and web servers, web servers and databases, services and other services. Getting the roles and
   the failure cases wrong produces real bugs: a charge taken twice, or an order lost because nobody retried. The
   HTTP standard itself warns clients not to repeat certain requests automatically for this reason. [rfc9110
   §9.2.2]

3. **Beginner's first try.** "My phone is the client and the shop's big computer is the server. The client asks,
   the server answers. If I get an error, nothing happened, so I press the button again."

4. **Why that works at first.** Most of the time, both messages arrive and the picture is right: the app sends a
   request and gets a response [rfc9110 §3.4]. And for reading something, such as reloading a page, pressing again
   is harmless: `GET` is a safe method, it asks for no change, so repeating it does no damage [rfc9110 §9.2.1,
   §9.2.2].

5. **When it fails.** It fails in two places.
   - **Roles.** The shop's web server, to answer you, sends its own request to a database server. On that second
     connection the web server is the client. A model of "client = small device, server = big computer" cannot
     say what the web server is. [rfc9110 §3.3; pg-architecture]
   - **No response.** "Network error" after pressing "Place order" has three possible causes the app cannot tell
     apart:
     - the request was lost, and the shop did nothing;
     - the shop placed the order, but the response was lost on the way back;
     - the shop is slow, and the app stopped waiting before the response came.

     In the last two, pressing again places a second order. `POST` is not idempotent, so the standard says a
     client should not repeat it automatically unless it has some way to know that repeating is safe. [rfc9110
     §7.5, §9.2.2] (The three causes are derived from what a request–response exchange is: two messages, either of
     which can fail to arrive in time.)

6. **A better observation.** Look at what actually travels. In HTTP/1.1 the messages are plain text, so the exchange
   can be read line by line [mdn-http-overview: HTTP flow; rfc9112 §3, §4]. RFC 9110 shows one such exchange
   [rfc9110 §3.9]. Its request begins:

   ```http
   GET /hello.txt HTTP/1.1
   User-Agent: curl/7.64.1
   Host: www.example.com
   ```

   Its response begins:

   ```http
   HTTP/1.1 200 OK
   Date: Mon, 27 Jul 2009 12:28:53 GMT
   Server: Apache
   ```

   (Both quoted from the first lines of the RFC's example; the rest of each message is further header fields and,
   in the response, the body.)

   Two things stand out.
   - **Everything the server learns about you is in the request.** The request line names the method, the
     target and the version; the header fields add the rest. There is no hidden channel. [rfc9112 §3; rfc9110 §3.4]
   - **Everything the client learns is in the response, if it arrives.** A client that receives nothing has
     learned nothing about what the server did. (Derived from the exchange having only these two messages.)

7. **The real mechanism.**
   1. **Roles.** A client is a program that opens a connection to send requests; a server is a program that
      accepts connections and answers them. The terms describe roles on one connection; the same program can be
      a client on some connections and a server on others. [rfc9110 §3.3] A database server, for example, accepts
      connections from client applications, and a web server that reads the database is one of those clients.
      [pg-architecture]
   2. **Who starts.** The client starts every exchange: it sends a request, and the server answers it. The server
      does not send a response that nobody asked for. [rfc9110 §3.4; mdn-http-overview: Client: the user-agent]
      Ways for a server to send news to a client without being asked each time exist, and they are extra
      mechanisms on top (→ `realtime`). [mdn-sse; mdn-websockets]
   3. **A request** has a method and a target, and can carry header fields and a body. [rfc9110 §3.4] In HTTP/1.1
      it starts with a request line, `method target version`, such as `POST /orders HTTP/1.1`, and must include a
      `Host` header field. [rfc9112 §3, §3.2]
   4. **A response** has a status code, and can carry header fields and a body. [rfc9110 §3.4] In HTTP/1.1 it
      starts with a status line, `version code reason`, such as `HTTP/1.1 201 Created`. [rfc9112 §4] A server can
      send one or more interim responses (1xx) before the final one. [rfc9110 §3.4, §15.2]
   5. **Stateless.** Each request can be understood on its own: the server does not need to know what came before
      on the connection, and must not assume that two requests on one connection come from the same user agent.
      That design lets intermediaries reuse connections and spread requests across many servers. [rfc9110 §3.3]
      (Simplified: the same section allows the assumption on a connection that is secured and specific to one
      agent, and notes that some non-standard extensions break the rule.)
   6. **State goes into the requests.** To remember you, a server sends a `Set-Cookie` header field in a response;
      the browser stores it and sends it back in a `Cookie` header field on later requests to that server. The
      server reads it on each request. [rfc6265 §3; mdn-cookies] (What else can carry state, and where servers
      keep it, is `stateless-services`.)
   7. **No response.** Clients do not wait forever: a client may abandon a request when no response comes within
      what it judges a reasonable time, and a connection can be closed at any time, by either side. [rfc9110 §7.5;
      rfc9112 §9.5, §9.3.1] When that happens, the client does not know whether the server received the request
      or acted on it (derived from 6 and 7).
   8. **Retrying.** A request with an idempotent method (`GET`, `HEAD`, `PUT`, `DELETE`, `OPTIONS`, `TRACE`) can
      be repeated automatically after a failure before the response is read, because repeating it has the same
      intended effect even if the first one succeeded. A client should not automatically repeat a non-idempotent
      request such as `POST` unless it knows that repeating is safe for that resource or can tell that the
      original was never applied. [rfc9110 §9.2.2; rfc9112 §9.3.1]
      Two qualifications. First, idempotency is about the *intended effect of identical requests*: a `PUT` that
      sets quantity 2 is safe to repeat, but only if the server really implements `PUT` as "replace the state",
      and the standard notes that other clients may change the resource in between [rfc9110 §9.2.2, §9.3.4], so a
      repeated `PUT` can undo someone else's change (derived). Second, the server is still free to log each copy or have
      other side effects. [rfc9110 §9.2.2]
   9. **Making `POST` recognisable: idempotency keys.** The client puts a unique value, such as a random UUID, in
      an `Idempotency-Key` header field, and sends the same value again with every retry of that request, so the
      server can recognise the retries [idempotency-key-draft §2, §2.2]. A
      server that supports it processes the first request with a new key normally. A later request with a key it
      has already seen gets a response consistent with the original (no second order). If the original is still
      being processed when the retry arrives, the server answers `409 Conflict`, and the client tries again
      later. [idempotency-key-draft §2.6, §2.7; rfc9110 §15.5.10] This works only when the server
      implements it correctly, and it is still an IETF draft, not a finished standard: a client cannot assume a
      server honours the field unless the server documents it. [idempotency-key-draft §2.5.1] (Details:
      `idempotency`.)
   10. **Three layers, kept apart.** *HTTP semantics* say what a method means (`PUT` is idempotent, `POST` is
       not). *Application behaviour* is what a particular server actually does (whether its `PUT` handler really
       replaces state, whether it honours idempotency keys). *Infrastructure* is what happens on the way
       (lost messages, timeouts, closed connections, proxies). A retry is safe only when all three line up: the
       method allows it, the server implements it, and the client knows how its request may have failed.
       (Derived from steps 7–9.)

8. **What the learner can change and watch.** In the visual (Visual, below), the learner picks:
   - the method: `GET /orders/42`, `PUT /orders/42` (set the quantity to 2), `POST /orders` (place an order), or
     `POST /orders` with an idempotency key the server honours;
   - what happens on the way: nothing goes wrong, the request is lost, the response is lost, or the response is
     late (the server answers after the client's timeout);
   - whether the client sends the request again once.

   They predict first, then run the exchange step by step, and watch what the client sees, how many times the
   request reached the server, and the resulting state on the server (new orders, total orders, the order's
   quantity).

9. **Alternatives.** Four ways for two programs to work together:
   - **Request–response** (this chapter): the client asks and waits for the answer.
   - **Server push over an open connection:** the client opens a connection once, and the server sends messages
     over it whenever it has news (server-sent events, WebSockets). [mdn-sse; mdn-websockets] (→ `realtime`)
   - **Hand-off through a queue:** the client leaves a message describing the work, and gets the result later by
     asking again or being told. (→ `message-queues`)
   - **Both roles in one program:** each program is a server for some connections and a client for others, as the
     web server in question 5 is. [rfc9110 §3.3]

10. **Trade-offs.** (Design judgements derived from the mechanism; their costs are measured in the chapters named.)
    - **Request–response:** simple to reason about, and the client controls when things happen. But the server
      cannot tell the client anything until asked, and every "no response" leaves the client unsure what happened.
    - **Server push:** news arrives without asking, but every waiting client holds an open connection the server
      must keep. (→ `realtime`)
    - **Queue hand-off:** the client doesn't wait for slow work, but there are more parts to run, and the result
      arrives later, so the client must ask for it or be told. (→ `message-queues`)
    - **Both roles:** needed whenever a server depends on another service, and each extra hop is one more place a
      response can go missing. (→ `failure-modes`)

11. **When to choose request–response.** The client needs the answer before it can continue (show the page,
    confirm the order), and the server can produce it within a time the client is willing to wait.

12. **When not to.**
    - The server has news the client didn't ask for (a chat message, a price change): use push (→ `realtime`).
    - The work takes longer than any reasonable wait (a video to encode): hand it off and fetch the result later
      (→ `message-queues`).
    - You don't need anything more yet: for most pages and API calls, plain request–response is the right
      starting point. Add the others when one of the two conditions above is observed.

13. **In your own words.** Explain to a friend why "Network error" after "Place order" does not mean the order
    failed, and what the app could do instead of pressing the button again blindly.

14. **Where else this applies.** The same roles and the same "no response" problem appear wherever one program asks
    another: a web server asking a database for a row [pg-architecture], one service calling another, and your
    computer asking a name server for an address (→ `dns`). Pick one: which program is the client, and what does
    it know when its request times out?

## Worked example

Assumed values for this example only, not measurements: the app gives up after 5 s without a response; on a slow
day the shop's server needs 7 s to place an order. The host name `shop.example` is made up.

**Step 1: the exchange that works.** The app (client) sends:

```http
POST /orders HTTP/1.1
Host: shop.example
Content-Type: application/json
Content-Length: 23

{"item":"lamp","qty":1}
```

- Method `POST`, target `/orders`, version `HTTP/1.1`: the request line. [rfc9112 §3]
- Header fields: `Host` (required in HTTP/1.1 [rfc9112 §3.2]), `Content-Type` (the body's media type, here JSON
  [rfc9110 §8.3]) and `Content-Length` (the body's size in bytes [rfc9110 §8.6]: the body above is 23 bytes).
- A blank line ends the header fields; the body follows. [mdn-messages]

The shop's server (server) places order 42 and answers:

```http
HTTP/1.1 201 Created
Location: /orders/42
Content-Type: application/json
Content-Length: 27

{"id":42,"status":"placed"}
```

- `201 Created`: the request succeeded and created a new resource, named by the `Location` header field. [rfc9110
  §15.3.2, §9.3.3]

**Step 2: the same order on a slow day.** Suppose instead that step 1's request arrives on a slow day, and the
server starts placing order 42. At 5 s the app gives
up and shows "Network error" [rfc9110 §7.5]. At 7 s the server finishes: order 42 exists, but its response reaches
a client that is no longer waiting (whether the server notices that the client left depends on the server and is
taught in `timeouts-retries`).

**Step 3: pressing again.** The app sends the same `POST` again, and this time the server answers in time with
`201 Created` and `Location: /orders/43`. The customer now has two lamps on order. `POST` is not idempotent, so
repeating it repeated its effect. [rfc9110 §9.2.2]

**Your turn (fading):** the next day the app sends `PUT /orders/42` with a body setting the quantity to 2, gets no
response, and sends the same request again. How many new orders does that create, and what is order 42's quantity
afterwards?

- Answer: no new orders, and quantity 2. `PUT` is idempotent: the intended effect of two identical requests is the
  same as of one. [rfc9110 §9.2.2]

What this example simplifies:

- Here a person presses the button again. Clients can also repeat requests automatically, which is why the
  standard's rule in step 3 is written for clients, not people. [rfc9110 §9.2.2] (Retry policies: `timeouts-retries`.)
- The server here does each request completely or not at all. A request that half-completes is taught in
  `failure-modes` and `transactions`.
- `PUT` with a whole new representation of the order is the idempotent way to change it; how an idempotency key
  makes a repeated `POST` safe is question 7, step 9, and in depth `idempotency`.

## Visual

Decision: **stepper with a small discrete model** because the mechanism is a short sequence of discrete events
(request sent, maybe lost, server acts, response sent, maybe lost or late, client decides, maybe retries), and the
point is to compare a few cases side by side. No simulation is needed: there is no load, randomness or time
series. No 3D.

Visual spec (the 14-step process; revised at implementation, 2026-10-27, to add the idempotency-key case and
predict-then-run):

1. **Mechanism made visible:** the client sees only what arrives. Three different failures look identical from the
   client's side; whether sending again is safe depends on the method and on what the server implements.
2. **Misconception to break:** "no response means nothing happened, so try again".
3. **Medium:** a stepper over a two-lane sequence diagram (client on the left, server on the right, time
   downwards), plus a state panel for the server. The learner chooses a case, presses Run, and steps through the
   events the model produces.
4. **Parts on screen:** client, server, request and response arrows, the client's timeout mark, and the server's
   state (orders, order 42's quantity). Each is a term from "Parts you'll meet".
5. **Model:** `exchange({ method, fault, retry }) → { attempts, events, reached, newOrders, totalOrders, quantity }`.
   - Inputs: `method` ∈ {GET, PUT, POST, POST with key}; `fault` ∈ {none, request lost, response lost, response
     late}; `retry` ∈ {off, once}.
   - State before: 1 order (order 42, quantity 1). `GET /orders/42` reads it; `PUT /orders/42` sets quantity 2;
     `POST /orders` creates the next order (43, then 44).
   - First attempt. `request lost`: it never reaches the server. `none`: the server carries it out and the
     response arrives. `response lost`: the server carries it out, the response never arrives. `response late`:
     the server starts but is still working when the client gives up; it finishes last, after any retry, and its
     response reaches a client that stopped waiting (events are emitted in that time order; tested).
   - Retry (only when chosen and the first attempt showed no response): sent after the client gives up; it
     arrives and its response arrives in time. In the `response late` case it arrives while the first is still
     being processed.
   - Server behaviour per method: `GET` changes nothing (200 OK); `PUT` sets quantity 2 (200 OK); `POST` creates
     an order (201 Created) every time it arrives; `POST` with key creates an order the first time a key is seen,
     replays the original response if the original has finished, and answers 409 Conflict if the original is
     still being processed. [rfc9110 §9.3.1, §9.3.3, §9.3.4, §15.5.10; idempotency-key-draft §2.6, §2.7]
   - Outputs: per attempt, whether it reached the server, what the server did, and what the client saw;
     `reached` (0–2), `newOrders` (0–2), `totalOrders` (1–3), `quantity` (1–2); and the ordered list of events
     the stepper shows.

   Assumptions, shown beside the visual: at most one retry, which always arrives and gets its response in time;
   the server carries out a request completely or not at all; nobody else changes order 42 meanwhile; the keyed
   server records each key together with its result; no proxies; "teaching model, not a benchmark".
6. **Controls:** method (4 options, default `GET`), what goes wrong (4 options, default `none`), retry (checkbox,
   default off), Run, then Previous/Next step. No numeric controls: timings are assumptions in the worked example,
   not inputs.
7. **Readouts** (after Run only): what the client saw on each attempt, how many times the request reached the
   server, new orders, total orders, order 42's quantity. All computed from the model.
8. **Prediction (predict, then run):** before any outcome is shown, three questions with choices:
   - A (recall): `POST`, response lost, sent again → how many new orders? (0, 1, 2; answer 2)
   - B (predict): the same with an idempotency key the server honours → how many new orders? (0, 1, 2; answer 1)
   - C (predict): with the key, but the response was late, so the retry arrives while the first is still being
     processed → what does the retry get back? (201 Created again, 409 Conflict, no response; answer 409)

   Check with every question answered gives feedback per question: right with the reason, or wrong with the
   answer, a reason specific to the option picked, and the general reason. Check with a question unanswered names
   the open questions and reveals nothing. Skip reveals the answers without feedback. After that, "Run
   case A/B/C" sets the controls to that case and runs it. Leak scope (tested): nothing in the figure states an
   outcome before Check, Skip or Run, and nothing on the page above the figure states the keyed outcomes (replay,
   409). The prose after the figure ("Making a repeated POST safe") explains them, in reading order after the
   prediction. Default controls are `GET` with nothing going wrong, and outcomes appear only after Run.
9. **Signaling:** the current event's arrow is heavy; a lost message ends in a cross; in the late case the
   server side shows a dashed "still busy" line from the first request's start to its late reply (heavy on the
   "starts" step), the client's lane shows where it gave up, and the late response is drawn last, below any retry
   ("first finishes, late"), in the same order as the event list. Centred labels stay between the lanes (tested). The state panel shows before → after.
10. **States:** delivered = solid arrow; lost = dashed arrow ending in a cross; late = solid arrow drawn at
    the bottom, after any retry, labelled "nobody is waiting for it"; every state also in text. Never colour alone.
11. **Text alternative:** a polite live summary updated when a case is run (e.g. "POST with key, response lost,
    retried: first attempt no response; retry 201 Created (replayed). Reached the server 2 times; new orders 1;
    total orders 2."), and a second polite region for step changes, emptied when the case changes.
12. **Reduced motion:** nothing animates in any mode; all events of a run are listed as a numbered sequence.
13. **Tests:**
    - Without retry, the client sees the same thing for `request lost`, `response lost` and `response late`,
      for every method.
    - `POST` with `response lost` or `response late` and a retry gives 2 new orders (the worked example).
    - `POST` with key: `response lost` + retry gives 1 new order and a replayed 201; `response late` + retry
      gives 1 new order and 409 Conflict; `request lost` + retry gives 1 new order.
    - `PUT` gives quantity 2 whenever it reached the server, once or twice; `GET` never changes state.
    - Every combination (4 × 4 × 2 = 32): `reached` in [0, 2], `newOrders` in [0, 2], `totalOrders` = 1 +
      `newOrders`, `quantity` in [1, 2]; events are deterministic.
    - The prediction answers come from the model, and no outcome text is present before Run or Check.
14. **Smallest width first:** at 375 px the prediction, controls, diagram and state panel stack in one column with
    two narrow lanes; from 900 px the prediction and controls sit on the left, the diagram and state on the right.

## Practice

Retrieval questions (each asked after the section it names):

1. _(after question 7, step 1)_ A web server receives your request, then asks a database server for your order
   before answering you. On each of the two connections, which program is the client?
   - **Answer:** on the first, your app is the client and the web server is the server. On the second, the web
     server is the client and the database server is the server. [rfc9110 §3.3; pg-architecture]
   - **Wrong: "the web server is always the server".** Client and server are roles per connection, not properties
     of a program.
   - Revisit question 7, step 1.
2. _(after question 7, steps 3–4)_ Here is the start of a request: `PUT /orders/42 HTTP/1.1` then
   `Host: shop.example`, a blank line and `{"qty":2}`. Name each part. What will the first line of the response
   start with?
   - **Answer:** method `PUT`, target `/orders/42`, version `HTTP/1.1`; `Host` is a header field; `{"qty":2}` is the
     body. The response starts with a status line: the version, then a three-digit status code. [rfc9112 §3, §4;
     rfc9110 §3.4]
   - **Wrong: "the response starts with the body".** The status line and header fields come first.
   - Revisit question 7, steps 3–4, and the worked example, step 1.
3. _(after question 7, steps 5–6)_ You add a lamp to your basket, and the next page shows it still there. HTTP is
   stateless. How does the server know it is your basket?
   - **Answer:** the browser sends something with each request that identifies you, typically a cookie the server
     set earlier with `Set-Cookie` and the browser returns in `Cookie`. [rfc6265 §3; mdn-cookies]
   - **Wrong: "because you are still on the same connection".** A server must not assume two requests on one
     connection come from the same user agent, and connections can be closed and reopened at any time.
     [rfc9110 §3.3; rfc9112 §9.5]
   - Revisit question 7, steps 5–6.


4. _(after question 7, step 7)_ The app sent `POST /orders` and saw no response before its timeout. What does it
   know about the order?
   - **Answer:** nothing. The request may have been lost (no order), or the order may have been placed and the
     response lost or late. [rfc9110 §7.5]
   - **Wrong: "no order was placed".** That is only one of the three cases.
   - **Wrong: "the order was placed, because the request was sent".** Sending is not arriving.
   - **Note the difference:** "the client got no response" is what the client observes; "the server did not
     process the request" is only one of the things that may have happened.
   - Revisit question 5 and the worked example, step 2.
5. _(after question 7, step 8)_ A connection fails before the client could read any response. Which of these
   requests can the client send again automatically: `GET`, `PUT`, `DELETE`, `POST`?
   - **Answer:** `GET`, `PUT` and `DELETE`: they are idempotent, so repeating has the same intended effect as
     sending once. Not `POST`, unless the client knows that repeating is safe for that resource. [rfc9110 §9.2.2]
   - **Wrong: "only GET, because it doesn't change anything".** `PUT` and `DELETE` change things but are still
     idempotent: deleting twice leaves the resource deleted (the second response may differ, for example "not
     found", but the effect is the same). [rfc9110 §9.2.2]
   - **Caveat:** "idempotent" describes what the method means. It holds only if the server implements `PUT` and
     `DELETE` as specified, and a repeated `PUT` can still overwrite a change another client made in between.
     [rfc9110 §9.2.2, §9.3.4]
   - **Wrong: "all of them, the server will sort it out".** Nothing in a plain `POST` marks it as a repeat, so
     the server carries it out again (derived; how to add such a mark is `idempotency`).
   - Revisit question 7, step 8.

Exercise (transfer; the worked answer is revealed after an attempt):

- **Setup:** a payment screen sends `POST /payments` with the amount. Users on a train often see "Network error"
  and press "Pay" again.
- **Task:** list what may have happened on the server each time the error appears, and say what goes wrong if
  the app simply repeats the request.
- **Then:** without new technology, what could the app do before paying again? (Hint: which method could it use
  to find out?)
- **Worked answer:**
  - Each error has three possible causes: request lost (no payment), response lost (payment made), response late
    (payment made, or about to be). Repeating the `POST` can pay twice in the last two cases. [rfc9110 §7.5,
    §9.2.2]
  - Before paying again, the app can ask: send a `GET` for the user's recent payments (safe to repeat) and only pay
    again if the first payment is not there. (Derived from question 7, step 8.)
  - That check is not enough on its own: in the "response late" case the server may still be working on the first
    payment, so the `GET` does not show it yet and the app pays twice anyway. The client alone cannot close this
    gap on its own.
  - The fix that works: the app creates one idempotency key when the user first presses "Pay" and sends it with
    every retry of that payment. If the server honours keys, a retry after a lost response gets the original
    result instead of a second payment, and a retry while the first is still running gets `409 Conflict`, so the
    app waits and asks again. [idempotency-key-draft §2.6, §2.7] It relies on the server implementing the key
    correctly; the details are `idempotency`.

Spaced review:

- `http` re-asks Q2 (parts of a request and a response).
- `idempotency` re-asks Q5 and the exercise (which requests are safe to repeat; keys).
- `timeouts-retries` re-asks Q4 (what a timeout tells the client).
- `stateless-services` re-asks Q3 (where state lives).

(Questions are numbered in page order; renumbered at implementation, 2026-10-27.)

## Sources

```
- id: rfc9110
  title: HTTP Semantics (RFC 9110, STD 97)
  author: Fielding, Nottingham, Reschke (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9110
  kind: spec
  published: 2022-06
  checked: 2026-10-27
  via: read
  supports: [header fields are sent before the content and add metadata (§6.3); content is the data after the header section (§6.4); client and server are roles per connection; the same program can be both (§3.3); HTTP is stateless, each request understood in isolation, a server must not assume two requests on one connection come from the same user agent (§3.3); request = method + target + optional header fields, content, trailers; response = status code + optional header fields, content (§3.4); one or more responses per request (§3.4); user agent (§3.5); origin server (§3.6); intermediaries (§3.7); example exchange (§3.9); determining the target (§7.1); PUT replaces state, success is 200/204 (or 201 if created), and other user agents may change the resource in parallel (§9.3.4); 409 Conflict (§15.5.10); clients may abandon a request without a response; no set wait (§7.5); method semantics (§9.1); safe methods (§9.2.1); idempotent methods and retry rule (§9.2.2); GET (§9.3.1); POST and 201 with Location (§9.3.3); status classes (§15); 1xx interim (§15.2); 201 Created (§15.3.2); Content-Type gives the media type (§8.3); Content-Length gives the data length in octets (§8.6)]
  note: >-
    Read in the published text as rendered by the HTTP WG (httpwg.org/specs/rfc9110.html, httpwg/httpwg.github.io
    @ ce03dd5; urn:ietf:rfc:9110, issued 2022-06), the copy section-checked for `web-request`. Sections were
    extracted by their heading ids and read in full for §3.3–§3.7, §3.9, §7.5, §9.1, §9.2.1, §9.2.2, §9.3.3, §15,
    §15.2, §15.3.2, §9.3.4, §15.5.10, and the opening paragraphs of §6.3 (header fields), §6.4 (content; HTTP/1.1 message body vs
    content), §7.1 (target resource), §8.3 (Content-Type) and §8.6 (Content-Length). rfc-editor.org itself is unreachable from this container.
- id: idempotency-key-draft
  title: The Idempotency-Key HTTP Header Field (IETF HTTPAPI WG Internet-Draft, editor's copy)
  author: J. Jena, S. Dalal, D. Tishkin
  url: https://github.com/ietf-wg-httpapi/idempotency
  kind: spec
  checked: 2026-10-27
  via: read
  supports: [the client sends a unique key (a UUID or similar random value) in the Idempotency-Key request header (§2.2); a general client cannot assume a server respects the field without knowing it does (§2.5.1); a first request with a new key is processed normally; a duplicate after the original completed gets a response consistent with the original; a duplicate while the original is still being processed gets a conflict error (§2.6); that error is 409 Conflict (§2.7)]
  note: >-
    draft-ietf-httpapi-idempotency-key-header.md in ietf-wg-httpapi/idempotency @ a2cd12a (2026-10-22), the
    working group's editor's copy after draft-07 ("Changes from Draft-07"). An Internet-Draft is work in progress,
    not an RFC; the chapter says so. Section numbers were first computed from the file's heading tree and then, on
    2026-10-27, checked against the WG's own rendering of the same commit (gh-pages @ c9266b1, "Script updating
    gh-pages from a2cd12a"; docname draft-ietf-httpapi-idempotency-key-header-latest, dated 22 October 2026,
    intended status Standards Track): 2 The Idempotency-Key HTTP Request Header Field, 2.2 Uniqueness of
    Idempotency Key, 2.5.1 Client, 2.6 Idempotency Enforcement, 2.7 Error Handling all match. They may differ in a
    later submitted draft. The latest submitted draft number and its IETF status were not established (Datatracker
    unreachable; a gh-pages folder named "-08" is a preview built from the same editor's copy, not proof of a
    submission).
- id: rfc9112
  title: HTTP/1.1 (RFC 9112, STD 99)
  author: Fielding, Nottingham, Reschke (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9112
  kind: spec
  published: 2022-06
  checked: 2026-10-27
  via: read
  supports: [request line = method SP request-target SP HTTP-version (§3); request-target identifies the target resource; a client must send Host in every HTTP/1.1 request (§3.2); status line = HTTP-version SP status-code SP reason-phrase (§4); HTTP/1.1 connections are persistent by default (§9.3); a client, server or proxy may close a connection at any time (§9.5); retry conditions are those of RFC 9110 §9.2.2 (§9.3.1)]
  note: >-
    Published text as rendered by the HTTP WG, httpwg/httpwg.github.io @ ce03dd5 specs/rfc9112.html (fetched from
    raw.githubusercontent.com; urn:ietf:rfc:9112, issued 2022-06, creators Fielding, Nottingham, Reschke).
- id: rfc6265
  title: HTTP State Management Mechanism (RFC 6265)
  author: A. Barth
  url: https://www.rfc-editor.org/rfc/rfc6265
  kind: spec
  published: 2011-04
  checked: 2026-10-27
  via: read
  supports: [a server stores state in the user agent with Set-Cookie in a response; the user agent returns it in a Cookie request header on later requests (§1, §3)]
  note: >-
    Published text as rendered by the HTTP WG, httpwg/httpwg.github.io @ ce03dd5 specs/rfc6265.html
    (urn:ietf:rfc:6265, issued 2011-04). Used only for the basic Set-Cookie → Cookie mechanism. A revision
    (draft-ietf-httpbis-rfc6265bis) intends to obsolete RFC 6265. Re-checked 2026-10-27: the HTTP WG's
    published-RFC site (httpwg/httpwg.github.io @ ce03dd5, 2026-10-19), which lists RFCs up to RFC 10036
    (issued 2026-08), renders no RFC that replaces or obsoletes 6265, and RFC 6265 is the only cookie RFC on it.
    So no published successor was found as of that snapshot; the RFC Editor's index itself could not be read.
- id: rfc6265bis
  title: "Cookies: HTTP State Management Mechanism (draft-ietf-httpbis-rfc6265bis)"
  author: IETF HTTP WG
  url: https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/
  kind: spec
  checked: 2026-10-27
  via: search
  supports: none
  note: >-
    Seen only in search results: datatracker shows draft-22 in the RFC Editor queue (page dated 2025-12-09) and a
    later dated copy exists; the drafts say "Obsoletes: 6265 (if approved)". No published RFC number was found.
    Lead only; check before `http` or `stateless-services` relies on cookie details. 2026-10-27: the WG's source
    file (httpwg/http-extensions @ 9adda98, 2026-10-27) was opened for its front matter only: still an editor's
    copy (docname draft-ietf-httpbis-rfc6265bis-latest, "obsoletes: 6265"); its text was not read, so this record
    stays `via: search` and supports nothing.
- id: mdn-http-overview
  title: Overview of HTTP
  author: MDN Web Docs
  url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [the user-agent is always the entity initiating the request, never the server, though mechanisms simulate server-initiated messages (Client: the user-agent); HTTP is stateless but not sessionless: cookies link requests to state (HTTP is stateless, but not sessionless); HTTP/1.1 messages are human-readable and can be read as text (HTTP flow)]
  note: mdn/content @ bd7387a (files/en-us/web/http/guides/overview/index.md), the copy read for `web-request`.
- id: mdn-messages
  title: HTTP messages
  author: MDN Web Docs
  url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [requests and responses; start line, optional header fields, an empty line, optional body; "head" and "body"; request line and status line have three parts]
  note: >-
    mdn/content @ bd7387a, fetched from raw.githubusercontent.com. Not used: its line "Only PATCH, POST, and PUT
    requests have a body", which is stricter than RFC 9110 (a GET body has no defined meaning there, but is not
    forbidden); the chapter never claims which methods may carry a body.
- id: mdn-cookies
  title: Using HTTP cookies
  author: MDN Web Docs
  url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [a cookie is a small piece of data a server sends to the browser, which may store it and send it back with later requests; Set-Cookie in responses, Cookie in requests; used for session management]
  note: mdn/content @ bd7387a, fetched from raw.githubusercontent.com.
- id: mdn-sse
  title: Server-sent events
  author: MDN Web Docs
  url: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [traditionally a page must send a request to receive new data; with server-sent events a server can push messages to the page at any time]
  note: mdn/content @ bd7387a, fetched from raw.githubusercontent.com. Detail deferred to `realtime`.
- id: mdn-websockets
  title: WebSocket API (WebSockets)
  author: MDN Web Docs
  url: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [WebSockets open a two-way interactive session between browser and server, so messages arrive without polling]
  note: mdn/content @ bd7387a, fetched from raw.githubusercontent.com. Detail deferred to `realtime`.
- id: pg-architecture
  title: "PostgreSQL documentation, Getting Started: Architectural Fundamentals"
  author: The PostgreSQL Global Development Group
  url: https://www.postgresql.org/docs/current/tutorial-arch.html
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [PostgreSQL uses a client/server model; a server process accepts connections from client applications and acts on their behalf; a client can be a web server that accesses the database to display web pages; client and server can be on different hosts and then talk over a TCP/IP connection]
  note: >-
    doc/src/sgml/start.sgml in postgres/postgres REL_18_STABLE @ 35f60e5 (fetched from raw.githubusercontent.com;
    postgresql.org itself not tried). The page's process-per-connection detail is not used.
```

## Open questions / unverified

- RFC 6265's successor: as of the HTTP WG's published-RFC site snapshot (2026-10-19, RFCs up to 10036) no
  published RFC replaces 6265, and 6265bis is still an editor's copy in the WG repo (2026-10-27). Not confirmed
  against the RFC Editor's index or Datatracker (unreachable). The chapter uses only the Set-Cookie → Cookie
  mechanism. Check the published status before a chapter teaches cookie attributes.
- The published RFC 9110, 9112 and 6265 texts were read as rendered by the HTTP working group (httpwg.org), not
  from rfc-editor.org, which is unreachable from this container.
- "Three causes of no response" (request lost, response lost, response late) is derived, not quoted: RFC 9110 §7.5
  says clients may abandon requests and RFC 9112 §9.5 that connections can close at any time; the list is the
  cases of a two-message exchange. A connection closed mid-response is folded into "response lost".
- Whether a server notices that a client gave up is deliberately left to `timeouts-retries`; the worked example
  says only that it depends on the server.
- The Idempotency-Key field is an IETF Internet-Draft (read in the WG's editor's copy @ a2cd12a; cited section
  numbers checked against the WG's rendering of it on 2026-10-27). Its latest submitted draft number and IETF
  status could not be checked (Datatracker unreachable); the chapter presents it as a draft and only for the
  behaviour stated in that copy.

## Evidence

Final evidence: every line below was run on the final code (6b5f8d5 plus the third review's note fixes, the commit that marks this chapter verified), 2026-10-27:

- typecheck: pass — npx tsc --noEmit (2026-10-27)
- lint: pass — npm run lint, no warnings or errors; prettier --check src docs clean (2026-10-27)
- model tests: pass — npm test, 159 tests (63 client-server model: indistinguishability per method, POST
  duplicates, keyed replay, keyed 409 while in progress, keyed first-arrival after a lost request, PUT and GET per
  fault, late-case event order per method, the late "starts" step naming the order its reply carries, 32-case invariants, determinism, prediction answers from the model; 93
  web-request; 3 curriculum). Mutation check: telling the late reply before the retry fails 5 tests (2026-10-27)
- pre-commit audit: pass — fallow audit (new-only): verdict pass, 0 complexity findings; the one listed issue
  (unused dependency `critters`) is pre-existing, `introduced: false` (2026-10-27)
- course checks: pass — course.mjs check ok; course.test.mjs 23/23 (2026-10-27)
- build and JS budget: pass — next build: /learn/client-server 112 kB first-load JS (budget 120 kB); /learn 107 kB,
  /learn/web-request 111 kB, / 110 kB (unchanged). Browser, script bodies before the load event (gzip):
  /learn/client-server 111.2 KB, /learn/web-request 111.0 KB, /learn 106.5 KB, / 112.9 KB (2026-10-27)
- browser sizes: pass — Playwright at 375×812, 402×874, 768×1024, 1280×800, 1440×900, 1920×1080: no horizontal
  scroll before and after a run, no console errors; figure screenshots read at 375 and 1280 (2026-10-27)
- keyboard: pass — Playwright keyboard-only: method and fault radios (arrows), retry checkbox (Space), Run and step
  buttons (Enter), Skip and Next keep focus when they become aria-disabled, answers open with Enter; visible 2 px
  focus (2026-10-27)
- reduced motion: pass — Playwright reducedMotion: no element in the figure transitions or animates; all events
  listed and results shown after Run (2026-10-27)
- accessibility scan: pass — axe-core 4.10.3, WCAG 2.0/2.1/2.2 A and AA at 375 and 1280 px, on load with answers
  open and after reveal and a run: 0 violations (2026-10-27)
- browser suite: pass — 48/48 checks for /learn/client-server (incl. a label-geometry check in every late case) (sizes, console, axe, leak checks, incomplete /
  right / wrong feedback with per-option reasons, keyboard, live summary and step announcements, stale-result
  clearing, cases A–C, late case drawn and listed in time order, citation links and numbering, reduced motion,
  /learn and chapter 1 link to chapter 2, sitemap, / renders); chapter 1 regression suite 69/69 (2026-10-27)
- lighthouse: pass — Lighthouse 13.4.1 on the final build: /learn/client-server 100 and 99 mobile, 100 desktop;
  /learn/web-request 99 / 100; /learn 99 / 100; / 97 / 100; accessibility, best practices and SEO 100; CLS 0.
  Earlier builds of this chapter: af07b7c's first mobile run scored 84 (TBT 510 ms, first run after a server
  start), then 100, 99, 99; 607f1d5 scored 100 / 100 (2026-10-27)

## Review findings

Reviewer: fresh subagent (implementation review of dceb551..af07b7c, production build of af07b7c, source copies), 2026-10-27, rubric verification.md

- [blocking] In the response-late case the event list and drawing said the first request had finished ("creates a new order", "its 201 comes too late") before the retry arrived, contradicting the retry's 409 → fixed (model emits "starts …" for the first attempt, the client gives up, any retry runs, then the first finishes last; the drawing puts the late response at the bottom; unit tests on event order for every method)
- [should-fix] Worked-example order numbers did not line up (step 2 read as a second order, step 3's retry as /orders/43) → fixed (step 2 is the same order 42 on a slow day; page and spec)
- [should-fix] Fig. 1 labels crossed the lanes and scaled up on wide screens → fixed (labels centred between the lanes and shortened; drawing capped at 26rem)
- [should-fix] Citations claimed more than their sections: "most exchanges have only the final one" (§15.2), "repeated PUT undoes their change" (§9.3.4), key reuse on retries (§2.2) → fixed (first dropped; second marked derived; third cites §2, §2.2)
- [note] Exercise lost the spec's "without new technology" hint → fixed (page restores it)
- [note] Spec Visual step 8 contradicted itself on Check with open questions → fixed (wording matches the code)
- [note] Wrong-answer feedback was the same for every option → fixed (a reason per wrong option)
- [note] B's feedback said "sends back the original result", more than the draft's "consistent with the original" → fixed (says consistent; the stored result is labelled a model choice)
- [note] "Three causes" presented as complete → fixed (assumption "completely or not at all" stated at first mention)
- [note] "Server never sends unasked" stated without scope; RFC 9110 §3.3 applied to a database connection → fixed (scoped to HTTP/1.1 as described; "the same idea outside HTTP" with the PostgreSQL source)
- [note] The figcaption's "records each key with its result" hints at B before Check → accepted: an assumption the model needs, it states no outcome; answers stay gated
- [note] A code block scrolled without keyboard access at 320 px → fixed (code wraps)
- [note] Program, Exchange, Cookie and Status code missing from the page's parts list → fixed for Exchange and Cookie; accepted for Program (defined inside "Client and server") and Status code (taught in chapter 1)
- [note] The browser suite in Evidence is not in the repo, so it cannot be re-run from it → accepted: it needs a locally downloaded axe-core and a running build; its results are recorded here and its location in the session report; committing a runnable suite is a follow-up
- [note] After a reveal, changing a radio shows the plain answer list until Check is pressed again → accepted: harmless

Reviewer: fresh subagent (check of the fixes af07b7c..607f1d5, production build of 607f1d5), 2026-10-27, rubric verification.md. The blocking finding is confirmed fixed; no new blocking finding.

- [should-fix] The tail label "first request finishes, late" crossed both lanes (bbox 43–277 vs lanes 50/270) → fixed (shortened to "first finishes, late"; "retry, first still busy"; browser check that every centred label stays within x 52–268 in all late cases)
- [should-fix] COURSE_STATE was not updated for the unit (Next action, Open issues, log) → fixed
- [note] The "server still working" bar was always heavy and stopped before the retry → fixed (dashed from the first request's start to its late reply; heavy only on the "starts" step)
- [note] In POST late + retry the retry got /orders/44 before the first finished as /orders/43 → fixed ("starts creating order 43 (slowly; its number is taken now)")
- [note] "(as described for HTTP/1.1 …)" cited RFC 9110 §3.4, which neither scopes to HTTP/1.1 nor says "never unsolicited" → fixed (qualifier dropped; "answers requests" cites §3.4, "does not start one of its own" cites MDN's overview)

Reviewer: fresh subagent (final check of 607f1d5..6b5f8d5, production build of 6b5f8d5), 2026-10-27, rubric verification.md. No blocking or should-fix finding; every finding of the previous block confirmed resolved.

- [note] The dashed still-busy line ran through the retry's server box → fixed (moved to x=290, clear of the boxes)
- [note] "order 43" in the late start text is a literal with no test tying it to the late reply's Location → fixed (unit test for POST and POST with key, with and without retry)
- [note] Evidence did not say which build each line covers; JS budget and Lighthouse not re-run on 6b5f8d5 → fixed (all re-run on the final code; Evidence names it)

