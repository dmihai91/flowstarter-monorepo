/**
 * Assets Generator Service
 * 
 * Generates AI images for sites using fal.ai during the build process.
 * Analyzes business description and creates appropriate hero, product, and brand images.
 */

import { generateCompletion } from '~/lib/services/llm';

// fal.ai client - dynamically imported
let falClient: any = null;

async function getFalClient() {
  if (!falClient && process.env.FAL_KEY) {
    try {
      const { fal } = await import('@fal-ai/client');
      fal.config({ credentials: process.env.FAL_KEY });
      falClient = fal;
    } catch (e) {
      console.warn('[AssetsGenerator] Failed to load @fal-ai/client:', e);
    }
  }
  return falClient;
}

export interface AssetSpec {
  type: 'hero' | 'product' | 'team' | 'background' | 'feature';
  name: string;
  prompt: string;
  width?: number;
  height?: number;
}

export interface GeneratedAsset {
  type: string;
  name: string;
  url: string;
  prompt: string;
}

export interface AssetsGeneratorInput {
  businessName: string;
  businessDescription: string;
  industry?: string;
  targetAudience?: string;
  brandTone?: string;
  templateId?: string;
}

// Default dimensions by asset type
const ASSET_DIMENSIONS: Record<string, { width: number; height: number }> = {
  hero: { width: 1920, height: 1080 },
  product: { width: 800, height: 800 },
  team: { width: 800, height: 1000 },
  background: { width: 1920, height: 1080 },
  feature: { width: 600, height: 400 },
};

/**
 * Analyze business and determine what assets are needed
 */
export async function analyzeAssetNeeds(input: AssetsGeneratorInput): Promise<AssetSpec[]> {
  const systemPrompt = `You are an expert at analyzing businesses and determining what images would make their website look professional.

Given a business description, suggest 2-4 images that would enhance their website.

IMPORTANT RULES:
1. Always include a hero image
2. Include 1-2 feature/product images relevant to their business
3. Keep prompts detailed but focused on professional, clean imagery
4. Prompts should describe the SCENE, not the business name

Return JSON array only:
[
  {
    "type": "hero" | "product" | "team" | "feature",
    "name": "descriptive-name",
    "prompt": "detailed image generation prompt"
  }
]`;

  const userPrompt = `Business: ${input.businessName}
Description: ${input.businessDescription}
${input.industry ? `Industry: ${input.industry}` : ''}
${input.targetAudience ? `Target Audience: ${input.targetAudience}` : ''}
${input.brandTone ? `Brand Tone: ${input.brandTone}` : ''}

Suggest 2-4 professional images for this website.`;

  try {
    // Use fast model with timeout for asset analysis (simple task)
    const timeoutPromise = new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error('Asset analysis timeout')), 30000)
    );
    
    const completionPromise = generateCompletion(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      { 
        model: 'meta-llama/llama-3.3-70b-versatile', // Fast model via Groq for simple analysis
        maxTokens: 1000,
        temperature: 0.3 
      }
    );
    
    const response = await Promise.race([completionPromise, timeoutPromise]);

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const specs = JSON.parse(jsonMatch[0]) as AssetSpec[];
      // Add dimensions
      return specs.map(spec => ({
        ...spec,
        width: ASSET_DIMENSIONS[spec.type]?.width || 1024,
        height: ASSET_DIMENSIONS[spec.type]?.height || 1024,
      }));
    }
    return [];
  } catch (e) {
    console.error('[AssetsGenerator] Failed to analyze asset needs:', e);
    return getDefaultAssets(input);
  }
}

/**
 * Fallback default assets if analysis fails
 */
function getDefaultAssets(input: AssetsGeneratorInput): AssetSpec[] {
  const businessKeyword = input.industry || input.businessName.split(' ')[0].toLowerCase();
  
  return [
    {
      type: 'hero',
      name: 'hero-banner',
      prompt: `Professional ${businessKeyword} business hero image, modern office or workspace, clean and bright, high quality photography, 4k`,
      width: 1920,
      height: 1080,
    },
    {
      type: 'feature',
      name: 'feature-service',
      prompt: `${businessKeyword} professional service illustration, clean modern design, subtle gradient background, corporate style`,
      width: 600,
      height: 400,
    },
  ];
}

/**
 * Generate a single image using fal.ai with timeout
 */
async function generateImage(spec: AssetSpec): Promise<GeneratedAsset | null> {
  const fal = await getFalClient();
  
  if (!fal) {
    console.warn('[AssetsGenerator] fal.ai client not available, skipping image generation');
    return null;
  }

  try {
    // Enhance prompt for better results
    const enhancedPrompt = `${spec.prompt}, professional photography, high quality, sharp focus, well-composed, stock photo style`;

    // Add 60s timeout per image
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('[AssetsGenerator] Image generation timeout for:', spec.name);
        resolve(null);
      }, 60000);
    });

    const generatePromise = (async () => {
      const result = await fal.subscribe('fal-ai/flux/schnell', {
        input: {
          prompt: enhancedPrompt,
          image_size: {
            width: spec.width || 1024,
            height: spec.height || 1024,
          },
          num_images: 1,
          enable_safety_checker: true,
        },
      });

      const data = result.data as { images?: Array<{ url: string }> };
      
      if (!data.images?.[0]?.url) {
        console.warn('[AssetsGenerator] No image returned for:', spec.name);
        return null;
      }

      return {
        type: spec.type,
        name: spec.name,
        url: data.images[0].url,
        prompt: spec.prompt,
      };
    })();

    return await Promise.race([generatePromise, timeoutPromise]);
  } catch (error) {
    console.error('[AssetsGenerator] Failed to generate image:', spec.name, error);
    return null;
  }
}

/**
 * Generate all assets for a site
 * Returns array of generated assets with URLs
 */
export async function generateSiteAssets(
  input: AssetsGeneratorInput,
  onProgress?: (message: string) => void
): Promise<GeneratedAsset[]> {
  // Check if fal.ai is available
  const fal = await getFalClient();
  if (!fal) {
    onProgress?.('⚠️ Image generation not available (FAL_KEY not configured)');
    return [];
  }

  onProgress?.('🎨 Analyzing what images your site needs...');
  
  // Analyze what assets are needed
  const specs = await analyzeAssetNeeds(input);
  
  if (specs.length === 0) {
    onProgress?.('Using template default images');
    return [];
  }

  onProgress?.(`🖼️ Generating ${specs.length} custom images for your site...`);
  
  // Generate all images in parallel (with limit)
  const results = await Promise.all(
    specs.slice(0, 4).map(async (spec, index) => {
      onProgress?.(`Generating image ${index + 1}/${specs.length}: ${spec.name}`);
      return generateImage(spec);
    })
  );

  const generated = results.filter((r): r is GeneratedAsset => r !== null);
  
  onProgress?.(`✅ Generated ${generated.length} custom images`);
  
  return generated;
}

/**
 * Convert generated assets to a format usable by templates
 */
export function assetsToTemplateVars(assets: GeneratedAsset[]): Record<string, string> {
  const vars: Record<string, string> = {};
  
  for (const asset of assets) {
    // Create various key formats for flexibility
    vars[`${asset.type}Image`] = asset.url;
    vars[`${asset.type}_image_url`] = asset.url;
    vars[asset.name.replace(/-/g, '_')] = asset.url;
  }
  
  return vars;
}

