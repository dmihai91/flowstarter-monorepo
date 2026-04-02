import { afterEach, describe, expect, it, vi } from 'vitest';

describe('api.system.diagnostics loader', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      (process.env as Record<string, string | undefined>).NODE_ENV = undefined;
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

    const res = response as Response;
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Not found' });
  });
});
