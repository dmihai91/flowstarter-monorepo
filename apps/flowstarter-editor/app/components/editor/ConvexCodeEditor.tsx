/**
 * Convex Code Editor
 *
 * A Monaco-based code editor that works directly with Convex files.
 * No WebContainer dependency - uses Daytona for preview rendering.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../../convex/_generated/api';
// eslint-disable-next-line no-restricted-imports
import type { Id } from '../../../convex/_generated/dataModel';
import { MonacoEditor, type EditorDocument } from './monaco/MonacoEditor';
import { useThemeStyles, getColors } from './hooks';
import { buildFileTree, getFileIcon, type FileNode } from '~/lib/utils/fileTree';

interface ConvexCodeEditorProps {
  projectId: Id<'projects'>;
  onSaveComplete?: () => void;
}

// File tree item component
function FileTreeItem({
  node,
  selectedPath,
  onSelect,
  depth = 0,
  isDark,
  colors,
}: {
  node: FileNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth?: number;
  isDark: boolean;
  colors: ReturnType<typeof getColors>;
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
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          paddingLeft: `${depth * 12 + 8}px`,
          textAlign: 'left',
          fontSize: '13px',
          background: isSelected ? colors.surfaceSelected : 'transparent',
          color: isSelected ? colors.textPrimary : colors.textMuted,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = colors.surfaceHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <span className={`${iconClass} flex-shrink-0`} style={{ fontSize: '16px' }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
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
              isDark={isDark}
              colors={colors}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ConvexCodeEditor({ projectId, onSaveComplete }: ConvexCodeEditorProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Query files from Convex
  const files = useQuery(api.files.getProjectFiles, { projectId });
  const updateFileContent = useMutation(api.files.updateContent);

  // Build file tree
  const fileTree = useMemo(() => {
    if (!files) {
      return [];
    }

    return buildFileTree(files.map((f) => ({ path: f.path, type: f.type })));
  }, [files]);

  // Get selected file content
  const selectedFile = useMemo(() => {
    if (!selectedFilePath || !files) {
      return null;
    }

    return files.find((f) => f.path === selectedFilePath);
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

    setIsSaving(true);

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

      onSaveComplete?.();
      console.log(`[ConvexCodeEditor] Saved ${selectedFile.path}`);
    } catch (error) {
      console.error('[ConvexCodeEditor] Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, pendingChanges, projectId, updateFileContent, onSaveComplete]);

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

  const hasPendingChanges = selectedFilePath ? pendingChanges.has(selectedFilePath) : false;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: colors.bgTertiary }}>
      {/* File tabs / toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: colors.bgSecondary,
          borderBottom: colors.borderLight,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedFilePath && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                background: colors.surfaceLight,
                borderRadius: '6px',
                fontSize: '13px',
                color: colors.textSecondary,
              }}
            >
              <span className="i-ph:file-code" style={{ fontSize: '14px' }} />
              <span>{selectedFilePath.split('/').pop()}</span>
              {hasPendingChanges && <span style={{ color: isDark ? '#fbbf24' : '#d97706', marginLeft: '4px' }}>*</span>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasPendingChanges && (
            <span style={{ fontSize: '12px', color: isDark ? '#fbbf24' : '#d97706' }}>Unsaved</span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasPendingChanges || isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: hasPendingChanges ? colors.primaryGradient : colors.surfaceLight,
              color: hasPendingChanges ? (isDark ? '#0a0a0f' : '#ffffff') : colors.textMuted,
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: hasPendingChanges ? 'pointer' : 'not-allowed',
              opacity: hasPendingChanges ? 1 : 0.5,
              transition: 'opacity 0.2s',
            }}
          >
            {isSaving ? (
              <>
                <span className="i-svg-spinners:90-ring-with-bg" style={{ fontSize: '14px' }} />
                Saving...
              </>
            ) : (
              <>
                <span className="i-ph:floppy-disk" style={{ fontSize: '14px' }} />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PanelGroup direction="horizontal">
          {/* File tree sidebar */}
          <Panel defaultSize={20} minSize={15} maxSize={35}>
            <div
              style={{
                height: '100%',
                background: colors.bgSecondary,
                borderRight: colors.borderLight,
                overflow: 'auto',
              }}
            >
              <div style={{ padding: '8px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: colors.textSubtle,
                    marginBottom: '8px',
                    padding: '0 8px',
                  }}
                >
                  Files
                </div>
                {fileTree.map((node) => (
                  <FileTreeItem
                    key={node.path}
                    node={node}
                    selectedPath={selectedFilePath}
                    onSelect={setSelectedFilePath}
                    isDark={isDark}
                    colors={colors}
                  />
                ))}
                {fileTree.length === 0 && (
                  <div
                    style={{
                      color: colors.textSubtle,
                      fontSize: '13px',
                      padding: '16px 8px',
                      textAlign: 'center',
                    }}
                  >
                    {files === undefined ? 'Loading files...' : 'No files yet'}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle
            style={{
              width: '4px',
              background: colors.surfaceSubtle,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as unknown as HTMLElement;
              target.style.background = isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.3)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as unknown as HTMLElement;
              target.style.background = colors.surfaceSubtle;
            }}
          />

          {/* Monaco editor */}
          <Panel defaultSize={80} minSize={50}>
            <div style={{ height: '100%', background: colors.bgTertiary }}>
              {editorDoc ? (
                <MonacoEditor doc={editorDoc} onChange={handleFileChange} onSave={handleSave} />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: colors.textSubtle,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <span
                      className="i-ph:file-code"
                      style={{ fontSize: '48px', display: 'block', marginBottom: '12px', opacity: 0.5 }}
                    />
                    <p style={{ fontSize: '14px' }}>Select a file to edit</p>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
