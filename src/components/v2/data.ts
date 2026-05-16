export const IDENTITY = {
    name: 'Aditya Raj',
    handle: 'iamadi11',
    title: 'Frontend Engineer II',
    company: 'Cashfree Payments',
    location: 'Bengaluru, IN',
    bio: 'Frontend engineer shipping production React / Next.js / TypeScript. Performance, PWAs, and the last 10% that makes UI feel real.',
    email: 'adityaraj92.20@gmail.com',
    phone: '+91 7257807070',
    linkedin: 'https://www.linkedin.com/in/adityaraj11/',
    github: 'https://github.com/iamadi11',
    yearsExp: 4.5,
} as const;

export interface TimelineStep {
    t: string;
    body: string;
}

export interface Metric {
    v: string;
    k: string;
}

export interface Project {
    id: string;
    title: string;
    subtitle: string;
    company: string;
    year: string;
    runtime: string;
    accent: string;
    accent2: string;
    glyph: string;
    pocKey: string;
    summary: string;
    metrics: Metric[];
    stack: string[];
    role: string;
    timeline: TimelineStep[];
    github?: string;
    demo?: string;
}

export const PROJECTS: Project[] = [
    {
        id: 'risk-engine',
        title: 'Risk Engine',
        subtitle: 'Real-time transaction blocking',
        company: 'Cashfree Payments',
        year: '2025',
        runtime: 'Architecture',
        accent: '#7aa2ff',
        accent2: '#b690ff',
        glyph: 'RX',
        pocKey: 'risk',
        summary:
            'Configurable rule engine ingesting millions of transactions/month, flagging or blocking suspicious activity in real time.',
        metrics: [
            { v: '~M/mo', k: 'transactions' },
            { v: '<120ms', k: 'p99 decision' },
            { v: '99.97%', k: 'rule eval uptime' },
        ],
        stack: ['React', 'TypeScript', 'Zustand', 'Semantic UI', 'REST'],
        role: 'Lead frontend, rule-engine architecture',
        timeline: [
            {
                t: 'Problem',
                body: 'Enterprise merchants needed merchant-configurable rules. Hardcoded checks meant a deploy for every new flag.',
            },
            {
                t: 'Constraints',
                body: 'Sub-200ms decision budget. Auditable rule changes. Non-engineers must build rules safely.',
            },
            {
                t: 'Architecture',
                body: 'AST-backed rule schema → React form layer → typed validators → server eval. Diff-based rule history.',
            },
            {
                t: 'Execution',
                body: 'Built drag-to-compose rule builder, dry-run mode, and replay against last 24h of traffic.',
            },
            {
                t: 'Impact',
                body: '30% fewer false flags after replay tooling. Average new-rule deploy: 2 days → 12 minutes.',
            },
        ],
    },
    {
        id: 'maps',
        title: 'Serviceability Maps',
        subtitle: 'Polygon delivery zones',
        company: 'Tata 1mg',
        year: '2024',
        runtime: 'Geospatial',
        accent: '#7ee5ff',
        accent2: '#7aa2ff',
        glyph: 'MZ',
        pocKey: 'maps',
        summary:
            "Polygon-based serviceability engine powering 15-min and 1-hour medicine delivery for India's largest e-pharmacy.",
        metrics: [
            { v: '15 min', k: 'fastest tier' },
            { v: '1 hr', k: 'standard tier' },
            { v: '120+', k: 'cities covered' },
        ],
        stack: ['React', 'Google Maps', 'Node', 'TypeScript'],
        role: 'Frontend lead, maps integration',
        timeline: [
            {
                t: 'Problem',
                body: 'Pin-radius zones produced false positives across rivers, restricted areas, and operationally unreachable zones.',
            },
            {
                t: 'Constraints',
                body: 'Same Google Maps quota. Editable by ops without engineer involvement. Mobile-perf budget.',
            },
            {
                t: 'Architecture',
                body: 'Polygon library + point-in-polygon tests. Tiered SLA polygons stacked: 15-min ⊂ 1-hr ⊂ standard.',
            },
            {
                t: 'Execution',
                body: 'Built ops dashboard with polygon editor, conflict resolution, and live preview against test addresses.',
            },
            {
                t: 'Impact',
                body: 'Express-tier coverage doubled with same fleet. Failed-delivery rate down materially in covered zones.',
            },
        ],
    },
    {
        id: 'realtime',
        title: 'Realtime Notifications',
        subtitle: 'Pulse network — WebPush + SSE',
        company: 'Tata 1mg',
        year: '2023',
        runtime: 'Realtime',
        accent: '#6ee7a7',
        accent2: '#7ee5ff',
        glyph: 'NS',
        pocKey: 'pulse',
        summary:
            'Realtime notifications for ops, riders, and CX — driving SLA breach signals from 70% to 15%.',
        metrics: [
            { v: '70 → 15%', k: 'SLA breaches' },
            { v: '<2s', k: 'signal latency' },
            { v: '4 ch.', k: 'WebPush · SSE · Redis · Email' },
        ],
        stack: ['Node', 'Redis', 'WebPush', 'SSE', 'React'],
        role: 'Frontend + realtime layer',
        timeline: [
            {
                t: 'Problem',
                body: 'Stale dashboards. Ops reacted to SLA breaches minutes after they happened.',
            },
            {
                t: 'Constraints',
                body: 'No long-polling: too expensive at scale. Reliable on flaky last-mile networks.',
            },
            {
                t: 'Architecture',
                body: 'Redis pub/sub fanout → SSE for dashboards, WebPush for mobile. Backpressure guard.',
            },
            {
                t: 'Execution',
                body: 'Service worker push + SSE channels with reconnect/backoff. Replay queue on reconnect.',
            },
            { t: 'Impact', body: 'SLA breach detection median 4m → 8s.' },
        ],
    },
    {
        id: 'spatial',
        title: 'Spatial',
        subtitle: 'Client-side UI performance optimizer',
        company: 'OSS · iamadi11/spatial',
        year: '2025',
        runtime: 'Tooling',
        accent: '#ffb070',
        accent2: '#ff8a8a',
        glyph: 'SP',
        pocKey: 'spatial',
        summary:
            'Deterministic, dev-time UI performance detection engine. Catches layout thrash & render hot-paths before code ships.',
        metrics: [
            { v: 'Vitest', k: 'strict TS' },
            { v: 'dev-time', k: 'zero prod cost' },
            { v: 'OSS', k: 'MIT' },
        ],
        stack: ['TypeScript', 'Vitest'],
        role: 'Sole author',
        timeline: [
            {
                t: 'Problem',
                body: 'Performance regressions slipped through PR review. Production was the canary.',
            },
            { t: 'Constraints', body: 'No production overhead. Must run in CI. Output must be actionable.' },
            {
                t: 'Architecture',
                body: 'Deterministic harness + heuristics for layout, paint, and JS-heavy renders.',
            },
            {
                t: 'Execution',
                body: 'TypeScript strict, Vitest test matrix, CLI report with file:line annotations.',
            },
            { t: 'Impact', body: 'Personal bench: caught 4 regressions in 2 weeks of dogfooding.' },
        ],
        github: 'https://github.com/iamadi11/spatial',
        demo: 'https://spatial-zeta.vercel.app/',
    },
    {
        id: 'mcp-ui',
        title: 'MCP UI',
        subtitle: 'Dynamic MCP UI generator',
        company: 'OSS · iamadi11/mcp-ui-poc',
        year: '2025',
        runtime: 'Full-stack',
        accent: '#b690ff',
        accent2: '#7aa2ff',
        glyph: 'MC',
        pocKey: 'mcp',
        summary: 'Full-stack MCP-UI demo: dynamic forms, dashboards, and charts driven by an MCP server.',
        metrics: [
            { v: 'Vite', k: 'client' },
            { v: 'Express', k: 'server' },
            { v: 'MCP', k: 'protocol' },
        ],
        stack: ['React 18', 'Vite', 'Node', 'Express', 'MCP UI'],
        role: 'Sole author',
        timeline: [
            {
                t: 'Problem',
                body: 'MCP returns structured tool results, but UI is hand-rolled per integration.',
            },
            { t: 'Constraints', body: 'Generic enough to reuse. Type-safe. No server-rendered HTML.' },
            {
                t: 'Architecture',
                body: 'Schema-first descriptors. Client maps tool result → component family.',
            },
            {
                t: 'Execution',
                body: 'React 18 + Express MCP server. Forms, dashboards, charts as building blocks.',
            },
            { t: 'Impact', body: 'POC for a generic MCP UI layer; design baseline for further work.' },
        ],
        github: 'https://github.com/iamadi11/mcp-ui-poc',
        demo: 'https://mcp-ui-poc.vercel.app/',
    },
    {
        id: 'pwa-builds',
        title: 'PWA & Build Pipeline',
        subtitle: 'Offline + 80% faster builds',
        company: 'Tata 1mg',
        year: '2023',
        runtime: 'DX',
        accent: '#ffb070',
        accent2: '#ff8a8a',
        glyph: 'PW',
        pocKey: 'pipeline',
        summary:
            'PWA for inventory ops + Webpack/Turborepo work that took the dev build from 15 → 3 minutes.',
        metrics: [
            { v: '15 → 3m', k: 'build time' },
            { v: '45%', k: 'fewer errors' },
            { v: '30%', k: 'faster deploys' },
        ],
        stack: ['Webpack', 'Turborepo', 'React', 'Service Worker'],
        role: 'Frontend platform',
        timeline: [
            {
                t: 'Problem',
                body: 'Inventory scanners unusable in basement aisles. Dev builds blocked PR throughput.',
            },
            { t: 'Constraints', body: 'No native rewrite. Same monorepo. Backwards-compatible cache.' },
            {
                t: 'Architecture',
                body: 'Service worker for inventory PWA. Turborepo + persistent caching for builds.',
            },
            {
                t: 'Execution',
                body: 'Cache-busting strategy, install prompt, parallel pipelines, remote cache.',
            },
            { t: 'Impact', body: '45% fewer manual scan errors offline. Build pipeline 80% faster.' },
        ],
    },
];

