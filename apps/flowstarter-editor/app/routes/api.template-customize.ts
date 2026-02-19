/**
 * Template Customization API Route
 *
 * ARCHITECT PATTERN:
 * Phase 1: Opus 4 analyzes business and creates comprehensive Design Brief
 * Phase 2: Groq Kimi K2 executes sequentially, following the brief
 *
 * This ensures consistency across all files and eliminates repetition.
 */

import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText as aiStreamText, generateText } from 'ai';
import { getApiKeysFromCookie } from '~/lib/api/cookies';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.template-customize');

// ═══════════════════════════════════════════════════════════════════════════
// MODEL CONFIGURATION - Architect Pattern
// ═══════════════════════════════════════════════════════════════════════════

// Phase 1: Architect (strategic planning) - Opus 4.6 for best quality
const ARCHITECT_MODEL = 'anthropic/claude-opus-4.6';

// Phase 2: Builder (fast execution)
const BUILDER_MODEL = 'moonshotai/kimi-k2-instruct-0905';

// Fallback if primary fails
const FALLBACK_MODEL = 'deepseek/deepseek-chat';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface BusinessInfo {
  uvp: string;
  targetAudience: string;
  businessGoals: string[];
  brandTone: string;
  pricingOffers?: string;
}

interface CustomizationRequest {
  files: Record<string, string>;
  projectDescription: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  templateName?: string;
  businessInfo?: BusinessInfo;
}

interface DesignBrief {
  // Brand Voice
  brandPersonality: string;
  toneGuidelines: string;
  
  // Content Strategy
  heroHeadline: string;
  heroSubheadline: string;
  tagline: string;
  
  // Key Messages (use across pages)
  valuePropositions: string[];
  keyBenefits: string[];
  socialProof: string;
  
  // CTAs
  primaryCTA: string;
  secondaryCTA: string;
  
  // Section-specific copy
  aboutSection: {
    headline: string;
    paragraph: string;
  };
  servicesSection: {
    headline: string;
    items: { title: string; description: string }[];
  };
  contactSection: {
    headline: string;
    subheadline: string;
  };
  
  // Design Guidelines
  colorUsage: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Things to AVOID
  avoidList: string[];
}

