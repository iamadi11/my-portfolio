import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import LessonFilm from '@/components/learn/film/LessonFilm';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import QueueRow from '@/components/learn/utilisation-queueing/QueueRow';
import { LESSON_FILMS } from '@/content/learn/films';
import {
    UTILISATION_QUEUEING_SOURCE_NUMBER as SOURCE_NUMBER,
    UTILISATION_QUEUEING_SOURCES as SOURCES,
} from '@/content/learn/utilisation-queueing-sources';
import {
    HIGH_ARRIVAL_PER_S,
    LOW_ARRIVAL_PER_S,
    SERVICE_PER_S,
    formatMean,
    formatSeconds,
    formatUtil,
    station,
} from '@/lib/learn/utilisation-queueing-model';

/**
 * Chapter 15, utilisation and Little's law: the row of waiting jobs grows, and
 * the time in the system grows with it, as arrivals approach the service rate.
 * Learner-facing page for `docs/system-design/chapters/utilisation-queueing.md`.
 */

export const metadata: Metadata = {
    title: 'Utilisation, queues and Little’s law',
    description:
        'System design, chapter 15: one machine finishes jobs at an assumed rate. As arrivals approach that rate, the row of waiting jobs gets long, and the time a job spends in the system grows with it.',
    alternates: { canonical: '/learn/utilisation-queueing' },
};

const C = citeFor('utilisation-queueing', SOURCES, SOURCE_NUMBER);
const low = station(LOW_ARRIVAL_PER_S);
const high = station(HIGH_ARRIVAL_PER_S);

