// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  devToolbar: { enabled: false },
  base: '/templates/beauty-stylist/',
  outDir: '../../preview-dist/templates/beauty-stylist',
  build: { assets: '_astro', format: 'directory' },
  integrations: [tailwind()]
});
