import Anthropic from '@anthropic-ai/sdk';
import { mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join, normalize } from 'path';

import { fixContentImports } from './postProcessAstro';
import { buildTemplateIndex } from './templateIndex';
import type { AgentActivityEvent, GeneratedFile, PipelineCost, SiteGenerationInput, SiteGenerationResult } from './claude-agent/types';

export type { AgentActivityEvent };

const logger = { error: (...args: unknown[]) => console.error('[AgentPipeline]', ...args) };
const ORCHESTRATOR_MODEL = 'anthropic/claude-sonnet-4-6';
const CODER_MODEL = 'z-ai/glm-4.7';
const MAX_TURNS = 120;
const MAX_OUTPUT_TOKENS = 16_000;
const MODEL_PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  [ORCHESTRATOR_MODEL]: { input: 3 / 1_000_000, output: 15 / 1_000_000, cacheRead: 0.3 / 1_000_000, cacheWrite: 3.75 / 1_000_000 },
  [CODER_MODEL]: { input: 0.38 / 1_000_000, output: 1.98 / 1_000_000, cacheRead: 0, cacheWrite: 0 },
};
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

function buildContentBriefPrompt(input: SiteGenerationInput): string {
  const business = input.businessInfo;
  return `You are a creative director writing website content for a real business.

## Business
${buildBusinessSummary(input)}
- target audience: ${String((business as Record<string, unknown>).targetAudience ?? '')}
- brand tone: ${String((business as Record<string, unknown>).brandTone ?? 'Professional')}

## Task
Write a complete CONTENT BRIEF in JSON for this business website.
The brief must include ALL text content for every page and section.
Write in the language that matches the business (Romanian if Romanian business).

Output ONLY valid JSON (no markdown fences):
{
  "siteName": "...",
  "tagline": "...",
  "hero": { "headline": "...", "subheadline": "...", "cta": "..." },
  "services": [{ "name": "...", "description": "...", "price": "..." }],
  "testimonials": [{ "name": "...", "role": "...", "text": "..." }],
  "pricing": [{ "plan": "...", "price": "...", "features": ["..."] }],
  "about": { "title": "...", "paragraphs": ["..."] },
  "contact": { "title": "...", "subtitle": "...", "formFields": ["name","email","phone","message"] },
  "footer": { "description": "...", "links": [{ "label": "...", "href": "..." }] },
  "nav": [{ "label": "...", "href": "..." }],
  "faq": [{ "q": "...", "a": "..." }]
}

Rules:
- Write compelling, professional content. No Lorem Ipsum.
- Include 3-5 services with real descriptions and prices
- Include 3-4 realistic testimonials
- Include 2-3 pricing plans
- Include 4-6 FAQ items
- All contact details must use: ${JSON.stringify(getContactInfo(input))}`;
}

