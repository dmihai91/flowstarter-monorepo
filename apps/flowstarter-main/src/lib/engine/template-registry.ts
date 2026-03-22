import 'server-only';

import fs from 'fs/promises';
import path from 'path';
import {
  type TemplateRegistryEntry,
  TemplateRegistryEntrySchema,
} from './contracts';

const TEMPLATE_DIR = path.resolve(
  process.cwd(),
  '../flowstarter-library/templates'
);

function toCapabilities(features: string[]) {
  const normalized = features.map((feature) => feature.toLowerCase());
  const hasFeature = (value: string) =>
    normalized.some((feature) => feature.includes(value));

  return {
    supportsBooking: hasFeature('booking'),
    supportsNewsletter: hasFeature('newsletter'),
    supportsContactForm: hasFeature('contact'),
    multiPage: hasFeature('multi-page'),
    darkMode: hasFeature('dark mode'),
  };
}

export async function loadTemplateRegistry(): Promise<TemplateRegistryEntry[]> {
  const dirs = await fs.readdir(TEMPLATE_DIR, { withFileTypes: true });
  const entries = await Promise.all(
    dirs
      .filter((dir) => dir.isDirectory() && !dir.name.startsWith('.'))
      .map(async (dir) => {
        const configPath = path.join(TEMPLATE_DIR, dir.name, 'config.json');
        try {
          const raw = JSON.parse(await fs.readFile(configPath, 'utf8')) as {
            name?: string;
            slug?: string;
            description?: string;
            category?: string;
            tags?: string[];
            features?: string[];
            integrations?: Record<string, { providers?: Array<{ id: string }> }>;
          };

          const features = raw.features ?? [];
          const integrations = Object.values(raw.integrations ?? {}).flatMap(
            (integration) =>
              (integration.providers ?? []).map((provider) => provider.id)
          );

          return TemplateRegistryEntrySchema.parse({
            id: raw.slug ?? dir.name,
            name: raw.name ?? dir.name,
            description: raw.description ?? '',
            category: raw.category ?? 'general',
            tags: raw.tags ?? [],
            features,
            integrations,
            capability: toCapabilities(features),
            registrySource: 'flowstarter-library',
          });
        } catch {
          return null;
        }
      })
  );

  return entries.filter((entry): entry is TemplateRegistryEntry => Boolean(entry));
}
