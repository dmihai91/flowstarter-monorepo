import { z } from 'zod';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import { TemplateListItem } from '../types/templates.js';

export const SearchTemplatesSchema = z.object({
  query: z.string().describe('Search query to match against template names, descriptions, and use cases')
});

export async function searchTemplates(
  args: z.infer<typeof SearchTemplatesSchema>,
  fetcher: TemplateFetcher
): Promise<{ templates: TemplateListItem[] }> {
  const templates = fetcher.searchTemplates(args.query);
  
  const templateList: TemplateListItem[] = templates.map(template => ({
    slug: template.metadata.slug,
    displayName: template.metadata.displayName,
    description: template.metadata.description,
    category: template.metadata.category,
    useCase: template.metadata.useCase,
    fileCount: template.metadata.stats.fileCount,
    totalLOC: template.metadata.stats.totalLOC,
    theme: template.config?.theme,
    palettes: template.config?.palettes,
    fonts: template.config?.fonts
  }));

  return { templates: templateList };
}
