import type { MetadataRoute } from 'next';

const description =
    'Senior Frontend Engineer (React, Next.js, TypeScript). Fintech and enterprise web apps—Bengaluru, India.';

/** Icons derived from https://github.com/iamadi11 profile image (same asset as OG preview). */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Aditya Raj — Senior Frontend Engineer',
        short_name: 'Aditya Raj',
        description,
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
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
