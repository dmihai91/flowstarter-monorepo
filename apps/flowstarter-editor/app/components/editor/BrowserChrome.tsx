/**
 * Browser Chrome Bar
 *
 * Sits at the top of the preview/code panel with traffic light dots,
 * URL bar, and LIVE badge.
 */

import { Lock } from 'lucide-react';

interface BrowserChromeProps {
  url?: string;
  isLive?: boolean;
  isLoading?: boolean;
  /** When showing code, display file path instead of URL */
  filePath?: string;
}

export function BrowserChrome({ url, isLive, isLoading, filePath }: BrowserChromeProps) {
  const displayText = filePath || url || 'yoursite.com';

  return (
    <div className="h-10 flex items-center gap-3 px-4 bg-gray-50 border-b border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 shrink-0">
      {/* Traffic light dots */}
      <div className="flex gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
      </div>

      {/* URL / file path bar */}
      <div className="flex-1 flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-md px-3 py-1 text-sm text-gray-500 dark:text-zinc-400 min-w-0">
        {!filePath && <Lock size={12} className="shrink-0" />}
        <span className="truncate">{displayText}</span>
      </div>

      {/* LIVE badge */}
      {isLive && !isLoading && (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-medium shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </span>
      )}

      {isLoading && (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-xs font-medium shrink-0">
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
          Loading...
        </span>
      )}
    </div>
  );
}
