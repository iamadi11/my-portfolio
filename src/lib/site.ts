import { SITE } from '@/content/site';

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

/** Search / OG / manifest description, built from SITE so it can never say more than the page does. */
export function siteDescription(): string {
    const { role, location, statement } = SITE.profile;
    return `${role} · ${location}. ${statement}`;
}
