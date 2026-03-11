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
const MAX_TURNS = 20;
const MAX_OUTPUT_TOKENS = 12_000;
const MODEL_PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  [MODEL]: { input: 3 / 1_000_000, output: 15 / 1_000_000, cacheRead: 0.3 / 1_000_000, cacheWrite: 3.75 / 1_000_000 },
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
interface ToolDefinition {
  tool: ToolParam;
  execute: (input: Record<string, unknown>, emit: Emit) => Promise<string>;
}

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
    const relativePath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return collectDir(fullPath, relativePath);
    return [{ path: relativePath, content: await readFile(fullPath, 'utf-8').catch(() => '') }];
  }));
  return files.flat();
}

function resolvePath(workDir: string, path: string): string {
  const trimmedPath = path.trim();
  if (!trimmedPath) throw new Error('Path is required');
  const fullPath = normalize(join(workDir, trimmedPath));
  const normalizedRoot = normalize(workDir);
  if (!fullPath.startsWith(normalizedRoot + '/') && !fullPath.startsWith(normalizedRoot + '\\') && fullPath !== normalizedRoot) throw new Error(`Path escapes workDir: ${path}`);
  return fullPath;
}

const countLines = (content: string) => content.split('\n').length;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function getContactInfo(input: SiteGenerationInput): ContactInfo {
  return (input as SiteGenerationInput & { contactInfo?: ContactInfo }).contactInfo ?? input.businessInfo.contact ?? {};
}

function buildBusinessSummary(input: SiteGenerationInput): string {
  const contact = getContactInfo(input);
  const business = input.businessInfo;
  return [
    `name: ${business.name || input.siteName}`,
    `description: ${business.description ?? ''}`,
    `services: ${(business.services ?? []).join(', ') || 'None'}`,
    `colors: primary=${input.design?.primaryColor ?? '#3B82F6'}, secondary=${input.design?.secondaryColor ?? ''}, accent=${input.design?.accentColor ?? ''}`,
    `fonts: headings=${input.design?.headingFont ?? 'Inter'}, body=${input.design?.fontFamily ?? 'Inter'}`,
    `contact: email=${contact.email ?? ''}, phone=${contact.phone ?? ''}, address=${contact.address ?? ''}`,
  ].join('\n');
}

function buildPrompt(input: SiteGenerationInput, templateIndex: string): string {
  const biz = input.businessInfo as Record<string, unknown>;
  return `Build a complete, beautiful website for this business using write_files (batch tool).

## Business
${buildBusinessSummary(input)}
- target audience: ${String(biz.targetAudience ?? '')}
- brand tone: ${String(biz.brandTone ?? 'Professional')}

## Template structure (reference only)
${templateIndex}

## Task
Call write_files ONCE with ALL files. Do NOT write files one at a time.

Files to include in the write_files call:
1. astro.config.mjs — \`import { defineConfig } from 'astro/config'; import tailwind from '@astrojs/tailwind'; export default defineConfig({ integrations: [tailwind()] });\`
2. tailwind.config.mjs — brand colors from primary color
3. src/styles/global.css — CSS custom properties + font imports
4. src/layouts/Layout.astro — nav, footer, meta, responsive
5. src/components/Hero.astro — hero with headline, CTA, stats
6. src/components/Services.astro — services grid with prices
7. src/components/Testimonials.astro — testimonial cards
8. src/components/Pricing.astro — pricing tiers + FAQ
9. src/components/Footer.astro — footer with contact + links
10. src/pages/index.astro — landing page importing sections
11. src/pages/about.astro — about page with company story
12. src/pages/services.astro — detailed services page
13. src/pages/contact.astro — contact form page

## Content rules
- Compelling, professional copy in the business's language
- Contact: ${JSON.stringify(getContactInfo(input))}
- 3-5 services, 3-4 testimonials, 2-3 pricing plans, 4-6 FAQ items
- NO Lorem Ipsum — real, relevant content only

## Technical rules
- Inline all data as JS const in frontmatter (NOT from content/*.md)
- Use inline SVGs (NOT astro-icon)
- In <script> tags: (el as HTMLElement).style (cast Element to HTMLElement)
- Every file complete and self-contained
- Each component 100-300 lines of rich content`;
}

