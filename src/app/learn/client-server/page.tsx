import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import ExchangeStepper from '@/components/learn/client-server/ExchangeStepper';
import ClientServerQuiz from '@/components/learn/client-server/Quiz';
import CourseShell from '@/components/learn/CourseShell';
import LessonFilm from '@/components/learn/film/LessonFilm';
import {
    CLIENT_SERVER_SOURCE_NUMBER as SOURCE_NUMBER,
    CLIENT_SERVER_SOURCES as SOURCES,
} from '@/content/learn/client-server-sources';
import { LESSON_FILMS } from '@/content/learn/films';

/**
 * Chapter 2, client-server: the two roles, what one request and one response contain, statelessness, and what a
 * client can know when no response comes. Learner-facing text for `docs/system-design/chapters/client-server.md`;
 * factual claims cite a source that was read (Sources below); derived statements and design judgements are labelled.
 */

export const metadata: Metadata = {
    title: 'Clients, servers and request–response',
    description:
        'System design, chapter 2: who is the client and who is the server, what one HTTP exchange contains, and what a client can know when no response comes back.',
    alternates: { canonical: '/learn/client-server' },
};

const C = citeFor('client-server', SOURCES, SOURCE_NUMBER);

export default function Page(): React.JSX.Element {
    return (
        <CourseShell chapterId="client-server" crumbs={[{ label: 'Chapter 2' }]}>
            <article aria-labelledby="ch-h">
                <header className="bp-sheet ln-head">
                    <p className="ln-kicker">Chapter 2 · Stage 1, Foundations</p>
                    <h1 id="ch-h" className="ln-h1">
                        Clients, servers and request–response
                    </h1>
                    <p className="ln-lede">
                        Almost everything in system design is one program asking another for something. This
                        chapter looks closely at one such exchange: who plays which role, what travels, and
                        what each side can know when something goes wrong on the way.
                    </p>
                </header>

                <ChapterTabs
                    film={<LessonFilm film={LESSON_FILMS['client-server']} />}
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="figure">One exchange</h2>
                                <p>
                                    Step the packet. It reaches the server, the server does the work, and the
                                    reply falls off the wire. The client sees nothing come back, so it cannot
                                    tell whether that work happened.
                                </p>
                            </div>
                            <ExchangeStepper pane="learn" />
                            <details className="ln-more">
                                <summary>
                                    Names, the wrong first guess, and the rules — after you have run the
                                    exchange
                                </summary>
                                <h2 id="parts">Parts you&rsquo;ll meet</h2>
                                <p>
                                    Terms from <Link href="/learn/web-request">chapter 1</Link> (connection,
                                    request and response, status code, user agent) keep their meaning. New or
                                    sharpened here:
                                </p>
                                <dl>
                                    <div>
                                        <dt>Client and server</dt>
                                        <dd>
                                            The client is the program that opens a connection to send
                                            requests; the server is the program that accepts connections and
                                            answers them with responses. They are roles on one connection, not
                                            kinds of computer. <C ids={['rfc9110']} at="§3.3" />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Origin server and intermediary</dt>
                                        <dd>
                                            The origin server can give the authoritative response for a
                                            resource: what people usually mean by &ldquo;the website&rsquo;s
                                            server&rdquo;. An intermediary, such as a proxy, sits between
                                            client and origin server and passes messages on; on each
                                            connection it is still a client or a server.{' '}
                                            <C ids={['rfc9110']} at="§3.6, §3.7" />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Exchange</dt>
                                        <dd>One request and the response (or responses) it gets.</dd>
                                    </div>
                                    <div>
                                        <dt>Method and target</dt>
                                        <dd>
                                            The method says what the client wants done, such as{' '}
                                            <code>GET</code> (fetch) or <code>POST</code> (process this data).
                                            The target is the resource it is about, written as a path such as{' '}
                                            <code>/orders/42</code>. <C ids={['rfc9110']} at="§9.1, §7.1" />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Header field and body</dt>
                                        <dd>
                                            A header field is a <code>Name: value</code> line carrying extra
                                            information about the message, such as <code>Host</code>. The body
                                            is the data after the header fields, such as form data or a page
                                            (the standard calls it &ldquo;content&rdquo;).{' '}
                                            <C ids={['rfc9110']} at="§6.3, §6.4" />{' '}
                                            <C ids={['mdn-messages']} />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Stateless</dt>
                                        <dd>
                                            Each request can be understood on its own, without knowing which
                                            requests came before it on the connection.{' '}
                                            <C ids={['rfc9110']} at="§3.3" />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Cookie</dt>
                                        <dd>
                                            A small name=value item a server asks the browser to store (with{' '}
                                            <code>Set-Cookie</code>) and the browser sends back with later
                                            requests (in <code>Cookie</code>). <C ids={['rfc6265']} at="§3" />{' '}
                                            <C ids={['mdn-cookies']} />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Timeout</dt>
                                        <dd>
                                            How long a client waits for a response before giving up. HTTP sets
                                            no fixed time: clients may abandon a request when a response takes
                                            too long. <C ids={['rfc9110']} at="§7.5" />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Safe and idempotent methods</dt>
                                        <dd>
                                            A safe method is read-only in meaning (<code>GET</code>,{' '}
                                            <code>HEAD</code>, <code>OPTIONS</code>, <code>TRACE</code>). An
                                            idempotent method is one where sending the same request several
                                            times has the same <em>intended</em> effect as sending it once:{' '}
                                            <code>PUT</code>, <code>DELETE</code> and the safe methods.{' '}
                                            <C ids={['rfc9110']} at="§9.2.1, §9.2.2" />
                                        </dd>
                                    </div>
                                </dl>

                                <h2 id="problem">The problem</h2>
                                <p>
                                    You press &ldquo;Place order&rdquo; in a shop&rsquo;s app. The spinner
                                    turns, then: &ldquo;Network error&rdquo;. Did you buy the lamp? Should you
                                    press again? To answer, you need to know who said what to whom, and what
                                    each side can know.
                                </p>
                                <p>
                                    This matters well beyond shops. Browsers ask web servers, web servers ask
                                    databases, services ask other services. Get the roles or the failure cases
                                    wrong and you get real bugs: a payment taken twice, or an order lost
                                    because nobody tried again. The HTTP standard itself warns clients not to
                                    repeat some requests automatically for this reason.{' '}
                                    <C ids={['rfc9110']} at="§9.2.2" />
                                </p>

                                <h2 id="first-guess">A first guess, and where it breaks</h2>
                                <p>
                                    A natural first picture: &ldquo;My phone is the client and the
                                    shop&rsquo;s big computer is the server. The client asks, the server
                                    answers. An error means nothing happened, so I press again.&rdquo;
                                </p>
                                <p>
                                    Most of the time it works: both messages arrive, and the app sends a
                                    request and gets a response <C ids={['rfc9110']} at="§3.4" />. Pressing
                                    again to reload a page is harmless, because <code>GET</code> asks for no
                                    change <C ids={['rfc9110']} at="§9.2.1, §9.2.2" />. It breaks in two
                                    places.
                                </p>
                                <ul>
                                    <li>
                                        <strong>Roles.</strong> To answer you, the shop&rsquo;s web server
                                        sends its own request to a database server. On that connection the web
                                        server is the client. &ldquo;Client = small device, server = big
                                        computer&rdquo; cannot say what the web server is.{' '}
                                        <C ids={['rfc9110']} at="§3.3" /> <C ids={['pg-architecture']} />
                                    </li>
                                    <li>
                                        <strong>No response.</strong> &ldquo;Network error&rdquo; after
                                        &ldquo;Place order&rdquo; has three possible causes, and the app
                                        cannot tell them apart: the request was lost (no order); the order was
                                        placed but the response was lost; or the shop was slow and the app
                                        stopped waiting. In the last two, pressing again places a second
                                        order. <C ids={['rfc9110']} at="§7.5, §9.2.2" /> (The three causes are
                                        derived: an exchange is two messages, and either can fail to arrive in
                                        time. They assume the server does a request completely or not at all;
                                        a server that fails halfway is a later chapter.)
                                    </li>
                                </ul>

                                <h2 id="observe">Look at what actually travels</h2>
                                <p>
                                    In HTTP/1.1 the messages are plain text, so you can read an exchange line
                                    by line <C ids={['mdn-http-overview']} />{' '}
                                    <C ids={['rfc9112']} at="§3, §4" />. RFC 9110 shows one{' '}
                                    <C ids={['rfc9110']} at="§3.9" />; its request and response begin:
                                </p>
                                <pre>
                                    <code>{`GET /hello.txt HTTP/1.1
User-Agent: curl/7.64.1
Host: www.example.com`}</code>
                                </pre>
                                <pre>
                                    <code>{`HTTP/1.1 200 OK
Date: Mon, 27 Jul 2009 12:28:53 GMT
Server: Apache`}</code>
                                </pre>
                                <ul>
                                    <li>
                                        <strong>
                                            Everything the server learns about you is in the request.
                                        </strong>{' '}
                                        The first line names the method, the target and the HTTP version; the
                                        header fields add the rest. <C ids={['rfc9112']} at="§3" />{' '}
                                        <C ids={['rfc9110']} at="§3.4" />
                                    </li>
                                    <li>
                                        <strong>
                                            Everything the client learns is in the response, if it arrives.
                                        </strong>{' '}
                                        A client that receives nothing has learned nothing about what the
                                        server did (derived: the exchange has only these two messages).
                                    </li>
                                </ul>

                                <h2 id="mechanism">How it really works</h2>
                                <h3 id="roles">Roles, and who starts</h3>
                                <p>
                                    A client opens a connection to send requests; a server accepts connections
                                    and answers them. The same program can be a client on some connections and
                                    a server on others <C ids={['rfc9110']} at="§3.3" />. The same idea holds
                                    outside HTTP: a database server, for example, accepts connections from
                                    client applications, and a web server that reads the database is one of
                                    those clients <C ids={['pg-architecture']} />.
                                </p>
                                <p>
                                    The client starts every exchange, and the server answers requests{' '}
                                    <C ids={['rfc9110']} at="§3.4" />; the server does not start one of its
                                    own <C ids={['mdn-http-overview']} />. Ways for a server to send news
                                    without being asked each time exist, as extra mechanisms on top{' '}
                                    <C ids={['mdn-sse', 'mdn-websockets']} /> (chapter &ldquo;Pushing to
                                    clients&rdquo;, later).
                                </p>

                                <h3 id="messages">What a request and a response contain</h3>
                                <p>
                                    A request has a method and a target, and can carry header fields and a
                                    body <C ids={['rfc9110']} at="§3.4" />. In HTTP/1.1 it starts with a
                                    request line, <code>method target version</code>, such as{' '}
                                    <code>POST /orders HTTP/1.1</code>, and must include a <code>Host</code>{' '}
                                    header field <C ids={['rfc9112']} at="§3, §3.2" />.
                                </p>
                                <p>
                                    A response has a status code, and can carry header fields and a body{' '}
                                    <C ids={['rfc9110']} at="§3.4" />. In HTTP/1.1 it starts with a status
                                    line, such as <code>HTTP/1.1 201 Created</code>{' '}
                                    <C ids={['rfc9112']} at="§4" />. The first digit of the code gives its
                                    class: 1xx informational, 2xx success, 3xx redirection, 4xx client error,
                                    5xx server error <C ids={['rfc9110']} at="§15" />. A server may send
                                    interim 1xx responses before the final one{' '}
                                    <C ids={['rfc9110']} at="§15.2" />. A blank line ends the header fields,
                                    and the body follows <C ids={['mdn-messages']} />.
                                </p>

                                <h3 id="stateless">Stateless, and where state goes instead</h3>
                                <p>
                                    HTTP is stateless: each request can be understood on its own, and a server
                                    must not assume that two requests on one connection come from the same
                                    user agent. That lets intermediaries reuse connections and spread requests
                                    across many servers <C ids={['rfc9110']} at="§3.3" />. (Simplified: the
                                    same section allows the assumption on a connection that is secured and
                                    specific to one agent.)
                                </p>
                                <p>
                                    To remember you anyway, a server sends a <code>Set-Cookie</code> header
                                    field in a response; the browser stores it and sends it back in a{' '}
                                    <code>Cookie</code> header field with later requests to that server{' '}
                                    <C ids={['rfc6265']} at="§3" /> <C ids={['mdn-cookies']} />. Each request
                                    carries the context the server needs.
                                </p>

                                <h3 id="no-response">When no response comes</h3>
                                <p>
                                    Clients do not wait forever: a client may abandon a request when no
                                    response comes in what it judges a reasonable time, and either side may
                                    close a connection at any time <C ids={['rfc9110']} at="§7.5" />{' '}
                                    <C ids={['rfc9112']} at="§9.5" />. Then the client does not know whether
                                    the server received the request, or acted on it (derived). Keep the two
                                    apart: &ldquo;the client got no response&rdquo; is what the client
                                    observes; &ldquo;the server did not process the request&rdquo; is only one
                                    of the things that may have happened.
                                </p>

                                <h3 id="retrying">Sending the same request again</h3>
                                <p>
                                    A request with an idempotent method can be repeated automatically after a
                                    failure before the response is read: repeating it has the same intended
                                    effect even if the first one succeeded. A client should not automatically
                                    repeat a non-idempotent request such as <code>POST</code> unless it knows
                                    repeating is safe for that resource, or can tell that the original was
                                    never applied <C ids={['rfc9110']} at="§9.2.2" />{' '}
                                    <C ids={['rfc9112']} at="§9.3.1" />.
                                </p>
                                <p>
                                    Two qualifications. &ldquo;Idempotent&rdquo; is about the intended effect
                                    of <em>identical</em> requests, and holds only if the server really
                                    implements the method as specified: a <code>PUT</code> that sets quantity
                                    2 is safe to repeat, but another client may change the order in between{' '}
                                    <C ids={['rfc9110']} at="§9.3.4" />, and your repeated <code>PUT</code>{' '}
                                    then undoes their change (derived). And a server is still free to log each
                                    copy, or have other side effects <C ids={['rfc9110']} at="§9.2.2" />.
                                </p>
                            </details>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="lab">Try a fault</h2>
                                <p>
                                    Choose the method, what goes wrong, and whether the client sends the same
                                    request once more. Predict first, then run. The packet uses the same
                                    model.
                                </p>
                            </div>
                            <ExchangeStepper pane="lab" />
                            <details className="ln-more">
                                <summary>Keys, other shapes, and the worked numbers</summary>
                                <h2 id="keys">Making a repeated POST safe: idempotency keys</h2>
                                <p>
                                    The client puts a unique value, such as a random UUID, in an{' '}
                                    <code>Idempotency-Key</code> header field, and sends the same value again
                                    with every retry of that request, so the server can recognise the retries{' '}
                                    <C ids={['idempotency-key-draft']} at="§2, §2.2" />. A server that
                                    supports it processes the first request with a new key normally. A later
                                    copy with a key it has already finished gets a response consistent with
                                    the original, and no second order. A copy that arrives while the original
                                    is still being processed gets <code>409 Conflict</code>, and the client
                                    tries again later <C ids={['idempotency-key-draft']} at="§2.6, §2.7" />{' '}
                                    <C ids={['rfc9110']} at="§15.5.10" />.
                                </p>
                                <p>
                                    This works only when the server implements it correctly, and the field is
                                    still an IETF draft, not a finished standard: a client cannot assume a
                                    server honours it unless the server documents that it does{' '}
                                    <C ids={['idempotency-key-draft']} at="§2.5.1" />. Key expiry, payload
                                    checks and storage come in the idempotency chapter.
                                </p>
                                <p>
                                    <strong>Three layers, kept apart.</strong> <em>HTTP semantics</em> say
                                    what a method means (<code>PUT</code> is idempotent, <code>POST</code> is
                                    not). <em>Application behaviour</em> is what a particular server does
                                    (whether its <code>PUT</code> really replaces state, whether it honours
                                    keys). <em>Infrastructure</em> is what happens on the way: lost messages,
                                    timeouts, closed connections, proxies. A retry is safe only when all three
                                    line up (derived from the sections above).
                                </p>

                                <h2 id="alternatives">Other ways for programs to work together</h2>
                                <p>
                                    These are design judgements derived from the mechanism above; their costs
                                    are measured in the chapters named.
                                </p>
                                <ul>
                                    <li>
                                        <strong>Request–response</strong> (this chapter): simple, and the
                                        client controls when things happen. But the server cannot tell the
                                        client anything until asked, and every &ldquo;no response&rdquo;
                                        leaves the client unsure.
                                    </li>
                                    <li>
                                        <strong>Server push over an open connection</strong> (server-sent
                                        events, WebSockets): news arrives without asking{' '}
                                        <C ids={['mdn-sse', 'mdn-websockets']} />, but every waiting client
                                        holds a connection the server must keep open.
                                    </li>
                                    <li>
                                        <strong>Hand-off through a queue:</strong> the client doesn&rsquo;t
                                        wait for slow work, but there are more parts to run, and it must ask
                                        for the result later or be told.
                                    </li>
                                    <li>
                                        <strong>Both roles in one program:</strong> needed whenever a server
                                        depends on another service <C ids={['rfc9110']} at="§3.3" />; each
                                        extra hop is one more place a response can go missing.
                                    </li>
                                </ul>
                                <p>
                                    <strong>Choose request–response</strong> when the client needs the answer
                                    before it can go on, and the server can give it within a time the client
                                    is willing to wait. Use push when the server has news the client
                                    didn&rsquo;t ask for, and hand-off when the work takes longer than any
                                    reasonable wait. For most pages and API calls you don&rsquo;t need
                                    anything more yet.
                                </p>

                                <h2 id="worked">Worked example</h2>
                                <div className="ln-assume">
                                    <p className="ln-label">
                                        Assumed values for this example only, not measurements
                                    </p>
                                    <p>
                                        The app gives up after 5 s without a response; on a slow day the
                                        shop&rsquo;s server needs 7 s to place an order. The host name{' '}
                                        <code>shop.example</code> is made up.
                                    </p>
                                </div>
                                <p>
                                    <strong>Step 1: the exchange that works.</strong> The app sends:
                                </p>
                                <pre>
                                    <code>{`POST /orders HTTP/1.1
Host: shop.example
Content-Type: application/json
Content-Length: 23

{"item":"lamp","qty":1}`}</code>
                                </pre>
                                <p>
                                    <code>POST /orders HTTP/1.1</code> is the request line{' '}
                                    <C ids={['rfc9112']} at="§3" />. <code>Host</code> is required in HTTP/1.1{' '}
                                    <C ids={['rfc9112']} at="§3.2" />; <code>Content-Type</code> gives the
                                    body&rsquo;s media type <C ids={['rfc9110']} at="§8.3" />;{' '}
                                    <code>Content-Length</code> its size in bytes (23 here){' '}
                                    <C ids={['rfc9110']} at="§8.6" />. The server places order 42 and answers:
                                </p>
                                <pre>
                                    <code>{`HTTP/1.1 201 Created
Location: /orders/42
Content-Type: application/json
Content-Length: 27

{"id":42,"status":"placed"}`}</code>
                                </pre>
                                <p>
                                    <code>201 Created</code>: the request succeeded and created a resource,
                                    named by <code>Location</code>{' '}
                                    <C ids={['rfc9110']} at="§15.3.2, §9.3.3" />.
                                </p>
                                <p>
                                    <strong>Step 2: the same order on a slow day.</strong> Suppose instead
                                    that step 1&rsquo;s request arrives on a slow day, and the server starts
                                    placing order 42. At 5 s the app gives up and shows &ldquo;Network
                                    error&rdquo; <C ids={['rfc9110']} at="§7.5" />. At 7 s the server
                                    finishes: order 42 exists, but its response reaches a client that has
                                    stopped waiting. (Whether the server notices that the client left depends
                                    on the server; that is the timeouts chapter.)
                                </p>
                                <p>
                                    <strong>Step 3: pressing again.</strong> The app sends the same{' '}
                                    <code>POST</code> again and gets <code>201 Created</code> with{' '}
                                    <code>Location: /orders/43</code>. Two lamps are now on order:{' '}
                                    <code>POST</code> is not idempotent, so repeating it repeated its effect{' '}
                                    <C ids={['rfc9110']} at="§9.2.2" />.
                                </p>
                                <p>
                                    <strong>Your turn:</strong> the next day the app sends{' '}
                                    <code>PUT /orders/42</code> with a body setting the quantity to 2, gets no
                                    response, and sends the same request again. How many new orders does that
                                    create, and what is order 42&rsquo;s quantity afterwards?
                                </p>
                                <details className="ln-q">
                                    <summary>Check your answer</summary>
                                    <p>
                                        No new orders, and quantity 2: <code>PUT</code> is idempotent, so two
                                        identical requests have the same intended effect as one{' '}
                                        <C ids={['rfc9110']} at="§9.2.2" />, assuming nobody else changed the
                                        order in between.
                                    </p>
                                </details>
                                <p className="ln-label">What this example simplifies</p>
                                <ul>
                                    <li>
                                        Here a person presses the button again. Clients can also repeat
                                        requests automatically, which is why the standard&rsquo;s rule is
                                        written for clients <C ids={['rfc9110']} at="§9.2.2" />.
                                    </li>
                                    <li>The server does each request completely or not at all.</li>
                                    <li>
                                        The fix for step 3 is the idempotency key above; its details are a
                                        later chapter.
                                    </li>
                                </ul>
                            </details>
                        </>
                    }
                    quiz={<ClientServerQuiz />}
                />

                <div className="ln-prose">
                    <h2 id="goals">By the end you can</h2>
                    <ol>
                        <li>
                            Say which program is the client and which is the server in an exchange, including
                            a program that is a server on one connection and a client on another.
                        </li>
                        <li>
                            Name the parts of an HTTP request (method, target, header fields, body) and of a
                            response (status code, header fields, body) from its raw text.
                        </li>
                        <li>
                            Explain what a client can and cannot know when no response arrives, say which
                            requests are safe to send again (and under which assumptions), and describe how an
                            idempotency key lets a server recognise a repeated <code>POST</code>.
                        </li>
                        <li>
                            Explain what &ldquo;HTTP is stateless&rdquo; means and how a site still remembers
                            you.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter, with the same numbers as the marks above, are on the{' '}
                        <Link href="/learn/sources#client-server">sources page</Link>.
                    </p>
                </div>
                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 3, <Link href="/learn/ip-and-ports">Addresses, packets and ports</Link>.
                        Previous: <Link href="/learn/web-request">chapter 1</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
