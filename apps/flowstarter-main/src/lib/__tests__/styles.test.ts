import { describe, expect, it } from 'vitest';
import { glassCard, DARK_SURFACE } from '../styles';

describe('shared styles', () => {
  describe('glassCard', () => {
    it('is a string class list', () => {
      expect(typeof glassCard).toBe('string');
    });

    it('includes rounded corners', () => {
      expect(glassCard).toContain('rounded-2xl');
    });

    it('includes backdrop blur', () => {
      expect(glassCard).toContain('backdrop-blur');
    });

    it('includes light and dark variants', () => {
      expect(glassCard).toContain('bg-white/');
      expect(glassCard).toContain('dark:bg-white/');
    });

    it('includes 3D shadow effect', () => {
      expect(glassCard).toContain('inset');
    });
  });

  describe('DARK_SURFACE', () => {
    it('is a valid hex color', () => {
      expect(DARK_SURFACE).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
