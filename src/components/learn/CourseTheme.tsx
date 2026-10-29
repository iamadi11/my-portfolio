'use client';

import React, { useEffect, useState } from 'react';

type Theme = 'system' | 'light' | 'dark';
export default function CourseTheme({ chapterId }: { chapterId?: string }): React.JSX.Element {
    const [theme, setTheme] = useState<Theme>('system');
    useEffect(() => {
        try {
            const saved = localStorage.getItem('learn-theme');
            if (saved === 'light' || saved === 'dark' || saved === 'system') setTheme(saved);
        } catch {
            /* Optional preference storage. */
        }
    }, []);
    useEffect(() => {
        if (!chapterId) return;
        try {
            localStorage.setItem('learn-last-chapter', chapterId);
        } catch {
            /* Optional resume. */
        }
    }, [chapterId]);
    const change = (value: Theme) => {
        setTheme(value);
        document.documentElement.dataset.courseTheme = value;
        try {
            localStorage.setItem('learn-theme', value);
        } catch {
            /* Session theme still works. */
        }
    };
    return (
        <label className="ln-theme">
            <span className="sr-only">Course appearance</span>
            <select
                className="ln-theme-select"
                aria-label="Course appearance"
                value={theme}
                onChange={(e) => change(e.target.value as Theme)}
            >
                <option value="system">◐ System</option>
                <option value="light">☀ Light</option>
                <option value="dark">◑ Dark</option>
            </select>
        </label>
    );
}
