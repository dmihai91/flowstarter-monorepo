import { afterEach, describe, expect, it, vi } from 'vitest';

describe('api.system.diagnostics loader', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    vi.resetModules();
  });

  it('is disabled outside development', async () => {
    process.env.NODE_ENV = 'production';

    const { loader } = await import('../../app/routes/api.system.diagnostics');
    const response = await loader({
      request: new Request('https://editor.test/api/system/diagnostics'),
      params: {},
      context: {},
    } as never);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Not found' });
  });
});
