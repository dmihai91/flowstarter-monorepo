/**
 * Claude Site Generation Service (Server-side)
 *
 * Uses the Anthropic SDK with tool use to generate and customize websites.
 * Refactored into modules for maintainability.
 */

import { fetchTemplateScaffold } from '../templateService';

// Re-export types
export type { SiteGenerationInput, GeneratedFile, SiteGenerationResult, BuildError, AgentActivityEvent } from './types';

// Import from modules
import type { SiteGenerationInput, GeneratedFile, SiteGenerationResult } from './types';
import { TEMPLATE_MAPPING, generateGlobalCSS } from './templates';
import { sanitizeContent, detectSyntaxErrors } from './sanitization';
import {
  generateFileContent,
  generateFileContentWithDesign,
  generateModificationPlan,
  deduplicateModifications,
} from './llmHelpers';
import { generateDesignSpec, type DesignSpec } from './designPhase';
import { fixSyntaxErrors } from './errorHealing';
import { normalizePath, initializeFilesMap, buildContext, fixLogoPlaceholders } from './file-initialization';

// Re-export healBuildErrors for external use
export { healBuildErrors } from './errorHealing';

// Re-export legacy/hybrid generation functions
export { generateSiteSync, generateSiteHybrid } from './generation-legacy';

/**
 * Generate a website by customizing an existing template
 */
