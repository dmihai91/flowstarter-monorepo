/**
 * FileTree - Type Definitions
 */

import type { FileMap } from '~/lib/stores/files';
import type { FileHistory } from '~/types/actions';

export const NODE_PADDING_LEFT = 6;

export const DEFAULT_HIDDEN_FILES = [
  /\/node_modules\//,
  /\/\.next/,
  /\/\.astro/,
  /\/_tmp_/, // Temp files from pnpm/npm
  /\.lock\.\d+$/, // Lock file backups (pnpm-lock.yaml.27...)
  /~$/, // Backup files ending in ~
  /\.swp$/, // Vim swap files
  /\.DS_Store/, // macOS metadata
  /Thumbs\.db/, // Windows thumbnail cache
];

export interface FileTreeProps {
  files?: FileMap;
  selectedFile?: string;
  onFileSelect?: (filePath: string) => void;
  rootFolder?: string;
  hideRoot?: boolean;
  collapsed?: boolean;
  allowFolderSelection?: boolean;
  hiddenFiles?: Array<string | RegExp>;
  unsavedFiles?: Set<string>;
  fileHistory?: Record<string, FileHistory>;
  className?: string;
}

export interface InlineInputProps {
  depth: number;
  placeholder: string;
  initialValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export interface FolderProps {
  folder: FolderNode;
  collapsed: boolean;
  selected?: boolean;
  onCopyPath: () => void;
  onCopyRelativePath: () => void;
  onClick: () => void;
}

export interface FileProps {
  file: FileNode;
  selected: boolean;
  unsavedChanges?: boolean;
  fileHistory?: Record<string, FileHistory>;
  onCopyPath: () => void;
  onCopyRelativePath: () => void;
  onClick: () => void;
}

export interface NodeButtonProps {
  depth: number;
  iconClasses: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface FileContextMenuProps {
  onCopyPath?: () => void;
  onCopyRelativePath?: () => void;
  fullPath: string;
  children: React.ReactNode;
}

export type Node = FileNode | FolderNode;

export interface BaseNode {
  id: number;
  depth: number;
  name: string;
  fullPath: string;
}

export interface FileNode extends BaseNode {
  kind: 'file';
}

export interface FolderNode extends BaseNode {
  kind: 'folder';
}

