import type { Message } from 'ai';
import { Fragment, useMemo, useCallback } from 'react';
import { classNames } from '~/utils/classNames';
import { AssistantMessage } from './AssistantMessage';
import { UserMessage } from './UserMessage';
import { useLocation } from '@remix-run/react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';
import { forwardRef } from 'react';
import type { ForwardedRef } from 'react';
import type { ProviderInfo } from '~/types/model';
import type { ToolResultValue } from '~/types/common';

import { ActionsDropdown } from '~/components/ui/actions-dropdown';
import { AnimatedCounter } from '~/components/ui/animated-counter';

interface ActionItem {
  id: string;
  action: string;
  target: string;
  timestamp: number;
}

interface MessagesProps {
  id?: string;
  className?: string;
  isStreaming?: boolean;
  messages?: Message[];
  append?: (message: Message) => void;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  provider?: ProviderInfo;
  model?: string;
  addToolResult?: (params: { toolCallId: string; result: ToolResultValue }) => void;

  actions?: ActionItem[];
  isDropdownOpen?: boolean;
  setIsDropdownOpen?: (open: boolean) => void;
}

export const Messages = forwardRef<HTMLDivElement, MessagesProps>(
  (props: MessagesProps, ref: ForwardedRef<HTMLDivElement> | undefined) => {
    const { id, isStreaming = false, messages = [], actions = [], isDropdownOpen = false, setIsDropdownOpen } = props;
    const location = useLocation();
    const profile = useStore(profileStore);

    const handleRewind = useCallback(
      (messageId: string) => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('rewindTo', messageId);
        window.location.search = searchParams.toString();
      },
      [location.search],
    );

    const handleFork = useCallback(async (_messageId: string) => {
      // Fork functionality is not available in Convex-based storage
      toast.info('Fork functionality is coming soon');
    }, []);

    return (
      <div id={id} className={props.className} ref={ref}>
        {isStreaming && actions.length > 0 && (
          <div className="flex gap-4 p-6 py-5 w-full rounded-[calc(0.75rem-1px)] mt-4">
            <div className="flex items-center justify-center w-[40px] h-[40px] overflow-hidden bg-flowstarter-elements-item-backgroundAccent text-flowstarter-elements-item-contentAccent rounded-full shrink-0 self-start">
              <div className="i-ph:sparkle-duotone text-xl" />
            </div>
            <div className="grid grid-col-1 w-full min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-flowstarter-elements-textSecondary">Assistant</span>
                <AnimatedCounter
                  value={actions.length}
                  isInteractive={true}
                  onClick={() => setIsDropdownOpen?.(!isDropdownOpen)}
                />
              </div>
              <div className="text-flowstarter-elements-textPrimary">
                <ActionsDropdown
                  actions={actions}
                  isOpen={isDropdownOpen}
                  onToggle={() => setIsDropdownOpen?.(!isDropdownOpen)}
                />
              </div>
            </div>
          </div>
        )}
        {useMemo(
          () =>
            messages.length > 0
              ? messages.map((message, index) => {
                  const { role, content, id: messageId, annotations } = message;
                  const isUserMessage = role === 'user';
                  const isFirst = index === 0;
                  const isLast = index === messages.length - 1;
                  const isHidden = annotations?.includes('hidden');

                  if (isHidden) {
                    return <Fragment key={messageId || `msg-${index}`} />;
                  }

                  return (
                    <div
                      key={messageId || `msg-${index}`}
                      className={classNames('flex gap-4 p-6 w-full rounded-2xl', {
                        'bg-flowstarter-elements-messages-background':
                          isUserMessage || !isStreaming || (isStreaming && !isLast),
                        'bg-gradient-to-b from-flowstarter-elements-messages-background from-30% to-transparent':
                          isStreaming && isLast,
                        'mt-6': !isFirst,
                      })}
                    >
                      {isUserMessage && (
                        <div className="flex items-center justify-center w-[40px] h-[40px] overflow-hidden bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-500 rounded-full shrink-0 self-start">
                          {profile?.avatar ? (
                            <img
                              src={profile.avatar}
                              alt={profile?.username || 'User'}
                              className="w-full h-full object-cover"
                              loading="eager"
                              decoding="sync"
                            />
                          ) : (
                            <div className="i-ph:user-fill text-2xl" />
                          )}
                        </div>
                      )}
                      <div className="grid grid-col-1 w-full">
                        {isUserMessage ? (
                          <UserMessage content={content} />
                        ) : (
                          <AssistantMessage
                            content={content}
                            annotations={message.annotations}
                            messageId={messageId}
                            onRewind={handleRewind}
                            onFork={handleFork}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              : null,
          [messages, isStreaming, profile, handleRewind, handleFork],
        )}
        {isStreaming && (
          <div className="text-center w-full  text-flowstarter-elements-item-contentAccent i-svg-spinners:3-dots-fade text-4xl mt-4"></div>
        )}
      </div>
    );
  },
);
