/**
 * Editor Chat Utilities
 *
 * Pure utility functions extracted from useEditorChatState for better
 * testability and reusability.
 */

import type { WizardOutputDTO } from '~/lib/hooks/types/orchestrator.dto';
import { workbenchStore } from '~/lib/stores/workbench';
import { DEFAULT_PALETTE } from '~/lib/config/palettes';
import { DEFAULT_FONTS, type FontPairing } from '~/lib/config/fonts';
import type { ColorPalette } from '../types';
import type { ColorPalette as StoreColorPalette } from '~/lib/stores/palettes';

// ─── ID Generation ──────────────────────────────────────────────────────────

let idCounter = 0;

/**
 * Generate a unique message ID that won't collide even within the same millisecond
 */
export function generateMessageId(prefix: 'user' | 'msg'): string {
  idCounter = (idCounter + 1) % 10000;
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Palette Conversion ─────────────────────────────────────────────────────

/**
 * Convert ColorPalette (string[] colors) to StoreColorPalette (tuple colors).
 * Returns a default palette if the input is null or has insufficient colors.
 */
export function ColorPaletteToColorPalette(palette: ColorPalette | null): StoreColorPalette {
  if (!palette || palette.colors.length < 4) {
    return {
      id: 'default',
      name: 'Default',
      colors: [
        DEFAULT_PALETTE.colors.primary,
        DEFAULT_PALETTE.colors.secondary,
        DEFAULT_PALETTE.colors.accent,
        DEFAULT_PALETTE.colors.background,
      ],
    };
  }

  return {
    id: palette.id,
    name: palette.name,
    colors: [palette.colors[0], palette.colors[1], palette.colors[2], palette.colors[3]],
  };
}

// ─── Path Utilities ─────────────────────────────────────────────────────────

/**
 * Normalize a file path:
 * - Convert backslashes to forward slashes (Windows paths)
 * - Ensure leading forward slash
 * - Remove double slashes
 */
export function normalizePath(filePath: string): string {
  // Convert backslashes to forward slashes
  let normalized = filePath.replace(/\\/g, '/');

  // Remove double slashes (except protocol://)
  normalized = normalized.replace(/([^:])\/\//g, '$1/');

  // Ensure leading slash
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  return normalized;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConvexFileEntry {
  type: string;
  content: string;
  isBinary: boolean;
}

export interface ConvexProjectData {
  palette?: {
    id: string;
    name: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
  };
  fonts?: {
    id: string;
    name: string;
    heading: { family: string; weight: number };
    body: { family: string; weight: number };
    googleFonts: string;
  };
}

export interface BuildWizardOutputParams {
  projectId: string;
  projectName: string;
  urlId: string;
  description: string;
  template: { id: string; name: string; slug?: string; category?: string } | null;
  palette: { id: string; name: string; colors: string[] } | null;
  font: { id: string; name: string; heading: string; body: string; googleFonts?: string } | null;
  businessInfo?: {
    uvp?: string;
    targetAudience?: string;
    businessGoals?: string[];
    brandTone?: string;
    pricingOffers?: string;
  } | null;
  tier?: 'standard' | 'premium';
  sessionId?: string;
}

// ─── WizardOutput Builder ───────────────────────────────────────────────────

/**
 * Build WizardOutputDTO from wizard state
 *
 * This function converts the wizard's collected state into the format
 * expected by the orchestrator.
 */
export function buildWizardOutput(params: BuildWizardOutputParams): WizardOutputDTO {
  const {
    projectId,
    projectName,
    urlId,
    description,
    template,
    palette,
    font,
    businessInfo,
    tier = 'standard',
    sessionId,
  } = params;

  return {
    project: {
      projectId,
      name: projectName,
      urlId,
      description,
    },
    businessInfo: {
      uvp: businessInfo?.uvp || description,
      targetAudience: businessInfo?.targetAudience || 'General audience',
      businessGoals: businessInfo?.businessGoals || ['Build online presence'],
      brandTone: businessInfo?.brandTone || 'professional',
      pricingOffers: businessInfo?.pricingOffers,
    },
    palette: {
      id: palette?.id || DEFAULT_PALETTE.id,
      name: palette?.name || DEFAULT_PALETTE.name,
      colors: palette?.colors || [
        DEFAULT_PALETTE.colors.primary,
        DEFAULT_PALETTE.colors.secondary,
        DEFAULT_PALETTE.colors.accent,
        DEFAULT_PALETTE.colors.background,
        DEFAULT_PALETTE.colors.text,
      ],
    },
    fonts: {
      id: font?.id || DEFAULT_FONTS.id,
      name: font?.name || DEFAULT_FONTS.name,
      heading: font?.heading || DEFAULT_FONTS.heading.family,
      body: font?.body || DEFAULT_FONTS.body.family,
      googleFonts: font?.googleFonts || DEFAULT_FONTS.googleFonts,
    },
    template: {
      id: template?.id || template?.slug || 'default',
      name: template?.name || 'Default Template',
      category: template?.category,
    },
    tier,
    sessionId,
    completedAt: Date.now(),
  };
}

// ─── Config File Generation ─────────────────────────────────────────────────

/**
 * Generate essential config files for an Astro project with the given palette and fonts.
 * These files are used when creating a new project or resuming a build.
 */
export function getEssentialConfigFiles(
  templateSlug: string,
  palette?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  },
  font?: {
    heading: string;
    body: string;
  },
): Record<string, string> {
  const projectName = 'my-website';

  // Use provided values or fall back to configured defaults
  const colors = palette || DEFAULT_PALETTE.colors;

  const fonts = font || {
    heading: DEFAULT_FONTS.heading.family,
    body: DEFAULT_FONTS.body.family,
  };

  // Generate Google Fonts URL
  const headingFont = fonts.heading.replace(/ /g, '+');
  const bodyFont = fonts.body.replace(/ /g, '+');
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${headingFont}:wght@500;600;700&family=${bodyFont}:wght@400;500;600;700&display=swap`;

  return {
    '/package.json': JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'astro dev',
          build: 'astro build',
          preview: 'astro preview',
        },
        dependencies: {
          astro: '^4.16.0',
          '@astrojs/tailwind': '^5.1.0',
          tailwindcss: '^3.4.17',
        },
        devDependencies: {
          autoprefixer: '^10.4.20',
          postcss: '^8.4.49',
          typescript: '^5.7.2',
        },
      },
      null,
      2,
    ),
    '/astro.config.mjs': `import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  server: {
    port: 4321,
    host: true,
  },
});`,
    '/tailwind.config.mjs': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '${colors.primary}',
        secondary: '${colors.secondary}',
        accent: '${colors.accent}',
        background: '${colors.background}',
        foreground: '${colors.text}',
      },
      fontFamily: {
        heading: ['${fonts.heading}', 'sans-serif'],
        body: ['${fonts.body}', 'sans-serif'],
      },
    },
  },
  plugins: [],
};`,
    '/postcss.config.cjs': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,
    '/tsconfig.json': JSON.stringify(
      {
        extends: 'astro/tsconfigs/strict',
        compilerOptions: {
          strictNullChecks: true,
        },
      },
      null,
      2,
    ),
    '/src/styles/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-text: ${colors.text};
  --font-heading: '${fonts.heading}', sans-serif;
  --font-body: '${fonts.body}', sans-serif;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-background);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
