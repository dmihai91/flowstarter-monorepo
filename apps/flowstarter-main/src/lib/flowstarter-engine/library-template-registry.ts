import 'server-only';

import * as fs from 'fs/promises';
import * as path from 'path';
import type { IntegrationKind, TemplateRegistryEntry } from '@flowstarter/editor-engine';

type RawTemplateConfig = {
  slug?: string;
  name?: string;
  description?: string;
  category?: string;
  framework?: string;
  features?: string[];
  tags?: string[];
  integrations?: Record<
    string,
    {
      optional?: boolean;
      providers?: Array<{ id?: string; name?: string }>;
    }
  >;
};

function mapIntegrations(
  integrations?: RawTemplateConfig['integrations']
): TemplateRegistryEntry['integrations'] {
  const result: TemplateRegistryEntry['integrations'] = {};

  for (const [key, value] of Object.entries(integrations ?? {})) {
    if (!value) continue;
    const kind = key as IntegrationKind;
    result[kind] = {
      optional: value.optional ?? true,
      providers: (value.providers ?? [])
        .map((provider) => provider.id || provider.name || '')
        .filter(Boolean),
    };
  }

  return result;
}

export async function loadLibraryTemplateRegistry(): Promise<TemplateRegistryEntry[]> {
  const candidateDirs = [
    path.join(process.cwd(), 'apps', 'flowstarter-library', 'templates'),
    path.join(process.cwd(), '..', 'flowstarter-library', 'templates'),
  ];
  const templatesDir =
    (
      await Promise.all(
        candidateDirs.map(async (candidate) => {
          try {
            await fs.access(candidate);
            return candidate;
          } catch {
            return null;
          }
        })
      )
    ).find(Boolean) ?? candidateDirs[0];
  const entries = await fs.readdir(templatesDir, { withFileTypes: true });
  const registry: TemplateRegistryEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const configPath = path.join(templatesDir, entry.name, 'config.json');

    try {
      const raw = JSON.parse(await fs.readFile(configPath, 'utf-8')) as RawTemplateConfig;
      registry.push({
        slug: raw.slug || entry.name,
        name: raw.name || entry.name,
        description: raw.description || '',
        category: raw.category || 'general',
        framework: raw.framework || 'astro',
        features: raw.features ?? [],
        tags: raw.tags ?? [],
        integrations: mapIntegrations(raw.integrations),
      });
    } catch {
      continue;
    }
  }

  return registry.sort((left, right) => left.slug.localeCompare(right.slug));
}
