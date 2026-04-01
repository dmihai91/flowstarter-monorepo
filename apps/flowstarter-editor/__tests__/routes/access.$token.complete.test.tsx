import { render, screen, waitFor } from '@testing-library/react';
import { useMutation } from 'convex/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MagicLinkComplete from '../../app/routes/access.$token.complete';

const navigateMock = vi.fn();
const completeAccessMock = vi.fn();

vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
}));

vi.mock('@remix-run/react', () => ({
  useParams: vi.fn(() => ({ token: 'magic-token' })),
  useNavigate: vi.fn(() => navigateMock),
  useSearchParams: vi.fn(() => [new URLSearchParams('handoff=handoff-token')]),
}));

vi.mock('remix-utils/client-only', () => ({
  ClientOnly: ({ children }: { children: () => any }) => children(),
}));

describe('MagicLinkComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      configurable: true,
    });
    globalThis.fetch = vi.fn();

    vi.mocked(useMutation).mockReturnValue(completeAccessMock);
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        userId: 'clerk_123',
        user: { signupMethod: 'google' },
      }),
    } as Response);
    completeAccessMock.mockResolvedValue({
      success: true,
      sessionToken: 'session-token',
      clientId: 'client_123',
      projectId: 'project_123',
      projectUrlId: 'client-site',
    });
  });

  it('stores the client session details and redirects to the client editor', async () => {
    render(<MagicLinkComplete />);

    await waitFor(() => {
      expect(completeAccessMock).toHaveBeenCalledWith({
        token: 'magic-token',
        clerkUserId: 'clerk_123',
        signupMethod: 'google',
      });
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('flowstarter_mode', 'client');
    expect(localStorage.setItem).toHaveBeenCalledWith('flowstarter_client_id', 'client_123');
    expect(localStorage.setItem).toHaveBeenCalledWith('flowstarter_project_id', 'project_123');
    expect(localStorage.setItem).toHaveBeenCalledWith('flowstarter_project_url_id', 'client-site');
    expect(localStorage.setItem).toHaveBeenCalledWith('flowstarter_client_session_token', 'session-token');
    expect(navigateMock).toHaveBeenCalledWith('/client/project/client-site');
  });

  it('shows an error when the handoff request cannot produce a Clerk user id', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(<MagicLinkComplete />);

    await waitFor(() => {
      expect(screen.getByText('Setup Failed')).toBeTruthy();
    });

    expect(screen.getByText('Please complete the signup process')).toBeTruthy();
    expect(completeAccessMock).not.toHaveBeenCalled();
  });
});
