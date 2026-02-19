/**
 * FileTree Component
 *
 * A file tree component for displaying and navigating project files.
 *
 * Refactored into modules:
 * - types.ts: Type definitions and constants
 * - utils.ts: File list building and sorting utilities
 * - NodeButton.tsx: Base button component
 * - InlineInput.tsx: Inline text input for creating files/folders
 * - ContextMenuItem.tsx: Styled context menu item
 * - FileContextMenu.tsx: Context menu with file operations
 * - FileNode.tsx: File node component
 * - FolderNode.tsx: Folder node component
 */

import { memo, useEffect, useMemo, useState } from 'react';
import { classNames } from '~/utils/classNames';
import { renderLogger, createScopedLogger } from '~/utils/logger';
import { DEFAULT_HIDDEN_FILES, type FileTreeProps, type FileNode as FileNodeType, type FolderNode as FolderNodeType } from './types';
import { buildFileList } from './utils';
import { FileNode } from './FileNode';
import { FolderNode } from './FolderNode';

const logger = createScopedLogger('FileTree');

export const FileTree = memo(
  ({
    files = {},
    onFileSelect,
    selectedFile,
    rootFolder,
    hideRoot = false,
    collapsed = false,
    allowFolderSelection = false,
    hiddenFiles,
    className,
    unsavedFiles,
    fileHistory = {},
  }: FileTreeProps) => {
    renderLogger.trace('FileTree');

    const computedHiddenFiles = useMemo(() => [...DEFAULT_HIDDEN_FILES, ...(hiddenFiles ?? [])], [hiddenFiles]);

    const fileList = useMemo(() => {
      return buildFileList(files, rootFolder, hideRoot, computedHiddenFiles);
    }, [files, rootFolder, hideRoot, computedHiddenFiles]);

    const [collapsedFolders, setCollapsedFolders] = useState(() => {
      return collapsed
        ? new Set(fileList.filter((item) => item.kind === 'folder').map((item) => item.fullPath))
        : new Set<string>();
    });

    useEffect(() => {
      if (collapsed) {
        setCollapsedFolders(new Set(fileList.filter((item) => item.kind === 'folder').map((item) => item.fullPath)));
        return;
      }

      setCollapsedFolders((prevCollapsed) => {
        const newCollapsed = new Set<string>();

        for (const folder of fileList) {
          if (folder.kind === 'folder' && prevCollapsed.has(folder.fullPath)) {
            newCollapsed.add(folder.fullPath);
          }
        }

        return newCollapsed;
      });
    }, [fileList, collapsed]);

    const filteredFileList = useMemo(() => {
      const list = [];

      let lastDepth = Number.MAX_SAFE_INTEGER;

      for (const fileOrFolder of fileList) {
        const depth = fileOrFolder.depth;

        // if the depth is equal we reached the end of the collaped group
        if (lastDepth === depth) {
          lastDepth = Number.MAX_SAFE_INTEGER;
        }

        // ignore collapsed folders
        if (collapsedFolders.has(fileOrFolder.fullPath)) {
          lastDepth = Math.min(lastDepth, depth);
        }

        // ignore files and folders below the last collapsed folder
        if (lastDepth < depth) {
          continue;
        }

        list.push(fileOrFolder);
      }

      return list;
    }, [fileList, collapsedFolders]);

    const toggleCollapseState = (fullPath: string) => {
      setCollapsedFolders((prevSet) => {
        const newSet = new Set(prevSet);

        if (newSet.has(fullPath)) {
          newSet.delete(fullPath);
        } else {
          newSet.add(fullPath);
        }

        return newSet;
      });
    };

    const onCopyPath = (fileOrFolder: FileNodeType | FolderNodeType) => {
      try {
        navigator.clipboard.writeText(fileOrFolder.fullPath);
      } catch (error) {
        logger.error(error);
      }
    };

    const onCopyRelativePath = (fileOrFolder: FileNodeType | FolderNodeType) => {
      try {
        navigator.clipboard.writeText(fileOrFolder.fullPath.substring((rootFolder || '').length));
      } catch (error) {
        logger.error(error);
      }
    };

    return (
      <div className={classNames('text-sm', className, 'overflow-y-auto modern-scrollbar')}>
        {filteredFileList.map((fileOrFolder) => {
          switch (fileOrFolder.kind) {
            case 'file': {
              return (
                <FileNode
                  key={fileOrFolder.id}
                  selected={selectedFile === fileOrFolder.fullPath}
                  file={fileOrFolder}
                  unsavedChanges={unsavedFiles instanceof Set && unsavedFiles.has(fileOrFolder.fullPath)}
                  fileHistory={fileHistory}
                  onCopyPath={() => {
                    onCopyPath(fileOrFolder);
                  }}
                  onCopyRelativePath={() => {
                    onCopyRelativePath(fileOrFolder);
                  }}
                  onClick={() => {
                    onFileSelect?.(fileOrFolder.fullPath);
                  }}
                />
              );
            }
            case 'folder': {
              return (
                <FolderNode
                  key={fileOrFolder.id}
                  folder={fileOrFolder}
                  selected={allowFolderSelection && selectedFile === fileOrFolder.fullPath}
                  collapsed={collapsedFolders.has(fileOrFolder.fullPath)}
                  onCopyPath={() => {
                    onCopyPath(fileOrFolder);
                  }}
                  onCopyRelativePath={() => {
                    onCopyRelativePath(fileOrFolder);
                  }}
                  onClick={() => {
                    toggleCollapseState(fileOrFolder.fullPath);
                  }}
                />
              );
            }
            default: {
              return undefined;
            }
          }
        })}
      </div>
    );
  },
);

export default FileTree;

// Re-export types
export type { FileTreeProps, FileNode, FolderNode, Node } from './types';
