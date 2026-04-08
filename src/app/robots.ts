import type { MetadataRoute } from 'next';

import { getSiteOrigin } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
    const base = getSiteOrigin();
    return {
        rules: {
            userAgent: '*',
            allow: '/',
        },
        sitemap: `${base}/sitemap.xml`,
        host: base,
    };
}
