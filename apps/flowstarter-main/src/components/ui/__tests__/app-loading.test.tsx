import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { AppLoader, CardSkeleton } from '../app-loading';

describe('AppLoader', () => {
  describe('page variant (default)', () => {
    it('renders the design-system full-screen loading screen', () => {
      const { getByRole, getByText } = render(<AppLoader />);
      expect(getByRole('status')).toHaveAttribute('aria-busy', 'true');
      expect(getByText('Loading...')).toBeInTheDocument();
    });

    it('passes custom message to loading screen', () => {
      const { getByText } = render(<AppLoader message="Please wait" />);
      expect(getByText('Please wait')).toBeInTheDocument();
    });
  });

  describe('inline variant', () => {
    it('renders a compact spinner without min-height', () => {
      const { container } = render(<AppLoader variant="inline" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('py-8');
      expect(wrapper.className).not.toContain('min-h-[60vh]');
    });
  });
});

describe('CardSkeleton', () => {
  it('renders default 4 skeleton cards', () => {
    const { container } = render(<CardSkeleton />);
    const cards = container.querySelectorAll('.animate-pulse');
    expect(cards.length).toBe(4);
  });

  it('renders custom count of cards', () => {
    const { container } = render(<CardSkeleton count={2} />);
    const cards = container.querySelectorAll('.animate-pulse');
    expect(cards.length).toBe(2);
  });

  it('uses responsive grid layout', () => {
    const { container } = render(<CardSkeleton />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('sm:grid-cols-2');
  });

  it('cards have glassmorphic styling', () => {
    const { container } = render(<CardSkeleton count={1} />);
    const card = container.querySelector('.animate-pulse');
    expect(card?.className).toContain('rounded-');
    expect(card?.className).toContain('backdrop-blur');
  });
});
