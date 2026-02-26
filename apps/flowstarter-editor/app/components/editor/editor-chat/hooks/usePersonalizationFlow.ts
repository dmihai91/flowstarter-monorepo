/**
 * usePersonalizationFlow Hook
 *
 * Handles personalization selection flow:
 * - handlePaletteSelect: Select color palette
 * - handleFontSelect: Select system font
 * - handleLogoSelect: Select logo and trigger build
 * - refreshSuggestions: Refresh suggested replies
 */

import { useCallback, useRef, useEffect } from 'react';
import { getRandomServicePrompts } from '../constants';

import type { ColorPalette, SystemFont, LogoInfo, InitialChatState } from '../types';
import type { useOnboardingMessages } from './useOnboardingMessages';
import type { useOnboardingFlow } from './useOnboardingFlow';
import type { usePaletteSelection } from './usePaletteSelection';

interface UsePersonalizationFlowProps {
  messageHook: ReturnType<typeof useOnboardingMessages>;
  flowHook: ReturnType<typeof useOnboardingFlow>;
  paletteHook: ReturnType<typeof usePaletteSelection>;
  selectedFont: SystemFont | null;
  setSelectedFont: (font: SystemFont | null) => void;
  setSelectedLogo: (logo: LogoInfo | null) => void;
  handlePersonalizationComplete: (
    font: SystemFont,
    logo: LogoInfo,
    useAiImages?: boolean,
  ) => Promise<void>;
  onStateChange?: (state: Partial<InitialChatState>) => void;
}

export function usePersonalizationFlow({
  messageHook,
  flowHook,
  paletteHook,
  selectedFont,
  setSelectedFont,
  setSelectedLogo,
  handlePersonalizationComplete,
  onStateChange,
}: UsePersonalizationFlowProps) {
  // Use ref to always have the latest font value (avoids stale closure in handleLogoSelect)
  const selectedFontRef = useRef<SystemFont | null>(selectedFont);
  useEffect(() => {
    selectedFontRef.current = selectedFont;
  }, [selectedFont]);

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
   * Handle logo selection
   * This is the final personalization step - triggers the build
   */
  const handleLogoSelect = useCallback(
    (logo: LogoInfo, useAiImages?: boolean) => {
      setSelectedLogo(logo);

      // Sync logo and AI images preference to state
      onStateChange?.({ selectedLogo: logo, useAiImages });

      /**
       * After logo is selected, we have all personalization done
       * Now trigger the build
       * Use ref to get latest font value (avoids stale closure issue)
       */
      const currentFont = selectedFontRef.current;
      if (currentFont) {
        handlePersonalizationComplete(currentFont, logo, useAiImages);
      } else {
        console.warn('Logo selected but no font selected yet - font ref is null');
      }
    },
    [setSelectedLogo, handlePersonalizationComplete, onStateChange],
  );

  /**
   * Refresh suggested replies based on current step
   */
  const refreshSuggestions = useCallback(() => {
    if (flowHook.step === 'welcome' || flowHook.step === 'describe') {
      messageHook.setSuggestedReplies(getRandomServicePrompts(5));
    }
  }, [flowHook.step, messageHook]);

  return {
    handlePaletteSelect,
    handleFontSelect,
    handleLogoSelect,
    refreshSuggestions,
  };
}
