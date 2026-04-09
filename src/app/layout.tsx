import React, { JSX } from 'react';

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { getSiteOrigin } from '@/lib/site';

import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

/** Same origin as `sitemap.xml` / `robots.txt` (`@/lib/site`). */
const siteUrl = getSiteOrigin();

/** Same resume-backed tagline as About + SOURCE_OF_TRUTH.md (search / OG / Twitter). */
const defaultDescription =
    'Frontend Engineer II at Cashfree Payments, Bengaluru. ~4.5+ years building scalable web apps in fintech, e-commerce, and enterprise; strong React, Next.js, and TypeScript; performance and production systems focus.';

/** GitHub profile image (https://github.com/iamadi11) — used for link previews without shipping a separate asset. */
const openGraphImage = 'https://avatars.githubusercontent.com/u/34628188?v=4&s=512';

/** Google Search Console HTML tag; set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel to override. */
const googleSiteVerification =
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? 'eM2svU8p9XvFqeLLYk0a__eoFh452FmBXepRgsVef9g';

/**
 * Single @graph: linked Person / org / site / home WebPage (resume-backed).
 * Note: Google Rich Results Test lists only a subset of types (FAQ, JobPosting, etc.);
 * Person/WebSite are still valid for general understanding. Omit route-specific WebPage here so
 * inner URLs (/about, etc.) are not all labeled as the home URL in the same graph.
 */
const structuredDataJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Person',
            '@id': `${siteUrl}#person`,
            name: 'Aditya Raj',
            url: siteUrl,
            image: openGraphImage,
            jobTitle: 'Frontend Engineer II',
            email: 'adityaraj92.20@gmail.com',
            telephone: '+917257807070',
            /** Portfolio + public profiles (SOURCE_OF_TRUTH.md) — helps crawlers link entities. */
            sameAs: [siteUrl, 'https://github.com/iamadi11', 'https://www.linkedin.com/in/adityaraj11/'],
            address: {
                '@type': 'PostalAddress',
                addressLocality: 'Bengaluru',
                addressRegion: 'Karnataka',
                addressCountry: 'IN',
            },
            worksFor: { '@id': `${siteUrl}#organization-cashfree` },
            alumniOf: { '@id': `${siteUrl}#education-iiit` },
            knowsAbout: [
                'React',
                'Next.js',
                'TypeScript',
                'JavaScript',
                'Node.js',
                'Web performance',
                'Progressive web apps',
                'REST APIs',
                'Frontend engineering',
                'Semantic UI',
                'Google Maps API',
                'Redis',
                'MongoDB',
                'MySQL',
                'Turborepo',
                'AWS',
                'CI/CD',
            ],
        },
        {
            '@type': 'Organization',
            '@id': `${siteUrl}#organization-cashfree`,
            name: 'Cashfree Payments',
        },
        {
            '@type': 'EducationalOrganization',
            '@id': `${siteUrl}#education-iiit`,
            name: 'IIIT Lucknow',
        },
        {
            '@type': 'WebSite',
            '@id': `${siteUrl}#website`,
            name: 'Aditya Raj',
            url: siteUrl,
            description: defaultDescription,
            inLanguage: 'en-IN',
            publisher: { '@id': `${siteUrl}#person` },
            mainEntity: { '@id': `${siteUrl}#person` },
        },
    ],
} as const;

/** Mobile browser chrome + safe-area behavior; matches forced dark UI (`globals.css` / zinc-950). */
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#09090b',
    colorScheme: 'dark',
};

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'Aditya Raj — Frontend Engineer II',
        template: '%s · Aditya Raj',
    },
    description: defaultDescription,
    authors: [{ name: 'Aditya Raj', url: siteUrl }],
    creator: 'Aditya Raj',
    /** Resume-backed terms for search / discovery (subset of SOURCE_OF_TRUTH.md). */
    keywords: [
        'Aditya Raj',
        'Frontend Engineer',
        'React',
        'Next.js',
        'TypeScript',
        'Bengaluru',
        'Cashfree Payments',
        'fintech',
        'web performance',
    ],
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Aditya Raj — Frontend Engineer II',
        description: defaultDescription,
        url: '/',
        siteName: 'Aditya Raj',
        locale: 'en_IN',
        type: 'website',
        images: [
            {
                url: openGraphImage,
                width: 512,
                height: 512,
                alt: 'Aditya Raj',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Aditya Raj — Frontend Engineer II',
        description: defaultDescription,
        images: [openGraphImage],
    },
    icons: {
        icon: [{ url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }],
        apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    robots: {
        index: true,
        follow: true,
    },
    verification: {
        google: googleSiteVerification,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): JSX.Element {
    return (
        <html lang="en-IN" className="scroll-smooth">
            <head>
                <link rel="preconnect" href="https://opengraph.githubassets.com" crossOrigin="anonymous" />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
                <a
                    href="#main-content"
                    className="fixed left-4 top-4 z-[100] translate-y-[-120%] rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg transition-transform duration-200 focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                    Skip to main content
                </a>
                <div className="app-backdrop" aria-hidden="true" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredDataJsonLd) }}
                />
                {children}
            </body>
        </html>
    );
}
