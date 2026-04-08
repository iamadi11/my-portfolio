import type { ReactNode } from 'react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About',
    description:
        'Work experience: Cashfree, Moresand, Tata 1mg. Education: IIIT Lucknow (B.Tech IT). Frontend engineer — React, Next.js, TypeScript; Bengaluru, India.',
    alternates: {
        canonical: '/about',
    },
    openGraph: {
        url: '/about',
    },
};

export default function AboutLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
