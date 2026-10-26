import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    poweredByHeader: false,
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
