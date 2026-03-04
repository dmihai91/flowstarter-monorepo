/**
 * PreviewPanel Component
 *
 * Daytona preview panel with address bar, iframe, and status placeholders.
 */

import { memo } from 'react';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import { PreviewStatus } from './PreviewStatus';

interface PreviewPanelProps {
  previewUrl: string | null;
  status: string;
  error: string | null;
  isReady: boolean;
  autoFixAttempts: number;
  onStartPreview: () => void;
  onRefreshPreview: () => void;
}

export const PreviewPanel = memo(function PreviewPanel({
  previewUrl,
  status,
  error,
  isReady,
  autoFixAttempts,
  onStartPreview,
  onRefreshPreview,
}: PreviewPanelProps) {
  return (
    <div className="h-full bg-flowstarter-elements-bg-depth-1 flex flex-col">
      {/* Address bar */}
      <div className="h-10 flex items-center justify-between px-3 bg-flowstarter-elements-preview-addressBar-background border-b border-flowstarter-elements-borderColor">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          {previewUrl && (
            <span className="text-xs text-flowstarter-elements-preview-addressBar-text ml-2 truncate max-w-xs">
              {previewUrl}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isReady && (
            <>
              <button
                onClick={onRefreshPreview}
                className="p-1.5 hover:bg-flowstarter-elements-preview-addressBar-backgroundHover rounded transition-colors"
                title={t(EDITOR_LABEL_KEYS.PREVIEW_REFRESH)}
              >
                <span className="i-ph:arrow-clockwise text-flowstarter-elements-icon-secondary" />
              </button>
              <a
                href={previewUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-flowstarter-elements-preview-addressBar-backgroundHover rounded transition-colors"
                title={t(EDITOR_LABEL_KEYS.PREVIEW_OPEN_TAB)}
              >
                <span className="i-ph:arrow-square-out text-flowstarter-elements-icon-secondary" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 relative">
        {isReady && previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0 bg-white"
            title="Preview"
            sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-flowstarter-elements-bg-depth-2">
            <div className="text-center">
              {status === 'idle' ? (
                <>
                  <span className="i-ph:play-circle text-6xl text-flowstarter-elements-textTertiary mb-4 block" />
                  <p className="text-flowstarter-elements-textSecondary mb-4">
                    {t(EDITOR_LABEL_KEYS.PREVIEW_CLICK_START)}
                  </p>
                  <button
                    onClick={onStartPreview}
                    className="px-6 py-3 bg-flowstarter-accent-purple text-white rounded-lg hover:opacity-90 transition-colors"
                  >
                    {t(EDITOR_LABEL_KEYS.PREVIEW_START)}
                  </button>
                </>
              ) : status === 'error' ? (
                <>
                  <span className="i-ph:warning-circle text-6xl text-red-400 mb-4 block" />
                  <p className="text-red-400 mb-2">{t(EDITOR_LABEL_KEYS.PREVIEW_FAILED)}</p>
                  <p className="text-flowstarter-elements-textTertiary text-sm mb-4">{error}</p>
                  <button
                    onClick={onStartPreview}
                    className="px-6 py-3 bg-flowstarter-accent-purple text-white rounded-lg hover:opacity-90 transition-colors"
                  >
                    {t(EDITOR_LABEL_KEYS.COMMON_RETRY)}
                  </button>
                </>
              ) : (
                <>
                  <span className="i-svg-spinners:90-ring-with-bg text-4xl text-flowstarter-accent-purple mb-4 block" />
                  <PreviewStatus status={status} error={error} autoFixAttempts={autoFixAttempts} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
