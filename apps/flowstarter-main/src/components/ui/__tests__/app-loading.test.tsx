import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLoader, CardSkeleton } from '../app-loading';

describe('AppLoader', () => {
  describe('page variant (default)', () => {
    it('renders a full-page centered spinner', () => {
      const { container } = render(<AppLoader />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('min-h-[60vh]');
      expect(wrapper.className).toContain('flex-1');
      expect(wrapper.className).toContain('items-center');
      expect(wrapper.className).toContain('justify-center');
    });

    it('renders spinning animation', () => {
      const { container } = render(<AppLoader />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
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
    expect(card?.className).toContain('rounded-2xl');
    expect(card?.className).toContain('backdrop-blur');
  });
});
