/**
 * Agents SDK Pipeline — Full sub-agent orchestration
 *
 * Architecture:
 *   Orchestrator (Opus-4-6, MCP tools) directs the pipeline:
 *     → fetch_template     : loads Astro template files into working dir
 *     → spawn_coder_agent  : spins up Sonnet sub-agent for a file group
 *     → validate_syntax    : runs per-file AST/regex validation
 *     → push_to_preview    : deploys files to Daytona sandbox via HTTP
 *
 *   All events stream to the client via onAgentEvent → SSE → TerminalPanel.
 *
 * Runtime: Node.js only (SDK spawns local Claude Code CLI process).
 *          AGENTS_SDK_ENABLED=true to activate; Cloudflare Workers falls back
 *          to the memory-based batch path.
 */

import {
  query,
  tool,
  createSdkMcpServer,
  type Options,
  type SDKMessage,
} from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { tmpdir } from 'os';
import { mkdir, writeFile, readFile, readdir, rm } from 'fs/promises';
import { join, extname } from 'path';
import type { AgentActivityEvent } from './claude-agent/types';
import type { SiteGenerationInput, GeneratedFile, SiteGenerationResult } from './claude-agent/types';

// ── Re-export so callers don't need two imports ───────────────────────────────
export type { AgentActivityEvent };

// ── Types ─────────────────────────────────────────────────────────────────────

interface CoderTask {
  files: string[];        // relative paths within workDir
  instructions: string;   // what to change
  designSpec?: string;    // Opus design direction
}

type Emit = (event: AgentActivityEvent) => void;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function collectDir(dir: string, base = ''): Promise<GeneratedFile[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: GeneratedFile[] = [];
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const full = join(dir, e.name);
    const rel  = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...await collectDir(full, rel));
    else out.push({ path: rel, content: await readFile(full, 'utf-8') });
  }
  return out;
}

function countLines(s: string) { return s.split('\n').length; }

// ── Sub-agent: Sonnet coder ───────────────────────────────────────────────────

async function runCoderSubAgent(
  task: CoderTask,
  workDir: string,
  projectContext: string,
  emit: Emit,
): Promise<void> {
  const fileList = task.files.map(f => `- ${f}`).join('\n');
  const prompt = `You are a focused code generator for an Astro website.

${projectContext}

## Your task
${task.instructions}

## Design direction
${task.designSpec ?? 'Follow the template\'s existing style.'}

## Files you should modify/create
${fileList}

Read each file, apply the changes, and write it back. Be precise and complete.
Do not modify files not listed above.`;

  const opts: Options = {
    cwd: workDir,
    model: 'claude-sonnet-4-6',
    permissionMode: 'bypassPermissions',
    maxTurns: 20,
  };

  for await (const msg of query({ prompt, options: opts })) {
    emitSdkMessage(msg, emit);
  }
}

// ── Custom MCP tools ──────────────────────────────────────────────────────────

