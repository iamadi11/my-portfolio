import type { ReactNode } from 'react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About',
    description:
        'Experience at Cashfree, Moresand, and Tata 1mg; education at IIIT Lucknow. Senior Frontend Engineer — Aditya Raj.',
};

export default function AboutLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
