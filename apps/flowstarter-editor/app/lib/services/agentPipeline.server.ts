/**
 * Agent Pipeline — claude-agent-sdk orchestrator with native file tools
 *
 * Uses the Anthropic claude-agent-sdk which spawns the Claude Code CLI.
 * The CLI has native Read/Write/Edit/Bash tools — no JSON serialisation,
 * no parsing failures, direct filesystem access.
 *
 * Requires: ANTHROPIC_API_KEY with a positive credit balance.
 * Fallback:  Set AGENTS_SDK_ENABLED=false to use the Gretly pipeline.
 */

import {
  query,
  type Options,
  type SDKMessage,
} from '@anthropic-ai/claude-agent-sdk';
import { tmpdir } from 'os';
import { mkdir, writeFile, readFile, readdir, rm } from 'fs/promises';
import { join } from 'path';
import type { AgentActivityEvent } from './claude-agent/types';
import type { SiteGenerationInput, GeneratedFile, SiteGenerationResult } from './claude-agent/types';
import { fixContentImports } from './postProcessAstro';

export type { AgentActivityEvent };

const ORCHESTRATOR_MODEL = 'claude-opus-4-6';
const CODER_MODEL        = 'claude-sonnet-4-6';
const MAX_TURNS          = 120;

type Emit = (event: AgentActivityEvent) => void;

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

// ── SDK message → AgentActivityEvent ─────────────────────────────────────────

