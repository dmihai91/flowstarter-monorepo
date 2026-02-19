// ESM-safe __filename replacement
const CONFIG_FILE = new URL('', import.meta.url).pathname;

export default {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.clerk.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Optimize compilation speed
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { isServer }) => {
    // Exclude templates directory from the build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/templates/**', '**/node_modules/**'],
    };

    // Prevent webpack from trying to resolve template files
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/templates': false,
    };

    // Mark @daytonaio/sdk as external to prevent build errors when not installed
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@daytonaio/sdk');
    }

    // Optimize caching and compilation speed
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [CONFIG_FILE],
      },
    };

    // Optimize module resolution
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    };

    return config;
  },
  // Exclude templates directory from being processed
  serverExternalPackages: [],
};
