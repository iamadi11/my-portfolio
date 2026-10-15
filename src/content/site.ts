import type { HostConfig } from '@/components/host/script';
import type { SiteContent } from '@/components/instrumented/content';

/**
 * Content for / (Aditya Raj). Every value traces to SOURCE_OF_TRUTH.md: resume → LinkedIn → GitHub.
 * Leave a field out rather than guess; the layout drops empty sections.
 */
export const SITE: SiteContent = {
    profile: {
        name: 'Aditya Raj',
        role: 'Senior Software Development Engineer',
        statement:
            '~4.5+ years building scalable web apps in fintech, e-commerce, and enterprise. React, Next.js and TypeScript, with a focus on performance and production systems.',
        location: 'Bengaluru, India',
        timeZone: 'Asia/Kolkata',
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
            mark: 'stack',
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
            mark: 'lattice',
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
            mark: 'wave',
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
            mark: 'orbit',
            hue: 'ink',
        },
    ],
    practice: {
        intro: 'Senior software engineer with ~4.5+ years building scalable web apps in fintech, e-commerce, and enterprise. Strong in React, Next.js and TypeScript, with a focus on performance and production systems.',
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
            { org: 'Cashfree Payments', role: 'Frontend Engineer II', period: 'Mar 2025 – May 2026' },
            { org: 'Moresand Technologies', role: 'Software Engineer', period: 'Aug 2024 – Mar 2025' },
            { org: 'Tata 1mg', role: 'Software Development Engineer II', period: 'Apr 2023 – Jul 2024' },
            { org: 'Tata 1mg', role: 'Software Development Engineer I', period: 'Dec 2021 – Mar 2023' },
        ],
        education: [
            { org: 'IIIT Lucknow', role: 'B.Tech, Information Technology', period: 'Aug 2017 – Jun 2021' },
        ],
    },
};

/** The 3D host on /v2. `npm run voice` pre-renders every line it can say. */
export const HOST: HostConfig = {
    avatar: '/avatar/aditya.zip',
    portrait: '/profile_pic.png',
    voice: 'am_michael',
    say: {
        'Tata 1mg': 'Tata one M G',
        'IIIT Lucknow': 'triple I T Lucknow',
        'mcp-ui': 'M C P U I',
        Moresand: 'More sand',
    },
};
