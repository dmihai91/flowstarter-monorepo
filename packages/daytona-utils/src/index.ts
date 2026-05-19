/**
 * @flowstarter/daytona-utils
 *
 * Shared Daytona sandbox management utilities.
 */

// Types
export type {
  BuildErrorInfo,
  PreviewResult,
  PrewarmedSandbox,
  CachedSandboxInfo,
  DaytonaEnv,
  CleanupResult,
  ReusableSandboxResult,
  BootstrapOptions,
  BootstrapResult,
  Snapshot,
} from './types';

// Client
export {
  getClient,
  getCachedSandbox,
  setCachedSandbox,
  deleteCachedSandbox,
  clearSandboxCache,
  getCachedPreviewUrl,
} from './client';

// Sandbox lifecycle
export {
  findReusableSandbox,
  createSandbox,
  ensureSandboxRunning,
  getPreviewUrl,
  getOrCreateSandbox,
} from './sandbox';

// Bootstrap orchestrator
export { bootstrapWorkspace } from './bootstrap';

// Live preview (push a site dir → sandbox dev server → public URL + teardown)
export { previewInSandbox, pushFileToSandbox } from './preview';
export type { SandboxPreview } from './preview';

// Autonomous in-sandbox build (Agent SDK runs inside the sandbox)
export {
  buildSiteInSandbox,
  editSiteInSandbox,
  fastEditInSandbox,
} from './build-in-sandbox';
export type {
  InSandboxBuild,
  InSandboxBuildOpts,
  InSandboxEdit,
} from './build-in-sandbox';

// Snapshot service
export {
  createSnapshot,
  restoreSnapshot,
  listSnapshots,
  deleteSnapshot,
} from './snapshot';
