/**
 * Files Store Types
 *
 * Type definitions for the file system state management.
 */

export interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
  isLocked?: boolean;
  lockedByFolder?: string; // Path of the folder that locked this file
}

export interface Folder {
  type: 'folder';
  isLocked?: boolean;
  lockedByFolder?: string; // Path of the folder that locked this folder (for nested folders)
}

export type Dirent = File | Folder;

export type FileMap = Record<string, Dirent | undefined>;

export interface LockResult {
  locked: boolean;
  lockedBy?: string;
}

export interface FolderLockResult {
  isLocked: boolean;
  lockedBy?: string;
}
