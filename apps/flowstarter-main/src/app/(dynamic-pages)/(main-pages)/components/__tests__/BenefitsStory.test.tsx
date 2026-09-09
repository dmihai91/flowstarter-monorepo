import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BenefitsStory } from '../BenefitsStory';

type ObserverCallback = IntersectionObserverCallback;

describe('BenefitsStory', () => {
  let observerCallback: ObserverCallback | undefined;

  beforeEach(() => {
    class MockIntersectionObserver {
      constructor(callback: ObserverCallback) {
        observerCallback = callback;
      }

      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = '';
      thresholds = [];
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the team story fixed while the active benefit follows the reader', () => {
    const { container } = render(
      <BenefitsStory
        lead={{
          label: 'Specialists, not one generic bot',
          description: 'Each specialist handles the work they do best.',
        }}
        benefits={[
          {
            label: 'Services connected properly',
            description: 'Bookings and payments are tested.',
          },
          {
            label: 'Easy to find and easy to use',
            description: 'Fast, readable pages from the start.',
          },
          {
            label: 'A care agent after handoff',
            description: 'Support stays with the same team.',
          },
        ]}
      />
    );

    const benefits = Array.from(
      container.querySelectorAll<HTMLElement>('[data-benefit-index]')
    );
    expect(benefits).toHaveLength(3);
    expect(benefits[0]).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('In focus · 01 of 03')).toBeInTheDocument();

    act(() => {
      observerCallback?.(
        [
          {
            target: benefits[1],
            isIntersecting: true,
            intersectionRatio: 0.8,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    expect(benefits[1]).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('In focus · 02 of 03')).toBeInTheDocument();
  });
});
