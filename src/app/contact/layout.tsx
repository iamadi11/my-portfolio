import type { ReactNode } from 'react';

import type { Metadata } from 'next';

const contactDescription =
    'Phone, email, GitHub, and LinkedIn — same details as on my resume. Aditya Raj, Frontend Engineer II, Bengaluru, India.';

export const metadata: Metadata = {
    title: 'Contact',
    description: contactDescription,
    alternates: {
        canonical: '/contact',
    },
    openGraph: {
        url: '/contact',
        title: 'Contact · Aditya Raj',
        description: contactDescription,
    },
    twitter: {
        title: 'Contact · Aditya Raj',
        description: contactDescription,
    },
};

export default function ContactLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
