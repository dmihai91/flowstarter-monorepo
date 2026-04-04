import { describe, it, expect } from 'vitest';
import { validateWorkspaceId, validateProjectId, resolveSandboxPath, shellEscape } from './sanitize';

describe('validateWorkspaceId', () => {
  it('accepts valid alphanumeric IDs', () => {
    expect(validateWorkspaceId('abc-123')).toBe('abc-123');
    expect(validateWorkspaceId('workspace_id')).toBe('workspace_id');
    expect(validateWorkspaceId('A1b2C3')).toBe('A1b2C3');
  });

  it('rejects empty or missing IDs', () => {
    expect(() => validateWorkspaceId('')).toThrow('Workspace ID is required');

    expect(() => validateWorkspaceId(null as any)).toThrow('Workspace ID is required');
  });

  it('blocks command injection via semicolon', () => {
    expect(() => validateWorkspaceId('workspace-id; rm -rf /')).toThrow('Invalid workspace ID format');
  });

  it('blocks command injection via backticks', () => {
    expect(() => validateWorkspaceId('id`whoami`')).toThrow('Invalid workspace ID format');
  });

  it('blocks command injection via $() substitution', () => {
    expect(() => validateWorkspaceId('id$(cat /etc/passwd)')).toThrow('Invalid workspace ID format');
  });

  it('blocks pipe injection', () => {
    expect(() => validateWorkspaceId('id | cat /etc/passwd')).toThrow('Invalid workspace ID format');
  });

  it('blocks newline injection', () => {
    expect(() => validateWorkspaceId('id\ninjected')).toThrow('Invalid workspace ID format');
  });
});

describe('validateProjectId', () => {
  it('accepts valid project IDs with dots, hyphens, colons', () => {
    expect(validateProjectId('my-project')).toBe('my-project');
    expect(validateProjectId('project.v2')).toBe('project.v2');
    expect(validateProjectId('org:project-1')).toBe('org:project-1');
  });

  it('rejects empty or missing IDs', () => {
    expect(() => validateProjectId('')).toThrow('Project ID is required');
  });

  it('blocks command injection via semicolon', () => {
    expect(() => validateProjectId('project; injected-cmd')).toThrow('Invalid project ID format');
  });

  it('blocks shell metacharacters', () => {
    expect(() => validateProjectId('project$(whoami)')).toThrow('Invalid project ID format');
    expect(() => validateProjectId('project`id`')).toThrow('Invalid project ID format');
    expect(() => validateProjectId('project | cat')).toThrow('Invalid project ID format');
  });
});

describe('resolveSandboxPath', () => {
  const sandboxRoot = '/home/daytona';

  it('resolves relative paths within sandbox', () => {
    expect(resolveSandboxPath('src/index.ts', sandboxRoot)).toBe('/home/daytona/src/index.ts');
    expect(resolveSandboxPath('package.json', sandboxRoot)).toBe('/home/daytona/package.json');
  });

  it('accepts absolute paths within sandbox', () => {
    expect(resolveSandboxPath('/home/daytona/src/app.ts', sandboxRoot)).toBe('/home/daytona/src/app.ts');
  });

  it('blocks path traversal with ../../etc/passwd', () => {
    expect(() => resolveSandboxPath('../../etc/passwd', sandboxRoot)).toThrow('Path traversal blocked');
  });

  it('blocks path traversal with absolute path outside root', () => {
    expect(() => resolveSandboxPath('/etc/passwd', sandboxRoot)).toThrow('Path traversal blocked');
  });

  it('blocks path traversal with nested ../ sequences', () => {
    expect(() => resolveSandboxPath('src/../../../etc/shadow', sandboxRoot)).toThrow('Path traversal blocked');
  });

  it('blocks traversal via encoded-style patterns after normalization', () => {
    // path.posix.normalize will collapse these
    expect(() => resolveSandboxPath('../../../etc/passwd', sandboxRoot)).toThrow('Path traversal blocked');
  });

  it('allows paths with .. that still resolve within sandbox', () => {
    // src/../lib/util.ts resolves to /home/daytona/lib/util.ts — still inside
    expect(resolveSandboxPath('src/../lib/util.ts', sandboxRoot)).toBe('/home/daytona/lib/util.ts');
  });

  it('blocks traversal to sandbox root parent', () => {
    expect(() => resolveSandboxPath('..', sandboxRoot)).toThrow('Path traversal blocked');
    expect(() => resolveSandboxPath('../', sandboxRoot)).toThrow('Path traversal blocked');
  });
});

describe('shellEscape', () => {
  it('escapes double quotes', () => {
    expect(shellEscape('file"name')).toBe('file\\"name');
  });

  it('escapes dollar signs', () => {
    expect(shellEscape('$HOME')).toBe('\\$HOME');
  });

  it('escapes backticks', () => {
    expect(shellEscape('`whoami`')).toBe('\\`whoami\\`');
  });

  it('escapes backslashes', () => {
    expect(shellEscape('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  it('leaves safe strings unchanged', () => {
    expect(shellEscape('/home/daytona/src/index.ts')).toBe('/home/daytona/src/index.ts');
  });
});
