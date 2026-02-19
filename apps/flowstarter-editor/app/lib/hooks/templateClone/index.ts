/**
 * Template Clone Module
 *
 * Exports for template cloning functionality.
 */

export type {
  ScaffoldFile,
  ScaffoldData,
  CachedScaffold,
  CloneOptions,
  CloneResult,
  UseTemplateCloneResult,
} from './types';

export { clearTemplateCache } from './cache';
export { fetchScaffoldData } from './fetchScaffold';
export { createFileBatches } from './batchUtils';
export { applyCustomizations } from './customizations';
export { getPlaceholderTemplate, getPlaceholderFiles } from './placeholders';

