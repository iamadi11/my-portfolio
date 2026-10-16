import type { SiteContent } from '@/content/types';

/**
 * Content for the whole site (Aditya Raj). Every value traces to SOURCE_OF_TRUTH.md:
 * resume → LinkedIn (export of 2026-10-17) → GitHub, plus the owner's own word for the current role.
 * On a conflict the resume wins. Leave a field out rather than guess; the page drops empty sections.
 */
export const SITE: SiteContent = {
    profile: {
        name: 'Aditya Raj',
        role: 'Senior Software Development Engineer',
        statement:
            '5+ years building fast, scalable web products for fintech and e-commerce: React, Next.js and Node.js at Tata 1mg and Cashfree, including a self-serve fraud rule engine used by 200+ merchants.',
        location: 'Bengaluru, India',
        status: 'Now at Amby Tech',
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
            summary:
                'Never lose a write: a durable client-mutation queue for unreliable networks (IndexedDB replay, idempotency keys), published on npm.',
            stack: ['TypeScript', 'Service Workers', 'IndexedDB', 'React'],
            links: [
                { label: 'Code', href: 'https://github.com/sweidos/eidos' },
                { label: 'Docs', href: 'https://sweidos.vercel.app' },
                { label: 'npm', href: 'https://www.npmjs.com/package/@sweidos/eidos' },
            ],
            hue: 'green',
        },
        {
            id: 'mcp-ui',
            title: 'MCP UI studio',
            summary:
                'A chat-first studio where a message (and an optional API URL) becomes a versioned, publishable UI widget.',
            stack: ['React', 'Node', 'Redis', 'MongoDB'],
            links: [
                { label: 'Code', href: 'https://github.com/iamadi11/mcp-ui-poc' },
                { label: 'Live', href: 'https://mcp-ui-poc.vercel.app/' },
            ],
            hue: 'red',
        },
        {
            id: 'spatial',
            title: 'Spatial',
            summary:
                'Detects UI performance anti-patterns in a running app from render counts, layout shifts, FPS and memory.',
            stack: ['TypeScript', 'React', 'Vitest'],
            links: [
                { label: 'Code', href: 'https://github.com/iamadi11/spatial' },
                { label: 'Live', href: 'https://spatial-zeta.vercel.app/' },
            ],
            hue: 'blue',
        },
        {
            id: 'sidecar',
            title: 'Sidecar',
            summary:
                'Progressive image loading: a build step emits a tiny binary sidecar per image, and a runtime targeting under 1 KB loads it in phases.',
            stack: ['TypeScript', 'Node.js', 'React'],
            links: [{ label: 'Code', href: 'https://github.com/iamadi11/progressive-image' }],
            hue: 'ink',
        },
        {
            id: 'video-light-sync',
            title: 'Video Light Sync',
            summary:
                'Syncs what is on screen to Yeelight and WLED smart lights in real time, through a local Electron hub.',
            stack: ['TypeScript', 'React', 'Electron', 'WebSockets'],
            links: [{ label: 'Code', href: 'https://github.com/iamadi11/video-light-sync' }],
            hue: 'amber',
        },
    ],
    practice: {
        impact: [
            { value: '200+', label: 'Merchants changing fraud rules without a redeploy · Cashfree Payments' },
            { value: '70% → 15%', label: 'SLA breaches after real-time notifications · Tata 1mg' },
            { value: '15 → 3 min', label: 'Production build time · Tata 1mg' },
            { value: '−30%', label: 'Video KYC session drop-offs · Cashfree Payments' },
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
                org: 'Amby Tech',
                role: 'Senior Software Development Engineer',
                period: 'Jul 2026 – now',
            },
            {
                org: 'Cashfree Payments',
                role: 'Frontend Engineer II',
                period: 'Mar 2025 – May 2026',
                location: 'Bengaluru',
                stack: 'React, TypeScript, Zustand, Redux, Storybook, Figma, REST APIs',
                highlights: [
                    'Led front-end development of the Risk WebApp (React, TypeScript) serving 200+ enterprise merchants processing millions of transactions per month.',
                    'Architected a schema-driven, micro-frontend fraud rule engine that lets merchants configure transaction-blocking rules at runtime, with no redeploys.',
                    'Reduced Video KYC session drop-offs by 30% with a resilient reconnection state machine (exponential backoff) for low-bandwidth mobile users.',
                    "Built Cashmere, Cashfree's React design system (Storybook, Figma), with backward-compatible primitives and CLI scaffolding reused across product teams.",
                ],
            },
            {
                org: 'Moresand Technologies',
                role: 'Software Engineer',
                period: 'Aug 2024 – Mar 2025',
                location: 'Bengaluru',
                stack: 'React, TypeScript, Next.js, React Query, Tailwind CSS, Node.js, Express.js',
                highlights: [
                    'Led migration of a legacy Backbone.js/.NET admin dashboard to React and TypeScript with component tests and CI, accelerating feature delivery 3×.',
                    'Built Next.js (SSR) features with Tailwind CSS, React Query and Node/Express APIs for field-operations users.',
                    'Implemented a PWA architecture with offline capabilities, improving page load time by 50%.',
                ],
            },
            {
                org: 'Tata 1mg',
                role: 'Software Development Engineer II',
                period: 'Apr 2023 – Jul 2024',
                location: 'Gurugram',
                stack: 'React, Node.js, Turborepo',
                highlights: [
                    'Consolidated multiple frontend codebases into a Turborepo monorepo, cutting CI/CD deployment time by 30%.',
                    'Built a centralized Node.js PDF microservice with versioned templates, replacing 5+ client-side invoice generators and reducing code duplication by 60%.',
                ],
            },
            {
                org: 'Tata 1mg',
                role: 'Software Development Engineer I',
                period: 'Dec 2021 – Mar 2023',
                location: 'Gurugram',
                stack: 'React, Node.js, Express.js, Webpack 5, Redis, Google Maps API',
                highlights: [
                    'Engineered a Google Maps delivery-area configurator: ops draw polygon zones across 20+ cities, enabling 15-minute and 1-hour delivery.',
                    'Implemented real-time notifications (WebPush, Redis pub/sub, SSE) for warehouse staff, cutting SLA breaches from 70% to 15%.',
                    'Optimized the build (Webpack 5, parallel minification): production builds 15 → 3 minutes, bundles 60% smaller, Lighthouse above 90 on key pages.',
                    'Built an offline-first warehouse inventory PWA (React, Node.js, service-worker caching), reducing manual entry errors by 45%.',
                ],
            },
            {
                org: 'o9 Solutions',
                role: 'Technical Consultant',
                period: 'Jun 2021 – Dec 2021',
                location: 'Bengaluru',
                stack: 'SSIS, MySQL',
                highlights: [
                    'Maintained and enhanced a client dashboard; processed and integrated reporting data with SSIS and MySQL.',
                ],
            },
        ],
        education: [
            {
                org: 'IIIT Lucknow',
                role: 'B.Tech, Information Technology',
                period: 'Aug 2017 – Jun 2021',
                location: 'Lucknow',
                highlights: ['CGPA 8.14/10'],
            },
        ],
    },
};
