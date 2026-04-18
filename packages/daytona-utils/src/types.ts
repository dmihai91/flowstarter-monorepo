/**
 * Daytona Utils — Shared Types
 */

export interface BuildErrorInfo {
  file: string;
  line: string;
  message: string;
  fullOutput: string;
}

export interface PreviewResult {
  success: boolean;
  previewUrl?: string;
  sandboxId?: string;
  error?: string;
  buildError?: BuildErrorInfo;
}

export interface PrewarmedSandbox {
  sandboxId: string;
  hasBun: boolean;
}

export interface CachedSandboxInfo {
  sandboxId: string;
  previewUrl: string | null;
}

export interface DaytonaEnv {
  DAYTONA_API_KEY?: string;
  DAYTONA_API_URL?: string;
}

export interface CleanupResult {
  deleted: number;
  failed: number;
  errors: string[];
}

export interface ReusableSandboxResult {
  sandbox: import('@daytonaio/sdk').Sandbox;
  needsStart: boolean;
}

export interface BootstrapOptions {
  projectId: string;
  files: Record<string, string>;
  env?: DaytonaEnv;
  onProgress?: (step: number, message: string) => void;
}

export interface BootstrapResult {
  success: boolean;
  sandboxId?: string;
  previewUrl?: string;
  error?: string;
  failedAtStep?: number;
}

export interface Snapshot {
  id: string;
  projectId: string;
  sandboxId: string;
  createdAt: string;
  sizeBytes?: number;
}
