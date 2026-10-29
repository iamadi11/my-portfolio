import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import EstimateStack from '@/components/learn/estimation/EstimateStack';
import LessonFilm from '@/components/learn/film/LessonFilm';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import {
    ESTIMATION_SOURCE_NUMBER as SOURCE_NUMBER,
    ESTIMATION_SOURCES as SOURCES,
} from '@/content/learn/estimation-sources';
import { LESSON_FILMS } from '@/content/learn/films';
import {
    LEARN_ASSUMPTIONS,
    LEARN_ESTIMATE,
    SECONDS_PER_DAY,
    SIZE_ASSUMPTIONS,
    USERS_ASSUMPTIONS,
    estimate,
    formatInteger,
} from '@/lib/learn/estimation-model';

/**
 * Chapter 14, estimation: three pans, each stack the height of one product.
 * Learner-facing page for `docs/system-design/chapters/estimation.md`.
 */

export const metadata: Metadata = {
    title: 'Back-of-envelope estimation',
    description:
        'System design, chapter 14: estimate requests per second, bytes stored, and bytes per second for an assumed notebook, and state every assumption.',
    alternates: { canonical: '/learn/estimation' },
};

const C = citeFor('estimation', SOURCES, SOURCE_NUMBER);
const users = estimate(USERS_ASSUMPTIONS);
const size = estimate(SIZE_ASSUMPTIONS);

export default function Page(): React.JSX.Element {
    return (
        <CourseShell crumbs={[{ label: 'Chapter 14' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 14 · Stage 1, Foundations"
                    title="Back-of-envelope estimation"
                    lede="State every assumption, then multiply. Each pan holds one product: requests per second, bytes stored, or bytes per second."
                />

                <ChapterTabs
                    film={<LessonFilm film={LESSON_FILMS['estimation']} />}
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="products">Three products</h2>
                                <p>
                                    Requests per second are the actions in one day divided by the seconds in
                                    that day. Bytes stored are that rate, times those seconds, times the bytes
                                    in one object, times the days you keep the objects. Bytes per second on
                                    the wire are the rate times the bytes in one object. Bandwidth in this
                                    chapter is that bytes-per-second figure. The pans show a class notebook.
                                    It is not a company&apos;s traffic.
                                </p>
                            </div>
                            <EstimateStack pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    A design exercise in the SRE workbook states each rate and each record
                                    size, then multiplies. One day of bytes is the rate, times the seconds in
                                    a day, times the bytes in one record. Bytes on the network are the rate
                                    times the bytes in one record. The chapter says the early assumptions
                                    dominate the result, and that the assumptions do not have to be perfect.
                                    This notebook uses its own assumed inputs. A day here is{' '}
                                    {formatInteger(SECONDS_PER_DAY)} seconds, from 24 × 60 × 60. That is the
                                    definition in the product, not a measurement. The workbook writes the same
                                    count as 8.64×10<sup>4</sup> seconds/day for a 24-hour period{' '}
                                    <C ids={['sre-nalsd']} at="One machine, Calculations" />.
                                </p>
                                <h3>Go deeper</h3>
                                <p>
                                    That chapter also divides a rate by an assumed disk operation rate, and it
                                    rounds one day of bytes upward for index overhead. Those steps pick a
                                    machine count. This scale stops at the three products.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="one-input">Change one assumption</h2>
                                <p>
                                    Users and object size are the two assumptions you can move. The other
                                    assumptions stay. Say which quantities will change height before you press
                                    Run.
                                </p>
                            </div>
                            <EstimateStack pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    The users are in every product, because every product includes the actions
                                    in a day. The object size is only in the two products that count bytes.
                                    The request rate does not.
                                </p>
                            </div>
                        </>
                    }
                    quiz={
                        <>
                            <div className="ln-prose">
                                <h2>Recall</h2>
                                <p>Open the answer after you have one.</p>
                            </div>
                            <Question
                                n={1}
                                ask={`Daily active users go from ${formatInteger(LEARN_ASSUMPTIONS.dailyActiveUsers)} to ${formatInteger(USERS_ASSUMPTIONS.dailyActiveUsers)}. Actions per user, object size, and days kept stay as they were. Which of the three quantities change?`}
                            >
                                <p>
                                    All three. Requests per second go from{' '}
                                    {formatInteger(LEARN_ESTIMATE.requestsPerSecond)} to{' '}
                                    {formatInteger(users.requestsPerSecond)}. Bytes stored go from{' '}
                                    {formatInteger(LEARN_ESTIMATE.bytesStored)} to{' '}
                                    {formatInteger(users.bytesStored)}. Bytes per second go from{' '}
                                    {formatInteger(LEARN_ESTIMATE.bytesPerSecond)} to{' '}
                                    {formatInteger(users.bytesPerSecond)}. Each product multiplies by the
                                    actions in a day, and that count multiplies by the users. Both user counts
                                    are assumed.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask={`The object goes from ${formatInteger(LEARN_ASSUMPTIONS.bytesPerObject)} bytes to ${formatInteger(SIZE_ASSUMPTIONS.bytesPerObject)} bytes. Why do the request plates stay at ${LEARN_ESTIMATE.requestPlates}?`}
                            >
                                <p>
                                    Requests per second stay {formatInteger(size.requestsPerSecond)}. They are
                                    the users times the actions per user, divided by{' '}
                                    {formatInteger(SECONDS_PER_DAY)}. The object&apos;s bytes are not in that
                                    quotient. Bytes stored become {formatInteger(size.bytesStored)}, and bytes
                                    per second become {formatInteger(size.bytesPerSecond)}. Those two multiply
                                    by the object size. Both sizes are assumed.
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask={`Where does ${formatInteger(SECONDS_PER_DAY)} come from, if nobody timed a day for this page?`}
                            >
                                <p>
                                    It is 24 × 60 × 60, the definition of a day in this product, not a
                                    measurement. The workbook writes the same integer as 8.64×10
                                    <sup>4</sup> seconds/day when it turns a rate into a 24-hour volume. The
                                    notebook&apos;s users and its object size are separate assumptions. They
                                    are not that exercise&apos;s query rate.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>
                            Divide an assumed day of actions by {formatInteger(SECONDS_PER_DAY)} and get
                            requests per second.
                        </li>
                        <li>
                            Multiply that rate by an assumed object size to get bytes stored for the days you
                            keep, and bytes per second on the wire.
                        </li>
                        <li>
                            Say which of the three move when the users change, and which stay when only the
                            object size changes.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#estimation">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 15,{' '}
                        <Link href="/learn/utilisation-queueing">
                            <strong>Utilisation, queues and Little&apos;s law.</strong>
                        </Link>{' '}
                        Previous:{' '}
                        <Link href="/learn/latency-numbers">Where time goes: memory, disk and network</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
