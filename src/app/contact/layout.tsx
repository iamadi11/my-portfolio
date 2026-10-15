import type { ReactNode } from 'react';

import type { Metadata } from 'next';

/** Self-referencing canonical + OG URL for the contact route. */
export const metadata: Metadata = {
    title: 'Contact',
    description:
        'Hire Aditya Raj — Senior Software Development Engineer open to senior software engineering roles. Reach out via email, phone, LinkedIn, or GitHub. Based in Bengaluru, open to remote.',
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
        description:
            'Hire Aditya Raj — Senior Software Development Engineer open to senior software engineering roles. Based in Bengaluru, open to remote.',
    },
};

export default function ContactLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
