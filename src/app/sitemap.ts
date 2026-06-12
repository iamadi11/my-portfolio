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

    const localSitemaps = paths.map((path) => ({
        url: path === '/' ? `${base}/` : `${base}${path}`,
        lastModified: new Date(lastModified[path] ?? '2026-06-09'),
        changeFrequency: path === '/' ? ('weekly' as const) : ('monthly' as const),
        priority: path === '/' ? 1 : 0.8,
    }));

    const eidosUrls = [
        {
            url: 'https://github.com/iamadi11/eidos',
            lastModified: new Date('2026-06-12'),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        },
        {
            url: 'https://playground-iamadi11s-projects.vercel.app',
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

    return [...localSitemaps, ...eidosUrls];
}
