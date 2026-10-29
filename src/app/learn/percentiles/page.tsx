import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import LessonFilm from '@/components/learn/film/LessonFilm';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import PercentileRow from '@/components/learn/percentiles/PercentileRow';
import { LESSON_FILMS } from '@/content/learn/films';
import {
    PERCENTILE_SOURCE_NUMBER as SOURCE_NUMBER,
    PERCENTILE_SOURCES as SOURCES,
} from '@/content/learn/percentile-sources';
import {
    BODY_COUNT,
    BODY_MS,
    EXTRA_MS,
    SHOULDER_MS,
    TAIL_MS,
    formatMs,
    formatRank,
    gauge,
} from '@/lib/learn/percentile-model';

/**
 * Chapter 12, percentiles: the median can sit among the short durations while a
 * high rank sits at the slow end. Learner-facing page for
 * `docs/system-design/chapters/percentiles.md`.
 */

export const metadata: Metadata = {
    title: 'Percentiles and tail latency',
    description:
        'System design, chapter 12: sort the durations. A percentile is a rank in that list. The median can stay on the short requests while the 99th percentile sits at the slow end.',
    alternates: { canonical: '/learn/percentiles' },
};

const C = citeFor('percentiles', SOURCES, SOURCE_NUMBER);
const quiet = gauge({ p: 0.99, extra: false });
const added = gauge({ p: 0.99, extra: true });

export default function Page(): React.JSX.Element {
    return (
        <CourseShell crumbs={[{ label: 'Chapter 12' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 12 · Stage 1, Foundations"
                    title="Percentiles and tail latency"
                    lede="Most of these requests are short. One is much longer. The middle of the sorted row can still sit on the short pins."
                />

                <ChapterTabs
                    film={<LessonFilm film={LESSON_FILMS['percentiles']} />}
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="sorted-row">Sort the durations</h2>
                                <p>
                                    Each pin is one request&apos;s duration, in milliseconds. The row is those
                                    durations sorted from shortest to longest. A finger travels along the row.
                                    Where it stops is a rank.
                                </p>
                            </div>
                            <PercentileRow pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    A handbook of statistical methods orders the measurements and calls the
                                    pth percentile a value such that at most 100p percent of them are less
                                    than it and at most 100(1 - p) percent are greater. The 50th percentile is
                                    the median. The default estimate on that page sets the rank to p times one
                                    more than the number of samples, then reads the ordered value there,
                                    placing it between two samples when the rank falls between them. If the
                                    rank falls before the first sample, or on or past the last, the estimate
                                    is that end sample <C ids={['nist-percentile']} at="7.2.6.2" />. On this
                                    row the median&apos;s rank is still among the short pins. The 99th
                                    percentile&apos;s rank is at the slow end. Dean and Barroso describe a
                                    server that typically responds in 10 ms with a 99th-percentile latency of
                                    one second, so one request in 100 is that slow{' '}
                                    <C ids={['tail-at-scale']} at="one server" />. These pins are assumed
                                    durations, not that measurement.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="one-slow">One slower request</h2>
                                <p>
                                    Choose the 50th or the 99th percentile. You can add one request that is
                                    slower than every pin already on the row. Predict where the finger stops,
                                    then press Run. The finger stays put until you do.
                                </p>
                            </div>
                            <PercentileRow pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    The extra duration is assumed. The 99th percentile&apos;s rank sits
                                    between the last samples, so a new slowest sample moves that value. The
                                    50th percentile&apos;s rank stays among the short pins, so its value
                                    stays. Dean and Barroso state that if each server is usually 10 ms but one
                                    second at the 99th percentile, a request that must collect 100 of those
                                    servers in parallel takes more than one second for 63% of user requests{' '}
                                    <C ids={['tail-at-scale']} at="100 servers" />. This row does not fan a
                                    request out across servers, and it does not form a queue.
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
                                ask={`The row is ${BODY_COUNT} requests at ${BODY_MS} ms, one at ${SHOULDER_MS} ms, and one at ${TAIL_MS} ms. Where does the 50th percentile sit, and where does the 99th?`}
                            >
                                <p>
                                    The 50th percentile is rank {formatRank(quiet.median.rank)},{' '}
                                    {formatMs(quiet.median.valueMs)}. Both samples beside that rank are{' '}
                                    {BODY_MS} ms. Samples above it: {quiet.aboveMedian}. The 99th percentile
                                    is rank {formatRank(quiet.high.rank)}, {formatMs(quiet.high.valueMs)},
                                    between the {SHOULDER_MS} ms pin and the {TAIL_MS} ms pin. Samples above
                                    it: {quiet.aboveHigh}. These durations are assumed.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask={`Why isn't the 50th percentile half of the slowest duration, ${TAIL_MS / 2} ms?`}
                            >
                                <p>
                                    Half of {TAIL_MS} ms is {TAIL_MS / 2} ms, but a percentile is not a
                                    fraction of the slowest pin. The 50th percentile is the value at rank{' '}
                                    {formatRank(quiet.median.rank)}. That rank falls between two {BODY_MS} ms
                                    samples, so the value is {formatMs(quiet.median.valueMs)}. The slow pin is
                                    at the far end of the sorted row.
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask={`You add one request at ${EXTRA_MS} ms. What happens to the 50th percentile, and what happens to the 99th?`}
                            >
                                <p>
                                    The 50th stays {formatMs(added.median.valueMs)}. Its rank moves from{' '}
                                    {formatRank(quiet.median.rank)} to {formatRank(added.median.rank)}, and
                                    that sample is still {BODY_MS} ms. The 99th moves from{' '}
                                    {formatMs(quiet.high.valueMs)} at rank {formatRank(quiet.high.rank)} to{' '}
                                    {formatMs(added.high.valueMs)} at rank {formatRank(added.high.rank)},
                                    between the {TAIL_MS} ms pin and the {EXTRA_MS} ms pin.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>
                            Sort a list of durations and state the 50th percentile as the value at its rank.
                        </li>
                        <li>
                            Say that the 99th percentile is a rank near the slow end, so it can be far above
                            the median.
                        </li>
                        <li>
                            Say why adding one slower sample moves the 99th percentile and leaves the 50th
                            unchanged, for this list and this estimate.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#percentiles">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 13,{' '}
                        <Link href="/learn/latency-numbers">
                            <strong>Where time goes: memory, disk and network.</strong>
                        </Link>{' '}
                        Previous: <Link href="/learn/latency-throughput">Latency and throughput</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
