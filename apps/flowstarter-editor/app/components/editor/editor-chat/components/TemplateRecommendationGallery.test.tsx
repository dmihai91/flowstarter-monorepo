/**
 * TemplateRecommendationGallery Component Tests
 *
 * Tests rendering states: loading, error, empty, and with recommendations.
 * Tests card click → selection callback.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateRecommendationGallery } from './TemplateRecommendationGallery';
import type { TemplateRecommendation } from '~/components/editor/template-preview/types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
    img: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, style, ...rest } = props;
      return <img style={style} {...rest} />;
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock template utility functions
vi.mock('~/lib/config/templates', () => ({
  getTemplateThumbnailUrl: (id: string, theme: string) => `https://example.com/thumbnails/${id}-${theme}.png`,
}));

vi.mock('~/components/editor/editor-chat/constants', () => ({
  getCategoryColors: () => ({
    bg: '#4D5DD9',
    text: '#ffffff',
    gradient: 'from-[#4D5DD9]/40 to-[#C1C8FF]/30',
  }),
}));

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const MOCK_RECOMMENDATIONS: TemplateRecommendation[] = [
  {
    template: {
      id: 'fitness-coach',
      name: 'Fitness Coach',
      description: 'Perfect for personal trainers',
      thumbnail: 'https://example.com/fitness.png',
      category: 'local-business',
    },
    palettes: [
      {
        id: 'energy',
        name: 'Energy',
        colors: { primary: '#ef4444', secondary: '#f97316', accent: '#eab308', background: '#fff', text: '#000' },
      },
    ],
    fonts: [],
    reasoning: 'Great match for fitness coaching business',
    matchScore: 95,
  },
  {
    template: {
      id: 'consultant-pro',
      name: 'Consultant Pro',
      description: 'Professional consultant template',
      thumbnail: 'https://example.com/consultant.png',
      category: 'local-business',
    },
    palettes: [],
    fonts: [],
    reasoning: 'Good for service-based businesses',
    matchScore: 78,
  },
];

describe('TemplateRecommendationGallery', () => {
  const mockOnSelect = vi.fn();
  const mockOnPreview = vi.fn();
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Loading State ──────────────────────────────────────────────────────

  describe('loading state', () => {
    it('renders loading text when isLoading', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={[]}
          isLoading={true}
          error={null}
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      expect(screen.getByText('Finding the best templates for your business...')).toBeTruthy();
    });

    it('renders skeleton cards when loading', () => {
      const { container } = render(
        <TemplateRecommendationGallery
          recommendations={[]}
          isLoading={true}
          error={null}
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      // Should render a grid with skeleton cards
      const grid = container.querySelector('.grid');
      expect(grid).toBeTruthy();
    });
  });

  // ─── Error State ────────────────────────────────────────────────────────

  describe('error state', () => {
    it('renders error message', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={[]}
          isLoading={false}
          error="Network error"
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      expect(screen.getByText("Couldn't find recommendations")).toBeTruthy();
      expect(screen.getByText('Network error')).toBeTruthy();
    });

    it('renders retry button on error', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={[]}
          isLoading={false}
          error="Network error"
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeTruthy();
    });

    it('calls onRetry when retry button is clicked', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={[]}
          isLoading={false}
          error="Network error"
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      fireEvent.click(screen.getByText('Try Again'));
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Empty State ────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('renders empty message when no recommendations', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={[]}
          isLoading={false}
          error={null}
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      expect(screen.getByText('No matching templates found. Please try a different description.')).toBeTruthy();
    });
  });

  // ─── With Recommendations ─────────────────────────────────────────────────

  describe('with recommendations', () => {
    it('renders template cards', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={MOCK_RECOMMENDATIONS}
          isLoading={false}
          error={null}
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      expect(screen.getByText('Fitness Coach')).toBeTruthy();
      expect(screen.getByText('Consultant Pro')).toBeTruthy();
    });

    it('renders reasoning for each recommendation', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={MOCK_RECOMMENDATIONS}
          isLoading={false}
          error={null}
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      expect(screen.getByText('Great match for fitness coaching business')).toBeTruthy();
      expect(screen.getByText('Good for service-based businesses')).toBeTruthy();
    });

    it('renders gallery header with count', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={MOCK_RECOMMENDATIONS}
          isLoading={false}
          error={null}
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      expect(screen.getByText('Top 2 recommendations for your business')).toBeTruthy();
    });

    it('renders singular header for 1 recommendation', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={[MOCK_RECOMMENDATIONS[0]]}
          isLoading={false}
          error={null}
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      expect(screen.getByText('Best template for your business')).toBeTruthy();
    });

    it('renders template-card test IDs', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={MOCK_RECOMMENDATIONS}
          isLoading={false}
          error={null}
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      expect(screen.getByTestId('template-card-fitness-coach')).toBeTruthy();
      expect(screen.getByTestId('template-card-consultant-pro')).toBeTruthy();
    });

    it('calls onSelect when a template card is clicked', () => {
      vi.useFakeTimers();
      render(
        <TemplateRecommendationGallery
          recommendations={MOCK_RECOMMENDATIONS}
          isLoading={false}
          error={null}
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      fireEvent.click(screen.getByTestId('template-card-fitness-coach'));
      // onSelect is called after a 200ms delay
      vi.advanceTimersByTime(200);
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith(MOCK_RECOMMENDATIONS[0]);
      vi.useRealTimers();
    });

    it('renders palette preview colors when available', () => {
      const { container } = render(
        <TemplateRecommendationGallery
          recommendations={MOCK_RECOMMENDATIONS}
          isLoading={false}
          error={null}
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      // Palette preview circles should exist for the first recommendation
      const paletteCircles = container.querySelectorAll('[title="Energy"]');
      expect(paletteCircles.length).toBeGreaterThan(0);
    });

    it('renders category badges', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={MOCK_RECOMMENDATIONS}
          isLoading={false}
          error={null}
          isDark={false}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      // Category should be rendered with hyphens replaced by spaces
      const badges = screen.getAllByText('local business');
      expect(badges.length).toBe(2);
    });
  });

  // ─── Dark Mode ────────────────────────────────────────────────────────────

  describe('dark mode', () => {
    it('renders without errors in dark mode', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={MOCK_RECOMMENDATIONS}
          isLoading={false}
          error={null}
          isDark={true}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      expect(screen.getByText('Fitness Coach')).toBeTruthy();
    });

    it('renders loading state in dark mode', () => {
      render(
        <TemplateRecommendationGallery
          recommendations={[]}
          isLoading={true}
          error={null}
          isDark={true}
          onSelect={mockOnSelect}
          onPreview={mockOnPreview}
          onRetry={mockOnRetry}
        />,
      );
      expect(screen.getByText('Finding the best templates for your business...')).toBeTruthy();
    });
  });
});
