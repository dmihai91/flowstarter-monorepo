/**
 * usePersonalizationFlow Hook
 *
 * Handles post-build palette/font selection (used by ColorSchemeDialog).
 * Logo selection and build triggering removed — build starts automatically.
 */

import { useCallback } from 'react';

import type { ColorPalette, SystemFont, InitialChatState } from '~/components/editor/editor-chat/types';

import type { usePaletteSelection } from './usePaletteSelection';

interface UsePersonalizationFlowProps {
  paletteHook: ReturnType<typeof usePaletteSelection>;
  setSelectedFont: (font: SystemFont | null) => void;
  onStateChange?: (state: Partial<InitialChatState>) => void;
}

export function usePersonalizationFlow({
  paletteHook,
  setSelectedFont,
  onStateChange,
}: UsePersonalizationFlowProps) {
  /**
   * Handle palette selection
   * Syncs customization data to Convex as it's selected
   */
  const handlePaletteSelect = useCallback(
    (palette: ColorPalette) => {
      paletteHook.handlePaletteSelect(palette);

      // Sync palette to Convex
      onStateChange?.({ selectedPalette: palette });
    },
    [paletteHook, onStateChange],
  );

  /**
   * Handle font selection
   * Syncs font to Convex
   */
  const handleFontSelect = useCallback(
    (font: SystemFont) => {
      setSelectedFont(font);

      // Sync font to Convex
      onStateChange?.({ selectedFont: font });
    },
    [setSelectedFont, onStateChange],
  );

  /**
   * Refresh suggested replies based on current step
   */
  const refreshSuggestions = useCallback(() => {
    // No-op: suggestions only applied during build phases
  }, []);

  return {
    handlePaletteSelect,
    handleFontSelect,
    refreshSuggestions,
  };
}
