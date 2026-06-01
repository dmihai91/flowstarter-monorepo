// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  base: '/preview/june-hartley-photo/',
  outDir: '../../../flowstarter-main/public/preview/june-hartley-photo',
  build: {
    assets: '_astro',
    format: 'directory',
  },
});
