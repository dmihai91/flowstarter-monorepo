// Main composite hook (public API - unchanged)
export { useEditorChatState, type PreviewSource } from './useEditorChatState';

// Existing hooks
export { useAttachments } from './useAttachments';
export { useFontsLoader } from './useFontsLoader';
export { useConvexSync, type UseConvexSyncProps, type ConversationState } from './useConvexSync';

// Core state hooks (for composition and testing)
export {
  useOnboardingMessages,
  type UseOnboardingMessagesOptions,
  type UseOnboardingMessagesReturn,
} from './useOnboardingMessages';
export { useOnboardingFlow, type UseOnboardingFlowOptions, type UseOnboardingFlowReturn } from './useOnboardingFlow';
export {
  useTemplateSelection,
  type UseTemplateSelectionOptions,
  type UseTemplateSelectionReturn,
} from './useTemplateSelection';
export {
  usePaletteSelection,
  type UsePaletteSelectionOptions,
  type UsePaletteSelectionReturn,
} from './usePaletteSelection';
export { useBusinessInfo, type UseBusinessInfoOptions, type UseBusinessInfoReturn } from './useBusinessInfo';
export { useFileSync, type UseFileSyncOptions, type UseFileSyncReturn } from './useFileSync';
export {
  useStatePersistence,
  type UseStatePersistenceOptions,
  type UseStatePersistenceReturn,
} from './useStatePersistence';

// NEW: Focused flow hooks (extracted from useEditorChatState v4)
export { useSyncCallbacks } from './useSyncCallbacks';
export { useAdditionalState, type PreviewSource as AdditionalPreviewSource } from './useAdditionalState';
export { useDescriptionFlow } from './useDescriptionFlow';
export { useTemplateFlow } from './useTemplateFlow';
export { usePersonalizationFlow } from './usePersonalizationFlow';
export { useBusinessFlow } from './useBusinessFlow';

// Handler hooks (extracted from useEditorChatState for better organization)
export { useBuildHandlers, type UseBuildHandlersProps, type UseBuildHandlersReturn } from './useBuildHandlers';
export { useSimpleBuildHandlers } from './useSimpleBuildHandlers';
export {
  useStateRestoration,
  type UseStateRestorationProps,
  type UseStateRestorationReturn,
} from './useStateRestoration';
export { useWelcomeInit, type UseWelcomeInitProps } from './useWelcomeInit';
export {
  useProjectNameHandlers,
  type UseProjectNameHandlersProps,
  type UseProjectNameHandlersReturn,
} from './useProjectNameHandlers';
export {
  useSuggestionHandlers,
  type UseSuggestionHandlersProps,
  type UseSuggestionHandlersReturn,
} from './useSuggestionHandlers';
export { useSendHandler, type UseSendHandlerProps, type UseSendHandlerReturn } from './useSendHandler';

// Setup hooks (agent, effects)
export { useAgentSetup, type UseAgentSetupProps, type UseAgentSetupReturn } from './useAgentSetup';
export { useChatEffects, type UseChatEffectsProps } from './useChatEffects';

// Pagination
export { useMessagePagination, type PaginatedMessage } from './useMessagePagination';

// NEW: Streamlined onboarding utilities
export {
  generateOnboardingResponse,
  getNextStepFromCurrent,
  getSuggestedQuickProfile,
  type OnboardingMessage,
  type OnboardingContext,
} from './streamlined-onboarding';

// NEW: Quick Profile handlers for streamlined flow
export {
  useQuickProfileHandlers,
  type UseQuickProfileHandlersOptions,
  type UseQuickProfileHandlersReturn,
} from './useQuickProfileHandlers';
