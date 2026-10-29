import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import LessonFilm from '@/components/learn/film/LessonFilm';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import TcpStream from '@/components/learn/tcp/TcpStream';
import { LESSON_FILMS } from '@/content/learn/films';
import { TCP_SOURCE_NUMBER as SOURCE_NUMBER, TCP_SOURCES as SOURCES } from '@/content/learn/tcp-sources';
import {
    BYTES_EACH,
    FIRST_SETTLE,
    FLIGHT,
    LEARN_LOST,
    RESEND_AFTER,
    SEGMENT_COUNT,
    SEND_EVERY,
} from '@/lib/learn/tcp-model';

/**
 * Chapter 5, tcp: a lost segment is sent again, and the receiver does not hand the
 * application bytes that sit past the gap. Learner-facing page for
 * `docs/system-design/chapters/tcp.md`.
 */

export const metadata: Metadata = {
    title: 'TCP: reliable streams over unreliable packets',
    description:
        'System design, chapter 5: one segment falls off the wire, the sender puts those bytes on the wire again, and the receiver does not hand the application anything past the gap.',
    alternates: { canonical: '/learn/tcp' },
};

const C = citeFor('tcp', SOURCES, SOURCE_NUMBER);

export default function Page(): React.JSX.Element {
    return (
        <CourseShell chapterId="tcp" crumbs={[{ label: 'Chapter 5' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 5 · Stage 1, Foundations"
                    title="TCP: reliable streams over unreliable packets"
                    lede="Five segments cross one wire. One can fall off. The sender puts those bytes on the wire again, and any bytes past the gap wait in the receiver."
                />

                <ChapterTabs
                    film={<LessonFilm film={LESSON_FILMS['tcp']} />}
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="gap">The gap stays dark</h2>
                                <p>
                                    Watch segment {LEARN_LOST}. It leaves the sender, falls off the cable, and
                                    a later copy of the same bytes travels the cable again. The lamps for the
                                    segments that arrive after the hole stay dark until that copy reaches the
                                    tray.
                                </p>
                            </div>
                            <TcpStream pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    TCP gives the application a reliable, in-order stream of bytes. The bytes
                                    move as segments, and each segment is carried in an IP datagram. Loss is
                                    repaired by retransmission <C ids={['rfc9293']} at="§2.2" />. A segment
                                    may be lost, and the sender transmits it again so that every segment is
                                    delivered <C ids={['rfc9293']} at="§3.8" />. When the retransmission
                                    timeout expires, the sender transmits again the segment at the front of
                                    its retransmission queue <C ids={['rfc9293']} at="§3.10.8" />.
                                </p>
                                <p>
                                    The receiver goes on with a segment that begins at the next byte it still
                                    needs. A segment that starts later is held for later processing, and those
                                    bytes are not what gets delivered next{' '}
                                    <C ids={['rfc9293']} at="§3.10.7" />.
                                </p>
                                <p>
                                    This picture uses {SEGMENT_COUNT} segments of {BYTES_EACH} data bytes, one
                                    every {SEND_EVERY} ticks, and {FLIGHT} ticks on the wire. The second copy
                                    waits {RESEND_AFTER} ticks after that segment was sent. Those durations
                                    are assumed. A real retransmission timeout is computed, and it changes{' '}
                                    <C ids={['rfc9293']} at="§3.8.1" />. The byte numbers on the step line
                                    count data from 0. On the wire the first data octet is one past the
                                    initial sequence number <C ids={['rfc9293']} at="§3.1" />. The connection
                                    is already open. Opening it is the three-way handshake{' '}
                                    <C ids={['rfc9293']} at="§3.5" />.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="which">Which segment falls</h2>
                                <p>
                                    Choose which first copy falls, or none. Say what the application has read
                                    when every first trip has finished. The drawing stays still until you
                                    press Run.
                                </p>
                            </div>
                            <TcpStream pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    The resend is timed from that segment&apos;s own send, {RESEND_AFTER}{' '}
                                    ticks later. Tick {FIRST_SETTLE} is the end of every first trip, and in
                                    this model it is still before any second copy leaves. The verdict uses
                                    that moment. Congestion control, which a real endpoint has to implement,
                                    is not in the run <C ids={['rfc9293']} at="§3.8.2" />.
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
                                ask="Segment 3 has fallen. Segments 4 and 5 are in the tray. What has the application read?"
                            >
                                <p>
                                    Segments 1 and 2. Segments 4 and 5 start after the missing bytes, so they
                                    are held and are not the next delivery{' '}
                                    <C ids={['rfc9293']} at="§3.10.7" />.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask="The second copy of segment 3 arrives. What does the application read that it had not read yet, and what about the cartridge on the floor?"
                            >
                                <p>
                                    It reads segment 3 and the segments it was holding, 4 and 5. The cartridge
                                    on the floor is the lost copy. It is not delivered as well. Delivery is
                                    the bytes, once, in order <C ids={['rfc9293']} at="§2.2" />.
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask="No segment is lost. How many times does each segment travel the wire here, and what can a real timer still do?"
                            >
                                <p>
                                    Once. This model resends a segment only when its first copy was lost. A
                                    real retransmission timeout is computed from round-trip samples{' '}
                                    <C ids={['rfc9293']} at="§3.8.1" />. This run does not measure that, so a
                                    late acknowledgment can still cause a resend that this picture would not
                                    draw.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>
                            Say whether a segment sitting in the tray has been read, given which earlier one
                            is missing.
                        </li>
                        <li>
                            Say that the second copy is the same bytes, after this model&apos;s fixed wait.
                        </li>
                        <li>Separate a missing last segment from later bytes that are waiting unread.</li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#tcp">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 6,{' '}
                        <Link href="/learn/tls">
                            <strong>TLS: encrypted, authenticated connections.</strong>
                        </Link>{' '}
                        Previous:
                        <Link href="/learn/dns">chapter 4</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
