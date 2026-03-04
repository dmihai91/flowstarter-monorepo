import { describe, it, expect } from 'vitest';
import { exampleSites, exampleCategories, exampleIndustries } from '../example-sites';

describe('example-sites data', () => {
  describe('exampleSites', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(exampleSites)).toBe(true);
      expect(exampleSites.length).toBeGreaterThan(0);
    });

    it('each site has required fields', () => {
      for (const site of exampleSites) {
        expect(site.id).toBeTruthy();
        expect(site.name).toBeTruthy();
        expect(site.description).toBeTruthy();
        expect(site.category).toBeTruthy();
        expect(site.url).toBeTruthy();
        expect(site.image).toBeTruthy();
        expect(Array.isArray(site.techStack)).toBe(true);
        expect(Array.isArray(site.features)).toBe(true);
        expect(site.industry).toBeTruthy();
      }
    });

    it('has unique IDs', () => {
      const ids = exampleSites.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('has at least one featured site', () => {
      expect(exampleSites.some((s) => s.isFeatured)).toBe(true);
    });
  });

  describe('exampleCategories', () => {
    it('is a non-empty array', () => {
      expect(exampleCategories.length).toBeGreaterThan(0);
    });

    it('each category has value and label', () => {
      for (const cat of exampleCategories) {
        expect(cat.value).toBeTruthy();
        expect(cat.label).toBeTruthy();
      }
    });

    it('includes an "all" category', () => {
      expect(exampleCategories.some((c) => c.value === 'all')).toBe(true);
    });
  });

  describe('exampleIndustries', () => {
    it('is a non-empty array', () => {
      expect(exampleIndustries.length).toBeGreaterThan(0);
    });

    it('includes All Industries', () => {
      expect(exampleIndustries).toContain('All Industries');
    });
  });
});
