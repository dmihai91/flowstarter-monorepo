/**
 * Placeholder Template and Files
 *
 * Used when MCP server fails or times out.
 */

import type { ScaffoldFile } from './types';

/**
 * Placeholder template metadata for when MCP server fails
 */
export function getPlaceholderTemplate(templateSlug: string) {
  return {
    metadata: {
      name: templateSlug,
      slug: templateSlug,
      displayName: templateSlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      description: 'Template loaded in offline mode',
      category: 'landing',
      features: [],
      techStack: {
        framework: 'Astro',
        styling: 'Tailwind CSS',
        typescript: true,
      },
    },
    packageJson: {
      dependencies: {},
      devDependencies: {},
      scripts: {},
    },
  };
}

/**
 * Placeholder files for when MCP server fails
 */
export function getPlaceholderFiles(): ScaffoldFile[] {
  return [
    {
      path: '/package.json',
      content: JSON.stringify(
        {
          name: 'my-website',
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
            tailwindcss: '^3.4.0',
          },
          devDependencies: {
            autoprefixer: '^10.4.0',
            postcss: '^8.4.0',
            typescript: '^5.0.0',
          },
        },
        null,
        2,
      ),
      type: 'file',
    },
    {
      path: '/src/pages/index.astro',
      content: `---
import Layout from '../layouts/Layout.astro';
---

<Layout title="My Website">
  <main class="min-h-screen bg-background text-foreground">
    <header class="py-6 px-8">
      <h1 class="text-4xl font-heading font-bold text-primary">
        Welcome to Your Website
      </h1>
    </header>
    <section class="px-8 py-12">
      <p class="text-lg font-body">
        Start editing to build something amazing!
      </p>
    </section>
  </main>
</Layout>`,
      type: 'file',
    },
    {
      path: '/src/layouts/Layout.astro',
      content: `---
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
  </head>
  <body>
    <slot />
  </body>
</html>

<style is:global>
  @import '../styles/globals.css';
</style>`,
      type: 'file',
    },
    {
      path: '/src/styles/globals.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: var(--font-body);
  background-color: var(--color-background);
  color: var(--color-text);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}`,
      type: 'file',
    },
    {
      path: '/tailwind.config.mjs',
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
    },
  },
  plugins: [],
};`,
      type: 'file',
    },
    {
      path: '/astro.config.mjs',
      content: `import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  server: {
    port: 4321,
    host: true,
  },
});`,
      type: 'file',
    },
    {
      path: '/tsconfig.json',
      content: JSON.stringify(
        {
          extends: 'astro/tsconfigs/strict',
          compilerOptions: {
            strictNullChecks: true,
          },
        },
        null,
        2,
      ),
      type: 'file',
    },
    {
      path: '/postcss.config.cjs',
      content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,
      type: 'file',
    },
  ];
}

