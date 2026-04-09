import { headers } from 'next/headers';

import { getSiteOrigin } from '@/lib/site';

/**
 * Canonical origin for the current request (Vercel forwards x-forwarded-*).
 * Use for sitemap/robots so URL lists match the host Google (or users) are hitting.
 */
export async function getRequestSiteOrigin(): Promise<string> {
    const h = await headers();
    const host = h.get('x-forwarded-host')?.split(',')[0]?.trim() ?? h.get('host');
    if (!host) return getSiteOrigin();

    const forwardedProto = h.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const isLocal = host.startsWith('localhost') || host.startsWith('127.');
    const proto = forwardedProto || (isLocal ? 'http' : 'https');

    return `${proto}://${host}`.replace(/\/$/, '');
}
