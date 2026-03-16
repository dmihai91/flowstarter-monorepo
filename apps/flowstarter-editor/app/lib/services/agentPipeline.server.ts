/**
 * Site Generation Pipeline — Claude Agent SDK
 *
 * Uses the battle-tested Agent SDK (Claude Code) for both generation and editing.
 * Cost controlled via maxBudgetUsd + maxTurns.
 */
import { query } from '@anthropic-ai/claude-agent-sdk';
import { mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join } from 'path';

import { validateAndFixFiles } from './claude-agent/astValidation';
import { fixContentImports } from './postProcessAstro';
import { buildTemplateIndex } from './templateIndex';
import { trackLLMUsage, syncCostsToSupabase } from '~/lib/.server/llm/cost-tracker';
import type { AgentActivityEvent, GeneratedFile, PipelineCost, SiteGenerationInput, SiteGenerationResult } from './claude-agent/types';

export type { AgentActivityEvent };

const logger = { error: (...args: unknown[]) => console.error('[AgentPipeline]', ...args) };
const MODEL = 'claude-sonnet-4-6';
const MAX_TURNS_GENERATE = 8;
const MAX_BUDGET_GENERATE = 0.60; // Hard cap per build
const INTEGRATION_COMPONENT_BLOCKLIST = [
  'BookingWidget.astro', 'ContactForm.astro', 'Newsletter.astro',
  'PaymentWidget.astro', 'SocialFeed.astro',
];

type Emit = (event: AgentActivityEvent) => void;
type ContactInfo = { email?: string; phone?: string; address?: string };

function getContactInfo(input: SiteGenerationInput): ContactInfo {
  return (input as SiteGenerationInput & { contactInfo?: ContactInfo }).contactInfo ?? input.businessInfo.contact ?? {};
}

// ── Pre-generate boilerplate (no LLM needed) ────────────────────────
function generateBoilerplate(input: SiteGenerationInput): GeneratedFile[] {
  const primary = input.design?.primaryColor ?? '#3B82F6';
  const headingFont = input.design?.headingFont ?? 'Inter';
  const bodyFont = input.design?.fontFamily ?? 'Inter';

  return [
    {
      path: 'astro.config.mjs',
      content: `import { defineConfig } from 'astro/config';\nimport tailwind from '@astrojs/tailwind';\nexport default defineConfig({ integrations: [tailwind()] });\n`,
    },
    {
      path: 'tailwind.config.mjs',
      content: `export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '${primary}', light: '${primary}dd', dark: '${primary}bb' },
        secondary: '#1a1a2e',
        accent: { gold: '#f5e27a', DEFAULT: '${primary}' },
        surface: { soft: '#f8f9fa', DEFAULT: '#ffffff' },
        text: { DEFAULT: '#1a1a2e', muted: '#6b7280' },
      },
      fontFamily: {
        serif: ['${headingFont}', 'Georgia', 'serif'],
        sans: ['${bodyFont}', 'system-ui', 'sans-serif'],
      },
    },
  },
};\n`,
    },
    {
      path: 'src/styles/global.css',
      content: `@import url('https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;500;600;700&family=${bodyFont.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap');
@tailwind base; @tailwind components; @tailwind utilities;
@layer base { body { @apply font-sans text-text bg-surface antialiased; } h1,h2,h3,h4 { @apply font-serif; } }
@layer components {
  .btn-primary { @apply inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg; }
  .btn-outline { @apply inline-flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold px-6 py-3 rounded-xl hover:bg-primary hover:text-white transition-all; }
  .card { @apply bg-white rounded-3xl p-7 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300; }
}\n`,
    },
  ];
}

