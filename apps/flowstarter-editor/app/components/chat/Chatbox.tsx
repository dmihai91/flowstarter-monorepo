import React, { useState, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { ProviderModelSelector } from '~/components/chat/ProviderModelSelector';
import { APIKeyManager } from './APIKeyManager';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';
import { toast } from 'react-toastify';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/types/model';
import { ColorSchemeDialog } from '~/components/chat/ColorSchemeDialog';
// IntegrationsDialog removed - handled by IntegrationsPanel

import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';

import { useTranslation } from '~/lib/i18n/useTranslation';
import { useToolMentionAutocomplete } from '~/lib/hooks/useToolMentionAutocomplete';
import { ToolMentionAutocomplete } from './ToolMentionAutocomplete';
import { insertToolMention, insertFileReference } from '~/utils/toolMentionParser';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { proStore, toggleFeature } from '~/lib/stores/pro';
import { PromptSelector } from './PromptSelector';

interface ChatBoxProps {
  isModelSettingsCollapsed: boolean;
  setIsModelSettingsCollapsed: (collapsed: boolean) => void;
  provider: any;
  providerList: any[];
  modelList: any[];
  apiKeys: Record<string, string>;
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null> | undefined;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  setProvider?: ((provider: ProviderInfo) => void) | undefined;
  model?: string | undefined;
  setModel?: ((model: string) => void) | undefined;
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
  flowstarter_options?: {
    enable_web_search?: boolean;
    enable_lazy_edits?: boolean;
    files?: boolean;
  };
  promptId?: string;
  setPromptId?: (promptId: string) => void;
  // New: Integrations
  // integrations removed - using IntegrationsPanel
  // onIntegrationsChange removed - using IntegrationsPanel
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const { t } = useTranslation();
  const [placeholderText, setPlaceholderText] = useState('');
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  // const [integrationsDialogOpen, setIntegrationsDialogOpen] = useState(false); // Removed - using IntegrationsPanel

  const files = useStore(workbenchStore.files);

  const handleToolSelected = (toolName: string) => {
    if (!props.textareaRef?.current) {
      return;
    }

    const textarea = props.textareaRef.current;
    const currentCursor = textarea.selectionStart || 0;
    const { newText, newCursorPos } = insertToolMention(props.input, currentCursor, toolName);

    if (props.handleInputChange) {
      textarea.value = newText;

      const syntheticEvent = {
        target: textarea,
        currentTarget: textarea,
      } as React.ChangeEvent<HTMLTextAreaElement>;

      props.handleInputChange(syntheticEvent);
    }

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const handleFileSelected = (filePath: string) => {
    if (!props.textareaRef?.current) {
      return;
    }

    const textarea = props.textareaRef.current;
    const currentCursor = textarea.selectionStart || 0;
    const { newText, newCursorPos } = insertFileReference(props.input, currentCursor, filePath);

    if (props.handleInputChange) {
      textarea.value = newText;

      const syntheticEvent = {
        target: textarea,
        currentTarget: textarea,
      } as React.ChangeEvent<HTMLTextAreaElement>;

      props.handleInputChange(syntheticEvent);
    }

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const autocomplete = useToolMentionAutocomplete({
    input: props.input,
    textareaRef: props.textareaRef,
    onToolSelected: handleToolSelected,
    onFileSelected: handleFileSelected,
    files,
  });

  useEffect(() => {
    if (!props.chatStarted && props.input.length === 0 && showPlaceholder) {
      const tipText = t.chat.chatbox.askOrRequest;
      let i = 0;
      const timer = setInterval(() => {
        if (i < tipText.length) {
          setPlaceholderText(tipText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(timer);
        }
      }, 50);

      return () => clearInterval(timer);
    }

    return () => {
      /* empty */
    };
  }, [props.chatStarted, props.input.length, showPlaceholder]);

  // Hide placeholder when textarea is focused
  const handleTextareaFocus = () => {
    setShowPlaceholder(false);
  };

  const handleTextareaBlur = () => {
    setShowPlaceholder(true);
  };

  // handleIntegrationsSave removed

  return (
    <>
      <div
        className={classNames(
          'relative p-3 rounded-2xl w-full max-w-chat mx-auto z-prompt transition-theme overflow-hidden',
          'backdrop-blur-xl bg-white/95 dark:bg-white/5',
          'border border-zinc-200 dark:border-white/10',
          'shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]',
          'dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]',
        )}
      >
        <svg className={classNames(styles.PromptEffectContainer)}>
          <defs>
            <linearGradient
              id="line-gradient"
              x1="20%"
              y1="0%"
              x2="-14%"
              y2="10%"
              gradientUnits="userSpaceOnUse"
              gradientTransform="rotate(-45)"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0%"></stop>
              <stop offset="40%" stopColor="#ffffff" stopOpacity="30%"></stop>
              <stop offset="50%" stopColor="#ffffff" stopOpacity="30%"></stop>
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0%"></stop>
            </linearGradient>
            <linearGradient id="shine-gradient">
              <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
              <stop offset="40%" stopColor="#ffffff" stopOpacity="40%"></stop>
              <stop offset="50%" stopColor="#ffffff" stopOpacity="40%"></stop>
              <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
            </linearGradient>
          </defs>
          <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
          <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
        </svg>
        <div>
          <ClientOnly>
            {() => (
              <>
                <div className={props.isModelSettingsCollapsed ? 'hidden' : ''}>
                  <ProviderModelSelector
                    key={props.provider?.name + ':' + props.modelList.length}
                    model={props.model}
                    setModel={props.setModel || (() => {})}
                    modelList={props.modelList}
                    provider={props.provider}
                    setProvider={props.setProvider || (() => {})}
                    providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
                    apiKeys={props.apiKeys}
                    modelLoading={props.isModelLoading}
                    isCollapsed={false}
                  />
                  {(props.providerList || []).length > 0 &&
                    props.provider &&
                    !LOCAL_PROVIDERS.includes(props.provider.name) && (
                      <APIKeyManager
                        provider={props.provider}
                        apiKey={props.apiKeys[props.provider.name] || ''}
                        setApiKey={(key) => {
                          props.onApiKeysChange(props.provider.name, key);
                        }}
                      />
                    )}
                </div>
              </>
            )}
          </ClientOnly>
        </div>
        <FilePreview
          files={props.uploadedFiles}
          imageDataList={props.imageDataList}
          onRemove={(index) => {
            props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
            props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
          }}
        />
        <ClientOnly>
          {() => (
            <ScreenshotStateManager
              setUploadedFiles={props.setUploadedFiles}
              setImageDataList={props.setImageDataList}
              uploadedFiles={props.uploadedFiles}
              imageDataList={props.imageDataList}
            />
          )}
        </ClientOnly>
        {props.selectedElement && (
          <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none border-flowstarter-elements-borderColor text-flowstarter-elements-textPrimary flex py-1 px-2.5 font-medium text-xs transition-theme">
            <div className="flex gap-2 items-center lowercase">
              <code className="bg-accent-500 rounded-4px px-1.5 py-1 mr-0.5 text-white">
                {props?.selectedElement?.tagName}
              </code>
              {t.chat.chatbox.selectedForInspection}
            </div>
            <button
              className="bg-transparent text-accent-500 pointer-auto"
              onClick={() => props.setSelectedElement?.(null)}
            >
              {t.chat.chatbox.clear}
            </button>
          </div>
        )}

        <textarea
          ref={props.textareaRef}
          className={classNames(
            'pl-4 pt-4 pr-4 pb-3 outline-none resize-none text-flowstarter-elements-textPrimary placeholder-white/40 bg-transparent text-base',
            'transition-all duration-200 leading-relaxed block',
          )}
          wrap="soft"
          rows={3}
          cols={50}
          style={{
            minHeight: props.TEXTAREA_MIN_HEIGHT,
            maxHeight: props.TEXTAREA_MAX_HEIGHT,
            width: 'calc(100% - 1px)',
            maxWidth: '100%',
            boxSizing: 'border-box',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid var(--flowstarter-elements-borderColorActive)';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid var(--flowstarter-elements-borderColorActive)';
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--flowstarter-elements-borderColor)';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--flowstarter-elements-borderColor)';

            const files = Array.from(e.dataTransfer.files);
            files.forEach((file) => {
              if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                  const base64Image = e.target?.result as string;
                  props.setUploadedFiles?.([...props.uploadedFiles, file]);
                  props.setImageDataList?.([...props.imageDataList, base64Image]);
                };
                reader.readAsDataURL(file);
              }
            });
          }}
          onKeyDown={(event) => {
            if (autocomplete.handleKeyDown(event)) {
              return;
            }

            if (event.key === 'Enter') {
              if (event.shiftKey) {
                return;
              }

              event.preventDefault();

              if (props.isStreaming) {
                props.handleStop?.();
                return;
              }

              if (event.nativeEvent.isComposing) {
                return;
              }

              props.handleSendMessage?.(event);
            }
          }}
          value={props.input}
          onChange={props.handleInputChange}
          onFocus={handleTextareaFocus}
          onBlur={handleTextareaBlur}
          onPaste={props.handlePaste}
          placeholder={!props.chatStarted && props.input.length === 0 && showPlaceholder ? placeholderText : undefined}
          translate="no"
        />
        <div className="flex justify-between items-center text-sm px-3 py-3 border-t border-white/5">
          <div className="flex gap-1 items-center">
            <PromptSelector promptId={props.promptId} setPromptId={props.setPromptId} />
            <ColorSchemeDialog designScheme={props.designScheme} setDesignScheme={props.setDesignScheme} />
            
            {/* Integrations Button */}
            <IconButton 
              title={t.chat.chatbox.integrations} 
              className="transition-all" 
              onClick={() => {}}
            >
              <div className="i-ph:plug text-xl"></div>
            </IconButton>
            
            <IconButton title={t.chat.chatbox.uploadFile} className="transition-all" onClick={() => props.handleFileUpload()}>
              <div className="i-ph:paperclip text-xl"></div>
            </IconButton>
            <IconButton
              title={t.chat.chatbox.enhancePrompt}
              disabled={props.input.length === 0 || props.enhancingPrompt}
              className={classNames('transition-all', props.enhancingPrompt ? 'opacity-100' : '')}
              onClick={() => {
                props.enhancePrompt?.();
                toast.success(t.chat.chatbox.promptEnhanced);
              }}
            >
              {props.enhancingPrompt ? (
                <div className="i-svg-spinners:90-ring-with-bg text-flowstarter-elements-loader-progress text-xl animate-spin"></div>
              ) : (
                <div className="i-flowstarter:stars text-xl"></div>
              )}
            </IconButton>

            <SpeechRecognitionButton
              isListening={props.isListening}
              onStart={props.startListening}
              onStop={props.stopListening}
              disabled={props.isStreaming}
            />
            <IconButton
              title={t.chat.chatbox.discuss}
              className={classNames(
                'transition-all flex items-center gap-1 px-1.5',
                props.chatMode === 'discuss'
                  ? '!bg-flowstarter-elements-item-backgroundAccent !text-flowstarter-elements-item-contentAccent'
                  : 'bg-flowstarter-elements-item-backgroundDefault text-flowstarter-elements-item-contentDefault',
              )}
              onClick={() => {
                props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss');
              }}
            >
              <div className={`i-ph:chats text-xl`} />
              {props.chatMode === 'discuss' ? <span>{t.chat.chatbox.discuss}</span> : <span />}
            </IconButton>
            <IconButton
              title={t.chat.chatbox.webSearch}
              className={classNames(
                'transition-all flex items-center gap-1 px-1.5',
                props.provider?.name !== 'Flowstarter' ? 'opacity-50 grayscale' : '',
                proStore.get().features.webSearch
                  ? '!bg-flowstarter-elements-item-backgroundAccent !text-flowstarter-elements-item-contentAccent'
                  : 'bg-flowstarter-elements-item-backgroundDefault text-flowstarter-elements-item-contentDefault',
              )}
              onClick={() => {
                if (props.provider?.name !== 'Flowstarter') {
                  toast.info(t.chat.chatbox.webSearchPro);
                  return;
                }

                toggleFeature('webSearch');
              }}
            >
              <div className="i-ph:globe text-xl" />
            </IconButton>
            <ClientOnly>
              {() =>
                props.isModelSettingsCollapsed ? (
                  <DropdownMenu.Root open={providerDropdownOpen} onOpenChange={setProviderDropdownOpen}>
                    <DropdownMenu.Trigger asChild>
                      <button
                        title={t.chat.chatbox.modelSettings}
                        type="button"
                        className={classNames(
                          'flex items-center justify-center text-flowstarter-elements-item-contentDefault bg-transparent enabled:hover:text-flowstarter-elements-item-contentActive rounded-md enabled:hover:bg-flowstarter-elements-item-backgroundActive disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-500/50 p-1',
                          'transition-all flex items-center gap-1 cursor-pointer',
                          'bg-flowstarter-elements-item-backgroundAccent text-flowstarter-elements-item-contentAccent',
                        )}
                        disabled={!props.providerList || props.providerList.length === 0}
                      >
                        <div className="i-ph:caret-right text-lg" />
                        <span className="text-xs">{props.model}</span>
                      </button>
                    </DropdownMenu.Trigger>
                    <ProviderModelSelector
                      key={props.provider?.name + ':' + props.modelList.length + '-collapsed'}
                      model={props.model}
                      setModel={props.setModel || (() => {})}
                      modelList={props.modelList}
                      provider={props.provider}
                      setProvider={props.setProvider || (() => {})}
                      providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
                      apiKeys={props.apiKeys}
                      modelLoading={props.isModelLoading}
                      isCollapsed={true}
                      open={providerDropdownOpen}
                      onOpenChange={setProviderDropdownOpen}
                      onApiKeyChange={props.onApiKeysChange}
                    />
                  </DropdownMenu.Root>
                ) : (
                  <IconButton
                    title={t.chat.chatbox.modelSettings}
                    className={classNames(
                      'transition-all flex items-center gap-1',
                      'bg-flowstarter-elements-item-backgroundDefault text-flowstarter-elements-item-contentDefault',
                    )}
                    onClick={() => props.setIsModelSettingsCollapsed(!props.isModelSettingsCollapsed)}
                    disabled={!props.providerList || props.providerList.length === 0}
                  >
                    <div className="i-ph:caret-down text-lg" />
                  </IconButton>
                )
              }
            </ClientOnly>
          </div>
          <div className="flex gap-2 items-center">
            <ClientOnly>
              {() => (
                <>
                  <SendButton
                    show={props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0}
                    isStreaming={props.isStreaming}
                    disabled={!props.providerList || props.providerList.length === 0}
                    onClick={(event) => {
                      if (props.isStreaming) {
                        props.handleStop?.();
                        return;
                      }

                      if (props.input.length > 0 || props.uploadedFiles.length > 0) {
                        props.handleSendMessage?.(event);
                      }
                    }}
                  />
                </>
              )}
            </ClientOnly>
          </div>
        </div>
      </div>

      {/* Tool Mention Autocomplete */}
      <ToolMentionAutocomplete
        isOpen={autocomplete.isOpen}
        tools={autocomplete.filteredTools}
        files={autocomplete.filteredFiles}
        selectedIndex={autocomplete.selectedIndex}
        position={autocomplete.dropdownPosition}
        onSelectTool={autocomplete.handleToolSelect}
        onSelectFile={autocomplete.handleFileSelect}
        onHover={autocomplete.setSelectedIndex}
        onClose={autocomplete.handleClose}
        searchQuery={autocomplete.searchQuery}
        referenceType={autocomplete.referenceType}
      />

      {/* Integrations Dialog */}
      { /* IntegrationsDialog removed - using IntegrationsPanel */ }
    </>
  );
};
