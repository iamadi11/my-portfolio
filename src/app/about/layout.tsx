import type { ReactNode } from 'react';

import type { Metadata } from 'next';

const aboutDescription =
    'Work experience: Cashfree, Moresand, Tata 1mg. Education: IIIT Lucknow (B.Tech IT). Frontend engineer — React, Next.js, TypeScript; Bengaluru, India.';

export const metadata: Metadata = {
    title: 'About',
    description: aboutDescription,
    alternates: {
        canonical: '/about',
    },
    openGraph: {
        url: '/about',
        title: 'About · Aditya Raj',
        description: aboutDescription,
    },
    twitter: {
        title: 'About · Aditya Raj',
        description: aboutDescription,
    },
};

export default function AboutLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
