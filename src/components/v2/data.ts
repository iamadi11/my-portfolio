/**
 * Scene content for the cinematic journey. Every fact traces to
 * SOURCE_OF_TRUTH.md (resume → LinkedIn → GitHub). Copy budget is strict:
 * heading + one short line + ≤3 terse facts. The visuals tell the story —
 * text is a caption, not a narrator.
 */

export type JourneyScene = {
    id: string;
    label: string;
    kicker: string;
    heading: string;
    body: string;
    facts?: string[];
};

export const journeyScenes: JourneyScene[] = [
    {
        id: 'origin',
        label: 'Introduction',
        kicker: 'The origin',
        heading: 'Aditya Raj',
        body: 'Frontend engineer · 4.5+ years · fintech, e-commerce, enterprise.',
    },
    {
        id: 'root',
        label: 'Education',
        kicker: 'The root',
        heading: 'IIIT Lucknow',
        body: 'B.Tech IT · 2017 – 2021 · CGPA 8.14',
    },
    {
        id: 'tata1mg',
        label: 'Tata 1mg — SDE I–II',
        kicker: 'Chapter one · Dec 2021 – Jul 2024',
        heading: 'Tata 1mg',
        body: 'SDE I–II · Gurugram',
        facts: [
            '15-minute delivery zones — polygon serviceability engine',
            'SLA breaches 70% → 15% — WebPush, Redis, SSE',
            'Builds 15 min → 3 min',
        ],
    },
    {
        id: 'moresand',
        label: 'Moresand Technologies — Software Engineer',
        kicker: 'Chapter two · Aug 2024 – Mar 2025',
        heading: 'Moresand',
        body: 'Software Engineer · Bengaluru',
        facts: [
            'Legacy back-office → React — 3x faster feature development',
            'Offline-first PWA — page loads 50% faster',
        ],
    },
    {
        id: 'cashfree',
        label: 'Cashfree Payments — Frontend Engineer II',
        kicker: 'Chapter three · Mar 2025 – May 2026',
        heading: 'Cashfree Payments',
        body: 'Frontend Engineer II · Bengaluru',
        facts: [
            'Risk platform — millions of transactions monthly',
            'Real-time rule engine — block and flag in flight',
            'Video KYC failure rate −30%',
        ],
    },
    {
        id: 'ecosystem',
        label: 'Open source — Eidos',
        kicker: 'A life of its own',
        heading: 'Eidos',
        body: 'Offline-first Service Workers · 40 lines of boilerplate → 2 · npm: @sweidos/eidos',
    },
    {
        id: 'network',
        label: 'Skills',
        kicker: 'The knowledge network',
        heading: 'Connected systems',
        body: 'React · Next.js · TypeScript · Zustand · React Query · Tailwind · Node.js · Redis · PostgreSQL · Turborepo',
    },
    {
        id: 'convergence',
        label: 'Contact',
        kicker: 'The story continues',
        heading: 'Start the next branch',
        body: 'Open to opportunities.',
        facts: ['adityaraj92.20@gmail.com', 'linkedin.com/in/adityaraj11', 'github.com/iamadi11'],
    },
];
