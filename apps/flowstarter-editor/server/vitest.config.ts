import { defineConfig } from "vitest/config";

// Standalone vitest config for the editor server.
//
// Upstream T3 had a root `apps/t3-code/vitest.config.ts` that aliased
// `@t3tools/contracts` so server tests resolved against the contracts
// source. We renamed the workspace packages to `@flowstarter/editor-*`
// and rely on pnpm workspace resolution, so the alias is no longer
// needed — keeping this file dependency-free avoids the brittle
// `../../vitest.config` lookup that broke after the rename.
export default defineConfig({
  test: {
    // The server suite exercises sqlite, git, temp worktrees, and
    // orchestration runtimes heavily. Running files in parallel
    // introduces load-sensitive flakes.
    fileParallelism: false,
    // Server integration tests exercise sqlite, git, and orchestration
    // together. Under package-wide parallel runs they regularly exceed
    // the default 15s budget.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
