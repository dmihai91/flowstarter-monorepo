// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/preview/dorin-portfolio/',
  outDir: '../../../flowstarter-main/public/preview/dorin-portfolio',
  build: {
    assets: '_astro',
    format: 'directory',
  },
});
