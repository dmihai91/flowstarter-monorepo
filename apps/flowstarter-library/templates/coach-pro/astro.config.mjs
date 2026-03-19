// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';


// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/templates/coach-pro/',
  outDir: '../../preview-dist/templates/coach-pro',
  build: {
    assets: '_astro',
    format: 'directory',
  },
  integrations: [tailwind()]
});

