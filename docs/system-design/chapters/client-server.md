# Clients, servers and request–response

Id: client-server · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Implementation: none yet. The owner has not authorized adding this chapter to `/learn` (2026-10-27); the spec stops
at step 5 (Authored).
Prerequisites: web-request · Related: http, idempotency, timeouts-retries, stateless-services, realtime,
message-queues, ip-and-ports

## Boundary

Objectives (observable):

1. Say which program is the client and which is the server in a described exchange, including a program that is a
   server on one connection and a client on another.
2. Name the parts of one HTTP request (method, target, header fields, optional body) and of one response (status
   code, header fields, optional body), given the raw text of an HTTP/1.1 exchange.
3. Explain what a client can and cannot know when no response arrives, and use that to say which requests are safe
   to send again automatically.
4. Explain what "HTTP is stateless" means and how a site still remembers a visitor between requests.

In scope: the two roles, who starts an exchange, what one request and one response contain, statelessness and
where state goes instead, and the one failure every client must reason about: no response. One mechanism: a
request–response exchange between two roles, and what each side knows.

Deferred:

- Addresses, packets and ports, and why a server can't simply open a connection to a phone → `ip-and-ports`,
  `cloud-networking`
- Every method, status code and header in detail; how HTTP/1.1 frames a message → `http`
- HTTP/2 and HTTP/3, where messages are not plain text → `http-versions`
- Making a non-idempotent operation safe to retry (idempotency keys) → `idempotency`
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
      send one or more interim responses (1xx) before the final one; most exchanges have just the final one.
      [rfc9110 §3.4, §15.2]
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

