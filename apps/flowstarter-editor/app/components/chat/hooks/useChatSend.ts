import { useCallback } from 'react';
import { toast } from 'react-toastify';
import type { Message } from 'ai';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { logStore } from '~/lib/stores/logs';
import { getTemplates, selectStarterTemplate } from '~/utils/selectStarterTemplate';
import { filesToArtifacts } from '~/utils/fileUtils';
import type { ProviderInfo } from '~/types/model';
import type { ElementInfo } from '~/components/workbench/Inspector';
import { createMessageParts, filesToAttachments, formatMessageText } from '../utils/messageHelpers';

export interface UseChatSendOptions {
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  append: (message: any, options?: any) => void;
  reload: (options?: any) => void;
  stop: () => void;
  error: Error | undefined;
  model: string;
  provider: ProviderInfo;
  chatStarted: boolean;
  setChatStarted: (started: boolean) => void;
  setFakeLoading: (loading: boolean) => void;
  autoSelectTemplate: boolean;
  uploadedFiles: File[];
  imageDataList: string[];
  selectedElement: ElementInfo | null;
  clearInputState: () => void;
  resetEnhancer: () => void;
  runAnimation: () => Promise<void>;
}

export interface UseChatSendReturn {
  sendMessage: (event: React.UIEvent, messageInput?: string) => Promise<void>;
  abort: () => void;
}

export function useChatSend({
  input,
  setInput,
  isLoading,
  messages,
  setMessages,
  append,
  reload,
  stop,
  error,
  model,
  provider,
  chatStarted,
  setChatStarted,
  setFakeLoading,
  autoSelectTemplate,
  uploadedFiles,
  imageDataList,
  selectedElement,
  clearInputState,
  resetEnhancer,
  runAnimation,
}: UseChatSendOptions): UseChatSendReturn {
  const abort = useCallback(() => {
    stop();
    chatStore.setKey('aborted', true);
    workbenchStore.abortAllActions();
    logStore.logProvider('Chat response aborted', { component: 'Chat', action: 'abort', model, provider: provider.name });
  }, [stop, model, provider.name]);

  const sendMessage = useCallback(
    async (_event: React.UIEvent, messageInput?: string) => {
      const messageContent = messageInput || input;
      if (!messageContent?.trim()) return;
      if (isLoading) { abort(); return; }

      let finalMessageContent = messageContent;
      if (selectedElement) {
        const elementInfo = `<div class="__FlowstarterSelectedElement__" data-element='${JSON.stringify(selectedElement)}'>${JSON.stringify(`${selectedElement.displayText}`)}</div>`;
        finalMessageContent = messageContent + elementInfo;
      }

      await runAnimation();

      // Handle first message with template selection
      if (!chatStarted) {
        setFakeLoading(true);
        if (autoSelectTemplate) {
          const { template, title } = await selectStarterTemplate({ message: finalMessageContent, model, provider });
          if (template !== 'blank') {
            const temResp = await getTemplates(template, title).catch((e) => {
              toast.warning(e.message.includes('rate limit') 
                ? 'Rate limit exceeded. Skipping starter template\n Continuing with blank template' 
                : 'Failed to import starter template\n Continuing with blank template');
              return null;
            });
            if (temResp) {
              const { assistantMessage, userMessage } = temResp;
              const userMessageText = formatMessageText(finalMessageContent, model, provider.name);
              setMessages([
                { id: `1-${Date.now()}`, role: 'user', content: userMessageText, parts: createMessageParts(userMessageText, imageDataList) },
                { id: `2-${Date.now()}`, role: 'assistant', content: assistantMessage },
                { id: `3-${Date.now()}`, role: 'user', content: formatMessageText(userMessage, model, provider.name), annotations: ['hidden'] },
              ]);
              reload(uploadedFiles.length > 0 ? { experimental_attachments: await filesToAttachments(uploadedFiles) } : undefined);
              setInput(''); clearInputState(); resetEnhancer(); setFakeLoading(false);
              return;
            }
          }
        }
        // Normal first message (no template)
        const userMessageText = formatMessageText(finalMessageContent, model, provider.name);
        const attachments = uploadedFiles.length > 0 ? await filesToAttachments(uploadedFiles) : undefined;
        setMessages([{ id: `${Date.now()}`, role: 'user', content: userMessageText, parts: createMessageParts(userMessageText, imageDataList), experimental_attachments: attachments }]);
        reload(attachments ? { experimental_attachments: attachments } : undefined);
        setFakeLoading(false); setInput(''); clearInputState(); resetEnhancer();
        return;
      }

      // Subsequent messages
      if (error != null) setMessages(messages.slice(0, -1));
      chatStore.setKey('aborted', false);

      const modifiedFiles = workbenchStore.getModifiedFiles();
      const userUpdateArtifact = modifiedFiles ? filesToArtifacts(modifiedFiles, `${Date.now()}`) : '';
      const messageText = formatMessageText(`${userUpdateArtifact}${finalMessageContent}`, model, provider.name);
      const attachmentOptions = uploadedFiles.length > 0 ? { experimental_attachments: await filesToAttachments(uploadedFiles) } : undefined;

      append({ role: 'user', content: messageText, parts: createMessageParts(messageText, imageDataList) }, attachmentOptions);
      if (modifiedFiles) workbenchStore.resetAllFileModifications();
      setInput(''); clearInputState(); resetEnhancer();
    },
    [input, isLoading, messages, model, provider, chatStarted, autoSelectTemplate, uploadedFiles, imageDataList, selectedElement, abort, setInput, setMessages, append, reload, error, setFakeLoading, clearInputState, resetEnhancer, runAnimation],
  );

  return { sendMessage, abort };
}
