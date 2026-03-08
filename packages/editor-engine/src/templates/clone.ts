/**
 * Template Clone Service
 *
 * Reads template files from the library and uploads them to a Daytona sandbox.
 */

import type { Sandbox } from '@daytonaio/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';

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
  'palettes',
]);

const EXCLUDED_FILES = new Set([
  '.DS_Store',
  'Thumbs.db',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'bun.lock',
  'thumbnail.png',
  'thumbnail-light.png',
  'thumbnail-dark.png',
  'preview.png',
  'preview-light.png',
  'preview-dark.png',
  'config.json.tmp',
  'content.md',
]);

export interface CloneProgress {
  stage: 'uploading' | 'installing' | 'starting' | 'ready';
  message: string;
}

/**
 * Collect all files from a template directory recursively.
 */
async function collectFiles(
  dirPath: string,
  relativePath: string = '',
): Promise<Array<{ relativePath: string; absolutePath: string }>> {
  const files: Array<{ relativePath: string; absolutePath: string }> = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name) || EXCLUDED_FILES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subFiles = await collectFiles(fullPath, relPath);
      files.push(...subFiles);
    } else {
      files.push({ relativePath: relPath, absolutePath: fullPath });
    }
  }

  return files;
}

/**
 * Clone a template into a Daytona sandbox at /workspace/.
 */
export async function cloneTemplateToSandbox(
  sandbox: Sandbox,
  templateSlug: string,
  templatesDir: string,
  onProgress?: (progress: CloneProgress) => void,
): Promise<{ success: boolean; error?: string }> {
  if (templateSlug.includes('..') || templateSlug.includes('/')) {
    return { success: false, error: 'Invalid template slug' };
  }

  const templateDir = path.join(templatesDir, templateSlug);

  try {
    await fs.access(templateDir);
  } catch {
    return { success: false, error: `Template '${templateSlug}' not found` };
  }

  const workDir = '/workspace';

  try {
    onProgress?.({ stage: 'uploading', message: 'Uploading template files...' });

    const files = await collectFiles(templateDir);

    const BATCH_SIZE = 20;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);

      const uploads = await Promise.all(
        batch.map(async (file) => {
          const content = await fs.readFile(file.absolutePath);
          return {
            path: `${workDir}/${file.relativePath}`,
            content: new File([content], file.relativePath),
          };
        }),
      );

      await sandbox.fs.uploadFiles(uploads);
    }

    onProgress?.({ stage: 'installing', message: 'Installing dependencies...' });

    const install = await sandbox.process.executeCommand('npm install', workDir);

    if (install.exitCode !== 0) {
      return { success: false, error: 'Failed to install dependencies' };
    }

    onProgress?.({ stage: 'starting', message: 'Starting dev server...' });

    await sandbox.process.executeCommand(
      'pkill -f "astro dev" || pkill -f "npm run dev" || true',
      workDir,
    );

    await sandbox.process.executeCommand(
      'nohup npm run dev -- --host 0.0.0.0 > /tmp/dev-server.log 2>&1 &',
      workDir,
    );

    await new Promise((resolve) => setTimeout(resolve, 3000));

    onProgress?.({ stage: 'ready', message: 'Template ready!' });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Clone failed';
    return { success: false, error: message };
  }
}

/**
 * Get template config by slug.
 */
export async function getTemplateConfig(
  templateSlug: string,
  templatesDir: string,
): Promise<{
  name: string;
  slug: string;
  description: string;
  category: string;
  features: string[];
} | null> {
  const configPath = path.join(templatesDir, templateSlug, 'config.json');
  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