function createToolDefinitions(workDir: string): ToolDefinition[] {
  return [
    {
      tool: {
        name: 'write_files',
        description: 'Write multiple files at once. Use this to write all website files in a single call.',
        input_schema: {
          type: 'object' as const,
          properties: {
            files: {
              type: 'array' as const,
              items: {
                type: 'object' as const,
                properties: { path: { type: 'string' as const }, content: { type: 'string' as const } },
                required: ['path', 'content'],
              },
            },
          },
          required: ['files'],
        },
      },
      execute: async (input, emit) => {
        const files = (input.files as Array<{ path: string; content: string }>) ?? [];
        const results: string[] = [];
        for (const file of files) {
          const path = String(file.path ?? '');
          const content = String(file.content ?? '');
          const fullPath = resolvePath(workDir, path);
          await mkdir(dirname(fullPath), { recursive: true });
          await writeFile(fullPath, content, 'utf-8');
          const lines = countLines(content);
          emit({ type: 'file_write', path, lines });
          results.push(`${path} (${lines}L)`);
        }
        return `Wrote ${results.length} files: ${results.join(', ')}`;
      },
    },
    {
      tool: { name: 'write_file', description: 'Write a single file.', input_schema: { type: 'object' as const, properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } },
      execute: async (input, emit) => {
        const path = String(input.path ?? '');
        const content = String(input.content ?? '');
        const fullPath = resolvePath(workDir, path);
        await mkdir(dirname(fullPath), { recursive: true });
        await writeFile(fullPath, content, 'utf-8');
        emit({ type: 'file_write', path, lines: countLines(content) });
        return `Wrote ${path} (${countLines(content)} lines)`;
      },
    },
    {
      tool: { name: 'read_file', description: 'Read a file.', input_schema: { type: 'object' as const, properties: { path: { type: 'string' } }, required: ['path'] } },
      execute: async (input, emit) => {
        const path = String(input.path ?? '');
        const content = await readFile(resolvePath(workDir, path), 'utf-8');
        emit({ type: 'file_read', path });
        return content;
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

function emitResponseBlocks(response: ResponseMessage, emit: Emit): void {
  for (const block of response.content) {
    if (block.type === 'text' && block.text) emit({ type: 'text', content: block.text });
    if (block.type === 'thinking' && 'thinking' in block) emit({ type: 'thinking', text: String(block.thinking) });
  }
}

function getToolCalls(response: ResponseMessage): ToolCall[] {
  return response.content.flatMap((block) => {
    if (block.type !== 'tool_use' || !isRecord(block.input)) return [];
    return [{ id: block.id, name: block.name, input: block.input }];
  });
}

function addUsage(model: string, response: ResponseMessage, totals: UsageTotals): void {
  const u = response.usage as Record<string, number>;
  const inp = u.input_tokens ?? 0;
  const out = u.output_tokens ?? 0;
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheCreate = u.cache_creation_input_tokens ?? 0;
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING[MODEL];
  totals.inputTokens += inp;
  totals.outputTokens += out;
  totals.costUsd += ((inp - cacheRead - cacheCreate) * pricing.input)
    + (cacheRead * pricing.cacheRead) + (cacheCreate * pricing.cacheWrite)
    + (out * pricing.output);
}

async function executeToolCall(tc: ToolCall, tools: ToolDefinition[], emit: Emit): Promise<ToolResultBlock> {
  const start = Date.now();
  const tool = tools.find((t) => t.tool.name === tc.name);
  if (!tool) {
    emit({ type: 'error', message: `Unknown tool: ${tc.name}` });
    return { type: 'tool_result', tool_use_id: tc.id, content: `Unknown tool: ${tc.name}`, is_error: true };
  }
  emit({ type: 'tool_call', name: tc.name, input: tc.input });
  try {
    const result = await tool.execute(tc.input, emit);
    emit({ type: 'tool_result', name: tc.name, duration_s: (Date.now() - start) / 1000 });
    return { type: 'tool_result', tool_use_id: tc.id, content: result };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Tool execution failed';
    emit({ type: 'error', message: msg });
    return { type: 'tool_result', tool_use_id: tc.id, content: msg, is_error: true };
  }
}

/**
 * Truncate old write_file/write_files tool_use blocks in message history.
 * Keeps the tool name and path but replaces content with a summary.
 * This prevents context from growing linearly with each file written.
 */
function truncateOldToolUseContent(messages: MessageParam[]): void {
  // Keep the last 2 assistant messages intact, truncate older ones
  let assistantCount = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'assistant' || !Array.isArray(msg.content)) continue;
    assistantCount++;
    if (assistantCount <= 2) continue; // keep recent
    for (const block of msg.content) {
      if (block.type === 'tool_use' && isRecord(block.input)) {
        const name = block.name;
        if (name === 'write_file' && typeof block.input.content === 'string') {
          const lines = countLines(block.input.content);
          block.input = { path: block.input.path, content: `[${lines} lines — content omitted from history]` };
        }
        if (name === 'write_files' && Array.isArray(block.input.files)) {
          block.input = {
            files: (block.input.files as Array<{ path: string; content: string }>).map((f) => ({
              path: f.path,
              content: `[${countLines(f.content)} lines — omitted]`,
            })),
          };
        }
      }
    }
  }
}

async function writeTemplateFiles(workDir: string, templateFiles: GeneratedFile[]): Promise<void> {
  await Promise.all(templateFiles.map(async (file) => {
    const fullPath = resolvePath(workDir, file.path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.content, 'utf-8');
  }));
}

async function runToolLoop(
  client: Anthropic, prompt: string, tools: ToolDefinition[], emit: Emit, progress: (msg: string) => void,
): Promise<{ turns: number; usage: UsageTotals }> {
  const usage: UsageTotals = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const messages: MessageParam[] = [{
    role: 'user',
    content: [{ type: 'text', text: prompt, cache_control: { type: 'ephemeral' } }],
  }];

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    // Truncate old tool inputs to keep context lean
    truncateOldToolUseContent(messages);

    const response = await client.messages.create({
      model: MODEL, max_tokens: MAX_OUTPUT_TOKENS,
      system: [{ type: 'text', text: 'You are an expert Astro developer. Build beautiful websites with real content. Write complete files. Prefer write_files (batch) over write_file (single).', cache_control: { type: 'ephemeral' } }],
      tools: tools.map((t) => t.tool),
      messages,
    });
    addUsage(MODEL, response, usage);
    emitResponseBlocks(response, emit);
    messages.push({ role: 'assistant', content: response.content });
    const toolCalls = getToolCalls(response);
    if (!toolCalls.length) return { turns: turn, usage };
    progress(`Turn ${turn}: ${toolCalls.length} tool call${toolCalls.length === 1 ? '' : 's'}`);
    const results = await Promise.all(toolCalls.map((call) => executeToolCall(call, tools, emit)));
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
    await writeTemplateFiles(workDir, templateFiles);
    progress(`Template ready — ${templateFiles.length} files`);

    const client = getClient();
    const templateIndex = buildTemplateIndex(templateFiles);
    const prompt = buildPrompt(input, templateIndex);

    progress('Agent generating website...');
    const { turns, usage } = await runToolLoop(client, prompt, createToolDefinitions(workDir), emit, progress);

    progress('Collecting output files...');
    const allFiles = await collectDir(workDir);
    const filtered = allFiles.filter((f) => !INTEGRATION_COMPONENT_BLOCKLIST.some((b) => f.path.endsWith(b)));
    for (const file of filtered) {
      if (file.path === 'astro.config.mjs' && file.content.includes('astro-icon')) {
        file.content = file.content
          .replace(/import\s+icon\s+from\s+['"]astro-icon['"];?\n?/g, '')
          .replace(/,?\s*icon\(\)/g, '');
      }
    }
    const files = fixContentImports(filtered);

    emit({ type: 'done', duration_ms: Date.now() - startedAt, turns, cost_usd: usage.costUsd, input_tokens: usage.inputTokens, output_tokens: usage.outputTokens });
    progress(`Done — ${files.length} files in ${turns} turns`);

    const cost: PipelineCost = {
      totalCostUSD: usage.costUsd, totalTokens: usage.inputTokens + usage.outputTokens,
      breakdown: [{ model: MODEL, promptTokens: usage.inputTokens, completionTokens: usage.outputTokens, totalTokens: usage.inputTokens + usage.outputTokens, costUSD: usage.costUsd }],
    };
    return { success: true, files, cost };
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
