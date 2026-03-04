import { describe, it, expect } from 'vitest';
import {
  projectTemplates,
  projectFeatures,
  projectCategories,
} from '../project-templates';

describe('project-templates data', () => {
  describe('projectFeatures', () => {
    it('is a non-empty array', () => {
      expect(projectFeatures.length).toBeGreaterThan(0);
    });

    it('each feature has required fields', () => {
      for (const feature of projectFeatures) {
        expect(feature.id).toBeTruthy();
        expect(feature.name).toBeTruthy();
        expect(feature.description).toBeTruthy();
        expect(typeof feature.required).toBe('boolean');
        expect(feature.category).toBeTruthy();
      }
    });

    it('has unique feature IDs', () => {
      const ids = projectFeatures.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('includes required features', () => {
      const requiredFeatures = projectFeatures.filter((f) => f.required);
      expect(requiredFeatures.length).toBeGreaterThan(0);
    });
  });

  describe('projectTemplates', () => {
    it('is a non-empty array', () => {
      expect(projectTemplates.length).toBeGreaterThan(0);
    });

    it('each template has required fields', () => {
      for (const template of projectTemplates) {
        expect(template.id).toBeTruthy();
        expect(template.slug).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.status).toBe('published');
        expect(Array.isArray(template.features)).toBe(true);
        expect(template.features.length).toBeGreaterThan(0);
        expect(template.techStack).toBeDefined();
        expect(template.complexity).toBeTruthy();
      }
    });

    it('has unique template IDs', () => {
      const ids = projectTemplates.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('has unique template slugs', () => {
      const slugs = projectTemplates.map((t) => t.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('each template is assigned to a category', () => {
      for (const template of projectTemplates) {
        expect(template.category).toBeDefined();
        expect(typeof template.category).toBe('object');
      }
    });
  });

  describe('projectCategories', () => {
    it('is a non-empty array', () => {
      expect(projectCategories.length).toBeGreaterThan(0);
    });

    it('each category has required fields', () => {
      for (const category of projectCategories) {
        expect(category.id).toBeTruthy();
        expect(category.name).toBeTruthy();
        expect(category.icon).toBeTruthy();
        expect(Array.isArray(category.templates)).toBe(true);
      }
    });

    it('has unique category IDs', () => {
      const ids = projectCategories.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('each category has at least one template assigned', () => {
      for (const category of projectCategories) {
        expect(category.templates.length).toBeGreaterThan(0);
      }
    });
  });

  describe('template-category mapping', () => {
    it('all templates are in exactly one category', () => {
      const allCategoryTemplateIds = projectCategories.flatMap((c) =>
        c.templates.map((t) => t.id)
      );
      for (const template of projectTemplates) {
        const count = allCategoryTemplateIds.filter((id) => id === template.id).length;
        expect(count).toBe(1);
      }
    });
  });
});
