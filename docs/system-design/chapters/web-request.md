# Map: what happens when you open a website

Id: web-request · Stage: 1 · Paths: beginner interview production (status lives only in CURRICULUM.md)
Prerequisites: none · Related: client-server, dns, tcp, tls, http, http-caching, latency-throughput, http-versions

## Boundary

Objectives (observable):

1. Name, in order, the steps between pressing Enter on `https://example.com/` and seeing the page: read the URL,
   look up the name, open a connection, secure it, send the request, receive the response, then parse and render.
2. Say which steps wait on the network, and count the round trips a first visit needs before the first byte of
   the page arrives.
3. Predict which steps a repeat visit can skip (cached name, reused connection, fresh cached response) and why that
   is faster.
4. Read a browser's timing entry for a page and point to the step that took the longest.

In scope: the journey as a whole and where its time goes. Each step gets one plain paragraph and a link forward.
This is a map chapter: its one idea is the order of the steps and the cost of each one.

Deferred:

- How names are resolved (resolvers, authoritative servers, TTLs) → `dns`
- Packets, addresses and ports → `ip-and-ports`
- How TCP makes a reliable stream; slow start and congestion control → `tcp`
- What TLS proves and how keys are agreed; 0-RTT resumption and its risks → `tls`
- Methods, status codes and headers in detail → `http`
- HTTP/2 multiplexing, HTTP/3 and QUIC's combined handshake → `http-versions`, `udp-quic`
- Cache freshness, validation and `Cache-Control` → `http-caching`
- Latency versus throughput; percentiles → `latency-throughput`, `percentiles`
- What the server does to build the response → stage 4 onwards (`stateless-services`, `load-balancing`, databases)
- Load balancers, CDNs and proxies between browser and server → `load-balancing`, `cdn`, `reverse-proxies`

Misconceptions targeted:

- "The page is one download." A page is an HTML document plus the further requests it causes (styles, scripts,
  images), often to several hostnames.
- "A faster internet connection (more bandwidth) makes every page load fast." Much of a first visit is waiting for
  round trips, and more bandwidth does not shorten a round trip.
- "Encryption is what makes HTTPS slow." TLS 1.3's full handshake adds one round trip, and a reused connection
  pays it once.
- "Once the HTML arrives, the page is done." The browser still has to parse, fetch subresources, lay out and paint.

## Parts you'll meet

- **Browser (user agent):** the program that fetches pages and shows them. HTTP calls it the client in an exchange.
  [rfc9110 §3.3]
- **Server:** a program that accepts connections and answers requests with responses. "Client" and "server" are
  roles in one connection, not kinds of machine. [rfc9110 §3.3]
- **URL:** the address you type. It has a scheme (`https`), an authority (the domain name, optionally a port), a
  path (`/about`) and optional parameters. [mdn-url]
- **Domain name and IP address:** people use names like `example.com`. Computers send data to numeric IP addresses.
  [mdn-dns]
- **DNS lookup:** turning a domain name into an IP address. [mdn-dns]
- **Connection:** an agreed channel between browser and server that carries requests and responses reliably and
  in order. TCP sets one up. [mdn-http-overview, mdn-tcp-handshake]
- **Handshake:** messages exchanged to set something up before the real data flows.
- **Round trip (RTT):** the time for a message to reach the other side plus the time for the answer to come back.
  [mdn-rtt]
- **TLS:** the layer that encrypts the connection and proves the server's identity. HTTPS is HTTP over TLS.
  [rfc9846 §1, mdn-how-browsers-work]
- **Request and response:** the browser's message asking for something, and the server's answer. Every response
  carries a three-digit status code. [rfc9110 §3.3, §15]
- **Cache:** a local store of earlier responses, used to answer later, equivalent requests without going all the
  way to the server. [rfc9110 §3.8, rfc9111 §1]
- **Parse and render:** turning the HTML and CSS into in-memory trees (the DOM and CSSOM), then working out layout
  and painting pixels. [mdn-how-browsers-work, mdn-crp]

