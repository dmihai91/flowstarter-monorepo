/**
 * useQuickProfileHandlers Hook
 * 
 * Handles the quick-profile step in the streamlined onboarding flow.
 * Manages QuickProfile selection and transitions to template selection.
 */

import { useCallback } from 'react';
import type { QuickProfile } from '../types';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';
import type { UseTemplateSelectionReturn } from './useTemplateSelection';
import { getQuickProfileAckMessage } from './streamlined-onboarding';
import { inferBusinessInfo } from '~/lib/inference/auto-inference';
import { getTemplateSlugsForProfile } from '~/lib/templates/structural-templates';

interface UseQuickProfileHandlersOptions {
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  templateHook: UseTemplateSelectionReturn;
  onStateChange?: (state: Record<string, unknown>) => void;
}

export interface UseQuickProfileHandlersReturn {
  /** Handle completion of quick profile selection */
  handleQuickProfileComplete: (profile: QuickProfile) => Promise<void>;
  /** Get suggested profile based on description */
  getSuggestedProfile: () => Partial<QuickProfile>;
}

export function useQuickProfileHandlers({
  messageHook,
  flowHook,
  templateHook,
  onStateChange,
}: UseQuickProfileHandlersOptions): UseQuickProfileHandlersReturn {
  
  /**
   * Get suggested quick profile based on the user's description.
   * Uses auto-inference to pre-select likely options.
   */
  const getSuggestedProfile = useCallback((): Partial<QuickProfile> => {
    const description = flowHook.projectDescription;
    if (!description) {
      return {};
    }
    
    const inference = inferBusinessInfo(description);
    return inference.suggestedProfile;
  }, [flowHook.projectDescription]);

  /**
   * Handle when user completes the quick profile selection.
   * Transitions to template selection with recommended templates.
   */
  const handleQuickProfileComplete = useCallback(async (profile: QuickProfile) => {
    // Add user message summarizing their choices
    const choicesSummary = `Goal: ${profile.goal}, Pricing: ${profile.offerType}, Tone: ${profile.tone}`;
    messageHook.addUserMessage(choicesSummary);
    
    // Get the acknowledgment message
    const ackMessage = getQuickProfileAckMessage(profile);
    await messageHook.addAssistantMessage(ackMessage.content);
    
    // Update state with quick profile
    onStateChange?.({ 
      quickProfile: profile,
      step: 'template',
    });
    
    // Get recommended template slugs based on profile
    const recommendedSlugs = getTemplateSlugsForProfile(profile);
    console.log('[useQuickProfileHandlers] Recommended templates:', recommendedSlugs);
    
    // Fetch template recommendations
    // If we have business info, use the existing recommendation system
    // Otherwise, use profile-based recommendations
    const projectName = flowHook.projectName || 'My Site';
    const description = flowHook.projectDescription || '';
    
    // Build a minimal business info from quick profile for recommendations
    const minimalBusinessInfo = {
      description,
      quickProfile: profile,
      businessType: inferBusinessInfo(description).businessType?.type,
      targetAudience: inferBusinessInfo(description).targetAudience?.audience,
    };
    
    templateHook.fetchRecommendations(
      minimalBusinessInfo as any, // Cast to satisfy existing type
      projectName,
      description,
    );
    
    // Move to template step
    flowHook.setStep('template');
    
  }, [messageHook, flowHook, templateHook, onStateChange]);

  return {
    handleQuickProfileComplete,
    getSuggestedProfile,
  };
}

export type { UseQuickProfileHandlersOptions };
