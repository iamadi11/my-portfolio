import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    poweredByHeader: false,
    reactStrictMode: true,

    experimental: {
        /** Tree-shake barrel packages — biggest win for react-icons (~400 icons → only used ones). */
        optimizePackageImports: ['react-icons', 'motion'],
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
        ];
    },
    async headers() {
        return [
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
