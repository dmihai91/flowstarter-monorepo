// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';


// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/templates/workshop-host/',
  outDir: '../../preview-dist/templates/workshop-host',
  build: {
    assets: '_astro',
    format: 'directory',
  },
  integrations: [tailwind()]
});

