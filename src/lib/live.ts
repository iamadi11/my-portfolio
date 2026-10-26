import type { Project } from '@/content/types';

/**
 * Live facts about a project from its own public sources: the GitHub repo its links point to (stars, last push)
 * and the npm package it publishes (downloads last week). Fetched at build time and revalidated daily (ISR).
 * Fail-soft by design: any error, timeout or missing field drops that fact; nothing is ever estimated or cached
 * past its source.
 */

export type ProjectStats = {
    repo?: { slug: string; stars: number; pushedAt: string };
    npm?: { pkg: string; weekly: number };
};

const DAY = 60 * 60 * 24;

const GH = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/;
const NPM = /^https:\/\/(?:www\.)?npmjs\.com\/package\/((?:@[\w.-]+\/)?[\w.-]+)\/?$/;

async function json(url: string, headers: Record<string, string> = {}): Promise<unknown> {
    try {
        const res = await fetch(url, {
            headers: { Accept: 'application/json', ...headers },
            next: { revalidate: DAY },
            signal: AbortSignal.timeout(4000),
        });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
}

async function repo(slug: string): Promise<ProjectStats['repo']> {
    const token = process.env.GITHUB_TOKEN;
    const d = (await json(
        `https://api.github.com/repos/${slug}`,
        token ? { Authorization: `Bearer ${token}` } : {}
    )) as {
        stargazers_count?: unknown;
        pushed_at?: unknown;
    } | null;
    if (!d || typeof d.stargazers_count !== 'number' || typeof d.pushed_at !== 'string') return undefined;
    return { slug, stars: d.stargazers_count, pushedAt: d.pushed_at };
}

async function npm(pkg: string): Promise<ProjectStats['npm']> {
    const d = (await json(`https://api.npmjs.org/downloads/point/last-week/${pkg}`)) as {
        downloads?: unknown;
    } | null;
    if (!d || typeof d.downloads !== 'number') return undefined;
    return { pkg, weekly: d.downloads };
}

/** Stats for one project, from the first GitHub and npm links in its SITE entry. */
export async function projectStats(p: Project): Promise<ProjectStats> {
    const gh = p.links.map((l) => GH.exec(l.href)).find(Boolean);
    const pk = p.links.map((l) => NPM.exec(l.href)).find(Boolean);
    const [r, n] = await Promise.all([
        gh ? repo(`${gh[1]}/${gh[2]}`) : undefined,
        pk ? npm(pk[1]) : undefined,
    ]);
    return { ...(r ? { repo: r } : {}), ...(n ? { npm: n } : {}) };
}

/**
 * The deploy this page was built from: the drawing's revision is the commit. `next.config.ts` stamps the commit,
 * repo and date at build time (Vercel's git variables, or git locally). No commit, no revision cell.
 */
export function buildRevision(): { sha: string; url?: string; date: string } | null {
    const sha = process.env.BUILD_SHA;
    if (!sha) return null;
    const slug = process.env.BUILD_REPO;
    return {
        sha: sha.slice(0, 7),
        url: slug ? `https://github.com/${slug}/commit/${sha}` : undefined,
        date: process.env.BUILD_DATE ?? '',
    };
}
