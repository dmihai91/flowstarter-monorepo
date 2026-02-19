import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['app/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '~/convex': path.resolve(__dirname, './convex'),
      '~': path.resolve(__dirname, './app'),
    },
  },
});

