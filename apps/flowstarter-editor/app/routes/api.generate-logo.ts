/**
 * Logo Generation API Route
 *
 * Uses Nano Banana Pro (Gemini 3 Pro Image) via OpenRouter for AI logo generation.
 */

import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';

const OPENROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Nano Banana Pro model ID for logo generation
const LOGO_MODEL = 'google/gemini-3-pro-image-preview';

interface LogoGenerationRequest {
  prompt: string;
  businessInfo?: {
    uvp?: string;
    brandTone?: string;
    industry?: string;
  };
}

interface LogoGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  if (!OPENROUTER_API_KEY) {
    return json<LogoGenerationResponse>(
      {
        success: false,
        error: 'OpenRouter API key not configured',
      },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as LogoGenerationRequest;
    const { prompt, businessInfo } = body;

    if (!prompt?.trim()) {
      return json<LogoGenerationResponse>(
        {
          success: false,
          error: 'Prompt is required',
        },
        { status: 400 },
      );
    }

    // Enhance the prompt with business context
    const enhancedPrompt = buildEnhancedPrompt(prompt, businessInfo);

    console.log('[Logo Generation] Generating logo with Nano Banana Pro:', {
      originalPrompt: prompt,
      enhancedPrompt,
      businessInfo,
    });

    // Call OpenRouter API with Nano Banana Pro
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://flowstarter.ai',
        'X-Title': 'Flowstarter Editor - Logo Generation',
      },
      body: JSON.stringify({
        model: LOGO_MODEL,
        messages: [
          {
            role: 'user',
            content: enhancedPrompt,
          },
        ],
        modalities: ['image', 'text'], // Enable image output
        /*
         * Optional: Configure image generation parameters
         * image_config: {
         *   aspect_ratio: '1:1', // Square logo
         *   image_size: 1024,    // 1024x1024 pixels
         * },
         */
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Logo Generation] OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      return json<LogoGenerationResponse>(
        {
          success: false,
          error: `Image generation failed: ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          images?: string[];
        };
      }>;
    };

    /*
     * Extract image from response
     * Nano Banana Pro returns images in the assistant message
     */
    const assistantMessage = data.choices?.[0]?.message;
    const images = assistantMessage?.images;

    if (!images || images.length === 0) {
      console.error('[Logo Generation] No images in response:', data);
      return json<LogoGenerationResponse>(
        {
          success: false,
          error: 'No image generated',
        },
        { status: 500 },
      );
    }

    // Images are returned as base64-encoded data URLs
    const imageUrl = images[0]; // data:image/png;base64,...

    console.log('[Logo Generation] Success! Generated logo.');

    return json<LogoGenerationResponse>({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error('[Logo Generation] Error:', error);
    return json<LogoGenerationResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * Build enhanced prompt with business context for better logo generation
 */
function buildEnhancedPrompt(userPrompt: string, businessInfo?: LogoGenerationRequest['businessInfo']): string {
  let prompt = `Create a professional, minimalist logo design. ${userPrompt}.`;

  // Add business context if available
  if (businessInfo) {
    if (businessInfo.uvp) {
      prompt += ` The business offers: ${businessInfo.uvp}.`;
    }

    if (businessInfo.brandTone) {
      prompt += ` Brand tone: ${businessInfo.brandTone}.`;
    }

    if (businessInfo.industry) {
      prompt += ` Industry: ${businessInfo.industry}.`;
    }
  }

  // Add logo-specific instructions
  prompt +=
    ' The logo should be clean, scalable, and work well on both light and dark backgrounds. Avoid text unless specifically requested. Focus on iconic, memorable visual elements.';

  return prompt;
}

