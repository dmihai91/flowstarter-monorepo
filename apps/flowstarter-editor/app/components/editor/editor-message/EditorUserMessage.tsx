import { memo } from 'react';
import { MessageAvatar, MessageBubble, MessageTimestamp } from './components';
import { useMessageStyles } from './hooks';

interface EditorUserMessageProps {
  content: string;
  timestamp: number;
  userName: string;
  userAvatar?: string;
  isDark: boolean;
}

export const EditorUserMessage = memo(
  ({ content, timestamp, userName, userAvatar, isDark }: EditorUserMessageProps) => {
    const styles = useMessageStyles({ isDark });

    return (
      <div className="flex gap-3">
        <MessageAvatar variant="user" name={userName} imageUrl={userAvatar} isDark={isDark} />
        <div className="flex flex-col flex-1 min-w-[250px]">
          <span className="text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
            {userName}
          </span>
          <MessageBubble isDark={isDark} variant="user">
            <p className="text-sm leading-relaxed" style={{ color: styles.textPrimary }}>
              {content}
            </p>
          </MessageBubble>
          <MessageTimestamp timestamp={timestamp} isDark={isDark} />
        </div>
      </div>
    );
  },
);

EditorUserMessage.displayName = 'EditorUserMessage';
