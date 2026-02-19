// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';

export default defineConfig({
  base: '/',
  build: { assets: '_astro', format: 'directory' },
  integrations: [tailwind(), icon()]
});
