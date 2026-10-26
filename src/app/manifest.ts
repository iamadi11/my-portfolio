import type { MetadataRoute } from 'next';

import { siteDescription } from '@/lib/site';

/** Same SITE-built description as the root `layout.tsx` metadata. */
const description = siteDescription();

/** Installable PWA: the monochrome title-block mark (`public/icon*.png`, `icon.svg`); offline via `public/sw.js`. */
export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'Aditya Raj — Senior Software Development Engineer',
        short_name: 'Aditya Raj',
        description,
        lang: 'en-IN',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        categories: ['business', 'productivity'],
        icons: [
            { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