Glossary rule for the course: say "round trip" (not "RTT" alone) until `latency-throughput`. Say "connection" for
the transport channel, and "request" for one HTTP message.

## Explanation (14 questions)

1. **Problem.** You type `https://example.com/` and press Enter. The first visit of the day takes noticeably longer
   than the second visit a minute later. What is the browser doing during that time, and why does the second visit
   take less? [mdn-how-browsers-work: navigation, DNS caching]
2. **Why it matters.** Every system design question starts and ends at a user waiting for a response. If you can't
   say where the time goes in one page load, you can't tell whether a design change (a cache, a CDN, a new region)
   will help. Users notice: MDN's performance guide calls latency "the biggest threat" to a fast-loading page.
   [mdn-how-browsers-work: overview]
3. **Beginner's first try.** "The browser downloads the page from the server, and the time it takes is the size of
   the page divided by my connection speed."
4. **Why that works at first.** For one large file on an already-open connection, size divided by speed is a fair
   estimate: transfer time does grow with size. The model also gets the direction right, from server to browser,
   and the page is indeed sent in a response to a request. [rfc9110 §3.3, §9.3.1]
5. **When it fails.** It fails for a small page on a first visit. The model predicts almost no time, because the
   bytes are few. In reality, before a single byte of the page can arrive, the browser has to:
   - find the server's address,
   - open a connection,
   - secure it,
   - send the request.

   Each of these waits for messages to cross the network and come back. A faster plan (more bandwidth) does not
   shorten those waits. The model also misses the fact that the HTML names further files (CSS, scripts, images),
   each of which needs its own request, sometimes to other hostnames. [mdn-how-browsers-work: DNS lookup, TCP
   handshake, TLS negotiation, parsing; mdn-http-overview]
6. **A better observation.** Browsers record a timestamp at each stage of a page fetch, and pages can read them
   through the Navigation Timing API. A `PerformanceNavigationTiming` entry carries the network timestamps defined
   for resources:
   - `domainLookupStart` and `domainLookupEnd`
   - `connectStart` and `connectEnd`
   - `secureConnectionStart`
   - `requestStart`
   - `responseStart` and `responseEnd`

   It adds document events such as `domContentLoadedEventStart` and `loadEventEnd`. The differences between these
   timestamps give the cost of each step. For example, DNS time is `domainLookupEnd − domainLookupStart`, and TCP
   time is `connectEnd − connectStart`. Comparing a first visit with a repeat visit shows which steps disappear.
   [navtiming-2 §PerformanceResourceTiming relation; mdn-nav-timing; mdn-resource-timing; mdn-prt]
