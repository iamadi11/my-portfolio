import type { ReactNode } from 'react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact',
    description: 'Phone, email, GitHub, and LinkedIn — Aditya Raj, Bengaluru, India.',
};

export default function ContactLayout({ children }: { children: ReactNode }): ReactNode {
    return children;
}
