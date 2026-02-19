/**
 * Fal.ai Image Generation Service
 * 
 * Uses Nano Banana Pro (Gemini 3 Pro Image) for high-quality image generation
 */

interface FalImageRequest {
  prompt: string;
  num_images?: number;
  aspect_ratio?: '21:9' | '16:9' | '3:2' | '4:3' | '5:4' | '1:1' | '4:5' | '3:4' | '2:3' | '9:16';
  resolution?: '1K' | '2K' | '4K';
  output_format?: 'jpeg' | 'png' | 'webp';
  seed?: number;
}

interface FalImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  seed: number;
  prompt: string;
}

const FAL_API_URL = 'https://fal.run/fal-ai/nano-banana-pro';

/**
 * Generate an image using Fal.ai Nano Banana Pro model
 */
export async function generateImage(
  prompt: string,
  options: {
    aspectRatio?: FalImageRequest['aspect_ratio'];
    resolution?: FalImageRequest['resolution'];
    count?: number;
  } = {}
): Promise<string[]> {
  const apiKey = process.env.FAL_KEY;
  
  if (!apiKey) {
    console.warn('[FalImageService] FAL_KEY not configured, skipping image generation');
    return [];
  }

  const request: FalImageRequest = {
    prompt,
    aspect_ratio: options.aspectRatio || '16:9',
    resolution: options.resolution || '1K',
    num_images: options.count || 1,
    output_format: 'webp',
  };

  try {
    console.log(`[FalImageService] Generating image: "${prompt.slice(0, 50)}..."`);
    
    const response = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[FalImageService] API error:', response.status, error);
      return [];
    }

    const data = await response.json() as FalImageResponse;
    const urls = data.images.map(img => img.url);
    
    console.log(`[FalImageService] Generated ${urls.length} image(s)`);
    return urls;
  } catch (error) {
    console.error('[FalImageService] Failed to generate image:', error);
    return [];
  }
}

/**
 * Generate all images needed for a website
 */
export async function generateWebsiteImages(
  businessInfo: {
    name: string;
    industry: string;
    description: string;
    tone: string;
  }
): Promise<{
  hero?: string;
  about?: string;
  services: string[];
}> {
  const results: {
    hero?: string;
    about?: string;
    services: string[];
  } = { services: [] };

  // Generate hero image - wide cinematic
  const heroPrompt = `Professional ${businessInfo.industry} business, ${businessInfo.tone} atmosphere, modern high-end commercial photography, dramatic lighting, premium brand aesthetic, no text or logos, photorealistic`;
  const heroImages = await generateImage(heroPrompt, { aspectRatio: '16:9', resolution: '2K' });
  if (heroImages.length > 0) {
    results.hero = heroImages[0];
  }

  // Generate about section image
  const aboutPrompt = `Professional team working in ${businessInfo.industry}, candid authentic moment, modern workspace, natural lighting, warm welcoming atmosphere, commercial photography style`;
  const aboutImages = await generateImage(aboutPrompt, { aspectRatio: '4:3', resolution: '1K' });
  if (aboutImages.length > 0) {
    results.about = aboutImages[0];
  }

  // Generate service images
  const servicePrompts = [
    `${businessInfo.industry} service being provided, client interaction, professional quality, premium feel`,
    `Detail shot of ${businessInfo.industry} equipment or tools, clean modern aesthetic, soft lighting`,
    `Happy satisfied customer after ${businessInfo.industry} service, authentic emotion, lifestyle photography`,
  ];
  
  for (const prompt of servicePrompts) {
    const images = await generateImage(prompt, { aspectRatio: '1:1', resolution: '1K' });
    if (images.length > 0) {
      results.services.push(images[0]);
    }
  }

  return results;
}

/**
 * Generate a single contextual image
 */
export async function generateContextualImage(
  type: 'hero' | 'about' | 'service' | 'testimonial' | 'feature',
  context: {
    industry: string;
    tone?: string;
    customPrompt?: string;
  }
): Promise<string | null> {
  const tone = context.tone || 'professional';
  
  const prompts: Record<string, string> = {
    hero: `Stunning ${context.industry} hero image, ${tone} mood, cinematic wide shot, premium commercial photography, dramatic lighting, no text`,
    about: `${context.industry} team or workspace, authentic candid moment, ${tone} atmosphere, natural lighting, editorial style`,
    service: `${context.industry} service in action, client focused, ${tone} quality, lifestyle photography`,
    testimonial: `Professional headshot, neutral background, friendly confident expression, studio lighting`,
    feature: `Abstract ${context.industry} concept, modern minimalist, brand imagery, artistic`,
  };

  const aspectRatios: Record<string, FalImageRequest['aspect_ratio']> = {
    hero: '16:9',
    about: '4:3',
    service: '1:1',
    testimonial: '1:1',
    feature: '4:3',
  };

  const prompt = context.customPrompt || prompts[type];
  const images = await generateImage(prompt, { 
    aspectRatio: aspectRatios[type],
    resolution: type === 'hero' ? '2K' : '1K'
  });
  
  return images.length > 0 ? images[0] : null;
}

/**
 * Check if Fal API is configured and has credits
 */
export async function checkFalStatus(): Promise<{ available: boolean; error?: string }> {
  const apiKey = process.env.FAL_KEY;
  
  if (!apiKey) {
    return { available: false, error: 'FAL_KEY not configured' };
  }

  try {
    // Try a minimal request to check status
    const response = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'test',
        num_images: 1,
        resolution: '1K',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      if (error.includes('balance') || error.includes('locked')) {
        return { available: false, error: 'Account needs credits - visit fal.ai/dashboard/billing' };
      }
      return { available: false, error };
    }

    return { available: true };
  } catch (error) {
    return { available: false, error: String(error) };
  }
}

