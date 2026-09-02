/**
 * Bootstrapping the sites repository that local mode builds into.
 *
 * Production points `FLOWSTARTER_REPOSITORY_ROOT` at a clone of the real sites
 * repo, provisioned before the worker ever starts. A laptop has nothing, and
 * `SafeGitWorktreeManager` needs a genuine git top-level with the base ref
 * present — so local mode creates one on first boot rather than failing every
 * job with "not a git repository".
 *
 * This only ever runs in local mode and only ever initialises an empty
 * directory: an existing repository is left exactly as it is.
 */

import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function isGitRepository(root: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['rev-parse', '--show-toplevel'],
      { cwd: root, encoding: 'utf8' },
    );
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function ensureLocalSitesRepository(
  root: string,
  baseRef: string,
): Promise<{ created: boolean }> {
  await mkdir(root, { recursive: true, mode: 0o700 });
  if (await isGitRepository(root)) return { created: false };

  await execFileAsync('git', ['init', '-b', baseRef], { cwd: root });
  await writeFile(
    join(root, 'README.md'),
    '# Flowstarter local sites\n\nCreated by the build worker in local mode.\n',
    'utf8',
  );
  await execFileAsync('git', ['add', '--all'], { cwd: root });
  await execFileAsync(
    'git',
    ['commit', '--message', 'chore: seed local sites repository'],
    {
      cwd: root,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME ?? 'Flowstarter Build Agent',
        GIT_AUTHOR_EMAIL:
          process.env.GIT_AUTHOR_EMAIL ?? 'build-agent@flowstarter.net',
        GIT_COMMITTER_NAME:
          process.env.GIT_COMMITTER_NAME ?? 'Flowstarter Build Agent',
        GIT_COMMITTER_EMAIL:
          process.env.GIT_COMMITTER_EMAIL ?? 'build-agent@flowstarter.net',
      },
    },
  );
  return { created: true };
}
