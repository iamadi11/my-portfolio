import type { MetadataRoute } from 'next';

import { getSiteOrigin } from '@/lib/site';

/** `/` is the only local page: a single drawing set (the old inner pages redirect to its sheets). */
export default function sitemap(): MetadataRoute.Sitemap {
    const base = getSiteOrigin();

    const home = {
        url: `${base}/`,
        lastModified: new Date('2026-10-26'),
        changeFrequency: 'weekly' as const,
        priority: 1,
    };

    const eidosUrls = [
        {
            url: 'https://github.com/sweidos/eidos',
            lastModified: new Date('2026-06-12'),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        },
        {
            url: 'https://sweidos.vercel.app',
            lastModified: new Date('2026-06-12'),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        },
        {
            url: 'https://www.npmjs.com/package/@sweidos/eidos',
            lastModified: new Date('2026-06-12'),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        },
    ];

    return [home, ...eidosUrls];
}
