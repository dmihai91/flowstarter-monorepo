// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';


// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/templates/music-teacher/',
  outDir: '../../preview-dist/templates/music-teacher',
  build: {
    assets: '_astro',
    format: 'directory',
  },
  integrations: [tailwind()]
});

