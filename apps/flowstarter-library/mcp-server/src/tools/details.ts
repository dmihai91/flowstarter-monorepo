import { z } from 'zod';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import { Template } from '../types/templates.js';

export const GetTemplateDetailsSchema = z.object({
  slug: z.string().describe('The template slug (e.g., local-business-pro)')
});

export async function getTemplateDetails(
  args: z.infer<typeof GetTemplateDetailsSchema>,
  fetcher: TemplateFetcher
): Promise<{ template: Template | null; error?: string }> {
  const template = fetcher.getTemplate(args.slug);
  
  if (!template) {
    return {
      template: null,
      error: `Template not found: ${args.slug}`
    };
  }

  return { template };
}
