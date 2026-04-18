'use client';
import { X } from 'lucide-react';
import type { EditorContext } from '@/lib/client-requests/types';

interface Props {
  context: EditorContext;
  onClose: () => void;
}

export function EditorContextDrawer({ context, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg h-full bg-white dark:bg-[rgba(18,12,42,0.98)] border-l border-gray-200/80 dark:border-white/[0.06] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Editor Context
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          {context.capabilityReason && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                Why editor escalated
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                {context.capabilityReason}
              </p>
            </div>
          )}
          {context.activeFile && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-white/40 mb-1">
                Active File
              </p>
              <code className="text-sm text-gray-800 dark:text-white/80 bg-gray-50 dark:bg-white/[0.06] px-2 py-1 rounded-lg">
                {context.activeFile}
              </code>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-white/40 mb-1.5">
              Full Context JSON
            </p>
            <pre className="text-xs text-gray-700 dark:text-white/70 bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3 overflow-auto whitespace-pre-wrap border border-gray-100 dark:border-white/[0.06]">
              {JSON.stringify(context, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
