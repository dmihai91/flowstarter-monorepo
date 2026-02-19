/**
 * FileTree Component
 *
 * Facade module that re-exports from the modular file-tree implementation.
 *
 * @see ./file-tree/index.tsx for the main implementation
 */

// Re-export everything from the modular implementation
export { FileTree, default } from './file-tree';
export type { FileTreeProps, FileNode, FolderNode, Node } from './file-tree';
