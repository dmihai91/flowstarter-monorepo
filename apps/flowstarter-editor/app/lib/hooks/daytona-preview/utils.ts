/**
 * Utility functions for Daytona preview.
 */

import type { BuildError, ProjectFileData, ProjectData } from './types';

export const PREVIEW_API = '/api/daytona/preview';

/**
 * Convert Convex project files to a Record<string, string> format.
 */
export function convertFilesToRecord(projectFiles: ProjectFileData[] | null | undefined): Record<string, string> {
  if (!projectFiles || projectFiles.length === 0) {
    return {};
  }

  const files: Record<string, string> = {};

  for (const file of projectFiles) {
    if (file.type === 'file' && !file.isBinary && file.content) {
      // Normalize path - ensure it starts with /
      const path = file.path.startsWith('/') ? file.path : `/${file.path}`;
      files[path] = file.content;
    }
  }

  return files;
}

/**
 * Generate a URL-friendly slug from a project name.
 */
export function generateProjectSlug(project: ProjectData | null | undefined, projectId: string): string {
  return (
    project?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') ||
    project?.urlId ||
    projectId.slice(-8)
  );
}

/**
 * Generate the proxy URL for iframe embedding.
 */
export function generateProxyUrl(projectId: string): string {
  return `/preview/${projectId}/`;
}

/**
 * Generate the display URL for the address bar.
 */
export function generateDisplayUrl(project: ProjectData | null | undefined, projectId: string): string {
  const slug = generateProjectSlug(project, projectId);
  return `https://${slug}.flowstarter.app`;
}

/**
 * Helper function to fix a build error using the LLM API.
 * Can be used as the onBuildError callback for useDaytonaPreview.
 *
 * @param buildError - The build error details
 * @param currentFiles - The current project files
 * @returns Fixed files if successful, null if failed
 */
export async function fixBuildErrorWithLLM(
  buildError: BuildError,
  currentFiles: Record<string, string>,
): Promise<Record<string, string> | null> {
  console.log(`[fixBuildErrorWithLLM] Fixing error in ${buildError.file}`);
  console.log(`[fixBuildErrorWithLLM] Available files:`, Object.keys(currentFiles));

  // Try multiple path variations to find the file
  const pathVariations = [
    buildError.file,
    `/${buildError.file}`,
    buildError.file.replace(/^\//, ''),
    `app/${buildError.file}`,
    `/app/${buildError.file}`,
  ];

  let fileContent: string | undefined;
  let foundPath: string | undefined;

  for (const path of pathVariations) {
    if (currentFiles[path]) {
      fileContent = currentFiles[path];
      foundPath = path;
      console.log(`[fixBuildErrorWithLLM] Found file at path: ${path}`);
      break;
    }
  }

  if (!fileContent) {
    console.error(`[fixBuildErrorWithLLM] Cannot find file ${buildError.file} in current files`);
    console.error(`[fixBuildErrorWithLLM] Tried paths:`, pathVariations);

    return null;
  }

  try {
    const response = await fetch('/api/fix-build-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buildError,
        fileContent,
        maxAttempts: 2, // Quick fix attempts
      }),
    });

    const data = (await response.json()) as {
      success: boolean;
      fixedContent?: string;
      summary?: string;
      error?: string;
    };

    if (!response.ok || !data.success || !data.fixedContent) {
      console.error(`[fixBuildErrorWithLLM] Fix failed:`, data.error);
      return null;
    }

    console.log(`[fixBuildErrorWithLLM] Fixed: ${data.summary}`);
    console.log(`[fixBuildErrorWithLLM] Applying fix to path: ${foundPath}`);

    // Return updated files with the fix applied
    const fixedFiles = { ...currentFiles };
    fixedFiles[foundPath!] = data.fixedContent;

    return fixedFiles;
  } catch (error) {
    console.error(`[fixBuildErrorWithLLM] API call failed:`, error);
    return null;
  }
}

/**
 * Create a default onBuildError handler that uses the LLM API.
 * This is a convenience function for components that want auto-fix behavior.
 */
export function createAutoFixHandler() {
  return async (buildError: BuildError, currentFiles: Record<string, string>) => {
    return fixBuildErrorWithLLM(buildError, currentFiles);
  };
}
