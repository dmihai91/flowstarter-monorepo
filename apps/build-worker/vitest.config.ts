import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Nothing in this worker may reach the network, Supabase, git or Pi during
    // unit tests — every one of those is an injected seam. A short timeout
    // catches an accidental real call.
    testTimeout: 10_000,
  },
});
