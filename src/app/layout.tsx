import React, { JSX } from 'react';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

/** Production: set NEXT_PUBLIC_SITE_URL (e.g. https://yourdomain.com). Vercel sets VERCEL_URL automatically. */
const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const defaultDescription =
    'Senior Frontend Engineer (React, Next.js, TypeScript). Fintech and enterprise web apps—Bengaluru, India.';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'Aditya Raj — Senior Frontend Engineer',
        template: '%s · Aditya Raj',
    },
    description: defaultDescription,
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Aditya Raj — Senior Frontend Engineer',
        description: defaultDescription,
        url: '/',
        siteName: 'Aditya Raj',
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: 'Aditya Raj — Senior Frontend Engineer',
        description: defaultDescription,
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
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
        </html>
    );
}
