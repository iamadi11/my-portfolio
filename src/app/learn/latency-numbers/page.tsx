import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import LatencyScale from '@/components/learn/latency-numbers/LatencyScale';
import {
    LATENCY_NUMBERS_SOURCE_NUMBER as SOURCE_NUMBER,
    LATENCY_NUMBERS_SOURCES as SOURCES,
} from '@/content/learn/latency-numbers-sources';
import {
    BRANCH_NS,
    L1_NS,
    L2_NS,
    MEMORY_NS,
    MUTEX_NS,
    NET_NS,
    SEEK_NS,
    SSD_NS,
    WAN_NS,
    dominates,
    factor,
    formatFactor,
    formatMagnitude,
    formatNs,
    magnitude,
    pairOf,
} from '@/lib/learn/latency-numbers-model';

/**
 * Chapter 13, latency numbers: the carriage's place is the order of magnitude
 * of one operation. Learner-facing page for
 * `docs/system-design/chapters/latency-numbers.md`.
 */

export const metadata: Metadata = {
    title: 'Where time goes: memory, disk and network',
    description:
        'System design, chapter 13: rank a memory fetch, an SSD read, a disk seek, and a network round trip by orders of magnitude, and see which stop is the bottleneck.',
    alternates: { canonical: '/learn/latency-numbers' },
};

const C = citeFor('latency-numbers', SOURCES, SOURCE_NUMBER);
const seekGap = pairOf('memory', 'seek');
const closeGap = pairOf('ssd', 'net');

export default function Page(): React.JSX.Element {
    return (
        <CourseShell crumbs={[{ label: 'Chapter 13' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 13 · Stage 1, Foundations"
                    title="Where time goes: memory, disk and network"
                    lede="A memory fetch and a disk seek are not neighbors. The carriage stops at the order of magnitude of each operation."
                />

                <ChapterTabs
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="orders">How many tens</h2>
                                <p>
                                    Latency is how long one operation takes. An order of magnitude is the
                                    power of ten in that duration: the base-10 logarithm of the nanoseconds.
                                    The carriage&apos;s place on the bench is that power. The walk starts at a
                                    short memory fetch and ends at a packet that crosses an ocean and comes
                                    back.
                                </p>
                            </div>
                            <LatencyScale pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    Peter Norvig lists approximate timings for a typical PC. A fetch from L1
                                    cache memory is {formatNs(L1_NS)}. A fetch from main memory is{' '}
                                    {formatNs(MEMORY_NS)}. A fetch from a new disk location, a seek, is{' '}
                                    {formatNs(SEEK_NS)}. Sending a packet from the US to Europe and back is{' '}
                                    {formatNs(WAN_NS)}. The same list gives an instruction as 1 nanosecond, a
                                    branch misprediction as {formatNs(BRANCH_NS)}, a fetch from L2 cache
                                    memory as {formatNs(L2_NS)}, and a mutex lock/unlock as{' '}
                                    {formatNs(MUTEX_NS)} <C ids={['norvig-latency']} at="Answers" />. The
                                    carriage stops on the memory, disk, and network rows. Colin Scott&apos;s
                                    script returns {formatNs(SSD_NS)} when its year is greater than 2014, and
                                    labels that stop SSD random read. His note says numbers without a citation
                                    are from Norvig. The paper named in the comment above his formula was not
                                    opened, and the formula was not run{' '}
                                    <C ids={['scott-latency']} at="getSSDLatency" />.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="farther">Which stop is farther</h2>
                                <p>
                                    Choose two operations. Predict which stop sits farther along the bench,
                                    then press Run. The carriage waits until you do. The farther stop is the
                                    slower of the two.
                                </p>
                            </div>
                            <LatencyScale pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    A gap of one order is a factor of ten. At or above that, the farther
                                    duration is at least ten elevenths of the sum of the pair, so it is the
                                    bottleneck of those two operations. Under one order, the durations share a
                                    band and you add them. The outcome uses the magnitudes from the model. It
                                    names a script constant when the stop is one.
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
                                ask={`A fetch from main memory is ${formatNs(MEMORY_NS)}. A fetch from a new disk location is ${formatNs(SEEK_NS)}. Which stop is farther, and by how many orders?`}
                            >
                                <p>
                                    The seek is farther. Its magnitude is{' '}
                                    {formatMagnitude(magnitude(SEEK_NS))}. The memory fetch is magnitude{' '}
                                    {formatMagnitude(magnitude(MEMORY_NS))}. The gap is{' '}
                                    {formatMagnitude(seekGap.orders)} orders,{' '}
                                    {formatFactor(factor(MEMORY_NS, SEEK_NS))} times. That gap is at least one
                                    order, so the seek is the bottleneck of this pair. Both durations are from
                                    the Answers table.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask="Why is that disk seek not just a bit slower than the main-memory fetch?"
                            >
                                <p>
                                    A bit slower would be a small factor, and the carriage would stop nearby.
                                    {` ${formatNs(SEEK_NS)}`} divided by {formatNs(MEMORY_NS)} is{' '}
                                    {formatFactor(factor(MEMORY_NS, SEEK_NS))}. One order on this bench is a
                                    factor of ten. The seek sits {formatMagnitude(seekGap.orders)} orders
                                    farther. The place is the logarithm of the nanoseconds, so that factor is
                                    that many pitches along the bench.
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask={`SSD random read is ${formatNs(SSD_NS)}. Sending 2K bytes over a 1Gbps network is ${formatNs(NET_NS)}. Which stop is farther, and why is the SSD figure not a measurement from the Answers table?`}
                            >
                                <p>
                                    The network send is farther, by {formatMagnitude(closeGap.orders)} orders,{' '}
                                    {formatFactor(factor(SSD_NS, NET_NS))} times.{' '}
                                    {dominates(closeGap.orders)
                                        ? 'That is at least one order, so the send dominates the sum.'
                                        : 'That is under one order, so the send does not dominate the sum.'}{' '}
                                    The {formatNs(NET_NS)} row is in the Answers table. The {formatNs(SSD_NS)}{' '}
                                    stop is the integer the script returns when the year is greater than 2014.
                                    The Answers table has no SSD row, and this page did not measure a drive.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>Place one of these operations by the base-10 logarithm of its nanoseconds.</li>
                        <li>
                            Say that the disk seek and the main-memory fetch are orders apart, using{' '}
                            {formatNs(MEMORY_NS)} and {formatNs(SEEK_NS)}.
                        </li>
                        <li>
                            Pick the farther of two stops, and say whether that gap is large enough to
                            dominate the sum. Say that the SSD stop is the script&apos;s constant.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#latency-numbers">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 14,{' '}
                        <Link href="/learn/estimation">
                            <strong>Back-of-envelope estimation.</strong>
                        </Link>{' '}
                        Previous: <Link href="/learn/percentiles">Percentiles and tail latency</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
