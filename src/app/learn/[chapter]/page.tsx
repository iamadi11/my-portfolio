import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ChapterTabs from '@/components/learn/ChapterTabs';
import CourseShell from '@/components/learn/CourseShell';
import { ApiLab, ApiQuiz } from '@/components/learn/film/ApiPractice';
import LessonFilm from '@/components/learn/film/LessonFilm';
import { API_LESSONS, isApiLesson } from '@/content/learn/api-lessons';
import { LESSON_FILMS } from '@/content/learn/films';

export const dynamicParams = false;
export function generateStaticParams(): { chapter: string }[] {
    return Object.keys(API_LESSONS).map((chapter) => ({ chapter }));
}
export async function generateMetadata({
    params,
}: {
    params: Promise<{ chapter: string }>;
}): Promise<Metadata> {
    const { chapter } = await params;
    if (!isApiLesson(chapter)) return {};
    const lesson = API_LESSONS[chapter];
    return { title: lesson.title, description: lesson.lede, alternates: { canonical: `/learn/${chapter}` } };
}
export default async function Page({
    params,
}: {
    params: Promise<{ chapter: string }>;
}): Promise<React.JSX.Element> {
    const { chapter } = await params;
    if (!isApiLesson(chapter)) notFound();
    const lesson = API_LESSONS[chapter];
    const film = LESSON_FILMS[chapter];
    const next = { rest: 'rpc', rpc: 'graphql', graphql: 'realtime', realtime: 'idempotency' }[chapter];
    return (
        <CourseShell crumbs={[{ label: `Chapter ${lesson.number}` }]}>
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
                <footer className="al-next">
                    <Link href="/learn">← Course map</Link>
                    {isApiLesson(next) ? (
                        <Link href={`/learn/${next}`}>Next lesson →</Link>
                    ) : (
                        <span>Next in the roadmap: safe retries</span>
                    )}
                </footer>
            </article>
        </CourseShell>
    );
}
