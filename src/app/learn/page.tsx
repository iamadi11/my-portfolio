import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import CourseShell from '@/components/learn/CourseShell';
import { CHAPTER_ROUTES } from '@/content/learn/chapters';
import { readCurriculum } from '@/lib/learn/curriculum';

/**
 * /learn: the system design course index. The chapter list, stages and statuses are read at build time from
 * `docs/system-design/CURRICULUM.md`; built chapters are linked, the rest are listed as planned, never linked.
 */

export const metadata: Metadata = {
    title: 'System design, from zero',
    description:
        'An interactive system design course in progress: from what happens when you open a website to distributed systems, with every claim sourced.',
    alternates: { canonical: '/learn' },
};

const STATUS_LABEL: Record<string, string> = {
    planned: 'Planned',
    researched: 'Being written',
    authored: 'Written',
    implemented: 'Available',
    tested: 'Available',
    reviewed: 'Available',
    verified: 'Available',
};

export default function Page(): React.JSX.Element {
    const stages = readCurriculum();
    const all = stages.flatMap((s) => s.chapters);
    const built = all.filter((c) => CHAPTER_ROUTES[c.id]).length;
    return (
        <CourseShell>
            <header className="bp-sheet ln-head">
                <p className="ln-kicker">A course in progress</p>
                <h1 className="ln-h1">System design, from zero</h1>
                <p className="ln-lede">
                    How the systems behind websites and apps work, starting from what happens when you open a
                    page and building up to distributed systems and real design decisions. Factual claims cite
                    a source that was read, and design judgements are labelled as such; every number in a
                    figure comes from a tested model, and figures say so.
                </p>
                <p className="ln-lede">
                    {built} of {all.length} chapters can be read so far. Planned chapters are listed so you
                    can see where the course is going.
                </p>
            </header>

            <div className="ln-stages">
                {stages.map((s) => (
                    <details key={s.n} className="ln-stage" open={s.n === 1}>
                        <summary>
                            <span className="bp-nbox" aria-hidden="true">
                                {s.n}
                            </span>
                            <span>{s.name}</span>
                            <span className="ln-stage-count">
                                {s.chapters.length} {s.chapters.length === 1 ? 'chapter' : 'chapters'}
                            </span>
                        </summary>
                        <ol className="ln-chapters">
                            {s.chapters.map((c) => {
                                const href = CHAPTER_ROUTES[c.id];
                                return (
                                    <li key={c.id}>
                                        {href ? (
                                            <Link href={href}>{c.title}</Link>
                                        ) : (
                                            <span className="ln-plain">{c.title}</span>
                                        )}
                                        <span className="ln-state">
                                            {href ? 'Read now' : (STATUS_LABEL[c.status] ?? c.status)}
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>
                    </details>
                ))}
            </div>
        </CourseShell>
    );
}
