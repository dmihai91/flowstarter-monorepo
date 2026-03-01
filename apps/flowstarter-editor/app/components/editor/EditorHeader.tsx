/**
 * Editor Header (top toolbar)
 *
 * Contains: logo + back, chat toggle, preview/code switch + TEAM badge, publish, theme toggle, user name + avatar.
 */

import { ArrowLeft, MessageSquare, Upload } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { UserButton, useUser } from '@clerk/remix';
import { LogoIcon, ThemeToggle } from '@flowstarter/flow-design-system';
import { themeStore, setTheme } from '~/lib/stores/theme';
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
  const { user } = useUser();
  const firstName = user?.firstName || '';

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
      {/* Left: logo/back + chat toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          title="Back to dashboard"
        >
          <ArrowLeft size={16} />
          <LogoIcon size="sm" />
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

      {/* Center: preview/code switch + TEAM badge */}
      <div className="hidden md:flex items-center gap-3">
        {permissions.canTogglePreviewCode && (
          <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5">
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
        {permissions.role === 'team' && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            Team
          </span>
        )}
      </div>

      {/* Right: publish, theme, user name + avatar */}
      <div className="flex items-center gap-3">
        {permissions.canPublish && (
          <button
            onClick={onPublish}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
          >
            <Upload size={14} />
            {hasUnpublishedChanges ? 'Publish Changes' : 'Publish'}
          </button>
        )}

        <ThemeToggle theme={theme} onThemeChange={setTheme} />

        <div className="flex items-center gap-2">
          {firstName && (
            <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-zinc-300">
              {firstName}
            </span>
          )}
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