7. **The real mechanism.** A page load is a chain of steps. Most early steps are round trips, so each one costs at
   least one network round trip before the next can start:
   1. **Read the URL.** The scheme says to use HTTPS. The authority gives the hostname and an optional port; the
      default is 443 for HTTPS. The path says which resource to ask for. [mdn-url]
   2. **Look up the name (DNS).** The browser needs the server's IP address. On a first visit, a DNS lookup asks name
      servers. Afterwards, the answer is usually cached, so later requests skip the lookup. A lookup is needed for
      each different hostname the page uses. [mdn-how-browsers-work: DNS lookup; mdn-dns]
   3. **Open a connection (TCP).** The browser and server exchange three messages (SYN, SYN-ACK, ACK) before the
      request is sent. The browser has to wait for the SYN-ACK to come back, so this costs one round trip before
      data can flow. [mdn-tcp-handshake; mdn-how-browsers-work: TCP handshake]
   4. **Secure it (TLS).** For HTTPS, a TLS handshake agrees keys and authenticates the server before the request is
      sent. In TLS 1.3's full handshake:
      - the client sends a ClientHello;
      - the server answers with its ServerHello, parameters, certificate and Finished;
      - the client sends its Finished together with its first application data.

      So the handshake adds one round trip. If the server must ask the client to retry with different key-exchange
      parameters, that costs one more round trip. [rfc9846 §2 figure "Message Flow for Full TLS Handshake",
      §4.2.8]
   5. **Send the request; wait for the response.** The browser sends an HTTP request, normally `GET` for the page.
      The server works out its answer and sends a response with a status code (for example 200 OK) and the HTML.
      This is one more round trip plus the server's own processing time. [rfc9110 §9.3.1, §15;
      mdn-how-browsers-work: response]
   6. **Parse, fetch more, render.** As the HTML arrives, the browser parses it into the DOM. It requests the
      resources the HTML names (stylesheets, scripts, images), and a preload scanner can start some of these early.
      It builds the CSSOM, combines the two into a render tree, computes layout and paints. A script without `async`
      or `defer` can pause HTML parsing. [mdn-how-browsers-work: parsing, preload scanner, render; mdn-crp]

   Counting only the network: on a first visit to an HTTPS site over TCP and TLS 1.3, the first byte of the page
   arrives after:
   - the DNS lookup,
   - plus one round trip for TCP,
   - plus one for TLS,
   - plus one for the request and response,
   - plus the server's processing time.

   That is at least three round trips to the server, plus DNS, before anything appears. (Derived from steps 2–5.)

   **Why the second visit is faster:**
   - The name is cached, so there is no DNS wait. [mdn-how-browsers-work: DNS lookup]
   - An open connection can be reused for further requests, so there is no TCP or TLS handshake. Persistent
     connections arrived in HTTP/1.1. [mdn-http-overview: HTTP and connections]
   - If the browser holds a fresh cached copy of a response, it can reuse it without going to the server at all.
     [rfc9111 §1; mdn-caching]
8. **What the learner can change and watch.** In the visual:
   - **Visit type:** first visit, repeat visit with a warm connection, or a fresh cached copy.
   - **Round-trip time** (assumed, in milliseconds).
   - **Server processing time** (assumed, in milliseconds).
   - **Number of other hostnames** the page uses.

   The model shows each step's cost and the time to first byte. All numbers are computed from those inputs.
9. **Alternatives.** There are several ways to make this journey shorter:
   - Reuse what you already have: DNS cache, persistent connections, the HTTP cache.
   - Move the server closer, so each round trip is shorter (→ `cdn`, `multi-region`).
   - Need fewer round trips per connection (→ `http-versions`, `udp-quic`; TLS resumption → `tls`).
   - Ask fewer hostnames, so there are fewer DNS lookups and connections.
   - Make the server answer faster (→ stages 3–5).
10. **Trade-offs.**
    - **Caching:** it can serve something stale (→ `cache-invalidation`).
    - **Moving servers closer:** costs money and adds copies to keep consistent (→ `cdn`, `replication`).
    - **Fewer hostnames:** can conflict with using third-party services.
    - **Skipping a round trip with 0-RTT data:** that data has weaker security properties and can be replayed.
      [rfc9846 §2.3]
11. **When to choose each.**
    - Reuse and caching help repeat visits and pages that load many resources from the same place.
    - Moving closer helps when the round-trip time dominates, as with users far from the server.
    - Server work helps when the server's processing time dominates.

    The timing entry from question 6 tells you which case you are in.
12. **When not to.**
    - Don't add a CDN or a second region to fix a slow database query: the timing shows the time in the server's
      answer, not in the round trips.
    - Don't tune bandwidth for a page made of many small requests: round trips, not bytes, dominate.
13. **Explain it in your own words.** "Explain to a friend why opening a website a second time is faster. Use the
    words 'round trip', 'cache' and 'connection'."
14. **Apply it elsewhere.** A mobile app calls an API on a server it has never contacted. Which of the six steps
    still happen? (Steps 2–5 are the same idea. Step 6 becomes the app parsing JSON and updating its screen.) Which
    can the app avoid on its second call?

## Worked example

Assumed values for this example only. They are not measurements of any real site:

- round trip to the server: 40 ms
- DNS lookup: 30 ms
- server processing: 50 ms
- the page uses HTTPS with TLS 1.3 over TCP

