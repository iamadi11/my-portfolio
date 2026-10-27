import React from 'react';

import Link from 'next/link';

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
                <span className="ln-note">A course in progress</span>
            </header>
            <main id="main-content" tabIndex={-1}>
                {children}
            </main>
        </div>
    );
}
