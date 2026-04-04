/**
 * useFlowHandlers Hook
 *
 * Extracts flow-related handler callbacks from useEditorChatState.
 * Simplified: review/personalization/integrations steps removed.
 * Template and recommendation selection now go straight to building.
 */

import { useCallback, type MutableRefObject } from 'react';
import type {
  UseOnboardingMessagesReturn,
  UseOnboardingFlowReturn,
  UseTemplateSelectionReturn,
  UsePaletteSelectionReturn,
} from '~/components/editor/editor-chat/types/sharedState';
import type { InitialChatState } from '~/components/editor/editor-chat/types';
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
      messageHook.addUserMessage(`I'll use the "${template.name}" template`);
    },
    [messageHook, onStateChange, templateHook],
  );

  const handleRecommendationSelect = useCallback(
    async (recommendation: import('~/components/editor/template-preview/types').TemplateRecommendation) => {
      templateHook.handleRecommendationSelect(recommendation);
      onStateChange?.({
        selectedTemplateId: recommendation.template.id,
        selectedTemplateName: recommendation.template.name,
      });
      messageHook.addUserMessage(`I'll use the "${recommendation.template.name}" template`);
    },
    [messageHook, onStateChange, templateHook],
  );

  const handleReviewBuildStart = useCallback(async () => {
    pendingSeededBuildRef.current = false;
    messageHook.addUserMessage('Build the first version with these selections');
    await buildHandlers.startSeededBuild();
  }, [buildHandlers, messageHook, pendingSeededBuildRef]);

  const handleBusinessInfoConfirm = useCallback(async (_confirmed: boolean) => {}, []);
  const handleSuggestionAccept = useCallback(async () => {}, []);

  return {
    handleTemplateSelect,
    handleRecommendationSelect,
    handleReviewBuildStart,
    handleBusinessInfoConfirm,
    handleSuggestionAccept,
  };
}
