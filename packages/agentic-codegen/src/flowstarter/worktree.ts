import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, realpath, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import { assertSafeScaffoldPath } from './template-library-mcp';
import type { TemplateScaffold, TemplateScaffoldFile } from './types';

const execFileAsync = promisify(execFile);

export interface GitWorktree {
  branch: string;
  path: string;
}

export interface SafeGitWorktreeManagerOptions {
  repositoryRoot: string;
  worktreesRoot: string;
  baseRef?: string;
}

export class SafeGitWorktreeManager {
  private readonly baseRef: string;

  constructor(private readonly options: SafeGitWorktreeManagerOptions) {
    this.baseRef = options.baseRef ?? 'main';
    assertSafeGitRef(this.baseRef, 'baseRef');
    if (!isAbsolute(options.repositoryRoot) || !isAbsolute(options.worktreesRoot)) {
      throw new TypeError('Git repository and worktree roots must be absolute paths');
    }
  }

  async create(projectId: string): Promise<GitWorktree> {
    const normalizedProjectId = assertUuid(projectId);
    const repositoryRoot = await realpath(this.options.repositoryRoot);
    await mkdir(this.options.worktreesRoot, { recursive: true, mode: 0o700 });
    const worktreesRoot = await realpath(this.options.worktreesRoot);
    if (repositoryRoot === worktreesRoot) throw new Error('Worktrees root cannot equal the repository root');
    assertNotBroadRoot(worktreesRoot);

    const { stdout: reportedRoot } = await runGit(repositoryRoot, ['rev-parse', '--show-toplevel']);
    if ((await realpath(reportedRoot.trim())) !== repositoryRoot) {
      throw new Error('Configured repositoryRoot is not the git top-level directory');
    }

    const branch = `client/flowstarter-${normalizedProjectId}`;
    const worktreePath = join(worktreesRoot, `flowstarter-${normalizedProjectId}`);
    assertContained(worktreesRoot, worktreePath);
    if (await pathExists(worktreePath)) throw new Error(`Worktree path already exists for project ${projectId}`);

    const branchCheck = await runGit(repositoryRoot, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], {
      allowExitCodes: [0, 1],
    });
    if (branchCheck.exitCode === 0) throw new Error(`Git branch already exists for project ${projectId}`);

    await runGit(repositoryRoot, ['worktree', 'add', '-b', branch, worktreePath, this.baseRef]);
    const canonicalWorktree = await realpath(worktreePath);
    assertContained(worktreesRoot, canonicalWorktree);
    return { branch, path: canonicalWorktree };
  }

  async commit(worktree: GitWorktree, message: string): Promise<string> {
    assertSafeGitRef(worktree.branch, 'branch');
    if (!/^build: initialize Flowstarter site [0-9a-f-]{36}$/.test(message)) {
      throw new Error('Commit message is outside the Flowstarter build policy');
    }
    const root = await realpath(worktree.path);
    const configuredRoot = await realpath(this.options.worktreesRoot);
    assertContained(configuredRoot, root);
    await runGit(root, ['add', '--all']);
    await runGit(root, ['commit', '--message', message]);
    const { stdout } = await runGit(root, ['rev-parse', 'HEAD']);
    return stdout.trim();
  }
}

export async function createPreviewWorkspace(scaffold: TemplateScaffold): Promise<{
  root: string;
  templateSlug: string;
}> {
  const root = await mkdtemp(join(tmpdir(), 'flowstarter-preview-'));
  await materializeScaffold(root, scaffold.files);
  return { root, templateSlug: scaffold.template.metadata.slug };
}

export async function materializeScaffold(root: string, files: readonly TemplateScaffoldFile[]): Promise<void> {
  const canonicalRoot = await realpath(root);
  for (const file of files) {
    assertSafeScaffoldPath(file.path);
    const target = resolve(canonicalRoot, file.path);
    assertContained(canonicalRoot, target);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content, { encoding: 'utf8', flag: 'wx', mode: 0o644 });
  }
}

function assertUuid(value: string): string {
  const normalized = value.toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) {
    throw new TypeError('projectId must be a canonical UUID');
  }
  return normalized;
}

function assertSafeGitRef(value: string, field: string): void {
  if (
    value.length === 0 ||
    value.length > 180 ||
    value.startsWith('-') ||
    value.startsWith('/') ||
    value.endsWith('/') ||
    value.includes('..') ||
    value.includes('@{') ||
    value.includes('\\') ||
    !/^[A-Za-z0-9._/-]+$/.test(value)
  ) {
    throw new TypeError(`${field} is not a safe git ref`);
  }
}

function assertContained(root: string, candidate: string): void {
  const rel = relative(root, candidate);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error('Resolved path escapes its configured root');
  }
}

function assertNotBroadRoot(path: string): void {
  const parent = dirname(path);
  if (path === parent || basename(path).length === 0 || path.split(sep).filter(Boolean).length < 3) {
    throw new Error('Refusing to use a broad filesystem path as the worktree root');
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function runGit(
  cwd: string,
  args: string[],
  options: { allowExitCodes?: number[] } = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const result = await execFileAsync('git', args, {
      cwd,
      encoding: 'utf8',
      timeout: 60_000,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
    });
    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number };
    const exitCode = typeof failure.code === 'number' ? failure.code : -1;
    if (options.allowExitCodes?.includes(exitCode)) {
      return { stdout: failure.stdout ?? '', stderr: failure.stderr ?? '', exitCode };
    }
    throw new Error(`git ${args[0] ?? 'command'} failed: ${(failure.stderr ?? failure.message).slice(0, 1_000)}`);
  }
}
