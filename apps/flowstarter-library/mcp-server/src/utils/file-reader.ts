import * as fs from 'fs/promises';
import * as path from 'path';
import { FileNode } from '../types/templates.js';

// Normalize path separators to forward slashes (POSIX style)
// This ensures consistent paths regardless of OS
function normalizePath(p: string): string {
	return p.replace(/\\/g, '/');
}

const EXCLUDED_DIRS = new Set([
	'node_modules',
	'.git',
	'.next',
	'.output',
	'.vite',
	'build',
	'dist',
	'.vinxi',
	'.vercel',
	'.DS_Store',
	'coverage',
]);

const EXCLUDED_FILES = new Set([
	'.DS_Store',
	'Thumbs.db',
	'.gitignore',
	'package-lock.json',
	'yarn.lock',
	'pnpm-lock.yaml',
	'bun.lockb',
	'bun.lock',
	'routeTree.gen.ts',
	// Exclude thumbnail images - they're large and not needed for scaffolding
	'thumbnail.png',
	'thumbnail-light.png',
	'thumbnail-dark.png',
	'preview.png',
	'preview-light.png',
	'preview-dark.png',
	// Exclude temp files
	'config.json.tmp',
]);

// Pattern for generated timestamp files (e.g., app.config.timestamp_1234567890.js)
const TIMESTAMP_FILE_PATTERN = /\.(config|vite)\.timestamp_\d+\.js$/;

export async function buildFileTree(
	dirPath: string,
	relativePath: string = ''
): Promise<FileNode> {
	const stats = await fs.stat(dirPath);
	const name = path.basename(dirPath);

	if (stats.isDirectory()) {
		// For root level calls, we shouldn't check exclusion on the target directory itself
		// Only check children. This allows tests to call buildFileTree on 'src' or 'build' dirs.

		const children: FileNode[] = [];
		const entries = await fs.readdir(dirPath);

		for (const entry of entries) {
			if (EXCLUDED_DIRS.has(entry) || EXCLUDED_FILES.has(entry)) {
				continue;
			}

			const fullPath = path.join(dirPath, entry);
			// Normalize to forward slashes for cross-platform compatibility
			const relPath = normalizePath(path.join(relativePath, entry));

			try {
				const childNode = await buildFileTree(fullPath, relPath);
				children.push(childNode);
			} catch (error) {
				// Skip excluded directories and files
				continue;
			}
		}

		return {
			path: relativePath || '.',
			name,
			type: 'directory',
			children: children.sort((a, b) => {
				// Directories first, then files, alphabetically
				if (a.type !== b.type) {
					return a.type === 'directory' ? -1 : 1;
				}
				return a.name.localeCompare(b.name);
			}),
		};
	} else {
		// Check excluded files list
		if (EXCLUDED_FILES.has(name)) {
			throw new Error(`Excluded file: ${name}`);
		}

		// Check for timestamp generated files
		if (TIMESTAMP_FILE_PATTERN.test(name)) {
			throw new Error(`Excluded timestamp file: ${name}`);
		}

		return {
			path: relativePath,
			name,
			type: 'file',
			size: stats.size,
		};
	}
}

export async function readFileContent(filePath: string): Promise<string> {
	try {
		return await fs.readFile(filePath, 'utf-8');
	} catch (error) {
		throw new Error(`Failed to read file ${filePath}: ${error}`);
	}
}

export async function getAllFiles(
	dirPath: string,
	fileTree: FileNode
): Promise<Array<{ path: string; content: string }>> {
	const files: Array<{ path: string; content: string }> = [];

	async function traverse(node: FileNode, basePath: string) {
		if (node.type === 'file') {
			const fullPath = path.join(basePath, node.path);
			const content = await readFileContent(fullPath);
			files.push({ path: node.path, content });
		} else if (node.children) {
			for (const child of node.children) {
				await traverse(child, basePath);
			}
		}
	}

	await traverse(fileTree, dirPath);
	return files;
}

export async function countLinesOfCode(
	dirPath: string,
	extensions: string[]
): Promise<number> {
	let totalLines = 0;

	async function countInDir(dir: string) {
		const entries = await fs.readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				if (!EXCLUDED_DIRS.has(entry.name)) {
					await countInDir(fullPath);
				}
			} else if (entry.isFile()) {
				const ext = path.extname(entry.name);
				if (extensions.includes(ext)) {
					try {
						const content = await fs.readFile(fullPath, 'utf-8');
						totalLines += content.split('\n').length;
					} catch {
						// Skip files that can't be read
					}
				}
			}
		}
	}

	await countInDir(dirPath);
	return totalLines;
}
