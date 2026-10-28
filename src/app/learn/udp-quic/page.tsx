import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import QuicStreams from '@/components/learn/udp-quic/QuicStreams';
import {
    UDP_QUIC_SOURCE_NUMBER as SOURCE_NUMBER,
    UDP_QUIC_SOURCES as SOURCES,
} from '@/content/learn/udp-quic-sources';
import { FLIGHT, GAP, LOSS } from '@/lib/learn/udp-quic-model';

/**
 * Chapter 8, udp-quic: one lost packet holds only the stream that was in it.
 * The other stream's body still arrives. Learner-facing page for
 * `docs/system-design/chapters/udp-quic.md`.
 */

export const metadata: Metadata = {
    title: 'UDP and QUIC: when TCP is not the answer',
    description:
        'System design, chapter 8: two streams share a path. A lost packet holds only its own stream, and the other stream still arrives. QUIC packets ride in UDP datagrams.',
    alternates: { canonical: '/learn/udp-quic' },
};

const C = citeFor('udp-quic', SOURCES, SOURCE_NUMBER);

export default function Page(): React.JSX.Element {
    return (
        <CourseShell crumbs={[{ label: 'Chapter 8' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 8 · Stage 1, Foundations"
                    title="UDP and QUIC: when TCP is not the answer"
                    lede="Two bodies share one bar. The earlier one is lost and stays off the bar. The later one still reaches the far well."
                />

                <ChapterTabs
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="hold">One loss, one stream</h2>
                                <p>
                                    Watch the two bodies. They share one bar. The earlier body leaves the bar
                                    and stays off it. The later body keeps going and ends in the far well.
                                </p>
                            </div>
                            <QuicStreams pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    A QUIC stream is an ordered sequence of bytes. A connection can carry more
                                    than one at the same time, and either end can send on a stream it opened.
                                    QUIC does not keep an order between bytes on different streams{' '}
                                    <C ids={['rfc9000']} at="§2" />. A stream is that channel of ordered bytes
                                    inside one connection <C ids={['rfc9000']} at="§1.2" />.
                                </p>
                                <p>
                                    An endpoint places a stream&apos;s bytes with the stream identifier and
                                    the offset in a STREAM frame <C ids={['rfc9000']} at="§2.2" />. Frames
                                    from more than one stream can sit in one QUIC packet, and one packet can
                                    carry frames from a single stream <C ids={['rfc9000']} at="§13" />. A QUIC
                                    packet is carried in a UDP datagram. One datagram can carry more than one
                                    QUIC packet <C ids={['rfc9000']} at="§1.2" />. Packets are carried in UDP
                                    datagrams <C ids={['rfc9000']} at="§12" />.
                                </p>
                                <p>
                                    When a packet is lost, only streams that had data in that packet are
                                    blocked waiting for a retransmission. Other streams can continue. If that
                                    packet had included more than one stream, the loss would block every one
                                    of those streams. This run puts the earlier stream alone in the lost
                                    packet <C ids={['rfc9000']} at="§13" />.
                                </p>
                                <p>
                                    UDP does not guarantee delivery, and it does not protect against
                                    duplicates. An application that needs ordered reliable streams was
                                    directed to TCP <C ids={['rfc768']} at="Introduction" />. QUIC is the
                                    protocol that rides in those datagrams. It authenticates the whole of each
                                    packet and encrypts as much of each packet as is practical, and it
                                    provides the feedback used to implement reliable delivery{' '}
                                    <C ids={['rfc9000']} at="§1" />. Packets have confidentiality and
                                    integrity protection <C ids={['rfc9000']} at="§12" />. The keys for
                                    packets other than the unprotected cases in the overview come from the
                                    cryptographic handshake. The details of that protection are in another
                                    document, and this picture does not draw the handshake{' '}
                                    <C ids={['rfc9000']} at="§12.1" />.
                                </p>
                                <p>
                                    The earlier packet is the one that is lost. It is lost at {LOSS} ticks.
                                    The later body leaves at {GAP} ticks. A body that is delivered spends{' '}
                                    {FLIGHT} ticks on the bar. Those durations, and which packet is lost, are
                                    assumed. Inside one stream, data that arrives out of order is buffered so
                                    the application still sees an ordered byte stream. This bench has one byte
                                    on the lost stream, so a later byte of that same stream is not here{' '}
                                    <C ids={['rfc9000']} at="§2.2" />. Lost application data is sent again in
                                    a new STREAM frame. That frame is not drawn{' '}
                                    <C ids={['rfc9000']} at="§13.3" />.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="order">One sequence, or one each</h2>
                                <p>
                                    Choose one ordered byte stream, or one stream for each body. Say whether
                                    the later stream stalls. The bench stays still until you press Run.
                                </p>
                            </div>
                            <QuicStreams pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    Delivering one ordered byte stream means holding bytes that arrive ahead
                                    of a gap <C ids={['rfc9000']} at="§2.2" />. In the single-sequence case
                                    this model holds the later body, and it does not deliver that body while
                                    the earlier one is missing. QUIC provides no order between bytes on
                                    different streams <C ids={['rfc9000']} at="§2" />, so the later body can
                                    be delivered while the earlier body is held. The lost bytes would go out
                                    again in a new STREAM frame <C ids={['rfc9000']} at="§13.3" />. This bench
                                    stops at the hold. It does not draw that new frame, and it does not draw a
                                    resend timer.
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
                                ask="The earlier body is off the bar and the later body is in the far well. What did the lost packet do to each stream?"
                            >
                                <p>
                                    It held the earlier stream and left the later stream free to arrive. Only
                                    a stream that had data in the lost packet waits. The other stream can
                                    continue <C ids={['rfc9000']} at="§13" />.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask="Both bodies are off the bar, and the later one never reaches a far well. Which ordering is that, and why is the later body not delivered?"
                            >
                                <p>
                                    One ordered byte stream. Bytes ahead of a gap are not delivered past it{' '}
                                    <C ids={['rfc9000']} at="§2.2" />. The missing earlier byte holds the
                                    later one. That is the single sequence, not the case of one stream each.
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask="The datagrams promised neither delivery nor protection from duplicates. What did the packets inside them take on?"
                            >
                                <p>
                                    QUIC packets are carried in UDP datagrams, and UDP itself does not
                                    guarantee delivery or duplicate protection{' '}
                                    <C ids={['rfc768']} at="Introduction" />. QUIC authenticates each packet,
                                    encrypts as much of it as is practical, and provides the feedback used for
                                    reliable delivery <C ids={['rfc9000']} at="§1" />. The handshake that
                                    makes the keys is not this picture <C ids={['rfc9000']} at="§12.1" />.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>
                            Point at the two bodies and say which stream is held and which has arrived after
                            one lost packet, when each body is its own stream.
                        </li>
                        <li>
                            Say that one ordered byte stream holds the later byte, and that separate streams
                            do not hold each other.
                        </li>
                        <li>
                            Say that UDP does not guarantee delivery, and that QUIC carries its packets in UDP
                            datagrams while protecting those packets and feeding reliable delivery.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#udp-quic">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 9,{' '}
                        <Link href="/learn/http-versions">
                            <strong>HTTP/1.1, HTTP/2 and HTTP/3.</strong>
                        </Link>{' '}
                        Previous: <Link href="/learn/http">chapter 7</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
