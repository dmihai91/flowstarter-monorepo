// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';


// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/templates/fitness-coach/',
  outDir: '../../preview-dist/templates/fitness-coach',
  build: {
    assets: '_astro',
    format: 'directory',
  },
  integrations: [tailwind()]
});

