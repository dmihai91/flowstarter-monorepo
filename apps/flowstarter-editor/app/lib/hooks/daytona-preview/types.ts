/**
 * Types for Daytona preview hook.
 */

// eslint-disable-next-line no-restricted-imports
import type { Id } from '../../../../convex/_generated/dataModel';

export interface BuildError {
  file: string;
  line: string;
  message: string;
  fullOutput: string;
}

export interface DaytonaPreviewState {
  status: 'idle' | 'creating' | 'syncing' | 'starting' | 'reconnecting' | 'ready' | 'error';
  workspaceId: string | null;
  previewUrl: string | null; // The proxied URL (local) for iframe
  rawPreviewUrl: string | null; // The actual Daytona URL
  displayUrl: string | null; // The friendly URL to show in address bar
  error: string | null;
  buildError: BuildError | null; // Structured build error for agent to fix
}

export interface UseDaytonaPreviewOptions {
  projectId: Id<'projects'> | null;
  autoStart?: boolean;

  /** Called when a build error is detected. Return fixed files to auto-retry, or null to skip auto-fix. */
  onBuildError?: (
    buildError: BuildError,
    currentFiles: Record<string, string>,
  ) => Promise<Record<string, string> | null>;

  /** Max number of auto-fix attempts before giving up */
  maxAutoFixAttempts?: number;
}

export interface UseDaytonaPreviewResult {
  state: DaytonaPreviewState;
  startPreview: () => Promise<void>;
  stopPreview: () => Promise<void>;
  refreshPreview: () => Promise<void>;
  retryPreview: () => Promise<void>;

  /** Manually trigger a fix for the current build error */
  fixAndRetry: (fixedFiles: Record<string, string>) => Promise<void>;
  isReady: boolean;

  /** Number of auto-fix attempts made for current preview */
  autoFixAttempts: number;
}

/** Response from the preview API */
export interface PreviewApiResponse {
  success?: boolean;
  error?: string;
  sandboxId?: string;
  previewUrl?: string;
  buildError?: BuildError;
}

/** Project data from Convex query */
export interface ProjectData {
  name?: string;
  urlId?: string;
  workspaceUrl?: string;
  daytonaWorkspaceId?: string;
  workspaceStatus?: string;
}

/** File data from Convex query */
export interface ProjectFileData {
  path: string;
  type: 'file' | 'folder';
  isBinary?: boolean;
  content?: string;
}
