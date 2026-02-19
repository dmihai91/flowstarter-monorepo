import { memo } from 'react';
import { formatDateTime } from '~/components/editor/editor-message/utils/formatDateTime';
import { useMessageStyles } from '~/components/editor/editor-message/hooks';

interface MessageTimestampProps {
  timestamp: number;
  showDelivered?: boolean;
  isDark: boolean;
}

export const MessageTimestamp = memo(({ timestamp, showDelivered = true, isDark }: MessageTimestampProps) => {
  const styles = useMessageStyles({ isDark });

  return (
    <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: styles.timestampColor }}>
      <span>{formatDateTime(timestamp)}</span>
      {showDelivered && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: styles.deliveredColor }}>
          <path
            d="M13.3333 4L6 11.3333L2.66667 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
});

MessageTimestamp.displayName = 'MessageTimestamp';
