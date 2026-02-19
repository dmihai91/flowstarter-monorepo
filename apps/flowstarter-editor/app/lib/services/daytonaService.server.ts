/**
 * Daytona Service (Server-side)
 *
 * This file re-exports from the modular daytona/ directory structure.
 * Use imports from this file for backwards compatibility.
 *
 * @see ./daytona/index.ts for the main module
 */

export {

  // Types
  type BuildErrorInfo,
  type PreviewResult,
  type PrewarmedSandbox,
  type CleanupResult,
  type DaytonaEnv,

  // Client utilities
  getCachedPreviewUrl,
  clearCachedPreview,
  
  // Convex persistence (fallback for worker restarts)
  fetchPreviewUrl,
  persistPreviewUrl,
  clearPersistedPreviewUrl,

  // Preview management
  startPreview,
  runAstroCheck,
  refreshPreview,
  retryPreviewWithFiles,
  stopPreview,

  // Pre-warming
  prewarmSandbox,
  startPreviewWithPrewarmedSandbox,

  // Cleanup
  cleanupAllSandboxes,
} from './daytona';

