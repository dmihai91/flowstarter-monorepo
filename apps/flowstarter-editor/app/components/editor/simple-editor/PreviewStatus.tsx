/**
 * PreviewStatus Component
 *
 * Shows Daytona preview status with auto-fix progress indicator.
 */

import { memo, useMemo } from 'react';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface PreviewStatusProps {
  status: string;
  error: string | null;
  autoFixAttempts?: number;
}

interface StatusConfig {
  icon: string;
  color: string;
  text: string;
}

const STATUS_CONFIGS: Record<string, (error: string | null) => StatusConfig> = {
  idle: () => ({
    icon: 'i-ph:play-circle',
    color: 'text-gray-400',
    text: t(EDITOR_LABEL_KEYS.PREVIEW_CLICK_START),
  }),
  creating: () => ({
    icon: 'i-svg-spinners:90-ring-with-bg',
    color: 'text-blue-400',
    text: t(EDITOR_LABEL_KEYS.STATUS_CREATING),
  }),
  starting: () => ({
    icon: 'i-svg-spinners:90-ring-with-bg',
    color: 'text-yellow-400',
    text: t(EDITOR_LABEL_KEYS.STATUS_STARTING),
  }),
  ready: () => ({
    icon: 'i-ph:check-circle',
    color: 'text-green-400',
    text: t(EDITOR_LABEL_KEYS.PREVIEW_READY),
  }),
  error: (error) => ({
    icon: 'i-ph:warning-circle',
    color: 'text-red-400',
    text: error || t(EDITOR_LABEL_KEYS.PREVIEW_ERROR),
  }),
};

export const PreviewStatus = memo(function PreviewStatus({
  status,
  error,
  autoFixAttempts = 0,
}: PreviewStatusProps) {
  const config = useMemo(() => {
    if (status === 'syncing') {
      const isFixing = autoFixAttempts > 0;
      return {
        icon: 'i-svg-spinners:90-ring-with-bg',
        color: isFixing ? 'text-yellow-400' : 'text-blue-400',
        text: isFixing
          ? `Auto-fixing build error (attempt ${autoFixAttempts}/3)...`
          : (error?.includes('Fixing build error') ? error : t(EDITOR_LABEL_KEYS.STATUS_SYNCING)),
      };
    }

    const configFn = STATUS_CONFIGS[status] || STATUS_CONFIGS.idle;
    return configFn(error);
  }, [status, error, autoFixAttempts]);

  return (
    <div className={`flex items-center gap-2 text-sm ${config.color}`}>
      <span className={config.icon} />
      <span className="truncate max-w-xs">{config.text}</span>
    </div>
  );
});
