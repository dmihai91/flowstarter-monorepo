/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@flowstarter/flow-design-system'],

  async rewrites() {
    // Proxy all T3 Code host traffic through Next.js.
    // T3 serves assets at /assets/* and uses WebSocket at root.
    return {
      beforeFiles: [
        {
          source: '/t3/:path*',
          destination: 'http://127.0.0.1:3773/:path*',
        },
        {
          source: '/assets/:path*',
          destination: 'http://127.0.0.1:3773/assets/:path*',
        },
      ],
    };
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
