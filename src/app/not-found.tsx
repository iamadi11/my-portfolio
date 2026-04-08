import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Page not found',
    robots: { index: false, follow: true },
};

export default function NotFound(): React.JSX.Element {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-20 text-center">
            <div className="max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-10 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.75)] backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">404</p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Page not found
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                    This URL does not match any page on the site.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-xl border border-cyan-400/35 bg-gradient-to-r from-cyan-500/15 to-sky-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:border-cyan-300/50"
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
