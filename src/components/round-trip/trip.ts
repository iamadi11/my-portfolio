import type { Hue, Impact, Link, Row, SiteContent } from '@/content/types';

/** The Round trip view of SiteContent. Only reshapes facts from site.ts; adds none. */
export type Trip = {
    name: string;
    /** For the request line in the HUD, e.g. GET /aditya. */
    slug: string;
    role: string;
    statement: string;
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

export function tripFrom(site: SiteContent): Trip {
    const { profile, projects, practice } = site;
    return {
        name: profile.name,
        slug: profile.name.split(' ')[0].toLowerCase(),
        role: profile.role,
        statement: profile.statement,
        meta: [profile.status, profile.location].filter(Boolean).join(' · '),
        impact: practice.impact ?? [],
        skills: practice.skills ?? [],
        projects: projects.map(({ hue, ...p }) => ({ ...p, colour: RING[hue] })),
        records: [...practice.experience, ...(practice.education ?? [])],
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
    230,
    270,
    100 + 85 * trip.projects.length,
    100 + 75 * trip.records.length,
    250,
];

/** Where item k of n is centred within a section h svh tall, as a share of the whole section. */
export const itemsAt = (h: number, n: number): number[] =>
    Array.from({ length: n }, (_, k) => (((h - 100) / h) * (k + 0.5)) / n);