interface StreamEvent {
  type: 'progress' | 'file' | 'file_content' | 'done' | 'error';
  data: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function sendSSE(controller: ReadableStreamDefaultController, event: StreamEvent) {
  const data = JSON.stringify(event);
  controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

function normalizeFilePaths(files: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    normalized[normalizePath(path)] = content;
  }
  return normalized;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: ARCHITECT - Create Design Brief with Opus 4
// ═══════════════════════════════════════════════════════════════════════════

async function createDesignBrief(
  openRouter: ReturnType<typeof createOpenRouter>,
  projectDescription: string,
  businessInfo: BusinessInfo | undefined,
  templateName: string | undefined,
  fileList: string[],
): Promise<DesignBrief> {
  const model = openRouter.chat(ARCHITECT_MODEL) as any;

  const systemPrompt = `You are a WORLD-CLASS BRAND STRATEGIST and COPYWRITER.

Your job is to create a comprehensive Design Brief that will guide the customization of a website template.

The brief must be:
- SPECIFIC to this exact business (no generic copy)
- COMPELLING and conversion-focused
- CONSISTENT in voice and messaging
- PROFESSIONAL yet approachable

You will output a JSON object with the exact structure specified.`;

  const userPrompt = `Create a Design Brief for this business:

PROJECT: ${templateName || 'Business Website'}
DESCRIPTION: ${projectDescription}

${businessInfo ? `
BUSINESS DETAILS:
- Unique Value Proposition: "${businessInfo.uvp}"
- Target Audience: "${businessInfo.targetAudience}"
- Goals: ${businessInfo.businessGoals.join(', ')}
- Brand Tone: "${businessInfo.brandTone}"
${businessInfo.pricingOffers ? `- Pricing/Offers: "${businessInfo.pricingOffers}"` : ''}
` : ''}

FILES TO CUSTOMIZE:
${fileList.slice(0, 20).join('\n')}

Create a comprehensive Design Brief as JSON with this EXACT structure:
{
  "brandPersonality": "2-3 sentence description of the brand's personality",
  "toneGuidelines": "specific guidance on writing tone",
  
  "heroHeadline": "compelling 5-10 word headline",
  "heroSubheadline": "supporting 10-20 word subheadline",
  "tagline": "memorable 3-7 word tagline",
  
  "valuePropositions": ["prop 1", "prop 2", "prop 3"],
  "keyBenefits": ["benefit 1", "benefit 2", "benefit 3", "benefit 4"],
  "socialProof": "social proof statement",
  
  "primaryCTA": "main call-to-action text",
  "secondaryCTA": "secondary call-to-action text",
  
  "aboutSection": {
    "headline": "about section headline",
    "paragraph": "2-3 sentence about paragraph"
  },
  "servicesSection": {
    "headline": "services headline",
    "items": [
      {"title": "Service 1", "description": "brief description"},
      {"title": "Service 2", "description": "brief description"},
      {"title": "Service 3", "description": "brief description"}
    ]
  },
  "contactSection": {
    "headline": "contact headline",
    "subheadline": "encouraging subheadline"
  },
  
  "colorUsage": {
    "primary": "when to use primary color",
    "secondary": "when to use secondary color",
    "accent": "when to use accent color"
  },
  
  "avoidList": ["thing to avoid 1", "thing to avoid 2", "thing to avoid 3"]
}

IMPORTANT:
- Make ALL copy specific to THIS business
- NO generic phrases like "Welcome to our website" or "We're passionate about..."
- NO buzzwords like "revolutionize", "leverage", "synergy"
- Keep everything concise and punchy
- The hero headline should be MEMORABLE and UNIQUE

Output ONLY the JSON object, no markdown.`;

  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 4000,
      temperature: 0.7,
    });

    // Parse the JSON response
    const jsonText = result.text.trim();
    const brief = JSON.parse(jsonText) as DesignBrief;
    
