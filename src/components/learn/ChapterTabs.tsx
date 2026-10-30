'use client';

import React, { Suspense, useEffect, useId, useRef, useState } from 'react';

import { useSearchParams } from 'next/navigation';

/**
 * Learn, Explore, Assess. One chapter, three jobs. Inactive panels stay mounted so a lab's
 * inputs survive a tab change, and they are hidden from the accessibility tree.
 */

const TABS = [
    { id: 'learn', label: 'Learn' },
    { id: 'explore', label: 'Explore' },
    { id: 'assess', label: 'Assess' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** Keep server-rendered lesson content while only the URL observer needs a Suspense boundary. */
function TabFromUrl({ select }: { select: (tab: TabId) => void }): null {
    const params = useSearchParams();
    const value = params.get('tab');
    useEffect(() => {
        select(
            value === 'explore' || value === 'lab'
                ? 'explore'
                : value === 'assess' || value === 'quiz'
                  ? 'assess'
                  : 'learn'
        );
    }, [select, value]);
    return null;
}

export default function ChapterTabs({
    learn,
    film,
    lab,
    quiz,
}: {
    learn: React.ReactNode;
    film?: React.ReactNode;
    lab: React.ReactNode;
    quiz: React.ReactNode;
}): React.JSX.Element {
    const [tab, setTab] = useState<TabId>('learn');
    const base = useId();
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);
    const panels = {
        learn: film ? (
            <>
                {film}
                <details className="ln-watch-depth">
                    <summary>Go deeper · explanation, worked examples & original visual</summary>
                    {learn}
                </details>
            </>
        ) : (
            learn
        ),
        explore: lab,
        assess: quiz,
    };

    const change = (next: TabId): void => {
        setTab(next);
        const url = new URL(window.location.href);
        if (next === 'learn') url.searchParams.delete('tab');
        else url.searchParams.set('tab', next);
        window.history.replaceState(null, '', url);
    };
    const select = (index: number): void => {
        const next = (index + TABS.length) % TABS.length;
        change(TABS[next].id);
        buttons.current[next]?.focus();
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        const index = TABS.findIndex((item) => item.id === tab);
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            select(index + 1);
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            select(index - 1);
        } else if (event.key === 'Home') {
            event.preventDefault();
            select(0);
        } else if (event.key === 'End') {
            event.preventDefault();
            select(TABS.length - 1);
        }
    };

    return (
        <div className="ln-chapter-tabs">
            <Suspense fallback={null}>
                <TabFromUrl select={setTab} />
            </Suspense>
            <div role="tablist" aria-label="Chapter sections" onKeyDown={onKeyDown}>
                {TABS.map((item, index) => {
                    const selected = tab === item.id;
                    return (
                        <button
                            key={item.id}
                            ref={(node) => {
                                buttons.current[index] = node;
                            }}
                            type="button"
                            role="tab"
                            id={`${base}-${item.id}`}
                            aria-selected={selected}
                            aria-controls={`${base}-${item.id}-panel`}
                            tabIndex={selected ? 0 : -1}
                            className="ln-tab"
                            onClick={() => change(item.id)}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>
            {TABS.map((item) => (
                <div
                    key={item.id}
                    role="tabpanel"
                    id={`${base}-${item.id}-panel`}
                    aria-labelledby={`${base}-${item.id}`}
                    hidden={tab !== item.id}
                    className="ln-tabpanel"
                >
                    {panels[item.id]}
                </div>
            ))}
        </div>
    );
}