function buildCoderPrompt(input: SiteGenerationInput, templateIndex: string, contentBrief: string): string {
  const business = input.businessInfo;
  return `You are an expert Astro/Tailwind developer. Write complete website files.

## Business
name: ${business.name || input.siteName}
primary color: ${input.design?.primaryColor ?? '#3B82F6'}
heading font: ${input.design?.headingFont ?? 'Inter'}
body font: ${input.design?.fontFamily ?? 'Inter'}

## Template structure
${templateIndex}

## Content (use this exactly)
${contentBrief}

## Task
Write ALL files listed below. Use the content brief above for all text.
Do NOT read files first -- write them directly using write_file.

Files to write (in order):
1. tailwind.config.mjs - colors from primary color
2. src/styles/global.css - theme colors + fonts
3. src/layouts/Layout.astro - nav, footer, meta tags
4. src/pages/index.astro - full landing page with all sections
5. src/components/Hero.astro - hero section
6. src/components/Services.astro - services grid
7. src/components/Testimonials.astro - testimonials carousel/grid
8. src/components/Pricing.astro - pricing cards
9. src/components/Footer.astro - footer with contact info
10. src/pages/about.astro - about page
11. src/pages/services.astro - detailed services
12. src/pages/contact.astro - contact form page

Rules:
- Inline all content as JS const in frontmatter (NOT from content/*.md)
- Use inline SVGs (NOT astro-icon)
- Do NOT modify package.json, tsconfig.json, astro.config.mjs
- Write COMPLETE files. Every file must be fully functional.`;
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
  const u = response.usage as Record<string, number>;
  const inputTokens = u.input_tokens ?? 0;
  const outputTokens = u.output_tokens ?? 0;
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheCreation = u.cache_creation_input_tokens ?? 0;
  const uncachedInput = inputTokens - cacheRead - cacheCreation;
  totals.inputTokens += inputTokens;
  totals.outputTokens += outputTokens;
  const pricing = MODEL_PRICING[model];
  totals.costUsd += (uncachedInput * pricing.input) + (cacheRead * pricing.cacheRead) + (cacheCreation * pricing.cacheWrite) + (outputTokens * pricing.output);
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
  model: string,
  prompt: string,
  tools: ToolDefinition[],
  emit: Emit,
  progress: (message: string) => void,
): Promise<{ turns: number; usage: UsageTotals }> {
  const usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const messages: MessageParam[] = [{
    role: 'user',
    content: [{ type: 'text', text: prompt, cache_control: { type: 'ephemeral' } }],
  }];

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const response = await client.messages.create({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      tools: tools.map((tool) => tool.tool),
      messages,
    });
    addUsage(model, response, usage);
    emitResponseBlocks(response, emit);
    messages.push({ role: 'assistant', content: response.content });
    const toolCalls = getToolCalls(response);
    if (!toolCalls.length) return { turns: turn, usage };
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
  const totalUsage: UsageTotals = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

  await mkdir(workDir, { recursive: true });

  try {
    // Write template files to workdir (agent needs them for write_file paths)
    await writeTemplateFiles(workDir, templateFiles);
    progress(`Template ready - ${templateFiles.length} files`);

    const client = getClient();
    const templateIndex = buildTemplateIndex(templateFiles);

    // Phase 1: Sonnet generates content brief (single turn, no tools)
    progress('Sonnet generating content brief...');
    const briefResponse = await client.messages.create({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: model === ORCHESTRATOR_MODEL ? [{ type: 'text', text: 'You are a creative director. Output only valid JSON.', cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: [{ type: 'text', text: buildContentBriefPrompt(input), cache_control: { type: 'ephemeral' } }] }],
    });
    addUsage(ORCHESTRATOR_MODEL, briefResponse, totalUsage);
    const contentBrief = briefResponse.content.filter(b => b.type === 'text').map(b => b.text).join('');
    emit({ type: 'text', content: 'Content brief generated' });
    progress('Content brief ready. GLM writing files...');

    // Phase 2: GLM writes all files using tool loop
    const coderPrompt = buildCoderPrompt(input, templateIndex, contentBrief);
    const { turns, usage: coderUsage } = await runToolLoop(
      client, CODER_MODEL, coderPrompt, createToolDefinitions(workDir), emit, progress,
    );
    totalUsage.inputTokens += coderUsage.inputTokens;
    totalUsage.outputTokens += coderUsage.outputTokens;
    totalUsage.costUsd += coderUsage.costUsd;

    // Collect and filter output
    progress('Collecting output files...');
    const allFiles = await collectDir(workDir);
    const filtered = allFiles.filter(f => !INTEGRATION_COMPONENT_BLOCKLIST.some(b => f.path.endsWith(b)));
    const files = fixContentImports(filtered);

    emit({ type: 'done', duration_ms: Date.now() - startedAt, turns: turns + 1, cost_usd: totalUsage.costUsd, input_tokens: totalUsage.inputTokens, output_tokens: totalUsage.outputTokens });
    progress(`Done - ${files.length} files generated`);

    const cost: PipelineCost = {
      totalCostUSD: totalUsage.costUsd,
      totalTokens: totalUsage.inputTokens + totalUsage.outputTokens,
      breakdown: [
        { model: ORCHESTRATOR_MODEL, promptTokens: briefResponse.usage.input_tokens, completionTokens: briefResponse.usage.output_tokens, totalTokens: briefResponse.usage.input_tokens + briefResponse.usage.output_tokens, costUSD: totalUsage.costUsd - coderUsage.costUsd },
        { model: CODER_MODEL, promptTokens: coderUsage.inputTokens, completionTokens: coderUsage.outputTokens, totalTokens: coderUsage.inputTokens + coderUsage.outputTokens, costUSD: coderUsage.costUsd },
      ].filter(b => b.totalTokens > 0),
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
