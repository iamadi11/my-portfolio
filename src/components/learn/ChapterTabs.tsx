'use client';

import React, { useId, useRef, useState } from 'react';

/**
 * Learn, Interactive Lab, Quiz. One chapter, three jobs. Inactive panels stay mounted so a lab's
 * inputs survive a tab change, and they are hidden from the accessibility tree.
 */

const TABS = [
    { id: 'learn', label: 'Learn' },
    { id: 'lab', label: 'Interactive Lab' },
    { id: 'quiz', label: 'Quiz' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ChapterTabs({
    learn,
    lab,
    quiz,
}: {
    learn: React.ReactNode;
    lab: React.ReactNode;
    quiz: React.ReactNode;
}): React.JSX.Element {
    const [tab, setTab] = useState<TabId>('learn');
    const base = useId();
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);
    const panels = { learn, lab, quiz };

    const select = (index: number): void => {
        const next = (index + TABS.length) % TABS.length;
        setTab(TABS[next].id);
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
                            onClick={() => setTab(item.id)}
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
