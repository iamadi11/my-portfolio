import type { ReactNode } from 'react';

import type { Metadata } from 'next';

/** Self-referencing canonical + OG URL for the tech stack route. */
export const metadata: Metadata = {
    title: 'Tech stack',
    description:
        'Skills and tools from resume and GitHub — React, Next.js, TypeScript, Node.js, performance, PWA, testing, and related stack.',
    alternates: {
        canonical: '/tech-stack',
    },
    openGraph: {
        url: '/tech-stack',
        title: 'Tech stack · Aditya Raj',
        description:
            'Skills and tools from resume and GitHub — React, Next.js, TypeScript, Node.js, performance, PWA, testing, and related stack.',
    },
};

export default function TechStackLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
