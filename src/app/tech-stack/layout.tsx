import type { ReactNode } from 'react';

import type { Metadata } from 'next';

const techStackDescription =
    'Technologies from my resume and production work — React, Next.js, TypeScript, Node.js, and related tooling.';

export const metadata: Metadata = {
    title: 'Tech stack',
    description: techStackDescription,
    alternates: {
        canonical: '/tech-stack',
    },
    openGraph: {
        url: '/tech-stack',
        title: 'Tech stack · Aditya Raj',
        description: techStackDescription,
    },
    twitter: {
        title: 'Tech stack · Aditya Raj',
        description: techStackDescription,
    },
};

export default function TechStackLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
