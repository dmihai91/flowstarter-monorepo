/**
 * File Tree Utilities
 *
 * Shared utilities for building and working with file trees.
 * Used by ConvexCodeEditor, SimpleProjectEditor, and other components.
 */

/**
 * Represents a node in the file tree structure
 */
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

/**
 * Input file structure for building a tree
 */
export interface FileInput {
  path: string;
  type: string;
}

/**
 * Build a hierarchical file tree from a flat list of files.
 *
 * @param files - Array of files with path and type
 * @returns Array of root-level FileNode objects
 *
 * @example
 * ```ts
 * const files = [
 *   { path: 'src/index.ts', type: 'file' },
 *   { path: 'src/utils/helpers.ts', type: 'file' },
 *   { path: 'package.json', type: 'file' },
 * ];
 * const tree = buildFileTree(files);
 * // Returns: [{ name: 'src', path: '/src', type: 'directory', children: [...] }, ...]
 * ```
 */
export function buildFileTree(files: FileInput[]): FileNode[] {
  const root: FileNode[] = [];
  const nodeMap = new Map<string, FileNode>();

  // Sort files so directories come first, then alphabetically
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') {
      return -1;
    }

    if (a.type !== 'directory' && b.type === 'directory') {
      return 1;
    }

    return a.path.localeCompare(b.path);
  });

  for (const file of sortedFiles) {
    // Normalize path: convert backslashes to forward slashes
    const normalizedPath = file.path.replace(/\\/g, '/');
    const parts = normalizedPath.split('/').filter(Boolean);
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;

      if (!nodeMap.has(currentPath)) {
        const isLast = i === parts.length - 1;
        const node: FileNode = {
          name: part,
          path: currentPath,
          type: isLast ? (file.type as 'file' | 'directory') : 'directory',
          children: isLast && file.type === 'file' ? undefined : [],
        };

        nodeMap.set(currentPath, node);

        if (parentPath) {
          const parent = nodeMap.get(parentPath);
          parent?.children?.push(node);
        } else {
          root.push(node);
        }
      }
    }
  }

  return root;
}

/**
 * Get file icon class based on file extension.
 *
 * @param fileName - Name of the file
 * @param isDirectory - Whether the node is a directory
 * @param isExpanded - Whether a directory is expanded (for open/closed folder icons)
 * @returns Icon class name
 */
export function getFileIcon(fileName: string, isDirectory: boolean, isExpanded = false): string {
  if (isDirectory) {
    return isExpanded ? 'i-ph:folder-open-duotone' : 'i-ph:folder-duotone';
  }

  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'i-vscode-icons:file-type-typescript-official';
    case 'js':
    case 'jsx':
      return 'i-vscode-icons:file-type-js-official';
    case 'css':
      return 'i-vscode-icons:file-type-css';
    case 'html':
      return 'i-vscode-icons:file-type-html';
    case 'json':
      return 'i-vscode-icons:file-type-json';
    case 'md':
      return 'i-vscode-icons:file-type-markdown';
    case 'svg':
      return 'i-vscode-icons:file-type-svg';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      return 'i-ph:image-duotone';
    case 'astro':
      return 'i-vscode-icons:file-type-astro';
    case 'vue':
      return 'i-vscode-icons:file-type-vue';
    case 'scss':
    case 'sass':
      return 'i-vscode-icons:file-type-sass';
    case 'yaml':
    case 'yml':
      return 'i-vscode-icons:file-type-yaml';
    default:
      return 'i-ph:file-duotone';
  }
}

/**
 * Find a node in the file tree by path.
 *
 * @param tree - The file tree to search
 * @param path - The path to find
 * @returns The found node or undefined
 */
export function findNodeByPath(tree: FileNode[], path: string): FileNode | undefined {
  for (const node of tree) {
    if (node.path === path) {
      return node;
    }

    if (node.children) {
      const found = findNodeByPath(node.children, path);

      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Get all file paths from a file tree (flattened).
 *
 * @param tree - The file tree
 * @param filesOnly - Whether to include only files (not directories)
 * @returns Array of paths
 */
export function getAllPaths(tree: FileNode[], filesOnly = true): string[] {
  const paths: string[] = [];

  function traverse(nodes: FileNode[]) {
    for (const node of nodes) {
      if (!filesOnly || node.type === 'file') {
        paths.push(node.path);
      }

      if (node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);

  return paths;
}

