import type { SiteContent } from '@/content/types';

/**
 * Content for / (Aditya Raj). Every value traces to SOURCE_OF_TRUTH.md: resume → LinkedIn → GitHub.
 * Role highlights, tech and locations are the resume bullets (same text as /about).
 * Leave a field out rather than guess; the page drops empty sections.
 */
export const SITE: SiteContent = {
    profile: {
        name: 'Aditya Raj',
        role: 'Senior Software Development Engineer',
        statement:
            '~4.5+ years building scalable web apps in fintech, e-commerce, and enterprise. React, Next.js and TypeScript, with a focus on performance and production systems.',
        location: 'Bengaluru, India',
        availability: 'Open to new roles',
        email: 'adityaraj92.20@gmail.com',
        phone: { label: '+91 72578 07070', href: 'tel:+917257807070' },
        links: [
            { label: 'GitHub', href: 'https://github.com/iamadi11' },
            { label: 'LinkedIn', href: 'https://www.linkedin.com/in/adityaraj11/' },
        ],
    },
    projects: [
        {
            id: 'eidos',
            title: 'Eidos',
            summary: 'A declarative offline-first abstraction layer for Service Workers.',
            stack: ['TypeScript', 'Service Workers'],
            links: [
                { label: 'Code', href: 'https://github.com/iamadi11/eidos' },
                { label: 'Live', href: 'https://playground-iamadi11s-projects.vercel.app/' },
                { label: 'npm', href: 'https://www.npmjs.com/package/@sweidos/eidos' },
            ],
            hue: 'blue',
        },
        {
            id: 'mcp-ui',
            title: 'mcp-ui',
            summary: 'A dynamic MCP UI generator, built as a full-stack MCP UI demo.',
            stack: ['React', 'Vite', 'Node', 'Express'],
            links: [
                { label: 'Code', href: 'https://github.com/iamadi11/mcp-ui-poc' },
                { label: 'Live', href: 'https://mcp-ui-poc.vercel.app/' },
            ],
            hue: 'red',
        },
        {
            id: 'spatial',
            title: 'spatial',
            summary:
                'A client-side UI performance optimizer that detects UI performance problems at dev time.',
            stack: ['TypeScript', 'Vitest'],
            links: [
                { label: 'Code', href: 'https://github.com/iamadi11/spatial' },
                { label: 'Live', href: 'https://spatial-zeta.vercel.app/' },
            ],
            hue: 'green',
        },
        {
            id: 'mouse-follow',
            title: 'Mouse Follow',
            summary: 'A mouse-follow component for React.',
            stack: ['React'],
            links: [
                { label: 'Code', href: 'https://github.com/iamadi11/mouse-follow' },
                { label: 'Live', href: 'https://mouse-follow-demo.vercel.app/' },
            ],
            hue: 'ink',
        },
    ],
    practice: {
        impact: [
            { value: '15 → 3 min', label: 'Frontend build time · Tata 1mg' },
            { value: '70% → 15%', label: 'SLA breaches after real-time notifications · Tata 1mg' },
            { value: '−30%', label: 'Video KYC failure rate · Cashfree Payments' },
            { value: '3×', label: 'Faster feature development after the React migration · Moresand' },
        ],
        skills: [
            { group: 'Languages', items: 'JavaScript (ES2022+), TypeScript' },
            {
                group: 'Frontend',
                items: 'React, Next.js, Zustand, React Query, Tailwind CSS, Radix UI, PWA, Storybook, Micro-frontends',
            },
            {
                group: 'Performance',
                items: 'Webpack 5, Code Splitting, Tree Shaking, Core Web Vitals, Lighthouse, Service Workers',
            },
            {
                group: 'Backend & Infra',
                items: 'Python, Node.js, Express.js, Redis, SSE, WebPush, PostgreSQL, Turborepo, Docker',
            },
            {
                group: 'Testing & Tooling',
                items: 'Jest, React Testing Library, Playwright, Git, GitHub Actions, Figma, pnpm workspaces',
            },
        ],
        experience: [
            {
                org: 'Cashfree Payments',
                role: 'Frontend Engineer II',
                period: 'Mar 2025 – May 2026',
                location: 'Bengaluru',
                stack: 'React, TypeScript, Zustand, Semantic UI, REST APIs',
                highlights: [
                    'Own and maintain Risk WebApp platform serving enterprise merchants processing millions of transactions per month.',
                    'Architected configurable rule engine for real-time transaction blocking and flagging based on amount, velocity, and risk signals.',
                    'Enhanced Video KYC platform reliability with robust reconnection flows, reducing failure rates by 30%.',
                ],
            },
            {
                org: 'Moresand Technologies',
                role: 'Software Engineer',
                period: 'Aug 2024 – Mar 2025',
                location: 'Bengaluru',
                stack: 'React, Next.js, React Query, Tailwind CSS, Node.js, Express.js',
                highlights: [
                    'Led migration of legacy back-office to React-based architecture with improved test coverage, enabling 3x faster feature development.',
                    'Implemented PWA architecture with offline capabilities, improving page load time by 50%.',
                ],
            },
            {
                org: 'Tata 1mg',
                role: 'Software Development Engineer I → II',
                period: 'Dec 2021 – Jul 2024',
                location: 'Gurugram',
                stack: 'React, Node.js, Express.js, Webpack, Redis, Google Maps API, Turborepo',
                highlights: [
                    'Engineered polygon-based serviceability engine using React.js and Google Maps API, enabling 15-minute and 1-hour delivery zones.',
                    'Implemented real-time notifications using WebPush, Redis, and SSE, reducing SLA breaches from 70% to 15%.',
                    'Optimized frontend build pipeline, reducing build time from 15 minutes to 3 minutes (80% reduction).',
                    'Architected centralized Node.js microservice for invoice PDF generation, reducing code duplication by 60%.',
                    'Implemented PWA for inventory management, reducing manual errors by 45%.',
                    'Consolidated repositories into monorepo architecture with Turborepo, reducing deployment time by 30%.',
                ],
            },
        ],
        education: [
            {
                org: 'IIIT Lucknow',
                role: 'B.Tech, Information Technology',
                period: 'Aug 2017 – Jun 2021',
                highlights: ['CGPA 8.14/10'],
            },
        ],
    },
};
