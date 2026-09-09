import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import path from 'path';
import { readFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', '.next/**', 'templates/**'],
    setupFiles: ['./test/setup.ts'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    pool: 'forks',
    // `poolOptions.forks.{singleFork,isolate,execArgv}` was removed in
    // Vitest 4; these are top-level options now (`singleFork` itself was
    // dropped -- forks pool already defaults to multiple forks).
    // `isolate` is `true` (not the previous `false`) because with the
    // dependency bumps on this branch, several suites register their own
    // `vi.mock('@clerk/nextjs/server', ...)` factory per file; sharing a
    // module registry across files (isolate: false) let one file's mock
    // leak into another's and flip auth-gated assertions (e.g.
    // pipeline-api.test.ts, claim-route.test.ts) depending on run order.
    isolate: true,
    execArgv: ['--max-old-space-size=4096'],
    maxConcurrency: 20,
    fileParallelism: true,
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
      // `server-only` is a guard package: outside a bundler's "browser"
      // export condition (which Vitest doesn't apply), its real module
      // unconditionally throws "This module cannot be imported from a
      // Client Component module". Alias it to a no-op at the Vite resolver
      // level so every import of it -- direct or via a dependency's own
      // internal `require('server-only')` -- resolves to the stub instead
      // of the throwing implementation, regardless of which pnpm-hoisted
      // copy would otherwise be loaded.
      'server-only': path.resolve(__dirname, './test/empty-module.ts'),
    },
    // Dedupe React to prevent "Invalid hook call" from multiple React copies
    // (happens when @flowstarter/flow-design-system pulls its own React instance)
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
});