    logger.info('Design Brief created successfully');
    return brief;
  } catch (error) {
    logger.error('Failed to create Design Brief:', error);
    
    // Return a minimal fallback brief
    return {
      brandPersonality: `Professional and trustworthy ${templateName || 'business'}`,
      toneGuidelines: 'Clear, confident, and approachable',
      heroHeadline: businessInfo?.uvp?.slice(0, 50) || 'Your Success Starts Here',
      heroSubheadline: projectDescription.slice(0, 100),
      tagline: 'Excellence Delivered',
      valuePropositions: businessInfo?.businessGoals || ['Quality', 'Trust', 'Results'],
      keyBenefits: ['Professional service', 'Expert team', 'Proven results', 'Customer focus'],
      socialProof: 'Trusted by businesses worldwide',
      primaryCTA: 'Get Started',
      secondaryCTA: 'Learn More',
      aboutSection: {
        headline: 'About Us',
        paragraph: projectDescription.slice(0, 200),
      },
      servicesSection: {
        headline: 'What We Offer',
        items: [
          { title: 'Service One', description: 'Professional service delivery' },
          { title: 'Service Two', description: 'Expert consultation' },
          { title: 'Service Three', description: 'Ongoing support' },
        ],
      },
      contactSection: {
        headline: 'Get In Touch',
        subheadline: "We'd love to hear from you",
      },
      colorUsage: {
        primary: 'CTAs, headers, key elements',
        secondary: 'Backgrounds, cards, sections',
        accent: 'Highlights, hover states, icons',
      },
      avoidList: ['Generic greetings', 'Buzzwords', 'Walls of text'],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: BUILDER - Execute with Groq Kimi K2
// ═══════════════════════════════════════════════════════════════════════════

async function customizeFileWithBrief(
  openRouter: ReturnType<typeof createOpenRouter>,
  filePath: string,
  content: string,
  designBrief: DesignBrief,
  palette: CustomizationRequest['palette'],
  fonts: CustomizationRequest['fonts'],
): Promise<string> {
  // Skip very small or very large files
  if (content.length < 50 || content.length > 50000) {
    return content;
  }

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
${designBrief.avoidList.map(item => `❌ ${item}`).join('\n')}

═══ TECHNICAL RULES ═══
- PRESERVE all imports, exports, and component logic
- PRESERVE responsive classes (sm:, md:, lg:)
- PRESERVE animations and transitions
- Keep file syntactically valid
- Output ONLY the file content, no markdown code blocks`;

  const userPrompt = `Customize this file following the Design Brief above.

File: ${filePath}

\`\`\`
${content}
\`\`\`

Apply the Design Brief. Use the EXACT copy from the brief where applicable.
Replace placeholder text with brief content.
Output ONLY the customized file.`;

  try {
    const result = await aiStreamText({
      model,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      maxTokens: 16000,
      temperature: 0.2, // Low temperature for consistency
    });

    let modifiedContent = '';
    for await (const chunk of result.textStream) {
      modifiedContent += chunk;
    }

    // Clean up output
    modifiedContent = cleanCodeBlockWrapper(modifiedContent);

    // Validate output
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

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ACTION HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function action({ request, context }: ActionFunctionArgs) {
  const body = await request.json<CustomizationRequest>();
  const { files: rawFiles, projectDescription, palette, fonts, templateName, businessInfo } = body;

  const files = normalizeFilePaths(rawFiles);

  // Get API key
  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const openRouterKey =
    apiKeys?.OPEN_ROUTER_API_KEY ||
    apiKeys?.OPENROUTER_API_KEY ||
    (context.cloudflare?.env as any)?.OPEN_ROUTER_API_KEY ||
    (context.cloudflare?.env as any)?.OPENROUTER_API_KEY ||
    process.env.OPEN_ROUTER_API_KEY ||
    process.env.OPENROUTER_API_KEY;

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

        // ═══════════════════════════════════════════════════════════════
        // PHASE 1: ARCHITECT - Create Design Brief with Opus 4
        // ═══════════════════════════════════════════════════════════════
        
        sendSSE(controller, {
          type: 'progress',
          data: { 
            phase: 'planning', 
            message: '🎨 Creating design strategy with Opus 4...', 
            progress: 5 
          },
        });

        const designBrief = await createDesignBrief(
          openRouter,
          projectDescription,
          businessInfo,
          templateName,
          filesToModify,
        );

        sendSSE(controller, {
          type: 'progress',
          data: { 
            phase: 'planning', 
            message: `✅ Design Brief ready: "${designBrief.heroHeadline}"`, 
            progress: 15 
          },
        });

        logger.info('Design Brief:', JSON.stringify(designBrief, null, 2));

        // ═══════════════════════════════════════════════════════════════
        // PHASE 2: BUILDER - Execute sequentially with Groq Kimi K2
        // ═══════════════════════════════════════════════════════════════

        sendSSE(controller, {
          type: 'progress',
          data: { 
            phase: 'customizing', 
            message: `⚡ Customizing ${totalFiles} files with Groq...`, 
            progress: 20 
          },
        });

        const modifiedFiles: Record<string, string> = { ...files };
        let processedCount = 0;

        // Process files SEQUENTIALLY (Groq is fast enough)
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
              openRouter,
              filePath,
              originalContent,
              designBrief,
              palette,
              fonts,
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

        // Apply direct CSS/config customizations
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

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function identifyFilesToModify(files: Record<string, string>): string[] {
  const modifiableExtensions = ['.tsx', '.ts', '.jsx', '.js', '.astro', '.html', '.md'];
  const excludePatterns = [
    'node_modules', '.git', 'package-lock.json', 'pnpm-lock.yaml',
    '.d.ts', 'tsconfig', 'vite.config', 'postcss.config', 'eslint', 'prettier',
    'main.tsx', 'main.ts', 'main.jsx', 'main.js', 'routeTree.gen',
    '__root.tsx', '__root.ts', 'tailwind.config', 'package.json',
    'globals.css', 'global.css',
  ];

  return Object.keys(files).filter((path) => {
    const hasValidExtension = modifiableExtensions.some((ext) => path.endsWith(ext));
    if (!hasValidExtension) return false;
    const isExcluded = excludePatterns.some((p) => path.toLowerCase().includes(p.toLowerCase()));
    return !isExcluded;
  });
}

function cleanCodeBlockWrapper(content: string): string {
  let cleaned = content.trim();
  
  // Remove markdown code blocks
  const codeBlockPattern = /^```[\w]*\n?([\s\S]*?)```$/;
  const match = cleaned.match(codeBlockPattern);
  if (match) cleaned = match[1].trim();
  
  // Clean HTML artifacts
  cleaned = cleaned.replace(/<\/?span[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?div[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?pre[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?code[^>]*>/gi, '');
  cleaned = cleaned.replace(/[0-9a-fA-F]{6}">/g, '');
  cleaned = cleaned.replace(/style="[^"]*"/gi, '');
  
  // HTML entities
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  
  return cleaned.trim();
}

function applyDirectCustomizations(
  files: Record<string, string>,
  palette: CustomizationRequest['palette'],
  fonts: CustomizationRequest['fonts'],
): void {
  const cssVars = `
/* Custom Theme Variables */
:root {
  --color-primary: ${palette.primary};
  --color-secondary: ${palette.secondary};
  --color-accent: ${palette.accent};
  --color-background: ${palette.background};
  --color-text: ${palette.text};
  --font-heading: '${fonts.heading}', ui-sans-serif, system-ui, sans-serif;
  --font-body: '${fonts.body}', ui-sans-serif, system-ui, sans-serif;
}
`;

  for (const [path, content] of Object.entries(files)) {
    if (path.includes('global') && path.endsWith('.css')) {
      if (!content.includes('--color-primary')) {
        files[path] = cssVars + '\n' + content;
      }
    }

    if (path.includes('tailwind.config')) {
      files[path] = injectTailwindColors(content, palette, fonts);
    }

    if (path.includes('vite.config') && path.endsWith('.ts')) {
      files[path] = injectViteServerConfig(content);
    }

    if (path.endsWith('.html') && !content.includes('fonts.googleapis.com')) {
      const fontLink = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${fonts.heading.replace(/ /g, '+')}:wght@400;500;600;700&family=${fonts.body.replace(/ /g, '+')}:wght@400;500&display=swap" rel="stylesheet">`;
      files[path] = content.replace('</head>', `${fontLink}\n</head>`);
    }
  }
}

function injectViteServerConfig(content: string): string {
  if (content.includes('server:')) return content;
  
  const pluginsMatch = content.match(/plugins:\s*\[[\s\S]*?\],?/);
  if (pluginsMatch) {
    return content.replace(
      pluginsMatch[0],
      `${pluginsMatch[0]}
  server: { host: '0.0.0.0', port: 5173 },`,
    );
  }
  return content;
}

function injectTailwindColors(
  content: string,
  palette: CustomizationRequest['palette'],
  fonts: CustomizationRequest['fonts'],
): string {
  const colorConfig = `
    colors: {
      primary: '${palette.primary}',
      secondary: '${palette.secondary}',
      accent: '${palette.accent}',
      background: '${palette.background}',
      foreground: '${palette.text}',
    },
    fontFamily: {
      heading: ['${fonts.heading}', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      body: ['${fonts.body}', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    },`;

  if (content.includes('extend: {')) {
    return content.replace('extend: {', `extend: {${colorConfig}`);
  }
  if (content.includes('theme: {')) {
    return content.replace('theme: {', `theme: {\n    extend: {${colorConfig}\n    },`);
  }
  return content;
}
