/**
 * Template Customization API Route
 *
 * ARCHITECT PATTERN:
 * Phase 1: Opus 4 analyzes business and creates comprehensive Design Brief
 * Phase 2: Groq Kimi K2 executes sequentially, following the brief
 */

import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText as aiStreamText } from 'ai';
import { getApiKeysFromCookie } from '~/lib/api/cookies';
import { createScopedLogger } from '~/utils/logger';
import type { CustomizationRequest, DesignBrief } from '~/lib/template-customize/types';
import { BUILDER_MODEL } from '~/lib/template-customize/types';
import { createDesignBrief } from '~/lib/template-customize/design-brief';
import {
  sendSSE,
  normalizeFilePaths,
  identifyFilesToModify,
  cleanCodeBlockWrapper,
  applyDirectCustomizations,
} from '~/lib/template-customize/utils';

const logger = createScopedLogger('api.template-customize');

async function customizeFileWithBrief(
  openRouter: ReturnType<typeof createOpenRouter>,
  filePath: string,
  content: string,
  designBrief: DesignBrief,
  palette: CustomizationRequest['palette'],
  fonts: CustomizationRequest['fonts'],
): Promise<string> {
  if (content.length < 50 || content.length > 50000) return content;

  const model = openRouter.chat(BUILDER_MODEL) as any;

  const systemPrompt = `You are a SENIOR FRONTEND DEVELOPER executing a Design Brief.

Your job is to customize this file following the Design Brief EXACTLY.

═══ DESIGN BRIEF ═══
Brand: ${designBrief.brandPersonality}
Tone: ${designBrief.toneGuidelines}

COPY TO USE:
- Hero Headline: "${designBrief.heroHeadline}"
- Hero Subheadline: "${designBrief.heroSubheadline}"
- Tagline: "${designBrief.tagline}"
- Primary CTA: "${designBrief.primaryCTA}"
- Secondary CTA: "${designBrief.secondaryCTA}"

VALUE PROPS: ${designBrief.valuePropositions.join(' | ')}
KEY BENEFITS: ${designBrief.keyBenefits.join(' | ')}
SOCIAL PROOF: "${designBrief.socialProof}"

SECTIONS:
- About: "${designBrief.aboutSection.headline}" - ${designBrief.aboutSection.paragraph}
- Services: "${designBrief.servicesSection.headline}"
- Contact: "${designBrief.contactSection.headline}" - ${designBrief.contactSection.subheadline}

═══ COLOR PALETTE ═══
Primary: ${palette.primary} → ${designBrief.colorUsage.primary}
Secondary: ${palette.secondary} → ${designBrief.colorUsage.secondary}
Accent: ${palette.accent} → ${designBrief.colorUsage.accent}

═══ THINGS TO AVOID ═══
${designBrief.avoidList.map((item) => `❌ ${item}`).join('\n')}

═══ TECHNICAL RULES ═══
- PRESERVE all imports, exports, and component logic
- PRESERVE responsive classes (sm:, md:, lg:)
- PRESERVE animations and transitions
- Keep file syntactically valid
- Output ONLY the file content, no markdown code blocks`;

  try {
    const result = await aiStreamText({
      model,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Customize this file following the Design Brief above.\n\nFile: ${filePath}\n\n\`\`\`\n${content}\n\`\`\`\n\nApply the Design Brief. Use the EXACT copy from the brief where applicable.\nReplace placeholder text with brief content.\nOutput ONLY the customized file.`,
      }],
      maxTokens: 16000,
      temperature: 0.2,
    });

    let modifiedContent = '';
    for await (const chunk of result.textStream) {
      modifiedContent += chunk;
    }

    modifiedContent = cleanCodeBlockWrapper(modifiedContent);
    if (modifiedContent.length < content.length * 0.3) {
      logger.warn(`Output too short for ${filePath}, keeping original`);
      return content;
    }
    return modifiedContent;
  } catch (error) {
    logger.error(`Builder error for ${filePath}:`, error);
    return content;
  }
}

function getOpenRouterKey(request: Request, context: ActionFunctionArgs['context']): string | undefined {
  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  return (
    apiKeys?.OPEN_ROUTER_API_KEY ||
    apiKeys?.OPENROUTER_API_KEY ||
    (context.cloudflare?.env as any)?.OPEN_ROUTER_API_KEY ||
    (context.cloudflare?.env as any)?.OPENROUTER_API_KEY ||
    process.env.OPEN_ROUTER_API_KEY ||
    process.env.OPENROUTER_API_KEY
  );
}

export async function action({ request, context }: ActionFunctionArgs) {
  const body = await request.json<CustomizationRequest>();
  const { files: rawFiles, projectDescription, palette, fonts, templateName, businessInfo } = body;
  const files = normalizeFilePaths(rawFiles);

  const openRouterKey = getOpenRouterKey(request, context);
  if (!openRouterKey) {
    logger.error('OpenRouter API key not found');
    return new Response(
      JSON.stringify({ error: 'OpenRouter API key required.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  logger.info('Starting Architect Pattern customization');

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openRouter = createOpenRouter({ apiKey: openRouterKey });
        const filesToModify = identifyFilesToModify(files);
        const totalFiles = filesToModify.length;

        // Phase 1: Architect — Design Brief
        sendSSE(controller, {
          type: 'progress',
          data: { phase: 'planning', message: '🎨 Creating design strategy with Opus 4...', progress: 5 },
        });

        const designBrief = await createDesignBrief(
          openRouter, projectDescription, businessInfo, templateName, filesToModify,
        );

        sendSSE(controller, {
          type: 'progress',
          data: { phase: 'planning', message: `✅ Design Brief ready: "${designBrief.heroHeadline}"`, progress: 15 },
        });

        logger.info('Design Brief:', JSON.stringify(designBrief, null, 2));

        // Phase 2: Builder — Sequential file customization
        sendSSE(controller, {
          type: 'progress',
          data: { phase: 'customizing', message: `⚡ Customizing ${totalFiles} files with Groq...`, progress: 20 },
        });

        const modifiedFiles: Record<string, string> = { ...files };
        let processedCount = 0;

        for (const filePath of filesToModify) {
          const originalContent = files[filePath];
          const fileName = filePath.split('/').pop();

          sendSSE(controller, {
            type: 'progress',
            data: {
              phase: 'customizing',
              message: `Customizing ${fileName}...`,
              progress: 20 + Math.round((processedCount / totalFiles) * 70),
              currentFile: fileName,
            },
          });

          try {
            const modifiedContent = await customizeFileWithBrief(
              openRouter, filePath, originalContent, designBrief, palette, fonts,
            );
            modifiedFiles[filePath] = modifiedContent;

            sendSSE(controller, {
              type: 'file_content',
              data: {
                path: filePath,
                content: modifiedContent,
                progress: 20 + Math.round(((processedCount + 1) / totalFiles) * 70),
              },
            });
          } catch (err) {
            logger.warn(`Failed to customize ${filePath}:`, err);
            modifiedFiles[filePath] = originalContent;
          }
          processedCount++;
        }

        applyDirectCustomizations(modifiedFiles, palette, fonts);

        sendSSE(controller, {
          type: 'progress',
          data: { phase: 'finalizing', message: 'Finalizing...', progress: 95 },
        });
        sendSSE(controller, {
          type: 'done',
          data: { files: modifiedFiles, fileCount: Object.keys(modifiedFiles).length },
        });
        controller.close();
      } catch (error) {
        logger.error('Customization error:', error);
        sendSSE(controller, {
          type: 'error',
          data: { message: error instanceof Error ? error.message : 'Customization failed' },
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
