// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/preview/therapist-care/',
  outDir: '../../../flowstarter-main/public/preview/therapist-care',
  build: {
    assets: '_astro',
    format: 'directory',
  },
});
