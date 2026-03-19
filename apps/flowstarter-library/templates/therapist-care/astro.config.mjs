// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';


// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/templates/therapist-care/',
  outDir: '../../preview-dist/templates/therapist-care',
  build: {
    assets: '_astro',
    format: 'directory',
  },
  integrations: [tailwind()]
});

