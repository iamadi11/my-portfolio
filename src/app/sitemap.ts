import type { MetadataRoute } from 'next';

import { getSiteOrigin } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
    const base = getSiteOrigin();
    const paths = ['/', '/about', '/contact', '/tech-stack'] as const;

    return paths.map((path) => ({
        url: path === '/' ? `${base}/` : `${base}${path}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: path === '/' ? 1 : 0.8,
    }));
}
