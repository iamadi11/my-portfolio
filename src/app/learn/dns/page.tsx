import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import DnsWalk from '@/components/learn/dns/DnsWalk';
import LessonFilm from '@/components/learn/film/LessonFilm';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import { DNS_SOURCE_NUMBER as SOURCE_NUMBER, DNS_SOURCES as SOURCES } from '@/content/learn/dns-sources';
import { LESSON_FILMS } from '@/content/learn/films';

/**
 * Chapter 4, dns: a name is not an address. The resolver returns a stored answer, or walks
 * root, then the TLD, then the authoritative server. Learner-facing page for
 * `docs/system-design/chapters/dns.md`.
 */

export const metadata: Metadata = {
    title: 'DNS: from names to addresses',
    description:
        'System design, chapter 4: watch a query leave a computer, stop at a resolver, and either come back from storage or walk three servers until an address or a name error returns.',
    alternates: { canonical: '/learn/dns' },
};

const C = citeFor('dns', SOURCES, SOURCE_NUMBER);

export default function Page(): React.JSX.Element {
    return (
        <CourseShell chapterId="dns" crumbs={[{ label: 'Chapter 4' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 4 · Stage 1, Foundations"
                    title="DNS: from names to addresses"
                    lede="A name says what you want. An address says which machine. The resolver either already stored the address, or it asks three servers in order until one of them has it."
                />

                <ChapterTabs
                    film={<LessonFilm film={LESSON_FILMS['dns']} />}
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="walk">The query walks</h2>
                                <p>
                                    Nothing is stored yet. The body leaves the computer, stops at the smaller
                                    machine, then at three servers. Each of the first two points onward. The
                                    last one has the address. The line under the drawing is that step.
                                </p>
                            </div>
                            <DnsWalk pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    A program asks a resolver. The resolver sends the queries and deals with
                                    what comes back <C ids={['rfc1034']} at="§3.7" />. A server answers from
                                    what it holds, or points at servers closer to the name{' '}
                                    <C ids={['rfc1034']} at="§4.1" />. If the answer is already stored, the
                                    resolver returns it and does not ask <C ids={['rfc1034']} at="§5.3.3" />.
                                    That stored case is the lab.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="stored">Stored, or not there</h2>
                                <p>
                                    Change two things, predict, then press Run. A stored address comes back
                                    without the three servers. A name the last server does not have comes back
                                    as no address, after those three have still been asked.
                                </p>
                            </div>
                            <DnsWalk pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    The first step of the resolver is to look in what it already holds{' '}
                                    <C ids={['rfc1034']} at="§5.3.3" />. A stored answer wins over the
                                    question of whether the name exists, because that question is only asked
                                    on a miss. The walk here is one server per zone, in order. Real resolvers
                                    keep a list of servers and may try another if one fails. This model does
                                    not.
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
                                ask="The resolver already stored the address. Which machines does the query visit?"
                            >
                                <p>
                                    The computer and the resolver. The root, the com servers, and the server
                                    for the name are not asked <C ids={['rfc1034']} at="§5.3.3" />.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask="Nothing is stored, and the name exists. What is the order of the three servers?"
                            >
                                <p>
                                    Root, then the servers for com, then the server for example.com. Each of
                                    the first two refers the resolver onward <C ids={['rfc1034']} at="§4.1" />
                                    .
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask="Nothing is stored, and the last server does not have the name. How many servers were asked, and what comes back?"
                            >
                                <p>
                                    Three servers were asked. No address comes back. The specification also
                                    says to store that name error <C ids={['rfc1034']} at="§5.3.3" />. This
                                    run does not play the next lookup.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>Say why a stored answer never leaves the resolver.</li>
                        <li>
                            Put root, the TLD, and the authoritative server in the order a miss walks them.
                        </li>
                        <li>
                            Predict no address when the name is missing, and that the walk still happened.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#dns">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 5,{' '}
                        <Link href="/learn/tcp">TCP: reliable streams over unreliable packets</Link>.
                        Previous: <Link href="/learn/ip-and-ports">chapter 3</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
