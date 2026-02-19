/**
 * Daytona Service Types
 *
 * Shared types for the Daytona service modules.
 */

/**
 * Build error info returned when preview fails due to syntax/build errors
 */
export interface BuildErrorInfo {
  file: string;
  line: string;
  message: string;
  fullOutput: string;
}

/**
 * Result from startPreview
 */
export interface PreviewResult {
  success: boolean;
  previewUrl?: string;
  sandboxId?: string;
  error?: string;

  /** Structured build error info - present when build fails due to syntax errors */
  buildError?: BuildErrorInfo;
}

/**
 * Pre-warmed sandbox result
 */
export interface PrewarmedSandbox {
  sandboxId: string;
  hasBun: boolean;
}

/**
 * Cached sandbox info
 */
export interface CachedSandboxInfo {
  sandboxId: string;
  previewUrl: string | null;
}

/**
 * Environment configuration for Daytona API
 */
export interface DaytonaEnv {
  DAYTONA_API_KEY?: string;
  DAYTONA_API_URL?: string;
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  deleted: number;
  failed: number;
  errors: string[];
}

/**
 * Reusable sandbox search result
 */
export interface ReusableSandboxResult {
  sandbox: import('@daytonaio/sdk').Sandbox;
  needsStart: boolean;
}

