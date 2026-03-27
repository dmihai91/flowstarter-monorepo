import 'server-only';

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  IntegrationKind,
  TemplateRegistryEntry as BaseTemplateRegistryEntry,
} from '@flowstarter/editor-engine';

export interface TemplatePalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export interface TemplateFont {
  id: string;
  name: string;
  heading: {
    family: string;
    weight?: number;
  };
  body: {
    family: string;
    weight?: number;
  };
}

export interface LibraryTemplateRegistryEntry extends BaseTemplateRegistryEntry {
  previewImage?: string;
  defaultPaletteId?: string;
  defaultFontId?: string;
  palettes: TemplatePalette[];
  fonts: TemplateFont[];
}

type RawTemplateConfig = {
  slug?: string;
  name?: string;
  description?: string;
  category?: string;
  framework?: string;
  features?: string[];
  tags?: string[];
  preview?: string;
  defaultPaletteId?: string;
  defaultFontId?: string;
  fonts?: Array<{
    id?: string;
    name?: string;
    heading?: string;
    body?: string;
  }>;
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
): BaseTemplateRegistryEntry['integrations'] {
  const result: BaseTemplateRegistryEntry['integrations'] = {};

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

const FALLBACK_PALETTE_COLORS: TemplatePalette['colors'] = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  accent: '#f97316',
  background: '#ffffff',
  text: '#0f172a',
};

const FALLBACK_FONTS: TemplateFont[] = [
  { id: 'font-1', name: 'Editorial', heading: { family: 'Fraunces', weight: 700 }, body: { family: 'Inter', weight: 400 } },
  { id: 'font-2', name: 'Modern', heading: { family: 'Space Grotesk', weight: 700 }, body: { family: 'Inter', weight: 400 } },
  { id: 'font-3', name: 'Classic', heading: { family: 'Libre Baskerville', weight: 700 }, body: { family: 'Source Sans 3', weight: 400 } },
  { id: 'font-4', name: 'Strong', heading: { family: 'Oswald', weight: 600 }, body: { family: 'DM Sans', weight: 400 } },
  { id: 'font-5', name: 'Friendly', heading: { family: 'Poppins', weight: 600 }, body: { family: 'Nunito', weight: 400 } },
  { id: 'font-6', name: 'Minimal', heading: { family: 'Manrope', weight: 700 }, body: { family: 'Inter', weight: 400 } },
];

function normalizePaletteColors(
  colors?: Record<string, string>
): TemplatePalette['colors'] {
  return {
    primary: colors?.primary || colors?.['primary-dark'] || FALLBACK_PALETTE_COLORS.primary,
    secondary: colors?.secondary || colors?.accent || FALLBACK_PALETTE_COLORS.secondary,
    accent: colors?.accent || colors?.secondary || FALLBACK_PALETTE_COLORS.accent,
    background: colors?.background || colors?.surface || FALLBACK_PALETTE_COLORS.background,
    text: colors?.text || colors?.['text-muted'] || FALLBACK_PALETTE_COLORS.text,
  };
}

async function loadTemplatePalettes(templateDir: string): Promise<TemplatePalette[]> {
  const palettesDir = path.join(templateDir, 'palettes');

  try {
    const paletteFiles = (await fs.readdir(palettesDir))
      .filter((file) => file.endsWith('.json'))
      .sort();

    const palettes = await Promise.all(
      paletteFiles.map(async (file, index) => {
        const content = JSON.parse(
          await fs.readFile(path.join(palettesDir, file), 'utf-8')
        ) as {
          id?: string;
          name?: string;
          colors?: Record<string, string>;
        };

        return {
          id: content.id || `palette-${index + 1}`,
          name: content.name || `Palette ${index + 1}`,
          colors: normalizePaletteColors(content.colors),
        } satisfies TemplatePalette;
      })
    );

    return palettes;
  } catch {
    return [];
  }
}

function fillPaletteVariants(palettes: TemplatePalette[]): TemplatePalette[] {
  const base = palettes.length > 0
    ? palettes
    : [{ id: 'palette-1', name: 'Default', colors: FALLBACK_PALETTE_COLORS }];

  return Array.from({ length: 6 }, (_, index) => {
    const palette = base[index] || base[index % base.length];
    return {
      ...palette,
      id: palette.id || `palette-${index + 1}`,
      name: palette.name || `Palette ${index + 1}`,
    };
  });
}

function fillFontVariants(fonts: TemplateFont[]): TemplateFont[] {
  const base = fonts.length > 0 ? fonts : FALLBACK_FONTS;

  return Array.from({ length: 6 }, (_, index) => {
    const font = base[index] || base[index % base.length];
    return {
      ...font,
      id: font.id || `font-${index + 1}`,
      name: font.name || `Font ${index + 1}`,
      heading: font.heading,
      body: font.body,
    };
  });
}

function normalizeFonts(rawFonts?: RawTemplateConfig['fonts']): TemplateFont[] {
  if (!rawFonts?.length) {
    return fillFontVariants([]);
  }

  return fillFontVariants(
    rawFonts.map((font, index) => ({
      id: font.id || `font-${index + 1}`,
      name: font.name || `Font ${index + 1}`,
      heading: {
        family: font.heading || FALLBACK_FONTS[index % FALLBACK_FONTS.length].heading.family,
      },
      body: {
        family: font.body || FALLBACK_FONTS[index % FALLBACK_FONTS.length].body.family,
      },
    }))
  );
}

export async function loadLibraryTemplateRegistry(): Promise<LibraryTemplateRegistryEntry[]> {
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
  const registry: LibraryTemplateRegistryEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const configPath = path.join(templatesDir, entry.name, 'config.json');

    try {
      const raw = JSON.parse(await fs.readFile(configPath, 'utf-8')) as RawTemplateConfig;
      const palettes = fillPaletteVariants(
        await loadTemplatePalettes(path.join(templatesDir, entry.name))
      );
      const fonts = normalizeFonts(raw.fonts);

      registry.push({
        slug: raw.slug || entry.name,
        name: raw.name || entry.name,
        description: raw.description || '',
        category: raw.category || 'general',
        framework: raw.framework || 'astro',
        features: raw.features ?? [],
        tags: raw.tags ?? [],
        previewImage: raw.preview,
        defaultPaletteId: raw.defaultPaletteId || palettes[0]?.id,
        defaultFontId: raw.defaultFontId || fonts[0]?.id,
        palettes,
        fonts,
        integrations: mapIntegrations(raw.integrations),
      });
    } catch {
      continue;
    }
  }

  return registry.sort((left, right) => left.slug.localeCompare(right.slug));
}
