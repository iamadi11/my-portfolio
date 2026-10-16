import type { ReactNode } from 'react';

import type { Metadata } from 'next';

/** Self-referencing canonical + OG URL for the contact route. */
export const metadata: Metadata = {
    title: 'Contact',
    description:
        'Contact Aditya Raj — Senior Software Development Engineer at Amby Tech, Bengaluru. Email, phone, LinkedIn or GitHub.',
    keywords: [
        'hire Aditya Raj',
        'contact frontend engineer Bengaluru',
        'React Next.js developer for hire',
        'senior software engineer remote India',
    ],
    alternates: {
        canonical: '/contact',
    },
    openGraph: {
        url: '/contact',
        title: 'Contact · Aditya Raj',
        description: 'Contact Aditya Raj — Senior Software Development Engineer at Amby Tech, Bengaluru.',
    },
};

export default function ContactLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
