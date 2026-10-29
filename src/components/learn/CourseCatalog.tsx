'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import type { Stage } from '@/lib/learn/curriculum';

type Progress = Record<string, { viewed: boolean; practiced: boolean; recalled: boolean }>;
export default function CourseCatalog({
    stages,
    routes,
}: {
    stages: Stage[];
    routes: Readonly<Record<string, string>>;
}): React.JSX.Element {
    const [path, setPath] = useState('beginner');
    const [query, setQuery] = useState('');
    const [progress, setProgress] = useState<Progress>({});
    const [resume, setResume] = useState('');
    useEffect(() => {
        const refresh = (): void => {
            try {
                setProgress(
                    Object.fromEntries(
                        Object.keys(routes).map((id) => [
                            id,
                            {
                                viewed: localStorage.getItem(`learn-watched:${id}`) === '1',
                                practiced: localStorage.getItem(`learn-practiced:${id}`) === '1',
                                recalled: localStorage.getItem(`learn-recalled:${id}`) === '1',
                            },
                        ])
                    )
                );
                setResume(localStorage.getItem('learn-last-chapter') ?? '');
            } catch {
                /* Optional local progress. */
            }
        };
        try {
            const saved = localStorage.getItem('learn-path');
            if (['beginner', 'interview', 'production', 'all'].includes(saved ?? '')) setPath(saved!);
        } catch {
            /* Optional preference. */
        }
        refresh();
        window.addEventListener('learn-progress', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('learn-progress', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, [routes]);
    const counts = Object.values(progress);
    const all = stages.flatMap((stage) => stage.chapters);
    const resumeChapter = all.find((chapter) => chapter.id === resume);
    const search = query.trim().toLowerCase();
    const matches = (chapter: Stage['chapters'][number]): boolean =>
        search
            ? `${chapter.title} ${chapter.id}`.toLowerCase().includes(search)
            : path === 'all' || chapter.paths.includes(path);
    const found = all.filter(matches).length;
    return (
        <section className="lc-catalog" id="course-map" aria-labelledby="map-title">
            <div className="lc-map-heading">
                <div>
                    <p className="ln-kicker">Your learning path</p>
                    <h2 id="map-title">Small lessons. A bigger picture.</h2>
                </div>
                <span>
                    {counts.filter((p) => p.viewed).length} viewed ·{' '}
                    {counts.filter((p) => p.practiced).length} practiced ·{' '}
                    {counts.filter((p) => p.recalled).length} recall checked
                </span>
            </div>
            <p className="lc-progress-note">
                Progress stays on this device. These signals record activity, not mastery.{' '}
                {resumeChapter && routes[resume] && (
                    <Link href={routes[resume]}>Continue: {resumeChapter.title} →</Link>
                )}
            </p>
            <label className="lc-search">
                Find a topic across all {all.length} lessons
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Try caching, databases or capstone"
                />
            </label>
            <div className="lc-filter" role="group" aria-label="Learning path">
                {(
                    [
                        ['beginner', 'Start from zero'],
                        ['interview', 'Interview prep'],
                        ['production', 'Build for production'],
                        ['all', 'All chapters'],
                    ] as const
                ).map(([id, label]) => (
                    <button
                        type="button"
                        key={id}
                        aria-pressed={path === id}
                        onClick={() => {
                            setPath(id);
                            setQuery('');
                            try {
                                localStorage.setItem('learn-path', id);
                            } catch {
                                /* Optional. */
                            }
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <p aria-live="polite">
                {found} {found === 1 ? 'lesson' : 'lessons'}{' '}
                {search ? 'matching your search' : 'in this path'}.
            </p>
            <div className="ln-stages">
                {stages.map((stage) => {
                    const chapters = stage.chapters.filter(matches);
                    if (!chapters.length) return null;
                    return (
                        <details
                            key={`${path}-${search}-${stage.n}`}
                            className="ln-stage"
                            open={Boolean(search) || stage.n <= 2}
                        >
                            <summary>
                                <span className="lc-stage-number">{String(stage.n).padStart(2, '0')}</span>
                                <span>{stage.name}</span>
                                <span className="ln-stage-count">
                                    {chapters.length} {chapters.length === 1 ? 'lesson' : 'lessons'}
                                </span>
                            </summary>
                            <ol className="ln-chapters">
                                {chapters.map((chapter) => {
                                    const p = progress[chapter.id];
                                    return (
                                        <li key={chapter.id}>
                                            <span className="lc-chapter-number">
                                                {String(chapter.order).padStart(2, '0')}
                                            </span>
                                            {routes[chapter.id] ? (
                                                <Link href={routes[chapter.id]}>{chapter.title}</Link>
                                            ) : (
                                                <span className="ln-plain">{chapter.title}</span>
                                            )}
                                            <span className="ln-state">
                                                {p?.recalled
                                                    ? 'Recall checked ✓'
                                                    : p?.practiced
                                                      ? 'Practiced ✓'
                                                      : p?.viewed
                                                        ? 'Viewed ✓'
                                                        : routes[chapter.id]
                                                          ? 'Open lesson →'
                                                          : 'Planned'}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ol>
                        </details>
                    );
                })}
            </div>
        </section>
    );
}
