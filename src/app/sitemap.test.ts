import { expect, it, vi } from 'vitest';

import { CHAPTER_ROUTES } from '@/content/learn/chapters';

import sitemap from './sitemap';

it('lists this host once per reachable canonical page without invented modification dates', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://portfolio.example');
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(entries).toHaveLength(Object.keys(CHAPTER_ROUTES).length + 3);
    expect(urls).toContain('https://portfolio.example/learn/sources');
    for (const path of Object.values(CHAPTER_ROUTES))
        expect(urls).toContain(`https://portfolio.example${path}`);
    expect(entries.every((entry) => new URL(entry.url).origin === 'https://portfolio.example')).toBe(true);
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(true);
    vi.unstubAllEnvs();
});
