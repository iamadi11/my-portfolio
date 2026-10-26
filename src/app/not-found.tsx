import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import { SITE } from '@/content/site';

export const metadata: Metadata = {
    title: {
        absolute: `Sheet not found · ${SITE.profile.name}`,
    },
    description: 'This URL is not part of the portfolio. Use the links below to go home or get in touch.',
    robots: { index: false, follow: true },
};

const linkClass =
    'inline-flex min-h-11 items-center whitespace-nowrap justify-center border-[1.2px] border-ink px-5 text-sm uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-paper';

/** A sheet with nothing on it: the dashed outline of a missing part, an X-box where it should be. */
function MissingPart(): React.JSX.Element {
    return (
        <svg viewBox="0 0 320 140" className="block h-auto w-full" aria-hidden="true">
            <defs>
                <pattern
                    id="nf-hatch"
                    width="6"
                    height="6"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                >
                    <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink-3)" strokeWidth="0.8" />
                </pattern>
            </defs>
            <rect x="40" y="24" width="240" height="92" rx="12" fill="url(#nf-hatch)" opacity="0.35" />
            <rect
                x="40"
                y="24"
                width="240"
                height="92"
                rx="12"
                fill="var(--paper)"
                fillOpacity="0.6"
                stroke="var(--ink)"
                strokeWidth="1.2"
                strokeDasharray="6 4"
            />
            <g stroke="var(--ink-2)" strokeWidth="0.8" fill="none">
                <rect x="120" y="46" width="80" height="48" />
                <line x1="120" y1="46" x2="200" y2="94" />
                <line x1="200" y1="46" x2="120" y2="94" />
            </g>
            <g stroke="var(--ink-3)" strokeWidth="0.6" strokeDasharray="10 3 2 3">
                <line x1="20" y1="70" x2="300" y2="70" />
                <line x1="160" y1="8" x2="160" y2="132" />
            </g>
            <circle
                cx="280"
                cy="24"
                r="14"
                fill="none"
                stroke="var(--ink-2)"
                strokeWidth="0.8"
                strokeDasharray="3 3"
            />
        </svg>
    );
}

export default function NotFound(): React.JSX.Element {
    return (
        <main
            id="main-content"
            tabIndex={-1}
            className="flex min-h-dvh items-center justify-center bg-paper px-4 py-16 text-ink"
        >
            <article className="w-full max-w-lg rounded-[16px] border-[1.2px] border-ink">
                <header className="flex items-center justify-between gap-4 border-b-[1.2px] border-ink px-6 py-4">
                    <h1 className="text-lg font-bold uppercase tracking-[0.14em]">Sheet not found</h1>
                    <span className="border-[1.2px] border-ink px-2 py-0.5 text-sm font-bold tabular-nums tracking-[0.08em]">
                        404
                    </span>
                </header>
                <div className="border-b border-rule p-6">
                    <MissingPart />
                </div>
                <div className="p-6">
                    <p className="text-[15px] leading-relaxed text-ink-2">
                        This URL is not a sheet in the set. Go back to the drawing set or get in touch.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link href="/" className={linkClass}>
                            Back to home
                        </Link>
                        <Link href="/#contact" className={linkClass}>
                            Contact
                        </Link>
                    </div>
                </div>
                <footer className="flex justify-between gap-4 border-t-[1.2px] border-ink px-6 py-3 text-xs uppercase tracking-[0.12em] text-ink-3">
                    <span>{SITE.profile.name}</span>
                    <span>Note 404</span>
                </footer>
            </article>
        </main>
    );
}
