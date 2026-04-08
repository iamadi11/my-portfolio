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
