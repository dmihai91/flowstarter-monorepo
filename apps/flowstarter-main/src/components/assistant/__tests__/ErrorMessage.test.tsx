import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorMessage } from '../ErrorMessage';
import userEvent from '@testing-library/user-event';

// Mock the translations
vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'error.generation.retrying': 'Retrying...',
        'error.generation.tryAgain': 'Try Again',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ErrorMessage', () => {
  it('should render error message', () => {
    render(<ErrorMessage message="Test error message" />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should render with retry button by default', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="Error" onRetry={onRetry} />);
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorMessage message="Error" onRetry={onRetry} />);

    await user.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should show retrying state when retrying is true', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="Error" onRetry={onRetry} retrying={true} />);
    expect(screen.getByText('Retrying...')).toBeInTheDocument();
  });

  it('should disable retry button when retrying', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="Error" onRetry={onRetry} retrying={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should not show retry button when showRetry is false', () => {
    const onRetry = vi.fn();
    render(
      <ErrorMessage message="Error" onRetry={onRetry} showRetry={false} />
    );
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('should not show retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Error" showRetry={true} />);
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ErrorMessage message="Error" className="custom-class" />
    );
    const errorDiv = container.firstChild;
    expect(errorDiv).toHaveClass('custom-class');
  });

  it('should render error icon', () => {
    const { container } = render(<ErrorMessage message="Error" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
