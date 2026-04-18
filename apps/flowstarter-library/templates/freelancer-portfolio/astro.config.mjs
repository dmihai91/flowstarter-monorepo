import { defineConfig } from 'astro/config';

export default defineConfig({
  devToolbar: { enabled: false },
  base: '/templates/freelancer-portfolio/',
  outDir: './dist',
  build: { assets: '_astro', format: 'directory' },
});
