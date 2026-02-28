import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

const TEMPLATES_DIR = path.resolve(
  process.cwd(),
  '../../flowstarter-library/templates'
);

interface TemplateConfig {
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  features: string[];
  framework?: string;
}

interface TemplateListItem {
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  features: string[];
  thumbnailUrl: string;
}

/**
 * GET /api/editor/templates - List all available templates
 */
export async function GET() {
  try {
    const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
    const templates: TemplateListItem[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const configPath = path.join(TEMPLATES_DIR, entry.name, 'config.json');
      try {
        const raw = await fs.readFile(configPath, 'utf-8');
        const config: TemplateConfig = JSON.parse(raw);

        templates.push({
          slug: config.slug,
          name: config.name,
          description: config.description,
          category: config.category,
          tags: config.tags || [],
          features: config.features || [],
          thumbnailUrl: `/api/editor/templates/${config.slug}/thumbnail`,
        });
      } catch {
        // Skip templates with missing/invalid config
      }
    }

    // Sort alphabetically by name
    templates.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ templates });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to read templates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
