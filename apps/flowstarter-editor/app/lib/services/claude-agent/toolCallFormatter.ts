const WRITE_TOOLS = new Set(['write', 'create_file', 'write_file']);
const EDIT_TOOLS = new Set(['edit', 'str_replace_editor', 'replace_in_file']);
const READ_TOOLS = new Set(['read', 'read_file', 'cat_file']);
const DELETE_TOOLS = new Set(['delete', 'delete_file', 'remove_file']);
const COMMAND_TOOLS = new Set(['bash', 'execute_command', 'run_command', 'exec_command']);
const GLOB_TOOLS = new Set(['glob', 'find_files']);
const GREP_TOOLS = new Set(['grep', 'search_files']);

export type ToolCallAction = 'create' | 'edit' | 'delete' | 'read' | 'command';

export interface ToolCallSummary {
  action: ToolCallAction;
  label: string;
  detail?: string;
  path?: string;
  command?: string;
}

function normalizeToolName(name: string): string {
  return name.trim().toLowerCase();
}

function getString(input: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = input[key];

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed) {
        return trimmed;
      }
    }
  }

  return undefined;
}

function truncate(value: string, max = 140): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function extractToolPath(input: Record<string, unknown>): string | undefined {
  return getString(input, 'file_path', 'path', 'old_file_path', 'new_file_path', 'target_file');
}

export function extractToolCommand(input: Record<string, unknown>): string | undefined {
  return getString(input, 'command', 'cmd');
}

function buildGenericDetail(input: Record<string, unknown>): string | undefined {
  const entries = Object.entries(input)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .slice(0, 3)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}: ${truncate(value)}`;
      }

      return `${key}: ${truncate(JSON.stringify(value))}`;
    });

  return entries.length > 0 ? entries.join(' · ') : undefined;
}

export function summarizeToolCall(name: string, input: Record<string, unknown>): ToolCallSummary {
  const normalizedName = normalizeToolName(name);
  const path = extractToolPath(input);
  const command = extractToolCommand(input);

  if (WRITE_TOOLS.has(normalizedName)) {
    return {
      action: 'create',
      label: 'Write file',
      detail: path,
      path,
    };
  }

  if (EDIT_TOOLS.has(normalizedName)) {
    return {
      action: 'edit',
      label: 'Edit file',
      detail: path,
      path,
    };
  }

  if (READ_TOOLS.has(normalizedName)) {
    return {
      action: 'read',
      label: 'Read file',
      detail: path,
      path,
    };
  }

  if (DELETE_TOOLS.has(normalizedName)) {
    return {
      action: 'delete',
      label: 'Delete file',
      detail: path,
      path,
    };
  }

  if (COMMAND_TOOLS.has(normalizedName)) {
    return {
      action: 'command',
      label: 'Run command',
      detail: command,
      command,
    };
  }

  if (GLOB_TOOLS.has(normalizedName)) {
    return {
      action: 'command',
      label: 'Find files',
      detail: getString(input, 'pattern', 'glob'),
    };
  }

  if (GREP_TOOLS.has(normalizedName)) {
    return {
      action: 'command',
      label: 'Search text',
      detail: getString(input, 'pattern', 'query'),
    };
  }

  return {
    action: 'command',
    label: titleCase(name),
    detail: buildGenericDetail(input),
    path,
    command,
  };
}
