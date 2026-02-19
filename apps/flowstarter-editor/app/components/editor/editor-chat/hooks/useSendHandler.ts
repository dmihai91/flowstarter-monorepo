/**
 * useSendHandler Hook
 *
 * Handles the main chat send functionality for different flow steps.
 * Supports image attachments for the 'ready' step.
 * 
 * NOTE: Uses Convex as source of truth for file state.
 * Daytona/workingDirectory is only used for preview, not modification.
 */

import { useCallback } from 'react';
import { getRandomServicePrompts, MESSAGE_KEYS, getMessage } from '../constants';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';
import type { UseBusinessInfoReturn } from './useBusinessInfo';
import type { UseBusinessDiscoveryHandlersReturn } from './useBusinessDiscoveryHandlers';
import type { AttachedImage } from '../types';

interface UseSendHandlerProps {
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  businessHook: UseBusinessInfoReturn;
  businessDiscoveryHook?: UseBusinessDiscoveryHandlersReturn;
  currentUrlId: string | null;
  convexProjectId: string | null;
  workingDirectory?: string;
  handleDescriptionSubmit: (description: string) => Promise<void>;
  handleNameSubmit: (name: string) => Promise<void>;
}

interface UseSendHandlerReturn {
  /** 
   * Main send handler. Pass attachedImages from useAttachments hook.
   * Images will be converted to base64 and sent to the modification API.
   */
  handleSend: (attachedImages?: AttachedImage[]) => Promise<void>;
}

interface ImageData {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  filename: string;
}

/**
 * Convert File to base64 data
 */
async function fileToBase64(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
      const mediaType = file.type as ImageData['mediaType'];
      resolve({
        base64,
        mediaType: mediaType || 'image/png',
        filename: file.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Route decision from the modification router
 */
interface RouteDecision {
  route: 'simple' | 'gretly';
  confidence: number;
  reason: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
}

/**
 * Get routing decision for a modification request
 */
async function getModificationRoute(instruction: string): Promise<RouteDecision> {
  try {
    const response = await fetch('/api/modification-router', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction }),
    });

    const data = await response.json();
    
    if (data.success && data.decision) {
      return data.decision;
    }
  } catch (error) {
    console.warn('[useSendHandler] Router failed, defaulting to simple:', error);
  }

  // Default to simple if router fails
  return {
    route: 'simple',
    confidence: 0.5,
    reason: 'Router fallback',
    estimatedComplexity: 'medium',
  };
}

/**
 * Apply changes using Convex-based modification API (simple route)
 * This uses Convex as the source of truth, not Daytona filesystem
 */
