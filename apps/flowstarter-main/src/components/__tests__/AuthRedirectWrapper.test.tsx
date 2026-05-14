import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────────────

let mockUser: { isLoaded: boolean; isSignedIn: boolean } = {
  isLoaded: true,
  isSignedIn: false,
};

vi.mock('@clerk/nextjs', () => ({
  useUser: () => mockUser,
}));

const mockRouterPush = vi.fn();
let mockSearch = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => mockSearch,
}));

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({ t: (key: string) => key }),
}));

vi.mock('@flowstarter/flow-design-system', () => ({
  LoadingScreen: ({ message }: { message: string }) => (
    <div data-testid="loading-screen">{message}</div>
  ),
}));

vi.mock('@flowstarter/platform-config', () => ({
  isSafeRedirectUrl: () => true,
}));

import { AuthRedirectWrapper } from '../AuthRedirectWrapper';

// ── Helpers ────────────────────────────────────────────────────────────────

const originalLocation = window.location;
const setLocation = (href: string) => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: {
      ...originalLocation,
      href,
      hostname: new URL(href).hostname,
      assign: vi.fn(),
      replace: vi.fn(),
    },
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  mockRouterPush.mockReset();
  mockSearch = new URLSearchParams();
  mockUser = { isLoaded: true, isSignedIn: false };
  setLocation('http://localhost:3000/admin/login');
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: originalLocation,
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AuthRedirectWrapper', () => {
  it('renders children when the user is signed out', () => {
    mockUser = { isLoaded: true, isSignedIn: false };

    render(
      <AuthRedirectWrapper>
        <div data-testid="child">login form</div>
      </AuthRedirectWrapper>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
  });

  it('honours redirect_url for already-signed-in users on /admin/login', () => {
    mockUser = { isLoaded: true, isSignedIn: true };
    mockSearch = new URLSearchParams({
      redirect_url: 'http://localhost:5773/projects/abc',
    });

    render(
      <AuthRedirectWrapper>
        <div>login form</div>
      </AuthRedirectWrapper>
    );

    // Loading screen rendered while we wait for the 150ms timer.
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Same hostname (localhost <-> localhost) → plain redirect, no transfer-token.
    expect(window.location.href).toBe('http://localhost:5773/projects/abc');
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('falls back to /admin/dashboard when no redirect_url is present', () => {
    mockUser = { isLoaded: true, isSignedIn: true };
    mockSearch = new URLSearchParams();

    render(
      <AuthRedirectWrapper>
        <div>login form</div>
      </AuthRedirectWrapper>
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('does NOT auto-redirect when reason=not_admin, so the rejection UI can render', () => {
    mockUser = { isLoaded: true, isSignedIn: true };
    mockSearch = new URLSearchParams({ reason: 'not_admin' });

    render(
      <AuthRedirectWrapper>
        <div data-testid="child">rejection screen</div>
      </AuthRedirectWrapper>
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Children render (so TeamLoginPage can show its sign-out card),
    // and we never push the user to /admin/dashboard (would loop via middleware).
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
