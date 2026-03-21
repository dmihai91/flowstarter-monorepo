/**
 * Unified Build API
 * 
 * Single entry point for ALL build requests.
 * Returns SSE stream for real-time progress updates.
 */

import type { ActionFunctionArgs } from '@remix-run/node';
import type { AgentActivityEvent } from '~/lib/services/claude-agent/types';
import { routeModification, type RouteDecision } from './api.modification-router';

// Import simple build logic
import {
  generateSiteFromTemplate,
  type SiteGenerationInput,
  type SiteGenerationResult,
} from '~/lib/services/claudeAgentService.server';
import {
  prewarmSandbox,
  startPreviewWithPrewarmedSandbox,
  retryPreviewWithFiles,
  type PrewarmedSandbox,
} from '~/lib/services/daytonaService.server';
import { resolvePreviewUrlFromResult } from '~/lib/services/daytona/previewUrl';
import { tryDeterministicFix } from '~/lib/services/claude-agent/errorFixMap';
import { healBuildErrors } from '~/lib/services/claude-agent/errorHealing';
import { validateAndFixFiles } from '~/lib/services/claude-agent/astValidation';
import type { BuildError } from '~/lib/services/claude-agent/types';
import { getConvexClient } from './onboarding-chat/cost-logging';
import { api } from '../../convex/_generated/api';
import { createClient } from '@supabase/supabase-js';
import { injectIntegrations } from '~/lib/services/integrations/index';

// Import Gretly pipeline
import { generateSite as generateSiteGretly, prewarmEnvironment } from '~/lib/flowstarter';
import type { FlowstarterInput } from '~/lib/flowstarter';

// Re-export for consumers
export type { RouteDecision };

// �"?�"?�"? Types �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

interface BuildRequest {
  projectId: string;
  /** Convex conversation _id from the URL — use this for Convex mutations */
  convexConversationId?: string;
  siteName: string;
  businessInfo: {
    name: string;
    description?: string;
    tagline?: string;
    services?: string[];
    targetAudience?: string;
    businessGoals?: string[];
    brandTone?: string;
  };
  template: {
    slug: string;
    name: string;
    files?: Record<string, string>;
  };
  design?: {
    primaryColor: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    headingFont?: string;
  };
  integrations?: Array<{
    id: string;
    name: string;
    config: Record<string, unknown>;
  }>;
  contactDetails?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  options?: {
    deployToPreview?: boolean;
    generateImages?: boolean;
    skipReview?: boolean;
    maxFixAttempts?: number;
  };
}

interface GeneratedFile {
  path: string;
  content: string;
}

// �"?�"?�"? Constants �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

const MAX_SELF_HEAL_ATTEMPTS = 10;

interface PreviewChainResult {
  success: boolean;
  previewUrl?: string;
  sandboxId?: string;
  error?: string;
  buildError?: { file: string; message: string };
}

function getPreviewPayload(result: PreviewChainResult | null): { url: string; sandboxId: string } | null {
  const previewUrl = resolvePreviewUrlFromResult(result);
  if (!result?.success || !previewUrl || !result.sandboxId) {
    return null;
  }

  return { url: previewUrl, sandboxId: result.sandboxId };
}

// �"?�"?�"? Helper Functions �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

function describeBuildRequest(req: BuildRequest): string {
  const parts: string[] = [];
  parts.push(`Generate a website for "${req.businessInfo.name}"`);
  if (req.businessInfo.description) {
    parts.push(`Description: ${req.businessInfo.description}`);
  }
  if (req.integrations && req.integrations.length > 0) {
    const integrationNames = req.integrations.map(i => i.name).join(', ');
    parts.push(`With integrations: ${integrationNames}`);
  }
  return parts.join('. ');
}

