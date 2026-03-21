import { vitePlugin as remixVitePlugin } from '@remix-run/dev';
import UnoCSS from 'unocss/vite';
import { defineConfig, type ViteDevServer } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path, { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

// Get detailed git info with fallbacks
const getGitInfo = () => {
  try {
    return {
      commitHash: execSync('git rev-parse --short HEAD').toString().trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
      commitTime: execSync('git log -1 --format=%cd').toString().trim(),
      author: execSync('git log -1 --format=%an').toString().trim(),
      email: execSync('git log -1 --format=%ae').toString().trim(),
      remoteUrl: execSync('git config --get remote.origin.url').toString().trim(),
      repoName: execSync('git config --get remote.origin.url')
        .toString()
        .trim()
        .replace(/^.*github.com[:/]/, '')
        .replace(/\.git$/, ''),
    };
  } catch {
    return {
      commitHash: 'no-git-info',
      branch: 'unknown',
      commitTime: 'unknown',
      author: 'unknown',
      email: 'unknown',
      remoteUrl: 'unknown',
      repoName: 'unknown',
    };
  }
};

// Read package.json with detailed dependency info
const getPackageJson = () => {
  try {
    const pkgPath = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

    return {
      name: pkg.name,
      description: pkg.description,
      license: pkg.license,
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      peerDependencies: pkg.peerDependencies || {},
      optionalDependencies: pkg.optionalDependencies || {},
    };
  } catch {
    return {
      name: 'flowstarter-editor',
      description: 'A LLM interface',
      license: 'MIT',
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      optionalDependencies: {},
    };
  }
};

const pkg = getPackageJson();
const gitInfo = getGitInfo();

export default defineConfig((config) => {
  return {
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'scheduler',
        '@remix-run/react',
        'remix-island',
        '@radix-ui/react-direction',
        '@radix-ui/react-compose-refs',
        '@radix-ui/react-context',
        '@radix-ui/react-dialog',
        '@radix-ui/react-primitive',
        '@radix-ui/react-use-callback-ref',
        '@radix-ui/react-use-controllable-state',
      ],
      alias: {
        // Force single React instance to prevent "useMemo null" Radix UI crashes
        'react': path.resolve(__dirname, '../../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
        'scheduler': path.resolve(__dirname, '../../node_modules/scheduler'),
        // Fix undici trying to import util/types which doesn't exist in browser polyfill
        'util/types': path.resolve(__dirname, 'app/lib/utils/util-types-stub.ts'),
        'node:util/types': path.resolve(__dirname, 'app/lib/utils/util-types-stub.ts'),
        // Convex generated files
        '../../convex/_generated': path.resolve(__dirname, 'convex/_generated'),
      },
    },
    optimizeDeps: {
      include: [
        // Core React
        'react',
        'react-dom',
        'react-dom/client',
        '@remix-run/react',
        'remix-island',
        'react-router',
        'react-router-dom',
        // Node polyfills (discovered at runtime)
        'vite-plugin-node-polyfills/shims/buffer',
        'vite-plugin-node-polyfills/shims/global',
        'vite-plugin-node-polyfills/shims/process',
        // State management
        'nanostores',
        '@nanostores/react',
        // Analytics
        '@amplitude/analytics-browser',
        '@amplitude/plugin-session-replay-browser',
        // UI components
        'framer-motion',
        '@radix-ui/react-dialog',
        'lucide-react',
        'react-markdown',
        'react-toastify',
        // Utilities
        'js-cookie',
        'chalk',
        'istextorbinary',
        'jszip',
        'file-saver',
        'path-browserify',
        'diff',
        'pako',
        // Remix/Convex
        '@remix-run/cloudflare',
        'remix-utils/client-only',
        'convex/react',
        'convex/server',
        // AI SDK
        '@ai-sdk/openai',
        '@openrouter/ai-sdk-provider',
      ],
      exclude: ['@daytonaio/sdk', '@aws-sdk/lib-storage'],
      force: true,
      esbuildOptions: {
        // Ensure consistent React resolution
        resolveExtensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
        define: {
          global: 'globalThis',
        },
      },
    },
    ssr: {
      external: ['@daytonaio/sdk', '@aws-sdk/lib-storage', 'undici'],
    },
    server: {
      host: true, // Bind to all interfaces (0.0.0.0) for Tailscale access
      allowedHosts: ['.ts.net', 'editor.flowstarter.dev', 'flowstarter.dev', 'localhost'], // Allow Tailscale + dev domains
      proxy: {
        // Note: /mcp-live is handled by mcpLiveProxyPlugin middleware for HTML transformation
        // Do NOT add a proxy here as it will conflict with the middleware

        /*
         * Proxy template assets (JS, CSS) - these are referenced by the template HTML
         * Matches: /api/templates/:slug/assets/*
         */
        '^/api/templates/[^/]+/assets': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          selfHandleResponse: true,
          configure: (proxy, _options) => {
            proxy.on('proxyRes', (proxyRes, req, res) => {
              const contentType = proxyRes.headers['content-type'] || '';
              const chunks: Buffer[] = [];

              proxyRes.on('data', (chunk) => chunks.push(chunk));
              proxyRes.on('end', () => {
                let body = Buffer.concat(chunks);

                // Rewrite CSS root-relative URLs to point to MCP server
                if (contentType.includes('css')) {
                  let cssText = body.toString('utf-8');
                  cssText = cssText.replace(/url\(\s*\/([^)]+)\)/g, 'url(http://localhost:3001/$1)');
                  body = Buffer.from(cssText, 'utf-8');
                }

                // Forward response headers
                Object.keys(proxyRes.headers).forEach((key) => {
                  if (key !== 'content-length') {
                    res.setHeader(key, proxyRes.headers[key]!);
                  }
                });
                res.setHeader('content-length', body.length);
                res.setHeader('cache-control', 'no-cache');
                res.statusCode = proxyRes.statusCode || 200;
                res.end(body);
              });
            });
          },
        },
      },
    },
    define: {
      __COMMIT_HASH: JSON.stringify(gitInfo.commitHash),
      __GIT_BRANCH: JSON.stringify(gitInfo.branch),
      __GIT_COMMIT_TIME: JSON.stringify(gitInfo.commitTime),
      __GIT_AUTHOR: JSON.stringify(gitInfo.author),
      __GIT_EMAIL: JSON.stringify(gitInfo.email),
      __GIT_REMOTE_URL: JSON.stringify(gitInfo.remoteUrl),
      __GIT_REPO_NAME: JSON.stringify(gitInfo.repoName),
      __APP_VERSION: JSON.stringify(process.env.npm_package_version),
      __PKG_NAME: JSON.stringify(pkg.name),
      __PKG_DESCRIPTION: JSON.stringify(pkg.description),
      __PKG_LICENSE: JSON.stringify(pkg.license),
      __PKG_DEPENDENCIES: JSON.stringify(pkg.dependencies),
      __PKG_DEV_DEPENDENCIES: JSON.stringify(pkg.devDependencies),
      __PKG_PEER_DEPENDENCIES: JSON.stringify(pkg.peerDependencies),
      __PKG_OPTIONAL_DEPENDENCIES: JSON.stringify(pkg.optionalDependencies),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    build: {
      target: 'esnext',
    },
    plugins: [
      // MCP live proxy must come BEFORE Remix to intercept /mcp-live/* requests
      mcpLiveProxyPlugin(),
      // Stub out stream-browserify for browser (it uses CommonJS which breaks in ESM)
      {
        name: 'stub-stream-browserify',
        resolveId(id: string) {
          if (id === 'stream-browserify' || id === 'stream') {
            return '\0virtual:stream-stub';
          }
          return null;
        },
        load(id: string) {
          if (id === '\0virtual:stream-stub') {
            return 'export default {}; export const Stream = {}; export const Readable = {}; export const Writable = {}; export const Duplex = {}; export const Transform = {}; export const PassThrough = {};';
          }
          return null;
        },
      },
      // Stub out util/types for browser (undici uses this Node.js built-in)
      {
        name: 'stub-util-types',
        enforce: 'pre' as const,
        resolveId(id: string) {
          if (id === 'util/types' || id === 'node:util/types') {
            return path.resolve(__dirname, 'app/lib/utils/util-types-stub.ts');
          }
          return null;
        },
      },
      nodePolyfills({
        include: ['buffer', 'process', 'util'],
        globals: {
          Buffer: true,
          process: true,
          global: true,
        },
        protocolImports: true,
        exclude: ['child_process', 'fs', 'path', 'stream'],
      }),
      {
        name: 'buffer-polyfill',
        transform(code: string, id: string) {
          if (id.includes('env.mjs')) {
            return {
              code: `import { Buffer } from 'buffer';\n${code}`,
              map: null,
            };
          }

          return null;
        },
      },
      remixVitePlugin({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_lazyRouteDiscovery: true,
        },
      }),
      UnoCSS(),
      tsconfigPaths(),
      chrome129IssuePlugin(),
      config.mode === 'production' && optimizeCssModules({ apply: 'build' }),
    ].filter(Boolean),
    envPrefix: ['VITE_'],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
  };
});

