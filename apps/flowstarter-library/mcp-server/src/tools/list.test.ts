import { describe, it, expect, beforeAll, vi } from 'vitest';
import { listTemplates, ListTemplatesSchema } from './list.js';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('list tool', () => {
  let fetcher: TemplateFetcher;
  // Resolve to templates directory from mcp-server/src/tools
  const templatesDir = path.resolve(__dirname, '../../../templates');

  beforeAll(async () => {
    fetcher = new TemplateFetcher(templatesDir);
    await fetcher.initialize();
  });

  describe('ListTemplatesSchema', () => {
    it('should be a valid Zod schema', () => {
      expect(ListTemplatesSchema).toBeDefined();
      expect(ListTemplatesSchema.parse).toBeDefined();
    });

    it('should accept empty object', () => {
      const result = ListTemplatesSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('listTemplates', () => {
    it('should return an object with templates array', async () => {
      const result = await listTemplates(fetcher);

      expect(result).toBeDefined();
      expect(result.templates).toBeDefined();
      expect(Array.isArray(result.templates)).toBe(true);
    });

    it('should return exactly 3 templates', async () => {
      const result = await listTemplates(fetcher);

      expect(result.templates.length).toBe(3);
    });

    it('should return templates with required properties', async () => {
      const result = await listTemplates(fetcher);

      result.templates.forEach(template => {
        expect(template.slug).toBeDefined();
        expect(typeof template.slug).toBe('string');
        expect(template.displayName).toBeDefined();
        expect(typeof template.displayName).toBe('string');
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.useCase).toBeDefined();
        expect(template.fileCount).toBeDefined();
        expect(typeof template.fileCount).toBe('number');
        expect(template.totalLOC).toBeDefined();
        expect(typeof template.totalLOC).toBe('number');
      });
    });

    it('should include all expected template slugs', async () => {
      const result = await listTemplates(fetcher);
      const slugs = result.templates.map(t => t.slug);

      expect(slugs).toContain('local-business-pro');
      expect(slugs).toContain('personal-brand-pro');
      expect(slugs).toContain('saas-product-pro');
    });

    it('should have positive file counts for all templates', async () => {
      const result = await listTemplates(fetcher);

      result.templates.forEach(template => {
        expect(template.fileCount).toBeGreaterThan(0);
        expect(template.totalLOC).toBeGreaterThan(0);
      });
    });

    it('should handle thumbnail URLs correctly', async () => {
      const result = await listTemplates(fetcher);

      // Thumbnails are optional - verify the field exists and is correct type when present
      result.templates.forEach(template => {
        if (template.thumbnailUrl !== undefined) {
          expect(typeof template.thumbnailUrl).toBe('string');
          expect(template.thumbnailUrl).toContain('/api/templates/');
          expect(template.thumbnailUrl).toContain('/thumbnail');
        }
      });
    });

    it('should return correct categories for each template', async () => {
      const result = await listTemplates(fetcher);

      const localBusiness = result.templates.find(t => t.slug === 'local-business-pro');
      const personalBrand = result.templates.find(t => t.slug === 'personal-brand-pro');
      const saasProduct = result.templates.find(t => t.slug === 'saas-product-pro');

      expect(localBusiness?.category).toBe('local-business');
      expect(personalBrand?.category).toBe('personal-brand');
      expect(saasProduct?.category).toBe('saas-product');
    });
  });
});
