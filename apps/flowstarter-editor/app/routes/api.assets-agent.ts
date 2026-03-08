import { json, type ActionFunctionArgs } from '@remix-run/node';
import { generateCompletion } from '~/lib/services/llm';

// fal.ai client - dynamically imported to avoid SSR issues
let falClient: any = null;

async function getFalClient() {
  if (!falClient && process.env.FAL_KEY) {
    try {
      const { fal } = await import('@fal-ai/client');
      fal.config({ credentials: process.env.FAL_KEY });
      falClient = fal;
    } catch (e) {
      console.warn('Failed to load @fal-ai/client:', e);
    }
  }
  return falClient;
}

/**
 * Assets Agent API
 * 
 * Analyzes business descriptions and generates appropriate images using fal.ai
 * 
 * POST /api/assets-agent
 * 
 * Actions:
 * - analyze: Analyze business and return suggested assets
 * - generate: Generate a single asset image
 * - generate-batch: Generate multiple assets
 */

interface AssetSuggestion {
  type: 'hero' | 'product' | 'team' | 'background' | 'logo' | 'custom';
  name: string;
  prompt: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

interface AnalyzeRequest {
  action: 'analyze';
  businessDescription: string;
  businessName: string;
  industry?: string;
  targetAudience?: string;
}

interface GenerateRequest {
  action: 'generate';
  prompt: string;
  type: 'hero' | 'product' | 'team' | 'background' | 'logo' | 'custom';
  width?: number;
  height?: number;
  model?: string;
}

interface GenerateBatchRequest {
  action: 'generate-batch';
  assets: Array<{
    type: 'hero' | 'product' | 'team' | 'background' | 'logo' | 'custom';
    name: string;
    prompt: string;
  }>;
  projectId?: string;
}

type RequestBody = AnalyzeRequest | GenerateRequest | GenerateBatchRequest;

// Default image dimensions by type
const DEFAULT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  hero: { width: 1920, height: 1080 },
  product: { width: 800, height: 800 },
  team: { width: 800, height: 1000 },
  background: { width: 1920, height: 1080 },
  logo: { width: 512, height: 512 },
  custom: { width: 1024, height: 1024 },
};

// Analyze business and suggest assets
async function analyzeBusinessAssets(
  businessDescription: string,
  businessName: string,
  industry?: string,
  targetAudience?: string
): Promise<AssetSuggestion[]> {
  const systemPrompt = `You are an expert at analyzing businesses and suggesting appropriate imagery for their websites.
Given a business description, suggest relevant images that would make their website look professional and appealing.

For each image suggestion, provide:
- type: hero | product | team | background | logo | custom
- name: A descriptive name for the image
- prompt: A detailed prompt for AI image generation (be specific about style, mood, colors, composition)
- priority: high | medium | low
- description: Why this image would benefit the site

Focus on images that:
1. Match the business's industry and tone
2. Appeal to their target audience
3. Look professional and modern
4. Work well on websites (good composition, not too busy)

Return JSON array only, no other text.`;

  const userPrompt = `Business: ${businessName}
Description: ${businessDescription}
${industry ? `Industry: ${industry}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Suggest 3-5 images for this business's website. Include at least:
1. A hero/banner image
2. 1-2 images related to their products/services
3. Optional: team/about image if relevant`;

  const response = await generateCompletion(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
  );

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (e) {
    console.error('Failed to parse asset suggestions:', e);
    return [];
  }
}

// Generate a single image using fal.ai
async function generateImage(
  prompt: string,
  type: string,
  width?: number,
  height?: number,
  model?: string
): Promise<{ url: string; seed?: number }> {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY environment variable is not set');
  }

  const dimensions = DEFAULT_DIMENSIONS[type] || DEFAULT_DIMENSIONS.custom;
  const finalWidth = width || dimensions.width;
  const finalHeight = height || dimensions.height;

  // Use FLUX for high-quality images
  const modelId = model || 'fal-ai/flux/schnell';

  // Enhance prompt for better results
  const enhancedPrompt = `${prompt}, professional photography, high quality, 4k, sharp focus, well-lit`;

  try {
    const fal = await getFalClient();
    if (!fal) {
      throw new Error('fal.ai client not available');
    }

    const result = await fal.subscribe(modelId, {
      input: {
        prompt: enhancedPrompt,
        image_size: {
          width: finalWidth,
          height: finalHeight,
        },
        num_images: 1,
        enable_safety_checker: true,
      },
    });

    const data = result.data as { images?: Array<{ url: string }>; seed?: number };
    
    if (!data.images?.[0]?.url) {
      throw new Error('No image returned from fal.ai');
    }

    return {
      url: data.images[0].url,
      seed: data.seed,
    };
  } catch (error) {
    console.error('fal.ai generation error:', error);
    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json()) as RequestBody;

    switch (body.action) {
      case 'analyze': {
        const suggestions = await analyzeBusinessAssets(
          body.businessDescription,
          body.businessName,
          body.industry,
          body.targetAudience
        );
        return json({ success: true, suggestions });
      }

      case 'generate': {
        if (!process.env.FAL_KEY) {
          return json({
            success: false,
            error: 'Image generation requires FAL_KEY to be configured',
          }, { status: 400 });
        }

        const result = await generateImage(
          body.prompt,
          body.type,
          body.width,
          body.height,
          body.model
        );
        return json({ success: true, ...result });
      }

      case 'generate-batch': {
        if (!process.env.FAL_KEY) {
          return json({
            success: false,
            error: 'Image generation requires FAL_KEY to be configured',
          }, { status: 400 });
        }

        const results = await Promise.all(
          body.assets.map(async (asset) => {
            try {
              const result = await generateImage(asset.prompt, asset.type);
              return {
                name: asset.name,
                type: asset.type,
                success: true,
                url: result.url,
                seed: result.seed,
              };
            } catch (error) {
              return {
                name: asset.name,
                type: asset.type,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          })
        );

        const successCount = results.filter(r => r.success).length;
        return json({
          success: successCount > 0,
          total: body.assets.length,
          generated: successCount,
          results,
        });
      }

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Assets agent error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

