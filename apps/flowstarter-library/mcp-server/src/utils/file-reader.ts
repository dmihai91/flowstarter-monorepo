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

const BINARY_EXTENSIONS = new Set([
	'.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.pdf',
	'.woff', '.woff2', '.ttf', '.otf', '.zip', '.gz',
]);

// Pattern for generated timestamp files (e.g., app.config.timestamp_1234567890.js)
const TIMESTAMP_FILE_PATTERN = /\.(config|vite)\.timestamp_\d+\.js$/;

// Binary assets that scaffolding must carry as base64. Images are the
// template's finished artwork and fonts are its typography — without them a
// scaffolded workspace degrades to whatever text placeholders remain.
const SCAFFOLD_ASSET_EXTENSIONS = new Set([
	'.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico',
	'.woff', '.woff2', '.ttf', '.otf',
]);
const MAX_SCAFFOLD_ASSET_BYTES = 4 * 1024 * 1024;

export interface ScaffoldAssetFile {
	path: string;
	content: string;
	encoding: 'base64';
}

// Only servable site content; root-level screenshots and docs stay behind.
const SCAFFOLD_ASSET_ROOTS = new Set(['public', 'src']);

/**
 * Collects the template's binary assets (images, fonts) as base64 entries.
 * `buildFileTree`/`getAllFiles` deliberately exclude binaries from the code
 * tree agents browse; scaffolding needs them anyway or the cloned site ships
 * without its artwork.
 */
export async function collectScaffoldAssets(
	rootPath: string
): Promise<ScaffoldAssetFile[]> {
	const assets: ScaffoldAssetFile[] = [];

	async function walk(dir: string, rel: string): Promise<void> {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			const relPath = rel ? `${rel}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				const allowed = rel
					? !EXCLUDED_DIRS.has(entry.name)
					: SCAFFOLD_ASSET_ROOTS.has(entry.name);
				if (allowed) {
					await walk(fullPath, relPath);
				}
				continue;
			}
			if (!entry.isFile()) continue;
			if (!rel) continue;
			if (EXCLUDED_FILES.has(entry.name)) continue;
			const ext = path.extname(entry.name).toLowerCase();
			if (!SCAFFOLD_ASSET_EXTENSIONS.has(ext)) continue;
			const stats = await fs.stat(fullPath);
			if (stats.size > MAX_SCAFFOLD_ASSET_BYTES) {
				console.warn(
					`⚠️ Skipping oversized scaffold asset ${relPath} (${stats.size} bytes)`
				);
				continue;
			}
			const content = await fs.readFile(fullPath);
			assets.push({
				path: normalizePath(relPath),
				content: content.toString('base64'),
				encoding: 'base64',
			});
		}
	}

	await walk(rootPath, '');
	return assets;
}

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
			} catch {
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
		if (
			EXCLUDED_FILES.has(name) ||
			name === '.env' ||
			name.startsWith('.env.') ||
			BINARY_EXTENSIONS.has(path.extname(name).toLowerCase())
		) {
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
