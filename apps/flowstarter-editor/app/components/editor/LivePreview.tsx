/**
 * Live Preview Panel (right side)
 *
 * Full iframe loading Daytona sandbox preview URL.
 * Includes BrowserChrome bar at top.
 */

import { Globe, RefreshCw } from 'lucide-react';
import { Spinner } from '@flowstarter/flow-design-system';
import { BrowserChrome } from './BrowserChrome';

interface LivePreviewProps {
  previewUrl: string | null;
  isLoading: boolean;
  isLive: boolean;
  error: string | null;
  domainName?: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onRefresh: () => void;
  onRetry: () => void;
}

export function LivePreview({
  previewUrl,
  isLoading,
  isLive,
  error,
  domainName,
  iframeRef,
  onRefresh,
  onRetry,
}: LivePreviewProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Browser chrome */}
      <BrowserChrome
        url={domainName || previewUrl || undefined}
        isLive={isLive}
        isLoading={isLoading}
      />

      {/* Content */}
      <div className="flex-1 relative">
        {/* Loading state */}
        {isLoading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900">
            <Spinner size="md" />
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-3">Starting preview...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900">
            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-3">{error}</p>
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm transition-colors"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* Empty state — no URL yet, not loading, no error */}
        {!previewUrl && !isLoading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Globe size={24} className="text-gray-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-zinc-300 mb-1">
              Preview will appear here once you start building
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Describe the client&apos;s business in the chat to get started
            </p>
          </div>
        )}

        {/* Preview iframe */}
        {previewUrl && (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Site preview"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        )}

        {/* Refresh overlay button */}
        {previewUrl && !isLoading && (
          <button
            onClick={onRefresh}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 shadow-sm transition-colors"
            title="Refresh preview"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
