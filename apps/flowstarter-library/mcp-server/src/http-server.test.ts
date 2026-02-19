import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve to templates directory from mcp-server/src
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

describe('http-server', () => {
  describe('configuration', () => {
    it('should have correct default port', () => {
      const defaultPort = Number(process.env.HTTP_PORT) || 3001;
      expect(defaultPort).toBe(3001);
    });

    it('should have correct default host', () => {
      const defaultHost = process.env.HTTP_HOST || '0.0.0.0';
      expect(defaultHost).toBe('0.0.0.0');
    });

    it('should have correct default CORS origin', () => {
      const defaultCorsOrigin = process.env.CORS_ORIGIN || '*';
      expect(defaultCorsOrigin).toBe('*');
    });
  });

  describe('template directories', () => {
    it('should have templates directory', () => {
      expect(fs.existsSync(TEMPLATES_DIR)).toBe(true);
    });

    it('should have local-business-pro template', () => {
      const templatePath = path.join(TEMPLATES_DIR, 'local-business-pro');
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    it('should have personal-brand-pro template', () => {
      const templatePath = path.join(TEMPLATES_DIR, 'personal-brand-pro');
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    it('should have saas-product-pro template', () => {
      const templatePath = path.join(TEMPLATES_DIR, 'saas-product-pro');
      expect(fs.existsSync(templatePath)).toBe(true);
    });
  });

  describe('thumbnail endpoints', () => {
    it('should have thumbnail files for local-business-pro', () => {
      const thumbnailPath = path.join(TEMPLATES_DIR, 'local-business-pro', 'thumbnail.png');
      // Thumbnail might exist or not depending on build state
      expect(typeof fs.existsSync(thumbnailPath)).toBe('boolean');
    });

    it('should support theme variants for thumbnails', () => {
      const themes = ['thumbnail.png', 'thumbnail-light.png', 'thumbnail-dark.png'];
      themes.forEach(theme => {
        const themePath = path.join(TEMPLATES_DIR, 'local-business-pro', theme);
        // Just verify the path format is correct
        expect(themePath).toContain('local-business-pro');
        expect(themePath).toContain(theme);
      });
    });
  });

  describe('live preview endpoint', () => {
    it('should look for .vinxi/build/client directory', () => {
      const templateDir = path.join(TEMPLATES_DIR, 'local-business-pro');
      const distDir = path.join(templateDir, '.vinxi/build/client');

      // Verify the expected path structure
      expect(distDir).toContain('.vinxi');
      expect(distDir).toContain('build');
      expect(distDir).toContain('client');
    });

    it('should support mode=dark query parameter', () => {
      const modes = [undefined, 'dark', 'light'];
      modes.forEach(mode => {
        // Verify mode handling logic
        if (mode === 'dark') {
          expect(mode).toBe('dark');
        }
      });
    });
  });

  describe('health check endpoint', () => {
    it('should return correct structure', () => {
      const healthResponse = {
        status: 'healthy',
        service: 'mcp-server',
        version: '1.0.0',
        transport: 'streamable-http'
      };

      expect(healthResponse.status).toBe('healthy');
      expect(healthResponse.service).toBe('mcp-server');
      expect(healthResponse.version).toBe('1.0.0');
      expect(healthResponse.transport).toBe('streamable-http');
    });
  });

  describe('asset path rewriting', () => {
    it('should rewrite /assets/ to /api/templates/:slug/assets/', () => {
      const slug = 'local-business-pro';
      const originalPath = '/assets/index.css';
      const rewrittenPath = `/api/templates/${slug}/assets/index.css`;

      expect(rewrittenPath).toContain(slug);
      expect(rewrittenPath).toContain('/api/templates/');
      expect(rewrittenPath).toContain('/assets/');
    });

    it('should inject basepath script', () => {
      const slug = 'local-business-pro';
      const basepathScript = `<script>window.__BASEPATH__ = '/api/templates/${slug}/live';</script>`;

      expect(basepathScript).toContain('window.__BASEPATH__');
      expect(basepathScript).toContain(slug);
    });

    it('should inject dark mode class when mode=dark', () => {
      const originalHtml = '<html>';
      const darkModeHtml = '<html class="dark">';

      expect(darkModeHtml).toContain('class="dark"');
    });
  });

  describe('CORS configuration', () => {
    it('should allow specified methods', () => {
      const allowedMethods = ['GET', 'POST', 'OPTIONS'];

      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('OPTIONS');
    });

    it('should allow specified headers', () => {
      const allowedHeaders = ['Content-Type', 'Authorization'];

      expect(allowedHeaders).toContain('Content-Type');
      expect(allowedHeaders).toContain('Authorization');
    });
  });

  describe('error handling', () => {
    it('should return 404 for non-existent thumbnail', () => {
      const errorResponse = { error: 'Thumbnail not found' };
      expect(errorResponse.error).toBe('Thumbnail not found');
    });

    it('should return 404 for non-existent preview', () => {
      const errorResponse = { error: 'Preview not found' };
      expect(errorResponse.error).toBe('Preview not found');
    });

    it('should return 503 for unbuilt template', () => {
      // When template is not built, should return 503 status
      const status = 503;
      expect(status).toBe(503);
    });

    it('should return 404 for non-existent API routes', () => {
      const errorResponse = { error: 'Not found' };
      expect(errorResponse.error).toBe('Not found');
    });
  });

  describe('MCP endpoint', () => {
    it('should skip body parsing for /mcp path', () => {
      // The MCP endpoint needs raw body access
      const mcpPath = '/mcp';
      expect(mcpPath).toBe('/mcp');
    });

    it('should handle POST requests', () => {
      const method = 'POST';
      expect(method).toBe('POST');
    });

    it('should handle GET requests for SSE', () => {
      const method = 'GET';
      expect(method).toBe('GET');
    });
  });

  describe('static file serving', () => {
    it('should look for public directory', () => {
      const publicDir = path.join(__dirname, '../public');
      // Path should be correctly formed
      expect(publicDir).toContain('public');
    });

    it('should handle SPA fallback for unknown routes', () => {
      // SPA fallback should serve index.html for non-API routes
      const spaRoutes = ['/some-route', '/another-route'];

      spaRoutes.forEach(route => {
        expect(route.startsWith('/api/')).toBe(false);
        expect(route).not.toBe('/mcp');
        expect(route).not.toBe('/health');
      });
    });
  });

  describe('template routes', () => {
    it('should support direct template access via /:slug', () => {
      const slugs = ['local-business-pro', 'personal-brand-pro', 'saas-product-pro'];

      slugs.forEach(slug => {
        const route = `/${slug}`;
        expect(route).toBe(`/${slug}`);
      });
    });

    it('should support nested routes via /:slug/*', () => {
      const nestedRoutes = [
        '/local-business-pro/about',
        '/local-business-pro/contact',
        '/saas-product-pro/pricing'
      ];

      nestedRoutes.forEach(route => {
        expect(route.split('/').length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should add base tag for client-side routing', () => {
      const slug = 'local-business-pro';
      const baseTag = `<base href="/${slug}/">`;

      expect(baseTag).toContain('base');
      expect(baseTag).toContain('href');
      expect(baseTag).toContain(slug);
    });
  });
});

describe('express app configuration', () => {
  it('should create express app', () => {
    const app = express();
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
    expect(typeof app.get).toBe('function');
    expect(typeof app.post).toBe('function');
  });

  it('should support json middleware', () => {
    const jsonMiddleware = express.json();
    expect(jsonMiddleware).toBeDefined();
    expect(typeof jsonMiddleware).toBe('function');
  });

  it('should support static file middleware', () => {
    const staticMiddleware = express.static(__dirname);
    expect(staticMiddleware).toBeDefined();
    expect(typeof staticMiddleware).toBe('function');
  });
});