**First visit, time to first byte of the HTML:**

1. DNS lookup: 30 ms.
2. TCP handshake: 1 round trip = 40 ms.
3. TLS 1.3 full handshake: 1 round trip = 40 ms.
4. Request and first byte of the response: 1 round trip = 40 ms, plus 50 ms of server processing.

Total: 30 + 40 + 40 + 40 + 50 = **200 ms**. Of that, 150 ms is network waiting and 50 ms is the server.

**Repeat visit on a reused connection, with the name cached** (the learner completes this: fading):

1. DNS lookup: skipped, because the name is cached. 0 ms.
2. TCP handshake: skipped, because the connection is reused. 0 ms.
3. TLS handshake: skipped, on the same connection. 0 ms.
4. Request and first byte: 40 + 50 = **90 ms** ← the learner fills this in.

**Fresh cached copy:** no request leaves the browser for this response, so the network time is 0 ms.

What the example shows: on the first visit, round trips made up three quarters of the wait (150 of 200 ms) for a
page of any size. Doubling bandwidth would not change any of those 150 ms.

Simplifications flagged (each corrected in its chapter):

- DNS is treated as one fixed cost. In reality it may need several queries, or none if cached (→ `dns`).
- The first response's bytes are assumed to arrive in one round trip. Large responses take more, and TCP starts
  sending slowly (→ `tcp`).
- No redirects are assumed.

## Visual

Decision: **stepper with a computed comparison** (static frames, learner-paced, plus a closed-form model). The
journey is a sequence of discrete steps, which is the stepper case in visualization-and-simulation.md. The
"where time goes" claim depends on a few inputs, so a tiny closed-form model computes it. No discrete-event
simulation is needed, and no 3D: depth carries no meaning here.

Visual spec (the 14-step process):

1. **Mechanism made visible:** a page load is a chain of waits, most of them round trips. Repeat visits remove
   links from the chain.
2. **Misconception to break:** "page load time = size ÷ bandwidth".
3. **Medium:** stepper (6 frames, one per step) plus a timeline bar computed from the model.
4. **Parts on screen:** browser, DNS name server, web server, with the connection drawn as a line between browser
   and server. Each is a term from "Parts you'll meet". A message is an arrow; a round trip is an arrow there and
   back.
5. **Model:** `steps(visitType, rttMs, dnsMs, serverMs, extraHosts) → [{step, ms}]`.
   - First visit: `dns = dnsMs`, `tcp = rttMs`, `tls = rttMs`, `request = rttMs + serverMs`.
   - Warm connection: `dns = 0`, `tcp = 0`, `tls = 0`, `request = rttMs + serverMs`.
   - Fresh cache: every network step is `0`.
   - `extraHosts` adds `dnsMs + 2 × rttMs` per extra hostname: a lookup, a TCP handshake and a TLS handshake.

   Assumptions shown beside the visual:
   - TLS 1.3 full handshake;
   - one round trip for the first byte;
   - no redirects;
   - no packet loss;
   - "teaching model, not a benchmark".
6. **Controls:**
   - visit type (3 options);
   - round trip, 5–300 ms, default 40;
   - DNS, 0–200 ms, default 30;
   - server processing, 0–500 ms, default 50;
   - extra hostnames, 0–5, default 0.
7. **Readouts:** each step's milliseconds, total time to first byte, and network share (%). All are computed from
   the model.
8. **Prediction prompt** (before the first change): "If you double the bandwidth, which bars get shorter?" The
   answer appears after the learner commits: none of them.
9. **Signaling:** the active step's arrow is drawn 2 px with `--fill-2` behind it, and the others are thin. On a
   repeat visit, skipped steps are drawn dashed with the label "skipped: cached" or "skipped: connection reused".
10. **States:**
    - active: 2 px stroke plus fill;
    - done: solid thin;
    - skipped: dashed, with a text label;
    - never colour alone.