function buildMcpServer(
  workDir: string,
  input: SiteGenerationInput,
  templateFiles: GeneratedFile[],
  emit: Emit,
) {
  return createSdkMcpServer({
    name: 'flowstarter-pipeline',
    tools: [
      // 1. Scaffold template files into workDir
      tool(
        'scaffold_template',
        'Write all template files into the working directory so you can read and edit them.',
        {},
        async () => {
          for (const file of templateFiles) {
            const full = join(workDir, file.path);
            await mkdir(join(full, '..'), { recursive: true });
            await writeFile(full, file.content, 'utf-8');
          }
          emit({ type: 'tool_call', name: 'scaffold_template', input: { files: templateFiles.length } });
          return { content: [{ type: 'text', text: `Scaffolded ${templateFiles.length} template files into ${workDir}` }] };
        },
      ),

      // 2. Spawn a focused Sonnet sub-agent for a group of files
      tool(
        'spawn_coder_agent',
        'Spawn a Sonnet sub-agent to implement changes to a specific group of files. ' +
        'Use one call per logical group (e.g. hero section, services section, contact page).',
        {
          task_name:    z.string().describe('Short name for this task'),
          files:        z.array(z.string()).describe('Relative file paths to modify'),
          instructions: z.string().describe('Detailed instructions for what to change'),
          design_spec:  z.string().optional().describe('Design direction and brand voice'),
        },
        async ({ task_name, files, instructions, design_spec }) => {
          const bizName = input.businessInfo.name || input.siteName;
          const ctx = `Business: ${bizName}\nSite: ${input.siteName}\nIndustry: ${(input.businessInfo as Record<string,unknown>).targetAudience ?? ''}\nDescription: ${input.businessInfo.description ?? ''}`;

          emit({ type: 'tool_call', name: 'spawn_coder_agent', input: { task_name, files } });

          await runCoderSubAgent(
            { files, instructions, designSpec: design_spec },
            workDir,
            ctx,
            emit,
          );

          emit({ type: 'tool_result', name: 'spawn_coder_agent', duration_s: 0 });
          return { content: [{ type: 'text', text: `Coder sub-agent for "${task_name}" complete. Files updated: ${files.join(', ')}` }] };
        },
      ),

      // 3. Validate Astro/HTML syntax for a file
      tool(
        'validate_file',
        'Validate Astro or HTML syntax for a file in the working directory. Returns errors if any.',
        { path: z.string().describe('Relative file path to validate') },
        async ({ path }) => {
          try {
            const full = join(workDir, path);
            const content = await readFile(full, 'utf-8');
            const ext = extname(path);

            const issues: string[] = [];

            // Basic structural checks
            if (['.astro', '.html'].includes(ext)) {
              if ((content.match(/<[^>]+>/g) ?? []).length === 0) issues.push('No HTML tags found');
              const opens  = (content.match(/<[a-zA-Z][^/>]*>/g) ?? []).length;
              const closes = (content.match(/<\/[a-zA-Z][^>]*>/g) ?? []).length;
              if (Math.abs(opens - closes) > 3) issues.push(`Possible unclosed tags (${opens} open, ${closes} close)`);
            }

            emit({ type: 'file_read', path });
            const result = issues.length === 0
              ? `${path}: OK (${countLines(content)} lines)`
              : `${path}: ${issues.join('; ')}`;
            return { content: [{ type: 'text', text: result }] };
          } catch (e) {
            return { content: [{ type: 'text', text: `Error reading ${path}: ${e instanceof Error ? e.message : e}` }] };
          }
        },
      ),

      // 4. List files in workDir for inspection
      tool(
        'list_output_files',
        'List all generated files in the working directory.',
        {},
        async () => {
          const files = await collectDir(workDir);
          emit({ type: 'text', content: `Output: ${files.length} files` });
          return { content: [{ type: 'text', text: files.map(f => f.path).join('\n') }] };
        },
      ),
    ],
  });
}

// ── SDK message → AgentActivityEvent ─────────────────────────────────────────

function emitSdkMessage(msg: SDKMessage, emit: Emit) {
  switch (msg.type) {
    case 'assistant': {
      if (!msg.message?.content) break;
      for (const block of msg.message.content) {
        if (block.type === 'text' && block.text) {
          emit({ type: 'text', content: block.text });
        } else if (block.type === 'thinking' && (block as { thinking?: string }).thinking) {
          emit({ type: 'thinking', text: (block as { thinking: string }).thinking });
        } else if (block.type === 'tool_use') {
          const input = block.input as Record<string, unknown>;
          const name = block.name as string;
          if (name === 'Write' || name === 'create_file') {
            emit({ type: 'file_write', path: (input.file_path || input.path) as string, lines: countLines((input.content as string) ?? '') });
          } else if (name === 'Edit') {
            emit({ type: 'file_write', path: (input.file_path || input.path) as string });
          } else if (name === 'Read') {
            emit({ type: 'file_read', path: (input.file_path || input.path) as string });
          } else if (name === 'Bash') {
            emit({ type: 'command', cmd: (input.command || input.cmd) as string });
          } else {
            emit({ type: 'tool_call', name, input });
          }
        }
      }
      break;
    }
    case 'tool_progress':
      emit({ type: 'tool_result', name: msg.tool_name, duration_s: msg.elapsed_time_seconds });
      break;
    case 'result': {
      const r = msg as { subtype?: string; usage?: { input_tokens: number; output_tokens: number }; total_cost_usd?: number; duration_ms?: number; num_turns?: number };
      if (r.subtype === 'success') {
        emit({
          type: 'done',
          duration_ms: r.duration_ms ?? 0,
          turns: r.num_turns ?? 0,
          cost_usd: r.total_cost_usd ?? 0,
          input_tokens: r.usage?.input_tokens ?? 0,
          output_tokens: r.usage?.output_tokens ?? 0,
        });
      } else if (r.subtype === 'error_during_execution') {
        const errs = (r as { errors?: string[] }).errors;
        emit({ type: 'error', message: errs?.join('; ') ?? 'Agent error' });
      }
      break;
    }
  }
}

