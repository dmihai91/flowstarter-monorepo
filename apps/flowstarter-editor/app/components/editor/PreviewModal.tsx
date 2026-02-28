/**
 * Preview Modal (mobile)
 *
 * Full-screen overlay for viewing the live preview on mobile devices.
 */

import { X } from 'lucide-react';
import { BrowserChrome } from './BrowserChrome';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewUrl: string | null;
  isLive: boolean;
  domainName?: string;
}

export function PreviewModal({
  isOpen,
  onClose,
  previewUrl,
  isLive,
  domainName,
}: PreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col animate-slide-up">
      {/* Header with close */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-zinc-800">
        <BrowserChrome
          url={domainName || previewUrl || undefined}
          isLive={isLive}
        />
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors ml-2"
        >
          <X size={20} />
        </button>
      </div>

      {/* Preview iframe */}
      <div className="flex-1">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="Site preview"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500 dark:text-zinc-400">Preview not available</p>
          </div>
        )}
      </div>
    </div>
  );
}
