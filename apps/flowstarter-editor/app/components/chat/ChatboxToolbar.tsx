/**
 * Toolbar section for the ChatBox component.
 * Contains action buttons, model selector, and send button.
 * Extracted from Chatbox.tsx for SRP compliance.
 */

import React, { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { ProviderModelSelector } from '~/components/chat/ProviderModelSelector';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';
import { toast } from 'react-toastify';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { ColorSchemeDialog } from '~/components/chat/ColorSchemeDialog';
import { PromptSelector } from './PromptSelector';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ProviderInfo } from '~/types/model';
import { proStore, toggleFeature } from '~/lib/stores/pro';
import { useTranslation } from '~/lib/i18n/useTranslation';
import type { ChatBoxProps } from './chatbox-types';

type ChatboxToolbarProps = Pick<
  ChatBoxProps,
  | 'isModelSettingsCollapsed'
  | 'setIsModelSettingsCollapsed'
  | 'provider'
  | 'providerList'
  | 'modelList'
  | 'apiKeys'
  | 'isModelLoading'
  | 'onApiKeysChange'
  | 'model'
  | 'setModel'
  | 'setProvider'
  | 'input'
  | 'isStreaming'
  | 'uploadedFiles'
  | 'handleSendMessage'
  | 'handleStop'
  | 'handleFileUpload'
  | 'isListening'
  | 'startListening'
  | 'stopListening'
  | 'enhancingPrompt'
  | 'enhancePrompt'
  | 'chatMode'
  | 'setChatMode'
  | 'designScheme'
  | 'setDesignScheme'
  | 'promptId'
  | 'setPromptId'
>;

export const ChatboxToolbar: React.FC<ChatboxToolbarProps> = (props) => {
  const { t } = useTranslation();
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);

  return (
    <div className="flex justify-between items-center text-sm px-3 py-3 border-t border-white/5">
      <div className="flex gap-1 items-center">
        <PromptSelector promptId={props.promptId} setPromptId={props.setPromptId} />
        <ColorSchemeDialog designScheme={props.designScheme} setDesignScheme={props.setDesignScheme} />

        <IconButton title={t.chat.chatbox.integrations} className="transition-all" onClick={() => {}}>
          <div className="i-ph:plug text-xl"></div>
        </IconButton>

        <IconButton title={t.chat.chatbox.uploadFile} className="transition-all" onClick={() => props.handleFileUpload()}>
          <div className="i-ph:paperclip text-xl"></div>
        </IconButton>
        <IconButton
          title={t.chat.chatbox.enhancePrompt}
          disabled={props.input.length === 0 || props.enhancingPrompt}
          className={classNames('transition-all', props.enhancingPrompt ? 'opacity-100' : '')}
          onClick={() => { props.enhancePrompt?.(); toast.success(t.chat.chatbox.promptEnhanced); }}
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
          onClick={() => props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss')}
        >
          <div className="i-ph:chats text-xl" />
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
            <SendButton
              show={props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0}
              isStreaming={props.isStreaming}
              disabled={!props.providerList || props.providerList.length === 0}
              onClick={(event) => {
                if (props.isStreaming) { props.handleStop?.(); return; }
                if (props.input.length > 0 || props.uploadedFiles.length > 0) { props.handleSendMessage?.(event); }
              }}
            />
          )}
        </ClientOnly>
      </div>
    </div>
  );
};
