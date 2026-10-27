# Map: what happens when you open a website

Id: web-request · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Implementation: `src/app/learn/web-request/page.tsx`, `src/components/learn/web-request/JourneyStepper.tsx`,
`src/lib/learn/web-request-model.ts` (+ `.test.ts`), `src/content/learn/web-request-sources.ts`
Prerequisites: none · Related: client-server, dns, tcp, tls, http, http-caching, latency-throughput, http-versions

## Boundary

Objectives (observable):

1. Name, in order, the steps between pressing Enter on `https://example.com/` and seeing the page:
   1. read the URL
   2. look up the hostname
   3. open a connection
   4. secure it
   5. send the request
   6. receive the response
   7. parse and render
2. Say which steps wait on the network, and count the round trips a first visit needs before the first byte of the
   page arrives.
3. Predict which steps a repeat visit can skip (cached name, reused connection, fresh cached response) and why that
   is faster.
4. Read a browser's timing entry for a page and point to the step that took the longest.

In scope: the journey as a whole, and where its time goes. Each step gets one plain paragraph and a link forward.
This is a map chapter: its one idea is the order of the steps and the cost of each.

Deferred:

- How names are resolved (resolvers, authoritative servers, TTLs) → `dns`
- Packets, addresses and ports → `ip-and-ports`
- How TCP makes a reliable stream; slow start and congestion control → `tcp`
- What TLS proves and how keys are agreed; resumption and 0-RTT data → `tls`
- Methods, status codes and headers in detail → `http`
- HTTP/2, HTTP/3 and QUIC, including whether hostnames can share a connection → `http-versions`, `udp-quic`
- Cache freshness, validation and `Cache-Control` → `http-caching`
- Latency versus bandwidth, and transmission time → `latency-throughput`
- What the server does to build the response → stage 4 onwards (`stateless-services`, `load-balancing`, databases)
- Load balancers, CDNs and proxies between browser and server → `load-balancing`, `cdn`, `reverse-proxies`

Misconceptions targeted:

- "The page is one download." A page is an HTML document plus the further requests it causes (styles, scripts,
  images), often to several hostnames. [mdn-http-overview]
- "A faster internet plan (more bandwidth) makes every page load fast." Much of a first visit is waiting for
  messages to go there and back. The time a message spends travelling does not depend on how many bytes per second
  the link carries. (Derived from the definition of a round trip [mdn-rtt]. Simplification: sending each message
  also takes a little time that does depend on bandwidth. This chapter leaves that out, and `latency-throughput`
  separates the two.)
- "Encryption is what makes HTTPS slow." TLS 1.3's full handshake adds one round trip [rfc9846 §2], and a
  connection that stays open for later requests [mdn-http-overview] pays it only once (derived).
- "Once the HTML arrives, the page is done." The browser still has to parse, fetch subresources, lay out and paint.
  [mdn-how-browsers-work]

## Parts you'll meet

- **Browser (user agent):** the program that fetches pages and shows them. HTTP calls a program that starts a
  request a user agent, and the browser is its most familiar form. [rfc9110 §3.5]
- **Client and server:** in one connection, the client sends requests and the server accepts the connection and
  answers with responses. These are roles, not kinds of machine. [rfc9110 §3.3]
- **URL:** the address you type. It has:
  - a scheme (`https`), which says which protocol to use;
  - an authority: the hostname (`example.com`) and an optional port;
  - a path (`/about`);
  - optional parameters.

  [mdn-url]
- **Hostname:** the name part of the URL's authority, such as `example.com`. People use names. Computers send data
  to numeric IP addresses. [mdn-url, mdn-dns]
- **IP address:** the number that identifies a machine on the internet, such as `192.0.2.172` (how it works:
  `ip-and-ports`). [mdn-dns]
- **Port:** the number that picks which "gate" on the server to use. URLs leave it out when it is the standard one:
  80 for HTTP, 443 for HTTPS. [mdn-url]
- **DNS lookup:** turning a hostname into an IP address. [mdn-dns]
- **Connection:** an agreed channel between browser and server that delivers bytes reliably and in order. HTTP
  needs one underneath it [rfc9110 §3.3]. TLS likewise needs a "reliable, in-order data stream" [rfc9846 §1]. On
  the web, TCP provides it [mdn-http-overview].
- **Handshake:** messages exchanged to set something up before the real data flows. [mdn-tcp-handshake]
- **Round trip:** the time for a message to reach the other side plus the time for the answer to come back.
  [mdn-rtt]
- **TLS:** the layer that encrypts the connection and authenticates the server. An `https` URL means HTTP over a
  TLS-secured connection. [rfc9846 §1, rfc9110 §4.2.2]
- **Request and response:** the browser's message asking for something, and the server's answer. Every response
  has a status code: three digits, where the first digit gives the class (2xx success, 4xx client error, and so
  on). [rfc9110 §3.4, §15]
- **Time to first byte:** the time from asking for the page until the first byte of the response arrives.
  [mdn-how-browsers-work]
- **Cache:** a local store of earlier responses, used to answer later, equivalent requests without going all the
  way to the server. [rfc9110 §3.8, rfc9111 §1]
