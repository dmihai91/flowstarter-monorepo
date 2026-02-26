/**
 * React Query Hooks for Editor API Calls
 * 
 * Centralized API hooks with caching, retries, and error handling.
 */

// Keys & Configuration
export { queryKeys, STALE_TIME } from './keys';

// Recommendations
export { useRecommendations } from './recommendations';
export type { RecommendationsParams } from './recommendations';

// Projects
export { useGenerateProjectName } from './projects';
export type { GenerateNameParams, GenerateNameResult } from './projects';

// Business Info
export { useExtractBusinessInfo, useGenerateBusinessInfo } from './business';
export type { ExtractBusinessInfoParams, GenerateBusinessInfoParams } from './business';

// Templates
export { useTemplateTheme } from './templates';
export type { TemplateTheme } from './templates';

// Logo
export { useGenerateLogo } from './logo';
export type { GenerateLogoParams, GenerateLogoResult } from './logo';

// File Operations
export {
  useSyncFiles,
  useOrchestratorFiles,
  useFetchTemplateFiles,
  useSyncFilesToConvex,
  useSyncToWorkbench,
  fetchTemplateFiles,
  syncFilesToConvex,
} from './files';
export type {
  SyncFilesParams,
  OrchestratorFilesParams,
  OrchestratorFilesResult,
  FetchTemplateFilesParams,
  TemplateFilesResult,
  SyncFilesToConvexParams,
  SyncToWorkbenchParams,
  SyncToWorkbenchResult,
} from './files';

// Daytona
export { useStartDaytonaPreview, useSyncToDaytona, startDaytonaPreview } from './daytona';
export type {
  StartPreviewParams,
  StartPreviewResult,
  SyncToDaytonaParams,
  SyncToDaytonaResult,
} from './daytona';

// Build / Site Generation
export { useGenerateSite, useGenerateSiteStream, useBuildPipeline } from './build';
export type {
  GenerateSiteParams,
  GenerateSiteResult,
  GenerateSiteStreamParams,
  GenerateSiteStreamResult,
  BuildPipelineParams,
  BuildPipelineResult,
} from './build';
