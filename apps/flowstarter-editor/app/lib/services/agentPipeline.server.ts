import Anthropic from '@anthropic-ai/sdk';
import { mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join, normalize } from 'path';

import { fixContentImports } from './postProcessAstro';
import { buildTemplateIndex } from './templateIndex';
import type { AgentActivityEvent, GeneratedFile, PipelineCost, SiteGenerationInput, SiteGenerationResult } from './claude-agent/types';

export type { AgentActivityEvent };

const logger = { error: (...args: unknown[]) => console.error('[AgentPipeline]', ...args) };
const MODEL = 'anthropic/claude-sonnet-4-6';
const MAX_TURNS = 10;
const MAX_OUTPUT_TOKENS = 16_000;
const MODEL_PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  [MODEL]: { input: 3e-6, output: 15e-6, cacheRead: 0.3e-6, cacheWrite: 3.75e-6 },
};
const INTEGRATION_COMPONENT_BLOCKLIST = [
  'BookingWidget.astro', 'ContactForm.astro', 'Newsletter.astro',
  'PaymentWidget.astro', 'SocialFeed.astro',
];

type Emit = (event: AgentActivityEvent) => void;
type UsageTotals = { inputTokens: number; outputTokens: number; costUsd: number };
type ContactInfo = { email?: string; phone?: string; address?: string };
type CreateParams = Parameters<Anthropic['messages']['create']>[0];
type MessageParam = CreateParams['messages'][number];
type ToolParam = NonNullable<CreateParams['tools']>[number];
type ResponseMessage = Awaited<ReturnType<Anthropic['messages']['create']>>;
type ToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };
interface ToolCall { id: string; name: string; input: Record<string, unknown> }
interface ToolDefinition { tool: ToolParam; execute: (input: Record<string, unknown>, emit: Emit) => Promise<string> }

function getClient(): Anthropic {
  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) throw new Error('OPEN_ROUTER_API_KEY not configured');
  return new Anthropic({ apiKey, baseURL: 'https://openrouter.ai/api' });
}

async function collectDir(dir: string, base = ''): Promise<GeneratedFile[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    if (entry.name.startsWith('.') || entry.name === 'dist' || entry.name === 'node_modules') return [];
    const fullPath = join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return collectDir(fullPath, rel);
    return [{ path: rel, content: await readFile(fullPath, 'utf-8').catch(() => '') }];
  }));
  return files.flat();
}

function resolvePath(workDir: string, path: string): string {
  const p = path.trim();
  if (!p) throw new Error('Path is required');
  const full = normalize(join(workDir, p));
  const root = normalize(workDir);
  if (!full.startsWith(root + '/') && !full.startsWith(root + '\\') && full !== root) throw new Error(`Path escapes workDir: ${path}`);
  return full;
}

const countLines = (s: string) => s.split('\n').length;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function getContactInfo(input: SiteGenerationInput): ContactInfo {
  return (input as SiteGenerationInput & { contactInfo?: ContactInfo }).contactInfo ?? input.businessInfo.contact ?? {};
}

