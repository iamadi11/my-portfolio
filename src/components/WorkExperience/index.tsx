'use client';

import React from 'react';

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
    <div className="size-full p-6 shadow-lg">
        <div className="mb-8 text-3xl font-extrabold">Work experience</div>
        <div className="flex flex-col gap-10">
            {roles.map((role) => (
                <section key={`${role.company}-${role.range}`}>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
                        <div>
                            <div className="text-xl font-bold text-gray-400">{role.title}</div>
                            <div className="text-lg font-semibold text-gray-500">{role.company}</div>
                        </div>
                        <div>
                            <div className="text-base text-gray-600 md:text-right">{role.range}</div>
                            <div className="text-sm text-gray-600 md:text-right">{role.location}</div>
                        </div>
                    </div>
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-300">
                        {role.bullets.map((b) => (
                            <li key={b}>{b}</li>
                        ))}
                    </ul>
                    <p className="mt-3 text-xs text-gray-500">
                        <span className="font-semibold text-gray-400">Tech:</span> {role.tech}
                    </p>
                    <div className="mt-6 h-px w-full bg-gray-600/80" />
                </section>
            ))}
        </div>
    </div>
);

export default WorkExperience;
