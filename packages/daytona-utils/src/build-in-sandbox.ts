/**
 * Autonomous build, fully in-sandbox. Provision a Daytona sandbox, upload an
 * Astro template + the Agent SDK runner, install @anthropic-ai/claude-agent-sdk
 * + the claude binary, run the autonomous build agent INSIDE the sandbox
 * (streaming real progress), then `astro dev` → public preview URL. Always
 * returns a teardown() so a run never leaks billable cloud resources.
 *
 * Targets @daytonaio/sdk v0.150.0.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep, dirname } from 'node:path';
import { getClient } from './client';
import { getPreviewUrl } from './sandbox';
import type { DaytonaEnv } from './types';

const EXCLUDE = new Set(['node_modules', 'dist', '.astro', '.git']);
const SKIP_EXT = /\.(png|jpe?g|webp|gif|ico|woff2?|ttf|mp4|zip)$/i;

async function readDirFiles(dir: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  async function walk(abs: string): Promise<void> {
    for (const e of await readdir(abs, { withFileTypes: true })) {
      if (e.name.startsWith('.git')) continue;
      const p = join(abs, e.name);
      if (e.isDirectory()) {
        if (!EXCLUDE.has(e.name)) await walk(p);
      } else if (e.isFile() && !SKIP_EXT.test(e.name)) {
        if ((await stat(p)).size > 512 * 1024) continue;
        files[relative(dir, p).split(sep).join('/')] = await readFile(p, 'utf8');
      }
    }
  }
  await walk(dir);
  return files;
}

export interface InSandboxBuild {
  success: boolean;
  previewUrl?: string;
  sandboxId?: string;
  costUsd?: number;
  error?: string;
  teardown: () => Promise<void>;
}

export interface InSandboxBuildOpts {
  projectId: string;
  /** Build system prompt (agent-build.ts AGENT_BUILD_SYSTEM). */
  systemPrompt: string;
  /** Per-business task (agent-build.ts buildAgentTask). */
  taskPrompt: string;
  /** Absolute path to the agent-runner.mjs to upload. */
  runnerPath: string;
  model?: string;
  env?: DaytonaEnv;
  /** ANTHROPIC key for the in-sandbox agent. */
  anthropicApiKey: string;
  onProgress?: (e: { phase: string; detail?: string }) => void;
  /** Hard wall-clock for the autonomous agent. Default 12 min. */
  agentTimeoutMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function buildSiteInSandbox(
  siteDir: string,
  opts: InSandboxBuildOpts
): Promise<InSandboxBuild> {
  const client = getClient(opts.env);
  const model = opts.model ?? 'claude-sonnet-4-6';
  const agentTimeoutMs = opts.agentTimeoutMs ?? 12 * 60_000;
  const emit = (phase: string, detail?: string) => opts.onProgress?.({ phase, detail });

  emit('Preparing your studio');
  const sandbox = await client.create(
    {
      language: 'javascript',
      envVars: { ANTHROPIC_API_KEY: opts.anthropicApiKey },
      autoStopInterval: 30,
      public: true,
      labels: { project: opts.projectId, source: 'flowstarter' },
    },
    { timeout: 180 }
  );
  const sandboxId = sandbox.id;
  let toreDown = false;
  const teardown = async () => {
    if (toreDown) return;
    toreDown = true;
    try {
      await client.delete(sandbox);
    } catch {
      /* autoStopInterval backstop */
    }
  };

  try {
    const workDir = (await sandbox.getWorkDir().catch(() => '')) || '/home/daytona';
    const siteRoot = `${workDir}/site`;
    const agentDir = `${workDir}/.agent`;

    // Upload the template + the agent runner + prompts.
    emit('Setting up the workspace');
    const files = await readDirFiles(siteDir);
    const dirs = new Set<string>();
    for (const f of Object.keys(files)) {
      const d = dirname(f);
      if (d && d !== '.') dirs.add(d);
    }
    await sandbox.process.executeCommand(
      `mkdir -p "${siteRoot}" "${agentDir}" ${Array.from(dirs)
        .map((d) => `"${siteRoot}/${d}"`)
        .join(' ')}`.trim(),
      workDir,
      undefined,
      30
    );
    const entries = Object.entries(files);
    for (let i = 0; i < entries.length; i += 6) {
      await Promise.all(
        entries.slice(i, i + 6).map(([rel, content]) =>
          sandbox.fs.uploadFile(Buffer.from(content, 'utf-8'), `${siteRoot}/${rel}`)
        )
      );
    }
    await sandbox.fs.uploadFile(
      Buffer.from(await readFile(opts.runnerPath, 'utf-8'), 'utf-8'),
      `${agentDir}/agent-runner.mjs`
    );
    await sandbox.fs.uploadFile(Buffer.from(opts.systemPrompt, 'utf-8'), `${agentDir}/system.txt`);
    await sandbox.fs.uploadFile(Buffer.from(opts.taskPrompt, 'utf-8'), `${agentDir}/task.txt`);

    // Install: template deps + Agent SDK + claude binary. Staged so a
    // failure names the offending step and surfaces its output.
    const step = async (label: string, cmd: string, timeout: number) => {
      emit(label);
      const r = await sandbox.process.executeCommand(cmd, workDir, undefined, timeout);
      if (r.exitCode !== 0) {
        const tail = (r.result || '').trim().slice(-700);
        throw new Error(`${label} failed (exit ${r.exitCode}): ${tail}`);
      }
      return (r.result || '').trim();
    };
    try {
      await step(
        'Installing site dependencies',
        `cd "${siteRoot}" && npm install --no-audit --no-fund --loglevel=error 2>&1`,
        300
      );
      // Local install (no `-g`: the image's global npm prefix is not
      // user-writable → EACCES). The SDK is pointed at the local binary.
      await step(
        'Installing the agent SDK',
        `cd "${agentDir}" && npm init -y >/dev/null 2>&1; npm i --no-audit --no-fund --loglevel=error @anthropic-ai/claude-agent-sdk @anthropic-ai/claude-code 2>&1`,
        360
      );
    } catch (e) {
      return {
        success: false,
        sandboxId,
        error: e instanceof Error ? e.message : 'toolchain install failed',
        teardown,
      };
    }
    const claudeBin = `${agentDir}/node_modules/.bin/claude`;

    // Launch the autonomous Agent-SDK build, detached, logging JSONL.
    emit('Starting the design agent');
    await sandbox.process.executeCommand(
      `cd "${agentDir}" && FS_SITE_DIR="${siteRoot}" FS_SYSTEM_FILE="${agentDir}/system.txt" ` +
        `FS_TASK_FILE="${agentDir}/task.txt" FS_MODEL="${model}" FS_CLAUDE_BIN="${claudeBin}" ` +
        `ANTHROPIC_API_KEY="${opts.anthropicApiKey}" nohup node agent-runner.mjs > /tmp/agent.log 2>&1 &`,
      workDir,
      undefined,
      15
    );

    // Poll the agent log → relay real progress until done/error/timeout.
    const start = Date.now();
    let seen = 0;
    let costUsd = 0;
    let agentDone = false;
    let agentErr: string | undefined;
    while (Date.now() - start < agentTimeoutMs) {
      await sleep(6000);
      const tail = await sandbox.process
        .executeCommand(`cat /tmp/agent.log 2>/dev/null || true`, workDir, undefined, 15)
        .catch(() => ({ result: '' }) as { result?: string });
      const lines = (tail.result || '').split('\n').filter(Boolean);
      for (const line of lines.slice(seen)) {
        try {
          const o = JSON.parse(line) as Record<string, unknown>;
          if (o.type === 'done') {
            agentDone = true;
            if (typeof o.costUsd === 'number') costUsd = o.costUsd;
          } else if (o.type === 'error') {
            agentErr = String(o.message ?? 'agent error');
          } else if (o.phase) {
            emit(String(o.phase), o.detail ? String(o.detail) : undefined);
          }
        } catch {
          /* non-JSON log noise */
        }
      }
      seen = lines.length;
      if (agentDone || agentErr) break;
    }
    if (agentErr) return { success: false, sandboxId, error: agentErr, teardown };
    if (!agentDone) return { success: false, sandboxId, error: 'agent timed out', teardown };

    // Serve it: astro dev bound to 0.0.0.0 so the Daytona proxy can reach it.
    emit('Publishing the preview');
    await sandbox.process.executeCommand(
      `cd "${siteRoot}" && pkill -f 'astro dev' || true; ` +
        `nohup npx astro dev --host 0.0.0.0 --port 4321 > /tmp/dev.log 2>&1 &`,
      workDir,
      undefined,
      15
    );

    let previewUrl: string | undefined;
    const dl = Date.now();
    while (Date.now() - dl < 90_000) {
      await sleep(4000);
      previewUrl = await getPreviewUrl(sandbox);
      if (previewUrl) break;
    }
    if (!previewUrl) {
      return { success: false, sandboxId, error: 'preview URL not available', teardown };
    }

    emit('Ready');
    return { success: true, previewUrl, sandboxId, costUsd, teardown };
  } catch (e) {
    return {
      success: false,
      sandboxId,
      error: e instanceof Error ? e.message : 'in-sandbox build error',
      teardown,
    };
  }
}
