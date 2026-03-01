import { memo, type ReactNode } from 'react';
import { MessageAvatar, MessageBubble, MessageTimestamp, MessageContent, StreamingIndicator } from './components';
import { useMessageStyles } from './hooks';

interface EditorAssistantMessageProps {
  content: string;
  timestamp: number;
  isDark: boolean;
  isStreaming?: boolean;
  component?: ReactNode;
}

export const EditorAssistantMessage = memo(
  ({ content, timestamp, isDark, isStreaming = false, component }: EditorAssistantMessageProps) => {
    useMessageStyles({ isDark }); // Called for hook initialization

    return (
      <div className="flex gap-3">
        <MessageAvatar variant="assistant" isDark={isDark} />
        <div className="flex flex-col flex-1 min-w-[250px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-sm font-semibold"
              style={{
                color: isDark ? '#8B5CF6' : '#7C3AED',
              }}
            >
              Flowstarter Assistant
            </span>
            {isStreaming && <StreamingIndicator isDark={isDark} />}
          </div>
          <MessageBubble isDark={isDark} variant="assistant">
            <MessageContent content={content} isDark={isDark}>
              {component}
            </MessageContent>
          </MessageBubble>
          {!isStreaming && <MessageTimestamp timestamp={timestamp} showDelivered={false} isDark={isDark} />}
        </div>
      </div>
    );
  },
);

EditorAssistantMessage.displayName = 'EditorAssistantMessage';