function tryRuleBasedFix(
  errorMessage: string,
  fileContent: string,
  filePath: string,
): { fixedContent: string; summary: string } | null {
  const lowerError = errorMessage.toLowerCase();

  if (lowerError.includes('astro-icon') || (lowerError.includes('cannot find module') && errorMessage.includes('astro-icon'))) {
    const fixed = fileContent
      .replace(/import\s+.*?\s+from\s+['"]astro-icon\/components['"];?\n?/g, '')
      .replace(/<Icon\s+name=["'][^"']*["']\s*(?:class=["'][^"']*["'])?\s*\/?\s*>/g, '<!-- icon -->')
      .replace(/<Icon\s+[^>]*\/>/g, '<!-- icon -->');
    if (fixed !== fileContent) {
      return { fixedContent: fixed, summary: 'Removed astro-icon imports and usage' };
    }
  }

  // Fix Element.style TypeScript error — cast to HTMLElement
  if (lowerError.includes("property 'style' does not exist") || lowerError.includes('ts(2339)') && lowerError.includes('style')) {
    const fixed = fileContent
      .replace(/(\w+)\.style\./g, '($1 as HTMLElement).style.');
    if (fixed !== fileContent) {
      return { fixedContent: fixed, summary: 'Cast Element to HTMLElement for .style access' };
    }
  }

  // Fix content collection imports
  if (lowerError.includes('getentry') || lowerError.includes('content collection')) {
    const fixed = fileContent
      .replace(/import\s*\{[^}]*getEntry[^}]*\}\s*from\s*['"]astro:content['"];?\n?/g, '')
      .replace(/const\s+\w+\s*=\s*await\s+getEntry\([^)]*\);?\n?/g, '');
    if (fixed !== fileContent) {
      return { fixedContent: fixed, summary: 'Removed content collection imports' };
    }
  }

  if (lowerError.includes('react') && filePath.endsWith('.astro')) {
    const fixed = fileContent.replace(/import\s+.*?\s+from\s+['"]react['"];?\n?/g, '');
    if (fixed !== fileContent) {
      return { fixedContent: fixed, summary: 'Removed React import from Astro file' };
    }
  }

  return null;
}

type SSESender = (data: Record<string, unknown>) => void;
type SandboxEventSender = (event: AgentActivityEvent) => void;


// �"?�"?�"? Simple Build Handler �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

async function handleSimpleBuild(body: BuildRequest, send: SSESender, sendAgentEvent?: SandboxEventSender): Promise<void> {
  try {

    // Start prewarming sandbox in parallel
    send({ type: 'progress', phase: 'prewarm', message: 'Preparing build environment...' });
    const prewarmPromise = prewarmSandbox(body.projectId);

    // Generate site files
    send({ type: 'progress', phase: 'generate', message: 'Generating website files...' });
    
    // Convert BuildRequest to SiteGenerationInput format
    const generationInput: SiteGenerationInput = {
      projectId: body.projectId,
      siteName: body.siteName,
      businessInfo: {
        name: body.businessInfo.name,
        tagline: body.businessInfo.tagline,
        description: body.businessInfo.description,
        services: body.businessInfo.services,
        contact: body.contactDetails,
      },
      template: {
        slug: body.template.slug,
        name: body.template.name,
      },
      design: {
        primaryColor: body.design?.primaryColor || '#3B82F6',
        secondaryColor: body.design?.secondaryColor,
        accentColor: body.design?.accentColor,
        fontFamily: body.design?.fontFamily,
        headingFont: body.design?.headingFont,
      },
    };

    console.log('[Build:Simple] Calling generateSiteFromTemplate with:', JSON.stringify({
      projectId: generationInput.projectId,
      siteName: generationInput.siteName,
      templateSlug: generationInput.template.slug,
      templateName: generationInput.template.name,
    }));
    
    const result: SiteGenerationResult = await generateSiteFromTemplate(
      { ...generationInput, onAgentEvent: sendAgentEvent },
      (msg) => {
        console.log('[Build:Simple] Progress:', msg);
        send({ type: 'progress', phase: 'generate', message: msg });
      }
    );

    console.log('[Build:Simple] Generation result:', JSON.stringify({
      success: result.success,
      error: result.error,
      fileCount: result.files?.length || 0,
    }));

    if (!result.success || !result.files || result.files.length === 0) {
      console.error('[Build:Simple] Generation failed:', result.error || 'No files generated');
      throw new Error(result.error || 'No files generated');
    }

    send({ type: 'progress', phase: 'generate', message: `Generated ${result.files.length} files` });

    const generatedFilesRecord: Record<string, string> = {};
    for (const file of result.files) {
      generatedFilesRecord[file.path] = file.content;
    }
    const validationResult = validateAndFixFiles(generatedFilesRecord);
    if (validationResult.fixCount > 0) {
      result.files = result.files.map((file) => ({
        ...file,
        content: validationResult.fixedFiles[file.path] ?? file.content,
      }));
      console.log(
        '[Build:Simple] Pre-sandbox validation applied fixes:',
        validationResult.fixCount,
        validationResult.fixSummary,
      );
      send({
        type: 'progress',
        phase: 'generate',
        message: `Pre-sandbox validation applied ${validationResult.fixCount} fixes`,
      });
      sendAgentEvent?.({
        type: 'text',
        content: `Pre-sandbox validation applied ${validationResult.fixCount} fixes`,
      });
      for (const summary of validationResult.fixSummary) {
        sendAgentEvent?.({ type: 'text', content: `[ASTValidation] ${summary}` });
      }
    }

    // Wait for prewarm
    const prewarmedSandbox: PrewarmedSandbox | null = await prewarmPromise;

    // Build with self-healing
    let previewResult: PreviewChainResult | null = null;
    let currentFiles = [...result.files];
    let sandboxId: string | undefined;

    for (let attempt = 0; attempt <= MAX_SELF_HEAL_ATTEMPTS; attempt++) {
      const phase = attempt === 0 ? 'build' : 'fix';
      const message = attempt === 0 ? 'Building preview...' : `Fixing errors (attempt ${attempt})...`;
      send({ type: 'progress', phase, message });

      const filesRecord: Record<string, string> = {};
      for (const file of currentFiles) {
        filesRecord[file.path] = file.content;
      }

      if (attempt === 0 && prewarmedSandbox) {
        previewResult = await startPreviewWithPrewarmedSandbox(
          body.projectId,
          filesRecord,
          prewarmedSandbox,
          undefined,
          (msg) => { send({ type: 'progress', phase: 'build', message: msg }); sendAgentEvent?.({ type: 'sandbox_status', message: msg }); }
        );
        sandboxId = prewarmedSandbox.sandboxId;
      } else if (sandboxId) {
        previewResult = await retryPreviewWithFiles(
          body.projectId,
          sandboxId,
          filesRecord,
          undefined,
          (msg) => { send({ type: 'progress', phase: 'fix', message: msg }); sendAgentEvent?.({ type: 'sandbox_status', message: msg }); }
        );
      } else {
        // No sandbox available, can't continue
        console.error('[Build:Simple] No sandbox available for preview retry', {
          attempt,
          projectId: body.projectId,
        });
        break;
      }

      // If preview succeeded and we have a convex conversation ID, re-persist with correct ID
      const convexIdForPersist = body.convexConversationId;
      if (previewResult?.success && convexIdForPersist) {
        const url = resolvePreviewUrlFromResult(previewResult);
        const sid = previewResult.sandboxId ?? sandboxId ?? '';
        if (url) {
          import('~/lib/services/daytona/convexClient').then(({ persistPreviewUrl }) => {
            persistPreviewUrl(convexIdForPersist, url, sid).catch(() => {});
          });
        }
      }

      console.error('[Build:Simple] Preview attempt completed', {
        attempt,
        success: previewResult.success,
        previewUrl: resolvePreviewUrlFromResult(previewResult),
        sandboxId: previewResult.sandboxId ?? sandboxId,
        error: previewResult.error,
        buildError: previewResult.buildError,
      });

      if (previewResult.success) {
        send({ type: 'progress', phase: 'complete', message: 'Build succeeded!' });
        break;
      }

      if (!previewResult.buildError || attempt >= MAX_SELF_HEAL_ATTEMPTS) {
        break;
      }

      // Try to fix
      const errorMsg = previewResult.buildError.message;
      const errorFile = previewResult.buildError.file;
      sendAgentEvent?.({ type: 'auto_fix', attempt, max: MAX_SELF_HEAL_ATTEMPTS, error: `${errorFile}: ${errorMsg}`, strategy: 'analyzing' });
      send({ type: 'progress', phase: 'fix', message: `Fixing error in ${errorFile}...` });

      const fileToFix = currentFiles.find(f => f.path.includes(errorFile));
      if (!fileToFix) break;

      // Strategy 1: Rule-based fix
      const ruleFix = tryRuleBasedFix(errorMsg, fileToFix.content, fileToFix.path);
      if (ruleFix) {
        fileToFix.content = ruleFix.fixedContent;
        sendAgentEvent?.({ type: 'auto_fix_result', attempt, success: true, message: `Rule fix: ${ruleFix.summary}` });
        send({ type: 'progress', phase: 'fix', message: `Fixed: ${ruleFix.summary}` });
        continue;
      }

      // Strategy 2: Deterministic fix
      const allFilesRecord: Record<string, string> = {};
      for (const f of currentFiles) { allFilesRecord[f.path] = f.content; }
      sendAgentEvent?.({ type: 'auto_fix', attempt, max: MAX_SELF_HEAL_ATTEMPTS, error: errorMsg, strategy: 'deterministic' });
      const detFix = tryDeterministicFix(errorMsg, errorMsg, fileToFix.content, fileToFix.path, allFilesRecord);
      if (detFix) {
        fileToFix.content = detFix.fixedContent;
        sendAgentEvent?.({ type: 'auto_fix_result', attempt, success: true, message: `Deterministic fix: ${detFix.summary}` });
        send({ type: 'progress', phase: 'fix', message: `Fixed: ${detFix.summary}` });
        continue;
      }

      // Strategy 3: AI healing (GLM)
      const buildError: BuildError = { file: errorFile, message: errorMsg };
      sendAgentEvent?.({ type: 'auto_fix', attempt, max: MAX_SELF_HEAL_ATTEMPTS, error: `${errorFile}: ${errorMsg}`, strategy: 'ai-healing' });
      send({ type: 'progress', phase: 'fix', message: 'AI is fixing the error...' });

      try {
        const healedFiles = await healBuildErrors(
          generationInput, currentFiles, [buildError],
          (msg) => { send({ type: 'progress', phase: 'fix', message: msg }); sendAgentEvent?.({ type: 'text', content: msg }); }
        );
        currentFiles = healedFiles;
        sendAgentEvent?.({ type: 'auto_fix_result', attempt, success: true, message: `AI healed ${errorFile}` });
        continue;
      } catch (error) {
        sendAgentEvent?.({ type: 'auto_fix_result', attempt, success: false, message: error instanceof Error ? error.message : 'AI healing failed' });
        break;
      }
    }

        const totalCost = result.cost ?? { totalCostUSD: 0, totalTokens: 0, breakdown: [] };

    // Persist costs to Convex
    try {
      const convex = getConvexClient();
      if (convex && totalCost.breakdown.length > 0) {
        const projectConvexId = body.projectId;
        for (const usage of totalCost.breakdown) {
          await convex.mutation(api.costs.logCost, {
            projectId: projectConvexId as any,
            operation: 'site_generation',
            model: usage.model,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
            costUSD: usage.costUSD,
            metadata: { template: body.template?.slug },
          });
        }
        console.log('[Build:Simple] Logged', totalCost.breakdown.length, 'cost entries, total: $' + totalCost.totalCostUSD.toFixed(4));
      }
    } catch (e) {
      console.error('[Build:Simple] Failed to log costs:', e);
    }

    // Inject integrations (Calendly, Analytics, Lead capture) — zero LLM cost
    // Auto-read from Supabase project config (operator sets these in dashboard)
    // Client scoped to project's own data via RLS + .eq('id', projectId)
    try {
      const projectId = body.projectId;
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      if (projectId && supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
        // Prefer service role key for Vault access; fall back to anon key (Vault RPCs won't work)
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey!);
        const { data: projConfig } = await supabaseClient
          .from('projects')
          .select('calendly_url, calendly_api_key_id, ga_property_id, ga_refresh_token_id')
          .eq('id', projectId)
          .single();

        const intConfig: Record<string, unknown> = Object.fromEntries(
          (body.integrations ?? []).map((integration) => [integration.id, integration.config])
        );

        // Calendly: use saved config if not passed in body
        if (projConfig?.calendly_url && !intConfig.calendly) {
          let calendlyApiKey: string | undefined;
          if (projConfig.calendly_api_key_id) {
            try {
              const vaultRes = await supabaseClient.rpc('read_project_secret', { p_secret_id: projConfig.calendly_api_key_id });
              if (vaultRes.data) calendlyApiKey = vaultRes.data as string;
            } catch { /* vault read optional */ }
          }
          intConfig.calendly = { url: projConfig.calendly_url, apiKey: calendlyApiKey };
        }

        // Analytics: use saved GA measurement ID
        if (projConfig?.ga_property_id && !intConfig.analytics) {
          intConfig.analytics = { provider: 'ga4', id: projConfig.ga_property_id };
        }

        // Lead capture: always inject if project has an ID
        intConfig.leadCapture = { projectId, apiUrl: process.env.LEAD_CAPTURE_URL || 'https://flowstarter.dev/api/leads/capture' };

        if (Object.keys(intConfig).length > 0) {
          currentFiles = await injectIntegrations(currentFiles, intConfig as any);
          console.log('[Build:Simple] Integrations injected from project config');
        }
      }
    } catch (e) {
      console.error('[Build:Simple] Integration injection failed:', e);
    }

    // Persist generated files to Convex via HTTP Action
    try {
      const convexSiteUrl = (process.env.CONVEX_URL || 'https://outstanding-otter-369.convex.cloud').replace('.convex.cloud', '.convex.site');
      const handoffSecret = process.env.HANDOFF_SECRET;
      if (handoffSecret && currentFiles.length > 0) {
        const saveResp = await fetch(`${convexSiteUrl}/files/save-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-handoff-secret': handoffSecret },
          body: JSON.stringify({
            supabaseProjectId: body.projectId,
            files: currentFiles.map(f => ({ path: f.path, content: f.content })),
          }),
        });
        const saveResult = await saveResp.json() as { saved?: number; error?: string };
        if (saveResult.saved) {
          console.log(`[Build:Simple] Persisted ${saveResult.saved} files to Convex`);
        } else {
          console.error('[Build:Simple] Failed to persist files:', saveResult.error);
        }
      }
    } catch (e) {
      console.error('[Build:Simple] Failed to persist files to Convex:', e);
    }

    // Persist total cost to Supabase project record
    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseKey && body.projectId) {
        const costUsd = totalCost.totalCostUSD;
        const aiCredits = Math.ceil(costUsd * 100); // 1 credit = $0.01
        await fetch(
          `${supabaseUrl}/rest/v1/projects?id=eq.${body.projectId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              generation_cost_usd: costUsd,
              ai_credits_used: aiCredits,
              ...(sandboxId ? { sandbox_id: sandboxId } : {}),
              ...(getPreviewPayload(previewResult) ? { preview_url: getPreviewPayload(previewResult)?.url } : {}),
            }),
          }
        );
        console.log(`[Build:Simple] Updated Supabase project cost: $${costUsd.toFixed(4)} (${aiCredits} credits)`);
      }
    } catch (e) {
      console.error('[Build:Simple] Failed to update Supabase cost:', e);
    }

    send({
      type: 'complete',
      result: {
        success: previewResult?.success ?? false,
        files: currentFiles.map(f => ({ path: f.path, content: f.content })),
        preview: getPreviewPayload(previewResult),
        previewError: previewResult?.error,
        cost: totalCost,
        route: 'simple',
      },
    });

  } catch (error) {
    console.error('[Build:Simple] Error:', error);
    send({
      type: 'error',
      error: error instanceof Error ? error.message : 'Build failed',
    });
  }
}