- **Parse and render:** the browser turns the HTML into the DOM (a tree of the page's elements) and the CSS into
  the CSSOM (a tree of styles). It combines them into a render tree, works out where each box goes (layout), and
  paints pixels. [mdn-how-browsers-work, mdn-crp]

Glossary rules for the course:

- Say "round trip", not "RTT" alone, until `latency-throughput`.
- Say "hostname" for the name in a URL, and "domain name" only when talking about DNS in general.
- Say "connection" for the transport channel, and "request" for one HTTP message.

## Explanation (14 questions)

1. **Problem.** You type `https://example.com/` and press Enter. The first visit of the day takes noticeably longer
   than a second visit a minute later. What is the browser doing during that time, and why does the second visit
   take less? [mdn-how-browsers-work: navigation; DNS caching]

2. **Why it matters.** Every system design question starts and ends at a user waiting for a response. If you
   can't say where the time goes in one page load, you can't tell whether a design change will help. Typical
   changes are a cache, a CDN or a new region. MDN's performance guide calls latency "the biggest threat" to a
   fast-loading page. [mdn-how-browsers-work: overview]

3. **Beginner's first try.** "The browser downloads the page from the server. The time it takes is the size of the
   page divided by my connection speed."

4. **Why that works at first.** For a large file on a connection that is already open, size divided by speed is a
   fair estimate, because transfer time grows with size. The model also gets two things right: the direction
   (server to browser), and that the page comes back in a response to a request. [rfc9110 §3.3, §9.3.1]

5. **When it fails.** It fails for a small page on a first visit. The model predicts almost no time, because the
   bytes are few. In reality, before a single byte of the page can arrive, the browser has to:
   - find the server's address,
   - open a connection,
   - secure it,
   - send the request.

   Each of these waits for messages to cross the network and come back, and a bigger bandwidth does not shorten
   that travel. (Derived; see the second misconception.) The model also misses that the HTML names further files
   (CSS, scripts, images), and each of those needs its own request, sometimes to other hostnames.
   [mdn-how-browsers-work: DNS lookup, TCP handshake, TLS negotiation, parsing; mdn-http-overview]

6. **A better observation.** Browsers record a timestamp at each stage of a page fetch, and a page can read them
   through the Navigation Timing API. A `PerformanceNavigationTiming` entry carries the network timestamps defined
   for resources:
   - `domainLookupStart` and `domainLookupEnd`
   - `connectStart` and `connectEnd`
   - `secureConnectionStart`
   - `requestStart`
   - `responseStart` and `responseEnd`

   [navtiming-2; mdn-nav-timing; mdn-prt]

   Subtracting timestamps gives the cost of each step:
   - DNS time = `domainLookupEnd − domainLookupStart`. [mdn-prt]
   - Waiting for the response = `responseStart − requestStart` [mdn-prt]. That interval holds the request's round
     trip plus the server's processing time (derived from step 5 below).
   - On an `https` page, `connectEnd` comes after the TLS handshake. The Fetch standard, which defines these
     times, says the connection end time "must include the time interval to complete enough of the TLS handshake
     to request the resource". It takes the secure connection start "immediately before starting the handshake
     process" [fetch: record connection timing info]. So:
     - TCP time ≈ `secureConnectionStart − connectStart`
     - TLS time ≈ `connectEnd − secureConnectionStart`

     (Derived from the Fetch definitions. MDN's shortcut "TCP = `connectEnd − connectStart`" counts both together on
     an `https` page; see Sources. Over HTTP/3 the two start times are equal [fetch], because QUIC sets up
     encryption as part of the connection → `udp-quic`.)

   Comparing a first visit with a repeat visit shows which steps disappear. When a fetch reuses a connection that was
   opened earlier, the Fetch standard sets the DNS and connection timestamps all to the fetch's start, so the entry
   shows 0 ms for DNS, TCP and TLS. [fetch: clamp and coarsen connection timing info]

7. **The real mechanism.** A page load is a chain of steps. In the simple model this chapter uses, most early steps
   are waits for a message to go there and back, so each costs at least one round trip before the next can start.
   Real browsers and networks have optimisations this model leaves out; later chapters add them.
   1. **Read the URL.** The scheme says to use HTTPS. The authority gives the hostname and an optional port (443 by
      default for HTTPS). The path says which resource to ask for. [mdn-url]
   2. **Look up the hostname (DNS).** The browser needs the server's IP address. On a first visit, a DNS lookup
      asks name servers. Afterwards, the answer is likely cached, so later requests skip it. Each different hostname
      the page uses needs its own lookup. [mdn-how-browsers-work: DNS lookup; mdn-dns] (Simplified: a cache can
      sometimes answer even your first lookup; where DNS caches live is taught in `dns`.)
   3. **Open a connection (TCP).** The browser and server exchange three messages before the request is sent:
      SYN, SYN-ACK and ACK [mdn-tcp-handshake]. The browser sends the SYN and must wait for the SYN-ACK to come
      back before it can send anything else. So the handshake costs one round trip before the request can follow
      the ACK. (Round-trip count derived from the message sequence. One MDN page says "several round-trips"; see
      Sources.)
   4. **Secure it (TLS).** For HTTPS, a TLS handshake agrees keys and authenticates the server before the request
      is sent. In TLS 1.3's full handshake:
      - the client sends its first message, the ClientHello;
      - the server answers with a ServerHello, its parameters, its certificate and a Finished message;
      - the client sends its own Finished together with its first application data.

      So the handshake adds one round trip [rfc9846 §2, figure "Message Flow for Full TLS Handshake"]. If the
      server needs the client to retry with different key-exchange parameters, that adds another round trip
      [rfc9846 §2.1, §4.2.4, §4.3.8].
   5. **Send the request; wait for the response.** The browser sends an HTTP request, normally `GET` for the page.
      The server works out its answer, then sends a response with a status code (for example 200 OK) and the HTML.
      This is one more round trip plus the server's own processing time. [rfc9110 §9.3.1, §15;
      mdn-how-browsers-work: response]
   6. **Parse, fetch more, render.** As the HTML arrives, the browser parses it into the DOM. It requests the
      resources the HTML names (stylesheets, scripts, images). Browsers can also use a "preload scanner" that reads
      ahead and starts some of those downloads early. The browser builds the CSSOM, combines it with the DOM into a render tree,
      lays out and paints. A script without `async` or `defer` pauses HTML parsing until it has run. Either way, the browser finds those files by reading the HTML (the parser or the preload scanner), so they are requested after the HTML's first byte arrives. [mdn-how-browsers-work: response, parsing, preload scanner, render; mdn-crp]

   **Counting the network for a first visit.** On a first visit to an HTTPS site over TCP and TLS 1.3, the first
   byte of the HTML arrives after:
   - the DNS lookup,
   - one round trip for TCP,
   - one for TLS,
   - one for the request and response,
   - the server's processing time.

   That is three round trips to the server plus DNS before anything can appear. (Derived from steps 2–5.) The count
   assumes no redirects and none of three shortcuts, each taught later:
   - TCP Fast Open, which lets data ride on the first TCP message (→ `tcp`);
   - TLS "0-RTT" early data, sent before the handshake finishes (→ `tls`);
   - HTTP/3, which runs over QUIC instead of TCP (→ `http-versions`).

   **Why the second visit is faster:**
   - The hostname is cached, so there is no DNS wait. [mdn-how-browsers-work: DNS lookup]
   - If the connection from the first visit is still open, it can be reused, so there is no TCP or TLS handshake.
     Keeping
     connections open for reuse ("persistent connections") arrived in HTTP/1.1. [mdn-http-overview: HTTP and
     connections]
   - If the browser holds a fresh cached copy of the response, it can reuse it without contacting the server at
     all. [rfc9111 §1; mdn-caching]

