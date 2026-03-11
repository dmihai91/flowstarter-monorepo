import Anthropic from '@anthropic-ai/sdk';
import { mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join, normalize } from 'path';

import { fixContentImports } from './postProcessAstro';
import type { AgentActivityEvent, GeneratedFile, PipelineCost, SiteGenerationInput, SiteGenerationResult } from './claude-agent/types';

export type { AgentActivityEvent };

const logger = { error: (...args: unknown[]) => console.error('[AgentPipeline]', ...args) };
const ORCHESTRATOR_MODEL = 'anthropic/claude-sonnet-4-6';
const MAX_TURNS = 120;
const MAX_OUTPUT_TOKENS = 16_000;
const MODEL_PRICING = {
  [ORCHESTRATOR_MODEL]: { input: 3 / 1_000_000, output: 15 / 1_000_000 },
} as const;
/** Integration components that use getEntry()/content collections - break Astro build */
const INTEGRATION_COMPONENT_BLOCKLIST = [
  'BookingWidget.astro', 'ContactForm.astro', 'Newsletter.astro',
  'PaymentWidget.astro', 'SocialFeed.astro',
];
const SYSTEM_PROMPT = `You are an expert Astro developer and creative director.
Build beautiful, conversion-optimised websites with real business content.
Always write complete files and avoid placeholders.`;

type Emit = (event: AgentActivityEvent) => void;
type UsageTotals = { inputTokens: number; outputTokens: number; costUsd: number };
type ContactInfo = { email?: string; phone?: string; address?: string };
type CreateParams = Parameters<Anthropic['messages']['create']>[0];
type MessageParam = CreateParams['messages'][number];
type ToolParam = NonNullable<CreateParams['tools']>[number];
type ResponseMessage = Awaited<ReturnType<Anthropic['messages']['create']>>;
type ToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

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

const countLines = (content: string) => content.split('\n').length;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const parseText = (response: ResponseMessage) => response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');

function resolvePath(workDir: string, path: string): string {
  const trimmedPath = path.trim();
  if (!trimmedPath) throw new Error('Path is required');
  const fullPath = normalize(join(workDir, trimmedPath));
  const root = `${normalize(workDir)}/`;
  if (!fullPath.startsWith(root) && fullPath !== normalize(workDir)) throw new Error(`Path escapes workDir: ${path}`);
  return fullPath;
}

function getContactInfo(input: SiteGenerationInput): ContactInfo {
  const withTopLevel = input as SiteGenerationInput & { contactInfo?: ContactInfo };
  return withTopLevel.contactInfo ?? input.businessInfo.contact ?? {};
}

function formatLines(lines: string[]): string {
  return lines.filter(Boolean).join('\n') || 'None';
}

function formatIntegrations(input: SiteGenerationInput): string {
  return formatLines((input.integrations ?? []).map((integration) => JSON.stringify({
    id: integration.id,
    name: integration.name,
    config: integration.config,
  })));
}

function formatGeneratedAssets(input: SiteGenerationInput): string {
  return formatLines((input.generatedAssets ?? []).map((asset) => `${asset.type}: ${asset.name} (${asset.url})`));
}

function buildBusinessSummary(input: SiteGenerationInput): string {
  const contact = getContactInfo(input);
  const business = input.businessInfo;
  const services = (business.services ?? []).join(', ') || 'None';
  return [
    `name: ${business.name || input.siteName}`,
    `description: ${business.description ?? ''}`,
    `services: ${services}`,
    `colors: primary=${input.design?.primaryColor ?? '#3B82F6'}, secondary=${input.design?.secondaryColor ?? ''}, accent=${input.design?.accentColor ?? ''}`,
    `fonts: headings=${input.design?.headingFont ?? 'Inter'}, body=${input.design?.fontFamily ?? 'Inter'}`,
    `contact: email=${contact.email ?? ''}, phone=${contact.phone ?? ''}, address=${contact.address ?? ''}`,
  ].join('\n');
}

