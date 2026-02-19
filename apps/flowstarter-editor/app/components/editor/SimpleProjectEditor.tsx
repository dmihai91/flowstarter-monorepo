/**
 * Simplified Project Editor
 *
 * A cleaner editor implementation using:
 * - Monaco editor for code editing
 * - Daytona VM for preview rendering
 * - Simple file tree for navigation
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../../convex/_generated/api';
// eslint-disable-next-line no-restricted-imports
import type { Id } from '../../../convex/_generated/dataModel';
import { MonacoEditor, type EditorDocument } from './monaco/MonacoEditor';
import { useDaytonaPreview, createAutoFixHandler } from '~/lib/hooks/useDaytonaPreview';
import { buildFileTree, getFileIcon, type FileNode } from '~/lib/utils/fileTree';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface SimpleProjectEditorProps {
  projectId: Id<'projects'>;
  projectName: string;
  onPublish?: () => void;
}

// File tree item component
function FileTreeItem({
  node,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  node: FileNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const isSelected = node.path === selectedPath;
  const isDirectory = node.type === 'directory';

  const handleClick = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(node.path);
    }
  };

  const iconClass = getFileIcon(node.name, isDirectory, isExpanded);

  return (
    <div>
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center gap-2 px-2 py-1 text-left text-sm
          hover:bg-flowstarter-elements-item-backgroundActive rounded transition-colors
          ${isSelected ? 'bg-flowstarter-elements-item-backgroundAccent text-flowstarter-accent-purple' : 'text-flowstarter-elements-textSecondary'}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className={`${iconClass} text-base flex-shrink-0`} />
        <span className="truncate">{node.name}</span>
      </button>

      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Preview status indicator
function PreviewStatus({
  status,
  error,
  autoFixAttempts = 0,
}: {
  status: string;
  error: string | null;
  autoFixAttempts?: number;
}) {
  // Show auto-fix progress in the status
  const getStatusText = () => {
    if (status === 'syncing' && autoFixAttempts > 0) {
      return `Auto-fixing build error (attempt ${autoFixAttempts}/3)...`;
    }

    if (status === 'error' && error?.includes('Fixing build error')) {
      return error;
    }

    return null;
  };

  const autoFixText = getStatusText();

  const statusConfig = {
    idle: { icon: 'i-ph:play-circle', color: 'text-gray-400', text: t(EDITOR_LABEL_KEYS.PREVIEW_CLICK_START) },
    creating: {
      icon: 'i-svg-spinners:90-ring-with-bg',
      color: 'text-blue-400',
      text: t(EDITOR_LABEL_KEYS.STATUS_CREATING),
    },
    syncing: {
      icon: 'i-svg-spinners:90-ring-with-bg',
      color: autoFixAttempts > 0 ? 'text-yellow-400' : 'text-blue-400',
      text: autoFixText || t(EDITOR_LABEL_KEYS.STATUS_SYNCING),
    },
    starting: {
      icon: 'i-svg-spinners:90-ring-with-bg',
      color: 'text-yellow-400',
      text: t(EDITOR_LABEL_KEYS.STATUS_STARTING),
    },
    ready: { icon: 'i-ph:check-circle', color: 'text-green-400', text: t(EDITOR_LABEL_KEYS.PREVIEW_READY) },
    error: { icon: 'i-ph:warning-circle', color: 'text-red-400', text: error || t(EDITOR_LABEL_KEYS.PREVIEW_ERROR) },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.idle;

  return (
    <div className={`flex items-center gap-2 text-sm ${config.color}`}>
      <span className={config.icon} />
      <span className="truncate max-w-xs">{config.text}</span>
    </div>
  );
}

export function SimpleProjectEditor({ projectId, projectName, onPublish }: SimpleProjectEditorProps) {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');

  // Query files from Convex
  const files = useQuery(api.files.getProjectFiles, { projectId });
  const updateFileContent = useMutation(api.files.updateContent);

  // Daytona preview hook with auto-fix for build errors
  const {
    state: previewState,
    startPreview,
    stopPreview,
    refreshPreview,
    isReady,
    autoFixAttempts,
  } = useDaytonaPreview({
    projectId,
    autoStart: false,

    // Enable auto-fix for build errors - LLM will attempt to fix syntax errors
    onBuildError: createAutoFixHandler(),
    maxAutoFixAttempts: 3,
  });

  // Build file tree
  const fileTree = useMemo(() => {
    if (!files) {
      return [];
    }

    return buildFileTree(files.map((f: { path: string; type: string }) => ({ path: f.path, type: f.type })));
  }, [files]);

  // Get selected file content
  const selectedFile = useMemo(() => {
    if (!selectedFilePath || !files) {
      return null;
    }

    return files.find((f: { path: string }) => f.path === selectedFilePath);
  }, [selectedFilePath, files]);

  // Create editor document from selected file
  const editorDoc: EditorDocument | null = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    // Check for pending changes
    const pendingContent = pendingChanges.get(selectedFile.path);

    return {
      value: pendingContent ?? selectedFile.content,
      filePath: selectedFile.path,
      isBinary: selectedFile.isBinary,
    };
  }, [selectedFile, pendingChanges]);

  // Handle file content change
  const handleFileChange = useCallback(
    (content: string) => {
      if (!selectedFilePath) {
        return;
      }

      setPendingChanges((prev) => {
        const next = new Map(prev);
        next.set(selectedFilePath, content);

        return next;
      });
    },
    [selectedFilePath],
  );

  // Save file to Convex
  const handleSave = useCallback(async () => {
    if (!selectedFile || !pendingChanges.has(selectedFile.path)) {
      return;
    }

    const content = pendingChanges.get(selectedFile.path);

    if (!content) {
      return;
    }

    try {
      await updateFileContent({
        projectId,
        path: selectedFile.path,
        content,
      });

      // Clear pending changes for this file
      setPendingChanges((prev) => {
        const next = new Map(prev);
        next.delete(selectedFile.path);

        return next;
      });

      // Refresh preview if ready
      if (isReady) {
        refreshPreview();
      }

      console.log(`[SimpleProjectEditor] Saved ${selectedFile.path}`);
    } catch (error) {
      console.error('[SimpleProjectEditor] Failed to save:', error);
    }
  }, [selectedFile, pendingChanges, projectId, updateFileContent, isReady, refreshPreview]);

  // Auto-select first file
  useEffect(() => {
    if (!selectedFilePath && fileTree.length > 0) {
      // Find first file (not directory)
      const findFirstFile = (nodes: FileNode[]): string | null => {
        for (const node of nodes) {
          if (node.type === 'file') {
            return node.path;
          }

          if (node.children) {
            const found = findFirstFile(node.children);

            if (found) {
              return found;
            }
          }
        }
        return null;
      };

      const firstFile = findFirstFile(fileTree);

      if (firstFile) {
        setSelectedFilePath(firstFile);
      }
    }
  }, [fileTree, selectedFilePath]);

  const hasPendingChanges = pendingChanges.size > 0;

  return (
    <div className="h-screen flex flex-col bg-flowstarter-elements-bg-depth-1">
      {/* Header */}
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
              onClick={() => setViewMode('code')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'code'
                  ? 'bg-flowstarter-elements-bg-depth-4 text-flowstarter-elements-textPrimary'
                  : 'text-flowstarter-elements-textSecondary hover:text-flowstarter-elements-textPrimary'
              }`}
            >
              <span className="i-ph:code mr-1" />
              {t(EDITOR_LABEL_KEYS.VIEW_CODE)}
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'split'
                  ? 'bg-flowstarter-elements-bg-depth-4 text-flowstarter-elements-textPrimary'
                  : 'text-flowstarter-elements-textSecondary hover:text-flowstarter-elements-textPrimary'
              }`}
            >
              <span className="i-ph:columns mr-1" />
              {t(EDITOR_LABEL_KEYS.VIEW_SPLIT)}
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'preview'
                  ? 'bg-flowstarter-elements-bg-depth-4 text-flowstarter-elements-textPrimary'
                  : 'text-flowstarter-elements-textSecondary hover:text-flowstarter-elements-textPrimary'
              }`}
            >
              <span className="i-ph:eye mr-1" />
              {t(EDITOR_LABEL_KEYS.VIEW_PREVIEW)}
            </button>
          </div>

          {/* Preview controls */}
          {previewState.status === 'idle' ? (
            <button
              onClick={startPreview}
              className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
            >
              <span className="i-ph:play" />
              {t(EDITOR_LABEL_KEYS.PREVIEW_START)}
            </button>
          ) : previewState.status === 'ready' ? (
            <button
              onClick={stopPreview}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
            >
              <span className="i-ph:stop" />
              {t(EDITOR_LABEL_KEYS.PREVIEW_STOP)}
            </button>
          ) : (
            <PreviewStatus status={previewState.status} error={previewState.error} autoFixAttempts={autoFixAttempts} />
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
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

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* File tree sidebar */}
          {viewMode !== 'preview' && (
            <>
              <Panel defaultSize={15} minSize={10} maxSize={30}>
                <div className="h-full bg-flowstarter-elements-bg-depth-2 border-r border-flowstarter-elements-borderColor overflow-auto">
                  <div className="p-2">
                    <div className="text-xs text-flowstarter-elements-textTertiary uppercase tracking-wider mb-2 px-2">
                      {t(EDITOR_LABEL_KEYS.FILES_LABEL)}
                    </div>
                    {fileTree.map((node) => (
                      <FileTreeItem
                        key={node.path}
                        node={node}
                        selectedPath={selectedFilePath}
                        onSelect={setSelectedFilePath}
                      />
                    ))}
                    {fileTree.length === 0 && (
                      <div className="text-flowstarter-elements-textTertiary text-sm px-2 py-4 text-center">
                        {t(EDITOR_LABEL_KEYS.EDITOR_NO_FILES)}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="w-1 bg-flowstarter-elements-borderColor hover:bg-flowstarter-accent-purple/50 transition-colors" />
            </>
          )}

          {/* Editor */}
          {viewMode !== 'preview' && (
            <>
              <Panel defaultSize={viewMode === 'split' ? 42 : 85} minSize={30}>
                <div className="h-full bg-flowstarter-elements-bg-depth-1">
                  {editorDoc ? (
                    <MonacoEditor doc={editorDoc} onChange={handleFileChange} onSave={handleSave} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-flowstarter-elements-textTertiary">
                      <div className="text-center">
                        <span className="i-ph:file-code text-4xl mb-2 block" />
                        <p>{t(EDITOR_LABEL_KEYS.EDITOR_SELECT_FILE)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
              {viewMode === 'split' && (
                <PanelResizeHandle className="w-1 bg-flowstarter-elements-borderColor hover:bg-flowstarter-accent-purple/50 transition-colors" />
              )}
            </>
          )}

          {/* Preview */}
          {viewMode !== 'code' && (
            <Panel defaultSize={viewMode === 'split' ? 43 : 100} minSize={20}>
              <div className="h-full bg-flowstarter-elements-bg-depth-1 flex flex-col">
                {/* Preview header */}
                <div className="h-10 flex items-center justify-between px-3 bg-flowstarter-elements-preview-addressBar-background border-b border-flowstarter-elements-borderColor">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    {previewState.previewUrl && (
                      <span className="text-xs text-flowstarter-elements-preview-addressBar-text ml-2 truncate max-w-xs">
                        {previewState.previewUrl}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isReady && (
                      <>
                        <button
                          onClick={refreshPreview}
                          className="p-1.5 hover:bg-flowstarter-elements-preview-addressBar-backgroundHover rounded transition-colors"
                          title={t(EDITOR_LABEL_KEYS.PREVIEW_REFRESH)}
                        >
                          <span className="i-ph:arrow-clockwise text-flowstarter-elements-icon-secondary" />
                        </button>
                        <a
                          href={previewState.previewUrl || '#'}
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

                {/* Preview iframe */}
                <div className="flex-1 relative">
                  {isReady && previewState.previewUrl ? (
                    <iframe
                      src={previewState.previewUrl}
                      className="w-full h-full border-0 bg-white"
                      title="Preview"
                      sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-flowstarter-elements-bg-depth-2">
                      <div className="text-center">
                        {previewState.status === 'idle' ? (
                          <>
                            <span className="i-ph:play-circle text-6xl text-flowstarter-elements-textTertiary mb-4 block" />
                            <p className="text-flowstarter-elements-textSecondary mb-4">
                              {t(EDITOR_LABEL_KEYS.PREVIEW_CLICK_START)}
                            </p>
                            <button
                              onClick={startPreview}
                              className="px-6 py-3 bg-flowstarter-accent-purple text-white rounded-lg hover:opacity-90 transition-colors"
                            >
                              {t(EDITOR_LABEL_KEYS.PREVIEW_START)}
                            </button>
                          </>
                        ) : previewState.status === 'error' ? (
                          <>
                            <span className="i-ph:warning-circle text-6xl text-red-400 mb-4 block" />
                            <p className="text-red-400 mb-2">{t(EDITOR_LABEL_KEYS.PREVIEW_FAILED)}</p>
                            <p className="text-flowstarter-elements-textTertiary text-sm mb-4">{previewState.error}</p>
                            <button
                              onClick={startPreview}
                              className="px-6 py-3 bg-flowstarter-accent-purple text-white rounded-lg hover:opacity-90 transition-colors"
                            >
                              {t(EDITOR_LABEL_KEYS.COMMON_RETRY)}
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="i-svg-spinners:90-ring-with-bg text-4xl text-flowstarter-accent-purple mb-4 block" />
                            <PreviewStatus
                              status={previewState.status}
                              error={previewState.error}
                              autoFixAttempts={autoFixAttempts}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          )}
        </PanelGroup>
      </div>
    </div>
  );
}
