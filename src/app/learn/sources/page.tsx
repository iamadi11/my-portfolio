import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import CourseShell from '@/components/learn/CourseShell';
import { SOURCE_CHAPTERS, sourceAnchor } from '@/content/learn/source-catalog';

/**
 * One bibliography for the course. Chapter pages keep numbered marks in the prose and link here.
 * The lists are the same records the chapters already cited; nothing new is added.
 */

export const metadata: Metadata = {
    title: 'Sources',
    description:
        'Sources for the system design course, grouped by chapter. The numbers match the marks in each chapter.',
    alternates: { canonical: '/learn/sources' },
};

export default function Page(): React.JSX.Element {
    return (
        <CourseShell crumbs={[{ label: 'Sources' }]}>
            <article aria-labelledby="src-h">
                <header className="bp-sheet ln-head">
                    <p className="ln-kicker">System design course</p>
                    <h1 id="src-h" className="ln-h1">
                        Sources
                    </h1>
                    <p className="ln-lede">
                        Every factual claim in a chapter points at a source that was read. The lists live
                        here, grouped by chapter, so a lesson does not end in a bibliography. A number in a
                        chapter matches the number in that chapter&rsquo;s list. The same document can be a
                        different number in the next chapter.
                    </p>
                </header>
                {SOURCE_CHAPTERS.map((chapter) => (
                    <section
                        key={chapter.id}
                        id={chapter.id}
                        className="ln-prose"
                        aria-labelledby={`${chapter.id}-h`}
                    >
                        <h2 id={`${chapter.id}-h`}>
                            <Link href={chapter.href}>{chapter.title}</Link>
                        </h2>
                        <p>{chapter.note}</p>
                        <ol className="ln-sources">
                            {chapter.sources.map((s) => (
                                <li
                                    key={s.id}
                                    id={sourceAnchor(chapter.id, s.id)}
                                    value={chapter.numbers[s.id]}
                                >
                                    <a href={s.url} rel="noreferrer">
                                        {s.title}
                                    </a>
                                    . {s.publisher}. <span className="ln-note">Read from {s.read}.</span>
                                </li>
                            ))}
                        </ol>
                    </section>
                ))}
            </article>
        </CourseShell>
    );
}
