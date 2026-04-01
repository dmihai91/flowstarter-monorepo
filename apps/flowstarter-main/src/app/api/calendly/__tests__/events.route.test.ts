import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAuthMock = vi.fn();
const createSupabaseServiceRoleClientMock = vi.fn();
const readCalendlyAccessTokenForProjectMock = vi.fn();
const fetchUpcomingEventsMock = vi.fn();

vi.mock('@/lib/api-auth', () => ({
  requireAuth: requireAuthMock,
}));

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: createSupabaseServiceRoleClientMock,
}));

vi.mock('@/lib/calendly-project-sync', () => ({
  readCalendlyAccessTokenForProject: readCalendlyAccessTokenForProjectMock,
}));

vi.mock('@/lib/calendly-events', () => ({
  fetchUpcomingEvents: fetchUpcomingEventsMock,
}));

describe('GET /api/calendly/events', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('reads upcoming events using the resolved Calendly token', async () => {
    requireAuthMock.mockResolvedValue({
      authenticated: true,
      userId: 'user-1',
      getToken: vi.fn(),
    });

    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'project-1',
        user_id: 'user-1',
        calendly_api_key_id: null,
        calendly_url: 'https://calendly.com/acme/intro-call',
      },
      error: null,
    });

    createSupabaseServiceRoleClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single,
          }),
        }),
      }),
    });

    readCalendlyAccessTokenForProjectMock.mockResolvedValue(
      'oauth-access-token'
    );
    fetchUpcomingEventsMock.mockResolvedValue([
      { uri: 'event-1', name: 'Intro call' },
    ]);

    const { GET } = await import('../events/route');
    const response = await GET({
      nextUrl: new URL(
        'http://localhost/api/calendly/events?projectId=project-1&days=14'
      ),
    } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      events: [{ uri: 'event-1', name: 'Intro call' }],
    });
    expect(readCalendlyAccessTokenForProjectMock).toHaveBeenCalledWith({
      supabase: expect.any(Object),
      projectId: 'project-1',
      userId: 'user-1',
    });
    expect(fetchUpcomingEventsMock).toHaveBeenCalledWith(
      'oauth-access-token',
      14
    );
  });

  it('returns 403 for projects not owned by the authenticated user', async () => {
    requireAuthMock.mockResolvedValue({
      authenticated: true,
      userId: 'user-1',
      getToken: vi.fn(),
    });

    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'project-1',
        user_id: 'other-user',
        calendly_api_key_id: null,
      },
      error: null,
    });

    createSupabaseServiceRoleClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single,
          }),
        }),
      }),
    });

    const { GET } = await import('../events/route');
    const response = await GET({
      nextUrl: new URL(
        'http://localhost/api/calendly/events?projectId=project-1'
      ),
    } as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });
});