// �"?�"?�"? Gretly Build Handler �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

async function handleGretlyBuild(body: BuildRequest, send: SSESender, sendAgentEvent?: SandboxEventSender): Promise<void> {
  try {
    send({ type: 'progress', phase: 'prewarm', message: 'Preparing build environment...' });
    const prewarmedSandbox = await prewarmEnvironment(body.projectId);

    const input: FlowstarterInput = {
      projectId: body.projectId,
      siteName: body.siteName,
      businessInfo: body.businessInfo,
      template: body.template,
      design: body.design,
    };

    const result = await generateSiteGretly(input, {
      skipReview: body.options?.skipReview ?? false,
      maxFixAttempts: body.options?.maxFixAttempts ?? 3,
      prewarmedSandbox,
      onProgress: (p) => {
        send({ type: 'progress', phase: p.phase, message: p.message, progress: p.progress });
      },
    });

    send({
      type: 'complete',
      result: {
        success: result.success,
        files: Object.entries(result.files).map(([path, content]) => ({ path, content })),
        preview: result.previewUrl ? {
          url: result.previewUrl,
          sandboxId: result.sandboxId || '',
        } : null,
        previewError: result.error,
        route: 'gretly',
      },
    });

  } catch (error) {
    console.error('[Build:Gretly] Error:', error);
    send({
      type: 'error',
      error: error instanceof Error ? error.message : 'Build failed',
    });
  }
}

