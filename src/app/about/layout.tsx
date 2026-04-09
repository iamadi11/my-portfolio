import type { ReactNode } from 'react';

import type { Metadata } from 'next';

/** Self-referencing canonical + OG URL so /about is indexed as its own page (not merged to `/`). */
export const metadata: Metadata = {
    title: 'About',
    description:
        'Work history, education, and background — Frontend Engineer II at Cashfree Payments, Bengaluru; prior roles at Moresand and Tata 1mg; IIIT Lucknow B.Tech IT.',
    alternates: {
        canonical: '/about',
    },
    openGraph: {
        url: '/about',
        title: 'About · Aditya Raj',
        description:
            'Work history, education, and background — Frontend Engineer II at Cashfree Payments, Bengaluru; prior roles at Moresand and Tata 1mg; IIIT Lucknow B.Tech IT.',
    },
};

export default function AboutLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
