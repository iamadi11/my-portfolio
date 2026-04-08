'use client';

import React from 'react';

import clsx from 'clsx';

const Description: React.FC = () => (
    <section
        aria-labelledby="about-intro-heading"
        className={clsx(
            'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.75)]',
            'backdrop-blur-sm sm:p-8'
        )}
    >
        <h1
            id="about-intro-heading"
            className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
            About
        </h1>
        <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">
            Frontend engineer with ~4.5+ years building scalable web apps in fintech, e-commerce, and
            enterprise; strong React, Next.js, and TypeScript; performance and production systems focus.
        </p>
    </section>
);

export default Description;
