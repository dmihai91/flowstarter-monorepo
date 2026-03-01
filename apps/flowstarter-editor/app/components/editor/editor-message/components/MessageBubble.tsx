import { memo } from 'react';
import type { ReactNode } from 'react';
import { useBubbleStyles } from '~/components/editor/editor-message/hooks';

interface MessageBubbleProps {
  children: ReactNode;
  isDark: boolean;
  variant: 'user' | 'assistant';
}

export const MessageBubble = memo(({ children, isDark, variant }: MessageBubbleProps) => {
  const styles = useBubbleStyles({ isDark, variant });

  return (
    <div
      className="max-w-full rounded-2xl rounded-tl-md px-4 py-3 transition-all duration-200"
      style={{
        ...styles,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
