import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@flowstarter/flow-design-system': path.resolve(__dirname, '../../../packages/flow-design-system/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
  },
  server: {
    port: 2000,
    allowedHosts: ['library.flowstarter.dev', '.ts.net', 'localhost', '.flowstarter.dev'],
    host: true,
    strictPort: true,
    proxy: {
      // All template previews → single static preview server
      '/templates': {
        target: 'http://localhost:4100',
        changeOrigin: true,
      },
      // MCP API
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
