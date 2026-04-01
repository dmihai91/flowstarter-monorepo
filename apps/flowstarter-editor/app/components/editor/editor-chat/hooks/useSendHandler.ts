/**
 * useSendHandler Hook
 *
 * Handles supported editor chat actions:
 * - pre-build review/customization guidance
 * - post-build site editing
 * - build-in-progress messaging
 */

import { useCallback } from 'react';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';
import type { UseBusinessInfoReturn } from './useBusinessInfo';
import type { AttachedImage } from '~/components/editor/editor-chat/types';
import { fileToBase64, getModificationRoute, applyChangesSimple, type ImageData } from './modification-api';

export interface UseSendHandlerProps {
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  businessHook: UseBusinessInfoReturn;
  currentUrlId: string | null;
  convexProjectId: string | null;
  workingDirectory?: string;
}

export interface UseSendHandlerReturn {
  handleSend: (attachedImages?: AttachedImage[]) => Promise<void>;
}

export function useSendHandler({
  messageHook,
  flowHook,
  currentUrlId,
  convexProjectId,
}: UseSendHandlerProps): UseSendHandlerReturn {
  const handleSend = useCallback(
    async (attachedImages?: AttachedImage[]) => {
      const inputValue = flowHook.inputValue;
      const images = attachedImages || [];
      const hasImages = images.length > 0;

      if (!inputValue.trim() && !hasImages) {
        return;
      }

      const userInput = inputValue.trim();
      flowHook.setInputValue('');

      const step = flowHook.step;

      if (step === 'ready' && currentUrlId && convexProjectId) {
        if (hasImages) {
          const imageText = images.length === 1 ? '1 image' : `${images.length} images`;
          messageHook.addUserMessage(
            userInput ? `${userInput}\n\n📎 Attached: ${imageText}` : `📎 Attached: ${imageText}`,
          );
        } else {
          messageHook.addUserMessage(userInput);
        }

        messageHook.addAssistantMessage(
          hasImages ? '🔄 Processing your images and applying changes...' : '🔄 Applying your changes...',
        );

        try {
          let imageData: ImageData[] | undefined;

          if (hasImages) {
            imageData = await Promise.all(images.map((img) => fileToBase64(img.file)));
          }

          let instruction = userInput;

          if (hasImages && !userInput) {
            instruction =
              'The user has attached images. Analyze them and ask where they should be used on the website.';
          } else if (hasImages) {
            instruction = `${userInput}\n\n[User has attached ${images.length} image(s) to use for this request]`;
          }

          const routeDecision = await getModificationRoute(instruction);
          messageHook.addAssistantMessage(`🛠️ ${routeDecision.reason}`);

          const result = await applyChangesSimple(instruction, convexProjectId, imageData);

          if (result.success) {
            let responseMsg = result.response || '✅ Changes applied successfully!';

            if (result.changes && result.changes.length > 0) {
              const changedFiles = result.changes.map((c) => `- ${c.path} (${c.operation})`).join('\n');
              responseMsg += `\n\n**Modified files:**\n${changedFiles}`;
            }

            responseMsg += '\n\n🔄 The preview will update automatically.';
            messageHook.addAssistantMessage(responseMsg);

            return;
          }

          if (result.error?.includes('API key') || result.error?.includes('ANTHROPIC')) {
            messageHook.addAssistantMessage(
              '⚠️ The AI modification feature requires an Anthropic API key to be configured.\n\n' +
                '**To enable this feature:**\n' +
                '1. Get an API key from [console.anthropic.com](https://console.anthropic.com)\n' +
                '2. Add `ANTHROPIC_API_KEY=your-key` to your environment\n' +
                '3. Restart the editor\n\n' +
                'In the meantime, you can use the **Editor** tab to modify files directly.',
            );
            return;
          }

          if (result.error?.includes('No files found')) {
            messageHook.addAssistantMessage(
              '⚠️ No files found for this project yet. Please wait for the initial build to complete, or try rebuilding the project.',
            );
            return;
          }

          messageHook.addAssistantMessage(
            `❌ Couldn't apply changes: ${result.error}\n\nYou can try editing the files directly in the Editor tab.`,
          );
        } catch (error) {
          messageHook.addAssistantMessage(
            `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try using the Editor tab instead.`,
          );
        }

        return;
      }

      if (step === 'creating') {
        messageHook.addUserMessage(userInput);
        messageHook.addAssistantMessage("Your site is being built right now. The preview will appear once it's ready.");

        return;
      }

      if (step === 'review' || step === 'personalization' || step === 'integrations') {
        messageHook.addUserMessage(userInput);

        const lowerInput = userInput.toLowerCase();

        if (
          lowerInput.includes('build') ||
          lowerInput.includes('create') ||
          lowerInput.includes('start') ||
          lowerInput.includes('ready')
        ) {
          messageHook.addAssistantMessage(
            step === 'review'
              ? "I'm ready to build. Use the review panel above to confirm the first build when you're set."
              : "Finish the selections above, then click the build button when you're set.",
          );
        } else {
          messageHook.addAssistantMessage(
            step === 'review'
              ? 'Review the project summary above. You can confirm the build or switch to customization before starting.'
              : 'Use the controls above to adjust the site before the first build.',
          );
        }

        return;
      }

      messageHook.addUserMessage(userInput);
      messageHook.addAssistantMessage(
        'This editor no longer starts projects on its own. Open the project from the team dashboard handoff flow, or use the controls above to continue.',
      );
    },
    [convexProjectId, currentUrlId, flowHook, messageHook],
  );

  return {
    handleSend,
  };
}
