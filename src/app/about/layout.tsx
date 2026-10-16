import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import { SITE } from '@/content/site';
import { getSiteOrigin } from '@/lib/site';

const siteUrl = getSiteOrigin();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** 'Mar 2025' → '2025-03'; anything else (e.g. 'now') → undefined. */
const month = (s = ''): string | undefined => {
    const [m, y] = s.trim().split(' ');
    const i = MONTHS.indexOf(m);
    return i < 0 || !y ? undefined : `${y}-${String(i + 1).padStart(2, '0')}`;
};

/** Built from the same records as the page (`SITE`), so search engines see exactly what visitors see. */
const workHistoryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
        '@type': 'Person',
        '@id': `${siteUrl}#person`,
        name: SITE.profile.name,
        jobTitle: SITE.profile.role,
        alumniOf: (SITE.practice.education ?? []).map((e) => ({
            '@type': 'EducationalOrganization',
            name: e.org,
            description: [e.role, ...(e.highlights ?? []), e.period].join(', '),
        })),
        hasOccupation: SITE.practice.experience.map((r) => {
            const [from, to] = r.period.split('–');
            return {
                '@type': 'EmployeeRole',
                roleName: r.role,
                startDate: month(from),
                endDate: month(to),
                worksFor: {
                    '@type': 'Organization',
                    name: r.org,
                    ...(r.location && { address: { '@type': 'PostalAddress', addressLocality: r.location } }),
                },
                ...(r.highlights && { description: r.highlights.join(' ') }),
            };
        }),
    },
};

/** Self-referencing canonical + OG URL so /about is indexed as its own page (not merged to `/`). */
export const metadata: Metadata = {
    title: 'About',
    description:
        'Aditya Raj — Senior Software Development Engineer at Amby Tech. 5+ years of React, Next.js and TypeScript at Cashfree Payments, Tata 1mg, Moresand and o9 Solutions.',
    keywords: [
        'Aditya Raj work history',
        'Amby Tech software engineer',
        'Cashfree Payments frontend engineer',
        'Tata 1mg SDE',
        'Moresand Technologies React',
        'hire React developer Bengaluru',
        'IIIT Lucknow frontend engineer',
        'senior software engineer India',
    ],
    alternates: {
        canonical: '/about',
    },
    openGraph: {
        url: '/about',
        title: 'About · Aditya Raj',
        description:
            'Aditya Raj — Senior Software Development Engineer at Amby Tech. 5+ years of React, Next.js and TypeScript at Cashfree Payments, Tata 1mg and Moresand.',
    },
};

export default function AboutLayout({ children }: { children: ReactNode }): ReactNode {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(workHistoryJsonLd) }}
            />
            {children}
        </>
    );
}
