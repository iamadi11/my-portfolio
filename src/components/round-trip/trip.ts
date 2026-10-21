import type { Hue, Impact, Link, Row, SiteContent } from '@/content/types';

/** The Round trip view of SiteContent. Only reshapes facts from site.ts; adds none. */
export type Trip = {
    name: string;
    /** For the request line in the HUD, e.g. GET /aditya. */
    slug: string;
    role: string;
    statement: string;
    /** The statement's first clause, the one line the hero shows; `rest` is read, not shown. */
    lede: string;
    rest: string;
    meta: string;
    impact: Impact[];
    skills: Array<{ group: string; items: string }>;
    projects: Array<{
        id: string;
        title: string;
        summary: string;
        stack: string[];
        links: Link[];
        year?: string;
        colour: string;
    }>;
    /** Roles newest first, then education. One lit record each in the data lattice. */
    records: Row[];
    /** One short name per record for the career chips: the org, plus the role where an org repeats. */
    chips: string[];
    email: string;
    phone?: Link;
    links: Link[];
};

/** Each project's ring takes its colour from the project's hue. */
const RING: Record<Hue, string> = {
    blue: '#6fb8ff',
    red: '#ff6b8a',
    green: '#5ff0b0',
    amber: '#ffb35c',
    ink: '#c9d0dc',
};

/** "Software Development Engineer II" → "SDE II": the role's own initials, its grade kept as written. */
const initials = (role: string): string => {
    const words = role.split(/[\s,]+/).filter(Boolean);
    const grade = /^[IVX]+$/.test(words.at(-1) ?? '') ? ` ${words.pop()}` : '';
    return words.map((w) => w[0]).join('') + grade;
};

/** Each record's chip: the org alone, or with its role's initials where the org comes up twice. */
const chipsOf = (records: Row[]): string[] =>
    records.map((r) =>
        records.filter((o) => o.org === r.org).length > 1 ? `${r.org} · ${initials(r.role)}` : r.org
    );

export function tripFrom(site: SiteContent): Trip {
    const { profile, projects, practice } = site;
    const records = [...practice.experience, ...(practice.education ?? [])];
    return {
        name: profile.name,
        slug: profile.name.split(' ')[0].toLowerCase(),
        role: profile.role,
        statement: profile.statement,
        lede: profile.statement.split(': ')[0],
        rest: profile.statement.split(': ').slice(1).join(': '),
        meta: [profile.status, profile.location].filter(Boolean).join(' · '),
        impact: practice.impact ?? [],
        skills: practice.skills ?? [],
        projects: projects.map(({ hue, ...p }) => ({ ...p, colour: RING[hue] })),
        records,
        chips: chipsOf(records),
        email: profile.email,
        phone: profile.phone,
        links: profile.links,
    };
}

/**
 * Section heights in svh: hero, wire, edge, services, data, response. Services and data grow with
 * the number of projects and records, so each one gets the same stretch of scrolling.
 */
export const heights = (trip: Trip): number[] => [
    130,
    330,
    290,
    100 + 180 * trip.projects.length,
    100 + 100 * trip.records.length,
    340,
];

/** Where item k of n is centred within a section h svh tall, as a share of the whole section. */
export const itemsAt = (h: number, n: number): number[] =>
    Array.from({ length: n }, (_, k) => (((h - 100) / h) * (k + 0.5)) / n);
