/**
 * Runtime Mode Store
 *
 * Controls which runtime environment is used for builds and previews.
 * Currently only Daytona (cloud-based sandboxes) is supported.
 */

import { atom } from 'nanostores';

export type RuntimeMode = 'daytona';

// Daytona is the only supported runtime
const DEFAULT_RUNTIME_MODE: RuntimeMode = 'daytona';

/**
 * Runtime mode store - determines build/preview runtime
 */
export const runtimeModeStore = atom<RuntimeMode>(DEFAULT_RUNTIME_MODE);

/**
 * Synchronous getter for runtime mode
 * Use this during module initialization where hooks cannot be used
 */
export function getRuntimeMode(): RuntimeMode {
  return runtimeModeStore.get();
}

/**
 * Check if currently using Daytona runtime (always true)
 */
export function isDaytonaMode(): boolean {
  return true;
}

