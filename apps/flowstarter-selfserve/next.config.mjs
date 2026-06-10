// Dev-only: allow LAN access to dev resources (same list as flowstarter-main,
// extendable via NEXT_PUBLIC_EXTRA_REDIRECT_ORIGINS=host,host).
const extraDevOrigins = (process.env.NEXT_PUBLIC_EXTRA_REDIRECT_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim().replace(/^https?:\/\//, '').replace(/:\d+$/, ''))
  .filter(Boolean);

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.3.119', '127.0.0.1', 'localhost', ...extraDevOrigins],
  async headers() {
    return [
      {
        source: '/api/(auth|webhooks|builds|demo)(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ];
  },
};
