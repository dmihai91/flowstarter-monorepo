import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', '.next/**', 'templates/**'],
    setupFiles: ['./test/setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Use single worker to prevent OOM
        isolate: false, // Disable isolation for faster cleanup
        execArgv: ['--max-old-space-size=8192'],
      },
    },
    // Run tests within files concurrently, but files sequentially to prevent OOM
    maxConcurrency: 20,
    fileParallelism: false,
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/__tests__/**',
        'src/test/**',
        'src/**/*.d.ts',
        'src/components/template-preview/**',
        'src/components/editor/index.ts',
        'src/app/global-error.tsx',
        'src/app/not-found.tsx',
      ],
      thresholds: {
        lines: 82,
        functions: 82,
        branches: 65,
        statements: 82,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