// �"?�"?�"? Main Action Handler �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json() as BuildRequest;

    // Validate
    if (!body.projectId) {
      return Response.json({ error: 'projectId is required' }, { status: 400 });
    }
    if (!body.siteName) {
      return Response.json({ error: 'siteName is required' }, { status: 400 });
    }
    if (!body.businessInfo?.name) {
      return Response.json({ error: 'businessInfo.name is required' }, { status: 400 });
    }
    if (!body.template?.slug) {
      return Response.json({ error: 'template.slug is required' }, { status: 400 });
    }

    // Agents SDK is the primary pipeline. Set AGENTS_SDK_ENABLED=false to fall back to the Gretly pipeline.
    const useGretlyFallback = process.env.AGENTS_SDK_ENABLED === 'false';
    console.log(`[Build] Pipeline: ${useGretlyFallback ? 'Gretly (legacy fallback)' : 'Agents SDK (primary)'}`);

    // Create SSE stream with keepalive pings every 20s
    // (prevents proxy/browser timeouts during long agent turns)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };
        const sendAgentEvent = (event: AgentActivityEvent) => {
          controller.enqueue(encoder.encode(`event: agent-event\ndata: ${JSON.stringify(event)}\n\n`));
          // Log agent pipeline costs when the 'done' event arrives
          if (event.type === 'done' && (event as any).cost_usd > 0) {
            const e = event as any;
            const convex = getConvexClient();
            if (convex) {
              convex.mutation(api.costs.logCost, {
                operation: 'site_generation' as const,
                model: 'claude-agent-sdk',
                promptTokens: e.input_tokens ?? 0,
                completionTokens: e.output_tokens ?? 0,
                totalTokens: (e.input_tokens ?? 0) + (e.output_tokens ?? 0),
                costUSD: e.cost_usd,
                durationMs: e.duration_ms,
                metadata: { step: 'agent-pipeline' },
              }).catch(err => console.error('[Build] Failed to log agent cost:', err));
            }
            // Also update Supabase project record
            const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const pid = body?.projectId;
            if (supabaseUrl && supabaseKey && pid) {
              const aiCredits = Math.ceil(e.cost_usd * 100);
              fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${pid}`, {
                method: 'PATCH',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                  generation_cost_usd: e.cost_usd,
                  ai_credits_used: aiCredits,
                }),
              }).catch(err => console.error('[Build] Failed to update Supabase cost:', err));
            }
          }
        };

        // Keepalive: SSE comment every 20s so the connection isn't dropped
        const keepalive = setInterval(() => {
          try { controller.enqueue(encoder.encode(': keepalive\n\n')); } catch { /* closed */ }
        }, 20_000);

        try {
          if (useGretlyFallback) {
            await handleGretlyBuild(body, send, sendAgentEvent);
          } else {
            await handleSimpleBuild(body, send, sendAgentEvent);
          }
        } catch (error) {
          send({ type: 'error', error: error instanceof Error ? error.message : 'Build failed' });
        } finally {
          clearInterval(keepalive);
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[Build] Error:', error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Build failed' },
      { status: 500 }
    );
  }
}
