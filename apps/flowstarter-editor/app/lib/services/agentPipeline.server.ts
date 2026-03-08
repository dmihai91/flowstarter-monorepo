/**
 * Agent Pipeline — Orchestrator + Sonnet sub-agents via direct API (OpenRouter)
 *
 * No Claude Code CLI subprocess. Uses Anthropic SDK pointed at OpenRouter,
 * so OPEN_ROUTER_API_KEY is all that's needed — no direct Anthropic billing.
 *
 * Architecture:
 *   Orchestrator (Opus-4-6) uses tool_use to call:
 *     scaffold_template  → writes template files into temp working dir
 *     spawn_coder_agent  → Sonnet sub-agent generates/edits a file group
 *     validate_file      → structural checks on .astro files
 *     list_output_files  → inventory
 *     read_file          → read current file content
 */

import Anthropic from '@anthropic-ai/sdk';
import { tmpdir } from 'os';
import { mkdir, writeFile, readFile, readdir, rm } from 'fs/promises';
import { join, extname } from 'path';
import type { AgentActivityEvent } from './claude-agent/types';
import type { SiteGenerationInput, GeneratedFile, SiteGenerationResult } from './claude-agent/types';

export type { AgentActivityEvent };

const ORCHESTRATOR_MODEL     = 'anthropic/claude-opus-4-6';
const CODER_MODEL            = 'anthropic/claude-sonnet-4-6';
const MAX_ORCHESTRATOR_TURNS = 30;
const MAX_CODER_TURNS        = 5;

type Emit = (event: AgentActivityEvent) => void;

// ── OpenRouter client ─────────────────────────────────────────────────────────

function getClient(): Anthropic {
  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) throw new Error('OPEN_ROUTER_API_KEY is not set');
  return new Anthropic({
    apiKey,
    baseURL: 'https://openrouter.ai/api',
    defaultHeaders: { 'HTTP-Referer': 'https://flowstarter.dev', 'X-Title': 'Flowstarter' },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function collectDir(dir: string, base = ''): Promise<GeneratedFile[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: GeneratedFile[] = [];
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist') continue;
    const full = join(dir, e.name);
    const rel  = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...await collectDir(full, rel));
    else out.push({ path: rel, content: await readFile(full, 'utf-8').catch(() => '') });
  }
  return out;
}

function countLines(s: string) { return s.split('\n').length; }

// ── Sonnet coder sub-agent ────────────────────────────────────────────────────

async function runCoderSubAgent(
  files: string[],
  instructions: string,
  designSpec: string,
  projectCtx: string,
  workDir: string,
  emit: Emit,
): Promise<void> {
  const client = getClient();

  const fileContents: Record<string, string> = {};
  for (const f of files) {
    try { fileContents[f] = await readFile(join(workDir, f), 'utf-8'); }
    catch { fileContents[f] = '(new file — create from scratch)'; }
  }

  const fileBlock = Object.entries(fileContents)
    .map(([p, c]) => `### ${p}\n\`\`\`\n${c.slice(0, 6000)}\n\`\`\``)
    .join('\n\n');

  const prompt = `You are an expert Astro developer. Rewrite the following files for a client website.

## Project context
${projectCtx}

## Design direction
${designSpec}

## Task
${instructions}

## Current file contents
${fileBlock}

Return ONLY a valid JSON object — no markdown fences, no explanation:
{"files":{"path/to/file.astro":"complete file content","..."}}

Rules:
- Complete file content for every listed file
- Real business content — no Lorem Ipsum, no placeholder text
- Inline all data as JS const in frontmatter — NEVER import from content/*.md
- NEVER use astro-icon — use inline SVGs or emoji
- Preserve existing import paths unless explicitly changing them`;

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];

  for (let turn = 0; turn < MAX_CODER_TURNS; turn++) {
    const res = await client.messages.create({
      model: CODER_MODEL, max_tokens: 16000, temperature: 0.2, messages,
    });

    const block = res.content.find(b => b.type === 'text');
    if (!block || block.type !== 'text') break;
    const raw = block.text.trim();

    // Strip markdown fences if model added them
    const stripped = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    try {
      const parsed = JSON.parse(stripped) as { files?: Record<string, string> };
      if (parsed.files) {
        for (const [path, content] of Object.entries(parsed.files)) {
          const full = join(workDir, path);
          await mkdir(join(full, '..'), { recursive: true });
          await writeFile(full, content, 'utf-8');
          emit({ type: 'file_write', path, lines: countLines(content) });
        }
      }
      break;
    } catch {
      messages.push({ role: 'assistant', content: raw });
      messages.push({ role: 'user', content: 'Invalid JSON. Return ONLY the JSON object {"files":{...}}, no fences, no explanation.' });
    }
  }
}

