import Anthropic from '@anthropic-ai/sdk';
import { mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join, normalize } from 'path';

import { fixContentImports } from './postProcessAstro';
import type { AgentActivityEvent, GeneratedFile, SiteGenerationInput, SiteGenerationResult } from './claude-agent/types';

export type { AgentActivityEvent };

const logger = { error: (...args: unknown[]) => console.error('[AgentPipeline]', ...args) };
const ORCHESTRATOR_MODEL = 'anthropic/claude-sonnet-4-6';
const CODER_MODEL = 'z-ai/glm-4.7';
const MAX_TURNS = 120;
const MAX_OUTPUT_TOKENS = 16_000;
const MODEL_PRICING = {
  [ORCHESTRATOR_MODEL]: { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  [CODER_MODEL]: { input: 0.4 / 1_000_000, output: 1.6 / 1_000_000 },
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
type PlanItem = { path: string; instructions: string };

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
1. List files, then read the important Astro/layout/component files.
2. Decide which files should be rewritten for ${business.name || input.siteName}.
3. Do NOT write files. Output a JSON plan instead.

## Output format
Return ONLY valid JSON:
[{"path":"src/pages/index.astro","instructions":"Complete rewrite guidance"}]

Rules:
- Do NOT call write_file unless absolutely necessary.
- Prefer read_file and list_files for analysis.
- Each instructions field must explain what to write in that file.
- Do NOT include markdown fences or commentary.`;
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

function parsePlan(text: string): PlanItem[] {
  const trimmed = text.trim();
  const json = trimmed.startsWith('[') ? trimmed : trimmed.slice(trimmed.indexOf('['), trimmed.lastIndexOf(']') + 1);
  const parsed = JSON.parse(json) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    if (!isRecord(item)) return [];
    const path = typeof item.path === 'string' ? item.path.trim() : '';
    const instructions = typeof item.instructions === 'string' ? item.instructions.trim() : '';
    return path && instructions ? [{ path, instructions }] : [];
  });
}

function buildCoderPrompt(input: SiteGenerationInput, path: string, original: string, instructions: string): string {
  return `You are an expert Astro/Tailwind developer. Rewrite this file completely for the business described below.

Business:
${buildBusinessSummary(input)}

Original file (${path}):
\`\`\`
${original}
\`\`\`

Instructions from the designer:
${instructions}

Rules:
- Write the COMPLETE file, not a diff
- Do NOT use astro-icon - use inline SVGs
- Do NOT import from content/*.md - inline all data
- No placeholders, no Lorem Ipsum
- Output ONLY the file content, no markdown fences`;
}

async function rewritePlannedFiles(
  client: Anthropic,
  workDir: string,
  input: SiteGenerationInput,
  plan: PlanItem[],
  templateFiles: GeneratedFile[],
  emit: Emit,
  progress: (message: string) => void,
): Promise<UsageTotals> {
  const usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const originals = new Map(templateFiles.map((file) => [file.path, file.content]));

  for (const item of plan) {
    progress(`Writing ${item.path} with GLM 4.7...`);
    try {
      const original = originals.get(item.path) ?? await readFile(resolvePath(workDir, item.path), 'utf-8').catch(() => '');
      const response = await client.messages.create({
        model: CODER_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildCoderPrompt(input, item.path, original, item.instructions) }],
      });
      addUsage(CODER_MODEL, response, usage);
      const content = parseText(response).trim();
      if (!content) throw new Error(`Empty response for ${item.path}`);
      const fullPath = resolvePath(workDir, item.path);
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, content, 'utf-8');
      emit({ type: 'file_write', path: item.path, lines: countLines(content) });
    } catch (error) {
      const message = error instanceof Error ? error.message : `GLM failed for ${item.path}`;
      logger.error(`GLM rewrite failed for ${item.path}:`, message);
      emit({ type: 'error', message: `GLM failed for ${item.path}: ${message}` });
    }
  }

  return usage;
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
  progress('Pipeline started — writing template files...');

  try {
    await writeTemplateFiles(workDir, templateFiles);
    progress(`Template ready — ${templateFiles.length} files in ${workDir}`);
    progress('Orchestrator (Sonnet) planning...');
    const client = getClient();
    const orchestrator = await runToolLoop(client, buildPrompt(input), createToolDefinitions(workDir), emit, progress);
    let coderUsage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
    try {
      const plan = parsePlan(orchestrator.text);
      if (plan.length) coderUsage = await rewritePlannedFiles(client, workDir, input, plan, templateFiles, emit, progress);
      else progress('No JSON rewrite plan returned by orchestrator; keeping current files.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse orchestrator plan';
      logger.error('Plan parsing failed:', message);
      emit({ type: 'error', message: `Plan parsing failed: ${message}` });
    }
    progress('Collecting output files...');
    const allFiles = await collectDir(workDir);
    const filtered = allFiles.filter(f => !INTEGRATION_COMPONENT_BLOCKLIST.some(b => f.path.endsWith(b)));
    const files = fixContentImports(filtered);
    const inputTokens = orchestrator.usage.inputTokens + coderUsage.inputTokens;
    const outputTokens = orchestrator.usage.outputTokens + coderUsage.outputTokens;
    emit({ type: 'done', duration_ms: Date.now() - startedAt, turns: orchestrator.turns, cost_usd: orchestrator.usage.costUsd + coderUsage.costUsd, input_tokens: inputTokens, output_tokens: outputTokens });
    progress(`Done — ${files.length} files generated.`);
    return { success: true, files };
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
