/**
 * usePaletteSelection Hook
 *
 * Manages palette selection, preview, and custom color state.
 */

import { useState, useCallback } from 'react';
import type { Template } from '~/components/onboarding';
import type { TemplateRecommendation } from '~/components/editor/template-preview/types';
import type { ColorPalette } from '../types';
import type { UsePaletteSelectionOptions, UsePaletteSelectionReturn } from '../types/sharedState';
import { DEFAULT_PALETTE } from '~/lib/config/palettes';

export function usePaletteSelection(options: UsePaletteSelectionOptions = {}): UsePaletteSelectionReturn {
  const { initialPalette = null, onPaletteSelect } = options;

  // ─── State ────────────────────────────────────────────────────────────────
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(initialPalette);
  const [previewPalette, setPreviewPalette] = useState<ColorPalette | null>(null);
  const [templatePalette, setTemplatePalette] = useState<ColorPalette | null>(null);
  const [showCustomPalette, setShowCustomPalette] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]);

  // ─── Callbacks ────────────────────────────────────────────────────────────

  const handlePaletteSelect = useCallback(
    (palette: ColorPalette) => {
      setSelectedPalette(palette);
      onPaletteSelect?.(palette);
    },
    [onPaletteSelect],
  );

  /**
   * Update palette state when a template is selected.
   * Extracts the template's default palette if available.
   */
  const updateFromTemplate = useCallback((template: Template | null, recommendation: TemplateRecommendation | null) => {
    if (recommendation?.palettes?.[0]) {
      // Use first palette from recommendation
      const recPalette = recommendation.palettes[0];
      const ColorPalette: ColorPalette = {
        id: recPalette.id,
        name: recPalette.name,
        colors: [
          recPalette.colors.primary,
          recPalette.colors.secondary,
          recPalette.colors.accent,
          recPalette.colors.background,
          recPalette.colors.text,
        ],
      };
      setTemplatePalette(ColorPalette);
    } else if (template?.theme?.colors) {
      // Extract palette from template theme, using DEFAULT_PALETTE for fallbacks
      const themeColors = template.theme.colors;
      const ColorPalette: ColorPalette = {
        id: `${template.id}-theme`,
        name: `${template.name} Theme`,
        colors: [
          themeColors.primary || DEFAULT_PALETTE.colors.primary,
          themeColors.secondary || DEFAULT_PALETTE.colors.secondary,
          themeColors.accent || DEFAULT_PALETTE.colors.accent,
          themeColors.background || DEFAULT_PALETTE.colors.background,
          DEFAULT_PALETTE.colors.text, // text color not in theme
        ],
      };
      setTemplatePalette(ColorPalette);
    } else {
      setTemplatePalette(null);
    }
  }, []);

  return {
    // State
    selectedPalette,
    previewPalette,
    templatePalette,
    showCustomPalette,
    customColors,

    // Actions
    setSelectedPalette,
    setPreviewPalette,
    setShowCustomPalette,
    setCustomColors,
    handlePaletteSelect,
    updateFromTemplate,
  };
}

export type { UsePaletteSelectionOptions, UsePaletteSelectionReturn };

