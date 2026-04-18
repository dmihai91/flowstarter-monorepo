import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@clerk/nextjs/legacy', () => ({
  useSignIn: () => ({
    signIn: {
      create: vi.fn(),
      attemptSecondFactor: vi.fn(),
      attemptFirstFactor: vi.fn(),
    },
    setActive: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@flowstarter/platform-config', () => ({
  isTrustedHost: () => false,
  isTeamEmail: () => false,
}));

vi.mock('../hooks', () => ({
  useClerkErrorHandler: () => ({
    handleError: vi.fn(() => 'error'),
  }),
  useEdgeBrowserDetection: () => false,
  useSocialAuth: () => ({
    isGoogleLoading: false,
    isAppleLoading: false,
    handleGoogleAuth: vi.fn(),
    handleAppleAuth: vi.fn(),
  }),
}));

vi.mock('../SocialAuth', () => ({
  SocialAuth: ({
    onGoogleClick,
    onAppleClick,
  }: {
    onGoogleClick: () => void;
    onAppleClick: () => void;
  }) => (
    <div data-testid="social-auth">
      <button onClick={onGoogleClick}>Google</button>
      <button onClick={onAppleClick}>Apple</button>
    </div>
  ),
}));

vi.mock('../TOTPStep', () => ({
  TOTPStep: () => <div data-testid="totp-step" />,
}));

vi.mock('../ForgotPasswordFlow', () => ({
  ForgotPasswordSend: () => <div data-testid="forgot-send" />,
  ForgotPasswordReset: () => <div data-testid="forgot-reset" />,
}));

import { LoginForm } from '../LoginForm';

// ── Tests ──────────────────────────────────────────────────────────────────

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password inputs', () => {
    render(<LoginForm variant="client" />);

    const emailInput = screen.getByRole('textbox');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');

    // password input does not have role=textbox, find by id
    const passwordInput = document.getElementById('password');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('renders submit button', () => {
    render(<LoginForm variant="client" />);

    // The submit button text comes from t() which returns the key
    const btn = screen.getByRole('button', { name: /auth\.signIn$/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('type', 'submit');
  });

  it('shows "forgot password" link', () => {
    render(<LoginForm variant="team" />);

    const forgotBtn = screen.getByText('auth.forgotPassword');
    expect(forgotBtn).toBeInTheDocument();
  });

  it('shows social auth for client variant', () => {
    render(<LoginForm variant="client" />);

    expect(screen.getByTestId('social-auth')).toBeInTheDocument();
  });

  it('does not show social auth for team variant', () => {
    render(<LoginForm variant="team" />);

    expect(screen.queryByTestId('social-auth')).not.toBeInTheDocument();
  });
});