export interface ExperienceEntry {
    role: string;
    company: string;
    range: string;
    location: string;
    current?: boolean;
    color: string;
    bullets: string[];
    tech: string[];
}

export const EXPERIENCE: ExperienceEntry[] = [
    {
        role: 'Frontend Engineer II',
        company: 'Cashfree Payments',
        range: 'Mar 2025 — May 2026',
        location: 'Bengaluru',
        current: true,
        color: '#7aa2ff',
        bullets: [
            'Architected schema-driven, micro-frontend fraud rule engine enabling 200+ merchants to self-configure transaction-blocking rules with zero frontend deployments.',
            'Re-engineered Risk WebApp dashboard — real-time polling and optimistic UI cut median merchant time-to-action by 40%.',
            'Reduced Video KYC session drop rate by 30% via reconnection state machine with exponential backoff.',
            'Designed and shipped Cashmere, internal React design system — Storybook docs, Figma token sync, CLI scaffolding.',
        ],
        tech: ['React', 'TypeScript', 'Zustand', 'Micro-frontends', 'Storybook'],
    },
    {
        role: 'Software Engineer',
        company: 'Moresand Technologies',
        range: 'Aug 2024 — Mar 2025',
        location: 'Bengaluru',
        color: '#b690ff',
        bullets: [
            'Spearheaded migration of legacy Backbone.js / .NET back-office to React + Node.js — 3× faster feature delivery.',
            'Delivered PWA with service-worker pre-caching and React Query stale-while-revalidate — 50% faster repeat visits, offline for field teams.',
        ],
        tech: ['React', 'Next.js', 'React Query', 'Node.js', 'PWA'],
    },
    {
        role: 'SDE II',
        company: 'Tata 1mg',
        range: 'Apr 2023 — Jul 2024',
        location: 'Gurugram',
        color: '#7ee5ff',
        bullets: [
            'Built offline-first PWA for warehouse inventory — eliminated 45% of form data-loss incidents.',
            'Implemented real-time notifications (WebPush, Redis, SSE) — order breach down 70% → 15%.',
            'Consolidated IMS into Turborepo monorepo — CI pipeline 22 min → 8 min (64% faster).',
            'Cut build time 80% and JS bundle 60% via Webpack 5 persistent caching + code splitting.',
        ],
        tech: ['React', 'Node', 'Redis', 'Webpack', 'Turborepo'],
    },
    {
        role: 'SDE I',
        company: 'Tata 1mg',
        range: 'Dec 2021 — Mar 2023',
        location: 'Gurugram',
        color: '#6ee7a7',
        bullets: [
            'Engineered Google Maps service-zone configurator — polygon delivery areas across 20+ cities with SLA tiers.',
            'Built centralized Node.js PDF microservice, retiring 5+ team-specific implementations.',
            'Developed Cash Collection portal for 500+ riders/vendors — automated 15+ hrs/week manual reconciliation.',
        ],
        tech: ['React', 'Google Maps', 'Node.js', 'Express'],
    },
];

export interface SkillGroup {
    group: string;
    items: [string, number][];
}

export const SKILLS: SkillGroup[] = [
    {
        group: 'Core',
        items: [
            ['React', 5],
            ['Next.js', 5],
            ['TypeScript', 5],
            ['JavaScript', 5],
            ['Tailwind', 4],
        ],
    },
    {
        group: 'State',
        items: [
            ['Zustand', 4],
            ['React Query', 4],
            ['Redux', 3],
        ],
    },
    {
        group: 'Build',
        items: [
            ['Webpack', 4],
            ['Turborepo', 4],
            ['PWA', 5],
            ['Vite', 3],
        ],
    },
    {
        group: 'Backend',
        items: [
            ['Node.js', 4],
            ['Express', 3],
            ['Redis', 3],
            ['MongoDB', 2],
        ],
    },
    {
        group: 'Test',
        items: [
            ['Jest', 3],
            ['RTL', 3],
            ['Vitest', 3],
        ],
    },
];

export const EDUCATION = {
    school: 'IIIT Lucknow',
    degree: 'B.Tech, Information Technology',
    range: 'Aug 2017 — Jun 2021',
    cgpa: '8.14 / 10',
    location: 'Lucknow, UP',
};
