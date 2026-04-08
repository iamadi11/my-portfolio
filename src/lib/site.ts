/**
 * Absolute site origin (no trailing slash) for metadata, JSON-LD, sitemap, and robots.
 * Set `NEXT_PUBLIC_SITE_URL` in production; Vercel sets `VERCEL_URL`.
 */
export function getSiteOrigin(): string {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
    return 'http://localhost:3000';
}
