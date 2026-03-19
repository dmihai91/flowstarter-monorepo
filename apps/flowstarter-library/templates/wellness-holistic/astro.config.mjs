// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  devToolbar: { enabled: false },
  base: '/templates/wellness-holistic/',
  outDir: '../../preview-dist/templates/wellness-holistic',
  build: { assets: '_astro', format: 'directory' },
  integrations: [tailwind()]
});
