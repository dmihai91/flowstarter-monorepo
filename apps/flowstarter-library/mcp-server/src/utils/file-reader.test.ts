import { describe, it, expect } from 'vitest';
import { buildFileTree, countLinesOfCode, collectScaffoldAssets } from './file-reader.js';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('file-reader', () => {
  describe('buildFileTree', () => {
    it('should build a file tree structure', async () => {
      // Test with the parent directory (could be 'src' or 'build' depending on where tests run from)
      const parentPath = path.resolve(__dirname, '..');
      const tree = await buildFileTree(parentPath);

      expect(tree).toBeDefined();
      expect(tree.type).toBe('directory');
      // Name could be 'src' or 'build' depending on whether we're running compiled or source tests
      expect(['src', 'build']).toContain(tree.name);
      expect(tree.children).toBeDefined();
      expect(tree.children!.length).toBeGreaterThan(0);
    });

    it('should exclude node_modules directories', async () => {
      const rootPath = path.resolve(__dirname, '../..');
      const tree = await buildFileTree(rootPath);

      // Check that node_modules is not in the tree
      const hasNodeModules = tree.children?.some(
        (child) => child.name === 'node_modules'
      );
      expect(hasNodeModules).toBe(false);
    });

    it('should include both files and directories', async () => {
      const srcPath = path.resolve(__dirname, '..');
      const tree = await buildFileTree(srcPath);

      const hasFiles = tree.children?.some((child) => child.type === 'file');
      const hasDirs = tree.children?.some((child) => child.type === 'directory');

      expect(hasFiles).toBe(true);
      expect(hasDirs).toBe(true);
    });

    it('should sort directories before files', async () => {
      const srcPath = path.resolve(__dirname, '..');
      const tree = await buildFileTree(srcPath);

      // Find the first file and first directory in children
      let firstFileIndex = -1;
      let firstDirIndex = -1;

      tree.children?.forEach((child, index) => {
        if (child.type === 'file' && firstFileIndex === -1) {
          firstFileIndex = index;
        }
        if (child.type === 'directory' && firstDirIndex === -1) {
          firstDirIndex = index;
        }
      });

      // If both exist, directories should come first
      if (firstFileIndex !== -1 && firstDirIndex !== -1) {
        expect(firstDirIndex).toBeLessThan(firstFileIndex);
      }
    });

    it('should include file size for files', async () => {
      const srcPath = path.resolve(__dirname, '..');
      const tree = await buildFileTree(srcPath);

      const fileNode = tree.children?.find((child) => child.type === 'file');
      if (fileNode) {
        expect(fileNode.size).toBeDefined();
        expect(fileNode.size).toBeGreaterThan(0);
      }
    });
  });

  describe('countLinesOfCode', () => {
    it('should count TypeScript files', async () => {
      const srcPath = path.resolve(__dirname, '..');
      const count = await countLinesOfCode(srcPath, ['.ts']);

      expect(count).toBeGreaterThan(0);
    });

    it('should return 0 for non-existent extensions', async () => {
      const srcPath = path.resolve(__dirname, '..');
      const count = await countLinesOfCode(srcPath, ['.xyz']);

      expect(count).toBe(0);
    });

    it('should count multiple extensions', async () => {
      const srcPath = path.resolve(__dirname, '..');
      const count = await countLinesOfCode(srcPath, ['.ts', '.js']);

      expect(count).toBeGreaterThan(0);
    });

    it('should exclude node_modules when counting', async () => {
      const rootPath = path.resolve(__dirname, '../..');
      const countWithExclusion = await countLinesOfCode(rootPath, ['.ts']);

      // This should not include node_modules
      // We can't test the exact count, but it should be reasonable
      expect(countWithExclusion).toBeGreaterThan(0);
      expect(countWithExclusion).toBeLessThan(100000); // Sanity check
    });
  });

  describe('collectScaffoldAssets', () => {
    async function makeFixture(): Promise<string> {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), 'scaffold-assets-'));
      await fs.mkdir(path.join(root, 'public', 'images'), { recursive: true });
      await fs.mkdir(path.join(root, 'node_modules', 'dep'), { recursive: true });
      // A tiny real binary payload; content round-trips through base64.
      await fs.writeFile(
        path.join(root, 'public', 'images', 'hero.png'),
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, 0x02, 0x03])
      );
      await fs.writeFile(path.join(root, 'public', 'images', 'notes.txt'), 'text');
      await fs.writeFile(path.join(root, 'thumbnail.png'), Buffer.from([1, 2]));
      await fs.writeFile(
        path.join(root, 'node_modules', 'dep', 'sprite.png'),
        Buffer.from([9, 9])
      );
      return root;
    }

    it('collects binary assets as base64 with POSIX paths', async () => {
      const root = await makeFixture();
      try {
        const assets = await collectScaffoldAssets(root);
        expect(assets).toHaveLength(1);
        expect(assets[0].path).toBe('public/images/hero.png');
        expect(assets[0].encoding).toBe('base64');
        expect(Buffer.from(assets[0].content, 'base64')).toEqual(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, 0x02, 0x03])
        );
      } finally {
        await fs.rm(root, { recursive: true, force: true });
      }
    });

    it('excludes library thumbnails and dependency directories', async () => {
      const root = await makeFixture();
      try {
        const assets = await collectScaffoldAssets(root);
        const paths = assets.map((a) => a.path);
        expect(paths).not.toContain('thumbnail.png');
        expect(paths.some((p) => p.includes('node_modules'))).toBe(false);
      } finally {
        await fs.rm(root, { recursive: true, force: true });
      }
    });
  });
});
