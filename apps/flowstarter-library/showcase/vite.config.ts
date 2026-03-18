import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import type { Connect, Plugin, ViteDevServer } from 'vite'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
}

function serveTemplatesPlugin(): Plugin {
  return {
    name: 'serve-templates',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        (req: Connect.IncomingMessage, res: Connect.ServerResponse, next: Connect.NextFunction) => {
          const url = req.url || ''

          if (!url.startsWith('/templates/') && !url.startsWith('/thumbs/')) {
            return next()
          }

          const thumbMatch = url.match(/^\/thumbs\/([^/]+)\/(.+)$/)
          if (thumbMatch) {
            const [, slug, filename] = thumbMatch
            const thumbPath = path.join(__dirname, '..', 'templates', slug, filename)

            if (fs.existsSync(thumbPath)) {
              const ext = path.extname(thumbPath)
              const content = fs.readFileSync(thumbPath)
              res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream')
              res.setHeader('Cache-Control', 'public, max-age=3600')
              res.end(content)
              return
            }
          }

          const match = url.match(/^\/templates\/([^/]+)(\/.*)?$/)
          if (match) {
            const [, slug, subpath = '/'] = match
            const distDir = path.join(__dirname, '..', 'templates', slug, 'dist')

            if (!fs.existsSync(distDir)) {
              res.statusCode = 404
              res.end('Template not found')
              return
            }

            const normalizedUrl = subpath.split('?')[0] || '/'
            const cleanSubpath = normalizedUrl.replace(/^\//, '')

            let filePath = path.join(distDir, cleanSubpath)

            if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
              filePath = path.join(filePath, 'index.html')
            }

            if (!fs.existsSync(filePath) && !path.extname(cleanSubpath)) {
              const directoryIndexPath = path.join(distDir, cleanSubpath, 'index.html')
              if (fs.existsSync(directoryIndexPath)) {
                filePath = directoryIndexPath
              }
            }

            if (!fs.existsSync(filePath)) {
              const htmlPath = `${filePath}.html`
              if (fs.existsSync(htmlPath)) {
                filePath = htmlPath
              }
            }

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath)
              const content = fs.readFileSync(filePath)
              res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream')
              res.end(content)
              return
            }

            res.statusCode = 404
            res.end(`Not found: ${cleanSubpath}`)
            return
          }

          next()
        },
      )
    },
  }
}

export default defineConfig({
  plugins: [serveTemplatesPlugin(), react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 2000,
    allowedHosts: ["library.flowstarter.dev", ".ts.net", "localhost", ".flowstarter.dev"],
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
