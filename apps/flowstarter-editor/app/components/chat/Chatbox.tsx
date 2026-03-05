import React, { useState, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { ProviderModelSelector } from '~/components/chat/ProviderModelSelector';
import { APIKeyManager } from './APIKeyManager';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/types/model';
import { ToolMentionAutocomplete } from './ToolMentionAutocomplete';
import { ChatboxToolbar } from './ChatboxToolbar';
import { useToolMentionHandlers } from './useToolMentionHandlers';
import { useTranslation } from '~/lib/i18n/useTranslation';
import type { ChatBoxProps } from './chatbox-types';

export type { ChatBoxProps } from './chatbox-types';

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const { t } = useTranslation();
  const [placeholderText, setPlaceholderText] = useState('');
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  const { autocomplete } = useToolMentionHandlers({
    input: props.input,
    textareaRef: props.textareaRef,
    handleInputChange: props.handleInputChange,
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
            <linearGradient id="line-gradient" x1="20%" y1="0%" x2="-14%" y2="10%" gradientUnits="userSpaceOnUse" gradientTransform="rotate(-45)">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0%" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="30%" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="30%" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0%" />
            </linearGradient>
            <linearGradient id="shine-gradient">
              <stop offset="0%" stopColor="white" stopOpacity="0%" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="40%" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="40%" />
              <stop offset="100%" stopColor="white" stopOpacity="0%" />
            </linearGradient>
          </defs>
          <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round" />
          <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1" />
        </svg>
        <div>
          <ClientOnly>
            {() => (
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
                      setApiKey={(key) => props.onApiKeysChange(props.provider.name, key)}
                    />
                  )}
              </div>
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
            <button className="bg-transparent text-accent-500 pointer-auto" onClick={() => props.setSelectedElement?.(null)}>
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
          style={{ minHeight: props.TEXTAREA_MIN_HEIGHT, maxHeight: props.TEXTAREA_MAX_HEIGHT, width: 'calc(100% - 1px)', maxWidth: '100%', boxSizing: 'border-box', wordBreak: 'break-word', overflowWrap: 'break-word' }}
          onDragEnter={(e) => { e.preventDefault(); e.currentTarget.style.border = '2px solid var(--flowstarter-elements-borderColorActive)'; }}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.border = '2px solid var(--flowstarter-elements-borderColorActive)'; }}
          onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.border = '1px solid var(--flowstarter-elements-borderColor)'; }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--flowstarter-elements-borderColor)';
            Array.from(e.dataTransfer.files).forEach((file) => {
              if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const base64Image = ev.target?.result as string;
                  props.setUploadedFiles?.([...props.uploadedFiles, file]);
                  props.setImageDataList?.([...props.imageDataList, base64Image]);
                };
                reader.readAsDataURL(file);
              }
            });
          }}
          onKeyDown={(event) => {
            if (autocomplete.handleKeyDown(event)) { return; }
            if (event.key === 'Enter') {
              if (event.shiftKey) { return; }
              event.preventDefault();
              if (props.isStreaming) { props.handleStop?.(); return; }
              if (event.nativeEvent.isComposing) { return; }
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
        <ChatboxToolbar {...props} />
      </div>

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
    </>
  );
};