// ── Orchestrator agentic loop ─────────────────────────────────────────────────

async function runOrchestrator(
  systemPrompt: string,
  userPrompt: string,
  toolDefs: Array<{ name: string; description: string; input_schema: Anthropic.Tool['input_schema']; handler: (input: Record<string, unknown>) => Promise<string> }>,
  emit: Emit,
  onProgress?: (msg: string) => void,
): Promise<void> {
  const client = getClient();
  const tools: Anthropic.Tool[] = toolDefs.map(({ name, description, input_schema }) => ({ name, description, input_schema }));
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }];

  for (let turn = 0; turn < MAX_ORCHESTRATOR_TURNS; turn++) {
    const res = await client.messages.create({
      model: ORCHESTRATOR_MODEL, max_tokens: 8000, temperature: 0.3,
      system: systemPrompt, tools, tool_choice: { type: 'auto' }, messages,
    });

    messages.push({ role: 'assistant', content: res.content });

    for (const block of res.content) {
      if (block.type === 'text' && block.text) {
        emit({ type: 'text', content: block.text });
        onProgress?.(block.text.slice(0, 100));
      }
    }

    if (res.stop_reason === 'end_turn') break;
    if (res.stop_reason !== 'tool_use') break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== 'tool_use') continue;
      const def = toolDefs.find(t => t.name === block.name);
      let result: string;
      try {
        result = def
          ? await def.handler(block.input as Record<string, unknown>)
          : `Unknown tool: ${block.name}`;
      } catch (e) {
        result = `Tool error: ${e instanceof Error ? e.message : String(e)}`;
        emit({ type: 'error', message: result });
      }
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
    }
    messages.push({ role: 'user', content: toolResults });
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function runAgentPipeline(
  input: SiteGenerationInput,
  templateFiles: GeneratedFile[],
  onProgress?: (msg: string) => void,
): Promise<SiteGenerationResult> {
  const emit: Emit = input.onAgentEvent ?? (() => {});
  const progress = (msg: string) => { onProgress?.(msg); emit({ type: 'text', content: msg }); };

  const workDir = join(tmpdir(), `fs-pipeline-${input.projectId}-${Date.now()}`);
  await mkdir(workDir, { recursive: true });
  progress('Pipeline started — loading template...');

  try {
    const bizInfo = input.businessInfo;
    const bizName = bizInfo.name || input.siteName;
    const contactInfo = input.contactInfo ?? (bizInfo as Record<string, unknown>);

    const projectCtx = [
      `Site: ${input.siteName}`,
      `Business: ${bizName}`,
      `Description: ${bizInfo.description ?? ''}`,
      `Services: ${(bizInfo.services ?? []).join(', ')}`,
      `Target audience: ${(bizInfo as Record<string,unknown>).targetAudience ?? ''}`,
      `Brand tone: ${(bizInfo as Record<string,unknown>).brandTone ?? 'Professional'}`,
      `Primary colour: ${input.design?.primaryColor ?? '#3B82F6'}`,
      `Font: ${input.design?.fontFamily ?? 'Inter'}`,
      `Phone: ${contactInfo.phone ?? ''}`,
      `Email: ${contactInfo.email ?? ''}`,
      `Address: ${contactInfo.address ?? ''}`,
    ].join('\n');

    // Build tool definitions (closures capture workDir + input)
    const toolDefs = [
      {
        name: 'scaffold_template',
        description: 'Write all template files into the working directory.',
        input_schema: { type: 'object' as const, properties: {}, required: [] },
        handler: async () => {
          for (const file of templateFiles) {
            const full = join(workDir, file.path);
            await mkdir(join(full, '..'), { recursive: true });
            await writeFile(full, file.content, 'utf-8');
          }
          emit({ type: 'tool_call', name: 'scaffold_template', input: { files: templateFiles.length } });
          return `Scaffolded ${templateFiles.length} template files into working directory.`;
        },
      },
      {
        name: 'read_file',
        description: 'Read the current content of a file.',
        input_schema: {
          type: 'object' as const,
          properties: { path: { type: 'string' } },
          required: ['path'],
        },
        handler: async (inp: Record<string, unknown>) => {
          const path = inp.path as string;
          try {
            const content = await readFile(join(workDir, path), 'utf-8');
            emit({ type: 'file_read', path });
            return content;
          } catch { return `File not found: ${path}`; }
        },
      },
      {
        name: 'spawn_coder_agent',
        description: 'Spawn a Sonnet sub-agent to rewrite a group of files with real business content.',
        input_schema: {
          type: 'object' as const,
          properties: {
            task_name:    { type: 'string' },
            files:        { type: 'array', items: { type: 'string' } },
            instructions: { type: 'string' },
            design_spec:  { type: 'string' },
          },
          required: ['task_name', 'files', 'instructions'],
        },
        handler: async (inp: Record<string, unknown>) => {
          const { task_name, files, instructions, design_spec } = inp as {
            task_name: string; files: string[]; instructions: string; design_spec?: string;
          };
          emit({ type: 'tool_call', name: 'spawn_coder_agent', input: { task_name, files } });
          await runCoderSubAgent(
            files,
            instructions,
            design_spec ?? 'Use the primary colour, professional typography, real business content.',
            projectCtx,
            workDir,
            emit,
          );
          emit({ type: 'tool_result', name: 'spawn_coder_agent', duration_s: 0 });
          return `Agent "${task_name}" complete. Files updated: ${files.join(', ')}`;
        },
      },
      {
        name: 'validate_file',
        description: 'Check a file for structural issues (broken imports, missing content, etc).',
        input_schema: {
          type: 'object' as const,
          properties: { path: { type: 'string' } },
          required: ['path'],
        },
        handler: async (inp: Record<string, unknown>) => {
          const path = inp.path as string;
          try {
            const content = await readFile(join(workDir, path), 'utf-8');
            const issues: string[] = [];
            if (['.astro', '.html'].includes(extname(path))) {
              if (!content.includes('<')) issues.push('No HTML found');
              if (content.includes("from '../../content/")) issues.push('Imports from content/*.md — inline the data instead');
              if (content.includes('astro-icon')) issues.push('Uses astro-icon — replace with inline SVG');
              if (content.includes('Lorem ipsum')) issues.push('Contains placeholder Lorem ipsum text');
            }
            emit({ type: 'file_read', path });
            return issues.length === 0
              ? `${path}: OK (${countLines(content)} lines)`
              : `${path}: ISSUES — ${issues.join('; ')}`;
          } catch { return `Cannot read: ${path}`; }
        },
      },
      {
        name: 'list_output_files',
        description: 'List all generated files.',
        input_schema: { type: 'object' as const, properties: {}, required: [] },
        handler: async () => {
          const files = await collectDir(workDir);
          emit({ type: 'text', content: `Output: ${files.length} files` });
          return `${files.length} files:\n${files.map(f => f.path).join('\n')}`;
        },
      },
    ];

    progress('Orchestrator (Opus-4-6 via OpenRouter) started...');

    await runOrchestrator(
      'You are an expert web architect and creative director. Build beautiful, conversion-optimised websites by orchestrating specialist sub-agents.',
      `Build a complete website for this business.

## Business info
${projectCtx}

## Template
${input.template.name} (${input.template.slug}) — ${templateFiles.length} files available

## Steps
1. scaffold_template — load all template files
2. read_file on index.astro, Layout.astro, Hero.astro, Services.astro to understand structure
3. spawn_coder_agent in groups:
   - "global-styles": tailwind.config.mjs + src/styles/global.css + src/layouts/Layout.astro
   - "homepage": src/pages/index.astro + src/components/Hero.astro
   - "components": Services.astro + Pricing.astro + Testimonials.astro + Footer.astro
   - "inner-pages": about.astro + contact.astro + services.astro
4. validate_file on each .astro — fix any ISSUES
5. list_output_files to confirm

## Rules
- Real content everywhere — business name, actual services, real contact details
- NEVER import from content/*.md
- NEVER use astro-icon
- Primary colour ${input.design?.primaryColor ?? '#3B82F6'} must appear throughout
- Do NOT touch package.json, tsconfig.json, astro.config.mjs`,
      toolDefs,
      emit,
      onProgress,
    );

    progress('Collecting output files...');
    const generatedFiles = await collectDir(workDir);
    progress(`Done — ${generatedFiles.length} files generated.`);

    return { success: true, files: generatedFiles };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pipeline error';
    emit({ type: 'error', message });
    return { success: false, files: [], error: message };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

/** True when OPEN_ROUTER_API_KEY is set and AGENTS_SDK_ENABLED != 'false' */
export function isAgentPipelineAvailable(): boolean {
  try {
    if (process.env.AGENTS_SDK_ENABLED === 'false') return false;
    return !!(process?.versions?.node && process.env.OPEN_ROUTER_API_KEY);
  } catch { return false; }
}
