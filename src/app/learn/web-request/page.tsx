import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import Cite from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import JourneyStepper from '@/components/learn/web-request/JourneyStepper';
import { SOURCE_NUMBER, SOURCES } from '@/content/learn/web-request-sources';

/**
 * Chapter 1, web-request: a map of what happens when you open a website. Learner-facing text for the reviewed spec in
 * `docs/system-design/chapters/web-request.md`; factual claims cite a source that was read (Sources below); derived statements,
 * design judgements and simplifications are labelled as such.
 */

export const metadata: Metadata = {
    title: 'What happens when you open a website',
    description:
        'System design, chapter 1: the steps between pressing Enter and seeing a page, and where the time goes. A map chapter with a step-by-step model.',
    alternates: { canonical: '/learn/web-request' },
};

const TITLES: Record<string, string> = Object.fromEntries(SOURCES.map((s) => [s.id, s.title]));

function C({ ids, at }: { ids: string[]; at?: string }): React.JSX.Element {
    return <Cite ids={ids} at={at} numbers={SOURCE_NUMBER} titles={TITLES} />;
}

function Q({
    n,
    ask,
    children,
}: {
    n: number;
    ask: React.ReactNode;
    children: React.ReactNode;
}): React.JSX.Element {
    return (
        <div className="ln-q">
            <p>
                <strong>Q{n}.</strong> {ask}
            </p>
            <details>
                <summary>Show the answer</summary>
                {children}
            </details>
        </div>
    );
}

