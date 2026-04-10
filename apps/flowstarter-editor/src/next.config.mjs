/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@flowstarter/flow-design-system',
    '@flowstarter/platform-config',
  ],

  // Allow Clerk and Daytona sandbox images
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '*.daytona.io' },
    ],
  },
};

export default nextConfig;
