import { describe, it, expect, beforeAll } from 'vitest';
import { cloneTemplate, CloneTemplateSchema, CloneResult } from './clone.js';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('clone tool', () => {
  let fetcher: TemplateFetcher;
  // Resolve to templates directory from mcp-server/src/tools
  const templatesDir = path.resolve(__dirname, '../../../templates');

  beforeAll(async () => {
    fetcher = new TemplateFetcher(templatesDir);
    await fetcher.initialize();
  });

  describe('CloneTemplateSchema', () => {
    it('should be a valid Zod schema', () => {
      expect(CloneTemplateSchema).toBeDefined();
      expect(CloneTemplateSchema.parse).toBeDefined();
    });

    it('should require slug and projectName', () => {
      const result = CloneTemplateSchema.safeParse({});
      expect(result.success).toBe(false);

      const withSlugOnly = CloneTemplateSchema.safeParse({ slug: 'test' });
      expect(withSlugOnly.success).toBe(false);

      const withNameOnly = CloneTemplateSchema.safeParse({ projectName: 'test' });
      expect(withNameOnly.success).toBe(false);
    });

    it('should accept valid slug and projectName', () => {
      const result = CloneTemplateSchema.safeParse({
        slug: 'local-business-pro',
        projectName: 'My Project'
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional projectDescription', () => {
      const result = CloneTemplateSchema.safeParse({
        slug: 'local-business-pro',
        projectName: 'My Project',
        projectDescription: 'A description'
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional customizations', () => {
      const result = CloneTemplateSchema.safeParse({
        slug: 'local-business-pro',
        projectName: 'My Project',
        customizations: { key: 'value' }
      });
      expect(result.success).toBe(true);
    });
  });

  describe('cloneTemplate', () => {
    it('should clone a valid template', async () => {
      const result = await cloneTemplate(
        {
          slug: 'local-business-pro',
          projectName: 'My Restaurant'
        },
        fetcher,
        templatesDir
      );

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('My Restaurant');
      expect(result.templateSlug).toBe('local-business-pro');
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should return error for non-existent template', async () => {
      const result = await cloneTemplate(
        {
          slug: 'non-existent-template',
          projectName: 'My Project'
        },
        fetcher,
        templatesDir
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.files).toEqual([]);
    });

    it('should include metadata in result', async () => {
      const result = await cloneTemplate(
        {
          slug: 'local-business-pro',
          projectName: 'My Restaurant'
        },
        fetcher,
        templatesDir
      );

      expect(result.metadata).toBeDefined();
      expect(result.metadata.displayName).toBe('Local Business Pro');
      expect(result.metadata.category).toBe('local-business');
      expect(result.metadata.techStack).toBeDefined();
    });

    it('should update package.json with project name', async () => {
      const result = await cloneTemplate(
        {
          slug: 'local-business-pro',
          projectName: 'My Amazing Restaurant'
        },
        fetcher,
        templatesDir
      );

      const packageJson = result.files.find(f => f.path === 'package.json');
      expect(packageJson).toBeDefined();

      const parsed = JSON.parse(packageJson!.content);
      expect(parsed.name).toBe('my-amazing-restaurant');
    });

    it('should slugify project name in package.json', async () => {
      const result = await cloneTemplate(
        {
          slug: 'local-business-pro',
          projectName: 'My Project With Spaces'
        },
        fetcher,
        templatesDir
      );

      const packageJson = result.files.find(f => f.path === 'package.json');
      const parsed = JSON.parse(packageJson!.content);

      expect(parsed.name).toBe('my-project-with-spaces');
      expect(parsed.name).not.toContain(' ');
    });

    it('should update package.json with project description', async () => {
      const result = await cloneTemplate(
        {
          slug: 'local-business-pro',
          projectName: 'My Restaurant',
          projectDescription: 'The best restaurant in town'
        },
        fetcher,
        templatesDir
      );

      const packageJson = result.files.find(f => f.path === 'package.json');
      const parsed = JSON.parse(packageJson!.content);

      expect(parsed.description).toBe('The best restaurant in town');
    });

    it('should include files array with proper structure', async () => {
      const result = await cloneTemplate(
        {
          slug: 'local-business-pro',
          projectName: 'Test Project'
        },
        fetcher,
        templatesDir
      );

      expect(result.files.length).toBeGreaterThan(0);
      result.files.forEach(file => {
        expect(file.path).toBeDefined();
        expect(file.content).toBeDefined();
        expect(file.type).toBe('file');
      });
    });

    it('should clone personal-brand-pro template', async () => {
      const result = await cloneTemplate(
        {
          slug: 'personal-brand-pro',
          projectName: 'My Personal Brand'
        },
        fetcher,
        templatesDir
      );

      expect(result.success).toBe(true);
      expect(result.templateSlug).toBe('personal-brand-pro');
      expect(result.metadata.category).toBe('personal-brand');
    });

    it('should clone saas-product-pro template', async () => {
      const result = await cloneTemplate(
        {
          slug: 'saas-product-pro',
          projectName: 'My SaaS App'
        },
        fetcher,
        templatesDir
      );

      expect(result.success).toBe(true);
      expect(result.templateSlug).toBe('saas-product-pro');
      expect(result.metadata.category).toBe('saas-product');
    });

    it('should apply packageJson customizations', async () => {
      const result = await cloneTemplate(
        {
          slug: 'local-business-pro',
          projectName: 'Custom Project',
          customizations: {
            packageJson: {
              version: '2.0.0',
              author: 'Test Author'
            }
          }
        },
        fetcher,
        templatesDir
      );

      const packageJson = result.files.find(f => f.path === 'package.json');
      const parsed = JSON.parse(packageJson!.content);

      expect(parsed.version).toBe('2.0.0');
      expect(parsed.author).toBe('Test Author');
    });

    it('should preserve original dependencies after clone', async () => {
      const result = await cloneTemplate(
        {
          slug: 'local-business-pro',
          projectName: 'Preserve Deps Test'
        },
        fetcher,
        templatesDir
      );

      const packageJson = result.files.find(f => f.path === 'package.json');
      const parsed = JSON.parse(packageJson!.content);

      // Should still have react and other core dependencies
      expect(parsed.dependencies).toBeDefined();
      expect(Object.keys(parsed.dependencies).length).toBeGreaterThan(0);
    });

    it('should include features in metadata', async () => {
      const result = await cloneTemplate(
        {
          slug: 'local-business-pro',
          projectName: 'Features Test'
        },
        fetcher,
        templatesDir
      );

      expect(result.metadata.features).toBeDefined();
      expect(Array.isArray(result.metadata.features)).toBe(true);
    });

    it('should handle lowercase project names', async () => {
      const result = await cloneTemplate(
        {
          slug: 'local-business-pro',
          projectName: 'already-lowercase'
        },
        fetcher,
        templatesDir
      );

      const packageJson = result.files.find(f => f.path === 'package.json');
      const parsed = JSON.parse(packageJson!.content);

      expect(parsed.name).toBe('already-lowercase');
    });
  });
});
