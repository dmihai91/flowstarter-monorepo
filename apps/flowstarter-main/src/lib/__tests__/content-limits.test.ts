import { describe, it, expect } from 'vitest';
import { DESCRIPTION_MIN, DESCRIPTION_MAX, UVP_MIN, UVP_MAX } from '../content-limits';

describe('content-limits', () => {
  it('exports DESCRIPTION_MIN as 100', () => {
    expect(DESCRIPTION_MIN).toBe(100);
  });

  it('exports DESCRIPTION_MAX as 500', () => {
    expect(DESCRIPTION_MAX).toBe(500);
  });

  it('exports UVP_MIN as 50', () => {
    expect(UVP_MIN).toBe(50);
  });

  it('exports UVP_MAX as 500', () => {
    expect(UVP_MAX).toBe(500);
  });

  it('min values are less than max values', () => {
    expect(DESCRIPTION_MIN).toBeLessThan(DESCRIPTION_MAX);
    expect(UVP_MIN).toBeLessThan(UVP_MAX);
  });
});