function buildPrompt(input: SiteGenerationInput, templateIndex: string, templateFiles: GeneratedFile[]): string {
  const biz = input.businessInfo as Record<string, unknown>;
  const contact = getContactInfo(input);
  const layoutFile = templateFiles.find((f) => f.path.includes('Layout.astro'));
  const indexFile = templateFiles.find((f) => f.path.includes('pages/index.astro'));
  let referenceSection = '';
  if (layoutFile) {
    referenceSection += `\n\nREFERENCE — Working Layout.astro:\n\`\`\`astro\n${layoutFile.content.slice(0, 3000)}\n\`\`\``;
  }
  if (indexFile) {
    referenceSection += `\n\nREFERENCE — Working index.astro:\n\`\`\`astro\n${indexFile.content.slice(0, 2000)}\n\`\`\``;
  }
  return `Build an Astro website. Config files (astro.config, tailwind, global.css) are ALREADY written.

Business: ${input.businessInfo.name || input.siteName}
${input.businessInfo.description ?? ''}
Services: ${(input.businessInfo.services ?? []).join(', ')}
Contact: ${JSON.stringify(contact)}
Color: ${input.design?.primaryColor ?? '#3B82F6'} | Tone: ${String(biz.brandTone ?? 'Professional')}

Template reference:
${templateIndex}
${referenceSection}

Write these files (use the Write tool for each):
1. src/layouts/Layout.astro — head, responsive nav, <slot/>, footer
2. src/components/Hero.astro — headline, 2 CTAs, stats
3. src/components/Services.astro — service cards with SVG icons
4. src/components/Testimonials.astro — 3 testimonials with stars
5. src/components/Pricing.astro — 2-3 plans + FAQ
6. src/components/Footer.astro — 4 columns
7. src/pages/index.astro — imports all components
8. src/pages/about.astro — company story
9. src/pages/services.astro — detailed services
10. src/pages/contact.astro — form + hours

Rules: business language, inline SVGs, no astro-icon, no content/*.md imports, no emoji, (el as HTMLElement).style in scripts.
CRITICAL — the sandbox only has astro, @astrojs/tailwind, and tailwindcss installed. Do NOT import any other packages. Use inline SVGs instead of icon libraries. Use static data arrays instead of content collections.
CRITICAL — ALL data arrays MUST have explicit TypeScript types. Example: const stats: { label: string; value: string }[] = [...]. Never leave untyped arrays — astro check will reject them.`;
}

