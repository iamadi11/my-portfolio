import React from 'react';

import { citeFor } from '@/components/learn/Cite';
import Q from '@/components/learn/kit/Question';
import { SOURCE_NUMBER, SOURCES } from '@/content/learn/web-request-sources';

const C = citeFor('web-request', SOURCES, SOURCE_NUMBER);

/** Quiz only. Answers stay behind the disclosure until the learner opens them. */
export default function WebRequestQuiz(): React.JSX.Element {
    return (
        <div className="ln-prose">
            <p>Answer before you open the explanation. The explanation names the wrong guess.</p>
            <Q
                n={1}
                ask="Put these in order for a first HTTPS visit: TLS handshake, DNS lookup, HTTP request, TCP handshake."
            >
                <p>
                    DNS lookup, TCP handshake, TLS handshake, HTTP request. TLS runs on top of a reliable
                    connection <C ids={['rfc9846']} at="§1" />, so the connection must exist first; on HTTPS
                    the request travels inside the secured connection; and nothing can connect before DNS
                    gives an address. Revisit the Learn tab, steps 2–5.
                </p>
            </Q>
            <Q
                n={2}
                ask="Which can a repeat visit skip? (a) DNS lookup (b) TCP handshake (c) parsing the HTML (d) the request itself"
            >
                <p>
                    (a) if the hostname is cached, or if the connection is reused; (b) if the connection is
                    still open and reused; (d) only if the browser holds a fresh cached response. Not (c): the
                    browser parses whatever HTML it shows, even a cached copy.
                </p>
            </Q>
            <Q
                n={3}
                ask="The page loads its fonts from a second hostname. Which extra steps can that cost on a first visit?"
            >
                <p>
                    A second hostname can require its own DNS lookup and a new TCP/TLS connection. This
                    chapter’s first-visit model assumes a separate connection. Connection reuse depends on
                    protocol and authority: HTTP/2 can share one connection across hostnames when the server
                    is authoritative for them and the certificate is valid for the requested host{' '}
                    <C ids={['rfc9113']} at="§9.1.1" />. A second hostname therefore does not always mean
                    another handshake.
                </p>
            </Q>
            <Q
                n={4}
                ask="You double your bandwidth, and a small page’s first-visit time to first byte barely changes. Why?"
            >
                <p>
                    Most of that time is messages travelling there and back (the lookup, two handshakes, the
                    request), and bandwidth does not shorten travel. &ldquo;The server is slow&rdquo; is wrong
                    as the explanation: a slow server is slow at any bandwidth, so it cannot explain why
                    doubling bandwidth changed nothing. To see how much is server, compare{' '}
                    <code>responseStart − requestStart</code> (one round trip plus the server&rsquo;s work)
                    with a handshake&rsquo;s round trip, such as{' '}
                    <code>secureConnectionStart − connectStart</code>; what is left over is roughly the
                    server.
                </p>
            </Q>
            <Q
                n={5}
                ask={
                    <>
                        A page&rsquo;s timing entry shows these times in ms from the start (assumed values):
                        lookup 2–32, connect start 32, secure connection start 72, connect end 112, request
                        start 113, response start 263. Which step took longest, and what would you look at
                        next?
                    </>
                }
            >
                <p>
                    Waiting for the response: 263 − 113 = 150 ms. DNS took 30 ms, TCP 72 − 32 = 40 ms and TLS
                    112 − 72 = 40 ms. The handshakes each show one round trip of about 40 ms, so roughly 110
                    ms of the 150 is the server&rsquo;s own work: look at the server, not the network. Reading
                    TCP as <code>connectEnd − connectStart</code> = 80 ms is wrong on HTTPS, because that
                    interval includes TLS.
                </p>
            </Q>
            <h2 id="exercise">Exercise</h2>
            <p>
                Use the model&rsquo;s assumed values, but with a 120 ms round trip, as for a user far from the
                server. Compute the first-visit time to first byte and its network share. Then decide which
                helps more: halving the server processing time, or serving from a place with a 30 ms round
                trip. Then check in the Explore: choose First visit, set the round trip to 120 ms and read the
                total and network share. Set the server time to 25 ms (the halved case) and read the total;
                put it back to 50 ms, set the round trip to 30 ms, and compare.
            </p>
            <details className="ln-q">
                <summary>Show the worked answer</summary>
                <p>
                    First visit: 30 + 120 + 120 + 120 + 50 = 440 ms, of which 390 ms (88.6%) is network.
                    Halving the server time saves 25 ms. Moving closer gives 30 + 30 + 30 + 30 + 50 = 170 ms,
                    saving 270 ms, so moving closer wins. Measure which part dominates before choosing a fix.
                </p>
            </details>
            <h2 id="own-words">In your own words, and elsewhere</h2>
            <ul>
                <li>
                    Explain to a friend why opening a website a second time is faster, using the words
                    &ldquo;round trip&rdquo;, &ldquo;cache&rdquo; and &ldquo;connection&rdquo;.
                </li>
                <li>
                    A mobile app calls an API on a server it has never contacted. Which of the six steps still
                    happen? Which can it avoid on its second call?
                </li>
            </ul>
        </div>
    );
}
