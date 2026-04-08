'use client';

import React, { useEffect } from 'react';

import Link from 'next/link';

type ErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function Error({ error, reset }: ErrorProps): React.JSX.Element {
    useEffect(() => {
        // eslint-disable-next-line no-console -- client error boundary diagnostics
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-20 text-center">
            <div
                className="max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-10 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.75)] backdrop-blur-md"
                role="alert"
                aria-live="assertive"
            >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Error</p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Something went wrong
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                    A client-side error interrupted this page. You can try again or return home.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                    <button
                        type="button"
                        onClick={() => reset()}
                        className="inline-flex items-center justify-center rounded-xl border border-cyan-400/35 bg-gradient-to-r from-cyan-500/15 to-sky-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:border-cyan-300/50"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="border-white/12 inline-flex items-center justify-center rounded-xl border bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
                    >
                        Back to home
                    </Link>
                    <Link
                        href="/contact"
                        className="border-white/12 inline-flex items-center justify-center rounded-xl border bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
                    >
                        Contact
                    </Link>
                </div>
            </div>
        </div>
    );
}
