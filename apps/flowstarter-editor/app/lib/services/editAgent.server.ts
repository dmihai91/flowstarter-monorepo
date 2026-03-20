/**
 * Edit Agent — uses the Claude Agent SDK for file modifications.
 * Battle-tested Claude Code tools (Read, Edit, Write, Bash) handle
 * file operations natively. We just provide the working directory
 * and prompt.
 *
 * Flow:
 * 1. Load files from Convex into a temp directory
 * 2. Run the Agent SDK with an edit-focused prompt
 * 3. Collect modified files
 * 4. Save back to Convex
 * 5. Sync to Daytona for preview
 */
import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { trackLLMUsage, syncCostsToSupabase } from '~/lib/.server/llm/cost-tracker';
import type { AgentActivityEvent, GeneratedFile } from './claude-agent/types';

export type EditResult = {
  success: boolean;
  files: GeneratedFile[];
  error?: string;
  turns?: number;
  costUsd?: number;
};

type Emit = (event: AgentActivityEvent) => void;

type LegacyToolUseMessage = {
  type: 'tool_use';
  tool_name?: string;
  input?: { file_path?: string; path?: string };
};

type LegacyToolResultMessage = {
  type: 'tool_result';
  tool_name?: string;
  input?: { file_path?: string; path?: string };
};

type LegacyUsageMessage = {
  type: 'usage';
  input_tokens?: number;
  output_tokens?: number;
};

const MODEL = 'claude-sonnet-4-6';
const MAX_TURNS = 5;
const MAX_BUDGET_USD = 0.50;

/** Write files from Convex into a temp directory for the agent to work on. */
async function setupWorkDir(files: GeneratedFile[]): Promise<string> {
  const workDir = join(tmpdir(), `fs-edit-${Date.now()}`);
  await mkdir(workDir, { recursive: true });

  for (const file of files) {
    const fullPath = join(workDir, file.path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.content, 'utf-8');
  }

  return workDir;
}

/** Collect all files from the work directory after editing. */
async function collectFiles(dir: string, base = ''): Promise<GeneratedFile[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: GeneratedFile[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(full, rel));
    } else {
      files.push({ path: rel, content: await readFile(full, 'utf-8').catch(() => '') });
    }
  }

  return files;
}

/**
 * Run the Claude Agent SDK to modify site files.
 *
 * @param editPrompt - What the user wants to change (e.g., "Change the hero headline to ...")
 * @param currentFiles - Current files loaded from Convex
 * @param supabaseProjectId - For cost tracking
 * @param onEvent - Optional event emitter for UI updates
 */
export async function runEditAgent(
  editPrompt: string,
  currentFiles: GeneratedFile[],
  supabaseProjectId: string,
  onEvent?: Emit,
): Promise<EditResult> {
  const emit: Emit = onEvent ?? (() => {});
  const startedAt = Date.now();

  // 1. Set up temp directory with current files
  const workDir = await setupWorkDir(currentFiles);
  emit({ type: 'text', content: `Loaded ${currentFiles.length} files into workspace` });

  try {
    // 2. Run the Agent SDK
    emit({ type: 'text', content: 'Agent editing files...' });

    const abortController = new AbortController();
    let turns = 0;
    let totalCostUsd = 0;

    const result = query({
      prompt: editPrompt,
      options: {
        cwd: workDir,
        model: MODEL,
        maxTurns: MAX_TURNS,
        maxBudgetUsd: MAX_BUDGET_USD,
        systemPrompt: `You are editing an Astro website. The files are in the current directory.
Make the requested changes precisely. Do not rewrite entire files unless necessary.
Use the Edit tool for targeted changes. Use Write for new files only.
Keep all content in the original language. Preserve existing styles and structure.`,
        tools: ['Read', 'Edit', 'Write', 'Glob', 'Grep'],
        allowedTools: ['Read', 'Edit', 'Write', 'Glob', 'Grep'],
        persistSession: false,
        abortController,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        },
      },
    });

    // 3. Stream messages and track progress
    for await (const rawMessage of result) {
      const message = rawMessage as SDKMessage | LegacyToolUseMessage | LegacyToolResultMessage | LegacyUsageMessage;
      switch (message.type) {
        case 'assistant':
          turns++;
          // Extract text content
          for (const block of message.message.content) {
            if (block.type === 'text') {
              emit({ type: 'text', content: block.text });
            }
          }
          break;

        case 'tool_use':
          emit({ type: 'tool_call', name: message.tool_name || 'unknown', input: {} });
          break;

        case 'tool_result':
          // Track file writes
          if (message.tool_name === 'Edit' || message.tool_name === 'Write') {
            emit({ type: 'file_write', path: String((message as any).input?.file_path || ''), lines: 0 });
          }
          break;

        case 'result':
          if (message.subtype === 'success') {
            emit({ type: 'text', content: `Edit complete: ${message.result}` });
          } else if (message.subtype === 'error_max_turns') {
            emit({ type: 'error', message: 'Reached max turns without completing' });
          } else if (message.subtype === 'error_max_budget_usd') {
            emit({ type: 'error', message: 'Reached budget limit' });
          }
          // Extract cost info
          if ('cost_usd' in message) {
            totalCostUsd = (message as any).cost_usd || 0;
          }
          break;

        case 'usage':
          // Track token usage for cost
          const usage = message as any;
          if (usage.input_tokens || usage.output_tokens) {
            trackLLMUsage(supabaseProjectId, MODEL, 'site_modification', {
              promptTokens: usage.input_tokens || 0,
              completionTokens: usage.output_tokens || 0,
            });
          }
          break;
      }
    }

    // 4. Collect modified files
    const modifiedFiles = await collectFiles(workDir);
    emit({
      type: 'done',
      duration_ms: Date.now() - startedAt,
      turns,
      cost_usd: totalCostUsd,
      input_tokens: 0,
      output_tokens: 0,
    });

    // 5. Sync costs
    syncCostsToSupabase(supabaseProjectId).catch(() => {});

    return {
      success: true,
      files: modifiedFiles,
      turns,
      costUsd: totalCostUsd,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Edit agent failed';
    emit({ type: 'error', message });
    return { success: false, files: [], error: message };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
