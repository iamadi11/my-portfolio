import type { NextConfig } from 'next';
import { execSync } from 'node:child_process';

/** Git facts for the title block's revision cell (`src/lib/live.ts`). Vercel's variables first, then git. */
function git(cmd: string): string {
    try {
        return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim();
    } catch {
        return '';
    }
}
const BUILD_SHA = process.env.VERCEL_GIT_COMMIT_SHA ?? git('rev-parse HEAD');
const BUILD_REPO =
    process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
        ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
        : (/github\.com[/:]([\w.-]+\/[\w.-]+?)(?:\.git)?$/.exec(git('remote get-url origin'))?.[1] ?? '');

const nextConfig: NextConfig = {
    poweredByHeader: false,
    /** Lets parallel dev servers keep separate build folders (`NEXT_DIST_DIR=.next-a next dev`). */
    distDir: process.env.NEXT_DIST_DIR ?? '.next',
    env: { BUILD_SHA, BUILD_REPO, BUILD_DATE: new Date().toISOString().slice(0, 10) },
    reactStrictMode: true,

    experimental: {
        /** Minify CSS with LightningCSS in prod. */
        optimizeCss: true,
    },

    compiler: {
        /** Strip all console.* calls in production builds. */
        removeConsole: { exclude: ['error', 'warn'] },
    },

    async redirects() {
        return [
            {
                source: '/home',
                destination: '/',
                permanent: true,
            },
            /** /v2 was the preview of the old 3D home page. */
            { source: '/v2', destination: '/', permanent: false },
            /** The inner pages became sheets of the drawing set on /. */
            { source: '/about', destination: '/#revisions', permanent: true },
            { source: '/tech-stack', destination: '/#variables', permanent: true },
            { source: '/contact', destination: '/#contact', permanent: true },
        ];
    },
    async headers() {
        return [
            /** The service worker must always be revalidated so a new deploy reaches installed copies. */
            {
                source: '/sw.js',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
                ],
            },
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                ],
            },
        ];
    },
    images: {
        minimumCacheTTL: 60 * 60 * 24 * 7,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'opengraph.githubassets.com',
            },
        ],
    },
};

export default nextConfig;
