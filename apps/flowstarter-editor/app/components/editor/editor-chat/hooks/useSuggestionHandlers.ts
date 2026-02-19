/**
 * useSuggestionHandlers Hook
 *
 * Handles suggestion/quick reply interactions.
 */

import { useCallback } from 'react';
import { hasHandoffConnection, syncProjectToMainPlatform } from '~/lib/services/projectSyncService';
import { formatErrorForUser, BUSINESS_INFO_ERRORS } from '../errors';
import { SUGGESTED_REPLIES, MESSAGE_KEYS, getMessage } from '../constants';
import type { SuggestedReply, InitialChatState } from '../types';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';
import type { UseBusinessInfoReturn } from './useBusinessInfo';

interface UseSuggestionHandlersProps {
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  businessHook: UseBusinessInfoReturn;
  lastAction: { type: string; payload?: unknown } | null;
  setLastAction?: (action: { type: string; payload?: unknown } | null) => void;
  handleDescriptionSubmit: (description: string) => Promise<void>;
  handleNameSubmit: (name: string) => Promise<void>;
  generateProjectName: (description: string) => Promise<string>;
  handleBusinessInfoConfirm: (confirmed: boolean) => Promise<void>;
  onStateChange?: (state: Partial<InitialChatState>) => void;
}

interface UseSuggestionHandlersReturn {
  handleSuggestionAccept: (suggestion: SuggestedReply) => Promise<void>;
}

export function useSuggestionHandlers({
  messageHook,
  flowHook,
  businessHook,
  lastAction,
  setLastAction,
  handleDescriptionSubmit,
  handleNameSubmit,
  generateProjectName,
  handleBusinessInfoConfirm,
  onStateChange,
}: UseSuggestionHandlersProps): UseSuggestionHandlersReturn {
  const handleSuggestionAccept = useCallback(
    async (suggestion: SuggestedReply) => {
      const step = flowHook.step;

      // STREAMLINED FLOW: Welcome step - example prompts submit as descriptions directly
      if (step === 'welcome') {
        // All example prompts go directly to describe flow
        if (suggestion.id.startsWith('example-')) {
          handleDescriptionSubmit(suggestion.text);
          return;
        }
      }
      
      // Describe step: Submit description and go to quick-profile
      if (step === 'describe') {
        handleDescriptionSubmit(suggestion.text);
        return;
      }
      
      // UVP step: Handle UVP suggestions
      if (step === 'business-uvp') {
        if (suggestion.id === 'uvp-skip') {
          // Skip UVP - handled by parent component
          messageHook.addUserMessage(suggestion.text);
          return;
        }
        // UVP prompts - user should type their own
        messageHook.addUserMessage(suggestion.text);
        messageHook.setSuggestedReplies([]);
        setTimeout(() => {
          messageHook.addAssistantMessage(
            'Great! Now tell me more about that. What specifically makes your approach unique?'
          );
        }, 300);
        return;
      }
      
      if (step === 'name') {
        if (suggestion.id === 'generate-name') {
          // User wants AI to suggest a name - call generateProjectName directly
          messageHook.addUserMessage('Suggest a name');
          messageHook.setSuggestedReplies([]);

          try {
            messageHook.setIsTyping(true);

            const generatedName = await generateProjectName(flowHook.projectDescription || '');
            messageHook.setIsTyping(false);

            flowHook.setProjectName(generatedName);
            flowHook.setLastSuggestedName(generatedName);
            onStateChange?.({ projectName: generatedName });

            // Show the generated name and let user accept or refine it
            messageHook.addAssistantMessage(
              `How about **${generatedName}**? You can use this name, ask me to refine it, or type your own.`,
            );
            messageHook.setSuggestedReplies(SUGGESTED_REPLIES.nameRefinement());
          } catch (error) {
            console.error('[useSuggestionHandlers] Failed to generate name:', error);
            messageHook.setIsTyping(false);
            messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.NAME_GENERATION_ERROR));
            messageHook.setSuggestedReplies(SUGGESTED_REPLIES.nameRefinementError());
          }
        } else if (suggestion.id === 'accept-name') {
          // Directly accept the name and proceed to business discovery
          const nameToUse = flowHook.lastSuggestedName || flowHook.projectName!;
          messageHook.addUserMessage(`Use "${nameToUse}"`);
          messageHook.setSuggestedReplies([]);

          // Set the name in state
          flowHook.setProjectName(nameToUse);
          onStateChange?.({ projectName: nameToUse });

          // Sync to main platform
          if (hasHandoffConnection()) {
            syncProjectToMainPlatform({
              name: nameToUse,
              description: flowHook.projectDescription || '',
              onboardingStep: 'quick-profile',
            });
          }

          // Use unified step transition message (ONE message that acknowledges name + asks UVP)
          await messageHook.addStepTransitionMessage('name', 'quick-profile', { projectName: nameToUse });
          flowHook.setStep('quick-profile');
        } else if (suggestion.id === 'more-punchy') {
          handleNameSubmit('Make it more punchy and impactful');
        } else if (suggestion.id === 'more-creative') {
          handleNameSubmit('Make it more creative and unique');
        } else if (suggestion.id === 'more-professional') {
          handleNameSubmit('Make it more professional and business-like');
        } else if (suggestion.id === 'shorter') {
          handleNameSubmit('Make it shorter, just 1-2 words');
        } else if (suggestion.id === 'try-another') {
          handleNameSubmit('Try a completely different name');
        } else if (suggestion.id === 'own-name') {
          messageHook.addUserMessage('I have my own name');
          messageHook.setSuggestedReplies([]);

          // Mark that we are waiting for a manual name input
          setLastAction?.({ type: 'awaiting-manual-name' });
          setTimeout(() => {
            messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.NAME_PROMPT_MANUAL));
          }, 300);
        } else if (suggestion.id === 'retry') {
          if (lastAction?.type === 'name-input' && lastAction.payload) {
            messageHook.addUserMessage('Retrying...');
            messageHook.setSuggestedReplies([]);
            handleNameSubmit(lastAction.payload as string);
          }
        } else if (suggestion.id === 'skip-business-info') {
          messageHook.addUserMessage('Skip and continue');
          messageHook.setSuggestedReplies([]);
          messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.NAME_SKIP_BUSINESS));
          flowHook.setStep('template');
        } else {
          messageHook.addUserMessage(suggestion.text);
          messageHook.setSuggestedReplies([]);
          setTimeout(() => {
            messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.NAME_TYPE_BELOW));
          }, 300);
        }
      } else if (step === 'business-summary') {
        // Handle business summary confirmation
        if (suggestion.id === 'confirm-summary') {
          handleBusinessInfoConfirm(true);
        } else if (suggestion.id === 'edit-summary') {
          handleBusinessInfoConfirm(false);
        } else {
          messageHook.addUserMessage(suggestion.text);
        }
      } else {
        messageHook.addUserMessage(suggestion.text);
        setTimeout(() => {
          messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.READY_TELL_MORE));
        }, 500);
      }
    },
    [
      flowHook,
      messageHook,
      businessHook,
      lastAction,
      handleDescriptionSubmit,
      handleNameSubmit,
      generateProjectName,
      handleBusinessInfoConfirm,
      onStateChange,
    ],
  );

  return {
    handleSuggestionAccept,
  };
}

export type { UseSuggestionHandlersProps, UseSuggestionHandlersReturn };

