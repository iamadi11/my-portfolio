'use client';

import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';

import type { Blueprint } from '@/content/learn/academy';

const Practice = lazy(() => import('./AcademyPractice').then((module) => ({ default: module.AcademyLab })));

/** A hidden Explore panel should not download every experiment engine before the learner needs it. */
export default function DeferredAcademyLab({ lesson }: { lesson: Blueprint }): React.JSX.Element {
    const target = useRef<HTMLDivElement>(null);
    const [needed, setNeeded] = useState(false);
    useEffect(() => {
        if (!target.current) return undefined;
        if (!('IntersectionObserver' in window)) {
            setNeeded(true);
            return undefined;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setNeeded(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '160px' }
        );
        observer.observe(target.current);
        return () => observer.disconnect();
    }, []);
    const pending = <p role="status">Preparing your experiment…</p>;
    return (
        <div ref={target}>
            {needed ? (
                <Suspense fallback={pending}>
                    <Practice lesson={lesson} />
                </Suspense>
            ) : (
                pending
            )}
        </div>
    );
}
