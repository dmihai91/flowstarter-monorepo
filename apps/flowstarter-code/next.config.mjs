/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@flowstarter/flow-design-system'],

  async headers() {
    return [
      {
        // Allow the flowstarter-code shell itself to be framed by the same origin
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
