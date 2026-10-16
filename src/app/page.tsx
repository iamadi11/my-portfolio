import React from 'react';

import type { Viewport } from 'next';
import { Funnel_Display } from 'next/font/google';

import RoundTrip from '@/components/round-trip/RoundTrip';
import { tripFrom } from '@/components/round-trip/trip';
import { SITE } from '@/content/site';

/** Display face for the name and headings; body and mono come from the root layout (Geist). */
const display = Funnel_Display({
    subsets: ['latin'],
    weight: ['600', '700', '800'],
    variable: '--font-rt-display',
    display: 'swap',
});

/** Dark page: browser chrome follows it. Title, description and JSON-LD come from the root layout. */
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#05070d',
    colorScheme: 'dark',
};

const trip = tripFrom(SITE);

export default function Page(): React.JSX.Element {
    return (
        <div className={display.variable}>
            <RoundTrip trip={trip} />
        </div>
    );
}
