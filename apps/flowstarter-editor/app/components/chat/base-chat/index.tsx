/**
 * BaseChat Component
 *
 * Main chat interface component that combines the chat panel with workbench.
 *
 * Refactored into modules:
 * - types.ts: Type definitions and constants
 * - Logo.tsx: Brand logo SVG component
 * - ScrollToBottom.tsx: Scroll to bottom button
 * - WelcomeScreen.tsx: Welcome intro section
 * - useSpeechRecognition.ts: Voice input hook
 * - useFileUpload.ts: Image upload hook
 * - usePreviewHandlers.ts: Preview management hook
 * - useModelManagement.ts: Model and API key management hook
 */

/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import type { Message } from 'ai';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { motion } from 'framer-motion';
import { cubicEasingFn } from '~/utils/easings';
import { toast } from 'react-toastify';
import * as Tooltip from '@radix-ui/react-tooltip';

const Workbench = lazy(() =>
  import('~/components/workbench/Workbench.client').then((module) => ({
    default: module.Workbench,
  })),
);
import { ChatHeader } from '~/components/header/ChatHeader';
import { PreviewHeader } from '~/components/workbench/PreviewHeader';
import { CodeModeHeader } from '~/components/workbench/CodeModeHeader';

import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { Messages } from '../Messages.client';
import { expoUrlAtom } from '~/lib/stores/qrCodeStore';
import { useStore } from '@nanostores/react';
import { proStore } from '~/lib/stores/pro';
import { StickToBottom } from '~/lib/hooks';
import { ChatBox } from '../Chatbox';
import ChatAlert from '../ChatAlert';
import LlmErrorAlert from '../LLMApiAlert';
import ProgressCompilation from '../ProgressCompilation';
import StarterTemplates from '../StarterTemplates';
import styles from '../BaseChat.module.scss';

import type { ProviderInfo } from '~/types/model';
import type { Template } from '~/components/onboarding';
import type { ProgressAnnotation } from '~/types/context';

