// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/preview/coach-pro/',
  outDir: '../../../flowstarter-main/public/preview/coach-pro',
  build: {
    assets: '_astro',
    format: 'directory',
  },
});