// ── Optimization 3: Pre-generate boilerplate files (no LLM needed) ──────────
function generateBoilerplate(input: SiteGenerationInput): GeneratedFile[] {
  const primary = input.design?.primaryColor ?? '#3B82F6';
  const headingFont = input.design?.headingFont ?? 'Inter';
  const bodyFont = input.design?.fontFamily ?? 'Inter';
  const contact = getContactInfo(input);

  return [
    {
      path: 'astro.config.mjs',
      content: `import { defineConfig } from 'astro/config';\nimport tailwind from '@astrojs/tailwind';\nexport default defineConfig({ integrations: [tailwind()] });\n`,
    },
    {
      path: 'tailwind.config.mjs',
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '${primary}', light: '${primary}dd', dark: '${primary}bb' },
        secondary: '#1a1a2e',
        accent: { gold: '#f5e27a', DEFAULT: '${primary}' },
        surface: { soft: '#f8f9fa', DEFAULT: '#ffffff' },
        text: { DEFAULT: '#1a1a2e', muted: '#6b7280', light: '#9ca3af' },
        border: '#e5e7eb',
      },
      fontFamily: {
        serif: ['${headingFont}', 'Georgia', 'serif'],
        sans: ['${bodyFont}', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
};\n`,
    },
    {
      path: 'src/styles/global.css',
      content: `@import url('https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;500;600;700&family=${bodyFont.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap');
@tailwind base; @tailwind components; @tailwind utilities;
@layer base {
  body { @apply font-sans text-text bg-surface antialiased; }
  h1, h2, h3, h4 { @apply font-serif; }
}
@layer components {
  .btn-primary { @apply inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg; }
  .btn-outline { @apply inline-flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold px-6 py-3 rounded-xl hover:bg-primary hover:text-white transition-all duration-300; }
  .btn-outline-white { @apply inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-all duration-300; }
  .card { @apply bg-white rounded-3xl p-7 shadow-sm border border-border hover:shadow-lg transition-all duration-300; }
  .section-label { @apply inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider mb-4; }
  .badge-gold { @apply inline-flex items-center gap-1.5 bg-accent-gold/20 text-yellow-700 font-semibold rounded-full; }
  .bg-dark-mesh { @apply bg-gradient-to-br from-secondary via-gray-900 to-secondary; }
  .shadow-primary { box-shadow: 0 8px 32px ${primary}33; }
  .shadow-primary-lg { box-shadow: 0 12px 48px ${primary}44; }
}\n`,
    },
  ];
}

function buildPrompt(input: SiteGenerationInput, templateIndex: string): string {
  const biz = input.businessInfo as Record<string, unknown>;
  const contact = getContactInfo(input);
  return `Build a website. Config files (astro.config, tailwind, global.css) ALREADY WRITTEN. Do NOT rewrite them.

Business: ${input.businessInfo.name || input.siteName}
${input.businessInfo.description ?? ''}
Services: ${(input.businessInfo.services ?? []).join(', ')}
Contact: ${JSON.stringify(contact)}
Color: ${input.design?.primaryColor ?? '#3B82F6'} | Audience: ${String(biz.targetAudience ?? '')} | Tone: ${String(biz.brandTone ?? 'Professional')}

Template files for reference:
${templateIndex}

Write ALL files in exactly 3 write_files calls:

CALL 1 (layout + hero + services):
- src/layouts/Layout.astro — head, responsive nav with mobile menu, <slot/>, footer
- src/components/Hero.astro — headline, tagline, 2 CTAs, stats bar
- src/components/Services.astro — grid of service cards with inline SVG icons

CALL 2 (remaining components):
- src/components/Testimonials.astro — 3 testimonial cards with star ratings
- src/components/Pricing.astro — 2-3 plans with feature lists
- src/components/Footer.astro — 4 columns: about, services, contact, social

CALL 3 (all pages):
- src/pages/index.astro — imports Layout + all components
- src/pages/about.astro — story, timeline, values (full page with Layout)
- src/pages/services.astro — detailed services (full page with Layout)
- src/pages/contact.astro — form, hours, map placeholder (full page with Layout)

Rules: content in business language, inline SVGs (no astro-icon), no emoji, no content/*.md imports, (el as HTMLElement).style in scripts, data in frontmatter const.`;
}

function createTools(workDir: string): ToolDefinition[] {
  const writeSingle = async (path: string, content: string, emit: Emit) => {
    const full = resolvePath(workDir, path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content, 'utf-8');
    const lines = countLines(content);
    emit({ type: 'file_write', path, lines });
    return `${path} (${lines}L)`;
  };

  return [
    {
      tool: {
        name: 'write_files',
        description: 'Write multiple files at once.',
        input_schema: {
          type: 'object' as const,
          properties: { files: { type: 'array' as const, items: { type: 'object' as const, properties: { path: { type: 'string' as const }, content: { type: 'string' as const } }, required: ['path', 'content'] } } },
          required: ['files'],
        },
      },
      execute: async (input, emit) => {
        const files = (input.files as Array<{ path: string; content: string }>) ?? [];
        const results = await Promise.all(files.map((f) => writeSingle(f.path, f.content, emit)));
        return `Wrote ${results.length} files: ${results.join(', ')}`;
      },
    },
    {
      tool: { name: 'write_file', description: 'Write one file.', input_schema: { type: 'object' as const, properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } },
      execute: async (input, emit) => {
        const r = await writeSingle(String(input.path ?? ''), String(input.content ?? ''), emit);
        return `Wrote ${r}`;
      },
    },
    {
      tool: { name: 'list_files', description: 'List files.', input_schema: { type: 'object' as const, properties: {}, required: [] } },
      execute: async (_input, emit) => {
        const listing = (await collectDir(workDir)).map((f) => f.path).sort().join('\n');
        emit({ type: 'text', content: `Listed ${listing ? listing.split('\n').length : 0} files` });
        return listing || '(no files)';
      },
    },
  ];
}

function getToolCalls(response: ResponseMessage): ToolCall[] {
  return response.content.flatMap((b) => (b.type === 'tool_use' && isRecord(b.input)) ? [{ id: b.id, name: b.name, input: b.input }] : []);
}

function addUsage(model: string, response: ResponseMessage, totals: UsageTotals): void {
  const u = response.usage as Record<string, number>;
  const inp = u.input_tokens ?? 0, out = u.output_tokens ?? 0;
  const cr = u.cache_read_input_tokens ?? 0, cw = u.cache_creation_input_tokens ?? 0;
  const p = MODEL_PRICING[model] ?? MODEL_PRICING[MODEL];
  totals.inputTokens += inp;
  totals.outputTokens += out;
  totals.costUsd += (inp - cr - cw) * p.input + cr * p.cacheRead + cw * p.cacheWrite + out * p.output;
}

// ── Optimization 1: Truncate old tool_use content to prevent context bloat ──
function truncateHistory(messages: MessageParam[]): void {
  let aCount = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'assistant' || !Array.isArray(msg.content)) continue;
    aCount++;
    if (aCount <= 1) continue; // keep last assistant intact
    for (const block of msg.content) {
      if (block.type !== 'tool_use' || !isRecord(block.input)) continue;
      if (block.name === 'write_file' && typeof block.input.content === 'string') {
        block.input = { path: block.input.path, content: `[${countLines(block.input.content)}L omitted]` };
      }
      if (block.name === 'write_files' && Array.isArray(block.input.files)) {
        block.input = { files: (block.input.files as Array<{ path: string; content: string }>).map((f) => ({ path: f.path, content: `[${countLines(f.content)}L]` })) };
      }
    }
  }
}

async function runToolLoop(
  client: Anthropic, prompt: string, tools: ToolDefinition[], emit: Emit, progress: (msg: string) => void,
): Promise<{ turns: number; usage: UsageTotals }> {
  const usage: UsageTotals = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const messages: MessageParam[] = [{ role: 'user', content: [{ type: 'text', text: prompt, cache_control: { type: 'ephemeral' } }] }];

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    truncateHistory(messages);
    const response = await client.messages.create({
      model: MODEL, max_tokens: MAX_OUTPUT_TOKENS,
      system: [{ type: 'text', text: 'Expert Astro/Tailwind developer. Write files immediately — no explanations. Use write_files for batches.', cache_control: { type: 'ephemeral' } }],
      tools: tools.map((t) => t.tool), messages,
    });
    addUsage(MODEL, response, usage);
    for (const b of response.content) {
      if (b.type === 'text' && b.text) emit({ type: 'text', content: b.text });
      if (b.type === 'thinking' && 'thinking' in b) emit({ type: 'thinking', text: String(b.thinking) });
    }
    messages.push({ role: 'assistant', content: response.content });
    const calls = getToolCalls(response);
    if (!calls.length) return { turns: turn, usage };
    progress(`Turn ${turn}: ${calls.length} tool call${calls.length === 1 ? '' : 's'}`);
    const results: ToolResultBlock[] = [];
    for (const tc of calls) {
      const tool = tools.find((t) => t.tool.name === tc.name);
      if (!tool) { results.push({ type: 'tool_result', tool_use_id: tc.id, content: 'Unknown tool', is_error: true }); continue; }
      emit({ type: 'tool_call', name: tc.name, input: tc.input });
      try {
        const r = await tool.execute(tc.input, emit);
        results.push({ type: 'tool_result', tool_use_id: tc.id, content: r });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Tool failed';
        emit({ type: 'error', message: msg });
        results.push({ type: 'tool_result', tool_use_id: tc.id, content: msg, is_error: true });
      }
    }
    messages.push({ role: 'user', content: results });
  }
  throw new Error(`Agent reached MAX_TURNS (${MAX_TURNS}) without finishing`);
}

export async function runAgentPipeline(
  input: SiteGenerationInput, templateFiles: GeneratedFile[], onProgress?: (msg: string) => void,
): Promise<SiteGenerationResult> {
  const emit: Emit = input.onAgentEvent ?? (() => {});
  const startedAt = Date.now();
  const progress = (msg: string) => { onProgress?.(msg); emit({ type: 'text', content: msg }); };
  const workDir = join(tmpdir(), `fs-pipeline-${input.projectId}-${Date.now()}`);

  await mkdir(workDir, { recursive: true });
  try {
    // Write template files as reference
    await Promise.all(templateFiles.map(async (f) => {
      const p = resolvePath(workDir, f.path);
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, f.content, 'utf-8');
    }));
    progress(`Template ready — ${templateFiles.length} files`);

    // Optimization 3: Pre-generate boilerplate (no LLM needed)
    const boilerplate = generateBoilerplate(input);
    for (const f of boilerplate) {
      const p = resolvePath(workDir, f.path);
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, f.content, 'utf-8');
      emit({ type: 'file_write', path: f.path, lines: countLines(f.content) });
    }
    progress(`Pre-generated ${boilerplate.length} config files`);

    const client = getClient();
    const templateIndex = buildTemplateIndex(templateFiles);
    const prompt = buildPrompt(input, templateIndex);

    progress('Agent generating website...');
    const { turns, usage } = await runToolLoop(client, prompt, createTools(workDir), emit, progress);

    progress('Collecting output files...');
    const allFiles = await collectDir(workDir);
    const filtered = allFiles.filter((f) => !INTEGRATION_COMPONENT_BLOCKLIST.some((b) => f.path.endsWith(b)));
    for (const file of filtered) {
      if (file.path === 'astro.config.mjs' && file.content.includes('astro-icon')) {
        file.content = file.content.replace(/import\s+icon\s+from\s+['"]astro-icon['"];?\n?/g, '').replace(/,?\s*icon\(\)/g, '');
      }
    }
    const files = fixContentImports(filtered);

    emit({ type: 'done', duration_ms: Date.now() - startedAt, turns, cost_usd: usage.costUsd, input_tokens: usage.inputTokens, output_tokens: usage.outputTokens });
    progress(`Done — ${files.length} files in ${turns} turns`);

    return {
      success: true, files,
      cost: {
        totalCostUSD: usage.costUsd, totalTokens: usage.inputTokens + usage.outputTokens,
        breakdown: [{ model: MODEL, promptTokens: usage.inputTokens, completionTokens: usage.outputTokens, totalTokens: usage.inputTokens + usage.outputTokens, costUSD: usage.costUsd }],
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pipeline error';
    logger.error(message);
    emit({ type: 'error', message });
    return { success: false, files: [], error: message };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

export function isAgentPipelineAvailable(): boolean {
  try {
    if (process.env.AGENTS_SDK_ENABLED === 'false') return false;
    return Boolean(process?.versions?.node && process.env.OPEN_ROUTER_API_KEY);
  } catch { return false; }
}