async function applyChangesSimple(
  instruction: string,
  projectId: string,
  images?: ImageData[],
): Promise<{ success: boolean; response?: string; error?: string; changes?: Array<{ path: string; operation: string }> }> {
  try {
    const response = await fetch('/api/modify-site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'modify',
        projectId,
        instruction,
        images,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { 
        success: false, 
        error: data.error || 'Failed to apply changes' 
      };
    }

    return {
      success: true,
      response: data.message,
      changes: data.changes,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply changes using Gretly multi-agent pipeline (complex route)
 * Uses full orchestration: Planner → Generator → Fixer via FlowOps
 */
async function applyChangesGretly(
  instruction: string,
  projectId: string,
  currentFiles: Record<string, string>,
  images?: ImageData[],
  onProgress?: (message: string) => void,
): Promise<{ success: boolean; response?: string; error?: string; changes?: Array<{ path: string; operation: string }> }> {
  try {
    const response = await fetch('/api/gretly-modify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        instruction,
        currentFiles,
        images,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Gretly modification failed' };
    }

    // Handle SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, error: 'No response stream' };
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let success = false;
    let responseText = '';
    let changes: Array<{ path: string; operation: string }> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'phase' || data.type === 'progress') {
            onProgress?.(data.message || data.phase);
          } else if (data.type === 'complete') {
            success = data.result?.success;
            responseText = data.result?.summary || 'Changes applied via Gretly';
            changes = data.result?.modifiedFiles?.map((f: string) => ({ path: f, operation: 'update' })) || [];
          } else if (data.type === 'error') {
            return { success: false, error: data.error };
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    }

    return { success, response: responseText, changes };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Legacy: Call the old agent-code API (Daytona-based)
 * Kept for fallback if needed
 */
async function applyChangesWithAgent(
  instruction: string,
  workingDirectory: string,
  images?: ImageData[],
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const response = await fetch('/api/agent-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'apply-changes',
        instruction,
        targetFiles: [],
        workingDirectory,
        images,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      return { success: false, error: errorData.error || 'Failed to apply changes' };
    }

    // Handle SSE stream and collect the response
    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, error: 'No response stream' };
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let success = false;
    let responseText = '';
    let errorText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        const eventMatch = line.match(/^event: (\w+)/);
        const dataMatch = line.match(/^data: (.+)$/m);

        if (eventMatch && dataMatch) {
          const event = eventMatch[1];
          try {
            const data = JSON.parse(dataMatch[1]);

            switch (event) {
              case 'message':
                responseText += data.text + '\n';
                break;
              case 'result':
                success = data.success;
                if (data.response) {
                  responseText += data.response;
                }
                break;
              case 'error':
                errorText = data.error;
                break;
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      }
    }

    if (errorText) {
      return { success: false, error: errorText };
    }

    return { success, response: responseText };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function useSendHandler({
  messageHook,
  flowHook,
  businessHook,
  businessDiscoveryHook,
  currentUrlId,
  convexProjectId,
  workingDirectory,
  handleDescriptionSubmit,
  handleNameSubmit,
}: UseSendHandlerProps): UseSendHandlerReturn {
  
  const handleSend = useCallback(async (attachedImages?: AttachedImage[]) => {
    const inputValue = flowHook.inputValue;
    const images = attachedImages || [];
    const hasImages = images.length > 0;

    // Allow send with just images (no text required)
    if (!inputValue.trim() && !hasImages) {
      return;
    }

    const userInput = inputValue.trim();
    flowHook.setInputValue('');

    const step = flowHook.step;

    // Route to appropriate handler based on step
    if (step === 'describe' || step === 'welcome') {
      handleDescriptionSubmit(userInput);
    } else if (step === 'name') {
      handleNameSubmit(userInput);
    }
    // Quick profile step - guide user to use the UI
    else if (step === 'quick-profile') {
      messageHook.addUserMessage(userInput);
      messageHook.addAssistantMessage(
        "Use the options above to select your **goal**, **pricing model**, and **brand tone**. " +
        "These 3 quick choices help me build a site that matches your business.\n\n" +
        "Once you've made your selections, click **Continue** to proceed!"
      );
    }
    // Business discovery steps
    else if (
      step === 'business-uvp' ||
      step === 'business-audience' ||
      step === 'business-goals' ||
      step === 'business-tone' ||
      step === 'business-selling' ||
      step === 'business-pricing'
    ) {
      if (businessDiscoveryHook) {
        await businessDiscoveryHook.handleBusinessAnswer(step, userInput);
      }
    }
    // Business summary step - use LLM to detect intent (supports any language)
    else if (step === 'business-summary') {
      messageHook.setIsTyping(true);
      
      let isConfirmation = false;
      try {
        const response = await fetch('/api/onboarding-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'detect-intent',
            userInput,
            intentContext: 'summary-confirmation',
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          isConfirmation = result.intent === 'confirm';
          console.log(`[business-summary] LLM detected intent: ${result.intent} (confidence: ${result.confidence})`);
        }
      } catch (error) {
        console.warn('[business-summary] LLM intent detection failed, using fallback:', error);
        // Fallback to simple check
        const lower = userInput.toLowerCase();
        isConfirmation = lower.includes('good') || lower.includes('ok') || lower.includes('yes') || lower.includes('da') || lower.includes('bine');
      }
      
      messageHook.setIsTyping(false);

      if (businessDiscoveryHook) {
        await businessDiscoveryHook.handleSummaryConfirmation(isConfirmation, userInput);
      }
    }
    // Ready state - after project is created
    // Uses Convex-based modification (no Daytona dependency)
    else if (step === 'ready' && currentUrlId && convexProjectId) {
      // Show user message with image indicator
      if (hasImages) {
        const imageText = images.length === 1 ? '1 image' : `${images.length} images`;
        messageHook.addUserMessage(userInput ? `${userInput}\n\n📎 Attached: ${imageText}` : `📎 Attached: ${imageText}`);
      } else {
        messageHook.addUserMessage(userInput);
      }

      // Show processing message
      messageHook.addAssistantMessage(
        hasImages ? '🔄 Processing your images and applying changes...' : '🔄 Applying your changes...',
      );

      try {
        // Convert images to base64
        let imageData: ImageData[] | undefined;
        if (hasImages) {
          imageData = await Promise.all(images.map((img) => fileToBase64(img.file)));
        }

        // Build instruction with image context
        let instruction = userInput;
        if (hasImages && !userInput) {
          instruction =
            'The user has attached images. Please analyze them and ask where they would like to use these images on their website (e.g., hero section, about page, gallery, etc.)';
        } else if (hasImages) {
          instruction = `${userInput}\n\n[User has attached ${images.length} image(s) to use for this request]`;
        }

        // Route to appropriate modification flow (simple vs gretly)
        const routeDecision = await getModificationRoute(instruction);
        
        let result;
        if (routeDecision.route === 'gretly') {
          // Complex modification - use full Gretly pipeline
          messageHook.addAssistantMessage(
            `🚀 This looks like a complex change (${routeDecision.reason}). Using multi-agent pipeline...`
          );
          
          // Get current files from Convex for Gretly
          const filesResponse = await fetch('/api/modify-site', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get-files', projectId: convexProjectId }),
          });
          const filesData = await filesResponse.json();
          const currentFiles = filesData.files || {};
          
          result = await applyChangesGretly(
            instruction,
            convexProjectId,
            currentFiles,
            imageData,
            (msg) => messageHook.addAssistantMessage(`📍 ${msg}`),
          );
        } else {
          // Simple modification - use direct Convex update
          result = await applyChangesSimple(instruction, convexProjectId, imageData);
        }

        if (result.success) {
          let responseMsg = result.response || '✅ Changes applied successfully!';
          
          // Add file change details if available
          if (result.changes && result.changes.length > 0) {
            const changedFiles = result.changes.map(c => `- ${c.path} (${c.operation})`).join('\n');
            responseMsg += `\n\n**Modified files:**\n${changedFiles}`;
          }
          
          responseMsg += '\n\n🔄 The preview will update automatically.';
          
          messageHook.addAssistantMessage(responseMsg);
        } else {
          // Check for specific error types
          if (result.error?.includes('API key') || result.error?.includes('ANTHROPIC')) {
            messageHook.addAssistantMessage(
              "⚠️ The AI modification feature requires an Anthropic API key to be configured.\n\n" +
                '**To enable this feature:**\n' +
                '1. Get an API key from [console.anthropic.com](https://console.anthropic.com)\n' +
                '2. Add `ANTHROPIC_API_KEY=your-key` to your environment\n' +
                '3. Restart the editor\n\n' +
                'In the meantime, you can use the **Editor** tab to modify files directly.',
            );
          } else if (result.error?.includes('No files found')) {
            messageHook.addAssistantMessage(
              "⚠️ No files found for this project yet. Please wait for the initial build to complete, or try rebuilding the project.",
            );
          } else {
            messageHook.addAssistantMessage(
              `❌ Couldn't apply changes: ${result.error}\n\nYou can try editing the files directly in the Editor tab.`,
            );
          }
        }
      } catch (error) {
        messageHook.addAssistantMessage(
          `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try using the Editor tab instead.`,
        );
      }
    }
    // Creating state
    else if (step === 'creating') {
      messageHook.addUserMessage(userInput);
      messageHook.addAssistantMessage(
        "Your site is being built right now! The preview will appear once it's ready. This usually takes about a minute.",
      );
    }
    // Template, personalization, integrations steps - don't reset, guide user to use UI
    else if (step === 'template' || step === 'personalization' || step === 'integrations') {
      messageHook.addUserMessage(userInput);
      
      // Check if user wants to build
      const lowerInput = userInput.toLowerCase();
      if (lowerInput.includes('build') || lowerInput.includes('create') || lowerInput.includes('start') || lowerInput.includes('ready')) {
        messageHook.addAssistantMessage(
          "I'm ready to build! Please use the options above to finalize your selections, then click the build button when you're set.",
        );
      } else {
        messageHook.addAssistantMessage(
          "Use the options above to continue customizing your site. Once you're happy with your selections, we'll build it!",
        );
      }
    }
    // Default/fallback
    else {
      messageHook.addUserMessage(userInput);

      if (!currentUrlId) {
        messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.READY_SETUP_FIRST));
        flowHook.setStep('describe');
        messageHook.setSuggestedReplies(getRandomServicePrompts());
      } else {
        messageHook.addAssistantMessage(getMessage(MESSAGE_KEYS.READY_HELP_PROMPT));
      }
    }
  }, [
    flowHook,
    messageHook,
    businessHook,
    businessDiscoveryHook,
    currentUrlId,
    convexProjectId,
    workingDirectory,
    handleDescriptionSubmit,
    handleNameSubmit,
  ]);

  return {
    handleSend,
  };
}

export type { UseSendHandlerProps, UseSendHandlerReturn };

