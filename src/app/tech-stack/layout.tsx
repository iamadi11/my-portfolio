import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import { getSiteOrigin } from '@/lib/site';

const siteUrl = getSiteOrigin();

const skillsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Technical Skills — Aditya Raj',
    description:
        'Frontend and full-stack skills used in production at Cashfree Payments, Moresand, and Tata 1mg.',
    itemListElement: [
        'React',
        'Next.js',
        'TypeScript',
        'JavaScript',
        'HTML5',
        'CSS3',
        'Tailwind CSS',
        'Zustand',
        'React Query',
        'Redux',
        'Semantic UI',
        'Node.js',
        'Express',
        'Redis',
        'MongoDB',
        'MySQL',
        'AWS',
        'Google Maps API',
        'Webpack',
        'Turborepo',
        'Vite',
        'PWA',
        'Git',
        'GitHub Actions',
        'Jest',
        'React Testing Library',
    ].map((name, i) => ({ '@type': 'ListItem', position: i + 1, name, url: `${siteUrl}/tech-stack` })),
};

/** Self-referencing canonical + OG URL for the tech stack route. */
export const metadata: Metadata = {
    title: 'Tech stack',
    description:
        'React, Next.js, TypeScript, Node.js, Redis, Turborepo, PWA — production skills from 4.5+ years at Cashfree Payments, Tata 1mg, and Moresand Technologies. Hire a senior frontend engineer in Bengaluru.',
    keywords: [
        'React developer skills',
        'Next.js TypeScript engineer',
        'frontend tech stack India',
        'Turborepo monorepo',
        'PWA developer',
        'Redis Node.js backend',
        'hire frontend engineer React Next.js',
    ],
    alternates: {
        canonical: '/tech-stack',
    },
    openGraph: {
        url: '/tech-stack',
        title: 'Tech stack · Aditya Raj',
        description:
            'React, Next.js, TypeScript, Node.js, Redis, Turborepo, PWA — production skills from 4.5+ years at Cashfree Payments, Tata 1mg, and Moresand.',
    },
};

export default function TechStackLayout({ children }: { children: ReactNode }): ReactNode {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(skillsJsonLd) }}
            />
            {children}
        </>
    );
}
