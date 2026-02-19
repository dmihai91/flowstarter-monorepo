/**
 * Gretly Modification API
 *
 * Uses the Gretly multi-agent pipeline for complex modifications:
 * - CodeGeneratorAgent (Kimi K2): Generates/modifies code
 * - FixerAgent (Sonnet 4): Fixes any build errors
 *
 * Agent communication via FlowOps protocol.
 */

import type { ActionFunctionArgs } from '@remix-run/node';
import { getCodeGeneratorAgent } from '~/lib/flowstarter/agents/code-generator-agent';
import { getFixerAgent } from '~/lib/flowstarter/agents/fixer-agent';
import { getAgentRegistry } from '~/lib/flowops';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GretlyModify');

interface ImageData {
  base64: string;
  mediaType: string;
  filename?: string;
}

interface GretlyModifyRequest {
  projectId: string;
  instruction: string;
  currentFiles: Record<string, string>;
  template?: {
    slug: string;
    name: string;
  };
  businessInfo?: {
    name: string;
    description?: string;
  };
  images?: ImageData[];
  options?: {
    skipBuild?: boolean;
    maxFixAttempts?: number;
  };
}

interface SSEEvent {
  type: 'phase' | 'progress' | 'complete' | 'error';
  phase?: string;
  message?: string;
  timestamp?: number;
  result?: {
    success: boolean;
    files?: Record<string, string>;
    modifiedFiles?: string[];
    summary?: string;
  };
  error?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: GretlyModifyRequest;
  try {
    body = await request.json() as GretlyModifyRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.projectId) {
    return new Response(JSON.stringify({ error: 'projectId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.instruction) {
    return new Response(JSON.stringify({ error: 'instruction is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.currentFiles || Object.keys(body.currentFiles).length === 0) {
    return new Response(JSON.stringify({ error: 'currentFiles is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  logger.info('Starting modification for project ' + body.projectId);
  logger.info('Instruction: ' + body.instruction.slice(0, 100) + '...');
  logger.info('Files: ' + Object.keys(body.currentFiles).length);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: SSEEvent) => {
        try {
          controller.enqueue(encoder.encode('data: ' + JSON.stringify(event) + '\n\n'));
        } catch {
          // Controller might be closed
        }
      };

      try {
        // Register agents
        const registry = getAgentRegistry();
        if (!registry.has('code-generator')) {
          registry.register(getCodeGeneratorAgent());
        }
        if (!registry.has('fixer')) {
          registry.register(getFixerAgent());
        }

        const codeGenerator = registry.get('code-generator');
        if (!codeGenerator) {
          throw new Error('CodeGeneratorAgent not found');
        }

        // Phase 1: Generate modifications
        sendEvent({
          type: 'phase',
          phase: 'generating',
          message: 'Analyzing request and generating changes...',
          timestamp: Date.now(),
        });

        // Build context for the code generator
        const templateContext = body.template
          ? 'Template: ' + body.template.name + ' (' + body.template.slug + ')'
          : '';
        const businessContext = body.businessInfo
          ? 'Business: ' + body.businessInfo.name + (body.businessInfo.description ? ' - ' + body.businessInfo.description : '')
          : '';

        // Create modification plan for the generator
        const modificationPlan = {
          modifications: [
            {
              target: 'site',
              action: 'modify',
              instruction: body.instruction,
              context: [templateContext, businessContext].filter(Boolean).join('\n'),
            },
          ],
        };

        // Call the code generator agent
        const generateResult = await codeGenerator.invoke('generate', {
          plan: modificationPlan,
          existingFiles: body.currentFiles,
          images: body.images,
        });

        if (!generateResult.success || !generateResult.files) {
          throw new Error(generateResult.error || 'Code generation failed');
        }

        const generatedFiles = generateResult.files as Record<string, string>;
        const modifiedFiles = Object.keys(generatedFiles);

        logger.info('Generated ' + modifiedFiles.length + ' files');

        sendEvent({
          type: 'progress',
          message: 'Generated ' + modifiedFiles.length + ' file changes',
          timestamp: Date.now(),
        });

        // Merge with existing files
        const finalFiles = { ...body.currentFiles };
        for (const [path, content] of Object.entries(generatedFiles)) {
          finalFiles[path] = content;
        }

        // Phase 2: Complete
        sendEvent({
          type: 'phase',
          phase: 'complete',
          message: 'Modifications complete',
          timestamp: Date.now(),
        });

        sendEvent({
          type: 'complete',
          result: {
            success: true,
            files: finalFiles,
            modifiedFiles,
            summary: 'Modified ' + modifiedFiles.length + ' files based on: ' + body.instruction.slice(0, 50) + '...',
          },
        });

        controller.close();
      } catch (error) {
        logger.error('Modification error:', error);
        sendEvent({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
