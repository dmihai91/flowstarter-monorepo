import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useAnimate } from 'framer-motion';
import { memo, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useMessageParser, usePromptEnhancer, useShortcuts } from '~/lib/hooks';
import { description, useChatHistory } from '~/lib/persistence';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { designSchemeStore, updateDesignScheme } from '~/lib/stores/design-scheme';
import { PROMPT_COOKIE_KEY } from '~/utils/constants';
import { cubicEasingFn } from '~/utils/easings';
import { createScopedLogger, renderLogger } from '~/utils/logger';
import { BaseChat } from './BaseChat';
import Cookies from 'js-cookie';
import { useSettings } from '~/lib/hooks/useSettings';
import { useSearchParams } from '@remix-run/react';
import { createSampler } from '~/utils/sampler';
import { logStore } from '~/lib/stores/logs';
import { streamingState } from '~/lib/stores/streaming';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import { proStore } from '~/lib/stores/pro';

import { useModelProvider, useChatInput, useChatErrorHandler, useChatSend } from './hooks';
import { formatMessageText } from './utils/messageHelpers';

const logger = createScopedLogger('Chat');

const processSampledMessages = createSampler(
  (options: { messages: Message[]; initialMessages: Message[]; isLoading: boolean; parseMessages: (messages: Message[], isLoading: boolean) => void; storeMessageHistory: (messages: Message[]) => Promise<void> }) => {
    const { messages, initialMessages, isLoading, parseMessages, storeMessageHistory } = options;
    parseMessages(messages, isLoading);
    if (messages.length > initialMessages.length) {
      storeMessageHistory(messages).catch((error) => toast.error(error.message));
    }
  },
  50,
);

export function Chat() {
  renderLogger.trace('Chat');
  const { ready, initialMessages, storeMessageHistory, importChat, exportChat } = useChatHistory();
  const title = useStore(description);

  useEffect(() => { workbenchStore.setReloadedMessages(initialMessages.map((m) => m.id)); }, [initialMessages]);

  return <>{ready && <ChatImpl description={title} initialMessages={initialMessages} exportChat={exportChat} storeMessageHistory={storeMessageHistory} importChat={importChat} />}</>;
}

interface ChatProps {
  initialMessages: Message[];
  storeMessageHistory: (messages: Message[]) => Promise<void>;
  importChat: (description: string, messages: Message[]) => Promise<void>;
  exportChat: () => void;
  description?: string;
}

