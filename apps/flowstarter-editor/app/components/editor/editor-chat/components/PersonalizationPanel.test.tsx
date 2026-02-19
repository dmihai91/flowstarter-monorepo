/**
 * PersonalizationPanel Component Tests
 *
 * Tests the combined palette → font → logo step transitions
 * and callback behaviors.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PersonalizationPanel } from './PersonalizationPanel';
import type { ColorPalette, SystemFont } from '../types';

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

// Mock PaletteSelector
vi.mock('./PaletteSelector', () => ({
  PaletteSelector: ({ onSelect }: any) => (
    <div data-testid="palette-selector">
      <button
        data-testid="palette-option-ocean"
        onClick={() =>
          onSelect({
            id: 'ocean',
            name: 'Ocean',
            colors: ['#0ea5e9', '#06b6d4', '#3b82f6', '#0f172a'],
          })
        }
      >
        Ocean Palette
      </button>
    </div>
  ),
}));

// Mock FontSelector
vi.mock('./FontSelector', () => ({
  FontSelector: ({ onSelect }: any) => (
    <div data-testid="font-selector">
      <button
        data-testid="font-option-modern"
        onClick={() =>
          onSelect({
            id: 'modern',
            name: 'Modern',
            heading: 'Inter',
            body: 'Inter',
          })
        }
      >
        Modern Font
      </button>
    </div>
  ),
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
  const mockOnPaletteSelect = vi.fn();
  const mockOnFontSelect = vi.fn();
  const mockOnLogoSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Initial Render (Palette Section) ─────────────────────────────────────

  describe('initial render', () => {
    it('renders personalization panel', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          fontsLoaded={true}
          onPaletteSelect={mockOnPaletteSelect}
          onFontSelect={mockOnFontSelect}
          onLogoSelect={mockOnLogoSelect}
        />,
      );
      expect(screen.getByTestId('personalization-panel')).toBeTruthy();
    });

    it('starts on palette section', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          fontsLoaded={true}
          onPaletteSelect={mockOnPaletteSelect}
          onFontSelect={mockOnFontSelect}
          onLogoSelect={mockOnLogoSelect}
        />,
      );
      expect(screen.getByTestId('palette-section')).toBeTruthy();
      expect(screen.getByText('Choose Your Colors')).toBeTruthy();
    });

    it('renders palette selector', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          fontsLoaded={true}
          onPaletteSelect={mockOnPaletteSelect}
          onFontSelect={mockOnFontSelect}
          onLogoSelect={mockOnLogoSelect}
        />,
      );
      expect(screen.getByTestId('palette-selector')).toBeTruthy();
    });

    it('does not render font or logo sections initially', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          fontsLoaded={true}
          onPaletteSelect={mockOnPaletteSelect}
          onFontSelect={mockOnFontSelect}
          onLogoSelect={mockOnLogoSelect}
        />,
      );
      expect(screen.queryByTestId('font-section')).toBeNull();
      expect(screen.queryByTestId('logo-section')).toBeNull();
    });
  });

  // ─── Step Transitions ─────────────────────────────────────────────────────

  describe('step transitions', () => {
    it('transitions to font section after palette selection', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          fontsLoaded={true}
          onPaletteSelect={mockOnPaletteSelect}
          onFontSelect={mockOnFontSelect}
          onLogoSelect={mockOnLogoSelect}
        />,
      );

      // Select a palette
      fireEvent.click(screen.getByTestId('palette-option-ocean'));

      // Should transition to font section
      expect(screen.getByTestId('font-section')).toBeTruthy();
      expect(screen.getByText('Choose Your Fonts')).toBeTruthy();
      expect(screen.queryByTestId('palette-section')).toBeNull();
    });

    it('calls onPaletteSelect when palette is selected', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          fontsLoaded={true}
          onPaletteSelect={mockOnPaletteSelect}
          onFontSelect={mockOnFontSelect}
          onLogoSelect={mockOnLogoSelect}
        />,
      );

      fireEvent.click(screen.getByTestId('palette-option-ocean'));

      expect(mockOnPaletteSelect).toHaveBeenCalledTimes(1);
      expect(mockOnPaletteSelect).toHaveBeenCalledWith({
        id: 'ocean',
        name: 'Ocean',
        colors: ['#0ea5e9', '#06b6d4', '#3b82f6', '#0f172a'],
      });
    });

    it('transitions to logo section after font selection', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          fontsLoaded={true}
          onPaletteSelect={mockOnPaletteSelect}
          onFontSelect={mockOnFontSelect}
          onLogoSelect={mockOnLogoSelect}
        />,
      );

      // Select palette first
      fireEvent.click(screen.getByTestId('palette-option-ocean'));

      // Select font
      fireEvent.click(screen.getByTestId('font-option-modern'));

      // The font handler sets a 100ms timeout before switching to logo
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Should be on logo section
      expect(screen.getByTestId('logo-section')).toBeTruthy();
      expect(screen.getByText('Add Your Logo')).toBeTruthy();
    });

    it('calls onFontSelect when font is selected', () => {
      render(
        <PersonalizationPanel
          isDark={false}
          fontsLoaded={true}
          onPaletteSelect={mockOnPaletteSelect}
          onFontSelect={mockOnFontSelect}
          onLogoSelect={mockOnLogoSelect}
        />,
      );

      // Navigate to font section
      fireEvent.click(screen.getByTestId('palette-option-ocean'));

      // Select font
      fireEvent.click(screen.getByTestId('font-option-modern'));

      expect(mockOnFontSelect).toHaveBeenCalledTimes(1);
      expect(mockOnFontSelect).toHaveBeenCalledWith({
        id: 'modern',
        name: 'Modern',
        heading: 'Inter',
        body: 'Inter',
      });
    });
  });

  // ─── Logo Section ─────────────────────────────────────────────────────────

  describe('logo section', () => {
    const navigateToLogo = () => {
      const result = render(
        <PersonalizationPanel
          isDark={false}
          fontsLoaded={true}
          onPaletteSelect={mockOnPaletteSelect}
          onFontSelect={mockOnFontSelect}
          onLogoSelect={mockOnLogoSelect}
        />,
      );
      fireEvent.click(screen.getByTestId('palette-option-ocean'));
      fireEvent.click(screen.getByTestId('font-option-modern'));
      act(() => {
        vi.advanceTimersByTime(150);
      });
      return result;
    };

    it('shows skip button in logo section', () => {
      navigateToLogo();
      expect(screen.getByTestId('skip-logo-button')).toBeTruthy();
      expect(screen.getByText('Skip for Now')).toBeTruthy();
    });

    it('calls onLogoSelect with type "none" when skip is clicked', () => {
      navigateToLogo();
      fireEvent.click(screen.getByTestId('skip-logo-button'));
      expect(mockOnLogoSelect).toHaveBeenCalledTimes(1);
      // Second arg is useAiImages flag (false when skipping)
      expect(mockOnLogoSelect).toHaveBeenCalledWith({ type: 'none' }, false);
    });

    it('shows upload button', () => {
      navigateToLogo();
      expect(screen.getByText('Upload Logo')).toBeTruthy();
    });

    it('shows AI generation option', () => {
      navigateToLogo();
      // "Generate with AI" appears twice: as a label and as the button
      const aiElements = screen.getAllByText('Generate with AI');
      expect(aiElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Progress Indicator ───────────────────────────────────────────────────

  describe('progress indicator', () => {
    it('renders 3 progress bars', () => {
      const { container } = render(
        <PersonalizationPanel
          isDark={false}
          fontsLoaded={true}
          onPaletteSelect={mockOnPaletteSelect}
          onFontSelect={mockOnFontSelect}
          onLogoSelect={mockOnLogoSelect}
        />,
      );

      // The progress bars are the first div children of the panel
      const panel = container.querySelector('[data-testid="personalization-panel"]');
      const progressContainer = panel?.firstChild as HTMLElement;
      const bars = progressContainer?.children;
      expect(bars).toHaveLength(3);
    });
  });

  // ─── Dark Mode ────────────────────────────────────────────────────────────

  describe('dark mode', () => {
    it('renders without errors in dark mode', () => {
      render(
        <PersonalizationPanel
          isDark={true}
          fontsLoaded={true}
          onPaletteSelect={mockOnPaletteSelect}
          onFontSelect={mockOnFontSelect}
          onLogoSelect={mockOnLogoSelect}
        />,
      );
      expect(screen.getByTestId('personalization-panel')).toBeTruthy();
    });
  });
});
