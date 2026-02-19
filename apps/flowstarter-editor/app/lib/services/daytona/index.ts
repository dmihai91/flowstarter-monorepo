/**
 * Daytona Service
 *
 * Main entry point for the Daytona service.
 * Re-exports all public APIs from submodules.
 *
 * Uses the official Daytona SDK for sandbox creation, file syncing, and preview URL generation.
 * This provides a cleaner API than raw fetch calls and handles authentication/retries automatically.
 */

// Types
export type { BuildErrorInfo, PreviewResult, PrewarmedSandbox, CleanupResult, DaytonaEnv } from './types';

// Client utilities
export { getCachedPreviewUrl, clearCachedPreview } from './client';

// Convex persistence (fallback for worker restarts)
export { fetchPreviewUrl, persistPreviewUrl, clearPersistedPreviewUrl } from './convexClient';

// Preview management (optimized)
export { startPreview, refreshPreview, retryPreviewWithFiles, stopPreview, ensurePoolInitialized } from './previewService';

// Sandbox Pool (pre-warmed sandboxes)
export { initializePool, getPoolStats, stopPool } from './sandboxPool';

// Hash Cache (skip reinstalls when package.json unchanged)
export { needsInstall, recordInstall, clearHashCache } from './hashCache';

// Pre-warming (legacy)
export { prewarmSandbox, startPreviewWithPrewarmedSandbox } from './prewarmService';

// Cleanup
export { cleanupAllSandboxes } from './cleanupService';

// Dev server utilities
export { runAstroCheck } from './devServerService';

