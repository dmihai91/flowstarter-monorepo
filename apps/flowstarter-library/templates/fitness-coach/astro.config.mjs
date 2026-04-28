// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/preview/fitness-coach/',
  outDir: '../../../flowstarter-main/public/preview/fitness-coach',
  build: {
    assets: '_astro',
    format: 'directory',
  },
});
