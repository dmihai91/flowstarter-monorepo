// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';


// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/templates/academic-tutor/',
  outDir: '../../preview-dist/templates/academic-tutor',
  build: {
    assets: '_astro',
    format: 'directory',
  },
  integrations: [tailwind()]
});

