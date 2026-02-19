/**
 * File Tree Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  buildFileTree,
  getFileIcon,
  findNodeByPath,
  getAllPaths,
  type FileNode,
  type FileInput,
} from '~/lib/utils/fileTree';

describe('buildFileTree', () => {
  it('should build a flat structure from root files', () => {
    const files: FileInput[] = [
      { path: 'package.json', type: 'file' },
      { path: 'README.md', type: 'file' },
    ];

    const tree = buildFileTree(files);

    expect(tree).toHaveLength(2);
    expect(tree[0].name).toBe('package.json');
    expect(tree[0].path).toBe('/package.json');
    expect(tree[0].type).toBe('file');
    expect(tree[1].name).toBe('README.md');
  });

  it('should build nested directory structure', () => {
    const files: FileInput[] = [
      { path: 'src/index.ts', type: 'file' },
      { path: 'src/utils/helpers.ts', type: 'file' },
    ];

    const tree = buildFileTree(files);

    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('src');
    expect(tree[0].type).toBe('directory');
    expect(tree[0].children).toHaveLength(2);

    const indexFile = tree[0].children?.find((c) => c.name === 'index.ts');
    expect(indexFile?.type).toBe('file');

    const utilsDir = tree[0].children?.find((c) => c.name === 'utils');
    expect(utilsDir?.type).toBe('directory');
    expect(utilsDir?.children?.[0].name).toBe('helpers.ts');
  });

  it('should handle Windows-style paths (backslashes)', () => {
    const files: FileInput[] = [{ path: 'src\\components\\Button.tsx', type: 'file' }];

    const tree = buildFileTree(files);

    expect(tree[0].name).toBe('src');
    expect(tree[0].path).toBe('/src');

    const componentsDir = tree[0].children?.find((c) => c.name === 'components');
    expect(componentsDir?.path).toBe('/src/components');

    const buttonFile = componentsDir?.children?.find((c) => c.name === 'Button.tsx');
    expect(buttonFile?.path).toBe('/src/components/Button.tsx');
  });

  it('should sort directories before files', () => {
    const files: FileInput[] = [
      { path: 'README.md', type: 'file' },
      { path: 'src', type: 'directory' },
      { path: 'package.json', type: 'file' },
    ];

    const tree = buildFileTree(files);

    expect(tree[0].name).toBe('src');
    expect(tree[0].type).toBe('directory');
  });

  it('should handle empty file list', () => {
    const tree = buildFileTree([]);
    expect(tree).toHaveLength(0);
  });

  it('should create intermediate directories', () => {
    const files: FileInput[] = [{ path: 'a/b/c/d.ts', type: 'file' }];

    const tree = buildFileTree(files);

    expect(tree[0].name).toBe('a');
    expect(tree[0].children?.[0].name).toBe('b');
    expect(tree[0].children?.[0].children?.[0].name).toBe('c');
    expect(tree[0].children?.[0].children?.[0].children?.[0].name).toBe('d.ts');
  });
});

describe('getFileIcon', () => {
  describe('directories', () => {
    it('should return closed folder icon for collapsed directory', () => {
      const icon = getFileIcon('src', true, false);
      expect(icon).toBe('i-ph:folder-duotone');
    });

    it('should return open folder icon for expanded directory', () => {
      const icon = getFileIcon('src', true, true);
      expect(icon).toBe('i-ph:folder-open-duotone');
    });
  });

  describe('TypeScript files', () => {
    it('should return TypeScript icon for .ts files', () => {
      expect(getFileIcon('index.ts', false)).toBe('i-vscode-icons:file-type-typescript-official');
    });

    it('should return TypeScript icon for .tsx files', () => {
      expect(getFileIcon('Component.tsx', false)).toBe('i-vscode-icons:file-type-typescript-official');
    });
  });

  describe('JavaScript files', () => {
    it('should return JavaScript icon for .js files', () => {
      expect(getFileIcon('script.js', false)).toBe('i-vscode-icons:file-type-js-official');
    });

    it('should return JavaScript icon for .jsx files', () => {
      expect(getFileIcon('App.jsx', false)).toBe('i-vscode-icons:file-type-js-official');
    });
  });

  describe('other file types', () => {
    it('should return CSS icon for .css files', () => {
      expect(getFileIcon('styles.css', false)).toBe('i-vscode-icons:file-type-css');
    });

    it('should return HTML icon for .html files', () => {
      expect(getFileIcon('index.html', false)).toBe('i-vscode-icons:file-type-html');
    });

    it('should return JSON icon for .json files', () => {
      expect(getFileIcon('package.json', false)).toBe('i-vscode-icons:file-type-json');
    });

    it('should return Markdown icon for .md files', () => {
      expect(getFileIcon('README.md', false)).toBe('i-vscode-icons:file-type-markdown');
    });

    it('should return SVG icon for .svg files', () => {
      expect(getFileIcon('logo.svg', false)).toBe('i-vscode-icons:file-type-svg');
    });

    it('should return image icon for image files', () => {
      expect(getFileIcon('photo.png', false)).toBe('i-ph:image-duotone');
      expect(getFileIcon('photo.jpg', false)).toBe('i-ph:image-duotone');
      expect(getFileIcon('photo.jpeg', false)).toBe('i-ph:image-duotone');
      expect(getFileIcon('photo.gif', false)).toBe('i-ph:image-duotone');
      expect(getFileIcon('photo.webp', false)).toBe('i-ph:image-duotone');
    });

    it('should return Astro icon for .astro files', () => {
      expect(getFileIcon('Layout.astro', false)).toBe('i-vscode-icons:file-type-astro');
    });

    it('should return Vue icon for .vue files', () => {
      expect(getFileIcon('App.vue', false)).toBe('i-vscode-icons:file-type-vue');
    });

    it('should return SASS icon for .scss/.sass files', () => {
      expect(getFileIcon('styles.scss', false)).toBe('i-vscode-icons:file-type-sass');
      expect(getFileIcon('styles.sass', false)).toBe('i-vscode-icons:file-type-sass');
    });

    it('should return YAML icon for .yaml/.yml files', () => {
      expect(getFileIcon('config.yaml', false)).toBe('i-vscode-icons:file-type-yaml');
      expect(getFileIcon('config.yml', false)).toBe('i-vscode-icons:file-type-yaml');
    });

    it('should return default icon for unknown extensions', () => {
      expect(getFileIcon('file.xyz', false)).toBe('i-ph:file-duotone');
      expect(getFileIcon('noextension', false)).toBe('i-ph:file-duotone');
    });
  });
});

describe('findNodeByPath', () => {
  const tree: FileNode[] = [
    {
      name: 'src',
      path: '/src',
      type: 'directory',
      children: [
        { name: 'index.ts', path: '/src/index.ts', type: 'file' },
        {
          name: 'utils',
          path: '/src/utils',
          type: 'directory',
          children: [{ name: 'helpers.ts', path: '/src/utils/helpers.ts', type: 'file' }],
        },
      ],
    },
    { name: 'package.json', path: '/package.json', type: 'file' },
  ];

  it('should find root-level file', () => {
    const node = findNodeByPath(tree, '/package.json');
    expect(node?.name).toBe('package.json');
  });

  it('should find root-level directory', () => {
    const node = findNodeByPath(tree, '/src');
    expect(node?.name).toBe('src');
    expect(node?.type).toBe('directory');
  });

  it('should find nested file', () => {
    const node = findNodeByPath(tree, '/src/index.ts');
    expect(node?.name).toBe('index.ts');
  });

  it('should find deeply nested file', () => {
    const node = findNodeByPath(tree, '/src/utils/helpers.ts');
    expect(node?.name).toBe('helpers.ts');
  });

  it('should return undefined for non-existent path', () => {
    const node = findNodeByPath(tree, '/nonexistent/path');
    expect(node).toBeUndefined();
  });

  it('should handle empty tree', () => {
    const node = findNodeByPath([], '/any/path');
    expect(node).toBeUndefined();
  });
});

describe('getAllPaths', () => {
  const tree: FileNode[] = [
    {
      name: 'src',
      path: '/src',
      type: 'directory',
      children: [
        { name: 'index.ts', path: '/src/index.ts', type: 'file' },
        {
          name: 'utils',
          path: '/src/utils',
          type: 'directory',
          children: [{ name: 'helpers.ts', path: '/src/utils/helpers.ts', type: 'file' }],
        },
      ],
    },
    { name: 'package.json', path: '/package.json', type: 'file' },
  ];

  it('should get all file paths by default', () => {
    const paths = getAllPaths(tree);
    expect(paths).toContain('/src/index.ts');
    expect(paths).toContain('/src/utils/helpers.ts');
    expect(paths).toContain('/package.json');
    expect(paths).not.toContain('/src');
    expect(paths).not.toContain('/src/utils');
  });

  it('should include directories when filesOnly is false', () => {
    const paths = getAllPaths(tree, false);
    expect(paths).toContain('/src');
    expect(paths).toContain('/src/utils');
    expect(paths).toContain('/src/index.ts');
    expect(paths).toContain('/src/utils/helpers.ts');
    expect(paths).toContain('/package.json');
  });

  it('should handle empty tree', () => {
    const paths = getAllPaths([]);
    expect(paths).toHaveLength(0);
  });

  it('should return correct count', () => {
    const filePaths = getAllPaths(tree, true);
    const allPaths = getAllPaths(tree, false);
    expect(filePaths).toHaveLength(3);
    expect(allPaths).toHaveLength(5);
  });
});

