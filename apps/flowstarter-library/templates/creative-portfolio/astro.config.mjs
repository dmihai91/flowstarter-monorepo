// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  devToolbar: { enabled: false },
  base: '/templates/creative-portfolio/',
  outDir: '../../preview-dist/templates/creative-portfolio',
  build: { assets: '_astro', format: 'directory' },
  integrations: [tailwind()]
});
