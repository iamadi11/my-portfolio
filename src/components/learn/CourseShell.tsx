import React from 'react';

import Link from 'next/link';

import CourseTheme from './CourseTheme';

import './learn.css';

/**
 * Page chrome for /learn: a plain link back to the drawing set, the course breadcrumb, and the skip-link target.
 * Server component; the course pages ship no script except their own interactive figures.
 */
export default function CourseShell({
    crumbs,
    children,
}: {
    /** Trail after "System design", e.g. [{ label: 'Chapter 1' }]. The last one is the current page. */
    crumbs?: { label: string; href?: string }[];
    children: React.ReactNode;
}): React.JSX.Element {
    return (
        <div className="ln">
            <script
                dangerouslySetInnerHTML={{
                    __html: `(function(){try{var t=localStorage.getItem('learn-theme');document.documentElement.dataset.courseTheme=(t==='light'||t==='dark')?t:'system'}catch(e){}})()`,
                }}
            />
            <header className="ln-bar">
                <nav aria-label="Breadcrumb">
                    <ol className="ln-crumbs">
                        <li>
                            <Link href="/">Aditya Raj</Link>
                        </li>
                        <li>
                            {crumbs?.length ? (
                                <Link href="/learn">System design</Link>
                            ) : (
                                <span aria-current="page">System design</span>
                            )}
                        </li>
                        {crumbs?.map((c, i) => (
                            <li key={c.label}>
                                {c.href && i < crumbs.length - 1 ? (
                                    <Link href={c.href}>{c.label}</Link>
                                ) : (
                                    <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                                        {c.label}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
                <div className="ln-bar-tools">
                    <CourseTheme />
                    {crumbs?.some((c) => c.label === 'Sources') ? (
                        <span className="ln-note" aria-current="page">
                            Sources
                        </span>
                    ) : (
                        <Link href="/learn/sources" className="ln-note">
                            Sources
                        </Link>
                    )}
                </div>
            </header>
            <main id="main-content" tabIndex={-1}>
                {children}
            </main>
        </div>
    );
}
