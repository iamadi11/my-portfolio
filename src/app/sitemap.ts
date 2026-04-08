import type { MetadataRoute } from 'next';

/** Mirrors root layout: production should set NEXT_PUBLIC_SITE_URL; Vercel provides VERCEL_URL. */
function getSiteOrigin(): string {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
    return 'http://localhost:3000';
}

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
