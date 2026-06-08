import type { ReactNode } from 'react';

import type { Metadata } from 'next';

/** Self-referencing canonical + OG URL for the contact route. */
export const metadata: Metadata = {
    title: 'Contact',
    description:
        'Hire Aditya Raj — Frontend Engineer II open to senior frontend and full-stack roles. Reach out via email, phone, LinkedIn, or GitHub. Based in Bengaluru, open to remote.',
    keywords: [
        'hire Aditya Raj',
        'contact frontend engineer Bengaluru',
        'React Next.js developer for hire',
        'senior frontend engineer remote India',
    ],
    alternates: {
        canonical: '/contact',
    },
    openGraph: {
        url: '/contact',
        title: 'Contact · Aditya Raj',
        description:
            'Hire Aditya Raj — Frontend Engineer II open to senior frontend and full-stack roles. Based in Bengaluru, open to remote.',
    },
};

export default function ContactLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
