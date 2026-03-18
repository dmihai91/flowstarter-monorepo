import { z } from 'zod';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import { TemplateListItem } from '../types/templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../../../');

// Get base URL for image serving
const BASE_URL = process.env.PUBLIC_URL || 'http://localhost:3001';

export const ListTemplatesSchema = z.object({});

export async function listTemplates(
  fetcher: TemplateFetcher
): Promise<{ templates: TemplateListItem[] }> {
  // Always refresh templates from disk to ensure we see new additions
  await fetcher.initialize();
  
  const templates = fetcher.getAllTemplates();
  
  const templateList: TemplateListItem[] = templates.map(template => {
    const slug = template.metadata.slug;
    const thumbnailPath = path.join(TEMPLATES_DIR, slug, 'thumbnail.png');
    const thumbnailLightPath = path.join(TEMPLATES_DIR, slug, 'thumbnail-light.png');
    const thumbnailDarkPath = path.join(TEMPLATES_DIR, slug, 'thumbnail-dark.png');
    const previewPath = path.join(TEMPLATES_DIR, slug, 'preview.png');
    
    return {
      slug,
      displayName: template.metadata.displayName,
      description: template.metadata.description,
      category: template.metadata.category,
      useCase: template.metadata.useCase,
      fileCount: template.metadata.stats.fileCount,
      totalLOC: template.metadata.stats.totalLOC,
      thumbnailUrl: fs.existsSync(thumbnailPath)
        ? `${BASE_URL}/api/templates/${slug}/thumbnail`
        : undefined,
      thumbnailLightUrl: fs.existsSync(thumbnailLightPath)
        ? `${BASE_URL}/api/templates/${slug}/thumbnail-light`
        : undefined,
      thumbnailDarkUrl: fs.existsSync(thumbnailDarkPath)
        ? `${BASE_URL}/api/templates/${slug}/thumbnail-dark`
        : undefined,
      previewUrl: fs.existsSync(previewPath)
        ? `${BASE_URL}/api/templates/${slug}/preview`
        : undefined,
      theme: template.config?.theme,
      palettes: template.config?.palettes,
      fonts: template.config?.fonts
    };
  });

  return { templates: templateList };
}
