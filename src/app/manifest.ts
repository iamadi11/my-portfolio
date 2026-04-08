import type { MetadataRoute } from 'next';

const description =
    'Senior Frontend Engineer (React, Next.js, TypeScript). Fintech and enterprise web apps—Bengaluru, India.';

/** Dark UI matches globals.css; icon PNGs omitted until added under /public (avoid 404 install icons). */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Aditya Raj — Senior Frontend Engineer',
        short_name: 'Aditya Raj',
        description,
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
    };
}
