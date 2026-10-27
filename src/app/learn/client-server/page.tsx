import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import Cite from '@/components/learn/Cite';
import ExchangeStepper from '@/components/learn/client-server/ExchangeStepper';
import CourseShell from '@/components/learn/CourseShell';
import {
    CLIENT_SERVER_SOURCE_NUMBER as SOURCE_NUMBER,
    CLIENT_SERVER_SOURCES as SOURCES,
} from '@/content/learn/client-server-sources';

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
        <CourseShell crumbs={[{ label: 'Chapter 2' }]}>
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

                    <h2 id="parts">Parts you&rsquo;ll meet</h2>
                    <p>
                        Terms from <Link href="/learn/web-request">chapter 1</Link> (connection, request and
                        response, status code, user agent) keep their meaning. New or sharpened here:
                    </p>
                    <dl>
                        <div>
                            <dt>Client and server</dt>
                            <dd>
                                The client is the program that opens a connection to send requests; the server
                                is the program that accepts connections and answers them with responses. They
                                are roles on one connection, not kinds of computer.{' '}
                                <C ids={['rfc9110']} at="§3.3" />
                            </dd>
                        </div>
                        <div>
                            <dt>Origin server and intermediary</dt>
                            <dd>
                                The origin server can give the authoritative response for a resource: what
                                people usually mean by &ldquo;the website&rsquo;s server&rdquo;. An
                                intermediary, such as a proxy, sits between client and origin server and
                                passes messages on; on each connection it is still a client or a server.{' '}
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
                                The method says what the client wants done, such as <code>GET</code> (fetch)
                                or <code>POST</code> (process this data). The target is the resource it is
                                about, written as a path such as <code>/orders/42</code>.{' '}
                                <C ids={['rfc9110']} at="§9.1, §7.1" />
                            </dd>
                        </div>
                        <div>
                            <dt>Header field and body</dt>
                            <dd>
                                A header field is a <code>Name: value</code> line carrying extra information
                                about the message, such as <code>Host</code>. The body is the data after the
                                header fields, such as form data or a page (the standard calls it
                                &ldquo;content&rdquo;). <C ids={['rfc9110']} at="§6.3, §6.4" />{' '}
                                <C ids={['mdn-messages']} />
                            </dd>
                        </div>
                        <div>
                            <dt>Stateless</dt>
                            <dd>
                                Each request can be understood on its own, without knowing which requests came
                                before it on the connection. <C ids={['rfc9110']} at="§3.3" />
                            </dd>
                        </div>
                        <div>
                            <dt>Cookie</dt>
                            <dd>
                                A small name=value item a server asks the browser to store (with{' '}
                                <code>Set-Cookie</code>) and the browser sends back with later requests (in{' '}
                                <code>Cookie</code>). <C ids={['rfc6265']} at="§3" />{' '}
                                <C ids={['mdn-cookies']} />
                            </dd>
                        </div>
                        <div>
                            <dt>Timeout</dt>
                            <dd>
                                How long a client waits for a response before giving up. HTTP sets no fixed
                                time: clients may abandon a request when a response takes too long.{' '}
                                <C ids={['rfc9110']} at="§7.5" />
                            </dd>
                        </div>
                        <div>
                            <dt>Safe and idempotent methods</dt>
                            <dd>
                                A safe method is read-only in meaning (<code>GET</code>, <code>HEAD</code>,{' '}
                                <code>OPTIONS</code>, <code>TRACE</code>). An idempotent method is one where
                                sending the same request several times has the same <em>intended</em> effect
                                as sending it once: <code>PUT</code>, <code>DELETE</code> and the safe
                                methods. <C ids={['rfc9110']} at="§9.2.1, §9.2.2" />
                            </dd>
                        </div>
                    </dl>

                    <h2 id="problem">The problem</h2>
                    <p>
                        You press &ldquo;Place order&rdquo; in a shop&rsquo;s app. The spinner turns, then:
                        &ldquo;Network error&rdquo;. Did you buy the lamp? Should you press again? To answer,
                        you need to know who said what to whom, and what each side can know.
                    </p>
                    <p>
                        This matters well beyond shops. Browsers ask web servers, web servers ask databases,
                        services ask other services. Get the roles or the failure cases wrong and you get real
                        bugs: a payment taken twice, or an order lost because nobody tried again. The HTTP
                        standard itself warns clients not to repeat some requests automatically for this
                        reason. <C ids={['rfc9110']} at="§9.2.2" />
                    </p>

                    <h2 id="first-guess">A first guess, and where it breaks</h2>
                    <p>
                        A natural first picture: &ldquo;My phone is the client and the shop&rsquo;s big
                        computer is the server. The client asks, the server answers. An error means nothing
                        happened, so I press again.&rdquo;
                    </p>
                    <p>
                        Most of the time it works: both messages arrive, and the app sends a request and gets
                        a response <C ids={['rfc9110']} at="§3.4" />. Pressing again to reload a page is
                        harmless, because <code>GET</code> asks for no change{' '}
                        <C ids={['rfc9110']} at="§9.2.1, §9.2.2" />. It breaks in two places.
                    </p>
                    <ul>
                        <li>
                            <strong>Roles.</strong> To answer you, the shop&rsquo;s web server sends its own
                            request to a database server. On that connection the web server is the client.
                            &ldquo;Client = small device, server = big computer&rdquo; cannot say what the web
                            server is. <C ids={['rfc9110']} at="§3.3" /> <C ids={['pg-architecture']} />
                        </li>
                        <li>
                            <strong>No response.</strong> &ldquo;Network error&rdquo; after &ldquo;Place
                            order&rdquo; has three possible causes, and the app cannot tell them apart: the
                            request was lost (no order); the order was placed but the response was lost; or
                            the shop was slow and the app stopped waiting. In the last two, pressing again
                            places a second order. <C ids={['rfc9110']} at="§7.5, §9.2.2" /> (The three causes
                            are derived: an exchange is two messages, and either can fail to arrive in time.
                            They assume the server does a request completely or not at all; a server that
                            fails halfway is a later chapter.)
                        </li>
                    </ul>

                    <h2 id="observe">Look at what actually travels</h2>
                    <p>
                        In HTTP/1.1 the messages are plain text, so you can read an exchange line by line{' '}
                        <C ids={['mdn-http-overview']} /> <C ids={['rfc9112']} at="§3, §4" />. RFC 9110 shows
                        one <C ids={['rfc9110']} at="§3.9" />; its request and response begin:
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
                            <strong>Everything the server learns about you is in the request.</strong> The
                            first line names the method, the target and the HTTP version; the header fields
                            add the rest. <C ids={['rfc9112']} at="§3" /> <C ids={['rfc9110']} at="§3.4" />
                        </li>
                        <li>
                            <strong>Everything the client learns is in the response, if it arrives.</strong> A
                            client that receives nothing has learned nothing about what the server did
                            (derived: the exchange has only these two messages).
                        </li>
                    </ul>

                    <h2 id="mechanism">How it really works</h2>
                    <h3 id="roles">Roles, and who starts</h3>
                    <p>
                        A client opens a connection to send requests; a server accepts connections and answers
                        them. The same program can be a client on some connections and a server on others{' '}
                        <C ids={['rfc9110']} at="§3.3" />. The same idea holds outside HTTP: a database
                        server, for example, accepts connections from client applications, and a web server
                        that reads the database is one of those clients <C ids={['pg-architecture']} />.
                    </p>
                    <p>
                        The client starts every exchange, and the server answers requests{' '}
                        <C ids={['rfc9110']} at="§3.4" />; the server does not start one of its own{' '}
                        <C ids={['mdn-http-overview']} />. Ways for a server to send news without being asked
                        each time exist, as extra mechanisms on top <C ids={['mdn-sse', 'mdn-websockets']} />{' '}
                        (chapter &ldquo;Pushing to clients&rdquo;, later).
                    </p>
                    <Q
                        n={1}
                        ask="A web server receives your request, then asks a database server for your order before answering you. On each of the two connections, which program is the client?"
                    >
                        <p>
                            On the first, your app is the client and the web server the server. On the second,
                            the web server is the client and the database server the server{' '}
                            <C ids={['rfc9110']} at="§3.3" /> <C ids={['pg-architecture']} />. &ldquo;The web
                            server is always the server&rdquo; is wrong: the roles belong to a connection, not
                            to a program. Revisit <a href="#roles">roles</a>.
                        </p>
                    </Q>

                    <h3 id="messages">What a request and a response contain</h3>
                    <p>
                        A request has a method and a target, and can carry header fields and a body{' '}
                        <C ids={['rfc9110']} at="§3.4" />. In HTTP/1.1 it starts with a request line,{' '}
                        <code>method target version</code>, such as <code>POST /orders HTTP/1.1</code>, and
                        must include a <code>Host</code> header field <C ids={['rfc9112']} at="§3, §3.2" />.
                    </p>
                    <p>
                        A response has a status code, and can carry header fields and a body{' '}
                        <C ids={['rfc9110']} at="§3.4" />. In HTTP/1.1 it starts with a status line, such as{' '}
                        <code>HTTP/1.1 201 Created</code> <C ids={['rfc9112']} at="§4" />. The first digit of
                        the code gives its class: 1xx informational, 2xx success, 3xx redirection, 4xx client
                        error, 5xx server error <C ids={['rfc9110']} at="§15" />. A server may send interim
                        1xx responses before the final one <C ids={['rfc9110']} at="§15.2" />. A blank line
                        ends the header fields, and the body follows <C ids={['mdn-messages']} />.
                    </p>
                    <Q
                        n={2}
                        ask={
                            <>
                                A request begins <code>PUT /orders/42 HTTP/1.1</code>, then{' '}
                                <code>Host: shop.example</code>, a blank line and <code>{'{"qty":2}'}</code>.
                                Name each part. What does the first line of the response start with?
                            </>
                        }
                    >
                        <p>
                            Method <code>PUT</code>, target <code>/orders/42</code>, version{' '}
                            <code>HTTP/1.1</code>; <code>Host</code> is a header field;{' '}
                            <code>{'{"qty":2}'}</code> is the body. The response starts with a status line:
                            the version, then a three-digit status code <C ids={['rfc9112']} at="§3, §4" />.
                            &ldquo;The response starts with the body&rdquo; is wrong: the status line and
                            header fields come first. Revisit <a href="#messages">what a request contains</a>.
                        </p>
                    </Q>

                    <h3 id="stateless">Stateless, and where state goes instead</h3>
                    <p>
                        HTTP is stateless: each request can be understood on its own, and a server must not
                        assume that two requests on one connection come from the same user agent. That lets
                        intermediaries reuse connections and spread requests across many servers{' '}
                        <C ids={['rfc9110']} at="§3.3" />. (Simplified: the same section allows the assumption
                        on a connection that is secured and specific to one agent.)
                    </p>
                    <p>
                        To remember you anyway, a server sends a <code>Set-Cookie</code> header field in a
                        response; the browser stores it and sends it back in a <code>Cookie</code> header
                        field with later requests to that server <C ids={['rfc6265']} at="§3" />{' '}
                        <C ids={['mdn-cookies']} />. Each request carries the context the server needs.
                    </p>
                    <Q
                        n={3}
                        ask="You add a lamp to your basket and the next page still shows it. HTTP is stateless. How does the server know it is your basket?"
                    >
                        <p>
                            Each request carries something that identifies you, typically a cookie the server
                            set earlier with <code>Set-Cookie</code> and the browser sends back in{' '}
                            <code>Cookie</code> <C ids={['rfc6265']} at="§3" />. &ldquo;Because I&rsquo;m
                            still on the same connection&rdquo; is wrong: a server must not assume that, and
                            connections can be closed and reopened at any time{' '}
                            <C ids={['rfc9110']} at="§3.3" /> <C ids={['rfc9112']} at="§9.5" />. Revisit{' '}
                            <a href="#stateless">stateless</a>.
                        </p>
                    </Q>

                    <h3 id="no-response">When no response comes</h3>
                    <p>
                        Clients do not wait forever: a client may abandon a request when no response comes in
                        what it judges a reasonable time, and either side may close a connection at any time{' '}
                        <C ids={['rfc9110']} at="§7.5" /> <C ids={['rfc9112']} at="§9.5" />. Then the client
                        does not know whether the server received the request, or acted on it (derived). Keep
                        the two apart: &ldquo;the client got no response&rdquo; is what the client observes;
                        &ldquo;the server did not process the request&rdquo; is only one of the things that
                        may have happened.
                    </p>
                    <Q
                        n={4}
                        ask="The app sent POST /orders and saw no response before its timeout. What does it know about the order?"
                    >
                        <p>
                            Nothing. The request may have been lost (no order), or the order may have been
                            placed and the response lost or late <C ids={['rfc9110']} at="§7.5" />. &ldquo;No
                            order was placed&rdquo; is only one of three cases; &ldquo;the order was placed
                            because the request was sent&rdquo; confuses sending with arriving. Revisit{' '}
                            <a href="#no-response">when no response comes</a>.
                        </p>
                    </Q>

                    <h3 id="retrying">Sending the same request again</h3>
                    <p>
                        A request with an idempotent method can be repeated automatically after a failure
                        before the response is read: repeating it has the same intended effect even if the
                        first one succeeded. A client should not automatically repeat a non-idempotent request
                        such as <code>POST</code> unless it knows repeating is safe for that resource, or can
                        tell that the original was never applied <C ids={['rfc9110']} at="§9.2.2" />{' '}
                        <C ids={['rfc9112']} at="§9.3.1" />.
                    </p>
                    <p>
                        Two qualifications. &ldquo;Idempotent&rdquo; is about the intended effect of{' '}
                        <em>identical</em> requests, and holds only if the server really implements the method
                        as specified: a <code>PUT</code> that sets quantity 2 is safe to repeat, but another
                        client may change the order in between <C ids={['rfc9110']} at="§9.3.4" />, and your
                        repeated <code>PUT</code> then undoes their change (derived). And a server is still
                        free to log each copy, or have other side effects <C ids={['rfc9110']} at="§9.2.2" />.
                    </p>
                    <Q
                        n={5}
                        ask="A connection fails before the client could read any response. Which of these can it send again automatically: GET, PUT, DELETE, POST?"
                    >
                        <p>
                            <code>GET</code>, <code>PUT</code> and <code>DELETE</code>: they are idempotent.
                            Not <code>POST</code>, unless the client knows repeating is safe for that resource{' '}
                            <C ids={['rfc9110']} at="§9.2.2" />. &ldquo;Only GET, because it changes
                            nothing&rdquo; is wrong: <code>PUT</code> and <code>DELETE</code> change things
                            but are still idempotent (deleting twice leaves the resource deleted, though the
                            second response may differ). Caveat: this describes what the methods mean; it
                            holds only if the server implements them as specified, and another client may
                            change the resource in between <C ids={['rfc9110']} at="§9.3.4" />, so a repeated{' '}
                            <code>PUT</code> can overwrite their change (derived). Revisit{' '}
                            <a href="#retrying">sending the same request again</a>.
                        </p>
                    </Q>

                    <h2 id="figure">Try it</h2>
                    <p>
                        In Fig. 1 you choose a request, what goes wrong on the way, and whether the client
                        sends the same request once more. Predict first; then run the case and step through
                        what each side sees, how many times the request reached the server, and how many
                        orders exist afterwards.
                    </p>
                </div>

                <ExchangeStepper />

                <div className="ln-prose">
                    <h2 id="keys">Making a repeated POST safe: idempotency keys</h2>
                    <p>
                        The client puts a unique value, such as a random UUID, in an{' '}
                        <code>Idempotency-Key</code> header field, and sends the same value again with every
                        retry of that request, so the server can recognise the retries{' '}
                        <C ids={['idempotency-key-draft']} at="§2, §2.2" />. A server that supports it
                        processes the first request with a new key normally. A later copy with a key it has
                        already finished gets a response consistent with the original, and no second order. A
                        copy that arrives while the original is still being processed gets{' '}
                        <code>409 Conflict</code>, and the client tries again later{' '}
                        <C ids={['idempotency-key-draft']} at="§2.6, §2.7" />{' '}
                        <C ids={['rfc9110']} at="§15.5.10" />.
                    </p>
                    <p>
                        This works only when the server implements it correctly, and the field is still an
                        IETF draft, not a finished standard: a client cannot assume a server honours it unless
                        the server documents that it does <C ids={['idempotency-key-draft']} at="§2.5.1" />.
                        Key expiry, payload checks and storage come in the idempotency chapter.
                    </p>
                    <p>
                        <strong>Three layers, kept apart.</strong> <em>HTTP semantics</em> say what a method
                        means (<code>PUT</code> is idempotent, <code>POST</code> is not).{' '}
                        <em>Application behaviour</em> is what a particular server does (whether its{' '}
                        <code>PUT</code> really replaces state, whether it honours keys).{' '}
                        <em>Infrastructure</em> is what happens on the way: lost messages, timeouts, closed
                        connections, proxies. A retry is safe only when all three line up (derived from the
                        sections above).
                    </p>

                    <h2 id="alternatives">Other ways for programs to work together</h2>
                    <p>
                        These are design judgements derived from the mechanism above; their costs are measured
                        in the chapters named.
                    </p>
                    <ul>
                        <li>
                            <strong>Request–response</strong> (this chapter): simple, and the client controls
                            when things happen. But the server cannot tell the client anything until asked,
                            and every &ldquo;no response&rdquo; leaves the client unsure.
                        </li>
                        <li>
                            <strong>Server push over an open connection</strong> (server-sent events,
                            WebSockets): news arrives without asking <C ids={['mdn-sse', 'mdn-websockets']} />
                            , but every waiting client holds a connection the server must keep open.
                        </li>
                        <li>
                            <strong>Hand-off through a queue:</strong> the client doesn&rsquo;t wait for slow
                            work, but there are more parts to run, and it must ask for the result later or be
                            told.
                        </li>
                        <li>
                            <strong>Both roles in one program:</strong> needed whenever a server depends on
                            another service <C ids={['rfc9110']} at="§3.3" />; each extra hop is one more
                            place a response can go missing.
                        </li>
                    </ul>
                    <p>
                        <strong>Choose request–response</strong> when the client needs the answer before it
                        can go on, and the server can give it within a time the client is willing to wait. Use
                        push when the server has news the client didn&rsquo;t ask for, and hand-off when the
                        work takes longer than any reasonable wait. For most pages and API calls you
                        don&rsquo;t need anything more yet.
                    </p>

                    <h2 id="worked">Worked example</h2>
                    <div className="ln-assume">
                        <p className="ln-label">Assumed values for this example only, not measurements</p>
                        <p>
                            The app gives up after 5 s without a response; on a slow day the shop&rsquo;s
                            server needs 7 s to place an order. The host name <code>shop.example</code> is
                            made up.
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
                        <code>POST /orders HTTP/1.1</code> is the request line <C ids={['rfc9112']} at="§3" />
                        . <code>Host</code> is required in HTTP/1.1 <C ids={['rfc9112']} at="§3.2" />;{' '}
                        <code>Content-Type</code> gives the body&rsquo;s media type{' '}
                        <C ids={['rfc9110']} at="§8.3" />; <code>Content-Length</code> its size in bytes (23
                        here) <C ids={['rfc9110']} at="§8.6" />. The server places order 42 and answers:
                    </p>
                    <pre>
                        <code>{`HTTP/1.1 201 Created
Location: /orders/42
Content-Type: application/json
Content-Length: 27

{"id":42,"status":"placed"}`}</code>
                    </pre>
                    <p>
                        <code>201 Created</code>: the request succeeded and created a resource, named by{' '}
                        <code>Location</code> <C ids={['rfc9110']} at="§15.3.2, §9.3.3" />.
                    </p>
                    <p>
                        <strong>Step 2: the same order on a slow day.</strong> Suppose instead that step
                        1&rsquo;s request arrives on a slow day, and the server starts placing order 42. At 5
                        s the app gives up and shows &ldquo;Network error&rdquo;{' '}
                        <C ids={['rfc9110']} at="§7.5" />. At 7 s the server finishes: order 42 exists, but
                        its response reaches a client that has stopped waiting. (Whether the server notices
                        that the client left depends on the server; that is the timeouts chapter.)
                    </p>
                    <p>
                        <strong>Step 3: pressing again.</strong> The app sends the same <code>POST</code>{' '}
                        again and gets <code>201 Created</code> with <code>Location: /orders/43</code>. Two
                        lamps are now on order: <code>POST</code> is not idempotent, so repeating it repeated
                        its effect <C ids={['rfc9110']} at="§9.2.2" />.
                    </p>
                    <p>
                        <strong>Your turn:</strong> the next day the app sends <code>PUT /orders/42</code>{' '}
                        with a body setting the quantity to 2, gets no response, and sends the same request
                        again. How many new orders does that create, and what is order 42&rsquo;s quantity
                        afterwards?
                    </p>
                    <details className="ln-q">
                        <summary>Check your answer</summary>
                        <p>
                            No new orders, and quantity 2: <code>PUT</code> is idempotent, so two identical
                            requests have the same intended effect as one <C ids={['rfc9110']} at="§9.2.2" />,
                            assuming nobody else changed the order in between.
                        </p>
                    </details>
                    <p className="ln-label">What this example simplifies</p>
                    <ul>
                        <li>
                            Here a person presses the button again. Clients can also repeat requests
                            automatically, which is why the standard&rsquo;s rule is written for clients{' '}
                            <C ids={['rfc9110']} at="§9.2.2" />.
                        </li>
                        <li>The server does each request completely or not at all.</li>
                        <li>
                            The fix for step 3 is the idempotency key above; its details are a later chapter.
                        </li>
                    </ul>

                    <h2 id="exercise">Exercise</h2>
                    <p>
                        A payment screen sends <code>POST /payments</code> with the amount. Users on a train
                        often see &ldquo;Network error&rdquo; and press &ldquo;Pay&rdquo; again. List what may
                        have happened on the server each time, and what goes wrong if the app just repeats the
                        request. Then say what the app could do instead: first without new technology (hint:
                        which method could find out what happened?), then with one new header field. Try the
                        cases in Fig. 1 with <code>POST</code> and with <code>POST</code> plus a key.
                    </p>
                    <details className="ln-q">
                        <summary>Show the worked answer</summary>
                        <ul>
                            <li>
                                Three possible causes each time: request lost (no payment), response lost
                                (payment made), response late (payment made, or about to be). Repeating the{' '}
                                <code>POST</code> can pay twice in the last two{' '}
                                <C ids={['rfc9110']} at="§7.5, §9.2.2" />.
                            </li>
                            <li>
                                Asking first, with a <code>GET</code> for recent payments, helps but is not
                                enough: in the late case the first payment may not be recorded yet, so the app
                                pays twice anyway.
                            </li>
                            <li>
                                What works: create one idempotency key when the user first presses
                                &ldquo;Pay&rdquo; and send it with every retry. If the server honours keys, a
                                retry after a lost response gets the original result instead of a second
                                payment, and a retry while the first is still running gets{' '}
                                <code>409 Conflict</code>, so the app waits and asks again{' '}
                                <C ids={['idempotency-key-draft']} at="§2.6, §2.7" />.
                            </li>
                        </ul>
                    </details>

                    <h2 id="own-words">In your own words, and elsewhere</h2>
                    <ul>
                        <li>
                            Explain to a friend why &ldquo;Network error&rdquo; after &ldquo;Place
                            order&rdquo; does not mean the order failed, and what the app could do instead of
                            pressing again blindly.
                        </li>
                        <li>
                            The same roles and the same &ldquo;no response&rdquo; problem appear wherever one
                            program asks another: a web server asking a database for a row{' '}
                            <C ids={['pg-architecture']} />, one service calling another, your computer asking
                            a name server for an address. Pick one: which program is the client, and what does
                            it know when its request times out?
                        </li>
                    </ul>

                    <h2 id="sources">Sources</h2>
                    <p>
                        Each source&rsquo;s cited parts were read; links point to the published versions. RFC
                        9110, RFC 9112 and RFC 6265 were read in the published text as the HTTP Working Group
                        publishes it (httpwg.org/specs); rfc-editor.org was unreachable. The Idempotency-Key
                        field is an IETF Internet-Draft, read in the working group&rsquo;s editor&rsquo;s
                        copy; its section numbers are from that copy. MDN content is by Mozilla contributors
                        under CC-BY-SA 2.5 and is paraphrased here, not copied.
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
                        Chapter 3, <strong>Addresses, packets and ports</strong>, is planned and not written
                        yet. Previous: <Link href="/learn/web-request">chapter 1</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
