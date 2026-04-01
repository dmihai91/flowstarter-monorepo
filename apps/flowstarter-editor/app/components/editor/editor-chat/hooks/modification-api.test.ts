import { describe, expect, it } from 'vitest';
import { getModificationRoute } from './modification-api';

describe('modification-api', () => {
  it('always routes beta editor modifications through the direct simple path', async () => {
    const result = await getModificationRoute('Add a stronger hero headline');

    expect(result).toMatchObject({
      route: 'simple',
      confidence: 1,
      estimatedComplexity: 'low',
    });
    expect(result.reason).toContain('Beta editor uses the direct modification flow');
  });
});