async function collectDir(dir: string, base = ''): Promise<GeneratedFile[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: GeneratedFile[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'dist' || entry.name === 'node_modules') continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await collectDir(join(dir, entry.name), rel));
    else files.push({ path: rel, content: await readFile(join(dir, entry.name), 'utf-8').catch(() => '') });
  }
  return files;
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
    // DRY RUN: Skip LLM calls, return template files as-is
    if (process.env.DRY_RUN === 'true' || process.env.NODE_ENV === 'test') {
      progress('DRY RUN — skipping LLM, returning template files');
      const files = templateFiles.filter((f) => !f.path.includes('node_modules'));
      emit({ type: 'done', duration_ms: Date.now() - startedAt, turns: 0, cost_usd: 0, input_tokens: 0, output_tokens: 0 });
      return { success: true, files, cost: { totalCostUSD: 0, totalTokens: 0, breakdown: [] } };
    }

    // Write template files as reference
    for (const f of templateFiles) {
      const p = join(workDir, f.path);
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, f.content, 'utf-8');
    }
    progress(`Template ready — ${templateFiles.length} files`);

    // Pre-generate boilerplate (no LLM cost)
    const boilerplate = generateBoilerplate(input);
    for (const f of boilerplate) {
      const p = join(workDir, f.path);
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, f.content, 'utf-8');
      emit({ type: 'file_write', path: f.path, lines: f.content.split('\n').length });
    }
    progress(`Pre-generated ${boilerplate.length} config files`);

    // Build prompt
    const templateIndex = buildTemplateIndex(templateFiles);
    const prompt = buildPrompt(input, templateIndex, templateFiles);

    // Run Agent SDK
    progress('Agent generating website...');
    const abortController = new AbortController();
    let turns = 0;
    let resultText = '';

    const agentResult = query({
      prompt,
      options: {
        cwd: workDir,
        model: MODEL,
        maxTurns: MAX_TURNS_GENERATE,
        maxBudgetUsd: MAX_BUDGET_GENERATE,
        systemPrompt: `Expert Astro/Tailwind developer building a client website. Write files immediately. No explanations.

CRITICAL RULES — violations cause build failures:
- NEVER import astro-icon or any external npm package (only astro, @astrojs/tailwind, tailwindcss are installed)
- NEVER use getCollection() or astro:content — there are no content collections
- NEVER import from content/*.md — use inline data arrays instead
- NEVER use <Icon> components — use inline SVG or Unicode characters
- ALL .astro files must have matching --- fences (open and close)
- ALL imports in frontmatter must end with semicolons
- Use (el as HTMLElement).style for DOM access in <script> tags
- Images: use placeholder URLs like https://placehold.co/800x600
- Every component must be self-contained with no external dependencies`,
        tools: ['Read', 'Write', 'Edit', 'Glob'],
        allowedTools: ['Read', 'Write', 'Edit', 'Glob'],
        persistSession: false,
        abortController,
        env: { ...process.env, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '' },
      },
    });

    for await (const message of agentResult) {
      switch (message.type) {
        case 'assistant':
          turns++;
          progress(`Turn ${turns}`);
          for (const block of message.message.content) {
            if (block.type === 'text') emit({ type: 'text', content: block.text });
          }
          break;
        case 'tool_use':
          emit({ type: 'tool_call', name: (message as any).tool_name || 'tool', input: {} });
          break;
        case 'tool_result':
          if ((message as any).tool_name === 'Write' || (message as any).tool_name === 'Edit') {
            const path = String((message as any).input?.file_path || (message as any).input?.path || '');
            if (path) emit({ type: 'file_write', path, lines: 0 });
          }
          break;
        case 'result':
          if (message.subtype === 'success') resultText = message.result || '';
          else if (message.subtype?.startsWith('error')) {
            emit({ type: 'error', message: `Agent stopped: ${message.subtype}` });
          }
          break;
        case 'usage': {
          const u = message as any;
          trackLLMUsage(input.projectId, MODEL, 'site_generation', {
            promptTokens: u.input_tokens || 0,
            completionTokens: u.output_tokens || 0,
          });
          break;
        }
      }
    }

    // Collect output files
    progress('Collecting output files...');
    const allFiles = await collectDir(workDir);
    const filtered = allFiles.filter((f) => !INTEGRATION_COMPONENT_BLOCKLIST.some((b) => f.path.endsWith(b)));
    for (const file of filtered) {
      if (file.path === 'astro.config.mjs' && file.content.includes('astro-icon')) {
        file.content = file.content.replace(/import\s+icon\s+from\s+['"]astro-icon['"];?\n?/g, '').replace(/,?\s*icon\(\)/g, '');
      }
    }
    const files = fixContentImports(filtered);
    const filesRecord: Record<string, string> = {};
    for (const file of files) {
      filesRecord[file.path] = file.content;
    }
    const validationResult = validateAndFixFiles(filesRecord);
    if (validationResult.fixCount > 0) {
      for (const file of files) {
        file.content = validationResult.fixedFiles[file.path] ?? file.content;
      }
      console.log(`[AgentPipeline] Pre-deploy validation: ${validationResult.fixCount} fixes applied`);
      emit({ type: 'text', content: `[AgentPipeline] Pre-deploy validation: ${validationResult.fixCount} fixes applied` });
      for (const summary of validationResult.fixSummary) {
        emit({ type: 'text', content: `[ASTValidation] ${summary}` });
      }
    }

    const durationMs = Date.now() - startedAt;
    emit({ type: 'done', duration_ms: durationMs, turns, cost_usd: 0, input_tokens: 0, output_tokens: 0 });
    progress(`Done — ${files.length} files in ${turns} turns (${(durationMs / 1000).toFixed(0)}s)`);

    // Sync costs from Convex to Supabase
    syncCostsToSupabase(input.projectId).catch(() => {});

    return {
      success: true, files,
      cost: { totalCostUSD: 0, totalTokens: 0, breakdown: [] }, // Actual costs tracked in Convex
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
    return Boolean(process?.versions?.node && process.env.ANTHROPIC_API_KEY);
  } catch { return false; }
}
