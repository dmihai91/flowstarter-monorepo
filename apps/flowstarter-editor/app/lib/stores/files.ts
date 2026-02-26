/**
 * Files Store
 *
 * Re-exports from the modularized files store.
 * This file maintains backward compatibility with existing imports.
 */

export { FilesStore } from './files/index';
export type { File, Folder, Dirent, FileMap, LockResult, FolderLockResult } from './files/index';
