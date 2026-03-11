import Anthropic from '@anthropic-ai/sdk';
import { mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join, normalize } from 'path';
import { fixContentImports } from './postProcessAstro';
import type { AgentActivityEvent, GeneratedFile, SiteGenerationInput, SiteGenerationResult } from './claude-agent/types';

export type { AgentActivityEvent };

const ORCHESTRATOR_MODEL = 'anthropic/claude-opus-4-6';
const MAX_TURNS = 40;
const MAX_OUTPUT_TOKENS = 8_000;
const INTEGRATION_BLOCKLIST = new Set([
  'access_token',
  'api_key',
  'apikey',
  'client_secret',
  'key',
  'open_router_api_key',
  'password',
  'private_key',
  'secret',
  'token',
  'webhook_secret',
]);
const SYSTEM_PROMPT = `You are an expert Astro developer and creative director.
Build beautiful, conversion-optimised websites with real business content.
Always write complete files and avoid placeholders.`;

type Emit = (event: AgentActivityEvent) => void;
type UsageTotals = { inputTokens: number; outputTokens: number };
type ContactInfo = { email?: string; phone?: string; address?: string };
type CreateParams = Parameters<Anthropic['messages']['create']>[0];
type MessageParam = CreateParams['messages'][number];
type ToolParam = NonNullable<CreateParams['tools']>[number];
type ResponseMessage = Awaited<ReturnType<Anthropic['messages']['create']>>;
type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};

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
    const content = await readFile(fullPath, 'utf-8').catch(() => '');
    return [{ path: relativePath, content }];
  }));
  return files.flat();
}

function countLines(content: string): number {
  return content.split('\n').length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function resolvePath(workDir: string, path: string): string {
  const trimmedPath = path.trim();
  if (!trimmedPath) throw new Error('Path is required');
  const fullPath = normalize(join(workDir, trimmedPath));
  const root = `${normalize(workDir)}/`;
  if (!fullPath.startsWith(root) && fullPath !== normalize(workDir)) {
    throw new Error(`Path escapes workDir: ${path}`);
  }
  return fullPath;
}

function getContactInfo(input: SiteGenerationInput): ContactInfo {
  const withTopLevel = input as SiteGenerationInput & { contactInfo?: ContactInfo };
  return withTopLevel.contactInfo ?? input.businessInfo.contact ?? {};
}

function sanitizeIntegrationValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeIntegrationValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !INTEGRATION_BLOCKLIST.has(key.toLowerCase()))
      .map(([key, innerValue]) => [key, sanitizeIntegrationValue(innerValue)]),
  );
}

function formatIntegrations(input: SiteGenerationInput): string {
  const integrations = input.integrations ?? [];
  if (!integrations.length) return 'None';
  return integrations
    .map((integration) => JSON.stringify({
      id: integration.id,
      name: integration.name,
      config: sanitizeIntegrationValue(integration.config),
    }))
    .join('\n');
}

function formatGeneratedAssets(input: SiteGenerationInput): string {
  const assets = input.generatedAssets ?? [];
  if (!assets.length) return 'None';
  return assets
    .map((asset) => `${asset.type}: ${asset.name} (${asset.url})`)
    .join('\n');
}

function buildPrompt(input: SiteGenerationInput): string {
  const business = input.businessInfo;
  const contact = getContactInfo(input);
  const services = (business.services ?? []).join(', ');
  const businessName = business.name || input.siteName;
  const extra = business as Record<string, unknown>;

  return `You are an expert Astro developer building a complete website for a real business client.

## Business details
- Site name: ${input.siteName}
- Business: ${businessName}
- Description: ${business.description ?? ''}
- Services: ${services}
- Target audience: ${String(extra.targetAudience ?? '')}
- Brand tone: ${String(extra.brandTone ?? 'Professional')}
- Primary colour: ${input.design?.primaryColor ?? '#3B82F6'}
- Heading font: ${input.design?.headingFont ?? 'Inter'}
- Body font: ${input.design?.fontFamily ?? 'Inter'}
- Phone: ${contact.phone ?? ''}
- Email: ${contact.email ?? ''}
- Address: ${contact.address ?? ''}

## Template
${input.template.name} (${input.template.slug}) — files are in your working directory.

## Integrations
${formatIntegrations(input)}

## Generated assets
${formatGeneratedAssets(input)}

## Your task
Phase 1 — Read:
1. Read the existing template files to understand structure (index.astro, Layout.astro, key components).
2. List the available files before making changes.

Phase 2 — Write:
1. Rewrite each file with real business content.
2. Replace ALL placeholder text with actual content for ${businessName}.
3. Apply the primary colour ${input.design?.primaryColor ?? '#3B82F6'} throughout.
4. Use ${input.design?.headingFont ?? 'Inter'} for headings and ${input.design?.fontFamily ?? 'Inter'} for body text.
5. Use real contact details everywhere.
6. Use real services: ${services}.
7. Do NOT import from content/*.md — inline all data as JS const in frontmatter.
8. Do NOT use astro-icon — use inline SVGs or emoji.
9. Do NOT modify package.json, tsconfig.json, astro.config.mjs.
10. After writing files, list the files again and verify each .astro file for obvious syntax issues.

Write every file completely. No Lorem Ipsum. No placeholder text.`;
}

