import { describe, it, expect, vi, beforeEach } from 'vitest';

// server-only is already mocked globally in test/setup.ts

vi.mock('fs/promises', () => ({
  default: {
    readdir: vi.fn(),
  },
}));

import fs from 'fs/promises';
import {
  getAvailableTemplates,
  getRepoTemplates,
  templateExists,
  downloadTemplate,
  processTemplateFiles,
} from '../local-template-service';

describe('local-template-service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAvailableTemplates', () => {
    it('returns sorted directory names when fs succeeds', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'product-launch', isDirectory: () => true },
        { name: 'personal-brand', isDirectory: () => true },
        { name: 'README.md', isDirectory: () => false },
      ] as never);

      const result = await getAvailableTemplates();
      expect(result).toEqual(['personal-brand', 'product-launch']);
    });

    it('returns fallback list when fs throws', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('ENOENT'));

      const result = await getAvailableTemplates();
      expect(result).toEqual([
        'personal-brand',
        'course-launch',
        'local-business',
        'product-launch',
        'mini-ecommerce',
      ]);
    });
  });

  describe('getRepoTemplates', () => {
    it('returns array of template objects with id, name, categoryId', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'personal-brand', isDirectory: () => true },
        { name: 'services-agency', isDirectory: () => true },
        { name: 'saas-dashboard', isDirectory: () => true },
        { name: 'ecom-store', isDirectory: () => true },
        { name: 'education-lms', isDirectory: () => true },
        { name: 'local-business', isDirectory: () => true },
      ] as never);

      const result = await getRepoTemplates();

      expect(result).toHaveLength(6);
      result.forEach((t) => {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('categoryId');
        expect(t).toHaveProperty('thumbnailUrl');
      });
    });

    it('maps template IDs to correct categories', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'personal-brand', isDirectory: () => true },
        { name: 'services-consulting', isDirectory: () => true },
        { name: 'saas-product', isDirectory: () => true },
        { name: 'ecom-lite', isDirectory: () => true },
        { name: 'education-bootcamp', isDirectory: () => true },
        { name: 'events-conf', isDirectory: () => true },
        { name: 'local-business', isDirectory: () => true },
        { name: 'unknown-template', isDirectory: () => true },
      ] as never);

      const result = await getRepoTemplates();
      const catMap = Object.fromEntries(
        result.map((t) => [t.id, t.categoryId])
      );

      expect(catMap['personal-brand']).toBe('personal-brand');
      expect(catMap['services-consulting']).toBe('services-agencies');
      expect(catMap['saas-product']).toBe('saas-product');
      expect(catMap['ecom-lite']).toBe('ecommerce-light');
      expect(catMap['education-bootcamp']).toBe('education-events');
      expect(catMap['events-conf']).toBe('education-events');
      expect(catMap['local-business']).toBe('local-business');
      expect(catMap['unknown-template']).toBe('personal-brand'); // default
    });

    it('converts IDs to human-readable names', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'personal-brand', isDirectory: () => true },
      ] as never);

      const result = await getRepoTemplates();
      expect(result[0].name).toBe('Personal Brand');
    });
  });

  describe('templateExists', () => {
    it('returns true for existing template', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'personal-brand', isDirectory: () => true },
      ] as never);

      expect(await templateExists('personal-brand')).toBe(true);
    });

    it('returns false for non-existing template', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'personal-brand', isDirectory: () => true },
      ] as never);

      expect(await templateExists('nonexistent')).toBe(false);
    });
  });

  describe('downloadTemplate (fallback)', () => {
    it('returns array of TemplateFile objects', async () => {
      const files = await downloadTemplate('personal-brand');
      expect(files.length).toBeGreaterThan(0);
      files.forEach((f) => {
        expect(f).toHaveProperty('path');
        expect(f).toHaveProperty('content');
        expect(f).toHaveProperty('type');
      });
    });

    it('includes package.json and app/page.tsx', async () => {
      const files = await downloadTemplate('course-launch');
      const paths = files.map((f) => f.path);
      expect(paths).toContain('package.json');
      expect(paths).toContain('app/page.tsx');
    });
  });

  describe('processTemplateFiles', () => {
    it('replaces placeholders in file content', async () => {
      const files = [
        {
          path: 'README.md',
          content: 'Hello {{NAME}}, welcome to {{APP}}',
          type: 'file' as const,
        },
        { path: 'src', content: '', type: 'dir' as const },
      ];
      const result = await processTemplateFiles(files, {
        NAME: 'Alice',
        APP: 'Flowstarter',
      });

      expect(result[0].content).toBe('Hello Alice, welcome to Flowstarter');
      // dir type should be unchanged
      expect(result[1].content).toBe('');
    });
  });

  describe('getFileType (via downloadTemplate internals)', () => {
    it('generates files with correct extensions', async () => {
      const files = await downloadTemplate('personal-brand');
      const tsxFile = files.find((f) => f.path.endsWith('.tsx'));
      const cssFile = files.find((f) => f.path.endsWith('.css'));
      const jsonFile = files.find((f) => f.path.endsWith('.json'));

      expect(tsxFile).toBeDefined();
      expect(cssFile).toBeDefined();
      expect(jsonFile).toBeDefined();
    });
  });
});
