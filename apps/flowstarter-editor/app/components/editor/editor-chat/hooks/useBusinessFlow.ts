/**
 * useBusinessFlow Hook
 *
 * Handles business discovery flow integration:
 * - Business discovery handlers setup
 * - handleBusinessInfoConfirm: Confirm or reject business info summary
 */

import { useCallback } from 'react';
import {
  syncBusinessInfo as syncBusinessInfoToMain,
  hasHandoffConnection,
} from '~/lib/services/projectSyncService';
import { useBusinessDiscoveryHandlers } from './useBusinessDiscoveryHandlers';

import type { BusinessInfo, InitialChatState } from '../types';
import type { useOnboardingMessages } from './useOnboardingMessages';
import type { useOnboardingFlow } from './useOnboardingFlow';
import type { useBusinessInfo } from './useBusinessInfo';
import type { useTemplateSelection } from './useTemplateSelection';

interface UseBusinessFlowProps {
  messageHook: ReturnType<typeof useOnboardingMessages>;
  flowHook: ReturnType<typeof useOnboardingFlow>;
  businessHook: ReturnType<typeof useBusinessInfo>;
  templateHook: ReturnType<typeof useTemplateSelection>;
  onStateChange?: (state: Partial<InitialChatState>) => void;
}

export function useBusinessFlow({
  messageHook,
  flowHook,
  businessHook,
  templateHook,
  onStateChange,
}: UseBusinessFlowProps) {
  /**
   * Business Discovery Handlers (legacy flow)
   * Handles the multi-step business info collection
   */
  const businessDiscoveryHook = useBusinessDiscoveryHandlers({
    messageHook,
    flowHook,
    projectDescription: flowHook.projectDescription,
    onBusinessInfoComplete: useCallback(
      async (businessInfo: BusinessInfo) => {
        // Store business info
        businessHook.setBusinessInfo(businessInfo);

        // Sync with main platform if connected
        if (hasHandoffConnection()) {
          syncBusinessInfoToMain(businessInfo);
        }

        // Sync complete business info to Convex
        onStateChange?.({ businessInfo });

        // Use unified step transition message for moving to template selection
        await messageHook.addStepTransitionMessage('business-summary', 'template', {
          businessInfo,
        });
        flowHook.setStep('template');

        // Fetch AI-powered recommendations
        templateHook.fetchRecommendations(
          businessInfo,
          flowHook.projectName!,
          flowHook.projectDescription,
        );
      },
      [messageHook, flowHook, businessHook, templateHook, onStateChange],
    ),
    onStateChange,
  });

  /**
   * Handle business info summary confirmation
   * Delegates to the discovery hook's handleSummaryConfirmation which properly
   * assembles businessInfo from collected fields and triggers recommendations
   */
  const handleBusinessInfoConfirm = useCallback(
    async (confirmed: boolean) => {
      businessDiscoveryHook.handleSummaryConfirmation(
        confirmed,
        confirmed ? undefined : undefined,
      );
    },
    [businessDiscoveryHook],
  );

  return {
    businessDiscoveryHook,
    handleBusinessInfoConfirm,
  };
}
