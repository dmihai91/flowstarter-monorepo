/**
 * PersonalizationPanel Component Tests
 *
 * Tests logo upload/generation/skip and dark mode.
 * Palette and font selection are now dashboard-only.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonalizationPanel } from './PersonalizationPanel';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock framer-motion
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
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Palette: () => <span data-testid="icon-palette">Palette</span>,
  Type: () => <span data-testid="icon-type">Type</span>,
  Upload: () => <span data-testid="icon-upload">Upload</span>,
  Sparkles: () => <span data-testid="icon-sparkles">Sparkles</span>,
  ArrowRight: () => <span data-testid="icon-arrow">→</span>,
  ChevronRight: () => <span data-testid="icon-chevron">›</span>,
  SkipForward: () => <span data-testid="icon-skip">Skip</span>,
  ImageIcon: () => <span data-testid="icon-image">Image</span>,
  Wand2: () => <span data-testid="icon-wand">Wand</span>,
}));

// Mock Convex — must be before any component import
vi.mock('~/convex/_generated/api', () => ({
  api: {
    logos: {
      generateUploadUrl: 'logos:generateUploadUrl',
      saveLogo: 'logos:saveLogo',
    },
  },
}));

// Mock Convex
vi.mock('convex/react', () => ({
  useMutation: () => vi.fn().mockResolvedValue('mock-url'),
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue('https://example.com/generated-logo.png'),
    isLoading: false,
    error: null,
  }),
}));

// Mock i18n
vi.mock('~/lib/i18n/editor-labels', () => ({
  EDITOR_LABEL_KEYS: {
    PERSONALIZE_COLORS: 'PERSONALIZE_COLORS',
    PERSONALIZE_FONTS: 'PERSONALIZE_FONTS',
    PERSONALIZE_LOGO: 'PERSONALIZE_LOGO',
    PERSONALIZE_UPLOADING: 'PERSONALIZE_UPLOADING',
    PERSONALIZE_UPLOAD_LOGO: 'PERSONALIZE_UPLOAD_LOGO',
    PERSONALIZE_LOGO_FORMATS: 'PERSONALIZE_LOGO_FORMATS',
    PERSONALIZE_GENERATE_AI: 'PERSONALIZE_GENERATE_AI',
    PERSONALIZE_AI_POWERED: 'PERSONALIZE_AI_POWERED',
    PERSONALIZE_LOGO_PLACEHOLDER: 'PERSONALIZE_LOGO_PLACEHOLDER',
    PERSONALIZE_GENERATING: 'PERSONALIZE_GENERATING',
    PERSONALIZE_SKIP: 'PERSONALIZE_SKIP',
  },
  t: (key: string) => {
    const labels: Record<string, string> = {
      PERSONALIZE_COLORS: 'Choose Your Colors',
      PERSONALIZE_FONTS: 'Choose Your Fonts',
      PERSONALIZE_LOGO: 'Add Your Logo',
      PERSONALIZE_UPLOADING: 'Uploading...',
      PERSONALIZE_UPLOAD_LOGO: 'Upload Logo',
      PERSONALIZE_LOGO_FORMATS: 'PNG, JPG, SVG — max 5MB',
      PERSONALIZE_GENERATE_AI: 'Generate with AI',
      PERSONALIZE_AI_POWERED: 'AI-powered logo generation',
      PERSONALIZE_LOGO_PLACEHOLDER: 'Describe your ideal logo...',
      PERSONALIZE_GENERATING: 'Generating...',
      PERSONALIZE_SKIP: 'Skip for Now',
    };
    return labels[key] || key;
  },
}));

describe('PersonalizationPanel', () => {
  const mockOnLogoSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Initial Render (Logo Section) ──────────────────────────────────────

  describe('initial render', () => {
    it('renders personalization panel', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          onLogoSelect={mockOnLogoSelect}
        />,
      );
      expect(screen.getByTestId('personalization-panel')).toBeTruthy();
    });

    it('shows logo section', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          onLogoSelect={mockOnLogoSelect}
        />,
      );
      expect(screen.getByTestId('logo-section')).toBeTruthy();
      expect(screen.getByText('Add Your Logo')).toBeTruthy();
    });
  });

  // ─── Logo Section ─────────────────────────────────────────────────────────

  describe('logo section', () => {
    it('shows skip button', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          onLogoSelect={mockOnLogoSelect}
        />,
      );
      expect(screen.getByTestId('skip-logo-button')).toBeTruthy();
      expect(screen.getByText('Skip for Now')).toBeTruthy();
    });

    it('calls onLogoSelect with type "none" when skip is clicked', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          onLogoSelect={mockOnLogoSelect}
        />,
      );
      fireEvent.click(screen.getByTestId('skip-logo-button'));
      expect(mockOnLogoSelect).toHaveBeenCalledTimes(1);

      // Second arg is useAiImages flag (false when skipping)
      expect(mockOnLogoSelect).toHaveBeenCalledWith({ type: 'none' }, false);
    });

    it('shows upload button', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          onLogoSelect={mockOnLogoSelect}
        />,
      );
      expect(screen.getByText('Upload Logo')).toBeTruthy();
    });

    it('shows AI generation option', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          onLogoSelect={mockOnLogoSelect}
        />,
      );

      // "Generate with AI" appears twice: as a label and as the button
      const aiElements = screen.getAllByText('Generate with AI');
      expect(aiElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Dark Mode ────────────────────────────────────────────────────────────

  describe('dark mode', () => {
    it('renders without errors in dark mode', () => {
      render(
        <PersonalizationPanel
          isDark={true}
          onLogoSelect={mockOnLogoSelect}
        />,
      );
      expect(screen.getByTestId('personalization-panel')).toBeTruthy();
    });
  });
});
