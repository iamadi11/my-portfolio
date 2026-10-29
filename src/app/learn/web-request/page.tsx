import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import LessonFilm from '@/components/learn/film/LessonFilm';
import JourneyStepper from '@/components/learn/web-request/JourneyStepper';
import WebRequestQuiz from '@/components/learn/web-request/Quiz';
import { LESSON_FILMS } from '@/content/learn/films';
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

const C = citeFor('web-request', SOURCES, SOURCE_NUMBER);

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

                <ChapterTabs
                    film={<LessonFilm film={LESSON_FILMS['web-request']} />}
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="journey">Where the time goes</h2>
                                <p>
                                    Press Next. A mark leaves the computer on the left. It visits the smaller
                                    machine before any cable exists, then the cable reaches the server. Where
                                    the mark sits is how many milliseconds have passed. A skipped wait is a
                                    machine the mark does not visit.
                                </p>
                            </div>
                            <JourneyStepper pane="learn" />
                            <details className="ln-more">
                                <summary>
                                    Names, the wrong first guess, and how a browser records the times
                                </summary>
                                <h2 id="parts">Parts you&rsquo;ll meet</h2>
                                <dl>
                                    <div>
                                        <dt>Browser</dt>
                                        <dd>
                                            The program that fetches pages and shows them. HTTP calls any
                                            program that starts a request a <em>user agent</em>; the browser
                                            is the most familiar one. <C ids={['rfc9110']} at="§3.5" />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Client and server</dt>
                                        <dd>
                                            In one connection, the client sends requests; the server accepts
                                            the connection and answers with responses. These are roles, not
                                            kinds of machine. <C ids={['rfc9110']} at="§3.3" />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>URL</dt>
                                        <dd>
                                            The address you type. It has a <em>scheme</em> (<code>https</code>
                                            , which protocol to use), an <em>authority</em> (the hostname,
                                            such as <code>example.com</code>, and an optional port), a{' '}
                                            <em>path</em> (<code>/about</code>) and optional parameters.{' '}
                                            <C ids={['mdn-url']} />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Hostname and IP address</dt>
                                        <dd>
                                            People use names like <code>example.com</code>. Computers send
                                            data to numeric IP addresses, such as <code>192.0.2.172</code>.{' '}
                                            <C ids={['mdn-url', 'mdn-dns']} />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Port</dt>
                                        <dd>
                                            A number that picks which &ldquo;gate&rdquo; on the server to use.
                                            URLs leave it out when it is the standard one: 80 for HTTP, 443
                                            for HTTPS. <C ids={['mdn-url']} />
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
                                            An agreed channel between browser and server that delivers bytes
                                            reliably and in order. HTTP needs one underneath it, and so does
                                            TLS; in this chapter TCP provides it (HTTP/3 runs over QUIC
                                            instead, a later chapter). <C ids={['rfc9110']} at="§3.3" />{' '}
                                            <C ids={['rfc9846']} at="§1" /> <C ids={['mdn-http-overview']} />
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
                                            The time for a message to reach the other side plus the time for
                                            the answer to come back. <C ids={['mdn-rtt']} />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>TLS</dt>
                                        <dd>
                                            The layer that encrypts the connection and authenticates the
                                            server. An <code>https</code> URL means HTTP over a TLS-secured
                                            connection. <C ids={['rfc9846']} at="§1" />{' '}
                                            <C ids={['rfc9110']} at="§4.2.2" />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Request and response</dt>
                                        <dd>
                                            The browser&rsquo;s message asking for something, and the
                                            server&rsquo;s answer. Every response has a three-digit status
                                            code; the first digit is the class (2xx success, 4xx client error,
                                            and so on). <C ids={['rfc9110']} at="§3.4, §15" />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Time to first byte</dt>
                                        <dd>
                                            The time from asking for the page until the first byte of the
                                            response arrives. <C ids={['mdn-how-browsers-work']} />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Cache</dt>
                                        <dd>
                                            A local store of earlier responses, used to answer later,
                                            equivalent requests without going all the way to the server.{' '}
                                            <C ids={['rfc9110']} at="§3.8" /> A stored response is{' '}
                                            <dfn>fresh</dfn> while it can be reused without first checking
                                            with the server that it is still valid.{' '}
                                            <C ids={['rfc9111']} at="§1" />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Parse and render</dt>
                                        <dd>
                                            The browser turns the HTML into the DOM (a tree of the
                                            page&rsquo;s elements) and the CSS into the CSSOM (a tree of
                                            styles), combines them into a render tree, works out where each
                                            box goes (layout) and paints pixels.{' '}
                                            <C ids={['mdn-how-browsers-work', 'mdn-crp']} />
                                        </dd>
                                    </div>
                                </dl>

                                <h2 id="puzzle">The puzzle</h2>
                                <p>
                                    You type <code>https://example.com/</code> and press Enter. The first
                                    visit of the day takes noticeably longer than a second visit a minute
                                    later. What is the browser doing in that time, and why does the second
                                    visit take less? <C ids={['mdn-how-browsers-work']} />
                                </p>
                                <p>
                                    It matters because every system design question starts and ends with
                                    someone waiting for a response. If you can&rsquo;t say where the time goes
                                    in one page load, you can&rsquo;t tell whether a cache, a CDN or a new
                                    region would help. MDN&rsquo;s performance guide calls latency &ldquo;the
                                    biggest threat&rdquo; to a fast-loading page.{' '}
                                    <C ids={['mdn-how-browsers-work']} />
                                </p>

                                <h2 id="first-guess">A first guess, and where it breaks</h2>
                                <p>
                                    A natural first guess:{' '}
                                    <em>
                                        &ldquo;the browser downloads the page, and the time it takes is the
                                        page&rsquo;s size divided by my connection speed.&rdquo;
                                    </em>
                                </p>
                                <p>
                                    That guess is not silly. For a large file on a connection that is already
                                    open, size divided by speed is a fair estimate, because transfer time
                                    grows with size. It also gets the direction right (server to browser), and
                                    the page does come back as a response to a request.{' '}
                                    <C ids={['rfc9110']} at="§3.3, §9.3.1" />
                                </p>
                                <p>
                                    It breaks for a small page on a first visit. The guess predicts almost no
                                    time, because the bytes are few. But before a single byte of the page can
                                    arrive, the browser has to find the server&rsquo;s address, open a
                                    connection, secure it and send the request. Each of those waits for
                                    messages to cross the network and come back, and a bigger bandwidth does
                                    not shorten that travel. The guess also misses that the HTML names further
                                    files (styles, scripts, images), each needing its own request, sometimes
                                    to other hostnames.{' '}
                                    <C ids={['mdn-how-browsers-work', 'mdn-http-overview']} />
                                </p>
                                <p className="ln-assume">
                                    <span className="ln-label">Derived, and simplified</span>
                                    <br />
                                    &ldquo;Bandwidth does not shorten the travel&rdquo; follows from what a
                                    round trip is <C ids={['mdn-rtt']} />. Sending each message also takes a
                                    little time that does depend on bandwidth (transmission time). This
                                    chapter leaves that out; &ldquo;Latency and throughput&rdquo; separates
                                    the two.
                                </p>

                                <h2 id="measure">Measure instead of guessing</h2>
                                <p>
                                    Browsers record a timestamp at each stage of a page fetch, and a page can
                                    read them through the Navigation Timing API. One{' '}
                                    <code>PerformanceNavigationTiming</code> entry describes the page, with{' '}
                                    <code>domainLookupStart</code>/<code>End</code>, <code>connectStart</code>
                                    /<code>End</code>, <code>secureConnectionStart</code>,{' '}
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
                                        <C ids={['mdn-prt']} />: the request&rsquo;s round trip plus the
                                        server&rsquo;s work (derived from step 5 below).
                                    </li>
                                    <li>
                                        On an <code>https</code> page the connection end includes the TLS
                                        handshake: the Fetch standard says it &ldquo;must include the time
                                        interval to complete enough of the TLS handshake to request the
                                        resource&rdquo;, and takes the secure connection start
                                        &ldquo;immediately before starting the handshake process&rdquo;{' '}
                                        <C ids={['fetch']} />. So TCP time is about{' '}
                                        <code>secureConnectionStart − connectStart</code> and TLS time about{' '}
                                        <code>connectEnd − secureConnectionStart</code> (derived). The common
                                        shortcut <code>connectEnd − connectStart</code> counts both together.
                                    </li>
                                </ul>
                                <p>
                                    Comparing a first visit with a repeat visit shows which steps disappear.
                                    When a fetch reuses a connection opened earlier, the Fetch standard sets
                                    the DNS and connection timestamps all to the fetch&rsquo;s start (after
                                    any redirects), so the entry shows 0 ms for DNS, TCP and TLS.{' '}
                                    <C ids={['fetch']} />
                                </p>
                            </details>
                            <details className="ln-more">
                                <summary>What each segment is</summary>
                                <ol>
                                    <li>
                                        <strong>Read the URL.</strong> Scheme, hostname and path.{' '}
                                        <C ids={['mdn-url']} /> No network yet, so it is not on the rail.
                                    </li>
                                    <li>
                                        <strong>DNS.</strong> A lookup turns the hostname into an address. A
                                        later request can skip it. Each hostname needs its own.{' '}
                                        <C ids={['mdn-how-browsers-work', 'mdn-dns']} />
                                    </li>
                                    <li>
                                        <strong>TCP.</strong> SYN, SYN-ACK, ACK. The browser waits for
                                        SYN-ACK, so this is one round trip. <C ids={['mdn-tcp-handshake']} />
                                    </li>
                                    <li>
                                        <strong>TLS 1.3.</strong> One round trip for a full handshake:
                                        ClientHello out, the server&rsquo;s parameters, certificate and
                                        Finished back, the client&rsquo;s Finished with its first data.{' '}
                                        <C ids={['rfc9846']} at="§2" /> A retry with different key-exchange
                                        parameters costs another.{' '}
                                        <C ids={['rfc9846']} at="§2.1, §4.2.4, §4.3.8" />
                                    </li>
                                    <li>
                                        <strong>Request.</strong> GET goes out; the server works; the first
                                        byte of HTML comes back. One round trip plus server time.{' '}
                                        <C ids={['rfc9110']} at="§9.3.1, §15" />
                                    </li>
                                    <li>
                                        <strong>Parse and render.</strong> The browser parses the HTML and
                                        then asks for the files it names. Those requests start after the first
                                        byte. <C ids={['mdn-how-browsers-work', 'mdn-crp']} /> Not on the
                                        rail.
                                    </li>
                                </ol>
                                <p>
                                    <strong>What a first visit adds up to,</strong> over TCP and TLS 1.3: DNS,
                                    then one round trip each for TCP, TLS and the request, plus server time.
                                    Three round trips to the server plus DNS before the first byte (derived
                                    from stations 2–5). No redirects, and none of the later shortcuts: TCP
                                    Fast Open, TLS 0-RTT, HTTP/3.
                                </p>
                                <p>
                                    <strong>Why a repeat visit is faster:</strong> a cached name skips DNS{' '}
                                    <C ids={['mdn-how-browsers-work']} />, and a reused connection skips the
                                    lookup entirely <C ids={['fetch']} /> plus the TCP and TLS handshakes
                                    (persistent connections, HTTP/1.1) <C ids={['mdn-http-overview']} />. A
                                    fresh cached response skips the server too.{' '}
                                    <C ids={['rfc9111']} at="§1" /> <C ids={['mdn-caching']} /> In the
                                    Interactive Lab, switch the visit and those segments shrink to nothing.
                                </p>
                            </details>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <p>
                                    Change the visit and the three times. Predict the repeat visit before you
                                    reveal it. The rail is the same model: a segment grows only when that step
                                    has milliseconds.
                                </p>
                            </div>
                            <JourneyStepper pane="lab" />
                            <details className="ln-more">
                                <summary>The default numbers, written out</summary>
                                <h2 id="worked">Worked example</h2>
                                <div className="ln-assume">
                                    <p className="ln-label">
                                        Assumed values for this example only, not measurements
                                    </p>
                                    <p>
                                        Round trip to the server 40 ms; DNS lookup 30 ms; server processing 50
                                        ms; HTTPS with TLS 1.3 over TCP; no redirects.
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
                                    Of the 200 ms, 150 ms is network waiting (DNS plus three round trips) and
                                    50 ms is the server.
                                </p>
                                <p>
                                    <strong>Your turn: a repeat visit</strong> on a connection that is still
                                    open, so no lookup is needed. DNS, TCP and TLS are skipped. What is the
                                    time to first byte?
                                </p>
                                <details className="ln-q">
                                    <summary>Check your answer</summary>
                                    <p>
                                        Only the request remains: 40 ms round trip + 50 ms server ={' '}
                                        <strong>90 ms</strong>. With a fresh cached copy, no request leaves
                                        the browser at all: 0 ms of network.
                                    </p>
                                </details>
                                <p>
                                    On the first visit, network waiting is 150 of the 200 ms, whatever the
                                    page&rsquo;s size. In this model, a bigger bandwidth changes none of those
                                    150 ms.
                                </p>
                                <p className="ln-label">What this example simplifies</p>
                                <ul>
                                    <li>
                                        DNS is one fixed cost; in reality it may need several queries, or none
                                        if cached.
                                    </li>
                                    <li>
                                        The first byte arrives one round trip after the request. Larger
                                        responses take longer, and TCP starts by sending little.
                                    </li>
                                    <li>No time is modelled for pushing bytes onto the link.</li>
                                </ul>

                                <h2 id="faster">Making it faster, and what that costs</h2>
                                <p>
                                    These are design judgements derived from the journey above; their details,
                                    with sources, come in the chapters named.
                                </p>
                                <ul>
                                    <li>
                                        <strong>Reuse what you already have</strong> (DNS cache, open
                                        connections, the HTTP cache). Caches can serve something stale; open
                                        connections are state the server keeps for idle clients.
                                    </li>
                                    <li>
                                        <strong>Move the server closer</strong> so each round trip is shorter
                                        (CDNs, more regions). It costs money and adds copies to keep
                                        consistent.
                                    </li>
                                    <li>
                                        <strong>Need fewer round trips per connection</strong> (newer HTTP
                                        versions, TLS resumption). Data sent as TLS &ldquo;0-RTT&rdquo; early
                                        data has weaker security properties. <C ids={['rfc9846']} at="§2.3" />
                                    </li>
                                    <li>
                                        <strong>Use fewer hostnames</strong>, so there are fewer lookups and
                                        connections; this can clash with using third-party services.
                                    </li>
                                    <li>
                                        <strong>Make the server answer faster</strong>: engineering work,
                                        caching or more machines.
                                    </li>
                                </ul>
                                <p>
                                    <strong>Choose by measuring.</strong> If round trips dominate the timing
                                    entry (a user far from the server), moving closer helps. If{' '}
                                    <code>responseStart − requestStart</code> dominates and is much larger
                                    than one round trip, the server is the place to work. Don&rsquo;t add a
                                    CDN to fix a slow database query, and don&rsquo;t buy bandwidth for a page
                                    made of many small requests.
                                </p>
                            </details>
                        </>
                    }
                    quiz={<WebRequestQuiz />}
                />

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
                    <p>
                        Sources for this chapter, with the same numbers as the marks above, are on the{' '}
                        <Link href="/learn/sources#web-request">sources page</Link>.
                    </p>
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
