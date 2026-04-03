/**
 * useFlowHandlers Hook
 *
 * Extracts flow-related handler callbacks from useEditorChatState,
 * including template selection, recommendation selection, review actions,
 * and no-op stubs.
 */

import { useCallback, type MutableRefObject } from 'react';
import type {
  UseOnboardingMessagesReturn,
  UseOnboardingFlowReturn,
  UseTemplateSelectionReturn,
  UsePaletteSelectionReturn,
} from '../types/sharedState';
import type { InitialChatState } from '../types';
import type { UseSimpleBuildHandlersReturn } from './simple-build-types';

interface UseFlowHandlersProps {
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  templateHook: UseTemplateSelectionReturn;
  paletteHook: UsePaletteSelectionReturn;
  onStateChange?: (state: Partial<InitialChatState>) => void;
  buildHandlers: UseSimpleBuildHandlersReturn;
  pendingSeededBuildRef: MutableRefObject<boolean>;
}

export function useFlowHandlers({
  messageHook,
  flowHook,
  templateHook,
  onStateChange,
  buildHandlers,
  pendingSeededBuildRef,
}: UseFlowHandlersProps) {
  const handleTemplateSelect = useCallback(
    async (template: import('~/components/onboarding').Template) => {
      templateHook.handleTemplateSelect(template);
      onStateChange?.({
        selectedTemplateId: template.id,
        selectedTemplateName: template.name,
      });
      messageHook.addUserMessage(`I'll keep the "${template.name}" template`);
      await messageHook.addStepTransitionMessage('review', 'personalization', {
        templateName: template.name,
      });
      flowHook.setStep('personalization');
    },
    [flowHook, messageHook, onStateChange, templateHook],
  );

  const handleRecommendationSelect = useCallback(
    async (recommendation: import('~/components/editor/template-preview/types').TemplateRecommendation) => {
      templateHook.handleRecommendationSelect(recommendation);
      onStateChange?.({
        selectedTemplateId: recommendation.template.id,
        selectedTemplateName: recommendation.template.name,
      });
      messageHook.addUserMessage(`I'll keep the "${recommendation.template.name}" template`);
      await messageHook.addStepTransitionMessage('review', 'personalization', {
        templateName: recommendation.template.name,
      });
      flowHook.setStep('personalization');
    },
    [flowHook, messageHook, onStateChange, templateHook],
  );

  const handleReviewBuildStart = useCallback(async () => {
    pendingSeededBuildRef.current = false;
    messageHook.addUserMessage('Build the first version with these selections');
    await buildHandlers.startSeededBuild();
  }, [buildHandlers, messageHook, pendingSeededBuildRef]);

  const handleReviewCustomize = useCallback(() => {
    messageHook.addUserMessage('I want to adjust the style before building');
    flowHook.setStep('personalization');
  }, [flowHook, messageHook]);

  const handleBusinessInfoConfirm = useCallback(async (_confirmed: boolean) => {}, []);
  const handleSuggestionAccept = useCallback(async () => {}, []);

  return {
    handleTemplateSelect,
    handleRecommendationSelect,
    handleReviewBuildStart,
    handleReviewCustomize,
    handleBusinessInfoConfirm,
    handleSuggestionAccept,
  };
}
