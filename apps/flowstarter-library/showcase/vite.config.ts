import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import type { Connect, Plugin, ViteDevServer } from 'vite'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Slug → Astro dev server port
const SLUG_TO_PORT: Record<string, number> = {
  'therapist-care':      4001,
  'fitness-coach':       4002,
  'coach-pro':           4003,
  'academic-tutor':      4004,
  'coding-bootcamp':     4005,
  'edu-course-creator':  4006,
  'language-teacher':    4007,
  'music-teacher':       4008,
  'workshop-host':       4009,
  'beauty-stylist':      4010,
  'creative-portfolio':  4011,
  'wellness-holistic':   4012,
}

function proxyTemplatesPlugin(): Plugin {
  return {
    name: 'proxy-templates',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        (req: Connect.IncomingMessage, res: Connect.ServerResponse, next: Connect.NextFunction) => {
          const url = req.url || ''
          const match = url.match(/^\/templates\/([^/?]+)(\/.*)?$/)
          if (!match) return next()

          const slug = match[1]
          const subpath = match[2] || '/'
          const port = SLUG_TO_PORT[slug]

          if (!port) {
            res.statusCode = 404
            res.end(`Unknown template: ${slug}`)
            return
          }

          const proxyReq = http.request(
            { hostname: 'localhost', port, path: subpath + (url.includes('?') ? '?' + url.split('?')[1] : ''), method: req.method, headers: { ...req.headers, host: `localhost:${port}` } },
            (proxyRes) => {
              res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
              proxyRes.pipe(res)
            },
          )
          proxyReq.on('error', () => {
            res.statusCode = 502
            res.end(`Template dev server not running on port ${port}. Start it with: cd templates/${slug} && pnpm dev --port ${port}`)
          })
          req.pipe(proxyReq)
        },
      )
    },
  }
}

export default defineConfig({
  plugins: [proxyTemplatesPlugin(), react()],
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
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
