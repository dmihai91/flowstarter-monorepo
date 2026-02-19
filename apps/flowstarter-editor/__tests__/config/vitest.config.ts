/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./__tests__/config/setup.ts'],
    globals: true,
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/public/**', '**/.dev/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        'public/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/*.{test,spec}.{js,ts,tsx}',
        'app/entry.client.tsx',
        'app/entry.server.tsx',
        'app/root.tsx',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    // Browser mode disabled for now - use jsdom environment for unit tests
    // browser: {
    //   enabled: true,
    //   headless: true,
    //   provider: 'playwright',
    //   name: 'chromium',
    // },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '../../app'),
    },
  },
});

