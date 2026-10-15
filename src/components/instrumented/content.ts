/**
 * Content contract for the Instrumented site. One object per person; the layout adapts.
 * Optional fields are left out of the page when missing, so never fill them to fill a layout.
 * SAMPLE below is the generic template shown on /v2 — sample slots, not facts about anyone.
 */

export type Link = { label: string; href: string };

/** Drawing used as the project's plate. Pick the one closest to what the project does. */
export type Mark = 'orbit' | 'lattice' | 'wave' | 'stack';
export type Hue = 'blue' | 'red' | 'green' | 'ink';

export type Project = {
    id: string;
    title: string;
    summary: string;
    stack: string[];
    /** First link is the primary action. */
    links: Link[];
    mark: Mark;
    hue: Hue;
    year?: string;
    role?: string;
    detail?: { problem: string; approach: string; outcome: string };
};

export type Row = { org: string; role: string; period: string };

export type SiteContent = {
    profile: {
        name: string;
        role: string;
        statement: string;
        location: string;
        /** IANA zone for the live local-time readout, e.g. 'Europe/Berlin'. */
        timeZone: string;
        availability: string;
        email: string;
        phone?: Link;
        links: Link[];
    };
    projects: Project[];
    practice: {
        intro: string;
        principles?: Array<{ title: string; text: string }>;
        skills?: Array<{ group: string; items: string }>;
        experience: Row[];
        education?: Row[];
    };
};

// The documented template sample (README "Make it yours"); nothing imports it on purpose.
// fallow-ignore-next-line unused-export
export const SAMPLE: SiteContent = {
    profile: {
        name: 'Your Name',
        role: 'Senior Software Engineer',
        statement: 'One sentence on the systems you build and why they hold up in production.',
        location: 'City, Country',
        timeZone: 'UTC',
        availability: 'Open to new work',
        email: 'you@example.com',
        links: [
            { label: 'GitHub', href: 'https://example.com' },
            { label: 'LinkedIn', href: 'https://example.com' },
            { label: 'Résumé', href: 'https://example.com' },
        ],
    },
    projects: [
        {
            id: 'project-one',
            title: 'Project one',
            year: '2026',
            role: 'Your role',
            summary: 'What it is and who it is for, in one sentence.',
            stack: ['Language', 'Framework', 'Platform'],
            links: [{ label: 'Visit', href: 'https://example.com' }],
            mark: 'orbit',
            hue: 'blue',
            detail: {
                problem: 'The constraint you started from.',
                approach: 'The decision that mattered, and the trade-off you accepted.',
                outcome: 'What changed after it shipped. Use a number only if you can source it.',
            },
        },
        {
            id: 'project-two',
            title: 'Project two',
            year: '2025',
            role: 'Your role',
            summary: 'The system behind it, in one sentence a recruiter can repeat.',
            stack: ['Language', 'Database', 'Queue'],
            links: [{ label: 'Visit', href: 'https://example.com' }],
            mark: 'lattice',
            hue: 'red',
            detail: {
                problem: 'What was slow, fragile, or missing.',
                approach: 'How you broke the problem down and what you built first.',
                outcome: 'What the people using it could do afterwards.',
            },
        },
        {
            id: 'project-three',
            title: 'Project three',
            year: '2024',
            role: 'Your role',
            summary: 'A data or streaming problem, and the shape of your answer.',
            stack: ['Runtime', 'Protocol', 'Cloud'],
            links: [{ label: 'Visit', href: 'https://example.com' }],
            mark: 'wave',
            hue: 'green',
            detail: {
                problem: 'The volume, latency, or reliability limit you hit.',
                approach: 'The architecture you chose and the one you ruled out.',
                outcome: 'How you knew it worked.',
            },
        },
        {
            id: 'project-four',
            title: 'Project four',
            year: '2023',
            role: 'Your role',
            summary: 'A platform other engineers build on, in one sentence.',
            stack: ['Language', 'Tooling', 'CI'],
            links: [{ label: 'Visit', href: 'https://example.com' }],
            mark: 'stack',
            hue: 'ink',
            detail: {
                problem: 'Why the old foundation could not carry the next year.',
                approach: 'The layers you drew, and where you put the seams.',
                outcome: 'Who adopted it and what they stopped worrying about.',
            },
        },
    ],
    practice: {
        intro: 'Two or three sentences about how you work: the problems you choose, the teams you make better, and the standard you hold your own code to.',
        principles: [
            { title: 'Principle one', text: 'A habit you keep on every project, and why it pays off.' },
            { title: 'Principle two', text: 'How you decide what not to build.' },
            { title: 'Principle three', text: 'What you measure before you call something done.' },
        ],
        skills: [
            { group: 'Languages', items: 'Language one, Language two' },
            { group: 'Systems', items: 'Datastore, Queue, Cache' },
            { group: 'Delivery', items: 'CI, Observability, Testing' },
        ],
        experience: [
            { org: 'Company one', role: 'Role title', period: '2023 — Now' },
            { org: 'Company two', role: 'Role title', period: '2020 — 2023' },
            { org: 'Company three', role: 'Role title', period: '2018 — 2020' },
        ],
        education: [{ org: 'School', role: 'Degree', period: '2014 — 2018' }],
    },
};
