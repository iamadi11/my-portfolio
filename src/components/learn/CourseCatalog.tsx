'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import type { Stage } from '@/lib/learn/curriculum';

export default function CourseCatalog({
    stages,
    routes,
}: {
    stages: Stage[];
    routes: Readonly<Record<string, string>>;
}): React.JSX.Element {
    const [path, setPath] = useState('beginner');
    const [watched, setWatched] = useState<string[]>([]);
    useEffect(() => {
        const refresh = (): void => {
            try {
                setWatched(
                    Object.keys(routes).filter((id) => localStorage.getItem(`learn-watched:${id}`) === '1')
                );
            } catch {
                /* Optional progress storage. */
            }
        };
        refresh();
        window.addEventListener('learn-progress', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('learn-progress', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, [routes]);
    return (
        <section className="lc-catalog" id="course-map" aria-labelledby="map-title">
            <div className="lc-map-heading">
                <div>
                    <p className="ln-kicker">Your learning path</p>
                    <h2 id="map-title">Small lessons. A bigger picture.</h2>
                </div>
                <span>{watched.length} films watched on this device</span>
            </div>
            <div className="lc-filter" role="group" aria-label="Learning path">
                {[
                    ['beginner', 'Start from zero'],
                    ['interview', 'Interview prep'],
                    ['production', 'Build for production'],
                    ['all', 'All chapters'],
                ].map(([id, label]) => (
                    <button type="button" key={id} aria-pressed={path === id} onClick={() => setPath(id)}>
                        {label}
                    </button>
                ))}
            </div>
            <div className="ln-stages">
                {stages.map((stage) => {
                    const chapters = stage.chapters.filter((c) => path === 'all' || c.paths.includes(path));
                    if (!chapters.length) return null;
                    return (
                        <details key={`${path}-${stage.n}`} className="ln-stage" open={stage.n <= 2}>
                            <summary>
                                <span className="lc-stage-number">{String(stage.n).padStart(2, '0')}</span>
                                <span>{stage.name}</span>
                                <span className="ln-stage-count">{chapters.length} lessons</span>
                            </summary>
                            <ol className="ln-chapters">
                                {chapters.map((chapter) => (
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
                                            {watched.includes(chapter.id)
                                                ? 'Watched ✓'
                                                : routes[chapter.id]
                                                  ? 'Watch →'
                                                  : 'Planned'}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </details>
                    );
                })}
            </div>
        </section>
    );
}
