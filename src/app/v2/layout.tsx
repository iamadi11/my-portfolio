import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-space-grotesk',
    display: 'swap',
});

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-inter',
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-jetbrains-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Aditya Raj — Frontend Engineer II · v2',
    description:
        'Frontend Engineer II at Cashfree Payments. 4.5+ years building scalable React, Next.js, TypeScript apps in fintech and enterprise.',
    alternates: { canonical: '/v2' },
};

export default function V2Layout({ children }: { children: React.ReactNode }): JSX.Element {
    return (
        <div
            className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
            style={{ display: 'contents' }}
        >
            {children}
        </div>
    );
}
