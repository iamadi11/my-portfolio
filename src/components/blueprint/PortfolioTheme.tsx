'use client';

import React, { useEffect, useState } from 'react';

import { normalizeAppearance, type Appearance } from '@/lib/appearance';

export default function PortfolioTheme(): React.JSX.Element {
    const [theme, setTheme] = useState<Appearance>('system');
    useEffect(() => {
        const read = (): void => {
            try {
                const value = normalizeAppearance(localStorage.getItem('portfolio-theme'));
                setTheme(value);
                document.documentElement.dataset.portfolioTheme = value;
            } catch {
                setTheme('system');
                document.documentElement.dataset.portfolioTheme = 'system';
            }
        };
        read();
        window.addEventListener('storage', read);
        return () => window.removeEventListener('storage', read);
    }, []);
    return (
        <label className="portfolio-theme">
            <span className="sr-only">Portfolio appearance</span>
            <select
                aria-label="Portfolio appearance"
                value={theme}
                onChange={(event) => {
                    const value = normalizeAppearance(event.target.value);
                    setTheme(value);
                    document.documentElement.dataset.portfolioTheme = value;
                    try {
                        localStorage.setItem('portfolio-theme', value);
                    } catch {
                        /* Session appearance works. */
                    }
                }}
            >
                <option value="system">◐ System</option>
                <option value="light">☀ Light</option>
                <option value="dark">◑ Dark</option>
            </select>
        </label>
    );
}
