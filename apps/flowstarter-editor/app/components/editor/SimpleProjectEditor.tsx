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
import { buildFileTree, type FileNode } from '~/lib/utils/fileTree';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import { FileTreeItem } from './simple-editor/FileTreeItem';
import { EditorHeader } from './simple-editor/EditorHeader';
import { PreviewPanel } from './simple-editor/PreviewPanel';

interface SimpleProjectEditorProps {
  projectId: Id<'projects'>;
  projectName: string;
  onPublish?: () => void;
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
      <EditorHeader
        projectName={projectName}
        viewMode={viewMode}
        hasPendingChanges={hasPendingChanges}
        previewStatus={previewState.status}
        previewError={previewState.error}
        autoFixAttempts={autoFixAttempts}
        onViewModeChange={setViewMode}
        onStartPreview={startPreview}
        onStopPreview={stopPreview}
        onSave={handleSave}
        onPublish={onPublish}
      />

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
              <PreviewPanel
                previewUrl={previewState.previewUrl}
                status={previewState.status}
                error={previewState.error}
                isReady={isReady}
                autoFixAttempts={autoFixAttempts}
                onStartPreview={startPreview}
                onRefreshPreview={refreshPreview}
              />
            </Panel>
          )}
        </PanelGroup>
      </div>
    </div>
  );
}
