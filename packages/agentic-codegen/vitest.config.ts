import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // The pipeline must never hit the network in unit tests — the LLM seam is
    // always injected. A short timeout catches an accidental real call.
    testTimeout: 10_000,
  },
});
