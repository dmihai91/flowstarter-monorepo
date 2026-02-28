/**
 * Editor Header (top toolbar)
 *
 * Contains: back button, chat toggle, preview/code switch, publish, theme, user avatar.
 */

import { ArrowLeft, MessageSquare, Sun, Moon } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { UserButton } from '@clerk/remix';
import { themeStore } from '~/lib/stores/theme';
import type { EditorPermissions } from '~/lib/hooks/useEditorRole';

interface EditorHeaderProps {
  permissions: EditorPermissions;
  activePanel: 'preview' | 'code';
  onTogglePanel: (panel: 'preview' | 'code') => void;
  isChatVisible: boolean;
  onToggleChat: () => void;
  onPublish: () => void;
  onBack: () => void;
  hasUnpublishedChanges?: boolean;
}

export function EditorHeader({
  permissions,
  activePanel,
  onTogglePanel,
  isChatVisible,
  onToggleChat,
  onPublish,
  onBack,
  hasUnpublishedChanges,
}: EditorHeaderProps) {
  const theme = useStore(themeStore);

  const toggleTheme = () => {
    const current = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    themeStore.set(current === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
      {/* Left: back + chat toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          title="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={onToggleChat}
          className={`p-1.5 rounded-md transition-colors ${
            isChatVisible
              ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800'
          }`}
          title="Toggle chat panel"
        >
          <MessageSquare size={18} />
        </button>
      </div>

      {/* Center: preview/code switch (team only) */}
      {permissions.canTogglePreviewCode && (
        <div className="hidden md:flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button
            onClick={() => onTogglePanel('preview')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              activePanel === 'preview'
                ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-zinc-100 font-medium'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => onTogglePanel('code')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              activePanel === 'code'
                ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-zinc-100 font-medium'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            Code
          </button>
        </div>
      )}

      {/* Right: publish, theme, user */}
      <div className="flex items-center gap-3">
        {permissions.canPublish && (
          <button
            onClick={onPublish}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
          >
            {hasUnpublishedChanges ? 'Publish Changes' : 'Publish'}
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          title="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
      </div>
    </header>
  );
}
