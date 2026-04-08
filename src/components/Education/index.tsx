'use client';

import React from 'react';

import clsx from 'clsx';

const Education: React.FC = () => (
    <section
        aria-labelledby="education-heading"
        className={clsx(
            'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.75)]',
            'backdrop-blur-sm sm:p-8'
        )}
    >
        <h2 id="education-heading" className="mb-8 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Education
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
            <div>
                <h3 className="text-xl font-semibold text-zinc-100">IIIT Lucknow</h3>
                <p className="mt-2 text-lg font-medium text-zinc-400">
                    B.Tech Information Technology — CGPA 8.14/10
                </p>
            </div>
            <div>
                <p className="text-base text-zinc-500 md:text-right">Aug 2017 – Jun 2021</p>
                <p className="text-sm text-zinc-600 md:text-right">Lucknow, Uttar Pradesh</p>
            </div>
        </div>
    </section>
);

export default Education;
