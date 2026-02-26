/**
 * Gretly Utilities
 *
 * Utility functions for the Gretly orchestrator.
 */

/*
 * ============================================================================
 * File Path Utilities
 * ============================================================================
 */

/**
 * Find file path with various path variations.
 *
 * Handles different path formats that may come from build errors:
 * - Absolute paths
 * - Relative paths with/without leading slash
 * - Paths with/without src/ prefix
 * - Basename matching as fallback
 */
export function findFilePath(filePath: string, files: Record<string, string>): string | null {
  const pathVariations = [
    filePath,
    `/${filePath}`,
    filePath.replace(/^\//, ''),
    `src/${filePath}`,
    `/src/${filePath}`,
  ];

  for (const path of pathVariations) {
    if (files[path]) {
      return path;
    }
  }

  // Try basename match
  const basename = filePath.split('/').pop();

  if (basename) {
    for (const path of Object.keys(files)) {
      if (path.endsWith(basename)) {
        return path;
      }
    }
  }

  return null;
}
