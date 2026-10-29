import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import CourseCatalog from '@/components/learn/CourseCatalog';
import CourseShell from '@/components/learn/CourseShell';
import LessonFilm from '@/components/learn/film/LessonFilm';
import { CHAPTER_ROUTES } from '@/content/learn/chapters';
import { LESSON_FILMS } from '@/content/learn/films';
import { readCurriculum } from '@/lib/learn/curriculum';

export const metadata: Metadata = {
    title: 'System design, made visible',
    description:
        'Learn system design from zero through short 3D explainers, hands-on experiments and questions that make the ideas stick.',
    alternates: { canonical: '/learn' },
};
export default function Page(): React.JSX.Element {
    const stages = readCurriculum();
    const total = stages.reduce((sum, s) => sum + s.chapters.length, 0);
    const built = Object.keys(CHAPTER_ROUTES).length;
    return (
        <CourseShell>
            <header className="lc-hero">
                <p className="lc-overline">
                    <span className="lc-dot" /> THE VISUAL SYSTEM DESIGN COURSE
                </p>
                <div className="lc-hero-grid">
                    <div>
                        <h1>
                            System design.
                            <br />
                            <span>Made visible.</span>
                        </h1>
                        <p>
                            See the invisible work behind every app.
                            <br />
                            Watch it happen. Change something. Understand why.
                        </p>
                        <div className="lc-hero-actions">
                            <Link className="lc-start" href="/learn/web-request">
                                Start from zero <span>↗</span>
                            </Link>
                            <a href="#course-map">Explore the course ↓</a>
                        </div>
                    </div>
                    <aside className="lc-hero-note">
                        <span className="lc-edition">A FIRST-PRINCIPLES FIELD GUIDE</span>
                        <div>
                            <strong>{String(built).padStart(2, '0')}</strong>
                            <span>
                                visual lessons available
                                <br />
                                of {total} on the roadmap
                            </span>
                        </div>
                        <p>
                            No system design experience needed.
                            <br />
                            Build your intuition, one mechanism at a time.
                        </p>
                    </aside>
                </div>
            </header>
            <div className="lc-featured-heading">
                <span>01 / PRESS ENTER. THEN WHAT?</span>
                <span>Preview your first lesson</span>
            </div>
            <LessonFilm film={LESSON_FILMS['web-request']} />
            <div className="lc-method">
                <span>
                    <b>01</b> Watch the mechanism
                </span>
                <span>
                    <b>02</b> Test your prediction
                </span>
                <span>
                    <b>03</b> Explain it yourself
                </span>
            </div>
            <CourseCatalog stages={stages} routes={CHAPTER_ROUTES} />
            <footer className="lc-footer">
                <span>A course in progress. Depth grows with the roadmap.</span>
                <Link href="/learn/sources">Primary sources & teaching assumptions ↗</Link>
            </footer>
        </CourseShell>
    );
}
