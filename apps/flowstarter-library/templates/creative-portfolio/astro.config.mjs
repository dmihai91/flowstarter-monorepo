// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/preview/creative-portfolio/',
  outDir: '../../../flowstarter-main/public/preview/creative-portfolio',
  build: {
    assets: '_astro',
    format: 'directory',
  },
});