function emitResponseBlocks(response: ResponseMessage, emit: Emit): void {
  for (const block of response.content) {
    if (block.type === 'text' && block.text) emit({ type: 'text', content: block.text });
    if (block.type === 'thinking' && 'thinking' in block) {
      emit({ type: 'thinking', text: String(block.thinking) });
    }
  }
}

function getToolCalls(response: ResponseMessage): ToolCall[] {
  return response.content.flatMap((block) => {
    if (block.type !== 'tool_use' || !isRecord(block.input)) return [];
    return [{ id: block.id, name: block.name, input: block.input }];
  });
}

function addUsage(response: ResponseMessage, totals: UsageTotals): void {
  totals.inputTokens += response.usage.input_tokens ?? 0;
  totals.outputTokens += response.usage.output_tokens ?? 0;
}

function createToolDefinitions(workDir: string): ToolDefinition[] {
  return [
    {
      tool: {
        name: 'read_file',
        description: 'Read a UTF-8 file from the working directory.',
        input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
      },
      execute: async (input, emit) => {
        const path = String(input.path ?? '');
        const fullPath = resolvePath(workDir, path);
        const content = await readFile(fullPath, 'utf-8');
        emit({ type: 'file_read', path });
        return content;
      },
    },
    {
      tool: {
        name: 'write_file',
        description: 'Write a complete UTF-8 file into the working directory.',
        input_schema: {
          type: 'object',
          properties: { path: { type: 'string' }, content: { type: 'string' } },
          required: ['path', 'content'],
        },
      },
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
      tool: {
        name: 'list_files',
        description: 'List all available files in the working directory.',
        input_schema: { type: 'object', properties: {}, required: [] },
      },
      execute: async (_input, emit) => {
        const files = await collectDir(workDir);
        const listing = files.map((file) => file.path).sort().join('\n');
        emit({ type: 'text', content: `Listed ${files.length} files` });
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
): Promise<{ turns: number; usage: UsageTotals }> {
  const usage = { inputTokens: 0, outputTokens: 0 };
  const messages: MessageParam[] = [{ role: 'user', content: prompt }];

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const response = await client.messages.create({
      model: ORCHESTRATOR_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      tools: tools.map((tool) => tool.tool),
      messages,
    });
    addUsage(response, usage);
    emitResponseBlocks(response, emit);
    messages.push({ role: 'assistant', content: response.content });
    const toolCalls = getToolCalls(response);
    if (!toolCalls.length) return { turns: turn, usage };
    progress(`Executing ${toolCalls.length} tool call${toolCalls.length === 1 ? '' : 's'}...`);
    const toolResults = await Promise.all(toolCalls.map((toolCall) => executeToolCall(toolCall, tools, emit)));
    messages.push({ role: 'user', content: toolResults });
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
  const progress = (message: string) => {
    onProgress?.(message);
    emit({ type: 'text', content: message });
  };
  const workDir = join(tmpdir(), `fs-pipeline-${input.projectId}-${Date.now()}`);

  await mkdir(workDir, { recursive: true });
  progress('Pipeline started — writing template files...');

  try {
    await writeTemplateFiles(workDir, templateFiles);
    progress(`Template ready — ${templateFiles.length} files in ${workDir}`);
    progress('Orchestrator (Opus-4-6 via OpenRouter) started...');
    const client = getClient();
    const prompt = buildPrompt(input);
    const { turns, usage } = await runToolLoop(client, prompt, createToolDefinitions(workDir), emit, progress);
    progress('Collecting output files...');
    const files = fixContentImports(await collectDir(workDir));
    emit({
      type: 'done',
      duration_ms: Date.now() - startedAt,
      turns,
      cost_usd: 0,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
    });
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
