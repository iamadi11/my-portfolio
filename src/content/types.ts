/**
 * Content contract for the site. One object per person; the page adapts to it.
 * Optional fields are left out of the page when missing, so never fill them to fill a layout.
 */

export type Link = { label: string; href: string };

/** Colour of the project's ring in the services zone. */
export type Hue = 'blue' | 'red' | 'green' | 'amber' | 'ink';

export type Project = {
    id: string;
    title: string;
    summary: string;
    stack: string[];
    /** First link is the primary action. */
    links: Link[];
    hue: Hue;
    year?: string;
};

export type Row = {
    org: string;
    role: string;
    period: string;
    location?: string;
    /** Comma-separated, as on the resume. */
    stack?: string;
    highlights?: string[];
};

/** A result worth reading at a glance, e.g. { value: '15 → 3 min', label: 'Build time, Acme' }. */
export type Impact = { value: string; label: string };

export type SiteContent = {
    profile: {
        name: string;
        role: string;
        statement: string;
        location: string;
        /** A short line under the name, e.g. 'Now at Acme' or 'Open to new roles'. */
        status?: string;
        email: string;
        phone?: Link;
        links: Link[];
    };
    projects: Project[];
    practice: {
        impact?: Impact[];
        skills?: Array<{ group: string; items: string }>;
        experience: Row[];
        education?: Row[];
    };
};

// The documented template (README "Make it yours"); nothing imports it on purpose.
// fallow-ignore-next-line unused-export
export const SAMPLE: SiteContent = {
    profile: {
        name: 'Your Name',
        role: 'Senior Software Engineer',
        statement: 'One sentence on the systems you build and why they hold up in production.',
        location: 'City, Country',
        status: 'Open to new work',
        email: 'you@example.com',
        links: [
            { label: 'GitHub', href: 'https://example.com' },
            { label: 'LinkedIn', href: 'https://example.com' },
        ],
    },
    projects: [
        {
            id: 'project-one',
            title: 'Project one',
            year: '2026',
            summary: 'What it is and who it is for, in one sentence.',
            stack: ['Language', 'Framework', 'Platform'],
            links: [{ label: 'Code', href: 'https://example.com' }],
            hue: 'blue',
        },
    ],
    practice: {
        impact: [{ value: '10 → 2 min', label: 'What changed, and where. Only numbers you can source.' }],
        skills: [{ group: 'Languages', items: 'Language one, Language two' }],
        experience: [
            {
                org: 'Company one',
                role: 'Role title',
                period: '2023 – now',
                location: 'City',
                stack: 'Tool one, Tool two',
                highlights: ['What you owned and what changed because of it.'],
            },
        ],
        education: [{ org: 'School', role: 'Degree', period: '2014 – 2018' }],
    },
};
