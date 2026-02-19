/**
 * FileTree - FileContextMenu Component
 *
 * Context menu with file/folder operations.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import { path } from '~/utils/path';
import { classNames } from '~/utils/classNames';
import { createScopedLogger } from '~/utils/logger';
import { ContextMenuItem } from './ContextMenuItem';
import { InlineInput } from './InlineInput';

const logger = createScopedLogger('FileTree');

interface FileContextMenuProps {
  onCopyPath?: () => void;
  onCopyRelativePath?: () => void;
  fullPath: string;
  children: ReactNode;
}

export function FileContextMenu({ onCopyPath, onCopyRelativePath, fullPath, children }: FileContextMenuProps) {
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const depth = useMemo(() => fullPath.split('/').length, [fullPath]);
  const fileName = useMemo(() => path.basename(fullPath), [fullPath]);

  const isFolder = useMemo(() => {
    const files = workbenchStore.files.get();
    const fileEntry = files[fullPath];

    return !fileEntry || fileEntry.type === 'folder';
  }, [fullPath]);

  const targetPath = useMemo(() => {
    return isFolder ? fullPath : path.dirname(fullPath);
  }, [fullPath, isFolder]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const items = Array.from(e.dataTransfer.items);
      const files = items.filter((item) => item.kind === 'file');

      for (const item of files) {
        const file = item.getAsFile();

        if (file) {
          try {
            const filePath = path.join(fullPath, file.name);

            // Convert file to binary data (Uint8Array)
            const arrayBuffer = await file.arrayBuffer();
            const binaryContent = new Uint8Array(arrayBuffer);

            const success = await workbenchStore.createFile(filePath, binaryContent);

            if (success) {
              toast.success(`File ${file.name} uploaded successfully`);
            } else {
              toast.error(`Failed to upload file ${file.name}`);
            }
          } catch (error) {
            toast.error(`Error uploading ${file.name}`);
            logger.error(error);
          }
        }
      }

      setIsDragging(false);
    },
    [fullPath],
  );

  const handleCreateFile = async (newFileName: string) => {
    const newFilePath = path.join(targetPath, newFileName);
    const success = await workbenchStore.createFile(newFilePath, '');

    if (success) {
      toast.success('File created successfully');
    } else {
      toast.error('Failed to create file');
    }

    setIsCreatingFile(false);
  };

  const handleCreateFolder = async (folderName: string) => {
    const newFolderPath = path.join(targetPath, folderName);
    const success = await workbenchStore.createFolder(newFolderPath);

    if (success) {
      toast.success('Folder created successfully');
    } else {
      toast.error('Failed to create folder');
    }

    setIsCreatingFolder(false);
  };

  const handleDelete = async () => {
    try {
      if (!confirm(`Are you sure you want to delete ${isFolder ? 'folder' : 'file'}: ${fileName}?`)) {
        return;
      }

      let success;

      if (isFolder) {
        success = await workbenchStore.deleteFolder(fullPath);
      } else {
        success = await workbenchStore.deleteFile(fullPath);
      }

      if (success) {
        toast.success(`${isFolder ? 'Folder' : 'File'} deleted successfully`);
      } else {
        toast.error(`Failed to delete ${isFolder ? 'folder' : 'file'}`);
      }
    } catch (error) {
      toast.error(`Error deleting ${isFolder ? 'folder' : 'file'}`);
      logger.error(error);
    }
  };

  const handleLockFile = () => {
    try {
      if (isFolder) {
        return;
      }

      const success = workbenchStore.lockFile(fullPath);

      if (success) {
        toast.success(`File locked successfully`);
      } else {
        toast.error(`Failed to lock file`);
      }
    } catch (error) {
      toast.error(`Error locking file`);
      logger.error(error);
    }
  };

  const handleUnlockFile = () => {
    try {
      if (isFolder) {
        return;
      }

      const success = workbenchStore.unlockFile(fullPath);

      if (success) {
        toast.success(`File unlocked successfully`);
      } else {
        toast.error(`Failed to unlock file`);
      }
    } catch (error) {
      toast.error(`Error unlocking file`);
      logger.error(error);
    }
  };

  const handleLockFolder = () => {
    try {
      if (!isFolder) {
        return;
      }

      const success = workbenchStore.lockFolder(fullPath);

      if (success) {
        toast.success(`Folder locked successfully`);
      } else {
        toast.error(`Failed to lock folder`);
      }
    } catch (error) {
      toast.error(`Error locking folder`);
      logger.error(error);
    }
  };

  const handleUnlockFolder = () => {
    try {
      if (!isFolder) {
        return;
      }

      const success = workbenchStore.unlockFolder(fullPath);

      if (success) {
        toast.success(`Folder unlocked successfully`);
      } else {
        toast.error(`Failed to unlock folder`);
      }
    } catch (error) {
      toast.error(`Error unlocking folder`);
      logger.error(error);
    }
  };

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={classNames('relative', {
              'bg-flowstarter-elements-background-depth-2 border border-dashed border-flowstarter-elements-item-contentAccent rounded-md':
                isDragging,
            })}
          >
            {children}
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content
            style={{ zIndex: 998 }}
            className="border border-flowstarter-elements-borderColor rounded-md z-context-menu bg-flowstarter-elements-background-depth-1 dark:bg-flowstarter-elements-background-depth-2 data-[state=open]:animate-in animate-duration-100 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-98 w-56"
          >
            <ContextMenu.Group className="p-1 border-b-px border-solid border-flowstarter-elements-borderColor">
              <ContextMenuItem onSelect={() => setIsCreatingFile(true)}>
                <div className="flex items-center gap-2">
                  <div className="i-ph:file-plus" />
                  New File
                </div>
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => setIsCreatingFolder(true)}>
                <div className="flex items-center gap-2">
                  <div className="i-ph:folder-plus" />
                  New Folder
                </div>
              </ContextMenuItem>
            </ContextMenu.Group>
            <ContextMenu.Group className="p-1">
              <ContextMenuItem onSelect={onCopyPath}>Copy path</ContextMenuItem>
              <ContextMenuItem onSelect={onCopyRelativePath}>Copy relative path</ContextMenuItem>
            </ContextMenu.Group>
            <ContextMenu.Group className="p-1 border-t-px border-solid border-flowstarter-elements-borderColor">
              {!isFolder ? (
                <>
                  <ContextMenuItem onSelect={handleLockFile}>
                    <div className="flex items-center gap-2">
                      <div className="i-ph:lock-simple" />
                      Lock File
                    </div>
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={handleUnlockFile}>
                    <div className="flex items-center gap-2">
                      <div className="i-ph:lock-key-open" />
                      Unlock File
                    </div>
                  </ContextMenuItem>
                </>
              ) : (
                <>
                  <ContextMenuItem onSelect={handleLockFolder}>
                    <div className="flex items-center gap-2">
                      <div className="i-ph:lock-simple" />
                      Lock Folder
                    </div>
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={handleUnlockFolder}>
                    <div className="flex items-center gap-2">
                      <div className="i-ph:lock-key-open" />
                      Unlock Folder
                    </div>
                  </ContextMenuItem>
                </>
              )}
            </ContextMenu.Group>
            <ContextMenu.Group className="p-1 border-t-px border-solid border-flowstarter-elements-borderColor">
              <ContextMenuItem onSelect={handleDelete}>
                <div className="flex items-center gap-2 text-red-500">
                  <div className="i-ph:trash" />
                  Delete {isFolder ? 'Folder' : 'File'}
                </div>
              </ContextMenuItem>
            </ContextMenu.Group>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      {isCreatingFile && (
        <InlineInput
          depth={depth}
          placeholder="Enter file name..."
          onSubmit={handleCreateFile}
          onCancel={() => setIsCreatingFile(false)}
        />
      )}
      {isCreatingFolder && (
        <InlineInput
          depth={depth}
          placeholder="Enter folder name..."
          onSubmit={handleCreateFolder}
          onCancel={() => setIsCreatingFolder(false)}
        />
      )}
    </>
  );
}
