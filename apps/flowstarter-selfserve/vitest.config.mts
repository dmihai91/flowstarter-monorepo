import { defineConfig } from 'vitest/config';
import * as path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      // Next.js marks server modules with `server-only`, which throws outside a
      // server component graph. Pure helpers from those modules are still worth
      // testing, so the marker resolves to an empty module here.
      'server-only': path.resolve(dir, 'test/stubs/server-only.ts'),
      '@': path.resolve(dir, 'src'),
    },
  },
});
