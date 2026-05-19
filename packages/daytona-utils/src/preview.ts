/**
 * Live preview helper: take a built/personalized site directory, push it into
 * a Daytona sandbox, run its dev server, and return a public preview URL the
 * funnel visitor can see. Plus a teardown() that deletes the sandbox so a
 * preview run never leaks billable cloud resources.
 *
 * Targets @daytonaio/sdk v0.150.0 API.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { getClient } from './client';
import { bootstrapWorkspace } from './bootstrap';
import type { BootstrapOptions, DaytonaEnv } from './types';

const EXCLUDE_DIRS = new Set(['node_modules', 'dist', '.astro', '.git']);
/** Skip binary-ish assets that don't belong in an upload-as-text map. */
const SKIP_EXT = /\.(png|jpe?g|webp|gif|ico|woff2?|ttf|mp4|zip)$/i;

async function readSiteFiles(dir: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  async function walk(abs: string): Promise<void> {
    for (const entry of await readdir(abs, { withFileTypes: true })) {
      if (entry.name.startsWith('.git')) continue;
      const childAbs = join(abs, entry.name);
      if (entry.isDirectory()) {
        if (EXCLUDE_DIRS.has(entry.name)) continue;
        await walk(childAbs);
      } else if (entry.isFile()) {
        const rel = relative(dir, childAbs).split(sep).join('/');
        if (SKIP_EXT.test(entry.name)) continue;
        const sz = (await stat(childAbs)).size;
        if (sz > 512 * 1024) continue; // no oversized blobs
        files[rel] = await readFile(childAbs, 'utf8');
      }
    }
  }
  await walk(dir);
  return files;
}

/**
 * Push a single updated file into a running sandbox (the 15-prompt edit
 * loop): the dev server's HMR re-renders the live preview, no rebuild.
 */
export async function pushFileToSandbox(
  sandboxId: string,
  relPath: string,
  content: string,
  env?: DaytonaEnv
): Promise<boolean> {
  try {
    const client = getClient(env);
    const sandbox = await client.get(sandboxId);
    let workDir: string;
    try {
      workDir = (await sandbox.getWorkDir()) || '/home/daytona';
    } catch {
      workDir = '/home/daytona';
    }
    await sandbox.fs.uploadFile(
      Buffer.from(content, 'utf-8'),
      `${workDir}/${relPath}`
    );
    return true;
  } catch {
    return false;
  }
}

export interface SandboxPreview {
  success: boolean;
  previewUrl?: string;
  sandboxId?: string;
  error?: string;
  failedAtStep?: number;
  /** Always delete the sandbox when done — preview runs must not leak cost. */
  teardown: () => Promise<void>;
}

export async function previewInSandbox(
  siteDir: string,
  opts: {
    projectId: string;
    env?: DaytonaEnv;
    onProgress?: BootstrapOptions['onProgress'];
  }
): Promise<SandboxPreview> {
  const files = await readSiteFiles(siteDir);
  const result = await bootstrapWorkspace({
    projectId: opts.projectId,
    files,
    env: opts.env,
    onProgress: opts.onProgress,
  });

  const teardown = async (): Promise<void> => {
    if (!result.success || !result.sandboxId) return;
    try {
      const client = getClient(opts.env);
      const sandbox = await client.get(result.sandboxId);
      await client.delete(sandbox);
    } catch {
      /* best-effort; autoStopInterval is the backstop */
    }
  };

  return {
    success: result.success,
    previewUrl: result.success ? result.previewUrl : undefined,
    sandboxId: result.sandboxId,
    error: result.success ? undefined : result.error,
    failedAtStep: result.success ? undefined : result.failedAtStep,
    teardown,
  };
}
