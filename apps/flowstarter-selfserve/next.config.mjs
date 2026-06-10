/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/api/(auth|webhooks|builds|demo)(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ];
  },
};
