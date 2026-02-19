import { describe, it, expect } from 'vitest';
import { buildFileTree, countLinesOfCode } from './file-reader.js';
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
});
