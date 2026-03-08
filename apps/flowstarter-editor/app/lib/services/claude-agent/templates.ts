/**
 * Claude Agent Service - Template Configuration
 *
 * Template mapping and default file generation.
 */

import type { SiteGenerationInput } from './types';

/** Virtual template mapping to base templates */
export const TEMPLATE_MAPPING: Record<string, string> = {
  // Map virtual/old slugs to real MCP slugs
  'medical-clinic':   'therapist-care',   // closest healthcare template
  'dental-clinic':    'therapist-care',
  'healthcare':       'therapist-care',
  'fitness-studio':   'fitness-coach',
  'fitness':          'fitness-coach',
  'restaurant-page':  'coach-pro',
  'local-service':    'coach-pro',
  'real-estate-pro':  'coach-pro',
  'agency-modern':    'creative-portfolio',
  'minimal-blog':     'creative-portfolio',
  'modern-business':  'coach-pro',        // fallback for old references
  'coaching':         'coach-pro',
  'wellness':         'wellness-holistic',
  'education':        'academic-tutor',
  'tutor':            'academic-tutor',
  'beauty':           'beauty-stylist',
  'music':            'music-teacher',
  'therapy':          'therapist-care',
  'workshop':         'workshop-host',
};

/**
 * Generate default package.json content
 */
export function generatePackageJson(siteName: string): string {
  return JSON.stringify(
    {
      name: siteName.toLowerCase().replace(/\s+/g, '-'),
      type: 'module',
      version: '0.0.1',
      scripts: {
        dev: 'astro dev',
        build: 'astro build',
        preview: 'astro preview',
      },
      dependencies: {
        astro: '^4.0.0',
        tailwindcss: '^3.4.0',
        '@astrojs/tailwind': '^5.1.0',
      },
    },
    null,
    2,
  );
}

/**
 * Generate default tailwind.config.mjs content
 */
export function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        // Common template aliases to prevent build errors
        dark: '#1a1a1a',
        'dark-100': '#2a2a2a',
        'dark-200': '#3a3a3a',
        'dark-300': '#4a4a4a',
        light: '#ffffff',
        cream: '#fdfbf7',
        white: '#ffffff',
        black: '#000000',
      },
      fontFamily: {
        body: 'var(--font-body)',
        heading: 'var(--font-heading)',
      },
    },
  },
  plugins: [],
};
`;
}

/**
 * Generate default astro.config.mjs content
 */
export function generateAstroConfig(): string {
  return `import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
});
`;
}

/**
 * Generate default global.css content
 */
export function generateGlobalCSS(input: SiteGenerationInput): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-body: ${input.design.fontFamily || 'system-ui, sans-serif'};
  --font-heading: ${input.design.headingFont || input.design.fontFamily || 'system-ui, sans-serif'};
  --color-primary: ${input.design.primaryColor};
  --color-secondary: ${input.design.secondaryColor || input.design.primaryColor};
  --color-accent: ${input.design.accentColor || input.design.primaryColor};
}

body {
  font-family: var(--font-body);
  color: #1f2937;
  background-color: #ffffff;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
`;
}

/**
 * Generate default Layout.astro content
 */
export function generateLayoutAstro(input: SiteGenerationInput): string {
  return `---
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = '${input.businessInfo.description || 'Welcome to our site'}' } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content={description} />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
`;
}

/**
 * Generate default index.astro content
 */
export function generateIndexAstro(input: SiteGenerationInput): string {
  return `---
import Layout from '../layouts/Layout.astro';
import { loadContent } from '../lib/content';

let content;
try {
  content = loadContent();
} catch (e) {
  // Fallback if content loading fails
  content = {
    title: '${input.siteName}',
    home: { hero: { headline: '${input.businessInfo.name}', subheadline: 'Welcome to our new website' } }
  };
}
---

<Layout title={content.title}>
  <main class="container mx-auto px-4 py-16">
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-4">{content.home.hero.headline}</h1>
      <p class="text-xl text-gray-600">{content.home.hero.subheadline}</p>
    </div>
  </main>
</Layout>
`;
}

/**
 * Generate a placeholder component
 */
export function generatePlaceholderComponent(componentName: string): string {
  return `---
const { class: className } = Astro.props;
---

<section class={\`py-12 px-4 \${className || ''}\`}>
  <div class="container mx-auto">
    <h2 class="text-3xl font-bold text-center mb-8">${componentName}</h2>
    <div class="p-6 bg-gray-50 rounded-lg text-center">
      <p class="text-gray-600">This is the ${componentName} section.</p>
      <p class="text-sm text-gray-400 mt-2">(Placeholder content)</p>
    </div>
  </div>
</section>
`;
}

/**
 * Patch tailwind config content paths
 */
export function patchTailwindContentPaths(configContent: string): string {
  let patched = configContent;

  if (!patched.includes('src/')) {
    patched = patched
      .replace(/'\.\/pages/g, "'./src/pages")
      .replace(/"\.\/pages/g, '"./src/pages')
      .replace(/'\.\/components/g, "'./src/components")
      .replace(/"\.\/components/g, '"./src/components')
      .replace(/'\.\/layouts/g, "'./src/layouts")
      .replace(/"\.\/layouts/g, '"./src/layouts');
  }

  return patched;
}