// ── Main export: full pipeline ────────────────────────────────────────────────

export async function runAgentPipeline(
  input: SiteGenerationInput,
  templateFiles: GeneratedFile[],
  onProgress?: (msg: string) => void,
): Promise<SiteGenerationResult> {
  const emit: Emit = input.onAgentEvent ?? (() => {});
  const progress = (msg: string) => {
    onProgress?.(msg);
    emit({ type: 'text', content: msg });
  };

  // Unique working directory per build
  const workDir = join(tmpdir(), `fs-pipeline-${input.projectId}-${Date.now()}`);
  await mkdir(workDir, { recursive: true });

  progress('Pipeline started — scaffolding template...');

  try {
    const mcpServer = buildMcpServer(workDir, input, templateFiles, emit);

    const bizInfo  = input.businessInfo;
    const bizName  = bizInfo.name || input.siteName;
    const services = (bizInfo.services ?? []).join(', ');
    const audience = bizInfo.description ?? '';

    const orchestratorPrompt = `You are the lead architect for a website generation pipeline.

## Project
Site name: ${input.siteName}
Business: ${bizName}
Description: ${bizInfo.description ?? ''}
Services: ${services}
Audience: ${audience}
Template: ${input.template.name} (${input.template.slug})
Primary colour: ${input.design?.primaryColor ?? '#3B82F6'}

## Your job
1. Call scaffold_template to load the template files into the working directory.
2. Read key files (index.astro, layout, components) to understand the template structure.
3. Create a clear design spec: brand voice, colour palette, typography direction, section order.
4. For each logical section or page, call spawn_coder_agent with focused instructions.
   - Each call should cover a coherent group (e.g. hero + nav, services section, contact page).
   - Write precise instructions including real copy: business name, services, CTAs, contact info.
   - Pass the design spec so every sub-agent stays on brand.
5. After all coder agents finish, call validate_file on each .astro and .html file.
   If errors are found, fix them yourself or spawn another coder agent.
6. Call list_output_files to confirm everything is in order.
7. Write a short summary of what was built.

Important:
- Use REAL content from the business info above — no Lorem Ipsum.
- Every section must reflect the actual services, audience, and brand.
- Colour scheme must use the primary colour: ${input.design?.primaryColor ?? '#3B82F6'}.
- Do not modify package.json, tsconfig.json, or astro.config.mjs.`;

    progress('Orchestrator agent started (Opus-4-6)...');

    const opts: Options = {
      cwd: workDir,
      model: 'claude-opus-4-6',
      permissionMode: 'bypassPermissions',
      maxTurns: 80,
      mcpServers: { flowstarter: mcpServer },
      systemPrompt: 'You are an expert web architect and creative director. You orchestrate sub-agents to build beautiful, conversion-optimised websites.',
    };

    for await (const msg of query({ prompt: orchestratorPrompt, options: opts })) {
      emitSdkMessage(msg, emit);
    }

    progress('Pipeline complete — collecting output files...');

    const generatedFiles = await collectDir(workDir);
    progress(`Generated ${generatedFiles.length} files.`);

    return { success: true, files: generatedFiles };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pipeline error';
    emit({ type: 'error', message });
    return { success: false, files: [], error: message };
  } finally {
    // Clean up temp dir
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

/** True when running in Node.js and the pipeline is enabled */
export function isAgentPipelineAvailable(): boolean {
  try {
    return !!(process?.versions?.node && process.env.AGENTS_SDK_ENABLED === 'true');
  } catch {
    return false;
  }
}
