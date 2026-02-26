/**
 * useTemplateFlow Hook
 *
 * Handles template selection flow:
 * - handleTemplateSelect: Select a template directly
 * - handleRecommendationSelect: Select from AI recommendations
 * - fetchRecommendationsWrapped: Fetch recommendations using current state
 */

import { useCallback } from 'react';

import type { Template, BusinessInfo, InitialChatState } from '../types';
import type { TemplateRecommendation } from '~/components/editor/template-preview/types';
import type { useOnboardingMessages } from './useOnboardingMessages';
import type { useOnboardingFlow } from './useOnboardingFlow';
import type { useTemplateSelection } from './useTemplateSelection';
import type { useBusinessInfo } from './useBusinessInfo';

interface UseTemplateFlowProps {
  messageHook: ReturnType<typeof useOnboardingMessages>;
  flowHook: ReturnType<typeof useOnboardingFlow>;
  templateHook: ReturnType<typeof useTemplateSelection>;
  businessHook: ReturnType<typeof useBusinessInfo>;
  onStateChange?: (state: Partial<InitialChatState>) => void;
}

export function useTemplateFlow({
  messageHook,
  flowHook,
  templateHook,
  businessHook,
  onStateChange,
}: UseTemplateFlowProps) {
  /**
   * Handle direct template selection
   */
  const handleTemplateSelect = useCallback(
    async (template: Template) => {
      templateHook.handleTemplateSelect(template);

      // Sync template selection to Convex
      onStateChange?.({
        selectedTemplateId: template.id,
        selectedTemplateName: template.name,
      });
      messageHook.addUserMessage(`I'll use the "${template.name}" template`);

      // Use unified step transition message
      await messageHook.addStepTransitionMessage('template', 'personalization', {
        templateName: template.name,
      });

      // Move to personalization step (palette, font, logo)
      flowHook.setStep('personalization');
    },
    [templateHook, messageHook, flowHook, onStateChange],
  );

  /**
   * Handle selection from AI recommendations
   */
  const handleRecommendationSelect = useCallback(
    async (recommendation: TemplateRecommendation) => {
      templateHook.handleRecommendationSelect(recommendation);

      // Sync template selection to Convex
      onStateChange?.({
        selectedTemplateId: recommendation.template.id,
        selectedTemplateName: recommendation.template.name,
      });
      messageHook.addUserMessage(`I'll use the "${recommendation.template.name}" template`);

      // Use unified step transition message
      await messageHook.addStepTransitionMessage('template', 'personalization', {
        templateName: recommendation.template.name,
      });
      flowHook.setStep('personalization');
    },
    [templateHook, messageHook, flowHook, onStateChange],
  );

  /**
   * Wrapped fetchRecommendations that uses current state
   */
  const fetchRecommendationsWrapped = useCallback(() => {
    if (businessHook.businessInfo) {
      return templateHook.fetchRecommendations(
        businessHook.businessInfo,
        flowHook.projectName!,
        flowHook.projectDescription,
      );
    }

    return Promise.resolve();
  }, [
    businessHook.businessInfo,
    flowHook.projectName,
    flowHook.projectDescription,
    templateHook,
  ]);

  return {
    handleTemplateSelect,
    handleRecommendationSelect,
    fetchRecommendationsWrapped,
  };
}
