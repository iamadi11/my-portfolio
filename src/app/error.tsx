'use client';

import React, { useEffect } from 'react';

import Link from 'next/link';

import { SITE } from '@/content/site';

type ErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

const actionClass =
    'inline-flex min-h-11 items-center whitespace-nowrap justify-center border-[1.2px] border-ink px-5 text-sm uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-paper';

/** A part that failed to draw: dashed outline broken by a cut line, X-box at its centre. */
function BrokenPart(): React.JSX.Element {
    return (
        <svg viewBox="0 0 320 140" className="block h-auto w-full" aria-hidden="true">
            <defs>
                <pattern
                    id="err-hatch"
                    width="6"
                    height="6"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                >
                    <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink-3)" strokeWidth="0.8" />
                </pattern>
            </defs>
            <rect x="40" y="24" width="240" height="92" rx="12" fill="url(#err-hatch)" opacity="0.35" />
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
            <path
                d="M24 106 L96 90 L112 104 L176 34 L196 50 L296 30"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="1.2"
            />
        </svg>
    );
}

export default function Error({ error, reset }: ErrorProps): React.JSX.Element {
    useEffect(() => {
        // eslint-disable-next-line no-console -- client error boundary diagnostics
        console.error(error);
    }, [error]);

    return (
        <main
            id="main-content"
            tabIndex={-1}
            className="flex min-h-dvh items-center justify-center bg-paper px-4 py-16 text-ink"
        >
            <article className="w-full max-w-lg rounded-[16px] border-[1.2px] border-ink" role="alert">
                <header className="flex items-center justify-between gap-4 border-b-[1.2px] border-ink px-6 py-4">
                    <h1 className="text-lg font-bold uppercase tracking-[0.14em]">Sheet failed to draw</h1>
                    <span className="border-[1.2px] border-ink px-2 py-0.5 text-sm font-bold tracking-[0.08em]">
                        ERR
                    </span>
                </header>
                <div className="border-b border-rule p-6">
                    <BrokenPart />
                </div>
                <div className="p-6">
                    <p className="text-[15px] leading-relaxed text-ink-2">
                        An error interrupted this page. Try drawing it again, or go back to the drawing set.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <button type="button" onClick={() => reset()} className={actionClass}>
                            Try again
                        </button>
                        <Link href="/" className={actionClass}>
                            Back to home
                        </Link>
                        <Link href="/#contact" className={actionClass}>
                            Contact
                        </Link>
                    </div>
                </div>
                <footer className="flex justify-between gap-4 border-t-[1.2px] border-ink px-6 py-3 text-xs uppercase tracking-[0.12em] text-ink-3">
                    <span>{SITE.profile.name}</span>
                    <span>Note ERR</span>
                </footer>
            </article>
        </main>
    );
}
