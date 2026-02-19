import { describe, it, expect, beforeAll } from 'vitest';
import { TemplateFetcher } from './template-fetcher.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TemplateFetcher', () => {
  let fetcher: TemplateFetcher;
  // Resolve to templates directory from mcp-server/src/utils
  const templatesDir = path.resolve(__dirname, '../../../templates');

  beforeAll(async () => {
    fetcher = new TemplateFetcher(templatesDir);
    await fetcher.initialize();
  });

  describe('initialize', () => {
    it('should load all templates', () => {
      const templates = fetcher.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should load exactly 3 templates', () => {
      const templates = fetcher.getAllTemplates();
      expect(templates.length).toBe(3);
    });

    it('should have local-business-pro template', () => {
      const template = fetcher.getTemplate('local-business-pro');
      expect(template).toBeDefined();
      expect(template?.metadata.slug).toBe('local-business-pro');
    });

    it('should have personal-brand-pro template', () => {
      const template = fetcher.getTemplate('personal-brand-pro');
      expect(template).toBeDefined();
      expect(template?.metadata.slug).toBe('personal-brand-pro');
    });

    it('should have saas-product-pro template', () => {
      const template = fetcher.getTemplate('saas-product-pro');
      expect(template).toBeDefined();
      expect(template?.metadata.slug).toBe('saas-product-pro');
    });
  });

  describe('getAllTemplates', () => {
    it('should return array of templates', () => {
      const templates = fetcher.getAllTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBe(3);
    });

    it('should return templates with complete metadata', () => {
      const templates = fetcher.getAllTemplates();
      
      templates.forEach((template) => {
        expect(template.metadata).toBeDefined();
        expect(template.metadata.name).toBeDefined();
        expect(template.metadata.slug).toBeDefined();
        expect(template.metadata.displayName).toBeDefined();
        expect(template.metadata.category).toBeDefined();
        expect(template.metadata.useCase).toBeDefined();
        expect(template.metadata.stats).toBeDefined();
        expect(template.metadata.stats.fileCount).toBeGreaterThan(0);
        expect(template.metadata.stats.totalLOC).toBeGreaterThan(0);
      });
    });

    it('should return templates with file trees', () => {
      const templates = fetcher.getAllTemplates();
      
      templates.forEach((template) => {
        expect(template.fileTree).toBeDefined();
        expect(template.fileTree.type).toBe('directory');
        expect(template.fileTree.children).toBeDefined();
      });
    });
  });

  describe('getTemplate', () => {
    it('should return template by slug', () => {
      const template = fetcher.getTemplate('local-business-pro');
      expect(template).toBeDefined();
      expect(template?.metadata.slug).toBe('local-business-pro');
    });

    it('should return undefined for non-existent template', () => {
      const template = fetcher.getTemplate('non-existent');
      expect(template).toBeUndefined();
    });

    it('should return template with package.json data', () => {
      const template = fetcher.getTemplate('local-business-pro');
      expect(template?.packageJson).toBeDefined();
      expect(template?.packageJson.dependencies).toBeDefined();
      expect(template?.packageJson.scripts).toBeDefined();
    });

    it('should return template with config data', () => {
      const template = fetcher.getTemplate('local-business-pro');
      expect(template?.config).toBeDefined();
    });
  });

  describe('searchTemplates', () => {
    it('should find templates by name', () => {
      const results = fetcher.searchTemplates('local');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].metadata.slug).toContain('local');
    });

    it('should find templates by use case', () => {
      const results = fetcher.searchTemplates('restaurant');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].metadata.useCase).toContain('Restaurants');
    });

    it('should find templates by category', () => {
      const results = fetcher.searchTemplates('saas');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const lower = fetcher.searchTemplates('local');
      const upper = fetcher.searchTemplates('LOCAL');
      expect(lower.length).toBe(upper.length);
    });

    it('should return empty array for non-matching query', () => {
      const results = fetcher.searchTemplates('nonexistentquery12345');
      expect(results.length).toBe(0);
    });

    it('should find multiple templates with common terms', () => {
      const results = fetcher.searchTemplates('professional');
      // Should find templates that mention "professional" in description
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should filter by local-business category', () => {
      const results = fetcher.getTemplatesByCategory('local-business');
      expect(results.length).toBe(1);
      expect(results[0].metadata.category).toBe('local-business');
    });

    it('should filter by personal-brand category', () => {
      const results = fetcher.getTemplatesByCategory('personal-brand');
      expect(results.length).toBe(1);
      expect(results[0].metadata.category).toBe('personal-brand');
    });

    it('should filter by saas-product category', () => {
      const results = fetcher.getTemplatesByCategory('saas-product');
      expect(results.length).toBe(1);
      expect(results[0].metadata.category).toBe('saas-product');
    });

    it('should return empty array for non-existent category', () => {
      const results = fetcher.getTemplatesByCategory('non-existent');
      expect(results.length).toBe(0);
    });
  });
});