export default function Page(): React.JSX.Element {
    return (
        <CourseShell crumbs={[{ label: 'Chapter 1' }]}>
            <article aria-labelledby="ch-h">
                <header className="bp-sheet ln-head">
                    <p className="ln-kicker">Chapter 1 · Stage 1, Foundations · Map chapter</p>
                    <h1 id="ch-h" className="ln-h1">
                        What happens when you open a website
                    </h1>
                    <p className="ln-lede">
                        You press Enter and, a moment later, a page appears. This chapter follows that moment
                        step by step and asks one question: where does the time go? It is a map: each step
                        gets a short account here and a chapter of its own later.
                    </p>
                </header>

                <div className="ln-prose">
                    <h2 id="goals">By the end you can</h2>
                    <ol>
                        <li>
                            Name, in order, the steps between pressing Enter and seeing the page: read the
                            URL, look up the hostname, open a connection, secure it, send the request, receive
                            the response, parse and render.
                        </li>
                        <li>
                            Say which steps wait on the network, and count the round trips a first visit needs
                            before the first byte of the page arrives.
                        </li>
                        <li>Predict which steps a repeat visit can skip, and why that is faster.</li>
                        <li>
                            Read a browser&rsquo;s timing entry for a page and point to the step that took
                            longest.
                        </li>
                    </ol>

                    <h2 id="parts">Parts you&rsquo;ll meet</h2>
                    <dl>
                        <div>
                            <dt>Browser</dt>
                            <dd>
                                The program that fetches pages and shows them. HTTP calls any program that
                                starts a request a <em>user agent</em>; the browser is the most familiar one.{' '}
                                <C ids={['rfc9110']} at="§3.5" />
                            </dd>
                        </div>
                        <div>
                            <dt>Client and server</dt>
                            <dd>
                                In one connection, the client sends requests; the server accepts the
                                connection and answers with responses. These are roles, not kinds of machine.{' '}
                                <C ids={['rfc9110']} at="§3.3" />
                            </dd>
                        </div>
                        <div>
                            <dt>URL</dt>
                            <dd>
                                The address you type. It has a <em>scheme</em> (<code>https</code>, which
                                protocol to use), an <em>authority</em> (the hostname, such as{' '}
                                <code>example.com</code>, and an optional port), a <em>path</em> (
                                <code>/about</code>) and optional parameters. <C ids={['mdn-url']} />
                            </dd>
                        </div>
                        <div>
                            <dt>Hostname and IP address</dt>
                            <dd>
                                People use names like <code>example.com</code>. Computers send data to numeric
                                IP addresses, such as <code>192.0.2.172</code>.{' '}
                                <C ids={['mdn-url', 'mdn-dns']} />
                            </dd>
                        </div>
                        <div>
                            <dt>Port</dt>
                            <dd>
                                A number that picks which &ldquo;gate&rdquo; on the server to use. URLs leave
                                it out when it is the standard one: 80 for HTTP, 443 for HTTPS.{' '}
                                <C ids={['mdn-url']} />
                            </dd>
                        </div>
                        <div>
                            <dt>DNS lookup</dt>
                            <dd>
                                Turning a hostname into an IP address. <C ids={['mdn-dns']} />
                            </dd>
                        </div>
                        <div>
                            <dt>Connection</dt>
                            <dd>
                                An agreed channel between browser and server that delivers bytes reliably and
                                in order. HTTP needs one underneath it, and so does TLS; in this chapter TCP
                                provides it (HTTP/3 runs over QUIC instead, a later chapter).{' '}
                                <C ids={['rfc9110']} at="§3.3" /> <C ids={['rfc9846']} at="§1" />{' '}
                                <C ids={['mdn-http-overview']} />
                            </dd>
                        </div>
                        <div>
                            <dt>Handshake</dt>
                            <dd>
                                Messages exchanged to set something up before the real data flows.{' '}
                                <C ids={['mdn-tcp-handshake']} />
                            </dd>
                        </div>
                        <div>
                            <dt>Round trip</dt>
                            <dd>
                                The time for a message to reach the other side plus the time for the answer to
                                come back. <C ids={['mdn-rtt']} />
                            </dd>
                        </div>
                        <div>
                            <dt>TLS</dt>
                            <dd>
                                The layer that encrypts the connection and authenticates the server. An{' '}
                                <code>https</code> URL means HTTP over a TLS-secured connection.{' '}
                                <C ids={['rfc9846']} at="§1" /> <C ids={['rfc9110']} at="§4.2.2" />
                            </dd>
                        </div>
                        <div>
                            <dt>Request and response</dt>
                            <dd>
                                The browser&rsquo;s message asking for something, and the server&rsquo;s
                                answer. Every response has a three-digit status code; the first digit is the
                                class (2xx success, 4xx client error, and so on).{' '}
                                <C ids={['rfc9110']} at="§3.4, §15" />
                            </dd>
                        </div>
                        <div>
                            <dt>Time to first byte</dt>
                            <dd>
                                The time from asking for the page until the first byte of the response
                                arrives. <C ids={['mdn-how-browsers-work']} />
                            </dd>
                        </div>
                        <div>
                            <dt>Cache</dt>
                            <dd>
                                A local store of earlier responses, used to answer later, equivalent requests
                                without going all the way to the server. <C ids={['rfc9110']} at="§3.8" /> A
                                stored response is <dfn>fresh</dfn> while it can be reused without first
                                checking with the server that it is still valid.{' '}
                                <C ids={['rfc9111']} at="§1" />
                            </dd>
                        </div>
                        <div>
                            <dt>Parse and render</dt>
                            <dd>
                                The browser turns the HTML into the DOM (a tree of the page&rsquo;s elements)
                                and the CSS into the CSSOM (a tree of styles), combines them into a render
                                tree, works out where each box goes (layout) and paints pixels.{' '}
                                <C ids={['mdn-how-browsers-work', 'mdn-crp']} />
                            </dd>
                        </div>
                    </dl>

                    <h2 id="puzzle">The puzzle</h2>
                    <p>
                        You type <code>https://example.com/</code> and press Enter. The first visit of the day
                        takes noticeably longer than a second visit a minute later. What is the browser doing
                        in that time, and why does the second visit take less?{' '}
                        <C ids={['mdn-how-browsers-work']} />
                    </p>
                    <p>
                        It matters because every system design question starts and ends with someone waiting
                        for a response. If you can&rsquo;t say where the time goes in one page load, you
                        can&rsquo;t tell whether a cache, a CDN or a new region would help. MDN&rsquo;s
                        performance guide calls latency &ldquo;the biggest threat&rdquo; to a fast-loading
                        page. <C ids={['mdn-how-browsers-work']} />
                    </p>

                    <h2 id="first-guess">A first guess, and where it breaks</h2>
                    <p>
                        A natural first guess:{' '}
                        <em>
                            &ldquo;the browser downloads the page, and the time it takes is the page&rsquo;s
                            size divided by my connection speed.&rdquo;
                        </em>
                    </p>
                    <p>
                        That guess is not silly. For a large file on a connection that is already open, size
                        divided by speed is a fair estimate, because transfer time grows with size. It also
                        gets the direction right (server to browser), and the page does come back as a
                        response to a request. <C ids={['rfc9110']} at="§3.3, §9.3.1" />
                    </p>
                    <p>
                        It breaks for a small page on a first visit. The guess predicts almost no time,
                        because the bytes are few. But before a single byte of the page can arrive, the
                        browser has to find the server&rsquo;s address, open a connection, secure it and send
                        the request. Each of those waits for messages to cross the network and come back, and
                        a bigger bandwidth does not shorten that travel. The guess also misses that the HTML
                        names further files (styles, scripts, images), each needing its own request, sometimes
                        to other hostnames. <C ids={['mdn-how-browsers-work', 'mdn-http-overview']} />
                    </p>
                    <p className="ln-assume">
                        <span className="ln-label">Derived, and simplified</span>
                        <br />
                        &ldquo;Bandwidth does not shorten the travel&rdquo; follows from what a round trip is{' '}
                        <C ids={['mdn-rtt']} />. Sending each message also takes a little time that does
                        depend on bandwidth (transmission time). This chapter leaves that out; &ldquo;Latency
                        and throughput&rdquo; separates the two.
                    </p>

                    <h2 id="measure">Measure instead of guessing</h2>
                    <p>
                        Browsers record a timestamp at each stage of a page fetch, and a page can read them
                        through the Navigation Timing API. One <code>PerformanceNavigationTiming</code> entry
                        describes the page, with <code>domainLookupStart</code>/<code>End</code>,{' '}
                        <code>connectStart</code>/<code>End</code>, <code>secureConnectionStart</code>,{' '}
                        <code>requestStart</code> and <code>responseStart</code>/<code>End</code>.{' '}
                        <C ids={['navtiming-2', 'mdn-nav-timing', 'mdn-prt']} />
                    </p>
                    <ul>
                        <li>
                            DNS time is <code>domainLookupEnd − domainLookupStart</code>.{' '}
                            <C ids={['mdn-prt']} />
                        </li>
                        <li>
                            Waiting for the response is <code>responseStart − requestStart</code>{' '}
                            <C ids={['mdn-prt']} />: the request&rsquo;s round trip plus the server&rsquo;s
                            work (derived from step 5 below).
                        </li>
                        <li>
                            On an <code>https</code> page the connection end includes the TLS handshake: the
                            Fetch standard says it &ldquo;must include the time interval to complete enough of
                            the TLS handshake to request the resource&rdquo;, and takes the secure connection
                            start &ldquo;immediately before starting the handshake process&rdquo;{' '}
                            <C ids={['fetch']} />. So TCP time is about{' '}
                            <code>secureConnectionStart − connectStart</code> and TLS time about{' '}
                            <code>connectEnd − secureConnectionStart</code> (derived). The common shortcut{' '}
                            <code>connectEnd − connectStart</code> counts both together.
                        </li>
                    </ul>
                    <p>
                        Comparing a first visit with a repeat visit shows which steps disappear. When a fetch
                        reuses a connection opened earlier, the Fetch standard sets the DNS and connection
                        timestamps all to the fetch&rsquo;s start (after any redirects), so the entry shows 0
                        ms for DNS, TCP and TLS. <C ids={['fetch']} />
                    </p>

                    <h2 id="journey">The journey, step by step</h2>
                    <p>
                        In the simple model this chapter uses, a page load is a chain of steps, and most early
                        steps are waits for a message to go there and back. Real browsers and networks have
                        optimisations this model leaves out; later chapters add them.
                    </p>
                    <ol>
                        <li>
                            <strong>Read the URL.</strong> The scheme says to use HTTPS; the authority gives
                            the hostname and an optional port (443 by default for HTTPS); the path says what
                            to ask for. <C ids={['mdn-url']} />
                        </li>
                        <li>
                            <strong>Look up the hostname (DNS).</strong> The browser needs the server&rsquo;s
                            IP address. On a first visit a DNS lookup asks name servers; afterwards the answer
                            is likely cached, so later requests skip it. Each different hostname the page uses
                            needs its own lookup. <C ids={['mdn-how-browsers-work', 'mdn-dns']} />{' '}
                            (Simplified: a cache can sometimes answer even your first lookup. Where DNS caches
                            live is in the DNS chapter.)
                        </li>
                        <li>
                            <strong>Open a connection (TCP).</strong> Browser and server exchange three
                            messages before the request: SYN, SYN-ACK, ACK <C ids={['mdn-tcp-handshake']} />.
                            The browser sends SYN and must wait for SYN-ACK to come back, so this costs one
                            round trip before the request can follow the ACK (derived from the message order).
                        </li>
                        <li>
                            <strong>Secure it (TLS).</strong> For HTTPS, a TLS handshake agrees keys and
                            authenticates the server first. In TLS 1.3&rsquo;s full handshake the client sends
                            a ClientHello; the server answers with a ServerHello, its parameters, its
                            certificate and a Finished message; the client sends its own Finished together
                            with its first data. That is one round trip <C ids={['rfc9846']} at="§2" />. If
                            the server needs the client to retry with different key-exchange parameters, that
                            costs another <C ids={['rfc9846']} at="§2.1, §4.2.4, §4.3.8" />.
                        </li>
                        <li>
                            <strong>Send the request; wait for the response.</strong> The browser sends an
                            HTTP request, normally <code>GET</code> for the page. The server works out its
                            answer and sends a response with a status code (for example 200 OK) and the HTML:
                            one more round trip, plus the server&rsquo;s own processing time.{' '}
                            <C ids={['rfc9110']} at="§9.3.1, §15" /> <C ids={['mdn-how-browsers-work']} />
                        </li>
                        <li>
                            <strong>Parse, fetch more, render.</strong> As the HTML arrives, the browser
                            parses it into the DOM and requests the files it names. Browsers can also use a
                            &ldquo;preload scanner&rdquo; that reads ahead and starts some downloads early.
                            Then the CSSOM, the render tree, layout and paint. A script without{' '}
                            <code>async</code> or <code>defer</code> pauses parsing until it has run. Either
                            way, the browser finds those files by reading the HTML, so they are requested
                            after the HTML&rsquo;s first byte arrives.{' '}
                            <C ids={['mdn-how-browsers-work', 'mdn-crp']} />
                        </li>
                    </ol>
                    <p>
                        <strong>Counting the network for a first visit</strong> to an HTTPS site over TCP and
                        TLS 1.3: the first byte of the HTML arrives after the DNS lookup, one round trip for
                        TCP, one for TLS, one for the request and response, plus the server&rsquo;s processing
                        time. That is three round trips to the server plus DNS before anything can appear
                        (derived from steps 2–5). The count assumes no redirects and none of three shortcuts
                        taught later: TCP Fast Open (data riding on the first TCP message), TLS
                        &ldquo;0-RTT&rdquo; early data (sent before the handshake finishes) and HTTP/3 (which
                        runs over QUIC instead of TCP).
                    </p>
                    <p>
                        <strong>Why the second visit is faster:</strong> the hostname is cached, so there is
                        no DNS wait <C ids={['mdn-how-browsers-work']} /> (and a reused connection needs no
                        lookup at all: the lookup happens only when a new connection is made{' '}
                        <C ids={['fetch']} />
                        ); if the connection from the first visit is still open, it can be reused, with no TCP
                        or TLS handshake (keeping connections open for reuse, &ldquo;persistent
                        connections&rdquo;, arrived in HTTP/1.1) <C ids={['mdn-http-overview']} />
                        ; and if the browser holds a fresh cached copy of the response, it can use it without
                        contacting the server at all. <C ids={['rfc9111']} at="§1" />{' '}
                        <C ids={['mdn-caching']} />
                    </p>
                </div>

                <JourneyStepper />

                <div className="ln-prose">
                    <h3>Check yourself</h3>
                    <Q
                        n={1}
                        ask="Put these in order for a first HTTPS visit: TLS handshake, DNS lookup, HTTP request, TCP handshake."
                    >
                        <p>
                            DNS lookup, TCP handshake, TLS handshake, HTTP request. TLS runs on top of a
                            reliable connection <C ids={['rfc9846']} at="§1" />, so the connection must exist
                            first; on HTTPS the request travels inside the secured connection; and nothing can
                            connect before DNS gives an address. Revisit <a href="#journey">the journey</a>,
                            steps 2–5.
                        </p>
                    </Q>
                    <Q
                        n={2}
                        ask="Which can a repeat visit skip? (a) DNS lookup (b) TCP handshake (c) parsing the HTML (d) the request itself"
                    >
                        <p>
                            (a) if the hostname is cached, or if the connection is reused; (b) if the
                            connection is still open and reused; (d) only if the browser holds a fresh cached
                            response. Not (c): the browser parses whatever HTML it shows, even a cached copy.
                            Revisit <a href="#journey">why the second visit is faster</a>.
                        </p>
                    </Q>
                    <Q
                        n={3}
                        ask="The page loads its fonts from a second hostname. Which extra steps can that cost on a first visit?"
                    >
                        <p>
                            Its own DNS lookup, because each hostname needs one{' '}
                            <C ids={['mdn-how-browsers-work']} />, and usually its own TCP and TLS handshakes,
                            because the Fetch standard reuses a connection only for the same origin: the same
                            scheme, host and port <C ids={['fetch']} /> <C ids={['rfc9110']} at="§4.3.1" />.
                            &ldquo;Nothing, the browser is already connected&rdquo; is wrong in general: that
                            connection belongs to the first hostname&rsquo;s origin. Whether connections can
                            sometimes be shared between hostnames is a later chapter. Revisit{' '}
                            <a href="#journey">the journey</a>, step 2.
                        </p>
                    </Q>

                    <h2 id="worked">Worked example</h2>
                    <div className="ln-assume">
                        <p className="ln-label">Assumed values for this example only, not measurements</p>
                        <p>
                            Round trip to the server 40 ms; DNS lookup 30 ms; server processing 50 ms; HTTPS
                            with TLS 1.3 over TCP; no redirects.
                        </p>
                    </div>
                    <p>
                        <strong>First visit, time to the HTML&rsquo;s first byte:</strong>
                    </p>
                    <table>
                        <caption className="sr-only">First visit, step by step</caption>
                        <thead>
                            <tr>
                                <th scope="col">Step</th>
                                <th scope="col" className="ln-num">
                                    Time
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>DNS lookup</td>
                                <td className="ln-num">30 ms</td>
                            </tr>
                            <tr>
                                <td>TCP handshake (1 round trip)</td>
                                <td className="ln-num">40 ms</td>
                            </tr>
                            <tr>
                                <td>TLS 1.3 handshake (1 round trip)</td>
                                <td className="ln-num">40 ms</td>
                            </tr>
                            <tr>
                                <td>Request and first byte (1 round trip + server)</td>
                                <td className="ln-num">40 + 50 ms</td>
                            </tr>
                            <tr>
                                <th scope="row">Total</th>
                                <td className="ln-num">
                                    <strong>200 ms</strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p>
                        Of the 200 ms, 150 ms is network waiting (DNS plus three round trips) and 50 ms is the
                        server.
                    </p>
                    <p>
                        <strong>Your turn: a repeat visit</strong> on a connection that is still open, so no
                        lookup is needed. DNS, TCP and TLS are skipped. What is the time to first byte?
                    </p>
                    <details className="ln-q">
                        <summary>Check your answer</summary>
                        <p>
                            Only the request remains: 40 ms round trip + 50 ms server = <strong>90 ms</strong>
                            . With a fresh cached copy, no request leaves the browser at all: 0 ms of network.
                        </p>
                    </details>
                    <p>
                        On the first visit, network waiting is 150 of the 200 ms, whatever the page&rsquo;s
                        size. In this model, a bigger bandwidth changes none of those 150 ms.
                    </p>
                    <p className="ln-label">What this example simplifies</p>
                    <ul>
                        <li>
                            DNS is one fixed cost; in reality it may need several queries, or none if cached.
                        </li>
                        <li>
                            The first byte arrives one round trip after the request. Larger responses take
                            longer, and TCP starts by sending little.
                        </li>
                        <li>No time is modelled for pushing bytes onto the link.</li>
                    </ul>

                    <h3>Check yourself</h3>
                    <Q
                        n={4}
                        ask="You double your bandwidth, and a small page’s first-visit time to first byte barely changes. Why?"
                    >
                        <p>
                            Most of that time is messages travelling there and back (the lookup, two
                            handshakes, the request), and bandwidth does not shorten travel. &ldquo;The server
                            is slow&rdquo; is wrong as the explanation: a slow server is slow at any
                            bandwidth, so it cannot explain why doubling bandwidth changed nothing. To see how
                            much is server, compare <code>responseStart − requestStart</code> (one round trip
                            plus the server&rsquo;s work) with a handshake&rsquo;s round trip, such as{' '}
                            <code>secureConnectionStart − connectStart</code>; what is left over is roughly
                            the server. Revisit <a href="#first-guess">the first guess</a> and the{' '}
                            <a href="#worked">worked example</a>.
                        </p>
                    </Q>
                    <Q
                        n={5}
                        ask={
                            <>
                                A page&rsquo;s timing entry shows these times in ms from the start (assumed
                                values): lookup 2–32, connect start 32, secure connection start 72, connect
                                end 112, request start 113, response start 263. Which step took longest, and
                                what would you look at next?
                            </>
                        }
                    >
                        <p>
                            Waiting for the response: 263 − 113 = 150 ms. DNS took 30 ms, TCP 72 − 32 = 40 ms
                            and TLS 112 − 72 = 40 ms. The handshakes each show one round trip of about 40 ms,
                            so roughly 110 ms of the 150 is the server&rsquo;s own work: look at the server,
                            not the network. Reading TCP as <code>connectEnd − connectStart</code> = 80 ms is
                            wrong on HTTPS, because that interval includes TLS. Revisit{' '}
                            <a href="#measure">measure instead of guessing</a>.
                        </p>
                    </Q>

                    <h2 id="faster">Making it faster, and what that costs</h2>
                    <p>
                        These are design judgements derived from the journey above; their details, with
                        sources, come in the chapters named.
                    </p>
                    <ul>
                        <li>
                            <strong>Reuse what you already have</strong> (DNS cache, open connections, the
                            HTTP cache). Caches can serve something stale; open connections are state the
                            server keeps for idle clients.
                        </li>
                        <li>
                            <strong>Move the server closer</strong> so each round trip is shorter (CDNs, more
                            regions). It costs money and adds copies to keep consistent.
                        </li>
                        <li>
                            <strong>Need fewer round trips per connection</strong> (newer HTTP versions, TLS
                            resumption). Data sent as TLS &ldquo;0-RTT&rdquo; early data has weaker security
                            properties. <C ids={['rfc9846']} at="§2.3" />
                        </li>
                        <li>
                            <strong>Use fewer hostnames</strong>, so there are fewer lookups and connections;
                            this can clash with using third-party services.
                        </li>
                        <li>
                            <strong>Make the server answer faster</strong>: engineering work, caching or more
                            machines.
                        </li>
                    </ul>
                    <p>
                        <strong>Choose by measuring.</strong> If round trips dominate the timing entry (a user
                        far from the server), moving closer helps. If{' '}
                        <code>responseStart − requestStart</code> dominates and is much larger than one round
                        trip, the server is the place to work. Don&rsquo;t add a CDN to fix a slow database
                        query, and don&rsquo;t buy bandwidth for a page made of many small requests.
                    </p>

                    <h2 id="exercise">Exercise</h2>
                    <p>
                        Use the worked example&rsquo;s assumed values, but with a 120 ms round trip, as for a
                        user far from the server. Compute the first-visit time to first byte and its network
                        share. Then decide which helps more: halving the server processing time, or serving
                        from a place with a 30 ms round trip. Then check in Fig. 1: choose First visit, set
                        the round trip to 120 ms and read the total and network share. Set the server time to
                        25 ms (the halved case) and read the total; put it back to 50 ms, set the round trip
                        to 30 ms, and compare.
                    </p>
                    <details className="ln-q">
                        <summary>Show the worked answer</summary>
                        <p>
                            First visit: 30 + 120 + 120 + 120 + 50 = 440 ms, of which 390 ms (88.6%) is
                            network. Halving the server time saves 25 ms. Moving closer gives 30 + 30 + 30 +
                            30 + 50 = 170 ms, saving 270 ms, so moving closer wins. Measure which part
                            dominates before choosing a fix.
                        </p>
                    </details>

                    <h2 id="own-words">In your own words, and elsewhere</h2>
                    <ul>
                        <li>
                            Explain to a friend why opening a website a second time is faster, using the words
                            &ldquo;round trip&rdquo;, &ldquo;cache&rdquo; and &ldquo;connection&rdquo;.
                        </li>
                        <li>
                            A mobile app calls an API on a server it has never contacted. Which of the six
                            steps still happen? Which can it avoid on its second call?
                        </li>
                    </ul>

                    <h2 id="sources">Sources</h2>
                    <p>
                        The parts of each source cited here were read in the project&rsquo;s public source
                        repository (the websites were unreachable when this chapter was written); links point
                        to the published versions. RFC 9110 and RFC 9111 section numbers were checked against
                        the published RFC text as the HTTP Working Group publishes it (httpwg.org/specs). RFC
                        9846&rsquo;s were checked only against the TLS Working Group&rsquo;s final source
                        file, not the published RFC, which could not be reached. MDN content is by Mozilla
                        contributors under CC-BY-SA 2.5 and is paraphrased here, not copied.
                    </p>
                    <ol className="ln-sources">
                        {SOURCES.map((s) => (
                            <li key={s.id} id={`src-${s.id}`}>
                                <a href={s.url} rel="noreferrer">
                                    {s.title}
                                </a>
                                . {s.publisher}. <span className="ln-note">Read from {s.read}.</span>
                            </li>
                        ))}
                    </ol>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 2,{' '}
                        <Link href="/learn/client-server">
                            <strong>Clients, servers and request–response</strong>
                        </Link>
                        : who plays which role, what one exchange contains, and what a client can know when no
                        response comes. <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