11. **Text alternative:** a live summary, for example "First visit: DNS 30 ms, TCP 40 ms, TLS 40 ms, request
    90 ms; time to first byte 200 ms, 75% network." It updates when inputs change; the live region updates on
    change only, not per frame.
12. **Reduced motion:** all six frames are shown as a static numbered list with the timeline bar, and nothing
    animates.
13. **Tests (when implemented):**
    - The worked example's numbers must hold: first visit = 200, warm = 90, fresh cache = 0 at the default inputs.
    - Totals equal the sum of the steps.
    - No negative or `NaN` values over the control ranges.
    - Each extra hostname adds exactly `dnsMs + 2 × rttMs`.
14. **Smallest width first:** at 375 px, the steps stack vertically and the timeline bar becomes a vertical
    ladder. From 768 px, the steps run horizontally, browser on the left and server on the right.

## Practice

Retrieval questions (asked after section 7):

1. _Order these steps for a first HTTPS visit: TLS handshake, DNS lookup, HTTP request, TCP handshake._
   - **Answer:** DNS lookup, TCP handshake, TLS handshake, HTTP request.
   - **Why the wrong orders are wrong:** TLS needs an open connection, because it runs over a reliable stream
     [rfc9846 §1]. The request is sent only once the connection is secured. DNS must come first, because the
     connection needs an address.
2. _You double your bandwidth. A small page's first-visit time to first byte barely changes. Why?_
   - **Answer:** Most of that time is round trips (lookup, two handshakes, the request), and bandwidth does not
     shorten a round trip.
   - **Distractor "the server is slow":** possible, but the timing entry separates server time
     (`responseStart − requestStart` includes it) from the handshakes.
3. _Which steps can a repeat visit skip? (a) DNS lookup (b) TCP handshake (c) parsing the HTML (d) the request
   itself._
   - **Answer:** (a) if the name is cached. (b) if the connection is reused. (d) only if the browser holds a fresh
     cached response.
   - **Why (c) is wrong:** the browser still has to parse whatever HTML it shows, even a cached copy.
4. _Predict: a page loads its fonts from a second hostname. Name the extra steps that hostname costs on a first
   visit._
   - **Answer:** its own DNS lookup, TCP handshake and TLS handshake. A lookup is needed per hostname
     [mdn-how-browsers-work], and connections are per server.
   - **Distractor "nothing, the browser is already connected":** the existing connection goes to a different
     server.

Exercise (transfer, worked answer revealed after an attempt):

- **Setup:** use the worked example's assumed values, with a round trip of 120 ms, as for a user far from the
  server.
- **Task:** compute the first-visit time to first byte and its network share.
- **Then:** decide whether halving the server processing time or serving from a location with a 30 ms round trip
  helps more.
- **Worked answer:**
  - The first visit is 30 + 120 + 120 + 120 + 50 = 440 ms, of which 390 ms (89%) is network.
  - Halving server time saves 25 ms.
  - Moving closer gives 30 + 30 + 30 + 30 + 50 = 170 ms, saving 270 ms. So moving closer wins.
  - The lesson: measure which part dominates before choosing a fix.

Spaced review:

- `dns` re-asks Q4: the per-hostname lookup.
- `tcp` and `tls` re-ask Q1: order and round trips.
- `http-caching` re-asks Q3: what a fresh cache skips.
- `latency-throughput` re-asks Q2: why bandwidth doesn't fix round trips.
- `review-foundations` uses the exercise pattern with new numbers.

## Sources

Claims in this spec cite the ids below.

