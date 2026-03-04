/**
 * EditorHeader Component
 *
 * Top toolbar for the simple project editor with project name,
 * view mode toggle, preview controls, save, and publish buttons.
 */

import { memo } from 'react';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import { PreviewStatus } from './PreviewStatus';

type ViewMode = 'split' | 'code' | 'preview';

interface EditorHeaderProps {
  projectName: string;
  viewMode: ViewMode;
  hasPendingChanges: boolean;
  previewStatus: string;
  previewError: string | null;
  autoFixAttempts: number;
  onViewModeChange: (mode: ViewMode) => void;
  onStartPreview: () => void;
  onStopPreview: () => void;
  onSave: () => void;
  onPublish?: () => void;
}

export const EditorHeader = memo(function EditorHeader({
  projectName,
  viewMode,
  hasPendingChanges,
  previewStatus,
  previewError,
  autoFixAttempts,
  onViewModeChange,
  onStartPreview,
  onStopPreview,
  onSave,
  onPublish,
}: EditorHeaderProps) {
  const activeClass = 'bg-flowstarter-elements-bg-depth-4 text-flowstarter-elements-textPrimary';
  const inactiveClass = 'text-flowstarter-elements-textSecondary hover:text-flowstarter-elements-textPrimary';

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-flowstarter-elements-borderColor bg-flowstarter-elements-bg-depth-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-flowstarter-accent-purple to-cyan-400 flex items-center justify-center">
            <span className="i-ph:rocket-launch text-white text-lg" />
          </div>
          <span className="font-semibold text-flowstarter-elements-textPrimary">{projectName}</span>
        </div>

        {hasPendingChanges && (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
            {t(EDITOR_LABEL_KEYS.EDITOR_UNSAVED)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* View mode toggle */}
        <div className="flex items-center bg-flowstarter-elements-bg-depth-3 rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange('code')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${viewMode === 'code' ? activeClass : inactiveClass}`}
          >
            <span className="i-ph:code mr-1" />
            {t(EDITOR_LABEL_KEYS.VIEW_CODE)}
          </button>
          <button
            onClick={() => onViewModeChange('split')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${viewMode === 'split' ? activeClass : inactiveClass}`}
          >
            <span className="i-ph:columns mr-1" />
            {t(EDITOR_LABEL_KEYS.VIEW_SPLIT)}
          </button>
          <button
            onClick={() => onViewModeChange('preview')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${viewMode === 'preview' ? activeClass : inactiveClass}`}
          >
            <span className="i-ph:eye mr-1" />
            {t(EDITOR_LABEL_KEYS.VIEW_PREVIEW)}
          </button>
        </div>

        {/* Preview controls */}
        {previewStatus === 'idle' ? (
          <button
            onClick={onStartPreview}
            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
          >
            <span className="i-ph:play" />
            {t(EDITOR_LABEL_KEYS.PREVIEW_START)}
          </button>
        ) : previewStatus === 'ready' ? (
          <button
            onClick={onStopPreview}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
          >
            <span className="i-ph:stop" />
            {t(EDITOR_LABEL_KEYS.PREVIEW_STOP)}
          </button>
        ) : (
          <PreviewStatus status={previewStatus} error={previewError} autoFixAttempts={autoFixAttempts} />
        )}

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={!hasPendingChanges}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            hasPendingChanges
              ? 'bg-flowstarter-accent-purple text-white hover:opacity-90'
              : 'bg-flowstarter-elements-bg-depth-3 text-flowstarter-elements-textTertiary cursor-not-allowed'
          }`}
        >
          <span className="i-ph:floppy-disk" />
          {t(EDITOR_LABEL_KEYS.COMMON_SAVE)}
        </button>

        {/* Publish button */}
        {onPublish && (
          <button
            onClick={onPublish}
            className="px-4 py-2 bg-gradient-to-r from-flowstarter-accent-purple to-cyan-400 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span className="i-ph:rocket-launch" />
            {t(EDITOR_LABEL_KEYS.COMMON_PUBLISH)}
          </button>
        )}
      </div>
    </header>
  );
});
