import React from 'react';

import { citeFor } from '@/components/learn/Cite';
import Q from '@/components/learn/kit/Question';
import {
    CLIENT_SERVER_SOURCE_NUMBER as SOURCE_NUMBER,
    CLIENT_SERVER_SOURCES as SOURCES,
} from '@/content/learn/client-server-sources';

const C = citeFor('client-server', SOURCES, SOURCE_NUMBER);

/** Quiz only. The exchange itself stays on the Learn and Lab tabs. */
export default function ClientServerQuiz(): React.JSX.Element {
    return (
        <div className="ln-prose">
            <p>Answer before you open the explanation. The explanation names the wrong guess.</p>
            <Q
                n={1}
                ask="A web server receives your request, then asks a database server for your order before answering you. On each of the two connections, which program is the client?"
            >
                <p>
                    On the first, your app is the client and the web server the server. On the second, the web
                    server is the client and the database server the server <C ids={['rfc9110']} at="§3.3" />{' '}
                    <C ids={['pg-architecture']} />. &ldquo;The web server is always the server&rdquo; is
                    wrong: the roles belong to a connection, not to a program.
                </p>
            </Q>
            <Q
                n={2}
                ask={
                    <>
                        A request begins <code>PUT /orders/42 HTTP/1.1</code>, then{' '}
                        <code>Host: shop.example</code>, a blank line and <code>{'{"qty":2}'}</code>. Name
                        each part. What does the first line of the response start with?
                    </>
                }
            >
                <p>
                    Method <code>PUT</code>, target <code>/orders/42</code>, version <code>HTTP/1.1</code>;{' '}
                    <code>Host</code> is a header field; <code>{'{"qty":2}'}</code> is the body. The response
                    starts with a status line: the version, then a three-digit status code{' '}
                    <C ids={['rfc9112']} at="§3, §4" />. &ldquo;The response starts with the body&rdquo; is
                    wrong: the status line and header fields come first.
                </p>
            </Q>
            <Q
                n={3}
                ask="You add a lamp to your basket and the next page still shows it. HTTP is stateless. How does the server know it is your basket?"
            >
                <p>
                    Each request carries something that identifies you, typically a cookie the server set
                    earlier with <code>Set-Cookie</code> and the browser sends back in <code>Cookie</code>{' '}
                    <C ids={['rfc6265']} at="§3" />. &ldquo;Because I&rsquo;m still on the same
                    connection&rdquo; is wrong: a server must not assume that, and connections can be closed
                    and reopened at any time <C ids={['rfc9110']} at="§3.3" />{' '}
                    <C ids={['rfc9112']} at="§9.5" />.
                </p>
            </Q>
            <Q
                n={4}
                ask="The app sent POST /orders and saw no response before its timeout. What does it know about the order?"
            >
                <p>
                    Nothing. The request may have been lost (no order), or the order may have been placed and
                    the response lost or late <C ids={['rfc9110']} at="§7.5" />. &ldquo;No order was
                    placed&rdquo; is only one of three cases; &ldquo;the order was placed because the request
                    was sent&rdquo; confuses sending with arriving.
                </p>
            </Q>
            <Q
                n={5}
                ask="A connection fails before the client could read any response. Which of these can it send again automatically: GET, PUT, DELETE, POST?"
            >
                <p>
                    <code>GET</code>, <code>PUT</code> and <code>DELETE</code>: they are idempotent. Not{' '}
                    <code>POST</code>, unless the client knows repeating is safe for that resource{' '}
                    <C ids={['rfc9110']} at="§9.2.2" />. &ldquo;Only GET, because it changes nothing&rdquo; is
                    wrong: <code>PUT</code> and <code>DELETE</code> change things but are still idempotent
                    (deleting twice leaves the resource deleted, though the second response may differ).
                    Caveat: this describes what the methods mean; it holds only if the server implements them
                    as specified, and another client may change the resource in between{' '}
                    <C ids={['rfc9110']} at="§9.3.4" />, so a repeated <code>PUT</code> can overwrite their
                    change (derived).
                </p>
            </Q>
            <h2 id="exercise">Exercise</h2>
            <p>
                A payment screen sends <code>POST /payments</code> with the amount. Users on a train often see
                &ldquo;Network error&rdquo; and press &ldquo;Pay&rdquo; again. List what may have happened on
                the server each time, and what goes wrong if the app just repeats the request. Then say what
                the app could do instead: first without new technology (hint: which method could find out what
                happened?), then with one new header field. Try the cases in the Interactive Lab with{' '}
                <code>POST</code> and with <code>POST</code> plus a key.
            </p>
            <details className="ln-q">
                <summary>Show the worked answer</summary>
                <ul>
                    <li>
                        Three possible causes each time: request lost (no payment), response lost (payment
                        made), response late (payment made, or about to be). Repeating the <code>POST</code>{' '}
                        can pay twice in the last two <C ids={['rfc9110']} at="§7.5, §9.2.2" />.
                    </li>
                    <li>
                        Asking first, with a <code>GET</code> for recent payments, helps but is not enough: in
                        the late case the first payment may not be recorded yet, so the app pays twice anyway.
                    </li>
                    <li>
                        What works: create one idempotency key when the user first presses &ldquo;Pay&rdquo;
                        and send it with every retry. If the server honours keys, a retry after a lost
                        response gets the original result instead of a second payment, and a retry while the
                        first is still running gets <code>409 Conflict</code>, so the app waits and asks again{' '}
                        <C ids={['idempotency-key-draft']} at="§2.6, §2.7" />.
                    </li>
                </ul>
            </details>
            <h2 id="own-words">In your own words, and elsewhere</h2>
            <ul>
                <li>
                    Explain to a friend why &ldquo;Network error&rdquo; after &ldquo;Place order&rdquo; does
                    not mean the order failed, and what the app could do instead of pressing again blindly.
                </li>
                <li>
                    The same roles and the same &ldquo;no response&rdquo; problem appear wherever one program
                    asks another: a web server asking a database for a row <C ids={['pg-architecture']} />,
                    one service calling another, your computer asking a name server for an address. Pick one:
                    which program is the client, and what does it know when its request times out?
                </li>
            </ul>
        </div>
    );
}
