/**
 * Runs INSIDE the Daytona sandbox. Drives the autonomous build agent via the
 * @anthropic-ai/claude-agent-sdk `query()` API with a build system prompt,
 * and streams compact progress JSON lines on stdout so the orchestrator can
 * relay real progress to the funnel visitor.
 *
 * Self-contained (no repo imports — only @anthropic-ai/claude-agent-sdk,
 * installed in the sandbox). Inputs via env:
 *   FS_SITE_DIR     working dir (the scaffolded Astro template)
 *   FS_SYSTEM_FILE  path to the build system prompt
 *   FS_TASK_FILE    path to the per-business task
 *   FS_MODEL        model id (default claude-sonnet-4-6 — build quality)
 *   ANTHROPIC_API_KEY  auth
 *
 * Exit 0 = agent completed; non-zero = failure.
 */
import { readFileSync } from 'node:fs';

const out = (o) => process.stdout.write(JSON.stringify(o) + '\n');

const siteDir = process.env.FS_SITE_DIR;
const system = readFileSync(process.env.FS_SYSTEM_FILE, 'utf8');
const task = readFileSync(process.env.FS_TASK_FILE, 'utf8');
const model = process.env.FS_MODEL || 'claude-sonnet-4-6';

if (!siteDir || !process.env.ANTHROPIC_API_KEY) {
  out({ type: 'error', message: 'missing FS_SITE_DIR or ANTHROPIC_API_KEY' });
  process.exit(2);
}

let query;
try {
  ({ query } = await import('@anthropic-ai/claude-agent-sdk'));
} catch (e) {
  out({ type: 'error', message: 'agent-sdk import failed: ' + String(e?.message || e) });
  process.exit(3);
}

const phaseFor = (name, input) => {
  const i = input || {};
  if (name === 'Write' || name === 'Edit' || name === 'MultiEdit')
    return { phase: 'Writing the site', detail: String(i.file_path || '').split('/').slice(-2).join('/') };
  if (name === 'Read' || name === 'Glob' || name === 'Grep') return { phase: 'Studying the template' };
  if (name === 'Bash') {
    const c = String(i.command || '');
    if (/astro build/.test(c)) return { phase: 'Checking the build' };
    if (/npm |bun /.test(c)) return { phase: 'Installing' };
    return { phase: 'Working' };
  }
  if (name === 'TodoWrite') return { phase: 'Planning the design' };
  return { phase: 'Working', detail: name };
};

try {
  out({ type: 'start', model });
  let costUsd = 0;
  let turns = 0;

  const run = query({
    prompt: task,
    options: {
      cwd: siteDir,
      additionalDirectories: [siteDir],
      model,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      appendSystemPrompt: system,
      includePartialMessages: false,
      env: process.env,
      ...(process.env.FS_CLAUDE_BIN
        ? { pathToClaudeCodeExecutable: process.env.FS_CLAUDE_BIN }
        : {}),
    },
  });

  for await (const msg of run) {
    if (msg?.type === 'assistant') {
      for (const block of msg.message?.content ?? []) {
        if (block.type === 'tool_use') out(phaseFor(String(block.name), block.input));
        else if (block.type === 'text' && block.text?.trim())
          out({ phase: 'Thinking', detail: block.text.trim().slice(0, 140) });
      }
    } else if (msg?.type === 'result') {
      if (typeof msg.total_cost_usd === 'number') costUsd = msg.total_cost_usd;
      if (typeof msg.num_turns === 'number') turns = msg.num_turns;
    }
  }

  out({ type: 'done', costUsd, turns });
  process.exit(0);
} catch (e) {
  out({ type: 'error', message: String(e?.message || e).slice(0, 300) });
  process.exit(1);
}
