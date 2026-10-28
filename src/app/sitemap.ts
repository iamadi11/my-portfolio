import type { MetadataRoute } from 'next';

import { CHAPTER_ROUTES } from '@/content/learn/chapters';
import { getSiteOrigin } from '@/lib/site';

/** `/` (the drawing set; old inner pages redirect to its sheets) and the system design course under `/learn`. */
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

    /** The system design course: the index and each built chapter (`CHAPTER_ROUTES`). */
    const learn = [
        {
            url: `${base}/learn`,
            lastModified: new Date('2026-10-27'),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        },
        {
            url: `${base}/learn/sources`,
            lastModified: new Date('2026-10-28'),
            changeFrequency: 'monthly' as const,
            priority: 0.4,
        },
        ...Object.values(CHAPTER_ROUTES).map((path) => ({
            url: `${base}${path}`,
            lastModified: new Date('2026-10-27'),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        })),
    ];

    return [home, ...learn, ...eidosUrls];
}
