import React, { JSX } from 'react';

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { SITE } from '@/content/site';
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

/** Every skill the site lists (SITE.practice.skills), one entry each, as written there. */
const knowsAbout = [
    ...new Set((SITE.practice.skills ?? []).flatMap((s) => s.items.split(', ').map((i) => i.trim()))),
];

/** Search terms from SITE facts only: name, role, place, employers and the stack's headline skills. */
const keywords = [
    ...new Set([
        SITE.profile.name,
        SITE.profile.role,
        SITE.profile.location.split(', ')[0],
        ...SITE.practice.experience.map((r) => r.org),
        ...knowsAbout.slice(0, 12),
    ]),
];

/** Same origin as `sitemap.xml` / `robots.txt` (`@/lib/site`). */
const siteUrl = getSiteOrigin();

/** Same resume-backed tagline as About + SOURCE_OF_TRUTH.md (search / OG / Twitter). */
const defaultDescription =
    'Senior Software Development Engineer at Amby Tech · Bengaluru. 5+ years building fast, scalable web products for fintech and e-commerce with React, Next.js, Node.js and TypeScript; performance and production systems focus.';

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
            jobTitle: 'Senior Software Development Engineer',
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
            worksFor: { '@type': 'Organization', name: 'Amby Tech', url: 'https://ambytech.com/' },
            alumniOf: { '@id': `${siteUrl}#education-iiit` },
            knowsAbout,
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
    themeColor: '#0c0b0a',
    colorScheme: 'dark',
};

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'Aditya Raj — Senior Software Development Engineer',
        template: '%s · Aditya Raj',
    },
    description: defaultDescription,
    authors: [{ name: 'Aditya Raj', url: siteUrl }],
    creator: 'Aditya Raj',
    /** Resume-backed terms for search / discovery (subset of SOURCE_OF_TRUTH.md). */
    keywords,
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Aditya Raj — Senior Software Development Engineer',
        description: defaultDescription,
        url: '/',
        siteName: 'Aditya Raj',
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Aditya Raj — Senior Software Development Engineer',
        description: defaultDescription,
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
        <html lang="en-IN" className="motion-safe:scroll-smooth">
            <head>
                <link rel="preconnect" href="https://opengraph.githubassets.com" crossOrigin="anonymous" />
                <link
                    rel="alternate"
                    type="text/plain; charset=utf-8"
                    href="/llms.txt"
                    title="Plain-text site index for AI and tools (Aditya Raj)"
                />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
                <a
                    href="#main-content"
                    className="fixed left-4 top-0 z-[200] -translate-y-full rounded-b-md border border-t-0 border-white/10 bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-100 shadow-lg outline-none transition-transform duration-200 ease-out focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 motion-reduce:transition-none"
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
