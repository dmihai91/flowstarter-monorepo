import { afterEach, describe, expect, it, vi } from 'vitest';

describe('api.handoff.validate', () => {
  const originalSecret = process.env.HANDOFF_SECRET;
  const originalViteSecret = process.env.VITE_HANDOFF_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.HANDOFF_SECRET;
    } else {
      process.env.HANDOFF_SECRET = originalSecret;
    }

    if (originalViteSecret === undefined) {
      delete process.env.VITE_HANDOFF_SECRET;
    } else {
      process.env.VITE_HANDOFF_SECRET = originalViteSecret;
    }

    vi.resetModules();
  });

  it('fails closed when HANDOFF_SECRET is missing', async () => {
    delete process.env.HANDOFF_SECRET;
    delete process.env.VITE_HANDOFF_SECRET;

    const { loader, action } = await import('../../app/routes/api.handoff.validate');

    const loaderResponse = await loader({
      request: new Request('https://editor.test/api/handoff/validate?token=abc'),
      params: {},
      context: {},
    } as never);

    const actionResponse = await action({
      request: new Request('https://editor.test/api/handoff/validate', {
        method: 'POST',
        body: JSON.stringify({ token: 'abc' }),
      }),
      params: {},
      context: {},
    } as never);

    expect(loaderResponse.status).toBe(500);
    await expect(loaderResponse.json()).resolves.toEqual({
      valid: false,
      error: 'HANDOFF_SECRET is not configured',
    });

    expect(actionResponse.status).toBe(500);
    await expect(actionResponse.json()).resolves.toEqual({
      valid: false,
      error: 'HANDOFF_SECRET is not configured',
    });
  });
});
