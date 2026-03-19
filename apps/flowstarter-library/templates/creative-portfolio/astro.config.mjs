// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  devToolbar: { enabled: false },
  base: '/',
  build: { assets: '_astro', format: 'directory' },
  integrations: [tailwind()]
});
