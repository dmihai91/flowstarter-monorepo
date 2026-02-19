import { describe, it, expect, beforeAll } from 'vitest';
import { searchTemplates, SearchTemplatesSchema } from './search.js';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('search tool', () => {
  let fetcher: TemplateFetcher;
  // Resolve to templates directory from mcp-server/src/tools
  const templatesDir = path.resolve(__dirname, '../../../templates');

  beforeAll(async () => {
    fetcher = new TemplateFetcher(templatesDir);
    await fetcher.initialize();
  });

  describe('SearchTemplatesSchema', () => {
    it('should be a valid Zod schema', () => {
      expect(SearchTemplatesSchema).toBeDefined();
      expect(SearchTemplatesSchema.parse).toBeDefined();
    });

    it('should require query field', () => {
      const result = SearchTemplatesSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept valid query string', () => {
      const result = SearchTemplatesSchema.safeParse({ query: 'business' });
      expect(result.success).toBe(true);
    });

    it('should reject non-string query', () => {
      const result = SearchTemplatesSchema.safeParse({ query: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('searchTemplates', () => {
    it('should return an object with templates array', async () => {
      const result = await searchTemplates({ query: 'business' }, fetcher);

      expect(result).toBeDefined();
      expect(result.templates).toBeDefined();
      expect(Array.isArray(result.templates)).toBe(true);
    });

    it('should find templates by name', async () => {
      const result = await searchTemplates({ query: 'local' }, fetcher);

      expect(result.templates.length).toBeGreaterThan(0);
      const slugs = result.templates.map(t => t.slug);
      expect(slugs).toContain('local-business-pro');
    });

    it('should find templates by category', async () => {
      const result = await searchTemplates({ query: 'saas' }, fetcher);

      expect(result.templates.length).toBeGreaterThan(0);
      expect(result.templates[0].slug).toBe('saas-product-pro');
    });

    it('should find templates by use case', async () => {
      const result = await searchTemplates({ query: 'restaurant' }, fetcher);

      expect(result.templates.length).toBeGreaterThan(0);
      // local-business-pro should match because it includes "Restaurants" use case
      const slugs = result.templates.map(t => t.slug);
      expect(slugs).toContain('local-business-pro');
    });

    it('should be case insensitive', async () => {
      const lowerResult = await searchTemplates({ query: 'business' }, fetcher);
      const upperResult = await searchTemplates({ query: 'BUSINESS' }, fetcher);
      const mixedResult = await searchTemplates({ query: 'BuSiNeSs' }, fetcher);

      expect(lowerResult.templates.length).toBe(upperResult.templates.length);
      expect(lowerResult.templates.length).toBe(mixedResult.templates.length);
    });

    it('should return empty array for non-matching query', async () => {
      const result = await searchTemplates({ query: 'xyz123nonexistent' }, fetcher);

      expect(result.templates).toEqual([]);
    });

    it('should return templates with required properties', async () => {
      const result = await searchTemplates({ query: 'pro' }, fetcher);

      expect(result.templates.length).toBeGreaterThan(0);
      result.templates.forEach(template => {
        expect(template.slug).toBeDefined();
        expect(template.displayName).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.useCase).toBeDefined();
        expect(template.fileCount).toBeDefined();
        expect(template.totalLOC).toBeDefined();
      });
    });

    it('should find personal brand templates', async () => {
      const result = await searchTemplates({ query: 'personal' }, fetcher);

      expect(result.templates.length).toBeGreaterThan(0);
      const slugs = result.templates.map(t => t.slug);
      expect(slugs).toContain('personal-brand-pro');
    });

    it('should find consultant-related templates', async () => {
      const result = await searchTemplates({ query: 'consultant' }, fetcher);

      expect(result.templates.length).toBeGreaterThan(0);
      // personal-brand-pro should match because it includes "Consultants" use case
      const slugs = result.templates.map(t => t.slug);
      expect(slugs).toContain('personal-brand-pro');
    });

    it('should find software-related templates', async () => {
      const result = await searchTemplates({ query: 'software' }, fetcher);

      expect(result.templates.length).toBeGreaterThan(0);
      // saas-product-pro should match
      const slugs = result.templates.map(t => t.slug);
      expect(slugs).toContain('saas-product-pro');
    });

    it('should handle empty query string gracefully', async () => {
      const result = await searchTemplates({ query: '' }, fetcher);

      // Empty query might return all templates or empty array depending on implementation
      expect(result.templates).toBeDefined();
      expect(Array.isArray(result.templates)).toBe(true);
    });
  });
});
