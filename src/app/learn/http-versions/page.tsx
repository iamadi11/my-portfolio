import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import LessonFilm from '@/components/learn/film/LessonFilm';
import VersionHold from '@/components/learn/http-versions/VersionHold';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import { LESSON_FILMS } from '@/content/learn/films';
import {
    HTTP_VERSIONS_SOURCE_NUMBER as SOURCE_NUMBER,
    HTTP_VERSIONS_SOURCES as SOURCES,
} from '@/content/learn/http-versions-sources';
import { FLIGHT, LOSS, SEND } from '@/lib/learn/http-versions-model';

/**
 * Chapter 9, http-versions: one lost carrier, three different holds.
 * Learner-facing page for `docs/system-design/chapters/http-versions.md`.
 */

export const metadata: Metadata = {
    title: 'HTTP/1.1, HTTP/2 and HTTP/3',
    description:
        'System design, chapter 9: three responses come back and one carrier is lost. HTTP/1.1 holds the later responses, HTTP/2 holds every stream on the TCP connection, and HTTP/3 holds only the stream in the lost packet.',
    alternates: { canonical: '/learn/http-versions' },
};

const C = citeFor('http-versions', SOURCES, SOURCE_NUMBER);

export default function Page(): React.JSX.Element {
    return (
        <CourseShell chapterId="http-versions" crumbs={[{ label: 'Chapter 9' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 9 · Stage 1, Foundations"
                    title="HTTP/1.1, HTTP/2 and HTTP/3"
                    lede="Three responses are coming back. One carrier is lost. How many stay held depends on the version that carries them."
                />

                <ChapterTabs
                    film={<LessonFilm film={LESSON_FILMS['http-versions']} />}
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="hold">One loss, two arrivals</h2>
                                <p>
                                    Watch the three bodies leave the server. One of them comes off the path
                                    and stays off it. The other two reach the dock.
                                </p>
                            </div>
                            <VersionHold pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    HTTP/3 puts each request and its response on one QUIC stream. The streams
                                    are independent, so a stream that is blocked or that loses a packet does
                                    not stop the others <C ids={['rfc9114']} at="§2" />.
                                </p>
                                <p>
                                    A QUIC stream delivers its own bytes in order. It makes no guarantee about
                                    the order of bytes on another stream. Data on a QUIC stream maps to one
                                    HTTP transaction, or to the whole connection{' '}
                                    <C ids={['rfc9114']} at="§6" />. Delivery is reliable and in order on each
                                    stream <C ids={['rfc9114']} at="§1.2" />.
                                </p>
                                <p>
                                    The lost carrier is the middle response. It is lost at {LOSS} ticks. The
                                    earliest response leaves at {SEND[0]} ticks, the middle at {SEND[1]}, and
                                    the latest at {SEND[2]}. A response that is delivered spends {FLIGHT}{' '}
                                    ticks on the path. Those durations, and which carrier is lost, are
                                    assumed. The packet that would carry the lost response again is not drawn.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="compare">Same loss, three versions</h2>
                                <p>
                                    Choose HTTP/1.1, HTTP/2, or HTTP/3. Say how many responses stay held. The
                                    press stays still until you press Run.
                                </p>
                            </div>
                            <VersionHold pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    On one HTTP/1.1 connection, responses come back in the order the requests
                                    were sent. The client pairs each arriving response with the first request
                                    that still has no final response <C ids={['rfc9112']} at="§9" />{' '}
                                    <C ids={['rfc9112']} at="§9.2" />. A server that accepted pipelined
                                    requests sends those responses in the order the requests were received{' '}
                                    <C ids={['rfc9112']} at="§9.3.2" />. A response can carry a message body,
                                    and a client that wants to reuse the connection reads that whole body{' '}
                                    <C ids={['rfc9112']} at="§6" /> <C ids={['rfc9112']} at="§9.3" />. In this
                                    run the earliest response is ahead of the lost carrier, so it still
                                    arrives. The latest response stays held.
                                </p>
                                <p>
                                    HTTP/2 runs on a TCP connection. Each exchange has its own stream, and one
                                    connection can keep several streams open while their frames are
                                    interleaved <C ids={['rfc9113']} at="§2" />{' '}
                                    <C ids={['rfc9113']} at="§5" />. A response that is only stalled does not
                                    stop the other streams <C ids={['rfc9113']} at="§2" />. A lost packet is a
                                    different fault. The multiplexing is not visible to TCP&apos;s loss
                                    recovery, so every active transaction stalls, including one the packet did
                                    not carry <C ids={['rfc9114']} at="§1.1" />. HTTP/2 does not remove that
                                    TCP head-of-line blocking <C ids={['rfc9113']} at="§1" />. This run loses
                                    the carrier before any of the three has finished, so all three are still
                                    active. That timing is assumed.
                                </p>
                                <p>
                                    A client should not open more than one HTTP/2 connection to the same host
                                    and port <C ids={['rfc9113']} at="§9.1" />. HTTP/1.1 clients often open
                                    several connections so one long response does not block the next request
                                    on that same connection <C ids={['rfc9112']} at="§9.4" />. Each HTTP/1.1
                                    connection maps to one transport connection{' '}
                                    <C ids={['rfc9112']} at="§9.1" />. This press draws one connection.
                                </p>
                            </div>
                        </>
                    }
                    quiz={
                        <>
                            <div className="ln-prose">
                                <h2>Check yourself</h2>
                                <p>Answer before you open the explanation.</p>
                            </div>
                            <Question
                                n={1}
                                ask="Two bodies are in the dock and one is off the path. Which version is that, and why does a slow, lossy link favour it?"
                            >
                                <p>
                                    HTTP/3. The lost packet holds the stream that suffered it, and the other
                                    streams still arrive <C ids={['rfc9114']} at="§2" />. A slow, lossy link
                                    favours that mapping among these three because the other two responses are
                                    delivered. The ending where every active transaction stalls is the shared
                                    TCP connection <C ids={['rfc9114']} at="§1.1" />.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask="All three bodies are off the path. The lost carrier was the middle response. Why are the other two held?"
                            >
                                <p>
                                    They share one TCP connection. HTTP/2 interleaves their streams on that
                                    connection <C ids={['rfc9113']} at="§2" />, and a lost packet stalls every
                                    active transaction on it, including a transaction the packet did not carry{' '}
                                    <C ids={['rfc9114']} at="§1.1" />. HTTP/2 leaves TCP head-of-line blocking
                                    in place <C ids={['rfc9113']} at="§1" />. Separate QUIC streams keep going{' '}
                                    <C ids={['rfc9114']} at="§2" />.
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask="The earliest body is in the dock. The other two are off the path. Why did the latest one stay held?"
                            >
                                <p>
                                    This is one HTTP/1.1 connection. Responses are matched to requests by
                                    order, so a later response is not taken while an earlier one is still
                                    unfinished <C ids={['rfc9112']} at="§9.2" />{' '}
                                    <C ids={['rfc9112']} at="§9.3.2" />. The earliest response is ahead of
                                    that gap, so it still arrives. The client reads a whole response body
                                    before it reuses the connection for the next one{' '}
                                    <C ids={['rfc9112']} at="§9.3" />.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>
                            Point at the three bodies at the end of the HTTP/3 run and say that one is held
                            and the other two are delivered.
                        </li>
                        <li>
                            Predict how many responses stay held, for the same lost carrier, on HTTP/1.1, on
                            HTTP/2, and on HTTP/3.
                        </li>
                        <li>
                            Say that a slow, lossy link favours HTTP/3 among these three, because the loss
                            holds only the stream that was in the lost packet, and that this press is one
                            connection.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#http-versions">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 10, <Link href="/learn/cloud-networking">Networks inside a cloud</Link>.
                        Previous: <Link href="/learn/udp-quic">chapter 8</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
