/**
 * Generate URL-friendly slugs from project names
 */

/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Remove special characters
      .replace(/[^\w\s-]/g, '')
      // Replace spaces with dashes
      .replace(/\s+/g, '-')
      // Remove consecutive dashes
      .replace(/-+/g, '-')
      // Limit length
      .slice(0, 50)
  );
}

/**
 * Generate a unique slug by appending a short random suffix
 * Format: project-name-abc123
 */
export function generateProjectSlug(name: string): string {
  const baseSlug = slugify(name) || 'project';
  const suffix = Math.random().toString(36).slice(2, 8);

  return `${baseSlug}-${suffix}`;
}

/**
 * Check if a string looks like a Convex ID (32+ alphanumeric chars starting with letter)
 */
export function isConvexId(id: string): boolean {
  return /^[a-z][a-z0-9]{30,}$/i.test(id);
}

/**
 * Check if a string looks like a legacy project ID (proj_timestamp_random)
 */
export function isLegacyProjectId(id: string): boolean {
  return /^proj_\d+_[a-z0-9]+$/i.test(id);
}

/**
 * Extract the human-readable part of a slug
 */
export function getSlugDisplayName(slug: string): string {
  // Remove trailing random suffix (assumes format: name-abc123)
  const parts = slug.split('-');

  if (parts.length > 1 && /^[a-z0-9]{6}$/.test(parts[parts.length - 1])) {
    parts.pop();
  }

  // Convert dashes to spaces and title case
  return parts.join(' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

