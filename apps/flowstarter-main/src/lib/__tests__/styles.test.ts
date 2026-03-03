import { describe, expect, it } from 'vitest';
import { DARK_SURFACE } from '../styles';

describe('shared styles', () => {
  describe('DARK_SURFACE', () => {
    it('is a valid hex color', () => {
      expect(DARK_SURFACE).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
