import type { MetadataRoute } from 'next';

/** Same origin resolution as `sitemap.ts` and root `layout.tsx` metadataBase. */
function getSiteOrigin(): string {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
    return 'http://localhost:3000';
}

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
