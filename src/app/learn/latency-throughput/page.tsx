import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import LessonFilm from '@/components/learn/film/LessonFilm';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import LatencyBench from '@/components/learn/latency/LatencyBench';
import { LESSON_FILMS } from '@/content/learn/films';
import {
    LATENCY_SOURCE_NUMBER as SOURCE_NUMBER,
    LATENCY_SOURCES as SOURCES,
} from '@/content/learn/latency-sources';

/**
 * Chapter 11, latency-throughput: one job's time is not how many jobs finish.
 * Learner-facing page for `docs/system-design/chapters/latency-throughput.md`.
 */

export const metadata: Metadata = {
    title: 'Latency and throughput',
    description:
        'System design, chapter 11: one piece takes the service time to cross a bed, and the tray counts how many pieces finish in a window. More beds do not make one piece faster.',
    alternates: { canonical: '/learn/latency-throughput' },
};

const C = citeFor('latency-throughput', SOURCES, SOURCE_NUMBER);

export default function Page(): React.JSX.Element {
    return (
        <CourseShell chapterId="latency-throughput" crumbs={[{ label: 'Chapter 11' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 11 · Stage 1, Foundations"
                    title="Latency and throughput"
                    lede="One piece can cross a bed quickly while the tray still holds few pieces. Several beds can finish many slow pieces. Those are different numbers."
                />

                <ChapterTabs
                    film={<LessonFilm film={LESSON_FILMS['latency-throughput']} />}
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="one-bed">One piece, one bed</h2>
                                <p>
                                    One bed is bolted on. Pieces arrive one at a time. Each one starts at the
                                    near stop and has to reach the far stop. Watch the piece, then the tray.
                                </p>
                            </div>
                            <LatencyBench pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    A benchmarking memo defines latency as a time interval for one frame
                                    through a device, and throughput as the maximum rate at which none of the
                                    offered frames are dropped <C ids={['rfc1242']} at="§3.8" />{' '}
                                    <C ids={['rfc1242']} at="§3.17" />. This bench is not that test. The first
                                    piece finishes at the service time. While this one bed stays busy for the
                                    whole window, the tray holds the window divided by that time, so the rate
                                    is 1 divided by the service time, in jobs per millisecond. 250 ms, a 1000
                                    ms window, and an arrival every 250 ms are assumed values, not a
                                    measurement.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="beds">More beds</h2>
                                <p>
                                    Choose a service time and how many beds are bolted on. Predict, then press
                                    Run. The pieces stay still until you do.
                                </p>
                            </div>
                            <LatencyBench pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    A piece starts only when a bed is free, and this model does not line
                                    pieces up. Extra beds do not pull a piece across any faster. The tray
                                    grows only while pieces arrive faster than the beds finish them. A
                                    capacity memo defines how much data a link can carry, and says the word
                                    bandwidth is used for several different numbers{' '}
                                    <C ids={['rfc5136']} at="§2.2" /> <C ids={['rfc5136']} at="§2.3.2" />{' '}
                                    <C ids={['rfc5136']} at="§3.4" />. The tray counts pieces, not bits on a
                                    link.
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
                                ask="One bed, service time 250 ms, a piece every 250 ms, window 1000 ms. When does the first piece finish, and how many are in the tray?"
                            >
                                <p>
                                    The first piece finishes at 250 ms. The tray holds 4. The bed is busy the
                                    whole window, so the count is 1000 divided by 250. These times are
                                    assumed.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask="The service time is 500 ms and four beds are bolted on. Does the first piece finish before 500 ms, and how does the tray compare with one bed?"
                            >
                                <p>
                                    It still finishes at 500 ms. One bed holds 2 pieces. Four beds hold 3. The
                                    piece that arrives at 750 ms would finish at 1250 ms, after the window, so
                                    another bed does not add it. Two beds already hold those 3.
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask="The service time is 125 ms, one bed, a piece every 250 ms. Why does the tray not hold 8?"
                            >
                                <p>
                                    1000 divided by 125 is 8 only if a piece is ready whenever the bed frees.
                                    The next piece arrives at 250 ms. This model does not keep a piece
                                    waiting, and it cannot finish a piece that has not arrived. Four pieces
                                    arrive in time to finish. The tray holds 4.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>
                            For one bed that stays busy, state the first finish and the tray count from the
                            service time and the window.
                        </li>
                        <li>
                            Say that more beds leave that finish unchanged, and raise the tray only until
                            every piece that can finish in the window has a bed.
                        </li>
                        <li>
                            Say why a shorter service time can leave the tray unchanged when the next piece
                            has not arrived.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#latency-throughput">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 12,{' '}
                        <Link href="/learn/percentiles">
                            <strong>Percentiles and tail latency.</strong>
                        </Link>{' '}
                        Previous: <Link href="/learn/web-request">chapter 1</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