`,
    '/src/layouts/Layout.astro': `---
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="${googleFontsUrl}" rel="stylesheet" />
  </head>
  <body>
    <slot />
  </body>
</html>

<style is:global>
  @import '../styles/globals.css';
</style>`,
    '/src/pages/index.astro': `---
import Layout from '../layouts/Layout.astro';
---

<Layout title="${projectName}">
  <main class="min-h-screen bg-background text-foreground">
    <div class="container mx-auto px-4 py-16">
      <h1 class="text-5xl font-heading font-bold text-primary mb-6">
        Welcome to ${projectName}
      </h1>
      <p class="text-xl font-body text-foreground/80 max-w-2xl">
        This is your new Astro website. Start editing to customize it to your needs.
      </p>
    </div>
  </main>
</Layout>`,
  };
}

// ─── File Sync Utilities ────────────────────────────────────────────────────

/**
 * Sync files from orchestrator to workbench store
 * 
 * @deprecated Use `useSyncToWorkbench` hook from `~/lib/hooks/useApiQueries` instead.
 * This hook provides React Query benefits (retries, caching, loading states).
 */
export async function syncFilesToWorkbench(orchestrationId: string): Promise<void> {
  try {
    // Fetch files from Convex via the orchestrator API
    const response = await fetch('/api/orchestrator?action=files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orchestrationId }),
    });

    if (!response.ok) {
      console.error('Failed to fetch files from orchestrator');
      return;
    }

    const data = (await response.json()) as { files?: Record<string, string> };
    const files = data.files || {};

    // Write each file to the workbench
    for (const [filePath, content] of Object.entries(files)) {
      await workbenchStore.createFile(filePath, content);
    }

    // Show the workbench after files are synced
    workbenchStore.setShowWorkbench(true);
    console.log(`Synced ${Object.keys(files).length} files to workbench`);
  } catch (error) {
    console.error('Failed to sync files to workbench:', error);
  }
}

