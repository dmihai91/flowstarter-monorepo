import { describe, it, expect, beforeAll } from 'vitest';
import { getTemplateDetails, GetTemplateDetailsSchema } from './details.js';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('details tool', () => {
  let fetcher: TemplateFetcher;
  // Resolve to templates directory from mcp-server/src/tools
  const templatesDir = path.resolve(__dirname, '../../../templates');

  beforeAll(async () => {
    fetcher = new TemplateFetcher(templatesDir);
    await fetcher.initialize();
  });

  describe('GetTemplateDetailsSchema', () => {
    it('should be a valid Zod schema', () => {
      expect(GetTemplateDetailsSchema).toBeDefined();
      expect(GetTemplateDetailsSchema.parse).toBeDefined();
    });

    it('should require slug field', () => {
      const result = GetTemplateDetailsSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept valid slug', () => {
      const result = GetTemplateDetailsSchema.safeParse({ slug: 'local-business-pro' });
      expect(result.success).toBe(true);
    });

    it('should reject non-string slug', () => {
      const result = GetTemplateDetailsSchema.safeParse({ slug: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('getTemplateDetails', () => {
    it('should return template for valid slug', async () => {
      const result = await getTemplateDetails({ slug: 'local-business-pro' }, fetcher);

      expect(result.template).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.template?.metadata.slug).toBe('local-business-pro');
    });

    it('should return null template and error for invalid slug', async () => {
      const result = await getTemplateDetails({ slug: 'non-existent-template' }, fetcher);

      expect(result.template).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });

    it('should return complete metadata for local-business-pro', async () => {
      const result = await getTemplateDetails({ slug: 'local-business-pro' }, fetcher);

      expect(result.template).toBeDefined();
      const { metadata } = result.template!;

      expect(metadata.name).toBe('local-business-pro');
      expect(metadata.slug).toBe('local-business-pro');
      expect(metadata.displayName).toBe('Local Business Pro');
      expect(metadata.category).toBe('local-business');
      expect(metadata.techStack).toBeDefined();
      expect(metadata.stats).toBeDefined();
      expect(metadata.stats.fileCount).toBeGreaterThan(0);
    });

    it('should return complete metadata for personal-brand-pro', async () => {
      const result = await getTemplateDetails({ slug: 'personal-brand-pro' }, fetcher);

      expect(result.template).toBeDefined();
      const { metadata } = result.template!;

      expect(metadata.slug).toBe('personal-brand-pro');
      expect(metadata.displayName).toBe('Personal Brand Pro');
      expect(metadata.category).toBe('personal-brand');
    });

    it('should return complete metadata for saas-product-pro', async () => {
      const result = await getTemplateDetails({ slug: 'saas-product-pro' }, fetcher);

      expect(result.template).toBeDefined();
      const { metadata } = result.template!;

      expect(metadata.slug).toBe('saas-product-pro');
      expect(metadata.displayName).toBe('SaaS Product Pro');
      expect(metadata.category).toBe('saas-product');
    });

    it('should include file tree in response', async () => {
      const result = await getTemplateDetails({ slug: 'local-business-pro' }, fetcher);

      expect(result.template?.fileTree).toBeDefined();
      expect(result.template?.fileTree.type).toBe('directory');
      expect(result.template?.fileTree.children).toBeDefined();
    });

    it('should include package.json data in response', async () => {
      const result = await getTemplateDetails({ slug: 'local-business-pro' }, fetcher);

      expect(result.template?.packageJson).toBeDefined();
      expect(result.template?.packageJson.dependencies).toBeDefined();
      expect(result.template?.packageJson.scripts).toBeDefined();
    });

    it('should include tech stack information', async () => {
      const result = await getTemplateDetails({ slug: 'local-business-pro' }, fetcher);

      const techStack = result.template?.metadata.techStack;
      expect(techStack?.framework).toBe('TanStack Start');
      expect(techStack?.react).toBe('19');
      expect(techStack?.styling).toBe('Tailwind CSS');
      expect(techStack?.typescript).toBe(true);
    });

    it('should include use cases', async () => {
      const result = await getTemplateDetails({ slug: 'local-business-pro' }, fetcher);

      const useCase = result.template?.metadata.useCase;
      expect(useCase).toBeDefined();
      expect(Array.isArray(useCase)).toBe(true);
      expect(useCase?.length).toBeGreaterThan(0);
    });
  });
});
