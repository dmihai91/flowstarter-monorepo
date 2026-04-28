// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/preview/freelancer-portfolio/',
  outDir: '../../../flowstarter-main/public/preview/freelancer-portfolio',
  build: {
    assets: '_astro',
    format: 'directory',
  },
});
