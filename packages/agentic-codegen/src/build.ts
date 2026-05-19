import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileExists } from './workspace';

export interface BuildResult {
  ok: boolean;
  /** Combined stdout+stderr, tail-trimmed for feeding back to the agent. */
  log: string;
  distDir: string;
  indexHtml: string;
  step: 'install' | 'build' | 'done';
}

function run(
  cmd: string,
  args: string[],
  cwd: string,
  timeoutMs: number
): Promise<{ code: number | null; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, CI: '1', ASTRO_TELEMETRY_DISABLED: '1' },
    });
    let out = '';
    const cap = (b: Buffer) => {
      out += b.toString();
      if (out.length > 200_000) out = out.slice(-200_000);
    };
    child.stdout.on('data', cap);
    child.stderr.on('data', cap);
    const timer = setTimeout(() => {
      out += `\n[timed out after ${timeoutMs}ms — killed]\n`;
      child.kill('SIGKILL');
    }, timeoutMs);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, out });
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ code: 1, out: out + `\n[spawn error: ${String(err)}]\n` });
    });
  });
}

/**
 * Build the (warm) workspace. node_modules is a symlink to the pre-installed
 * cache, so `npm install` is skipped entirely — we run the local astro binary
 * directly. Only installs if node_modules is somehow absent.
 */
export async function runBuild(
  buildDir: string,
  opts: { installTimeoutMs?: number; buildTimeoutMs?: number } = {}
): Promise<BuildResult> {
  const distDir = join(buildDir, 'dist');
  const indexHtml = join(distDir, 'index.html');

  if (!(await fileExists(join(buildDir, 'node_modules')))) {
    const install = await run(
      'npm',
      ['install', '--no-audit', '--no-fund', '--loglevel=error'],
      buildDir,
      opts.installTimeoutMs ?? 240_000
    );
    if (install.code !== 0) {
      return { ok: false, log: tail(install.out), distDir, indexHtml, step: 'install' };
    }
  }

  const build = await run(
    join(buildDir, 'node_modules', '.bin', 'astro'),
    ['build'],
    buildDir,
    opts.buildTimeoutMs ?? 240_000
  );
  const built = await fileExists(indexHtml);
  return {
    ok: build.code === 0 && built,
    log: tail(build.out),
    distDir,
    indexHtml,
    step: build.code === 0 && built ? 'done' : 'build',
  };
}

function tail(s: string, n = 6000): string {
  return s.length > n ? s.slice(-n) : s;
}
