import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import AcademyChapter from '@/components/learn/AcademyChapter';
import ChapterTabs from '@/components/learn/ChapterTabs';
import CourseShell from '@/components/learn/CourseShell';
import { ApiLab, ApiQuiz } from '@/components/learn/film/ApiPractice';
import LessonFilm from '@/components/learn/film/LessonFilm';
import { BLUEPRINTS, getAcademyLesson } from '@/content/learn/academy';
import { API_LESSONS, isApiLesson } from '@/content/learn/api-lessons';
import { LESSON_FILMS } from '@/content/learn/films';

export const dynamicParams = false;
export function generateStaticParams(): { chapter: string }[] {
    return [...Object.keys(API_LESSONS), ...BLUEPRINTS.map((lesson) => lesson.id)].map((chapter) => ({
        chapter,
    }));
}
export async function generateMetadata({
    params,
}: {
    params: Promise<{ chapter: string }>;
}): Promise<Metadata> {
    const { chapter } = await params;
    if (!isApiLesson(chapter)) {
        const academy = getAcademyLesson(chapter);
        return academy
            ? {
                  title: academy.chapter.title,
                  description: academy.question,
                  alternates: { canonical: `/learn/${chapter}` },
              }
            : {};
    }
    const lesson = API_LESSONS[chapter];
    return { title: lesson.title, description: lesson.lede, alternates: { canonical: `/learn/${chapter}` } };
}
export default async function Page({
    params,
}: {
    params: Promise<{ chapter: string }>;
}): Promise<React.JSX.Element> {
    const { chapter } = await params;
    if (!isApiLesson(chapter)) {
        const academy = getAcademyLesson(chapter);
        if (!academy) notFound();
        return (
            <CourseShell chapterId={chapter} crumbs={[{ label: `Chapter ${academy.chapter.order}` }]}>
                <AcademyChapter lesson={academy} />
            </CourseShell>
        );
    }
    const lesson = API_LESSONS[chapter];
    const film = LESSON_FILMS[chapter];
    return (
        <CourseShell chapterId={chapter} crumbs={[{ label: `Chapter ${lesson.number}` }]}>
            <article aria-labelledby="ch-h">
                <header className="ln-head">
                    <p className="ln-kicker">Chapter {lesson.number} · Interfaces & data</p>
                    <h1 id="ch-h" className="ln-h1">
                        {lesson.title}
                    </h1>
                    <p className="ln-lede">{lesson.lede}</p>
                    <p className="al-why">
                        {lesson.why}{' '}
                        <Link href={`/learn/${lesson.prereq[0]}`}>Before this: {lesson.prereq[1]} ↗</Link>
                    </p>
                </header>
                <ChapterTabs
                    learn={
                        <>
                            <LessonFilm film={film} />
                            <details className="ln-watch-depth">
                                <summary>Go deeper · terms, tradeoffs & limits</summary>
                                <p>{lesson.detail}</p>
                                <Link href={`/learn/sources#${chapter}`}>Read the primary sources ↗</Link>
                            </details>
                        </>
                    }
                    lab={<ApiLab lesson={lesson} film={film} />}
                    quiz={<ApiQuiz lesson={lesson} />}
                />
            </article>
        </CourseShell>
    );
}
