import { describe, expect, it, vi, beforeEach } from 'vitest';

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: () => authMock(),
  clerkClient: vi.fn(),
  currentUser: vi.fn(),
}));

describe('requireTeamAuth', () => {
  beforeEach(() => {
    authMock.mockReset();
    vi.resetModules();
  });

  it('returns 401 when there is no Clerk user', async () => {
    authMock.mockResolvedValue({ userId: null });
    const { requireTeamAuth } = await import('../api-auth');
    const result = await requireTeamAuth();
    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(401);
    }
  });

  it('allows admin from session claims', async () => {
    authMock.mockResolvedValue({
      userId: 'user_admin',
      sessionClaims: { metadata: { role: 'admin' } },
      getToken: async () => null,
    });
    const { requireTeamAuth } = await import('../api-auth');
    const result = await requireTeamAuth();
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.userId).toBe('user_admin');
      expect(result.role).toBe('admin');
    }
  });

  it('returns 403 for authenticated users without team or admin role', async () => {
    authMock.mockResolvedValue({
      userId: 'user_client',
      sessionClaims: { metadata: { role: 'client' } },
      getToken: async () => null,
    });
    const { requireTeamAuth } = await import('../api-auth');
    const result = await requireTeamAuth();
    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(403);
    }
  });
});