export const ChatImpl = memo(({ description, initialMessages, storeMessageHistory, importChat, exportChat }: ChatProps) => {
  useShortcuts();

  // Core state
  const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);
  const [fakeLoading, setFakeLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [chatMode, setChatMode] = useState<'discuss' | 'build'>('build');
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);

  // Design scheme
  const storedDesignScheme = useStore(designSchemeStore);
  const [designScheme, setDesignScheme] = useState<DesignScheme>(() => {
    const stored = localStorage.getItem('designScheme');
    return stored ? JSON.parse(stored) : storedDesignScheme;
  });

  // Store subscriptions
  const files = useStore(workbenchStore.files);
  const actionAlert = useStore(workbenchStore.alert);
  const deployAlert = useStore(workbenchStore.deployAlert);
  const { showChat } = useStore(chatStore);
  const { activeProviders, promptId, setPromptId, autoSelectTemplate, contextOptimizationEnabled } = useSettings();

  // Custom hooks
  const { model, setModel, provider, setProvider } = useModelProvider();
  const [animationScope, animate] = useAnimate();

  // useChat hook
  const { messages, isLoading, input, handleInputChange, setInput, stop, append, setMessages, reload, error, data: chatData, setData, addToolResult } = useChat({
    api: '/api/chat',
    body: { isPro: proStore.get().isPro, apiKeys, files, promptId, contextOptimization: contextOptimizationEnabled, chatMode, designScheme },
    sendExtraMessageFields: true,
    onError: (e) => { setFakeLoading(false); handleError(e, 'chat'); },
    onToolCall: async ({ toolCall }) => {
      logger.debug(`Tool call received: ${toolCall.toolName}`);
      logStore.logProvider('MCP tool called', { component: 'Chat', action: 'tool_call', toolName: toolCall.toolName, model, provider: provider.name });
    },
    onFinish: (message, response) => {
      setData(undefined);
      if (response.usage) logStore.logProvider('Chat response completed', { component: 'Chat', action: 'response', model, provider: provider.name, usage: response.usage, messageLength: message.content.length });
      logger.debug('Finished streaming');
    },
    initialMessages,
    initialInput: Cookies.get(PROMPT_COOKIE_KEY) || '',
  });

  // Input handling
  const { textareaRef, onTextareaChange, scrollTextArea, uploadedFiles, setUploadedFiles, imageDataList, setImageDataList, clearInputState } = useChatInput({ input, chatStarted, handleInputChange });

  // Error handling
  const { llmErrorAlert, handleError, clearLlmErrorAlert } = useChatErrorHandler({ providerName: provider.name, stop, setFakeLoading, setData });

  // Prompt enhancement
  const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();
  const { parsedMessages, parseMessages } = useMessageParser();

  // Animation
  const runAnimation = useCallback(async () => {
    if (chatStarted) return;
    await Promise.all([
      animate('#examples', { opacity: 0, display: 'none' }, { duration: 0.1 }),
      animate('#intro', { opacity: 0, flex: 1 }, { duration: 0.2, ease: cubicEasingFn }),
    ]);
    chatStore.setKey('started', true);
    setChatStarted(true);
  }, [chatStarted, animate]);

  // Send message
  const { sendMessage, abort } = useChatSend({
    input, setInput, isLoading, messages, setMessages, append, reload, stop, error, model, provider,
    chatStarted, setChatStarted, setFakeLoading, autoSelectTemplate, uploadedFiles, imageDataList,
    selectedElement, clearInputState, resetEnhancer, runAnimation,
  });

  // Effects
  useEffect(() => { chatStore.setKey('started', initialMessages.length > 0); }, []);
  useEffect(() => { localStorage.setItem('designScheme', JSON.stringify(designScheme)); updateDesignScheme(designScheme); }, [designScheme]);
  useEffect(() => { processSampledMessages({ messages, initialMessages, isLoading, parseMessages, storeMessageHistory }); }, [messages, isLoading, parseMessages]);
  useEffect(() => { const storedApiKeys = Cookies.get('apiKeys'); if (storedApiKeys) setApiKeys(JSON.parse(storedApiKeys)); }, []);
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt) { setSearchParams({}); runAnimation(); append({ role: 'user', content: formatMessageText(prompt, model, provider.name) }); }
  }, [model, provider, searchParams]);

  return (
    <BaseChat
      ref={animationScope}
      textareaRef={textareaRef}
      input={input}
      showChat={showChat}
      chatStarted={chatStarted}
      isStreaming={isLoading || fakeLoading}
      onStreamingChange={(streaming) => streamingState.set(streaming)}
      enhancingPrompt={enhancingPrompt}
      promptEnhanced={promptEnhanced}
      sendMessage={sendMessage}
      model={model}
      setModel={setModel}
      provider={provider}
      setProvider={setProvider}
      providerList={activeProviders}
      handleInputChange={onTextareaChange}
      handleStop={abort}
      description={description}
      importChat={importChat}
      exportChat={exportChat}
      messages={messages.map((message, i) => message.role === 'user' ? message : { ...message, content: parsedMessages[i] || '' })}
      enhancePrompt={() => enhancePrompt(input, (input) => { setInput(input); scrollTextArea(); }, model, provider, apiKeys)}
      uploadedFiles={uploadedFiles}
      setUploadedFiles={setUploadedFiles}
      imageDataList={imageDataList}
      setImageDataList={setImageDataList}
      actionAlert={actionAlert}
      clearAlert={() => workbenchStore.clearAlert()}
      deployAlert={deployAlert}
      clearDeployAlert={() => workbenchStore.clearDeployAlert()}
      llmErrorAlert={llmErrorAlert}
      clearLlmErrorAlert={clearLlmErrorAlert}
      data={chatData}
      chatMode={chatMode}
      setChatMode={setChatMode}
      append={append}
      designScheme={designScheme}
      setDesignScheme={setDesignScheme}
      selectedElement={selectedElement}
      setSelectedElement={setSelectedElement}
      promptId={promptId}
      setPromptId={setPromptId}
      addToolResult={addToolResult}
    />
  );
});
