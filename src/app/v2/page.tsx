import React from 'react';

import type { Metadata } from 'next';

import CinematicHome from '@/components/v2/CinematicHome';

export const metadata: Metadata = {
    title: 'The Journey — Aditya Raj',
    description:
        'An interactive journey through the engineering career of Aditya Raj — from IIIT Lucknow through Tata 1mg, Moresand, and Cashfree Payments to open source.',
    // Staging: noindex until the Phase 12 audit promotes this experience.
    robots: { index: false, follow: false },
};

export default function V2Page(): React.JSX.Element {
    return <CinematicHome />;
}