8. **What the learner can change and watch.** In the visual (Visual, below), the learner picks:
   - the method: `GET /orders/42`, `PUT /orders/42` (set the quantity to 2) or `POST /orders` (place an order);
   - what happens on the way: nothing goes wrong, the request is lost, the response is lost, or the response is
     late (the server answers after the client's timeout);
   - whether the client sends the request again once.

   They watch what the client sees, how many times the server carried out the request, and the resulting state on
   the server (number of orders placed, the order's quantity).

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

**Step 2: the slow day.** The same request reaches the server, which starts placing the order. At 5 s the app gives
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
- `PUT` with a whole new representation of the order is the idempotent way to change it; how to make `POST`
  safe to repeat is `idempotency`.

## Visual

Decision: **stepper with a small discrete model** because the mechanism is a short sequence of discrete events
(request sent, maybe lost, server acts, response sent, maybe lost or late, client decides), and the point is to
compare a few cases side by side. No simulation is needed: there is no load, randomness or time series. No 3D.

Visual spec (the 14-step process):

1. **Mechanism made visible:** the client sees only what arrives. Three different failures look identical from the
   client's side, and only the method decides whether sending again is safe.
2. **Misconception to break:** "no response means nothing happened, so try again".
3. **Medium:** a stepper of frames on a two-column sequence diagram (client on the left, server on the right, time
   downwards), plus a state panel for the server. Frames: request sent; request arrives (or is lost); server acts;
   response sent; response arrives (or is lost or late); client decides; retry (if chosen).
4. **Parts on screen:** client, server, the request arrow and the response arrow, the client's timeout line, and
   the server's state ("orders placed", "order 42 quantity"). Each is a term from "Parts you'll meet".
5. **Model:** `exchange(method, fault, retry) → { clientSees, applied, orders, quantity }`.
   - Inputs: `method` ∈ {GET, PUT, POST}; `fault` ∈ {none, request lost, response lost, response late}; `retry`
     ∈ {no, once}.
   - Server state before the exchange: 1 order (order 42, quantity 1). `GET` reads it, `PUT` sets the quantity to
     2, `POST` creates a new order.
   - The first attempt: with `request lost`, the server does nothing; with `none`, `response lost` or
     `response late`, the server carries out the request once. The client sees the response only with `none`;
     with the other three it sees "no response before the timeout".
   - The retry (only if chosen and the first attempt showed no response): it arrives, the server carries it out,
     and its response arrives in time.
   - Outputs: what the client saw on each attempt; `applied` = how many times the server carried out the request
     (0, 1 or 2); `orders` = number of orders; `quantity` = order 42's quantity.

   Assumptions, shown beside the visual: one retry at most; the retry always succeeds; the server carries out a
   request completely or not at all; nothing else changes the orders meanwhile; no proxies; "teaching model, not
   a benchmark".
6. **Controls:** method (3 options, default `POST`), what goes wrong (4 options, default `none`), retry (on/off,
   default off). No numeric controls: the timeout and server time are labelled assumptions in the worked example,
   not inputs.
7. **Readouts:** what the client saw (per attempt), how many times the server carried out the request, orders
   placed, order 42's quantity. All computed from the model.
8. **Prediction prompt (predict, then run):** before the learner turns retry on, with `POST` and "response lost"
   chosen: "The app saw no response and sends the request again. How many new orders will the server have placed?"
   (choices 0, 1, 2). Show the model's answer (2) next to theirs, then ask the same with `PUT`: "What will order
   42's quantity be?" (model: 2, the same as without the retry). The prompt names the fault so the answer is
   determined; the readout then shows that the client's view was the same for all three faults.
9. **Signaling:** the current frame's arrow is heavy; a lost message ends in a cross mark at the point it stopped;
   a late response crosses below the client's timeout line. The state panel's changed value is outlined when it
   changes.
10. **States:** delivered = solid arrow; lost = dashed arrow ending in a cross; late = solid arrow ending below the
    dashed timeout line, labelled "late: client stopped waiting"; each state also in text. Never colour alone
    (monochrome drawing set).
11. **Text alternative:** a live summary that updates when an input changes, e.g. "POST, response lost, retried
    once: client saw no response, then 201 Created. The server placed 2 orders; 3 orders exist." Step changes are
    announced in a second polite region, as in `web-request`.
12. **Reduced motion:** all frames are listed as a numbered sequence; arrows are drawn finished; nothing animates.
13. **Tests (when implemented):**
    - Without retry, the client sees the same thing for `request lost`, `response lost` and `response late`
      (indistinguishability), for every method.
    - `applied` is 0 for `request lost` without retry, 1 for the other faults without retry, and 1 or 2 with a
      retry (2 exactly when the first attempt reached the server but its response did not reach the client in
      time: response lost or late; with `none` no retry is sent).
    - `POST` with `response lost` or `response late` and a retry gives 3 orders (the worked example's duplicate);
      `PUT` gives quantity 2 once the server has carried it out, whether once or twice (quantity stays 1 only for
      `request lost` without a retry); `GET` never changes the state.
    - Every combination (3 × 4 × 2 = 24) gives `applied` in [0, 2] and `orders` in [1, 3].
14. **Smallest width first:** at 375 px, the controls, the sequence diagram and the state panel stack in one
    column; the diagram keeps two narrow lanes (client, server) so arrows stay readable. From 900 px the controls sit
    on the left and the diagram and state panel on the right.

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
3. _(after question 7, step 7)_ The app sent `POST /orders` and saw no response before its timeout. What does it
   know about the order?
   - **Answer:** nothing. The request may have been lost (no order), or the order may have been placed and the
     response lost or late. [rfc9110 §7.5]
   - **Wrong: "no order was placed".** That is only one of the three cases.
   - **Wrong: "the order was placed, because the request was sent".** Sending is not arriving.
   - Revisit question 5 and the worked example, step 2.
4. _(after question 7, step 8)_ A connection fails before the client could read any response. Which of these
   requests can the client send again automatically: `GET`, `PUT`, `DELETE`, `POST`?
   - **Answer:** `GET`, `PUT` and `DELETE`: they are idempotent, so repeating has the same intended effect as
     sending once. Not `POST`, unless the client knows that repeating is safe for that resource. [rfc9110 §9.2.2]
   - **Wrong: "only GET, because it doesn't change anything".** `PUT` and `DELETE` change things but are still
     idempotent: deleting twice leaves the resource deleted (the second response may differ, for example "not
     found", but the effect is the same). [rfc9110 §9.2.2]
   - **Wrong: "all of them, the server will sort it out".** Nothing in a plain `POST` marks it as a repeat, so
     the server carries it out again (derived; how to add such a mark is `idempotency`).
   - Revisit question 7, step 8.
5. _(after question 7, steps 5–6)_ You add a lamp to your basket, and the next page shows it still there. HTTP is
   stateless. How does the server know it is your basket?
   - **Answer:** the browser sends something with each request that identifies you, typically a cookie the server
     set earlier with `Set-Cookie` and the browser returns in `Cookie`. [rfc6265 §3; mdn-cookies]
   - **Wrong: "because you are still on the same connection".** A server must not assume two requests on one
     connection come from the same user agent, and connections can be closed and reopened at any time.
     [rfc9110 §3.3; rfc9112 §9.5]
   - Revisit question 7, steps 5–6.

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
    gap; the general fix, letting the server recognise a repeated `POST`, is `idempotency`.

Spaced review:

- `http` re-asks Q2 (parts of a request and a response).
- `idempotency` re-asks Q4 and the exercise (which requests are safe to repeat).
- `timeouts-retries` re-asks Q3 (what a timeout tells the client).
- `stateless-services` re-asks Q5 (where state lives).

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
  supports: [header fields are sent before the content and add metadata (§6.3); content is the data after the header section (§6.4); client and server are roles per connection; the same program can be both (§3.3); HTTP is stateless, each request understood in isolation, a server must not assume two requests on one connection come from the same user agent (§3.3); request = method + target + optional header fields, content, trailers; response = status code + optional header fields, content (§3.4); one or more responses per request (§3.4); user agent (§3.5); origin server (§3.6); intermediaries (§3.7); example exchange (§3.9); determining the target (§7.1); clients may abandon a request without a response; no set wait (§7.5); method semantics (§9.1); safe methods (§9.2.1); idempotent methods and retry rule (§9.2.2); GET (§9.3.1); POST and 201 with Location (§9.3.3); status classes (§15); 1xx interim (§15.2); 201 Created (§15.3.2); Content-Type gives the media type (§8.3); Content-Length gives the data length in octets (§8.6)]
  note: >-
    Read in the published text as rendered by the HTTP WG (httpwg.org/specs/rfc9110.html, httpwg/httpwg.github.io
    @ ce03dd5; urn:ietf:rfc:9110, issued 2022-06), the copy section-checked for `web-request`. Sections were
    extracted by their heading ids and read in full for §3.3–§3.7, §3.9, §7.5, §9.1, §9.2.1, §9.2.2, §9.3.3, §15,
    §15.2, §15.3.2, and the opening paragraphs of §6.3 (header fields), §6.4 (content; HTTP/1.1 message body vs
    content), §7.1 (target resource), §8.3 (Content-Type) and §8.6 (Content-Length). rfc-editor.org itself is unreachable from this container.
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
    (draft-ietf-httpbis-rfc6265bis) intends to obsolete RFC 6265; whether it has been published could not be
    checked (see rfc6265bis below and Open questions).
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
    Lead only; check before `http` or `stateless-services` relies on cookie details.
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

- RFC 6265 may have been obsoleted by the 6265bis revision; search results show it approved and in the RFC Editor
  queue but no published number. The chapter uses only the Set-Cookie → Cookie mechanism, which the drafts keep.
  Check the published status before a chapter teaches cookie attributes.
- The published RFC 9110, 9112 and 6265 texts were read as rendered by the HTTP working group (httpwg.org), not
  from rfc-editor.org, which is unreachable from this container.
- "Three causes of no response" (request lost, response lost, response late) is derived, not quoted: RFC 9110 §7.5
  says clients may abandon requests and RFC 9112 §9.5 that connections can close at any time; the list is the
  cases of a two-message exchange. A connection closed mid-response is folded into "response lost".
- Whether a server notices that a client gave up is deliberately left to `timeouts-retries`; the worked example
  says only that it depends on the server.
- Implementation, tests and an independent review are pending the owner's authorization to add this chapter to
  `/learn`.

## Evidence

- spec format: pass — `npx prettier --check docs/system-design/chapters/client-server.md` and `course.mjs check`
  (2026-10-27)
- independent review: not run — mode C stops at step 6 (implementation awaits the owner's authorization); the
  skill runs the independent review at step 8, after implementation and tests (2026-10-27)

## Review findings

None yet: no independent review has run on this chapter.
