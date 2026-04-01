import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '~/convex/_generated/api';

const getAuthMock = vi.fn();
const getClientMock = vi.fn();
const buildProjectMock = vi.fn();
const downloadBundleMock = vi.fn();
const validateBundleMock = vi.fn();
const createPagesProjectMock = vi.fn();
const deployToPagesMock = vi.fn();
const convexMutationMock = vi.fn();
const getConvexClientMock = vi.fn();

vi.mock('@clerk/remix/ssr.server', () => ({
  getAuth: getAuthMock,
}));

vi.mock('@flowstarter/editor-engine/daytona', () => ({
  getClient: getClientMock,
}));

vi.mock('@flowstarter/editor-engine/publishing', () => ({
  buildProject: buildProjectMock,
  downloadBundle: downloadBundleMock,
  validateBundle: validateBundleMock,
  createPagesProject: createPagesProjectMock,
  deployToPages: deployToPagesMock,
}));

vi.mock('~/lib/services/daytona/convexClient', () => ({
  getConvexClient: getConvexClientMock,
}));

describe('api.publish action', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('rejects unauthenticated publish requests', async () => {
    getAuthMock.mockResolvedValue({
      userId: null,
      sessionClaims: null,
    });

    const { action } = await import('../../app/routes/api.publish');
    const response = await action({
      request: new Request('https://editor.test/api/publish', {
        method: 'POST',
        body: JSON.stringify({ projectId: 'project_123' }),
      }),
      params: {},
      context: {},
    } as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('rejects authenticated non-team users', async () => {
    getAuthMock.mockResolvedValue({
      userId: 'user_123',
      sessionClaims: {
        email: 'client@example.com',
        public_metadata: { role: 'client' },
      },
    });

    const { action } = await import('../../app/routes/api.publish');
    const response = await action({
      request: new Request('https://editor.test/api/publish', {
        method: 'POST',
        body: JSON.stringify({ projectId: 'project_123' }),
      }),
      params: {},
      context: {},
    } as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('persists publish metadata to Convex after a successful deployment', async () => {
    getAuthMock.mockResolvedValue({
      userId: 'user_123',
      sessionClaims: {
        email: 'operator@flowstarter.app',
      },
    });
    getClientMock.mockReturnValue({
      list: vi.fn().mockResolvedValue([{ labels: { project: 'project_123' } }]),
    });
    buildProjectMock.mockResolvedValue({ success: true, outputDir: '/dist' });
    downloadBundleMock.mockResolvedValue([{ path: 'index.html', content: '<html></html>' }]);
    validateBundleMock.mockReturnValue({ valid: true, errors: [] });
    createPagesProjectMock.mockResolvedValue(undefined);
    deployToPagesMock.mockResolvedValue({
      url: 'https://client.flowstarter.app',
      id: 'deploy_123',
      environment: 'production',
    });
    getConvexClientMock.mockReturnValue({
      mutation: convexMutationMock.mockResolvedValue(undefined),
    });

    process.env.CLOUDFLARE_ACCOUNT_ID = 'cf-account';
    process.env.CLOUDFLARE_API_TOKEN = 'cf-token';

    const { action } = await import('../../app/routes/api.publish');
    const response = await action({
      request: new Request('https://editor.test/api/publish', {
        method: 'POST',
        body: JSON.stringify({ projectId: 'project_123', customDomain: 'client.com' }),
      }),
      params: {},
      context: {},
    } as never);

    expect(response.status).toBe(200);
    expect(convexMutationMock).toHaveBeenCalledWith(api.projects.publish, {
      projectId: 'project_123',
      publishedUrl: 'https://client.flowstarter.app',
      customDomain: 'client.com',
      publishedBy: 'user_123',
    });
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      publishedUrl: 'https://client.flowstarter.app',
      customDomain: 'client.com',
      publishedBy: 'user_123',
    });
  });
});
