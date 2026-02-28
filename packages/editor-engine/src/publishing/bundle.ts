/**
 * Bundle Builder
 *
 * Build the site in a sandbox and prepare for deployment.
 */

import type { Sandbox } from '@daytonaio/sdk';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB per file (CF Pages limit)
const MAX_FILE_COUNT = 20_000; // CF Pages limit

interface BuildResult {
  success: boolean;
  outputDir: string;
  error?: string;
}

/**
 * Run the build command in the sandbox.
 */
export async function buildProject(sandbox: Sandbox): Promise<BuildResult> {
  const workDir = '/workspace';

  const result = await sandbox.process.executeCommand('npm run build', workDir);

  if (result.exitCode !== 0) {
    return {
      success: false,
      outputDir: '',
      error: result.result || 'Build failed',
    };
  }

  // Detect output directory (Astro uses dist/ by default)
  const distCheck = await sandbox.process.executeCommand(
    'ls -d dist/ 2>/dev/null || ls -d build/ 2>/dev/null || ls -d .output/public/ 2>/dev/null || echo "dist"',
    workDir,
  );

  const outputDir = distCheck.result.trim().split('\n')[0] || 'dist';

  return {
    success: true,
    outputDir: `${workDir}/${outputDir}`,
  };
}

/**
 * Download built files from sandbox.
 */
export async function downloadBundle(
  sandbox: Sandbox,
  outputDir: string,
): Promise<Array<{ path: string; content: Buffer }>> {
  const workDir = '/workspace';

  // List all files in the output directory
  const listResult = await sandbox.process.executeCommand(
    `find ${outputDir} -type f | head -${MAX_FILE_COUNT}`,
    workDir,
  );

  const filePaths = listResult.result
    .trim()
    .split('\n')
    .filter((p) => p.length > 0);

  const files: Array<{ path: string; content: Buffer }> = [];

  for (const filePath of filePaths) {
    try {
      const content = await sandbox.fs.downloadFile(filePath);

      if (content.length > MAX_FILE_SIZE) {
        continue; // Skip files over 25MB
      }

      // Convert to relative path (remove outputDir prefix)
      const relativePath = filePath.replace(outputDir, '').replace(/^\//, '');

      files.push({ path: relativePath, content });
    } catch {
      // Skip unreadable files
    }
  }

  return files;
}

/**
 * Validate a bundle before deployment.
 */
export function validateBundle(
  files: Array<{ path: string; content: Buffer }>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (files.length === 0) {
    errors.push('No files in bundle');
  }

  if (files.length > MAX_FILE_COUNT) {
    errors.push(`Too many files: ${files.length} (max ${MAX_FILE_COUNT})`);
  }

  for (const file of files) {
    if (file.content.length > MAX_FILE_SIZE) {
      errors.push(`File too large: ${file.path} (${file.content.length} bytes)`);
    }
  }

  // Check for index.html
  const hasIndex = files.some(
    (f) => f.path === 'index.html' || f.path === '/index.html',
  );
  if (!hasIndex) {
    errors.push('Missing index.html');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
