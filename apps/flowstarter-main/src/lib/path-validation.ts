/**
 * Path Validation Utilities
 *
 * Provides secure path validation to prevent path traversal attacks.
 * All file-system operations should use these utilities.
 *
 * @module lib/path-validation
 */

import path from 'path';

/**
 * Valid characters for template and resource IDs.
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Maximum length for resource identifiers
 */
const MAX_ID_LENGTH = 64;

/**
 * Path traversal patterns to detect and block
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./, // Parent directory traversal
  /\.\//, // Current directory reference
  /\/\//, // Double slashes
  /%2e/i, // URL encoded dot
  /%2f/i, // URL encoded forward slash
  /%5c/i, // URL encoded backslash
  /\\/, // Backslash (Windows path separator)
  /\0/, // Null byte injection
  // eslint-disable-next-line no-control-regex
  new RegExp('[\\x00-\\x1f]'), // Control characters
];

/**
 * Result of path validation
 */
export interface PathValidationResult {
  valid: boolean;
  sanitized?: string;
  error?: string;
}

/**
 * Validate a resource ID (template ID, project ID, etc.)
 *
 * @param id - The ID to validate
 * @param options - Validation options
 * @returns Validation result with sanitized ID if valid
 *
 * @example
 * ```ts
 * const result = validateResourceId('personal-brand-pro');
 * if (result.valid) {
 *   // Safe to use result.sanitized
 * }
 * ```
 */
export function validateResourceId(
  id: string | undefined | null,
  options: {
    maxLength?: number;
    allowEmpty?: boolean;
  } = {}
): PathValidationResult {
  const { maxLength = MAX_ID_LENGTH, allowEmpty = false } = options;

  // Null/undefined check
  if (id == null) {
    return {
      valid: allowEmpty,
      error: allowEmpty ? undefined : 'ID is required',
    };
  }

  // Type check - must be string
  if (typeof id !== 'string') {
    return { valid: false, error: 'ID must be a string' };
  }

  // Empty check
  const trimmed = id.trim();
  if (trimmed.length === 0) {
    return {
      valid: allowEmpty,
      error: allowEmpty ? undefined : 'ID cannot be empty',
    };
  }

  // Length check
  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `ID exceeds maximum length of ${maxLength} characters`,
    };
  }

  // Path traversal check
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.warn(
        `[Path Validation] Path traversal attempt detected: ${trimmed}`
      );
      return {
        valid: false,
        error: 'Invalid characters in ID',
      };
    }
  }

  // Safe character check
  if (!SAFE_ID_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error: 'ID can only contain letters, numbers, hyphens, and underscores',
    };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Validate that a path stays within an allowed base directory
 *
 * @param basePath - The allowed base directory (absolute path)
 * @param targetPath - The path to validate (can be relative or absolute)
 * @returns Validation result with resolved absolute path if valid
 *
 * @example
 * ```ts
 * const result = validatePathWithinBase(
 *   '/app/templates',
 *   'personal-brand-pro/index.html'
 * );
 * if (result.valid) {
 *   // Safe to read from result.sanitized
 * }
 * ```
 */
export function validatePathWithinBase(
  basePath: string,
  targetPath: string
): PathValidationResult {
  if (!basePath || !targetPath) {
    return { valid: false, error: 'Both base and target paths are required' };
  }

  try {
    // Resolve both paths to absolute
    const resolvedBase = path.resolve(basePath);
    const resolvedTarget = path.resolve(basePath, targetPath);

    // Normalize paths for comparison (handles different path separators)
    const normalizedBase = path.normalize(resolvedBase);
    const normalizedTarget = path.normalize(resolvedTarget);

    // Check that target is within base directory
    // Add path separator to prevent matching partial directory names
    // e.g., /app/templates vs /app/templates-backup
    const baseWithSep = normalizedBase.endsWith(path.sep)
      ? normalizedBase
      : normalizedBase + path.sep;

    if (
      !normalizedTarget.startsWith(baseWithSep) &&
      normalizedTarget !== normalizedBase
    ) {
      console.warn(
        `[Path Validation] Path escape attempt: ${targetPath} -> ${normalizedTarget} (base: ${normalizedBase})`
      );
      return {
        valid: false,
        error: 'Path must be within the allowed directory',
      };
    }

    return {
      valid: true,
      sanitized: normalizedTarget,
    };
  } catch (error) {
    console.error('[Path Validation] Error validating path:', error);
    return {
      valid: false,
      error: 'Invalid path format',
    };
  }
}

/**
 * Validate a template ID against known templates
 *
 * This is the most secure approach - allowlist validation.
 *
 * @param templateId - The template ID to validate
 * @param allowedTemplates - Array of allowed template IDs
 * @returns Validation result
 *
 * @example
 * ```ts
 * const allowed = ['personal-brand-pro', 'local-business-pro'];
 * const result = validateTemplateId('personal-brand-pro', allowed);
 * ```
 */
export function validateTemplateId(
  templateId: string,
  allowedTemplates: readonly string[]
): PathValidationResult {
  // First validate as a resource ID
  const resourceValidation = validateResourceId(templateId);
  if (!resourceValidation.valid) {
    return resourceValidation;
  }

  // Then check against allowlist
  if (!allowedTemplates.includes(resourceValidation.sanitized!)) {
    return {
      valid: false,
      error: 'Template not found',
    };
  }

  return {
    valid: true,
    sanitized: resourceValidation.sanitized,
  };
}

/**
 * Get all allowed template IDs from the project templates
 * Dynamically imports to avoid circular dependencies
 */
export async function getAllowedTemplateIds(): Promise<string[]> {
  const { projectTemplates } = await import('@/data/project-templates');
  return projectTemplates.map((t) => t.id);
}

/**
 * Validate UUID format
 * Used for validating project IDs, user IDs, etc.
 *
 * @param id - The ID to validate
 * @returns Validation result
 */
export function validateUUID(
  id: string | undefined | null
): PathValidationResult {
  if (id == null || typeof id !== 'string') {
    return { valid: false, error: 'ID is required' };
  }

  const trimmed = id.trim();

  // Standard UUID format: 8-4-4-4-12 hexadecimal characters
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid ID format',
    };
  }

  return {
    valid: true,
    sanitized: trimmed.toLowerCase(),
  };
}

/**
 * Create a safe filename from user input
 * Removes all potentially dangerous characters
 *
 * @param input - The user input to sanitize
 * @param extension - Optional file extension to append
 * @returns Sanitized filename
 */
export function sanitizeFilename(input: string, extension?: string): string {
  // Remove all non-alphanumeric characters except hyphens and underscores
  let safe = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-') // Replace unsafe chars with hyphen
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Ensure minimum length
  if (safe.length === 0) {
    safe = 'file';
  }

  // Truncate if too long
  if (safe.length > 64) {
    safe = safe.substring(0, 64);
  }

  // Add extension if provided
  if (extension) {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    safe = `${safe}${ext}`;
  }

  return safe;
}
