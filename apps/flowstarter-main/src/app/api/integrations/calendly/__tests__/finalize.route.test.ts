import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.fn();
const useServerSupabaseWithAuthMock = vi.fn();
const syncCalendlySelectionToProjectMock = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}));

vi.mock('@/hooks/useServerSupabase', () => ({
  useServerSupabaseWithAuth: useServerSupabaseWithAuthMock,
}));

vi.mock('@/lib/calendly-project-sync', () => ({
  syncCalendlySelectionToProject: syncCalendlySelectionToProjectMock,
}));

describe('POST /api/integrations/calendly/finalize', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('persists the integration config and syncs the booking url to the project', async () => {
    authMock.mockResolvedValue({ userId: 'user-1' });

    const upsert = vi.fn().mockResolvedValue({ error: null });
    useServerSupabaseWithAuthMock.mockResolvedValue({
      from: vi.fn().mockReturnValue({ upsert }),
    });
    syncCalendlySelectionToProjectMock.mockResolvedValue('project-1');

    const { POST } = await import('../finalize/route');
    const response = await POST(
      new Request('http://localhost/api/integrations/calendly/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selection: {
            url: 'https://calendly.com/acme/intro-call',
          },
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      syncedProjectId: 'project-1',
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        integration_id: 'calendly',
      }),
      expect.any(Object)
    );
    expect(syncCalendlySelectionToProjectMock).toHaveBeenCalledWith({
      supabase: expect.any(Object),
      userId: 'user-1',
      eventUrl: 'https://calendly.com/acme/intro-call',
    });
  });

  it('returns 401 when the user is not authenticated', async () => {
    authMock.mockResolvedValue({ userId: null });

    const { POST } = await import('../finalize/route');
    const response = await POST(
      new Request('http://localhost/api/integrations/calendly/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });
});
