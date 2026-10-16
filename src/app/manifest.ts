import type { MetadataRoute } from 'next';

/** Same resume-backed tagline as root `layout.tsx` metadata + SOURCE_OF_TRUTH.md. */
const description =
    'Senior Software Development Engineer at Amby Tech · Bengaluru. 5+ years building fast, scalable web products for fintech and e-commerce with React, Next.js, Node.js and TypeScript; performance and production systems focus.';

/** Icons derived from https://github.com/iamadi11 profile image (same asset as OG preview). */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Aditya Raj — Senior Software Development Engineer',
        short_name: 'Aditya Raj',
        description,
        start_url: '/',
        display: 'standalone',
        background_color: '#09090b',
        theme_color: '#09090b',
        icons: [
            {
                src: '/avatar-logo.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any',
            },
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
        ],
    };
}
