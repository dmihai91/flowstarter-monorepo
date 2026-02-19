/**
 * Node.js Server for Flowstarter Editor
 *
 * This replaces the Cloudflare Workers setup with a proper Node.js server
 * that can run the Claude Agent SDK and other Node.js-only features.
 */

import { createRequestHandler } from '@remix-run/express';
import type { AppLoadContext } from '@remix-run/cloudflare';
import express, { type Request, type Response } from 'express';
import compression from 'compression';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

/**
 * Node.js-compatible load context that mimics Cloudflare Workers context.
 * This allows route handlers to work with the same interface whether running
 * on Cloudflare Workers or Node.js.
 *
 * Note: We use a type assertion because the Node.js context doesn't have
 * all Cloudflare-specific properties (like cf), but route handlers should
 * handle this gracefully with optional chaining.
 */
interface NodeCloudflareContext {
  env: Env;
  ctx: ExecutionContext;
  caches: CacheStorage;
  cf: undefined;
}

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Trust proxy for proper IP detection behind reverse proxy
app.set('trust proxy', true);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('tiny'));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from build/client with caching
app.use(
  '/assets',
  express.static(join(__dirname, 'build/client/assets'), {
    immutable: true,
    maxAge: '1y',
  })
);

app.use(
  express.static(join(__dirname, 'build/client'), {
    maxAge: '1h',
  })
);

// Handle Remix requests
const MODE = process.env.NODE_ENV || 'production';
const BUILD_PATH = join(__dirname, 'build/server/index.js');

// In development, we'll use vite's dev server instead
// In production, we serve the built app
if (MODE === 'production') {
  const build = await import(BUILD_PATH);

  app.all(
    '*',
    createRequestHandler({
      build,
      mode: MODE,
      // Note: In Node.js mode, we provide env directly instead of cloudflare context
      // Routes should check for both process.env and context.cloudflare?.env
      getLoadContext(): AppLoadContext {
        const context: NodeCloudflareContext = {
          env: process.env as unknown as Env,
          ctx: {} as ExecutionContext,
          caches: {} as CacheStorage,
          cf: undefined,
        };
        // Type assertion needed because Node.js context lacks full Cloudflare properties
        return { cloudflare: context } as unknown as AppLoadContext;
      },
    })
  );
}

const PORT = parseInt(process.env.PORT || '5173', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Flowstarter Editor running at http://localhost:${PORT}`);
  console.log(`   Mode: ${MODE}`);
});

export { app };

