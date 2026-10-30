import type { MetadataRoute } from 'next';

import { CHAPTER_ROUTES } from '@/content/learn/chapters';
import { getSiteOrigin } from '@/lib/site';

/** `/` (the drawing set; old inner pages redirect to its sheets) and the system design course under `/learn`. */
export default function sitemap(): MetadataRoute.Sitemap {
    const base = getSiteOrigin();

    const home = {
        url: `${base}/`,
        changeFrequency: 'weekly' as const,
        priority: 1,
    };

    /** The system design course: the index and each built chapter (`CHAPTER_ROUTES`). */
    const learn = [
        {
            url: `${base}/learn`,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        },
        {
            url: `${base}/learn/sources`,
            changeFrequency: 'monthly' as const,
            priority: 0.4,
        },
        ...Object.values(CHAPTER_ROUTES).map((path) => ({
            url: `${base}${path}`,
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        })),
    ];

    // External project references belong in the page, not this host's sitemap. Omit lastModified until a
    // maintained content timestamp exists; a release date would misrepresent when an individual page changed.
    return [home, ...learn];
}
