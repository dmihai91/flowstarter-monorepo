import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ForgotPasswordSend, ForgotPasswordReset } from '../ForgotPasswordFlow';

// ── Helpers ─────────────────────────────────────────────────────────────────

const t = (k: string) => k;

function sendProps(
  overrides: Partial<React.ComponentProps<typeof ForgotPasswordSend>> = {}
) {
  return {
    email: '',
    onEmailChange: vi.fn(),
    error: '',
    isLoading: false,
    onSend: vi.fn(),
    onBack: vi.fn(),
    t,
    ...overrides,
  };
}

function resetProps(
  overrides: Partial<React.ComponentProps<typeof ForgotPasswordReset>> = {}
) {
  return {
    code: '',
    onCodeChange: vi.fn(),
    newPassword: '',
    onNewPasswordChange: vi.fn(),
    confirmPassword: '',
    onConfirmPasswordChange: vi.fn(),
    error: '',
    isLoading: false,
    onReset: vi.fn(),
    onResend: vi.fn(),
    onBack: vi.fn(),
    t,
    ...overrides,
  };
}

// ── ForgotPasswordSend ──────────────────────────────────────────────────────

describe('ForgotPasswordSend', () => {
  it('renders title and description', () => {
    render(<ForgotPasswordSend {...sendProps()} />);
    expect(screen.getByText('auth.forgotPassword.title')).toBeInTheDocument();
    expect(
      screen.getByText('auth.forgotPassword.description')
    ).toBeInTheDocument();
  });

  it('renders email input with label', () => {
    render(<ForgotPasswordSend {...sendProps()} />);
    expect(screen.getByText('auth.email')).toBeInTheDocument();
    const input = screen.getByLabelText('auth.email');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('sets email value from prop', () => {
    render(<ForgotPasswordSend {...sendProps({ email: 'user@test.com' })} />);
    expect(screen.getByLabelText('auth.email')).toHaveValue('user@test.com');
  });

  it('calls onEmailChange when typing', () => {
    const onEmailChange = vi.fn();
    render(<ForgotPasswordSend {...sendProps({ onEmailChange })} />);
    fireEvent.change(screen.getByLabelText('auth.email'), {
      target: { value: 'new@email.com' },
    });
    expect(onEmailChange).toHaveBeenCalledWith('new@email.com');
  });

  it('calls onSend when send button is clicked', () => {
    const onSend = vi.fn();
    render(<ForgotPasswordSend {...sendProps({ email: 'a@b.com', onSend })} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'auth.forgotPassword.sendCode' })
    );
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('send button is disabled when email is empty', () => {
    render(<ForgotPasswordSend {...sendProps({ email: '' })} />);
    expect(
      screen.getByRole('button', { name: 'auth.forgotPassword.sendCode' })
    ).toBeDisabled();
  });

  it('send button is disabled when loading', () => {
    render(
      <ForgotPasswordSend
        {...sendProps({ email: 'a@b.com', isLoading: true })}
      />
    );
    expect(
      screen.getByRole('button', { name: 'auth.forgotPassword.sendingCode' })
    ).toBeDisabled();
  });

  it('send button is enabled with email and not loading', () => {
    render(<ForgotPasswordSend {...sendProps({ email: 'a@b.com' })} />);
    expect(
      screen.getByRole('button', { name: 'auth.forgotPassword.sendCode' })
    ).not.toBeDisabled();
  });

  it('shows sending text when loading', () => {
    render(
      <ForgotPasswordSend
        {...sendProps({ email: 'a@b.com', isLoading: true })}
      />
    );
    expect(
      screen.getByText('auth.forgotPassword.sendingCode')
    ).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<ForgotPasswordSend {...sendProps({ onBack })} />);
    const backButton = screen.getByText((c) =>
      c.includes('auth.forgotPassword.backToSignIn')
    );
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('displays error when error prop is set', () => {
    render(<ForgotPasswordSend {...sendProps({ error: 'Email not found' })} />);
    expect(screen.getByText('Email not found')).toBeInTheDocument();
  });

  it('does not display error div when error is empty', () => {
    const { container } = render(<ForgotPasswordSend {...sendProps()} />);
    expect(container.querySelector('.text-red-400')).not.toBeInTheDocument();
  });
});

// ── ForgotPasswordReset ─────────────────────────────────────────────────────

describe('ForgotPasswordReset', () => {
  it('renders title and description', () => {
    render(<ForgotPasswordReset {...resetProps()} />);
    expect(screen.getByText('auth.forgotPassword.title')).toBeInTheDocument();
    expect(
      screen.getByText('auth.forgotPassword.description')
    ).toBeInTheDocument();
  });

  it('renders code input with label', () => {
    render(<ForgotPasswordReset {...resetProps()} />);
    expect(
      screen.getByText('auth.forgotPassword.enterCode')
    ).toBeInTheDocument();
    const codeInput = screen.getByLabelText('auth.forgotPassword.enterCode');
    expect(codeInput).toHaveAttribute('type', 'text');
    expect(codeInput).toHaveAttribute('inputMode', 'numeric');
  });

  it('renders new password input', () => {
    render(<ForgotPasswordReset {...resetProps()} />);
    expect(
      screen.getByText('auth.forgotPassword.newPassword')
    ).toBeInTheDocument();
    const pwInput = screen.getByLabelText('auth.forgotPassword.newPassword');
    expect(pwInput).toHaveAttribute('type', 'password');
  });

  it('renders confirm password input', () => {
    render(<ForgotPasswordReset {...resetProps()} />);
    expect(
      screen.getByText('auth.forgotPassword.confirmPassword')
    ).toBeInTheDocument();
    const confirmInput = screen.getByLabelText(
      'auth.forgotPassword.confirmPassword'
    );
    expect(confirmInput).toHaveAttribute('type', 'password');
  });

  it('calls onCodeChange when typing in code field', () => {
    const onCodeChange = vi.fn();
    render(<ForgotPasswordReset {...resetProps({ onCodeChange })} />);
    fireEvent.change(screen.getByLabelText('auth.forgotPassword.enterCode'), {
      target: { value: '123456' },
    });
    expect(onCodeChange).toHaveBeenCalledWith('123456');
  });

  it('calls onNewPasswordChange when typing in password field', () => {
    const onNewPasswordChange = vi.fn();
    render(<ForgotPasswordReset {...resetProps({ onNewPasswordChange })} />);
    fireEvent.change(screen.getByLabelText('auth.forgotPassword.newPassword'), {
      target: { value: 'secret123' },
    });
    expect(onNewPasswordChange).toHaveBeenCalledWith('secret123');
  });

  it('calls onConfirmPasswordChange when typing in confirm field', () => {
    const onConfirmPasswordChange = vi.fn();
    render(
      <ForgotPasswordReset {...resetProps({ onConfirmPasswordChange })} />
    );
    fireEvent.change(
      screen.getByLabelText('auth.forgotPassword.confirmPassword'),
      {
        target: { value: 'secret123' },
      }
    );
    expect(onConfirmPasswordChange).toHaveBeenCalledWith('secret123');
  });

  it('calls onReset when reset button is clicked', () => {
    const onReset = vi.fn();
    render(
      <ForgotPasswordReset
        {...resetProps({
          code: '123456',
          newPassword: 'pass1',
          confirmPassword: 'pass1',
          onReset,
        })}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'auth.forgotPassword.resetPassword' })
    );
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('reset button is disabled when fields are empty', () => {
    render(<ForgotPasswordReset {...resetProps()} />);
    expect(
      screen.getByRole('button', { name: 'auth.forgotPassword.resetPassword' })
    ).toBeDisabled();
  });

  it('reset button is disabled when code is missing', () => {
    render(
      <ForgotPasswordReset
        {...resetProps({
          code: '',
          newPassword: 'pass',
          confirmPassword: 'pass',
        })}
      />
    );
    expect(
      screen.getByRole('button', { name: 'auth.forgotPassword.resetPassword' })
    ).toBeDisabled();
  });

  it('reset button is disabled when isLoading', () => {
    render(
      <ForgotPasswordReset
        {...resetProps({
          code: '123456',
          newPassword: 'pass',
          confirmPassword: 'pass',
          isLoading: true,
        })}
      />
    );
    expect(
      screen.getByRole('button', {
        name: 'auth.forgotPassword.resettingPassword',
      })
    ).toBeDisabled();
  });

  it('reset button is enabled when all fields filled and not loading', () => {
    render(
      <ForgotPasswordReset
        {...resetProps({
          code: '123456',
          newPassword: 'pass',
          confirmPassword: 'pass',
        })}
      />
    );
    expect(
      screen.getByRole('button', { name: 'auth.forgotPassword.resetPassword' })
    ).not.toBeDisabled();
  });

  it('shows resetting text when loading', () => {
    render(
      <ForgotPasswordReset
        {...resetProps({
          code: '1',
          newPassword: 'p',
          confirmPassword: 'p',
          isLoading: true,
        })}
      />
    );
    expect(
      screen.getByText('auth.forgotPassword.resettingPassword')
    ).toBeInTheDocument();
  });

  it('calls onResend when resend button is clicked', () => {
    const onResend = vi.fn();
    render(<ForgotPasswordReset {...resetProps({ onResend })} />);
    fireEvent.click(screen.getByText('auth.forgotPassword.resendCode'));
    expect(onResend).toHaveBeenCalledTimes(1);
  });

  it('resend button is disabled when loading', () => {
    render(<ForgotPasswordReset {...resetProps({ isLoading: true })} />);
    const resendButton = screen.getByText('auth.forgotPassword.resendCode');
    expect(resendButton).toBeDisabled();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<ForgotPasswordReset {...resetProps({ onBack })} />);
    const backButton = screen.getByText((c) =>
      c.includes('auth.forgotPassword.backToSignIn')
    );
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('displays error when error prop is set', () => {
    render(<ForgotPasswordReset {...resetProps({ error: 'Code expired' })} />);
    expect(screen.getByText('Code expired')).toBeInTheDocument();
  });

  it('does not display error div when error is empty', () => {
    const { container } = render(<ForgotPasswordReset {...resetProps()} />);
    expect(container.querySelector('.text-red-400')).not.toBeInTheDocument();
  });
});