```
- id: mdn-how-browsers-work
  title: "Populating the page: how browsers work" (MDN Web Docs)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work
  kind: docs
  published: living document; read from mdn/content commit bd7387a (2026-10-26)
  checked: 2026-10-28
  via: read
  supports: [navigation steps, DNS caching and per-hostname lookups, TCP before TLS before request, response then parse/preload/render steps, latency as the main threat]
  note: >-
    Read as files/en-us/web/performance/guides/how_browsers_work/index.md in the mdn/content GitHub repo (the
    website was unreachable). CONFLICT: says TLS "requires five more round trips" and "after eight round trips" the
    request is sent; that describes older TLS, not TLS 1.3's full handshake (rfc9846). This spec follows rfc9846 for
    round-trip counts and does not use MDN's counts. MDN prose is CC-BY-SA 2.5: paraphrased, not copied.
- id: mdn-crp
  title: "Critical rendering path" (MDN Web Docs)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path
  kind: docs
  checked: 2026-10-28
  via: read
  supports: [parse into DOM and CSSOM, render tree, layout, paint]
  note: mdn/content bd7387a.
- id: mdn-url
  title: "What is a URL?" (MDN Learn web development)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL
  kind: docs
  checked: 2026-10-28
  via: read
  supports: [URL parts scheme/authority/path/parameters, default ports 80 and 443]
  note: mdn/content bd7387a.
- id: mdn-dns
  title: "DNS" (MDN glossary)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Glossary/DNS
  kind: docs
  checked: 2026-10-28
  via: read
  supports: [DNS maps domain names to IP addresses; this is a DNS lookup]
  note: mdn/content bd7387a. Tier 2; the DNS RFCs were not readable (see rfc1034 below).
- id: mdn-tcp-handshake
  title: "TCP handshake" (MDN glossary)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Glossary/TCP_handshake
  kind: docs
  checked: 2026-10-28
  via: read
  supports: [three messages SYN, SYN-ACK, ACK before data; happens after DNS and before TLS]
  note: mdn/content bd7387a. Tier 2; RFC 9293 was not readable (see rfc9293 below).
- id: mdn-rtt
  title: "Round Trip Time (RTT)" (MDN glossary)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Glossary/Round_Trip_Time
  kind: docs
  checked: 2026-10-28
  via: read
  supports: [definition of a round trip]
  note: mdn/content bd7387a.
- id: mdn-http-overview
  title: "Overview of HTTP" (MDN Web Docs)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview
  kind: docs
  checked: 2026-10-28
  via: read
  supports: [browser fetches the HTML then makes further requests for subresources, connection set-up before request, HTTP/1.1 persistent connections reuse a connection]
  note: mdn/content bd7387a. Its QUIC sentence ("Google is experimenting") is out of date and is not used.
- id: mdn-caching
  title: "HTTP caching" (MDN Web Docs)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
  kind: docs
  checked: 2026-10-28
  via: read
  supports: [a cache reuses stored responses; the browser cache is a private cache]
  note: mdn/content bd7387a.
- id: mdn-nav-timing
  title: "Navigation timing" (MDN Performance API guide)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Navigation_timing
  kind: docs
  checked: 2026-10-28
  via: read
  supports: [one PerformanceNavigationTiming entry per document; document event timestamps domContentLoaded and load]
  note: mdn/content bd7387a.
- id: mdn-prt
  title: "PerformanceResourceTiming" (MDN API reference)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming
  kind: docs
  checked: 2026-10-28
  via: read
  supports: [attribute names domainLookupStart/End, connectStart/End, secureConnectionStart, requestStart, responseStart/End; DNS time = domainLookupEnd − domainLookupStart; TCP time = connectEnd − connectStart]
  note: mdn/content bd7387a. Also: cross-origin resources report 0 for these unless Timing-Allow-Origin allows it (not an issue for the page's own entry).
- id: mdn-resource-timing
  title: "Resource timing" (MDN Performance API guide)
  author: MDN contributors (Mozilla)
  url: https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing
  kind: docs
  checked: 2026-10-28
  via: read
  supports: [resource entries record DNS, request and response timestamps]
  note: mdn/content bd7387a.
- id: navtiming-2
  title: Navigation Timing Level 2 (W3C Editor's Draft)
  author: W3C Web Performance Working Group
  url: https://w3c.github.io/navigation-timing/
  kind: spec
  checked: 2026-10-28
  via: read
  supports: [PerformanceNavigationTiming extends PerformanceResourceTiming attributes]
  note: Read index.bs in w3c/navigation-timing commit 245fee2 (2026-09-01). Status ED, not a Recommendation.
- id: rfc9110
  title: HTTP Semantics (RFC 9110, STD 97)
  author: Fielding, Nottingham, Reschke (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9110
  kind: spec
  published: 2022-06
  checked: 2026-10-28
  via: read
  supports: [client and server are roles per connection (§3.3); GET requests a representation of the target resource (§9.3.1); status codes are three digits and the first digit is the class (§15); a cache stores responses to reduce response time on later equivalent requests (§3.8)]
  note: Read rfc9110.xml in httpwg/http-core commit bde37f6, the working group's source of the published RFC; the rfc-editor.org copy was unreachable.
- id: rfc9111
  title: HTTP Caching (RFC 9111, STD 98)
  author: Fielding, Nottingham, Reschke (eds.)
  url: https://www.rfc-editor.org/rfc/rfc9111
  kind: spec
  published: 2022-06
  checked: 2026-10-28
  via: read
  supports: [a fresh stored response can be reused without validation, reducing latency and network overhead (§1)]
  note: Read rfc9111.xml in httpwg/http-core commit bde37f6.
- id: rfc9846
  title: The Transport Layer Security (TLS) Protocol Version 1.3 (RFC 9846)
  author: IETF TLS Working Group (ed. E. Rescorla)
  url: https://www.rfc-editor.org/rfc/rfc9846
  kind: spec
  published: 2026-07
  checked: 2026-10-28
  via: read
  supports: [TLS needs a reliable in-order stream underneath (§1); full handshake message flow, one round trip before client application data (§2 figure); HelloRetryRequest costs an extra round trip (§4.2.8); 0-RTT data has weaker security properties (§2.3)]
  note: >-
    Read rfc9846.md in tlswg/tls13-spec commit c728b4e (2026-07-07); its metadata says it obsoletes RFC 8446 and is a
    minor, backward-compatible update keeping version 1.3. The author line is from the repo; not checked against the
    rfc-editor.org copy (unreachable). Curriculum scoping cited RFC 8446; 9846 supersedes it.
- id: rfc1034
  title: Domain Names - Concepts and Facilities (RFC 1034)
  author: P. Mockapetris
  url: https://www.rfc-editor.org/rfc/rfc1034
  kind: spec
  published: 1987-11
  checked: 2026-10-28
  via: search
  supports: none
  note: Lead for the dns chapter; not read (rfc-editor.org unreachable). This chapter's DNS claims rest on MDN.
- id: rfc9293
  title: Transmission Control Protocol (TCP) (RFC 9293)
  author: W. Eddy (ed.)
  url: https://www.rfc-editor.org/rfc/rfc9293
  kind: spec
  published: 2022-08
  checked: 2026-10-28
  via: search
  supports: none
  note: Lead for the tcp chapter; seen only in search results. This chapter's handshake claim rests on MDN.
```

## Open questions / unverified

- The DNS and TCP claims rest on MDN (tier 2), not the RFCs. They are map-level claims, so this is acceptable here,
  but the `dns` and `tcp` chapters must read RFC 1034/1035 and RFC 9293.
- The round-trip counts assume TCP plus TLS 1.3 without TCP Fast Open, 0-RTT or HTTP/3. Those change the count and
  are deferred, without claims, to `tcp`, `tls` and `http-versions`.
- The worked example's 30 / 40 / 50 ms are assumptions, not measurements. The chapter never presents them as
  typical.
- The chapter length target (15–30 minutes) is a hypothesis. This chapter is estimated at about 20 minutes: 6
  steps, 4 questions and 1 exercise.
- Should the page show a real `PerformanceNavigationTiming` entry from the reader's own visit? That would be real
  data, which is good, but it varies per reader, so the text could not quote it. Decide when the product is built.

## Evidence

- implementation: not run — `Product: none`; the owner has not authorized the /learn page
- model tests: not run — no model code exists yet; tests are specified under Visual, step 13
- browser checks: not run — nothing to render yet

## Review findings
