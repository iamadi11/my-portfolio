import type { ReactNode } from 'react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tech stack',
    description:
        'Technologies from my resume and production work — React, Next.js, TypeScript, Node.js, and related tooling.',
};

export default function TechStackLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
