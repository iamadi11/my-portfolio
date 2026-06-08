import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import { getSiteOrigin } from '@/lib/site';

const siteUrl = getSiteOrigin();

const workHistoryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
        '@type': 'Person',
        '@id': `${siteUrl}#person`,
        name: 'Aditya Raj',
        jobTitle: 'Frontend Engineer II',
        worksFor: { '@type': 'Organization', name: 'Cashfree Payments' },
        alumniOf: {
            '@type': 'EducationalOrganization',
            name: 'IIIT Lucknow',
            description: 'B.Tech Information Technology, CGPA 8.14/10, Aug 2017 – Jun 2021',
        },
        hasOccupation: [
            {
                '@type': 'EmployeeRole',
                roleName: 'Frontend Engineer II',
                startDate: '2025-03',
                worksFor: {
                    '@type': 'Organization',
                    name: 'Cashfree Payments',
                    address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru' },
                },
                description:
                    'Own Risk WebApp serving enterprise merchants — millions of transactions/month. Configurable rule engine for real-time transaction blocking; reduced Video KYC failure rate 30%.',
            },
            {
                '@type': 'EmployeeRole',
                roleName: 'Software Engineer',
                startDate: '2024-08',
                endDate: '2025-03',
                worksFor: {
                    '@type': 'Organization',
                    name: 'Moresand Technologies',
                    address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru' },
                },
                description:
                    'Led legacy back-office migration to React; 3× faster feature delivery. PWA offline architecture cut page load time 50%.',
            },
            {
                '@type': 'EmployeeRole',
                roleName: 'Software Development Engineer I–II',
                startDate: '2021-12',
                endDate: '2024-07',
                worksFor: {
                    '@type': 'Organization',
                    name: 'Tata 1mg',
                    address: { '@type': 'PostalAddress', addressLocality: 'Gurugram' },
                },
                description:
                    'Polygon serviceability engine for 15-min delivery zones. Real-time push notifications cut SLA breaches 70→15%. Turborepo monorepo cut build time 80%.',
            },
        ],
    },
};

/** Self-referencing canonical + OG URL so /about is indexed as its own page (not merged to `/`). */
export const metadata: Metadata = {
    title: 'About',
    description:
        'Hire Aditya Raj — Frontend Engineer II with 4.5+ years React/Next.js/TypeScript at Cashfree Payments, Moresand, and Tata 1mg. Open to senior frontend and full-stack roles in Bengaluru or remote.',
    keywords: [
        'Aditya Raj work history',
        'Cashfree Payments frontend engineer',
        'Tata 1mg SDE',
        'Moresand Technologies React',
        'hire React developer Bengaluru',
        'IIIT Lucknow frontend engineer',
        'senior frontend engineer India',
    ],
    alternates: {
        canonical: '/about',
    },
    openGraph: {
        url: '/about',
        title: 'About · Aditya Raj',
        description:
            'Hire Aditya Raj — Frontend Engineer II with 4.5+ years React/Next.js/TypeScript at Cashfree Payments, Moresand, and Tata 1mg. Open to senior frontend and full-stack roles.',
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
