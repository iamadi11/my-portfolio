import type { MetadataRoute } from 'next';

import { getRequestSiteOrigin } from '@/lib/site-request-origin';

/** Resolve sitemap URL host from the incoming request so GSC and crawlers match the live domain. */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = await getRequestSiteOrigin();
    const paths = ['/', '/about', '/contact', '/tech-stack'] as const;

    const lastModified: Record<string, string> = {
        '/': '2026-06-09',
        '/about': '2026-06-09',
        '/contact': '2026-06-09',
        '/tech-stack': '2026-05-01',
    };

    return paths.map((path) => ({
        url: path === '/' ? `${base}/` : `${base}${path}`,
        lastModified: new Date(lastModified[path] ?? '2026-06-09'),
        changeFrequency: path === '/' ? ('weekly' as const) : ('monthly' as const),
        priority: path === '/' ? 1 : 0.8,
    }));
}
