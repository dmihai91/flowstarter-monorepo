/**
 * Server-side AI utilities — import from `@/lib/ai` or task-specific paths.
 */

export {
  models,
  getModel,
  isOpenRouterConfigured,
  default as openrouter,
} from './client';
export type { ParsedFile } from './codeblocks';
export { parseCodeblocks } from './codeblocks';
export {
  enrichProject,
  type EnrichedProjectData,
  type ClarificationResult,
  type CompleteResult,
  type EnrichmentResult,
} from './extract-brief';
export {
  generateSiteCopy,
  type SiteCopyInput,
  type SiteCopy,
} from './site-copy';
export { classifyProject, type ClassificationResult } from './classify-project';
export {
  classifyClientRequest,
  type ClassifiedClientRequest,
} from './classify-client-request';
export { aiModerateContent, type ModerationResult } from './moderate';
export type { TemplateInfo, WebsiteProjectDetails } from './types';
