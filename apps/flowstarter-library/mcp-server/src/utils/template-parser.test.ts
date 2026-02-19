import { describe, it, expect, beforeAll } from 'vitest';
import { parseTemplate } from './template-parser.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('template-parser', () => {
  // Resolve to templates directory from mcp-server/src/utils
  const templatesDir = path.resolve(__dirname, '../../../templates');

  describe('parseTemplate', () => {
    describe('local-business-pro', () => {
      let template: Awaited<ReturnType<typeof parseTemplate>>;

      beforeAll(async () => {
        const templatePath = path.join(templatesDir, 'local-business-pro');
        template = await parseTemplate(templatePath, 'local-business-pro');
      });

      it('should parse template metadata', () => {
        expect(template.metadata).toBeDefined();
        expect(template.metadata.name).toBe('local-business-pro');
        expect(template.metadata.slug).toBe('local-business-pro');
      });

      it('should have correct display name', () => {
        expect(template.metadata.displayName).toBe('Local Business Pro');
      });

      it('should have correct category', () => {
        expect(template.metadata.category).toBe('local-business');
      });

      it('should include use cases', () => {
        expect(template.metadata.useCase).toBeDefined();
        expect(Array.isArray(template.metadata.useCase)).toBe(true);
        expect(template.metadata.useCase).toContain('Restaurants');
        expect(template.metadata.useCase).toContain('Salons');
      });

      it('should have tech stack info', () => {
        expect(template.metadata.techStack).toBeDefined();
        expect(template.metadata.techStack.framework).toBe('TanStack Start');
        expect(template.metadata.techStack.react).toBe('19');
        expect(template.metadata.techStack.styling).toBe('Tailwind CSS');
        expect(template.metadata.techStack.typescript).toBe(true);
      });

      it('should have file statistics', () => {
        expect(template.metadata.stats).toBeDefined();
        expect(template.metadata.stats.fileCount).toBeGreaterThan(0);
        expect(template.metadata.stats.totalLOC).toBeGreaterThan(0);
        expect(template.metadata.stats.codeLOC).toBeGreaterThan(0);
      });

      it('should have file tree', () => {
        expect(template.fileTree).toBeDefined();
        expect(template.fileTree.type).toBe('directory');
        expect(template.fileTree.children).toBeDefined();
      });

      it('should have package.json data', () => {
        expect(template.packageJson).toBeDefined();
        expect(template.packageJson.dependencies).toBeDefined();
        expect(template.packageJson.scripts).toBeDefined();
      });
    });

    describe('personal-brand-pro', () => {
      let template: Awaited<ReturnType<typeof parseTemplate>>;

      beforeAll(async () => {
        const templatePath = path.join(templatesDir, 'personal-brand-pro');
        template = await parseTemplate(templatePath, 'personal-brand-pro');
      });

      it('should parse template metadata', () => {
        expect(template.metadata).toBeDefined();
        expect(template.metadata.name).toBe('personal-brand-pro');
        expect(template.metadata.slug).toBe('personal-brand-pro');
      });

      it('should have correct display name', () => {
        expect(template.metadata.displayName).toBe('Personal Brand Pro');
      });

      it('should have correct category', () => {
        expect(template.metadata.category).toBe('personal-brand');
      });

      it('should include relevant use cases', () => {
        expect(template.metadata.useCase).toContain('Consultants');
        expect(template.metadata.useCase).toContain('Freelancers');
        expect(template.metadata.useCase).toContain('Coaches');
      });
    });

    describe('saas-product-pro', () => {
      let template: Awaited<ReturnType<typeof parseTemplate>>;

      beforeAll(async () => {
        const templatePath = path.join(templatesDir, 'saas-product-pro');
        template = await parseTemplate(templatePath, 'saas-product-pro');
      });

      it('should parse template metadata', () => {
        expect(template.metadata).toBeDefined();
        expect(template.metadata.name).toBe('saas-product-pro');
        expect(template.metadata.slug).toBe('saas-product-pro');
      });

      it('should have correct display name', () => {
        expect(template.metadata.displayName).toBe('SaaS Product Pro');
      });

      it('should have correct category', () => {
        expect(template.metadata.category).toBe('saas-product');
      });

      it('should include relevant use cases', () => {
        expect(template.metadata.useCase).toContain('Software products');
        expect(template.metadata.useCase).toContain('SaaS platforms');
      });
    });

    describe('edge cases', () => {
      it('should handle template with missing optional files gracefully', async () => {
        // Even if some files are missing, the parser should still work
        const templatePath = path.join(templatesDir, 'local-business-pro');
        const template = await parseTemplate(templatePath, 'local-business-pro');

        // Should have defaults for missing data
        expect(template.metadata.description).toBeDefined();
        expect(template.metadata.targetAudience).toBeDefined();
      });

      it('should count CSS lines separately', async () => {
        const templatePath = path.join(templatesDir, 'local-business-pro');
        const template = await parseTemplate(templatePath, 'local-business-pro');

        expect(template.metadata.stats.cssLOC).toBeDefined();
        expect(template.metadata.stats.cssLOC).toBeGreaterThanOrEqual(0);
      });

      it('should count code lines (TypeScript/JavaScript)', async () => {
        const templatePath = path.join(templatesDir, 'local-business-pro');
        const template = await parseTemplate(templatePath, 'local-business-pro');

        expect(template.metadata.stats.codeLOC).toBeGreaterThan(0);
      });

      it('should have total LOC as sum of code and CSS LOC', async () => {
        const templatePath = path.join(templatesDir, 'local-business-pro');
        const template = await parseTemplate(templatePath, 'local-business-pro');

        const expectedTotal = template.metadata.stats.codeLOC + template.metadata.stats.cssLOC;
        expect(template.metadata.stats.totalLOC).toBe(expectedTotal);
      });
    });

    describe('file tree structure', () => {
      it('should have directories before files', async () => {
        const templatePath = path.join(templatesDir, 'local-business-pro');
        const template = await parseTemplate(templatePath, 'local-business-pro');

        const children = template.fileTree.children || [];
        let foundFile = false;

        for (const child of children) {
          if (child.type === 'file') {
            foundFile = true;
          }
          if (child.type === 'directory' && foundFile) {
            // If we find a directory after a file, the order is wrong
            throw new Error('Directories should come before files');
          }
        }
      });

      it('should exclude node_modules from file tree', async () => {
        const templatePath = path.join(templatesDir, 'local-business-pro');
        const template = await parseTemplate(templatePath, 'local-business-pro');

        const hasNodeModules = template.fileTree.children?.some(
          (child) => child.name === 'node_modules'
        );
        expect(hasNodeModules).toBe(false);
      });

      it('should exclude .git from file tree', async () => {
        const templatePath = path.join(templatesDir, 'local-business-pro');
        const template = await parseTemplate(templatePath, 'local-business-pro');

        const hasGit = template.fileTree.children?.some(
          (child) => child.name === '.git'
        );
        expect(hasGit).toBe(false);
      });
    });

    describe('config parsing', () => {
      it('should parse config.json', async () => {
        const templatePath = path.join(templatesDir, 'local-business-pro');
        const template = await parseTemplate(templatePath, 'local-business-pro');

        expect(template.config).toBeDefined();
      });
    });

    describe('content structure', () => {
      it('should parse content.md when present', async () => {
        const templatePath = path.join(templatesDir, 'local-business-pro');
        const template = await parseTemplate(templatePath, 'local-business-pro');

        // Content structure might be empty string if file doesn't exist, but should be defined
        expect(template.contentStructure).toBeDefined();
      });
    });
  });
});
