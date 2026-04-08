import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /** Avoid advertising stack in response headers (production hygiene). */
    poweredByHeader: false,
    reactStrictMode: false,
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
        /** GitHub repo OG images are stable; longer TTL improves repeat visits (Lighthouse / CDN). */
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
