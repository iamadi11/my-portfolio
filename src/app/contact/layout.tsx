import type { ReactNode } from 'react';

import type { Metadata } from 'next';

/** Self-referencing canonical + OG URL for the contact route. */
export const metadata: Metadata = {
    title: 'Contact',
    description:
        'Phone, email, GitHub, and LinkedIn — same contact details as on the resume. Frontend Engineer II, Bengaluru.',
    alternates: {
        canonical: '/contact',
    },
    openGraph: {
        url: '/contact',
        title: 'Contact · Aditya Raj',
        description:
            'Phone, email, GitHub, and LinkedIn — same contact details as on the resume. Frontend Engineer II, Bengaluru.',
    },
};

export default function ContactLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