function buildPrompt(input: SiteGenerationInput): string {
  const business = input.businessInfo;
  return `You are an expert Astro developer building a complete website for a real business client.

## Business details
${buildBusinessSummary(input)}
- target audience: ${String((business as Record<string, unknown>).targetAudience ?? '')}
- brand tone: ${String((business as Record<string, unknown>).brandTone ?? 'Professional')}

## Template
${input.template.name} (${input.template.slug}) — files are in your working directory.

## Integrations
${formatIntegrations(input)}

## Generated assets
${formatGeneratedAssets(input)}

## Your task
Phase 1 - Read (be efficient):
1. List files to see what's available.
2. Read ONLY the key files: index.astro, Layout.astro, Hero.astro, global.css, tailwind.config.mjs

Phase 2 - Write ALL files with real business content:
Write each file completely for ${business.name || input.siteName}:
1. tailwind.config.mjs - update colors
2. src/styles/global.css - update theme
3. src/layouts/Layout.astro - branding, nav, footer (inline SVGs, NO astro-icon)
4. src/pages/index.astro - full landing page
5. src/components/Hero.astro - business hero
6. src/components/Services.astro - real services with prices
7. src/components/Testimonials.astro - realistic testimonials
8. src/components/Pricing.astro - real pricing
9. src/components/Footer.astro - real contact info
10. src/pages/about.astro - about page
11. src/pages/services.astro - detailed services
12. src/pages/contact.astro - contact with form

Rules:
- Do NOT import from content/*.md - inline all data
- Do NOT use astro-icon - use inline SVGs
- Do NOT modify package.json, tsconfig.json, astro.config.mjs
- Write COMPLETE files. No Lorem Ipsum. No placeholders.`;
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

function addUsage(model: keyof typeof MODEL_PRICING, response: ResponseMessage, totals: UsageTotals): void {
  const inputTokens = response.usage.input_tokens ?? 0;
  const outputTokens = response.usage.output_tokens ?? 0;
  totals.inputTokens += inputTokens;
  totals.outputTokens += outputTokens;
  totals.costUsd += (inputTokens * MODEL_PRICING[model].input) + (outputTokens * MODEL_PRICING[model].output);
}

function createToolDefinitions(workDir: string): ToolDefinition[] {
  return [
    {
      tool: { name: 'read_file', description: 'Read a UTF-8 file from the working directory.', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
      execute: async (input, emit) => {
        const path = String(input.path ?? '');
        const content = await readFile(resolvePath(workDir, path), 'utf-8');
        emit({ type: 'file_read', path });
        return content;
      },
    },
    {
      tool: { name: 'write_file', description: 'Write a complete UTF-8 file into the working directory.', input_schema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } },
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
      tool: { name: 'list_files', description: 'List all available files in the working directory.', input_schema: { type: 'object', properties: {}, required: [] } },
      execute: async (_input, emit) => {
        const listing = (await collectDir(workDir)).map((file) => file.path).sort().join('\n');
        emit({ type: 'text', content: `Listed ${listing ? listing.split('\n').length : 0} files` });
        return listing || '(no files)';
      },
    },
  ];
}

async function writeTemplateFiles(workDir: string, templateFiles: GeneratedFile[]): Promise<void> {
  await Promise.all(templateFiles.map(async (file) => {
    const fullPath = resolvePath(workDir, file.path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.content, 'utf-8');
  }));
}

async function executeToolCall(toolCall: ToolCall, tools: ToolDefinition[], emit: Emit): Promise<ToolResultBlock> {
  const startedAt = Date.now();
  const tool = tools.find((entry) => entry.tool.name === toolCall.name);
  if (!tool) {
    emit({ type: 'error', message: `Unknown tool: ${toolCall.name}` });
    return { type: 'tool_result', tool_use_id: toolCall.id, content: `Unknown tool: ${toolCall.name}`, is_error: true };
  }
  emit({ type: 'tool_call', name: toolCall.name, input: toolCall.input });
  try {
    const result = await tool.execute(toolCall.input, emit);
    emit({ type: 'tool_result', name: toolCall.name, duration_s: (Date.now() - startedAt) / 1000 });
    return { type: 'tool_result', tool_use_id: toolCall.id, content: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tool execution failed';
    emit({ type: 'error', message });
    return { type: 'tool_result', tool_use_id: toolCall.id, content: message, is_error: true };
  }
}

async function runToolLoop(
  client: Anthropic,
  prompt: string,
  tools: ToolDefinition[],
  emit: Emit,
  progress: (message: string) => void,
): Promise<{ turns: number; usage: UsageTotals; text: string }> {
  const usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const messages: MessageParam[] = [{ role: 'user', content: prompt }];
  let finalText = '';

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const response = await client.messages.create({ model: ORCHESTRATOR_MODEL, max_tokens: MAX_OUTPUT_TOKENS, system: SYSTEM_PROMPT, tools: tools.map((tool) => tool.tool), messages });
    addUsage(ORCHESTRATOR_MODEL, response, usage);
    emitResponseBlocks(response, emit);
    finalText = parseText(response).trim() || finalText;
    messages.push({ role: 'assistant', content: response.content });
    const toolCalls = getToolCalls(response);
    if (!toolCalls.length) return { turns: turn, usage, text: finalText };
    progress(`Executing ${toolCalls.length} tool call${toolCalls.length === 1 ? '' : 's'}...`);
    messages.push({ role: 'user', content: await Promise.all(toolCalls.map((call) => executeToolCall(call, tools, emit))) });
  }

  throw new Error(`Agent reached MAX_TURNS (${MAX_TURNS}) without finishing`);
}

export async function runAgentPipeline(
  input: SiteGenerationInput,
  templateFiles: GeneratedFile[],
  onProgress?: (msg: string) => void,
): Promise<SiteGenerationResult> {
  const emit: Emit = input.onAgentEvent ?? (() => {});
  const startedAt = Date.now();
  const progress = (message: string) => { onProgress?.(message); emit({ type: 'text', content: message }); };
  const workDir = join(tmpdir(), `fs-pipeline-${input.projectId}-${Date.now()}`);

  await mkdir(workDir, { recursive: true });
  progress('Pipeline started - writing template files...');

  try {
    await writeTemplateFiles(workDir, templateFiles);
    progress(`Template ready - ${templateFiles.length} files in ${workDir}`);
    progress('Generating site with Sonnet 4-6...');
    const client = getClient();
    const { turns, usage } = await runToolLoop(client, buildPrompt(input), createToolDefinitions(workDir), emit, progress);
    progress('Collecting output files...');
    const allFiles = await collectDir(workDir);
    const filtered = allFiles.filter(f => !INTEGRATION_COMPONENT_BLOCKLIST.some(b => f.path.endsWith(b)));
    const files = fixContentImports(filtered);
    emit({ type: 'done', duration_ms: Date.now() - startedAt, turns, cost_usd: usage.costUsd, input_tokens: usage.inputTokens, output_tokens: usage.outputTokens });
    progress(`Done - ${files.length} files generated.`);
    const cost: PipelineCost = {
      totalCostUSD: usage.costUsd,
      totalTokens: usage.inputTokens + usage.outputTokens,
      breakdown: [{ model: ORCHESTRATOR_MODEL, promptTokens: usage.inputTokens, completionTokens: usage.outputTokens, totalTokens: usage.inputTokens + usage.outputTokens, costUSD: usage.costUsd }],
    };
    return { success: true, files, cost };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pipeline error';
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
  } catch {
    return false;
  }
}