export async function generateSiteFromTemplate(
  input: SiteGenerationInput,
  onProgress?: (message: string) => void,
): Promise<SiteGenerationResult> {
  // Agents SDK path — Node.js only (not Cloudflare Workers)
  // Pipe onAgentEvent from input through to the SDK callbacks
  const agentEventSink = input.onAgentEvent;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    return { success: false, error: 'ANTHROPIC_API_KEY not configured' };
  }

  try {
    // 1. Fetch template
    let templateSlug = input.template.slug;

    if (TEMPLATE_MAPPING[templateSlug]) {
      console.log(
        `[FlowstarterAgent] Mapping virtual template ${templateSlug} to base template ${TEMPLATE_MAPPING[templateSlug]}`,
      );
      templateSlug = TEMPLATE_MAPPING[templateSlug];
    }

    console.log('[FlowstarterAgent] Fetching template:', templateSlug);
    onProgress?.(`Fetching template ${input.template.name}...`);

    let templateFiles: Array<{ path: string; content: string }> = [];

    try {
      templateFiles = await fetchTemplateScaffold(templateSlug);
    } catch (e) {
      console.warn(
        `[FlowstarterAgent] Failed to fetch template ${templateSlug}, falling back to generation from scratch:`,
        e,
      );

      try {
        if (input.template.slug !== 'modern-business') {
          templateFiles = await fetchTemplateScaffold('coach-pro'); // coach-pro is a real MCP template
        }
      } catch {
        console.warn('[FlowstarterAgent] Fallback template fetch failed, generating from scratch');
      }
    }

    console.log(`[FlowstarterAgent] Fetched ${templateFiles.length} files`);

    // 2. Initialize files map with defaults
    const filesMap = initializeFilesMap(templateFiles, input);

    // 3. Build context and create modification plan
    const context = buildContext(filesMap);
    
    // 4. Execute changes — Agents SDK (Node.js) or memory-based (Workers)
    const generatedFiles: GeneratedFile[] = [];

    if (isAgentsSDKAvailable()) {
      // ── Full Agents SDK pipeline: Opus orchestrator + Sonnet sub-agents ──────
      // Skip design + planning phases — the agent does its own planning
      onProgress?.('Launching Agents SDK pipeline (Opus orchestrator + Sonnet coders)...');

      const pipelineResult = await runAgentPipeline(
        { ...input, onAgentEvent: agentEventSink },
        templateFiles,
        onProgress,
      );

      if (!pipelineResult.success) {
        throw new Error(pipelineResult.error ?? 'Agent pipeline failed');
      }

      for (const f of pipelineResult.files ?? []) {
        generatedFiles.push(f);
      }
      // Pass pipeline cost to result
      return { success: true, files: generatedFiles, cost: pipelineResult.cost };
    } else {
      // ─── PHASE 1: DESIGN (Opus) — only for non-agent path ──────────────────
      onProgress?.(`Creative director is designing your site...`);
      console.log('[FlowstarterAgent] Phase 1: Generating design spec with Opus...');

      let designSpec: DesignSpec | null = null;
      try {
        designSpec = await generateDesignSpec(input);
        console.log('[FlowstarterAgent] Design spec created:', {
          mood: designSpec.designDirection.mood,
          uniqueElement: designSpec.designDirection.uniqueElement,
          heroHeadline: designSpec.hero.headline,
          sections: designSpec.sections.length,
        });
        onProgress?.(`Design vision: "${designSpec.designDirection.uniqueElement}"`);
      } catch (error) {
        console.error('[FlowstarterAgent] Design phase failed, continuing with default:', error);
        onProgress?.(`Design phase skipped, using template defaults...`);
      }

      // ─── PHASE 2: PLANNING ──────────────────────────────────────────────────
      onProgress?.(`Planning strategic customizations...`);
      console.log('[FlowstarterAgent] Generating strategic modification plan...');

      const modifications = await generateModificationPlan(input, context);
      console.log(`[FlowstarterAgent] Plan created: ${modifications.length} modifications`);

      const deduplicatedMods = deduplicateModifications(modifications);
      console.log(`[FlowstarterAgent] Deduplicated to ${deduplicatedMods.length} unique files`);
      onProgress?.(`Plan created: Updating ${deduplicatedMods.length} files...`);
      // ── Memory-based path: parallel LLM batch calls (Cloudflare Workers) ────

    // Add all original files first (except those being modified)
    for (const [path, content] of filesMap.entries()) {
      if (!deduplicatedMods.find((m) => m.path === path || m.path === `src/${path}` || `src/${m.path}` === path)) {
        const normalizedPath = normalizePath(path);
        generatedFiles.push({ path: normalizedPath, content });
      }
    }

    // Process modifications in batches
    const batchSize = 5;

    for (let i = 0; i < deduplicatedMods.length; i += batchSize) {
      const batch = deduplicatedMods.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      console.log(`[FlowstarterAgent] Processing batch ${batchNum}...`);
      // Show which files are being generated
      const fileNames = batch.map((m) => m.path.split('/').pop()).join(', ');
      onProgress?.(`Generating files (${i + 1}-${Math.min(i + batch.length, deduplicatedMods.length)} of ${deduplicatedMods.length}): ${fileNames}`);

      const results = await Promise.all(
        batch.map(async (mod) => {
          let originalPath = mod.path;
          let content = filesMap.get(originalPath);

          if (!content && originalPath.startsWith('src/')) {
            originalPath = originalPath.replace('src/', '');
            content = filesMap.get(originalPath);
          }

          const isNewFile = !content || mod.instructions.includes('NEW:');

          if (isNewFile) {
            console.log(`[FlowstarterAgent] Creating new file ${mod.path}...`);
            onProgress?.(`Creating ${mod.path.split('/').pop()}...`);
          } else {
            console.log(`[FlowstarterAgent] Modifying ${mod.path}...`);
            onProgress?.(`Customizing ${mod.path.split('/').pop()}...`);
          }

          const contextStr = isNewFile
            ? `Instructions: ${mod.instructions}\n\nThis is a NEW file - create it from scratch based on the instructions.`
            : `Instructions: ${mod.instructions}\n\nOriginal File Content:\n${content}`;

          const newContent = designSpec
            ? await generateFileContentWithDesign(input, mod.path, contextStr, designSpec)
            : await generateFileContent(input, mod.path, contextStr);
          let sanitizedContent = sanitizeContent(mod.path, newContent);

          const syntaxError = detectSyntaxErrors(mod.path, sanitizedContent);

          if (syntaxError) {
            console.warn(`[FlowstarterAgent] Syntax error detected in ${mod.path}: ${syntaxError}`);
            sanitizedContent = await fixSyntaxErrors(input, mod.path, sanitizedContent, syntaxError);
          }

          return { path: mod.path, content: sanitizedContent };
        }),
      );

      for (const res of results) {
        if (res) {
          generatedFiles.push(res);
        }
      }
      onProgress?.(`Completed ${Math.min(i + batch.length, deduplicatedMods.length)} of ${deduplicatedMods.length} files`);
    }

    } // end memory-based path

    console.log(`[FlowstarterAgent] Generation complete. Total files: ${generatedFiles.length}`);
    onProgress?.('Validating generated files...');

    // Final validation pass
    let fixCount = 0;

    for (let i = 0; i < generatedFiles.length; i++) {
      const file = generatedFiles[i];
      const syntaxError = detectSyntaxErrors(file.path, file.content);

      if (syntaxError) {
        console.warn(`[FlowstarterAgent] Final validation found syntax error in ${file.path}: ${syntaxError}`);
        const fixed = await fixSyntaxErrors(input, file.path, file.content, syntaxError);
        generatedFiles[i] = { ...file, content: fixed };
        fixCount++;
      }
    }

    if (fixCount > 0) {
      console.log(`[FlowstarterAgent] Fixed ${fixCount} syntax errors in final validation`);
      onProgress?.(`Fixed ${fixCount} syntax errors`);
    }

    // Ensure global.css is in output
    if (!generatedFiles.find((f) => f.path === 'src/styles/global.css')) {
      console.log('[FlowstarterAgent] Force injecting src/styles/global.css');
      generatedFiles.push({
        path: 'src/styles/global.css',
        content: generateGlobalCSS(input),
      });
    }

    // Post-process: fix logo placeholders when no logo was uploaded
    if (!input.businessInfo?.logo) {
      const businessName = input.businessInfo?.name || input.projectName || 'My Business';
      fixLogoPlaceholders(generatedFiles, businessName);
    }

    return { success: true, files: generatedFiles };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[FlowstarterAgent] Error:', error);

    return { success: false, error: errorMessage };
  }
}




// ═══════════════════════════════════════════════════════════════════════════
// Agents SDK Integration
// Replaces the batch file-generation phase with a single autonomous SDK run.
// Requires Node.js runtime (file system access via os.tmpdir()).
// Falls back to the memory-based approach in Cloudflare Workers.
// ═══════════════════════════════════════════════════════════════════════════

import { runAgentPipeline, isAgentPipelineAvailable } from '~/lib/services/agentPipeline.server';

// isAgentPipelineAvailable imported from agentPipeline.server
const isAgentsSDKAvailable = isAgentPipelineAvailable;