function emitSdkMessage(msg: SDKMessage, emit: Emit) {
  if (msg.type === 'assistant' && msg.message?.content) {
    for (const block of msg.message.content) {
      if (block.type === 'text' && block.text) {
        emit({ type: 'text', content: block.text });
      } else if (block.type === 'thinking' && (block as Record<string, unknown>).thinking) {
        emit({ type: 'thinking', text: (block as Record<string, string>).thinking });
      } else if (block.type === 'tool_use') {
        const input = block.input as Record<string, unknown>;
        const name  = block.name as string;
        if (name === 'Write' || name === 'create_file') {
          const path = (input.file_path ?? input.path) as string;
          const content = (input.content ?? '') as string;
          emit({ type: 'file_write', path, lines: countLines(content) });
        } else if (name === 'Edit' || name === 'str_replace') {
          emit({ type: 'file_write', path: (input.file_path ?? input.path) as string });
        } else if (name === 'Read') {
          emit({ type: 'file_read', path: (input.file_path ?? input.path) as string });
        } else if (name === 'Bash') {
          emit({ type: 'command', cmd: (input.command ?? input.cmd) as string });
        } else {
          emit({ type: 'tool_call', name, input });
        }
      }
    }
  } else if (msg.type === 'tool_progress') {
    emit({ type: 'tool_result', name: msg.tool_name, duration_s: msg.elapsed_time_seconds });
  } else if (msg.type === 'result') {
    const r = msg as {
      subtype?: string;
      usage?: { input_tokens: number; output_tokens: number };
      total_cost_usd?: number;
      duration_ms?: number;
      num_turns?: number;
    };
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
  progress('Pipeline started — writing template files...');

  // Write template files into workDir so the agent can read/edit them
  for (const file of templateFiles) {
    const full = join(workDir, file.path);
    await mkdir(join(full, '..'), { recursive: true });
    await writeFile(full, file.content, 'utf-8');
  }
  progress(`Template ready — ${templateFiles.length} files in ${workDir}`);

  const bizInfo  = input.businessInfo;
  const bizName  = bizInfo.name || input.siteName;
  const services = (bizInfo.services ?? []).join(', ');
  const contact  = input.contactInfo ?? (bizInfo as Record<string, unknown>);

  const prompt = `You are an expert Astro developer building a complete website for a real business client.

## Business details
- Site name: ${input.siteName}
- Business: ${bizName}
- Description: ${bizInfo.description ?? ''}
- Services: ${services}
- Target audience: ${(bizInfo as Record<string,unknown>).targetAudience ?? ''}
- Brand tone: ${(bizInfo as Record<string,unknown>).brandTone ?? 'Professional'}
- Primary colour: ${input.design?.primaryColor ?? '#3B82F6'}
- Heading font: ${input.design?.headingFont ?? 'Inter'}
- Body font: ${input.design?.fontFamily ?? 'Inter'}
- Phone: ${contact.phone ?? ''}
- Email: ${contact.email ?? ''}
- Address: ${contact.address ?? ''}

## Template
${input.template.name} (${input.template.slug}) — files are in your working directory.

## Your task

IMPORTANT: Be efficient with tool calls. Read only the files you need, then write them all.

### Phase 1 — Read core files only (skip integration components)
Read ONLY these files to understand the structure:
- src/pages/index.astro
- src/layouts/Layout.astro  
- src/components/Hero.astro
- src/styles/global.css
- tailwind.config.mjs

Do NOT read integration components (BookingWidget, Newsletter, etc.) — they will be handled separately.

### Phase 2 — Rewrite ALL files with real business content
Rewrite each file completely for ${bizName}:
- Replace ALL placeholder text with real content in Romanian if the business is Romanian
- Apply primary colour ${input.design?.primaryColor ?? '#3B82F6'} in tailwind.config.mjs and throughout
- Use ${input.design?.headingFont ?? 'Inter'} for headings, ${input.design?.fontFamily ?? 'Inter'} for body  
- Include real contact details: phone, email, address
- Include real services: ${services}
- Write complete files — never truncate

### Files to rewrite (in this order):
1. tailwind.config.mjs — update colors only
2. src/styles/global.css — update theme colours
3. src/layouts/Layout.astro — branding, nav, footer, NO astro-icon (use inline SVGs)
4. src/pages/index.astro — full landing page with all sections, NO astro-icon
5. src/components/Hero.astro — business hero with real content
6. src/components/Services.astro — real services with descriptions and prices
7. src/components/Testimonials.astro — realistic testimonials
8. src/components/Pricing.astro — real pricing plans
9. src/components/Footer.astro — real contact info
10. src/pages/about.astro — about the business
11. src/pages/services.astro — detailed services page
12. src/pages/contact.astro — contact page with form and info

### Rules
- Do NOT import from content/*.md — inline all data as JS const in frontmatter
- Do NOT use astro-icon or Icon components — use inline SVGs
- Do NOT modify package.json, tsconfig.json, astro.config.mjs
- Write EVERY file completely. No Lorem Ipsum. No placeholders.`;

  try {
    const opts: Options = {
      cwd: workDir,
      model: ORCHESTRATOR_MODEL,
      permissionMode: 'bypassPermissions',
      maxTurns: MAX_TURNS,
      systemPrompt: `You are an expert Astro developer and creative director.
Build beautiful, conversion-optimised websites with real business content.
Always write complete files — never truncate or use placeholders.`,
    };

    progress('Orchestrator (Opus-4-6) started...');

    for await (const msg of query({ prompt, options: opts })) {
      emitSdkMessage(msg, emit);
    }

    progress('Collecting output files...');
    const allFiles = await collectDir(workDir);
    // Strip integration components that use getEntry()/content imports — they break the Astro build
    const INTEGRATION_BLOCKLIST = ['BookingWidget.astro', 'ContactForm.astro', 'Newsletter.astro', 'PaymentWidget.astro', 'SocialFeed.astro'];
    const filtered = allFiles.filter(f => !INTEGRATION_BLOCKLIST.some(b => f.path.endsWith(b)));
    const generatedFiles = fixContentImports(filtered);
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

/** True when running in Node.js and ANTHROPIC_API_KEY is set */
export function isAgentPipelineAvailable(): boolean {
  try {
    if (process.env.AGENTS_SDK_ENABLED === 'false') return false;
    return !!(process?.versions?.node && process.env.ANTHROPIC_API_KEY);
  } catch {
    return false;
  }
}