export default function Page(): React.JSX.Element {
    return (
        <CourseShell chapterId="utilisation-queueing" crumbs={[{ label: 'Chapter 15' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 15 · Stage 1, Foundations"
                    title="Utilisation, queues and Little’s law"
                    lede="One machine finishes jobs at a fixed rate. When jobs arrive nearly that fast, the row waiting for it gets long, and each job stays much longer."
                />

                <ChapterTabs
                    film={<LessonFilm film={LESSON_FILMS['utilisation-queueing']} />}
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="one-machine">One machine, a row of jobs</h2>
                                <p>
                                    Jobs arrive at one machine. The machine finishes them one at a time. Jobs
                                    that have arrived and have not started stand in a row. This run begins at{' '}
                                    {LOW_ARRIVAL_PER_S} arrivals per second and rises to {HIGH_ARRIVAL_PER_S}.
                                    The machine finishes {SERVICE_PER_S} per second. Both rates are assumed.
                                </p>
                            </div>
                            <QueueRow pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    Little calls L the mean number of units in the system and W the mean time
                                    a unit spends in the system, and he calls 1/λ the mean time between
                                    arrivals. When those means are finite, the processes are strictly
                                    stationary, and the arrival process is metrically transitive with a
                                    nonzero mean, L = λW <C ids={['little-1961']} at="Abstract" />. A
                                    sample-path note states the same relation when the arrival rate and the
                                    average sojourn exist and are finite{' '}
                                    <C ids={['sigman-littles-law']} at="§1.1" />. In the applications that
                                    follow, the mean number waiting equals the arrival rate times the mean
                                    delay before service <C ids={['sigman-littles-law']} at="§1.2" />. For one
                                    server with Poisson arrivals and exponential service, and utilisation ρ =
                                    λ/μ below 1, that note gives the mean number in the system as ρ/(1 − ρ)
                                    and the mean time in the system as (1/μ)/(1 − ρ). It reads that sojourn as
                                    1 + L mean service times, the extra one being the job&apos;s own service{' '}
                                    <C ids={['sigman-littles-law']} at="§1.2" />.
                                </p>
                                <p>
                                    On these assumed rates the mean delay before service is that sojourn minus
                                    one mean service time of {formatSeconds(low.serviceTimeS)}. At{' '}
                                    {LOW_ARRIVAL_PER_S} per second, ρ is {formatUtil(low.utilisation)}, the
                                    mean time in the system is {formatSeconds(low.timeInSystemS)}, and the
                                    mean number in the system is {formatMean(low.meanInSystem)}, which is{' '}
                                    {LOW_ARRIVAL_PER_S} times {formatSeconds(low.timeInSystemS)}. The mean
                                    number waiting is {formatMean(low.meanWaiting)}, so the row shows{' '}
                                    {low.present} job. At {HIGH_ARRIVAL_PER_S} per second, ρ is{' '}
                                    {formatUtil(high.utilisation)}, the mean time in the system is{' '}
                                    {formatSeconds(high.timeInSystemS)}, and the mean number in the system is{' '}
                                    {formatMean(high.meanInSystem)}, which is {HIGH_ARRIVAL_PER_S} times{' '}
                                    {formatSeconds(high.timeInSystemS)}. The mean number waiting is{' '}
                                    {formatMean(high.meanWaiting)}, so the row shows {high.present} jobs. The
                                    sojourn formula is stated for ρ below 1. The same note says a single
                                    server is busy for a fraction min{'{'}ρ, 1{'}'} of the time, so ρ at or
                                    above 1 means the server is busy all the time, and this page does not use
                                    the sojourn formula there. These waits are that formula. They are not a
                                    measurement, and this page does not simulate arrivals.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="low-or-high">Low or high</h2>
                                <p>
                                    The machine still finishes {SERVICE_PER_S} jobs per second, assumed.
                                    Choose {LOW_ARRIVAL_PER_S} arrivals per second or {HIGH_ARRIVAL_PER_S}.
                                    Predict whether the time a job spends in the system stays short or grows
                                    sharply, then press Run. The row stays still until you do.
                                </p>
                            </div>
                            <QueueRow pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    The sojourn used here is for one server, Poisson arrivals, and exponential
                                    service, with ρ below 1. A second server, a row that turns jobs away when
                                    it is full, or a trace from a running service is a different case. The
                                    arrival rates are assumed.
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
                                ask={`The machine finishes ${SERVICE_PER_S} jobs per second, assumed. Arrivals are ${LOW_ARRIVAL_PER_S} per second, assumed. What is the mean number in the system, and what product equals it?`}
                            >
                                <p>
                                    The mean number in the system is {formatMean(low.meanInSystem)}. That
                                    equals {LOW_ARRIVAL_PER_S} per second times{' '}
                                    {formatSeconds(low.timeInSystemS)}. The mean number waiting is{' '}
                                    {formatMean(low.meanWaiting)}, so the row shows {low.present} job.
                                    Utilisation is {formatUtil(low.utilisation)}.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask={`Arrivals rise from ${LOW_ARRIVAL_PER_S} per second to ${HIGH_ARRIVAL_PER_S}, still assumed, and the machine still finishes ${SERVICE_PER_S} per second. Does the time in the system stay near ${formatSeconds(low.timeInSystemS)}, because ${formatUtil(high.utilisation)} is only somewhat higher than ${formatUtil(low.utilisation)}?`}
                            >
                                <p>
                                    No. The mean time in the system is (1/μ) / (1 − ρ). At ρ ={' '}
                                    {formatUtil(low.utilisation)} it is {formatSeconds(low.timeInSystemS)}. At
                                    ρ = {formatUtil(high.utilisation)} it is{' '}
                                    {formatSeconds(high.timeInSystemS)}. The mean number waiting is{' '}
                                    {formatMean(high.meanWaiting)}, so the row shows {high.present} jobs. The
                                    mean number in the system is {formatMean(high.meanInSystem)}, equal to{' '}
                                    {HIGH_ARRIVAL_PER_S} per second times {formatSeconds(high.timeInSystemS)}.
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask="Why does L = λW, by itself, not tell you that the time gets long as the server approaches full load?"
                            >
                                <p>
                                    The relation ties the mean number in the system to the arrival rate and
                                    the mean time. It does not choose the time. The growth in these two cases
                                    comes from the single-server formula w = (1/μ) / (1 − ρ), stated for ρ
                                    below 1. Once that formula gives the time, L = λW gives the mean number.
                                    The row is the mean number waiting, rounded to a whole job, not a count
                                    from a simulated run.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>
                            For these assumed rates, state that the mean number in the system equals the
                            arrival rate times the mean time in the system.
                        </li>
                        <li>
                            Predict that the time in the system at {HIGH_ARRIVAL_PER_S} arrivals per second is
                            much longer than at {LOW_ARRIVAL_PER_S}, for this one-server formula.
                        </li>
                        <li>
                            Say that the row shows the mean number waiting, rounded to a whole job, and that
                            the count is not a measured run.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#utilisation-queueing">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 16,{' '}
                        <Link href="/learn/api-design">
                            <strong>API design: contracts between programs.</strong>
                        </Link>{' '}
                        Previous: <Link href="/learn/estimation">Back-of-envelope estimation</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
