// Cursor SDK adapter — runs a task through the headless Cursor agent
// (`cursor-agent` CLI) inside the build workspace. Sandbox-as-truth: agents
// read/write files in workspaceDir; the orchestrator reads results from disk.
//
// Discipline ported from agentic-codegen: wall-clock timeout kills the
// process; output is JSON-parsed; failures throw so the executor isolates them.
import { spawn } from 'node:child_process';
import type { AgentAdapter, AgentRunContext, Task } from '../types';

const BIN = () => process.env.CURSOR_AGENT_BIN ?? 'cursor-agent';
const MODEL = () => process.env.CURSOR_AGENT_MODEL ?? 'composer-1';

function buildPrompt(task: Task, ctx: AgentRunContext): string {
  const prior = Object.entries(ctx.priorResults)
    .map(([id, out]) => `--- result of task "${id}" ---\n${out}`)
    .join('\n\n');
  return [
    `GOAL: ${ctx.goal}`,
    '',
    `YOUR TASK: ${task.input}`,
    prior ? `\nPRIOR RESULTS:\n${prior}` : '',
    '',
    'Work inside the current directory. When the task asks for file changes, write them to disk.',
    'When the task asks for content/JSON, print it as your final answer.',
  ].join('\n');
}

export class CursorAgentAdapter implements AgentAdapter {
  readonly name = 'cursor-agent';

  constructor(private timeoutMs = 150_000) {}

  run(task: Task, ctx: AgentRunContext): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        '-p',
        buildPrompt(task, ctx),
        '--output-format',
        'json',
        '--model',
        MODEL(),
        '--force',
      ];
      const child = spawn(BIN(), args, {
        cwd: ctx.workspaceDir,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stderr += d));

      const killer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`cursor-agent timed out after ${this.timeoutMs}ms on task ${task.id}`));
      }, this.timeoutMs);

      child.on('error', (e) => {
        clearTimeout(killer);
        reject(new Error(`cursor-agent failed to start (${e.message}). Is the Cursor CLI installed and CURSOR_API_KEY set?`));
      });

      child.on('close', (code) => {
        clearTimeout(killer);
        if (code !== 0) {
          reject(new Error(`cursor-agent exited ${code} on task ${task.id}: ${stderr.slice(0, 400)}`));
          return;
        }
        // --output-format json prints a result envelope; fall back to raw text.
        try {
          const parsed = JSON.parse(stdout) as { result?: string; is_error?: boolean; error?: string };
          if (parsed.is_error) {
            reject(new Error(parsed.error ?? 'cursor-agent reported an error'));
            return;
          }
          resolve(parsed.result ?? stdout);
        } catch {
          resolve(stdout.trim());
        }
      });
    });
  }
}
