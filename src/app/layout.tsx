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
    'Frontend engineer with ~4.5+ years building scalable web apps in fintech, e-commerce, and enterprise; strong React, Next.js, and TypeScript; performance and production systems focus.';

/** GitHub profile image (https://github.com/iamadi11) — used for link previews without shipping a separate asset. */
const openGraphImage = 'https://avatars.githubusercontent.com/u/34628188?v=4&s=512';

/** schema.org Person — aligned to resume + public profiles (SOURCE_OF_TRUTH.md). */
const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Aditya Raj',
    url: siteUrl,
    image: openGraphImage,
    jobTitle: 'Frontend Engineer II',
    email: 'adityaraj92.20@gmail.com',
    telephone: '+917257807070',
    sameAs: ['https://github.com/iamadi11', 'https://www.linkedin.com/in/adityaraj11/'],
    address: {
        '@type': 'PostalAddress',
        addressLocality: 'Bengaluru',
        addressRegion: 'Karnataka',
        addressCountry: 'IN',
    },
    worksFor: {
        '@type': 'Organization',
        name: 'Cashfree Payments',
    },
    alumniOf: {
        '@type': 'EducationalOrganization',
        name: 'IIIT Lucknow',
    },
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
    ],
} as const;

/** schema.org WebSite — complements Person; uses same canonical description as meta/OG. */
const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Aditya Raj',
    url: siteUrl,
    description: defaultDescription,
    inLanguage: 'en-IN',
    publisher: {
        '@type': 'Person',
        name: 'Aditya Raj',
    },
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
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): JSX.Element {
    return (
        <html lang="en-IN" className="scroll-smooth">
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
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
                />
                {children}
            </body>
        </html>
    );
}
