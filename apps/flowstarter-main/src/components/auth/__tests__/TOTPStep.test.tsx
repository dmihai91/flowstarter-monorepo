import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TOTPStep } from '../TOTPStep';

// ── Default props helper ────────────────────────────────────────────────────

function defaultProps(
  overrides: Partial<React.ComponentProps<typeof TOTPStep>> = {}
) {
  return {
    code: '',
    onCodeChange: vi.fn(),
    error: '',
    isLoading: false,
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    onBack: vi.fn(),
    t: (k: string) => k,
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('TOTPStep', () => {
  it('renders title and subtitle from t()', () => {
    render(<TOTPStep {...defaultProps()} />);
    expect(screen.getByText('team.login.twoFactorTitle')).toBeInTheDocument();
    expect(
      screen.getByText('team.login.twoFactorSubtitle')
    ).toBeInTheDocument();
  });

  it('renders code label from t()', () => {
    render(<TOTPStep {...defaultProps()} />);
    expect(screen.getByText('team.login.codeLabel')).toBeInTheDocument();
  });

  it('renders code input with maxLength 6', () => {
    render(<TOTPStep {...defaultProps()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '6');
  });

  it('renders submit button with verify text', () => {
    render(<TOTPStep {...defaultProps()} />);
    expect(
      screen.getByRole('button', { name: 'team.login.verify' })
    ).toBeInTheDocument();
  });

  it('renders submit button with verifying text when loading', () => {
    render(<TOTPStep {...defaultProps({ isLoading: true })} />);
    expect(
      screen.getByRole('button', { name: 'team.login.verifying' })
    ).toBeInTheDocument();
  });

  it('submit button is disabled when code length is not 6', () => {
    render(<TOTPStep {...defaultProps({ code: '123' })} />);
    const button = screen.getByRole('button', { name: 'team.login.verify' });
    expect(button).toBeDisabled();
  });

  it('submit button is enabled when code length is 6', () => {
    render(<TOTPStep {...defaultProps({ code: '123456' })} />);
    const button = screen.getByRole('button', { name: 'team.login.verify' });
    expect(button).not.toBeDisabled();
  });

  it('submit button is disabled when isLoading even with valid code', () => {
    render(<TOTPStep {...defaultProps({ code: '123456', isLoading: true })} />);
    const button = screen.getByRole('button', { name: 'team.login.verifying' });
    expect(button).toBeDisabled();
  });

  it('calls onSubmit on form submission', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(<TOTPStep {...defaultProps({ code: '123456', onSubmit })} />);
    const form = screen.getByRole('textbox').closest('form')!;
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<TOTPStep {...defaultProps({ onBack })} />);
    // The back button contains the arrow character + translation key
    const backButton = screen.getByText((content) =>
      content.includes('team.login.back')
    );
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('displays error message when error prop is set', () => {
    render(
      <TOTPStep {...defaultProps({ error: 'Invalid verification code' })} />
    );
    expect(screen.getByText('Invalid verification code')).toBeInTheDocument();
  });

  it('does not display error div when error is empty', () => {
    const { container } = render(<TOTPStep {...defaultProps({ error: '' })} />);
    expect(container.querySelector('.text-red-500')).not.toBeInTheDocument();
  });

  it('strips non-digit characters from input via onCodeChange', () => {
    const onCodeChange = vi.fn();
    render(<TOTPStep {...defaultProps({ onCodeChange })} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '12ab34' } });
    // The component calls onCodeChange(e.target.value.replace(/\D/g, ''))
    expect(onCodeChange).toHaveBeenCalledWith('1234');
  });

  it('passes only digits when input has all non-digits', () => {
    const onCodeChange = vi.fn();
    render(<TOTPStep {...defaultProps({ onCodeChange })} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abcdef' } });
    expect(onCodeChange).toHaveBeenCalledWith('');
  });

  it('sets input value from code prop', () => {
    render(<TOTPStep {...defaultProps({ code: '987654' })} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('987654');
  });
});
