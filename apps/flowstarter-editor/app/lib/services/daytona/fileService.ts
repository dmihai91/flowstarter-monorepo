/**
 * File Service
 *
 * Handles file upload and synchronization to Daytona sandboxes.
 */

import type { Sandbox } from '@daytonaio/sdk';
import { log } from './client';

const CONCURRENCY_LIMIT = 5;

/**
 * Process files before upload to fix config for preview
 * Templates may have base paths like /templates/xyz which break in Daytona
 */
function processFilesForPreview(files: Record<string, string>): Record<string, string> {
  const processed = { ...files };

  // Fix astro.config base path for preview
  const configKey = Object.keys(processed).find((k) => k.includes('astro.config'));
  if (configKey && processed[configKey]) {
    // Replace any base path with root for preview
    processed[configKey] = processed[configKey].replace(/base:\s*['"][^'"]*['"]/g, "base: '/'");
    log.debug(' Fixed astro.config base path for preview');
  }

  return processed;
}

/**
 * Upload files to sandbox using the SDK
 * Uses parallel uploads with concurrency limit for speed
 */
export async function uploadFiles(sandbox: Sandbox, files: Record<string, string>): Promise<void> {
  // Process files to fix config for preview
  files = processFilesForPreview(files);

  const fileCount = Object.keys(files).length;
  log.debug(` Uploading ${fileCount} files`);

  const startTime = Date.now();

  // Get working directory (usually /home/daytona)
  const workDir = (await sandbox.getWorkDir()) || '/home/daytona';

  // First, collect all unique directories that need to be created
  const directories = new Set<string>();

  for (const filePath of Object.keys(files)) {
    const normalizedPath = normalizePath(filePath, workDir);
    const dirPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));

    if (dirPath && dirPath !== workDir) {
      directories.add(dirPath);
    }
  }

  // Create all directories first using a single command
  if (directories.size > 0) {
    log.debug(` Creating ${directories.size} directories`);

    const sortedDirs = Array.from(directories).sort();
    const mkdirCommand = `mkdir -p ${sortedDirs.map((d) => `"${d}"`).join(' ')}`;

    try {
      await sandbox.process.executeCommand(mkdirCommand, workDir);
      log.debug(' Directories created');
    } catch (e) {
      log.error(' Failed to create directories:', e);
    }
  }

  // Upload files in parallel batches using SDK's uploadFiles method
  const fileEntries = Object.entries(files);
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < fileEntries.length; i += CONCURRENCY_LIMIT) {
    const batch = fileEntries.slice(i, i + CONCURRENCY_LIMIT);

    const uploadPromises = batch.map(async ([filePath, content]) => {
      try {
        const normalizedPath = normalizePath(filePath, workDir);

        // Use SDK's uploadFile method with Buffer
        await sandbox.fs.uploadFile(Buffer.from(content, 'utf-8'), normalizedPath);

        return true;
      } catch (e) {
        log.error(` Failed to upload ${filePath}:`, e);
        return false;
      }
    });

    const results = await Promise.all(uploadPromises);
    successCount += results.filter(Boolean).length;
    failCount += results.filter((r) => !r).length;
  }

  const elapsed = Date.now() - startTime;
  log.debug(` Files uploaded: ${successCount}/${fileCount} in ${elapsed}ms (${failCount} failed)`);
}

/**
 * Normalize file path to absolute path in sandbox
 */
function normalizePath(filePath: string, workDir: string): string {
  let normalizedPath = filePath;

  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }

  if (!normalizedPath.startsWith(workDir)) {
    normalizedPath = `${workDir}${normalizedPath}`;
  }

  return normalizedPath;
}