8. **What the learner can change and watch.** In the visual:
   - **Visit type:** first visit, repeat visit on a warm connection, or a fresh cached copy.
   - **Round-trip time** (assumed, in milliseconds).
   - **DNS time** (assumed, in milliseconds).
   - **Server processing time** (assumed, in milliseconds).

   The model shows each step's cost and the time to the HTML's first byte. Every number is computed from those
   inputs.

9. **Alternatives.** Ways to make the journey shorter:
   - **Reuse what you already have:** the DNS cache, persistent connections and the HTTP cache.
   - **Move the server closer**, so each round trip is shorter (→ `cdn`, `multi-region`).
   - **Need fewer round trips per connection** (→ `http-versions`, `udp-quic`; resumption → `tls`).
   - **Use fewer hostnames**, so there are fewer lookups and connections.
   - **Make the server answer faster** (→ stages 3–5).

10. **Trade-offs.** Questions 10–12 are design judgement derived from the mechanism above. Their specifics are
    sourced in the linked chapters, not here.
    - **Caching** can serve something stale (→ `cache-invalidation`).
    - **Keeping connections open** holds memory and connection slots on the server for idle clients
      (→ `load-balancing`, `utilisation-queueing`).
    - **Moving servers closer** costs money and adds copies to keep consistent (→ `cdn`, `replication`).
    - **Fewer round trips through early data** (TLS "0-RTT"): that data has weaker security properties.
      [rfc9846 §2.3]
    - **Fewer hostnames** can conflict with using third-party services.
    - **A faster server** usually means engineering work, caching or more machines (→ stages 3–5).
11. **When to choose each.**
    - Reuse and caching help repeat visits, and pages that load many resources from the same place.
    - Moving closer helps when round trips dominate the timing entry, for example users far from the server.
    - Server work helps when `responseStart − requestStart` dominates and is much larger than one round trip.
12. **When not to.**
    - Don't add a CDN or a region to fix a slow database query: the timing shows the time inside the server's
      answer, not in the round trips.
    - Don't buy bandwidth for a page made of many small requests: round trips dominate, not bytes.
13. **Explain it in your own words.** "Explain to a friend why opening a website a second time is faster. Use the
    words 'round trip', 'cache' and 'connection'."
14. **Apply it elsewhere.** A mobile app calls an API on a server it has never contacted.
    - Which of the six steps still happen? (Steps 2–5 are the same idea; step 6 becomes the app parsing JSON and
      updating its screen.)
    - Which can the app avoid on its second call?

## Worked example

Assumed values, for this example only (not measurements of any real site):

- round trip to the server: 40 ms
- DNS lookup: 30 ms
- server processing: 50 ms
- HTTPS with TLS 1.3 over TCP, no redirects

**First visit, time to the HTML's first byte:**

1. DNS lookup: 30 ms.
2. TCP handshake: 1 round trip = 40 ms.
3. TLS 1.3 full handshake: 1 round trip = 40 ms.
4. Request and first byte of the response: 1 round trip = 40 ms, plus 50 ms of server processing.

Total: 30 + 40 + 40 + 40 + 50 = **200 ms**. Of that, 150 ms is network waiting (DNS plus three round trips) and
50 ms is the server.

**Repeat visit on a reused connection, with the hostname cached** (the learner completes this; fading):

1. DNS lookup: skipped, because the hostname is cached. 0 ms.
2. TCP handshake: skipped, because the connection is reused. 0 ms.
3. TLS handshake: skipped, on the same connection. 0 ms.
4. Request and first byte: 40 + 50 = **90 ms** ← the learner fills this in.

**Fresh cached copy:** no request leaves the browser for this response, so the network time is 0 ms.

What the example shows: on the first visit, network waiting is 150 of the 200 ms, and it is the same for a page of
any size. In this model, a bigger bandwidth changes none of those 150 ms.

Simplifications flagged (each corrected in its chapter):

- DNS is one fixed cost; in reality it may need several queries, or none if cached (→ `dns`).
- The first byte arrives one round trip after the request. Larger responses take longer, and TCP starts by sending
  little (→ `tcp`).
- No time is modelled for pushing bytes onto the link (→ `latency-throughput`).

## Visual

Decision: **stepper with a computed comparison** (static frames, learner-paced, plus a closed-form model).

- The journey is a sequence of discrete steps, which is the stepper case in visualization-and-simulation.md.
- The "where time goes" claim depends on a few inputs, so a tiny closed-form model computes it.
- No discrete-event simulation is needed. There is no 3D: depth carries no meaning here.

Visual spec (the 14-step process):

1. **Mechanism made visible:** a page load is a chain of waits, most of them round trips. Repeat visits remove
   links from the chain.
2. **Misconception to break:** "page load time = size ÷ bandwidth".
3. **Medium:** a stepper of six frames, one per step, plus a timeline bar computed from the model. Frames 1 (read
   the URL) and 6 (parse and render) carry no milliseconds: the model times only what happens before the HTML's
   first byte (frames 2–5).
4. **Parts on screen:** browser, DNS name server and web server, with the connection drawn as a line between
   browser and server. Each is a term from "Parts you'll meet". A message is an arrow; a round trip is an arrow
   there and back.
