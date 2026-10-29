import React from 'react';

import Link from 'next/link';

import { CHAPTER_ROUTES } from '@/content/learn/chapters';
import { readCurriculum } from '@/lib/learn/curriculum';

export default function CourseChapterNav({ id }: { id: string }): React.JSX.Element | null {
    const chapters = readCurriculum().flatMap((stage) => stage.chapters),
        index = chapters.findIndex((chapter) => chapter.id === id);
    if (index < 0) return null;
    const current = chapters[index],
        previous = chapters[index - 1],
        next = chapters[index + 1];
    return (
        <nav className="ac-journey" aria-label="Course journey">
            <p>
                Lesson {current.order} of {chapters.length} · Practice builds understanding; watching alone is
                not a mastery check.
            </p>
            {Boolean(current.prerequisites?.length) && (
                <div className="ac-prereqs">
                    <span>Builds on</span>
                    {current.prerequisites?.map((key) => {
                        const chapter = chapters.find((item) => item.id === key);
                        return chapter && CHAPTER_ROUTES[key] ? (
                            <Link key={key} href={CHAPTER_ROUTES[key]}>
                                {chapter.title}
                            </Link>
                        ) : null;
                    })}
                </div>
            )}
            <div className="ac-journey-links">
                {previous ? (
                    <Link href={CHAPTER_ROUTES[previous.id]}>← {previous.title}</Link>
                ) : (
                    <Link href="/learn">← Course map</Link>
                )}
                {next ? (
                    <Link href={CHAPTER_ROUTES[next.id]}>{next.title} →</Link>
                ) : (
                    <Link href="/learn">Return to the full course map →</Link>
                )}
            </div>
        </nav>
    );
}
