'use client';

import React from 'react';

import clsx from 'clsx';

type Role = {
    title: string;
    company: string;
    range: string;
    location: string;
    bullets: string[];
    tech: string;
};

const roles: Role[] = [
    {
        title: 'Frontend Engineer II',
        company: 'Cashfree Payments',
        range: 'Mar 2025 – Present',
        location: 'Bengaluru, Karnataka',
        bullets: [
            'Own and maintain Risk WebApp platform serving enterprise merchants processing millions of transactions per month.',
            'Architected configurable rule engine for real-time transaction blocking and flagging based on amount, velocity, and risk signals.',
            'Enhanced Video KYC platform reliability with robust reconnection flows, reducing failure rates by 30%.',
        ],
        tech: 'React, TypeScript, Zustand, Semantic UI, REST APIs',
    },
    {
        title: 'Software Engineer III',
        company: 'Moresand Technologies',
        range: 'Aug 2024 – Mar 2025',
        location: 'Bengaluru, Karnataka',
        bullets: [
            'Led migration of legacy back-office to React-based architecture with improved test coverage, enabling 3x faster feature development.',
            'Implemented PWA architecture with offline capabilities, improving page load time by 50%.',
        ],
        tech: 'React, Next.js, React Query, Tailwind CSS, Node.js, Express.js',
    },
    {
        title: 'Software Development Engineer I–II',
        company: 'Tata 1mg',
        range: 'Dec 2021 – Jul 2024',
        location: 'Gurugram, Haryana',
        bullets: [
            'Engineered polygon-based serviceability engine using React.js and Google Maps API, enabling 15-minute and 1-hour delivery zones.',
            'Architected centralized Node.js microservice for invoice PDF generation, reducing code duplication by 60%.',
            'Implemented PWA for inventory management, reducing manual errors by 45%.',
            'Implemented real-time notifications using WebPush, Redis, and SSE, reducing SLA breaches from 70% to 15%.',
            'Optimized frontend build pipeline, reducing build time from 15 minutes to 3 minutes (80% reduction).',
            'Consolidated repositories into monorepo architecture with Turborepo, reducing deployment time by 30%.',
        ],
        tech: 'React, Node.js, Express.js, Webpack, Redis, Google Maps API, Turborepo',
    },
];

const WorkExperience: React.FC = () => (
    <section
        aria-labelledby="work-heading"
        className={clsx(
            'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.75)]',
            'backdrop-blur-sm sm:p-8'
        )}
    >
        <h2 id="work-heading" className="mb-10 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Work experience
        </h2>
        <div className="flex flex-col gap-12">
            {roles.map((role) => (
                <article
                    key={`${role.company}-${role.range}`}
                    className="border-b border-white/[0.06] pb-12 last:border-0 last:pb-0"
                >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
                        <div>
                            <h3 className="text-xl font-semibold text-zinc-100">{role.title}</h3>
                            <p className="mt-1 text-lg font-medium text-zinc-400">{role.company}</p>
                        </div>
                        <div>
                            <p className="text-base text-zinc-500 md:text-right">{role.range}</p>
                            <p className="text-sm text-zinc-600 md:text-right">{role.location}</p>
                        </div>
                    </div>
                    <ul className="mt-5 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-zinc-300 marker:text-cyan-500/80">
                        {role.bullets.map((b) => (
                            <li key={b}>{b}</li>
                        ))}
                    </ul>
                    <p className="mt-4 text-xs text-zinc-500">
                        <span className="font-semibold text-zinc-400">Tech:</span> {role.tech}
                    </p>
                </article>
            ))}
        </div>
    </section>
);

export default WorkExperience;
