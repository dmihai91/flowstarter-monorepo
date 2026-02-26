/**
 * useSyncCallbacks Hook
 *
 * Provides stable callback refs for syncing state changes to parent
 * and project sync service. These callbacks have stable identity
 * across renders to prevent infinite loops.
 */

import { useCallback, useRef } from 'react';
import {
  syncTemplateSelection,
  syncPaletteSelection,
  syncBusinessInfo as syncBusinessInfoToMain,
  hasHandoffConnection,
} from '~/lib/services/projectSyncService';

import type {
  OnboardingStep,
  BusinessInfo,
  Template,
  ColorPalette,
  InitialChatState,
} from '../types';

interface UseSyncCallbacksProps {
  onStateChange?: (state: Partial<InitialChatState>) => void;
}

export function useSyncCallbacks({ onStateChange }: UseSyncCallbacksProps) {
  // Store callbacks in refs to avoid re-creating hook options on every render
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  /**
   * Stable callback to notify parent of step changes
   */
  const handleStepChange = useCallback((newStep: OnboardingStep) => {
    onStateChangeRef.current?.({ step: newStep });
  }, []);

  /**
   * Sync template selection to main platform if connected
   */
  const handleTemplateSelectSync = useCallback((template: Template) => {
    if (hasHandoffConnection()) {
      syncTemplateSelection({
        id: template.id,
        name: template.name,
        slug: template.id,
      });
    }
  }, []);

  /**
   * Sync palette selection to main platform if connected
   */
  const handlePaletteSelectSync = useCallback((palette: ColorPalette) => {
    if (hasHandoffConnection()) {
      syncPaletteSelection({
        id: palette.id,
        name: palette.name,
        colors: {
          primary: palette.colors[0] || '#000000',
          secondary: palette.colors[1] || '#333333',
          accent: palette.colors[2] || '#666666',
          background: palette.colors[3] || '#ffffff',
          text: palette.colors[4] || '#000000',
        },
      });
    }
  }, []);

  /**
   * Sync business info to main platform if connected
   */
  const handleBusinessInfoConfirmSync = useCallback((info: BusinessInfo) => {
    if (hasHandoffConnection()) {
      syncBusinessInfoToMain({
        uvp: info.uvp || '',
        targetAudience: info.targetAudience || '',
        businessGoals: info.businessGoals || [],
        brandTone: info.brandTone || '',
        pricingOffers: info.pricingOffers,
      });
    }
  }, []);

  return {
    onStateChangeRef,
    handleStepChange,
    handleTemplateSelectSync,
    handlePaletteSelectSync,
    handleBusinessInfoConfirmSync,
  };
}
