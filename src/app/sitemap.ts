import type { MetadataRoute } from 'next';

import { getSiteOrigin } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
    const base = getSiteOrigin();
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
