import { projectTemplates } from '@/data/project-templates';
import type { ProjectConfig, ProjectTemplate } from '@/types/project-config';

/**
 * Maps a template ID to a local ProjectTemplate shape
 */
export function toLocalTemplate(templateId: string): ProjectTemplate | null {
  const t = projectTemplates.find((pt) => pt.id === templateId);
  if (!t) return null;

  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: typeof t.category === 'string' ? t.category : t.category.name,
    features: t.features.map((f) =>
      typeof (f as { name?: string }) === 'object' &&
      (f as { name?: string }).name
        ? (f as { name: string }).name
        : (f as unknown as string)
    ),
    complexity: t.complexity,
  } as ProjectTemplate;
}

/**
 * Creates a serializable version of projectConfig (removes circular refs)
 */
export function toSerializableConfig(config: ProjectConfig) {
  const { template, ...rest } = config;

  // Create a clean template object without circular references
  const cleanTemplate = template
    ? {
        id: template.id,
        name: template.name,
        description: template.description,
        category:
          typeof template.category === 'string'
            ? template.category
            : template.category?.name || '',
        features: Array.isArray(template.features)
          ? template.features.map((f) =>
              typeof f === 'object' && f !== null && 'name' in f
                ? (f as { name: string }).name
                : String(f)
            )
          : [],
        complexity: template.complexity,
      }
    : null;

  return {
    ...rest,
    template: cleanTemplate,
  };
}

/**
 * Creates a snapshot string for change detection
 */
export function createStateSnapshot(
  config: ProjectConfig,
  wizardState: {
    currentStep: string;
    detailsPhase: string;
    showSummary: boolean;
    templatePath: string | null;
    showAssistantTransition: boolean;
    startedWithTemplate: boolean;
    reviewState?: unknown;
  }
) {
  return JSON.stringify({
    ...toSerializableConfig(config),
    ...wizardState,
  });
}
