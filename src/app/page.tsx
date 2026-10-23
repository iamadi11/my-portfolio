import React from 'react';

import type { Viewport } from 'next';
import { Big_Shoulders } from 'next/font/google';

import RoundTrip from '@/components/round-trip/RoundTrip';
import { tripFrom } from '@/components/round-trip/trip';
import { SITE } from '@/content/site';

/**
 * Display face for the name, headings, numbers and controls: Big Shoulders, a condensed grotesk drawn
 * from Chicago's civic signage, read at speed from a distance, which is how a HUD over a moving
 * world is read. One weight (700), Latin only. Body and the request line's mono come from the root
 * layout (Geist).
 */
const display = Big_Shoulders({
    subsets: ['latin'],
    weight: ['700'],
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