5. **Model:** `steps(visitType, rttMs, dnsMs, serverMs) → [{step, ms}]`, with the time to the HTML's first byte
   equal to the sum of the steps.
   - **First visit:** `dns = dnsMs`, `tcp = rttMs`, `tls = rttMs`, `request = rttMs + serverMs`.
   - **Warm connection, cached hostname:** `dns = 0`, `tcp = 0`, `tls = 0`, `request = rttMs + serverMs`.
   - **Fresh cache:** all four are `0`.

   Assumptions, shown beside the visual:
   - TLS 1.3 full handshake over TCP (not HTTP/3)
   - no TCP Fast Open and no TLS 0-RTT
   - no redirects and no packet loss
   - the first byte arrives one round trip after the request
   - no transmission time for bytes
   - "teaching model, not a benchmark"

   Subresources and other hostnames are not in this model: they start after the HTML's first byte (step 6) and are
   taught in Q4 and in later chapters.
6. **Controls:**
   - visit type (3 options)
   - round trip: 5–300 ms, default 40
   - DNS: 0–200 ms, default 30
   - server processing: 0–500 ms, default 50
7. **Readouts:** each step's milliseconds, the total time to first byte, and the network share (percentages to
   one decimal everywhere in the chapter). The network share
   is (DNS + TCP + TLS + the request's round trip) ÷ total; when the total is 0 (fresh cache), it shows "no network
   used"; for a fresh cached copy the time to first byte reads "no request is sent" rather than "0 ms". All readouts
   are computed from the model.
8. **Recall prompt** (first in the figure). The figure comes right after section 7, which states how a first visit
   adds up, so this is retrieval of what was just read, not a cold prediction (retrieval practice;
   learning-science.md). "Before using the controls, recall it: tick every part that is a message travelling there
   and back." Until the learner checks the answer (or chooses "skip"), the figure shows each step's milliseconds and
   the total only: no travel/work labels, no network/server split, no bar legend.
   After that, it labels DNS, TCP, TLS and the request's round trip as travel and the server time as work.

   A second panel states the model's assumption plainly: these bars contain no bytes ÷ bandwidth time, and
   `latency-throughput` adds it.
9. **Signaling:** the active step's arrow is drawn at 2 px with `--fill-2` behind it, and the others are thin. On a
   repeat visit, skipped steps are drawn dashed and labelled with the reason: "hostname cached", "connection reused"
   or "fresh cached copy".
10. **States:** in the drawing, the active exchange is a 2 px stroke and its node is filled `--fill-2`; other
    exchanges are thin lines; an active exchange skipped on this visit is dashed with a "skipped: …" label. In the
    step list, the current step has a 2 px border and fill, and every skipped step is dashed with its reason in text.
    Never colour alone.
11. **Text alternative:** a live summary, for example "First visit: DNS 30 ms, TCP 40 ms, TLS 40 ms, request
    90 ms; time to first byte 200 ms, 75.0% network." It updates when an input changes; the live region updates on
    change only, never per frame. The current step's title and text are a second polite live region, so moving
    between steps is announced. Sliders announce their value with its unit (`aria-valuetext`).
12. **Reduced motion:** all six frames are shown as a static numbered list next to the timeline bar. Nothing
    animates.
13. **Tests (when implemented):**
    - At the default inputs: first visit = 200 ms, warm = 90 ms, fresh cache = 0 ms.
    - Network share = 75.0% (first visit), 44.4% (warm: 40 of 90), 88.6% (the exercise's 120 ms case), and "no
      network used" (fresh cache).
    - Totals equal the sum of the steps.
    - No negative values and no `NaN` anywhere in the control ranges.
14. **Smallest width first:** at 375 px, the controls, the drawing, the step list and the timeline stack in one
    column; from 900 px they sit in two columns, controls on the left. The timeline is a vertical ladder (one bar per
    step) at every width; a horizontal single bar was dropped because the ladder reads at all sizes (changed during
    implementation, 2026-10-27).

## Practice

Retrieval questions (each asked after the section it names):

1. _(after section 7)_ Order these steps for a first HTTPS visit: TLS handshake, DNS lookup, HTTP request, TCP
   handshake.
   - **Answer:** DNS lookup, TCP handshake, TLS handshake, HTTP request.
   - **Wrong: TLS first.** TLS runs on top of a reliable connection [rfc9846 §1], so the connection must exist.
   - **Wrong: request before TLS.** On HTTPS, the request travels inside the secured connection.
   - **Wrong: anything before DNS.** The connection needs the address that DNS provides.
   - Revisit section 7, steps 2–5.
2. _(after section 7)_ You double your bandwidth, and a small page's first-visit time to first byte barely
   changes. Why?
   - **Answer:** most of that time is waiting for messages to travel there and back (the lookup, two handshakes,
     the request), and bandwidth does not shorten travel time.
   - **Distractor "the server is slow" — wrong as the explanation.** A slow server would make the page slow at any
     bandwidth, but it doesn't explain why doubling bandwidth did nothing. The timing entry tells them apart: server
     time sits inside `responseStart − requestStart`.
   - Revisit section 5 and the worked example.
3. _(after section 7)_ Which steps can a repeat visit skip? (a) DNS lookup (b) TCP handshake (c) parsing the HTML
   (d) the request itself
   - **Answer:**
     - (a) if the hostname is cached;
     - (b) if the connection is reused;
     - (d) only if the browser holds a fresh cached response.
   - **Wrong: (c).** The browser still parses whatever HTML it shows, even a cached copy.
   - Revisit "Why the second visit is faster".
4. _(after section 7)_ Predict: the page loads its fonts from a second hostname. Which extra steps can that cost on
   a first visit?
   - **Answer:** its own DNS lookup, because each hostname needs one [mdn-how-browsers-work]. Usually also its own
     TCP and TLS handshakes: the lookup gives an address, and a connection is opened to an address (derived from
     steps 2–3).
   - **Distractor "nothing, the browser is already connected" — wrong in general.** The existing connection was
     opened for the first hostname. Whether a connection can sometimes be shared between hostnames is taught in
     `http-versions`.
   - Revisit section 7, step 2.
5. _(after section 6; assesses objective 4)_ A page's timing entry shows, in milliseconds from the start (assumed
   values):

   | Timestamp               | ms  |
   | ----------------------- | --- |
   | `domainLookupStart`     | 2   |
   | `domainLookupEnd`       | 32  |
   | `connectStart`          | 32  |
   | `secureConnectionStart` | 72  |
   | `connectEnd`            | 112 |
   | `requestStart`          | 113 |
   | `responseStart`         | 263 |

   Which step took longest, and what would you look at next?
   - **Answer:** waiting for the response: 263 − 113 = 150 ms. The others are DNS 30 ms, TCP 72 − 32 = 40 ms and
     TLS 112 − 72 = 40 ms.
   - **Next step:** the TCP and TLS handshakes each show one round trip of about 40 ms. So roughly 110 ms of the
     150 is the server's own work, which points at the server, not the network.
   - **Wrong: "TCP took 80 ms" (`connectEnd − connectStart`).** On HTTPS that interval also contains TLS.
   - Revisit section 6.

Exercise (transfer; the worked answer is revealed after an attempt):

- **Setup:** use the worked example's assumed values, with a round trip of 120 ms, as for a user far from the
  server.
- **Task:** compute the first-visit time to first byte and its network share.
- **Then:** decide which helps more: halving the server processing time, or serving from a location with a 30 ms
  round trip.
- **Worked answer:**
  - First visit: 30 + 120 + 120 + 120 + 50 = 440 ms, of which 390 ms (88.6%) is network.
  - Halving server time saves 25 ms.
  - Moving closer gives 30 + 30 + 30 + 30 + 50 = 170 ms, saving 270 ms. Moving closer wins.
  - The lesson: measure which part dominates before choosing a fix.

Spaced review:

- `dns` re-asks Q4 (one lookup per hostname).
- `tcp` and `tls` re-ask Q1 (order and round trips).
- `http-caching` re-asks Q3 (what a fresh cache skips).
- `latency-throughput` re-asks Q2 (bandwidth versus travel time).
- `review-foundations` uses Q5's timing-entry pattern with new numbers.

## Sources

Claims in this spec cite the ids below. Files were read from each project's public source repository, because the
websites were unreachable from the authoring container.

```
- id: mdn-how-browsers-work
  title: "Populating the page: how browsers work" (MDN Web Docs)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work
  kind: docs
  published: living document; read from mdn/content commit bd7387a (2026-10-26)
  checked: 2026-10-27
  via: read
  supports: [navigation steps in order, DNS caching and a lookup per hostname, TCP then TLS then request, linked resources requested only once parsing reaches them, parse/preload/render steps, latency as the biggest threat, time to first byte]
  note: >-
    files/en-us/web/performance/guides/how_browsers_work/index.md. CONFLICT: it says TLS "requires five more
    round trips" and "after eight round trips" the request is sent. That matches older TLS, not TLS 1.3's full
    handshake (rfc9846), so this spec uses rfc9846 for round-trip counts. MDN prose is CC-BY-SA 2.5: paraphrased,
    not copied.
- id: mdn-crp
  title: "Critical rendering path" (MDN Web Docs)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [DOM and CSSOM, render tree, layout, paint]
  note: mdn/content bd7387a.
- id: mdn-url
  title: "What is a URL?" (MDN Learn web development)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [URL parts scheme/authority/path/parameters, authority holds the domain and port, default ports 80 and 443]
  note: mdn/content bd7387a.
- id: mdn-dns
  title: "DNS" (MDN glossary)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Glossary/DNS
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [DNS maps domain names to IP addresses; that mapping is a DNS lookup]
  note: mdn/content bd7387a. Tier 2; the DNS RFCs were not readable (see rfc1034).
- id: mdn-tcp-handshake
  title: "TCP handshake" (MDN glossary)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Glossary/TCP_handshake
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [three messages SYN, SYN-ACK, ACK before data; after DNS and before TLS]
  note: mdn/content bd7387a. Tier 2; RFC 9293 was not readable (see rfc9293). The one-round-trip count in step 3 is derived from this sequence.
- id: mdn-rtt
  title: "Round Trip Time (RTT)" (MDN glossary)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Glossary/Round_Trip_Time
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [definition of a round trip]
  note: mdn/content bd7387a. The "bandwidth does not shorten a round trip" statement is derived from this definition, not stated by it.
- id: mdn-http-overview
  title: "Overview of HTTP" (MDN Web Docs)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [HTML is fetched first then further requests for subresources, HTTP sent over TCP or TLS-encrypted TCP, connection set-up before the request, HTTP/1.1 persistent connections reuse a connection]
  note: >-
    mdn/content bd7387a. CONFLICT: it says establishing a TCP connection "requires several round-trips". The
    three-message handshake costs one round trip before the request can be sent (derived from mdn-tcp-handshake);
    "several" probably counts TLS too, but the page does not say so. Its QUIC sentence ("Google is experimenting")
    is out of date and not used.
- id: mdn-caching
  title: "HTTP caching" (MDN Web Docs)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [a cache reuses stored responses; the browser cache is a private cache]
  note: mdn/content bd7387a.
- id: mdn-nav-timing
  title: "Navigation timing" (MDN Performance API guide)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Navigation_timing
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [one PerformanceNavigationTiming entry per document; it adds document timestamps to Resource Timing's]
  note: mdn/content bd7387a.
- id: mdn-prt
  title: "PerformanceResourceTiming" (MDN API reference)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [attribute names domainLookupStart/End, connectStart/End, secureConnectionStart, requestStart, responseStart/End; DNS time = domainLookupEnd − domainLookupStart; request time = responseStart − requestStart]
  note: >-
    mdn/content bd7387a. CONFLICT: it suggests "TCP handshake time (connectEnd − connectStart)" and "TLS negotiation
    time (requestStart − secureConnectionStart)", which overlap on an https page, because connectEnd includes the
    TLS handshake (navtiming-2). This spec uses secureConnectionStart to split them. Cross-origin resources report 0
    for these attributes without Timing-Allow-Origin (not an issue for the page's own entry).
- id: mdn-resource-timing
  title: "Resource timing" (MDN Performance API guide)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing
  kind: docs
  checked: 2026-10-27
  via: read
  supports: [resource entries record DNS, request and response timestamps]
  note: mdn/content bd7387a.
- id: navtiming-2
  title: Navigation Timing Level 2 (W3C Editor's Draft)
  author: W3C Web Performance Working Group
  url: https://w3c.github.io/navigation-timing/
  kind: spec
  checked: 2026-10-27
  via: read
  supports: [PerformanceNavigationTiming extends PerformanceResourceTiming attributes]
  note: >-
    index.bs in w3c/navigation-timing commit 245fee2 (2026-09-01); status ED, not a Recommendation. Its "SSL
    handshake" wording for connectEnd is in the obsolete Level 1 section and is not relied on; the current
    definition is in fetch (below).
- id: resource-timing
  title: Resource Timing (W3C Editor's Draft)
  author: W3C Web Performance Working Group
  url: https://w3c.github.io/resource-timing/
  kind: spec
  checked: 2026-10-27
  via: read
  supports: [connectStart, connectEnd and secureConnectionStart are taken from Fetch's connection timing info]
  note: index.bs in w3c/resource-timing commit 1f9ef25 (2026-09-01); status ED.
- id: fetch
  title: Fetch Standard (WHATWG), "record connection timing info"
  author: WHATWG
  url: https://fetch.spec.whatwg.org/
  kind: spec
  checked: 2026-10-27
  via: read
  supports: [connection end time must include the time to complete enough of the TLS handshake to request the resource; secure connection start time is taken immediately before the handshake starts; over HTTP/3 connection start and secure connection start are equal; on a connection opened before the fetch, DNS and connection timestamps are set to the fetch's start]
  note: fetch.bs in whatwg/fetch commit 59afe34 (2026-10-19); living standard.
- id: rfc9110
  title: HTTP Semantics (RFC 9110, STD 97)
  author: Fielding, Nottingham, Reschke (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9110
  kind: spec
  published: 2022-06
  checked: 2026-10-27
  via: read
  supports: [client and server are roles in a connection; HTTP needs a reliable connection (§3.3); requests and responses, responses carry a status code (§3.4); user agent = client program that initiates a request (§3.5); a cache stores responses to cut response time on later equivalent requests (§3.8); https means HTTP over a TLS-secured connection to an authenticated server (§4.2.2); GET requests a representation of the target (§9.3.1); three-digit status codes, first digit is the class (§15)]
  note: rfc9110.xml in httpwg/http-core commit bde37f6, the working group's source of the published RFC. Section numbers computed from the XML's section nesting.
- id: rfc9111
  title: HTTP Caching (RFC 9111, STD 98)
  author: Fielding, Nottingham, Reschke (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9111
  kind: spec
  published: 2022-06
  checked: 2026-10-27
  via: read
  supports: [a fresh stored response can be reused without validation, reducing latency and network overhead (§1)]
  note: rfc9111.xml in httpwg/http-core commit bde37f6.
- id: rfc9846
  title: The Transport Layer Security (TLS) Protocol Version 1.3 (RFC 9846)
  author: E. Rescorla
  url: https://www.rfc-editor.org/rfc/rfc9846
  kind: spec
  published: 2026-07
  checked: 2026-10-27
  via: read
  supports: [TLS needs a reliable in-order stream underneath (§1); full handshake message flow, one round trip before the client's application data (§2 figure); mismatched key-exchange parameters cost a HelloRetryRequest and an extra round trip (§2.1, §4.2.4, §4.3.8); 0-RTT data has weaker security properties (§2.3)]
  note: >-
    rfc9846.md in tlswg/tls13-spec commit c728b4e (2026-07-07); its metadata (docname
    draft-ietf-tls-rfc8446bis-14) says it obsoletes RFC 8446 and keeps version 1.3. Section numbers computed from
    the markdown headings; not checked against the rfc-editor.org copy (unreachable). Author and date (2026-07) are
    from the file's metadata block. Curriculum scoping cited RFC 8446; 9846 supersedes it.
- id: rfc1034
  title: Domain Names - Concepts and Facilities (RFC 1034)
  author: P. Mockapetris
  url: https://www.rfc-editor.org/rfc/rfc1034
  kind: spec
  published: 1987-11
  checked: 2026-10-27
  via: search
  supports: none
  note: Lead for the dns chapter; not read (rfc-editor.org unreachable). This chapter's DNS claims rest on MDN.
- id: rfc9293
  title: Transmission Control Protocol (TCP) (RFC 9293)
  author: W. Eddy (ed.)
  url: https://www.rfc-editor.org/rfc/rfc9293
  kind: spec
  published: 2022-08
  checked: 2026-10-27
  via: search
  supports: none
  note: Lead for the tcp chapter; seen only in search results. This chapter's handshake claim rests on MDN.
```

## Open questions / unverified

- The DNS and TCP claims rest on MDN (tier 2), not the RFCs. That is acceptable for a map chapter, but `dns` and
  `tcp` must read RFC 1034/1035 and RFC 9293.
- The round-trip counts assume TCP plus TLS 1.3, without TCP Fast Open, 0-RTT or HTTP/3. Those are deferred,
  without claims, to `tcp`, `tls` and `http-versions`.
- The worked example's 30, 40 and 50 ms are assumptions, not measurements. The chapter never presents them as
  typical.
- Chapter length (target 15–30 minutes) is a hypothesis. This chapter is estimated at about 20–25 minutes: six
  steps, five questions and one exercise.
- Should the product show the reader's own `PerformanceNavigationTiming` entry? It would be real data, but it varies
  per reader, so the text could not quote it. Decide when the product is built.
- The published RFC 9846 and RFC 9110 section numbers were computed from the working groups' source files. Check
  them against rfc-editor.org when it is reachable.

## Evidence

- typecheck: pass — npx tsc --noEmit (2026-10-27)
- lint: pass — npm run lint, no warnings or errors (2026-10-27)
- model tests: pass — npm test, 95 tests (92 model incl. 81 grid cases over slider-reachable values, 3 curriculum
  reader); deliberate model mutations each caught (2026-10-27)
- build and JS budget: pass — next build: /learn 107 kB and /learn/web-request 111 kB first-load JS (budget 120 kB);
  / 110 kB, unchanged from main. Browser: 106.0 / 109.5 KB gzip of scripts at load; ~10 KB more after idle is
  `next/link` prefetch (2026-10-27)
- browser sizes: pass — Playwright at 375×812, 402×874, 768×1024, 1280×800, 1440×900, 1920×1080 on both routes: no
  horizontal scroll, no console errors; screenshots read at 375 and 1280 (2026-10-27)
- keyboard: pass — Playwright keyboard-only: visit radios (arrows), sliders (Home/End/arrows; 25 ms reachable),
  step buttons and Next/Previous (Enter/Space; focus kept at the ends), prediction and Skip, answers (Enter);
  visible 2 px focus (2026-10-27)
- reduced motion: pass — Playwright reducedMotion: all six steps listed, bar transition 0s, readout and assumptions
  shown (2026-10-27)
- accessibility scan: pass — axe-core 4.10.3, WCAG 2.0/2.1/2.2 A and AA, both routes at 375 and 1280 px with
  answers open: 0 violations; 6 SVG label nodes left for manual contrast review, checked by hand (ink and ink-2 on
  fill-2, above 4.5:1); live regions for summary and step text; sliders have aria-valuetext (2026-10-27)
- lighthouse: pass — Lighthouse 13.4.1 on the final build: /learn 99 mobile, 100 desktop; /learn/web-request 98
  mobile, 100 desktop; accessibility, best practices and SEO 100; CLS 0. An earlier build's first mobile run of
  /learn scored 91 (TBT 330 ms), then 98 and 99 (2026-10-27)
- browser suite: pass — 56/56 checks (sizes, console, axe, keyboard, prediction gating incl. the announced summary,
  focus kept on Skip/Next/Previous, step announcer, reduced motion, / still renders) (2026-10-27)
- spec review: pass — two fresh-subagent reviews against verification.md (2026-10-27); every finding fixed and
  recorded below; the second round's fixes were checked by the author, not by a third review

## Review findings

Reviewer: fresh subagent (spec review, Product: none), 2026-10-27, rubric verification.md + chapter-workflow.md

- [blocking] Q6 taught TCP = `connectEnd − connectStart`, which includes TLS on https (navtiming-2 connectEnd text)
  → fixed (Q6 split via `secureConnectionStart`; conflict recorded on mdn-prt; Q5 tests it)
- [blocking] Visual `extraHosts` was added to the HTML's first byte, though subresources start after parsing, and
  contradicted the fresh-cache test → fixed (removed from the model; per-hostname cost taught in Q4; step 6 says
  why)
- [should-fix] rfc9846 "§4.2.8" did not exist in RFC 9846 → fixed (§2.1, §4.2.4, §4.3.8)
- [should-fix] Status code cited to rfc9110 §3.3 → fixed (§3.4, §15)
- [should-fix] "Bandwidth does not shorten a round trip" was uncited and unflagged → fixed (marked derived from
  mdn-rtt; transmission-time simplification flagged → latency-throughput)
- [should-fix] Visual prediction asked about bandwidth, which the model lacks → fixed (prompt now asks travel vs
  server work; the no-transmission-time assumption is stated)
- [should-fix] TCP "one round trip" rested on MDN while mdn-http-overview says "several" → fixed (labelled derived;
  conflict recorded)
- [should-fix] Q4 "connections are per server" uncited and conflated hostname with server → fixed (reworded;
  sharing deferred to http-versions)
- [should-fix] Objective 4 not assessed → fixed (new Q5 reads a timing entry)
- [note] Q6 named document-event timestamps nothing used → fixed (dropped)
- [note] "Round trips made up three quarters" counted DNS as a round trip → fixed ("network waiting")
- [note] Network share 0/0 on fresh cache → fixed ("no network used"; test added)
- [note] User agent cited to §3.3 → fixed (§3.5)
- [note] "In order" uncited → fixed (rfc9846 §1)
- [note] "HTTPS is HTTP over TLS" cite → fixed (rfc9110 §4.2.2, rfc9846 §1)
- [note] Undefined jargon (hostname, time to first byte, render tree, preload scanner, ClientHello, persistent
  connections, 0-RTT) → fixed (defined at first use; glossary rule for hostname)
- [note] Q8 omitted the DNS control → fixed
- [note] Q10 lacked trade-offs for connection reuse and a faster server → fixed
- [note] Distractor feedback didn't say wrong/right or point back → fixed (every question)
- [note] Visual assumptions omitted TCP-not-QUIC, no Fast Open, no 0-RTT → fixed
- [note] `checked` dates were in the future (2026-10-28) → fixed (2026-10-27)

Reviewer: second fresh subagent (re-review of the fixes above), 2026-10-27

- [should-fix] Q6 quoted Navigation Timing's obsolete Level 1 `connectEnd` text as if it defined the current
  attribute → fixed (now cites the Fetch standard's current definition, read; Resource Timing record added;
  navtiming-2 note says the old text is not relied on)
- [note] "a reused connection pays it once" cited rfc9846 §2, which says nothing about reuse → fixed (mdn-http-overview
  plus derived)
- [note] Response-wait breakdown attributed to mdn-prt → fixed (labelled derived from step 5)
- [note] Q4 "connection opened to a server address" uncited → fixed (labelled derived from steps 2–3)
- [note] TCP Fast Open and 0-RTT used before definition → fixed (defined where first used, in step 7's caveat)
- [note] Inconsistent rounding (89% vs 44.4%) → fixed (one decimal everywhere; 88.6% test added)

Audit: author (owner-requested chapter review), 2026-10-27, against verification.md and the source files

- [should-fix] "IP address" and "port" used without definition → fixed (Parts you'll meet)
- [should-fix] "most early steps … each costs at least one round trip" read as true of every stack → fixed
  (scoped to this chapter's model; optimisations deferred)
- [should-fix] "a first visit asks name servers" stated as universal → fixed (flagged; caches → `dns`)
- [should-fix] Repeat visit assumed the connection is always still open → fixed ("if … still open")
- [should-fix] Trade-off claims (server state for open connections, cost of moving closer) were uncited → fixed
  (Q10–12 marked as derived judgement, sourced in the linked chapters)
- [note] Preload scanner presented as universal → fixed ("browsers can use")
- [note] Stepper has 6 frames but the model times 4 → fixed (frames 1 and 6 carry no time)
- [note] RFC 9846 author line → fixed (E. Rescorla, from the file's metadata); RFC 9110/9111 dates and authors
  checked against the XML front matter
- [note] Added a verified fact: a reused connection shows 0 ms DNS/TCP/TLS in timing entries (Fetch, clamp and
  coarsen connection timing info)

Reviewer: fresh subagent (implementation review: code, browser at 375/1280 px, sources), 2026-10-27, rubric
verification.md

- [should-fix] The prediction gave its answer away (prompt named the "work" item; travel/work labels and the bar
  legend were visible before committing) → fixed (neutral prompt; labels, split and legend appear after Check or
  Skip; spec Visual step 8 updated)
- [should-fix] Next/Previous became `disabled` while focused, dropping keyboard focus to the page → fixed
  (`aria-disabled`, focus stays; browser check added)
- [should-fix] TLS frame said the server sends "its keys" → fixed ("key-exchange parameters … both sides then work
  out the same keys", as rfc9846 §2)
- [should-fix] The exercise's 25 ms server time was unreachable (slider step 10) → fixed (step 5; test that every
  value the chapter asks for is reachable)
- [should-fix] The page's Sources note claimed more than the spec records (read in full; section numbers checked)
  → fixed (cited parts read in the source repos; RFC section numbers not yet checked against the published RFCs)
- [should-fix] Moving between steps was silent for screen readers → fixed (step title and text are a polite live
  region)
- [note] `<output>` plus the live summary double-announced slider changes; sliders had no unit → fixed (visible
  value is aria-hidden; `aria-valuetext` "40 milliseconds")
- [note] "Linked files are requested only once the browser reaches them" read against the preload scanner → fixed
  (page and step 6: the browser finds them by reading the HTML, so they come after the first byte)
- [note] Course index said "every claim cites a source" though design judgements are uncited → fixed ("factual
  claims cite a source … design judgements are labelled")
- [note] Test names and coverage (misnamed bandwidth test, NaN only on the total, grid mid values off the slider
  steps) → fixed
- [note] Drawing has no separate "done" state as spec step 10 said → accepted: the spec now describes the drawing
  as built; the step list carries current and skipped states for every step
- [note] Citation numbers did not follow first appearance → fixed (sources ordered by first citation; checked)
- [note] `tsconfig.json` rewritten by the build → fixed before commit (reverted; not in any commit)
- [note] Reviewer measured ~116 kB gzip of scripts per route vs `next build`'s 107/110 kB → checked, no change:
  measured in the browser, scripts at page load are 106.0 KB gzip (/learn) and 109.5 KB (/learn/web-request); the
  further ~10 KB after idle is `next/link` prefetching the linked routes (/, /learn, not-found), not first-load JS.
  The budget (CLAUDE.md §10.4) is first-load JS, under 120 kB on both routes

Reviewer: second fresh subagent (re-review of the implementation fixes), 2026-10-27

- [should-fix] Prediction still leaked the split: the ladder always showed separate Request/Server rows and the
  screen-reader summary announced "75.0% network" on load → fixed (one Request row and no share, visible or
  announced, until Check or Skip; browser check added)
- [should-fix] "Skip, show the labels" removed itself, dropping keyboard focus → fixed (stays, aria-disabled; check
  added)
- [should-fix] Skipped-step text lower-cased "GET" ("gET / goes out") → fixed (text no longer re-cased; check added)
- [note] /learn meta description and a code comment still said "every claim sourced" → fixed
- [note] Screen-reader summary's "Request" (90 ms) differed from the ladder's "Request (travel)" (40 ms) → fixed
  (summary uses the ladder's names and numbers)
- [note] A visit change fired both live regions at once → fixed (the step announcer speaks only on step changes;
  check added)
- [note] TLS frame said both sides work out keys "then" → fixed ("each side works out the same keys from the
  exchanged parameters")
- [note] Spec Visual step 9 skipped labels drifted from the code → fixed (spec)
- [note] Accepted items and the bundle check held (reviewer: ~112 / ~108 KB gzip of module scripts, under 120 kB)

Reviewer: third fresh subagent (re-review of the second-round fixes), 2026-10-27

- [should-fix] The "prediction" could be answered from the page: the paragraph just above the figure states the
  count, and option and slider names point to the answer → fixed by re-scoping, not hiding: it is a recall prompt
  placed after the explanation (legend "Recall first"; spec step 8 says so), which is the retrieval practice the
  course intends; the gating of labels and split stays
- [should-fix] The hidden step announcer kept stale text after a visit change and could contradict the visible
  step → fixed (emptied on every input change; browser check)
- [note] Announced step text lacked step 5's travel/work detail → fixed (one function builds visible and announced
  text)
- [note] Fresh cached copy read "Time to first byte: 0 ms" → fixed ("no request is sent")
- [note] Check updates two polite regions at once (status feedback and the summary's revealed split) → accepted:
  one explicit action, two short related messages; the status feedback is the one the learner asked for
- [note] Each slider step re-announces the summary → accepted: allowed by spec step 11 (updates on input change),
  and slider value text is not repeated in it
