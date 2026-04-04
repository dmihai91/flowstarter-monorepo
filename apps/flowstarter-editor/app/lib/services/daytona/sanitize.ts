/**
 * Input Sanitization & Validation
 *
 * Security utilities for validating user-controlled inputs before they reach
 * file operations or shell commands in the Daytona sandbox service.
 */

import path from 'node:path';

/**
 * Validate that a workspace/sandbox ID matches the expected format.
 * Daytona IDs are alphanumeric with hyphens only.
 * Throws if the ID contains shell metacharacters or unexpected patterns.
 */
export function validateWorkspaceId(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new Error('Workspace ID is required');
  }

  // Allow alphanumeric, hyphens, underscores only (typical Daytona ID format)
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error(`Invalid workspace ID format: ${id.slice(0, 40)}`);
  }

  return id;
}

/**
 * Validate that a project ID matches the expected format.
 * Project IDs are alphanumeric with hyphens, underscores, and dots.
 */
export function validateProjectId(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new Error('Project ID is required');
  }

  // Allow alphanumeric, hyphens, underscores, dots (e.g. "my-project.v2")
  if (!/^[a-zA-Z0-9_.:-]+$/.test(id)) {
    throw new Error(`Invalid project ID format: ${id.slice(0, 40)}`);
  }

  return id;
}

/**
 * Resolve a file path within the sandbox working directory and verify
 * the resolved path does not escape the sandbox root via traversal.
 *
 * Uses POSIX path semantics since the sandbox runs Linux.
 * Throws if the resolved path is outside the allowed root.
 */
export function resolveSandboxPath(filePath: string, sandboxRoot: string): string {
  // Normalize the sandbox root to remove any trailing slashes / double slashes
  const normalizedRoot = path.posix.normalize(sandboxRoot);

  // Build the absolute path
  let absolute: string;

  if (filePath.startsWith('/')) {
    // Already absolute — but may still traverse outside root
    absolute = path.posix.normalize(filePath);
  } else {
    absolute = path.posix.normalize(`${normalizedRoot}/${filePath}`);
  }

  // Ensure the resolved path is within (or equal to) the sandbox root
  if (!absolute.startsWith(normalizedRoot + '/') && absolute !== normalizedRoot) {
    throw new Error(`Path traversal blocked: "${filePath}" resolves outside sandbox root`);
  }

  return absolute;
}

/**
 * Escape a string for safe inclusion in a double-quoted shell argument.
 * Prevents command injection through crafted file/directory names.
 */
export function shellEscape(arg: string): string {
  // Replace characters that are dangerous inside double quotes
  return arg.replace(/["\\$`!]/g, '\\$&');
}
