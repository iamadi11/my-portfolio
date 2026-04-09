import type { MetadataRoute } from 'next';

import { getRequestSiteOrigin } from '@/lib/site-request-origin';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const base = await getRequestSiteOrigin();
    return {
        rules: {
            userAgent: '*',
            allow: '/',
        },
        sitemap: `${base}/sitemap.xml`,
        host: base,
    };
}
