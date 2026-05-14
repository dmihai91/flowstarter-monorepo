/** Display name only (orchestration `title`); folder path is unchanged. */
export const PROJECT_DISPLAY_NAME_MAX_LENGTH = 200;

export function projectDisplayNameValidationError(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "Name cannot be empty.";
  }
  if (trimmed.length > PROJECT_DISPLAY_NAME_MAX_LENGTH) {
    return `Use at most ${PROJECT_DISPLAY_NAME_MAX_LENGTH} characters.`;
  }
  if (/[/\\]/.test(trimmed)) {
    return "Name cannot contain path separators (/ or \\).";
  }
  return null;
}