import { type BaseChatProps, TEXTAREA_MIN_HEIGHT } from './types';
import { WelcomeScreen } from './WelcomeScreen';
import { ScrollToBottom } from './ScrollToBottom';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useFileUpload } from './useFileUpload';
import { usePreviewHandlers } from './usePreviewHandlers';
import { useModelManagement } from './useModelManagement';

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      onStreamingChange,
      model,
      setModel,
      provider,
      setProvider,
      providerList,
      input = '',
      enhancingPrompt,
      handleInputChange,
      enhancePrompt,
      sendMessage,
      handleStop,
      exportChat,
      uploadedFiles = [],
      setUploadedFiles,
      imageDataList = [],
      setImageDataList,
      messages,
      actionAlert,
      clearAlert,
      llmErrorAlert,
      clearLlmErrorAlert,
      data,
      chatMode,
      setChatMode,
      append,
      designScheme,
      setDesignScheme,
      selectedElement,
      setSelectedElement,
      promptId,
      setPromptId,
      addToolResult = () => {
        throw new Error('addToolResult not implemented');
      },
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 500 : 400;
    const [isModelSettingsCollapsed, setIsModelSettingsCollapsed] = useState(true);
    const [progressAnnotations, setProgressAnnotations] = useState<ProgressAnnotation[]>([]);
    const expoUrl = useStore(expoUrlAtom);
    const [qrModalOpen, setQrModalOpen] = useState(false);

    // Workbench header state
    const selectedView = useStore(workbenchStore.currentView);
    const [isSyncing, setIsSyncing] = useState(false);
    const previews = useStore(workbenchStore.previews);
    const [activePreviewIndex, setActivePreviewIndex] = useState(0);
    const [displayPath, setDisplayPath] = useState('/');

    // Preview header state
    const [isWindowSizeDropdownOpen, setIsWindowSizeDropdownOpen] = useState(false);
    const [selectedWindowSize, setSelectedWindowSize] = useState({
      name: 'Desktop',
      width: 1920,
      height: 1080,
      icon: 'i-ph:monitor',
    });
    const [showDeviceFrame, setShowDeviceFrame] = useState(true);
    const [isLandscape, setIsLandscape] = useState(false);

    const setIsPushDialogOpen = (_open: boolean) => {
      // Push dialog is handled by Workbench component
    };

    // Use custom hooks
    const { apiKeys, modelList, isModelLoading, onApiKeysChange } = useModelManagement({
      providerList,
      provider,
    });

    const {
      isListening,
      transcript,
      recognition,
      startListening,
      stopListening,
      setTranscript,
      setIsListening,
    } = useSpeechRecognition({ handleInputChange });

    const { handleFileUpload, handlePaste } = useFileUpload({
      uploadedFiles,
      setUploadedFiles,
      imageDataList,
      setImageDataList,
    });

    const { handleSetIframeUrl, handleReloadPreview, handleOpenInNewTab, handleOpenInNewWindow } = usePreviewHandlers({
      previews,
      activePreviewIndex,
      setDisplayPath,
    });

    useEffect(() => {
      if (expoUrl) {
        setQrModalOpen(true);
      }
    }, [expoUrl]);

    useEffect(() => {
      if (data) {
        const progressList = data.filter(
          (x) => typeof x === 'object' && (x as any).type === 'progress',
        ) as ProgressAnnotation[];
        setProgressAnnotations(progressList);
      }
    }, [data]);

    useEffect(() => {
      console.log(transcript);
    }, [transcript]);

    useEffect(() => {
      onStreamingChange?.(isStreaming);
    }, [isStreaming, onStreamingChange]);

    const handleSendMessage = (event: React.UIEvent, messageInput?: string) => {
      if (!chatStarted && (!messages || messages.length === 0)) {
        toast.error('Please pick a framework to get started');
        return;
      }

      if (sendMessage) {
        sendMessage(event, messageInput);
        setSelectedElement?.(null);

        if (recognition) {
          recognition.abort();
          setTranscript('');
          setIsListening(false);

          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: '' },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        }
      }
    };

    const handleTemplateSelect = (template: Template) => {
      const message = `Use the "${template.name}" template to create my project. Scaffold all the files from the template.`;

      if (sendMessage) {
        sendMessage({} as React.UIEvent, message);
      }
    };

    const baseChat = (
      <div
        ref={ref}
        className={classNames(styles.BaseChat, 'relative flex flex-col h-full w-full overflow-hidden')}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>

        {chatStarted && (
          <div className="flex bg-flowstarter-elements-background-depth-1 border-b border-flowstarter-elements-borderColor z-10">
            <div className="flex-1 min-w-0 lg:min-w-[var(--chat-min-width)] overflow-hidden">
              <ChatHeader />
            </div>

            <ClientOnly>
              {() => (
                <motion.div
                  initial="closed"
                  animate={useStore(workbenchStore.showWorkbench) ? 'open' : 'closed'}
                  variants={{
                    closed: {
                      width: 0,
                      transition: { duration: 0.2, ease: cubicEasingFn },
                    },
                    open: {
                      width: 'var(--workbench-width)',
                      transition: { duration: 0.2, ease: cubicEasingFn },
                    },
                  }}
                  className="overflow-hidden"
                >
                  <div className="w-full">
                    {selectedView === 'code' && (
                      <CodeModeHeader
                        onDownloadZip={() => {
                          workbenchStore.downloadZip();
                        }}
                        onSyncFiles={() => setIsSyncing(true)}
                        onPushToGitHub={() => setIsPushDialogOpen(true)}
                        isSyncing={isSyncing}
                        setIsPushDialogOpen={setIsPushDialogOpen}
                      />
                    )}

                    {selectedView === 'preview' && (
                      <PreviewHeader
                        previews={previews}
                        activePreviewIndex={activePreviewIndex}
                        setActivePreviewIndex={setActivePreviewIndex}
                        displayPath={displayPath}
                        setDisplayPath={setDisplayPath}
                        setIframeUrl={handleSetIframeUrl}
                        reloadPreview={handleReloadPreview}
                        setIsWindowSizeDropdownOpen={setIsWindowSizeDropdownOpen}
                        isWindowSizeDropdownOpen={isWindowSizeDropdownOpen}
                        openInNewTab={handleOpenInNewTab}
                        openInNewWindow={handleOpenInNewWindow}
                        windowSizes={[]}
                        selectedWindowSize={selectedWindowSize}
                        setSelectedWindowSize={setSelectedWindowSize}
                        showDeviceFrame={showDeviceFrame}
                        setShowDeviceFrame={setShowDeviceFrame}
                        isLandscape={isLandscape}
                        setIsLandscape={setIsLandscape}
                        setIsPushDialogOpen={setIsPushDialogOpen}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </ClientOnly>
          </div>
        )}

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full">
          <div
            className={classNames(
              styles.Chat,
              'flex flex-col flex-grow lg:min-w-[var(--chat-min-width)] h-full overflow-hidden',
            )}
          >
            {!chatStarted && <WelcomeScreen />}

            <StickToBottom
              className={classNames('pt-2 px-2 sm:px-6 relative', {
                'h-full flex flex-col overflow-hidden': chatStarted,
              })}
              resize="smooth"
              initial="smooth"
            >
              <StickToBottom.Content className="flex flex-col gap-4 relative ">
                <ClientOnly>
                  {() => {
                    return chatStarted ? (
                      <Messages
                        className="flex flex-col w-full flex-1 max-w-chat pb-4 mx-auto z-1"
                        messages={messages}
                        isStreaming={isStreaming}
                        append={append}
                        chatMode={chatMode}
                        setChatMode={setChatMode}
                        provider={provider}
                        model={model}
                        addToolResult={addToolResult}
                      />
                    ) : null;
                  }}
                </ClientOnly>
                <ScrollToBottom />
              </StickToBottom.Content>
              <div
                className={classNames('my-auto flex flex-col gap-2 w-full max-w-chat mx-auto z-prompt mb-6', {
                  'sticky bottom-2': chatStarted,
                })}
              >
                <div className="flex flex-col gap-2">
                  {actionAlert && (
                    <ChatAlert
                      alert={actionAlert}
                      clearAlert={() => clearAlert?.()}
                      postMessage={(message) => {
                        sendMessage?.({} as any, message);
                        clearAlert?.();
                      }}
                    />
                  )}
                  {llmErrorAlert && <LlmErrorAlert alert={llmErrorAlert} clearAlert={() => clearLlmErrorAlert?.()} />}
                </div>
                {progressAnnotations && <ProgressCompilation data={progressAnnotations} />}
                <ChatBox
                  isModelSettingsCollapsed={isModelSettingsCollapsed}
                  setIsModelSettingsCollapsed={setIsModelSettingsCollapsed}
                  provider={provider}
                  setProvider={setProvider}
                  providerList={providerList || (PROVIDER_LIST as ProviderInfo[])}
                  model={model}
                  setModel={setModel}
                  modelList={modelList}
                  apiKeys={apiKeys}
                  isModelLoading={isModelLoading}
                  onApiKeysChange={onApiKeysChange}
                  uploadedFiles={uploadedFiles}
                  setUploadedFiles={setUploadedFiles}
                  imageDataList={imageDataList}
                  setImageDataList={setImageDataList}
                  textareaRef={textareaRef}
                  input={input}
                  handleInputChange={handleInputChange}
                  handlePaste={handlePaste}
                  TEXTAREA_MIN_HEIGHT={TEXTAREA_MIN_HEIGHT}
                  TEXTAREA_MAX_HEIGHT={TEXTAREA_MAX_HEIGHT}
                  isStreaming={isStreaming}
                  handleStop={handleStop}
                  handleSendMessage={handleSendMessage}
                  enhancingPrompt={enhancingPrompt}
                  enhancePrompt={enhancePrompt}
                  isListening={isListening}
                  startListening={startListening}
                  stopListening={stopListening}
                  chatStarted={chatStarted}
                  exportChat={exportChat}
                  qrModalOpen={qrModalOpen}
                  setQrModalOpen={setQrModalOpen}
                  handleFileUpload={handleFileUpload}
                  chatMode={chatMode}
                  setChatMode={setChatMode}
                  designScheme={designScheme}
                  setDesignScheme={setDesignScheme}
                  selectedElement={selectedElement}
                  setSelectedElement={setSelectedElement}
                  promptId={promptId}
                  setPromptId={setPromptId}
                  flowstarter_options={{
                    enable_web_search: proStore.get().features.webSearch,
                    enable_lazy_edits: proStore.get().features.lazyEdits,
                    files: uploadedFiles.length > 0,
                  }}
                />
              </div>
            </StickToBottom>
            <div className="flex flex-col justify-center">
              <div className="flex flex-col gap-5">
                {!chatStarted && <StarterTemplates onSelectTemplate={handleTemplateSelect} />}
              </div>
            </div>
          </div>
          <ClientOnly>
            {() => (
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center">
                    <div className="i-svg-spinners:90-ring-with-bg text-2xl text-flowstarter-elements-textTertiary"></div>
                  </div>
                }
              >
                <Workbench
                  chatStarted={chatStarted}
                  isStreaming={isStreaming}
                  setSelectedElement={setSelectedElement}
                />
              </Suspense>
            )}
          </ClientOnly>
        </div>
      </div>
    );

    return <Tooltip.Provider delayDuration={200}>{baseChat}</Tooltip.Provider>;
  },
);

export default BaseChat;
