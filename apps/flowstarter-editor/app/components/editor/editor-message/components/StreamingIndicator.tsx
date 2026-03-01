import { memo } from 'react';

interface StreamingIndicatorProps {
  isDark: boolean;
}

export const StreamingIndicator = memo(({ isDark }: StreamingIndicatorProps) => {
  return (
    <span
      className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
      style={{
        color: isDark ? 'rgba(77, 93, 217, 0.9)' : 'rgba(99, 102, 241, 0.85)',
        background: isDark ? 'rgba(77, 93, 217, 0.12)' : 'rgba(99, 102, 241, 0.08)',
        border: isDark ? '1px solid rgba(77, 93, 217, 0.2)' : '1px solid rgba(99, 102, 241, 0.15)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      Typing...
    </span>
  );
});

StreamingIndicator.displayName = 'StreamingIndicator';
