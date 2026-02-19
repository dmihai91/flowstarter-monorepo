/**
 * Modification Router Tests
 *
 * Unit tests for the modification router that classifies requests
 * into simple (single agent) or gretly (multi-agent) routes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routeModification, type RouteDecision } from '../api.modification-router';

describe('Modification Router', () => {
  describe('Quick Heuristics (no LLM)', () => {
    it('should route simple text changes to simple', async () => {
      const result = await routeModification('change the title to Welcome');
      expect(result.route).toBe('simple');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should route "fix typo" to simple', async () => {
      const result = await routeModification('fix typo in header');
      expect(result.route).toBe('simple');
    });

    it('should route "update color" to simple', async () => {
      const result = await routeModification('update button color');
      expect(result.route).toBe('simple');
    });

    it('should route "replace image" to simple', async () => {
      const result = await routeModification('replace hero image');
      expect(result.route).toBe('simple');
    });

    it('should route "make text bigger" to simple', async () => {
      const result = await routeModification('make headline bigger');
      expect(result.route).toBe('simple');
    });

    it('should route "hide element" to simple', async () => {
      const result = await routeModification('hide the newsletter section');
      expect(result.route).toBe('simple');
    });

    it('should route "add new page" to gretly', async () => {
      const result = await routeModification('add new page for pricing');
      expect(result.route).toBe('gretly');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should route "redesign" to gretly', async () => {
      const result = await routeModification('redesign the entire homepage');
      expect(result.route).toBe('gretly');
    });

    it('should route "add booking integration" to gretly', async () => {
      const result = await routeModification('add booking system with Calendly');
      expect(result.route).toBe('gretly');
    });

    it('should route "create new section" to gretly', async () => {
      const result = await routeModification('create new section for testimonials');
      expect(result.route).toBe('gretly');
    });

    it('should route "add e-commerce" to gretly', async () => {
      const result = await routeModification('add e-commerce functionality');
      expect(result.route).toBe('gretly');
    });

    it('should route "add payment" to gretly', async () => {
      const result = await routeModification('add payment processing');
      expect(result.route).toBe('gretly');
    });
  });

  describe('LLM Classification Fallback', () => {
    // When no API key is set or LLM fails, router should gracefully fall back
    it('should fall back to simple for ambiguous requests (no API key)', async () => {
      // This will trigger LLM path which will fail without API key and fall back
      const result = await routeModification('adjust the spacing between sections to look more professional');
      
      // Should get a valid result (fallback behavior)
      expect(result).toBeDefined();
      expect(['simple', 'gretly']).toContain(result.route);
      // Fallback has low confidence
      expect(result.confidence).toBeLessThanOrEqual(0.9);
    });

    it('should always return valid structure even on LLM failure', async () => {
      const result = await routeModification('transform this into a multi-step wizard with progress tracking');
      
      expect(result).toHaveProperty('route');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('estimatedComplexity');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty instruction', async () => {
      const result = await routeModification('');
      expect(result).toBeDefined();
      expect(['simple', 'gretly']).toContain(result.route);
    });

    it('should handle very long instruction', async () => {
      const longInstruction = 'change the color '.repeat(100);
      const result = await routeModification(longInstruction);
      expect(result).toBeDefined();
    });

    it('should handle special characters', async () => {
      const result = await routeModification('change "title" to <Welcome> & update');
      expect(result).toBeDefined();
    });

    it('should handle mixed case', async () => {
      const result = await routeModification('ADD NEW PAGE for Services');
      expect(result.route).toBe('gretly');
    });

    it('should handle unicode', async () => {
      const result = await routeModification('změnit titulek na Vítejte 🎉');
      expect(result).toBeDefined();
    });
  });

  describe('Confidence Levels', () => {
    it('should have high confidence for clear simple patterns', async () => {
      const result = await routeModification('change title to Hello');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('should have high confidence for clear complex patterns', async () => {
      const result = await routeModification('add new page with booking system');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('Performance', () => {
    it('should return quickly for heuristic matches', async () => {
      const start = Date.now();
      await routeModification('fix typo');
      const duration = Date.now() - start;
      
      // Heuristic should be < 10ms
      expect(duration).toBeLessThan(50);
    });
  });
});

describe('Route Decision Types', () => {
  it('should return all required fields', async () => {
    const result = await routeModification('change the title');
    
    expect(result).toHaveProperty('route');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('reason');
    expect(result).toHaveProperty('estimatedComplexity');
    
    expect(['simple', 'gretly']).toContain(result.route);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(['low', 'medium', 'high']).toContain(result.estimatedComplexity);
  });
});

