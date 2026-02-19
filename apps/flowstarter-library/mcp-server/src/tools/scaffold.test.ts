import { describe, it, expect, beforeAll } from 'vitest';
import { scaffoldTemplate, ScaffoldTemplateSchema } from './scaffold.js';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('scaffold tool', () => {
  let fetcher: TemplateFetcher;
  // Resolve to templates directory from mcp-server/src/tools
  const templatesDir = path.resolve(__dirname, '../../../templates');

  beforeAll(async () => {
    fetcher = new TemplateFetcher(templatesDir);
    await fetcher.initialize();
  });

  describe('ScaffoldTemplateSchema', () => {
    it('should be a valid Zod schema', () => {
      expect(ScaffoldTemplateSchema).toBeDefined();
      expect(ScaffoldTemplateSchema.parse).toBeDefined();
    });

    it('should require slug field', () => {
      const result = ScaffoldTemplateSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept valid slug', () => {
      const result = ScaffoldTemplateSchema.safeParse({ slug: 'local-business-pro' });
      expect(result.success).toBe(true);
    });

    it('should reject non-string slug', () => {
      const result = ScaffoldTemplateSchema.safeParse({ slug: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('scaffoldTemplate', () => {
    it('should return scaffold data for valid template', async () => {
      const result = await scaffoldTemplate(
        { slug: 'local-business-pro' },
        fetcher,
        templatesDir
      );

      expect(result.scaffold).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error for non-existent template', async () => {
      const result = await scaffoldTemplate(
        { slug: 'non-existent-template' },
        fetcher,
        templatesDir
      );

      expect(result.scaffold).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });

    it('should include template metadata in scaffold', async () => {
      const result = await scaffoldTemplate(
        { slug: 'local-business-pro' },
        fetcher,
        templatesDir
      );

      expect(result.scaffold?.template).toBeDefined();
      expect(result.scaffold?.template.metadata.slug).toBe('local-business-pro');
    });

    it('should include files array in scaffold', async () => {
      const result = await scaffoldTemplate(
        { slug: 'local-business-pro' },
        fetcher,
        templatesDir
      );

      expect(result.scaffold?.files).toBeDefined();
      expect(Array.isArray(result.scaffold?.files)).toBe(true);
      expect(result.scaffold?.files.length).toBeGreaterThan(0);
    });

    it('should include file paths and content', async () => {
      const result = await scaffoldTemplate(
        { slug: 'local-business-pro' },
        fetcher,
        templatesDir
      );

      result.scaffold?.files.forEach(file => {
        expect(file.path).toBeDefined();
        expect(typeof file.path).toBe('string');
        expect(file.content).toBeDefined();
        expect(typeof file.content).toBe('string');
        expect(file.type).toBe('file');
      });
    });

    it('should include package.json in files', async () => {
      const result = await scaffoldTemplate(
        { slug: 'local-business-pro' },
        fetcher,
        templatesDir
      );

      const packageJson = result.scaffold?.files.find(f => f.path === 'package.json');
      expect(packageJson).toBeDefined();
      expect(packageJson?.content).toContain('"dependencies"');
    });

    it('should include TypeScript files', async () => {
      const result = await scaffoldTemplate(
        { slug: 'local-business-pro' },
        fetcher,
        templatesDir
      );

      const tsFiles = result.scaffold?.files.filter(f =>
        f.path.endsWith('.ts') || f.path.endsWith('.tsx')
      );
      expect(tsFiles?.length).toBeGreaterThan(0);
    });

    it('should include CSS files', async () => {
      const result = await scaffoldTemplate(
        { slug: 'local-business-pro' },
        fetcher,
        templatesDir
      );

      const cssFiles = result.scaffold?.files.filter(f => f.path.endsWith('.css'));
      expect(cssFiles?.length).toBeGreaterThan(0);
    });

    it('should scaffold personal-brand-pro template', async () => {
      const result = await scaffoldTemplate(
        { slug: 'personal-brand-pro' },
        fetcher,
        templatesDir
      );

      expect(result.scaffold).toBeDefined();
      expect(result.scaffold?.template.metadata.slug).toBe('personal-brand-pro');
      expect(result.scaffold?.files.length).toBeGreaterThan(0);
    });

    it('should scaffold saas-product-pro template', async () => {
      const result = await scaffoldTemplate(
        { slug: 'saas-product-pro' },
        fetcher,
        templatesDir
      );

      expect(result.scaffold).toBeDefined();
      expect(result.scaffold?.template.metadata.slug).toBe('saas-product-pro');
      expect(result.scaffold?.files.length).toBeGreaterThan(0);
    });

    it('should not include node_modules in scaffold files', async () => {
      const result = await scaffoldTemplate(
        { slug: 'local-business-pro' },
        fetcher,
        templatesDir
      );

      const nodeModulesFiles = result.scaffold?.files.filter(f =>
        f.path.includes('node_modules')
      );
      expect(nodeModulesFiles?.length).toBe(0);
    });

    it('should not include .git in scaffold files', async () => {
      const result = await scaffoldTemplate(
        { slug: 'local-business-pro' },
        fetcher,
        templatesDir
      );

      const gitFiles = result.scaffold?.files.filter(f =>
        f.path.includes('.git/')
      );
      expect(gitFiles?.length).toBe(0);
    });

    it('should include index.html', async () => {
      const result = await scaffoldTemplate(
        { slug: 'local-business-pro' },
        fetcher,
        templatesDir
      );

      const indexHtml = result.scaffold?.files.find(f => f.path === 'index.html');
      expect(indexHtml).toBeDefined();
    });

    it('should include tailwind.config.ts', async () => {
      const result = await scaffoldTemplate(
        { slug: 'local-business-pro' },
        fetcher,
        templatesDir
      );

      const tailwindConfig = result.scaffold?.files.find(f =>
        f.path === 'tailwind.config.ts'
      );
      expect(tailwindConfig).toBeDefined();
    });
  });
});