function chrome129IssuePlugin() {
  return {
    name: 'chrome129IssuePlugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const raw = req.headers['user-agent']?.match(/Chrom(e|ium)\/([0-9]+)\./);

        if (raw) {
          const version = parseInt(raw[2], 10);

          if (version === 129) {
            res.setHeader('content-type', 'text/html');
            res.end(
              `<html><body><h1>Unsupported Browser Version</h1><p>Chrome version 129 has a known issue that affects this application. Please downgrade to version 128 or upgrade to version 130 or later.</p></body></html>`,
            );

            return;
          }
        }

        next();
      });
    },
  };
}

// Proxy plugin for MCP live templates
function mcpLiveProxyPlugin() {
  return {
    name: 'mcp-live-proxy',
    enforce: 'pre' as const,
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // Only handle /mcp-live/* requests (live preview pages)
        if (!url.startsWith('/mcp-live/')) {
          return next();
        }

        const targetPath = url.replace(/^\/mcp-live/, '');
        const targetUrl = `http://localhost:3001${targetPath}`;

        try {
          const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
              Accept: req.headers.accept || '*/*',
              'User-Agent': req.headers['user-agent'] || '',
            },
          });

          // Copy response headers
          response.headers.forEach((value, key) => {
            if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(key.toLowerCase())) {
              res.setHeader(key, value);
            }
          });

          res.statusCode = response.status;

          const contentType = response.headers.get('content-type') || '';

          if (contentType.includes('font') || contentType.includes('image') || contentType.includes('octet-stream')) {
            const buffer = await response.arrayBuffer();
            res.end(Buffer.from(buffer));
          } else {
            let body = await response.text();

            // For live preview HTML, rewrite paths to go through /mcp-live/ proxy
            if (contentType.includes('text/html')) {
              // Remove the base tag
              body = body.replace(/<base href="[^"]*"\s*\/?>/gi, '');
              // Rewrite asset paths: /api/templates/... → /mcp-live/api/templates/...
              body = body.replace(/src="\/api\/templates\//g, 'src="/mcp-live/api/templates/');
              body = body.replace(/href="\/api\/templates\//g, 'href="/mcp-live/api/templates/');
              // Rewrite any basepath variables to match proxy path (legacy support)
              body = body.replace(
                /window\.__BASEPATH__\s*=\s*'\/api\/templates\//g,
                "window.__BASEPATH__ = '/mcp-live/api/templates/"
              );
            }

            res.end(body);
          }
        } catch (error) {
          console.error('[mcp-live-proxy] Error:', error);
          res.statusCode = 502;
          res.end('Bad Gateway');
        }
      });
    },
  };
}

