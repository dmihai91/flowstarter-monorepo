/**
 * Unified Build API
 * 
 * Single entry point for ALL build requests.
 * Returns SSE stream for real-time progress updates.
 */

import type { ActionFunctionArgs } from '@remix-run/node';
import type { AgentActivityEvent } from '~/components/editor/AgentActivityPanel';
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
import { resetCostTracker, getTotalCost } from '~/lib/services/llm';

// Import Gretly pipeline
import { generateSite as generateSiteGretly, prewarmEnvironment } from '~/lib/flowstarter';
import type { FlowstarterInput } from '~/lib/flowstarter';

// Re-export for consumers
export type { RouteDecision };

// �"?�"?�"? Types �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

interface BuildRequest {
  projectId: string;
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
    resetCostTracker();

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
      send({ type: 'progress', phase: 'fix', message: `Fixing error in ${previewResult.buildError.file}...` });

      const fileToFix = currentFiles.find(f => f.path.includes(previewResult!.buildError!.file));
      if (!fileToFix) break;

      const ruleFix = tryRuleBasedFix(previewResult.buildError.message, fileToFix.content, fileToFix.path);
      if (ruleFix) {
        fileToFix.content = ruleFix.fixedContent;
        send({ type: 'progress', phase: 'fix', message: `Fixed: ${ruleFix.summary}` });
        continue;
      }

      // Build filesRecord for deterministic fix
      const allFilesRecord: Record<string, string> = {};
      for (const f of currentFiles) {
        allFilesRecord[f.path] = f.content;
      }
      const detFix = tryDeterministicFix(
        previewResult.buildError.message,
        previewResult.buildError.message, // fullOutput - use message as fallback
        fileToFix.content,
        fileToFix.path,
        allFilesRecord
      );
      if (detFix) {
        fileToFix.content = detFix.fixedContent;
        send({ type: 'progress', phase: 'fix', message: `Fixed: ${detFix.summary}` });
        continue;
      }

      break;
    }

    const totalCost = getTotalCost();

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
