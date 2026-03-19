// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';


// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/templates/coding-bootcamp/',
  outDir: '../../preview-dist/templates/coding-bootcamp',
  build: {
    assets: '_astro',
    format: 'directory',
  },
  integrations: [tailwind()]
});

