/**
 * Hook for managing Daytona-based preview rendering.
 *
 * This file re-exports from the refactored module structure.
 * @see ./daytona-preview/index.ts for implementation.
 */

export {
  useDaytonaPreview,
  fixBuildErrorWithLLM,
  createAutoFixHandler,
} from './daytona-preview';

export type {
  BuildError,
  DaytonaPreviewState,
  UseDaytonaPreviewOptions,
  UseDaytonaPreviewResult,
} from './daytona-preview';
