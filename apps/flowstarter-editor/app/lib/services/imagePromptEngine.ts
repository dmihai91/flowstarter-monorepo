/**
 * Premium Image Prompt Engine
 * 
 * Generates high-quality, non-generic prompts that produce
 * professional, authentic-looking images - NOT AI slop.
 */

/**
 * Anti-slop keywords to AVOID in prompts (these create generic AI look)
 */
const AVOID_KEYWORDS = [
  'perfect', 'beautiful', 'amazing', 'stunning', 'incredible',
  'hyper-realistic', 'ultra-detailed', '8k', '4k uhd',
  'masterpiece', 'best quality', 'highly detailed',
  'professional photography', // too generic
  'stock photo', 'getty images',
  'smiling at camera', 'looking at viewer',
  'perfect lighting', 'perfect composition',
];

/**
 * Premium photography styles that look authentic
 */
const PHOTO_STYLES = {
  editorial: 'editorial photography, magazine quality, natural moment captured, authentic emotion',
  documentary: 'documentary style, candid shot, real moment, photojournalistic approach',
  lifestyle: 'lifestyle photography, relaxed natural pose, environmental portrait',
  commercial: 'high-end commercial photography, advertising quality, aspirational but believable',
  cinematic: 'cinematic still, film grain, anamorphic lens, movie scene quality',
};

/**
 * Lighting styles that look professional
 */
const LIGHTING_STYLES = {
  natural: 'natural window light, soft shadows, golden hour warmth',
  studio: 'softbox lighting, subtle rim light, professional studio setup',
  dramatic: 'chiaroscuro lighting, deep shadows, single key light',
  ambient: 'available light, environmental lighting, authentic atmosphere',
  moody: 'low key lighting, atmospheric, intentional shadows',
};

/**
 * Camera/lens descriptions for authentic look
 */
const CAMERA_STYLES = {
  portrait: 'shot on 85mm f/1.4, shallow depth of field, subject isolation',
  wide: 'shot on 24mm, environmental context, slight barrel distortion',
  medium: 'shot on 50mm f/1.8, natural perspective, classic framing',
  telephoto: 'shot on 135mm, compressed background, intimate feel',
  cinematic: 'anamorphic lens, 2.39:1 aspect feel, cinematic bokeh',
};

interface BusinessContext {
  name: string;
  industry: string;
  tone: string;
  targetAudience?: string;
  uniqueValue?: string;
}

/**
 * Generate a premium hero image prompt
 */
export function generateHeroPrompt(ctx: BusinessContext): string {
  const industryVisuals = getIndustryVisuals(ctx.industry);
  const toneStyle = getToneStyle(ctx.tone);
  
  return `${industryVisuals.heroScene}, ${toneStyle.mood}, ${PHOTO_STYLES.cinematic}, ${LIGHTING_STYLES.dramatic}, ${CAMERA_STYLES.wide}, captured mid-action, real environment not studio, no text no logos no watermarks, slightly imperfect authentic moment`;
}

/**
 * Generate about/team section prompt
 */
export function generateAboutPrompt(ctx: BusinessContext): string {
  const industryVisuals = getIndustryVisuals(ctx.industry);
  const toneStyle = getToneStyle(ctx.tone);
  
  return `${industryVisuals.teamScene}, ${toneStyle.mood}, ${PHOTO_STYLES.documentary}, ${LIGHTING_STYLES.natural}, ${CAMERA_STYLES.medium}, candid unposed moment, genuine interaction, real workspace not staged, environmental context visible`;
}

/**
 * Generate service/feature image prompt
 */
export function generateServicePrompt(ctx: BusinessContext, serviceType?: string): string {
  const industryVisuals = getIndustryVisuals(ctx.industry);
  const toneStyle = getToneStyle(ctx.tone);
  
  const scene = serviceType || industryVisuals.serviceScene;
  
  return `${scene}, ${toneStyle.mood}, ${PHOTO_STYLES.lifestyle}, ${LIGHTING_STYLES.ambient}, ${CAMERA_STYLES.portrait}, focus on hands or action detail, authentic client interaction, not looking at camera, real moment`;
}

/**
 * Generate testimonial/portrait prompt
 */
export function generatePortraitPrompt(ctx: BusinessContext): string {
  const toneStyle = getToneStyle(ctx.tone);
  
  return `professional environmental portrait, ${toneStyle.mood}, ${PHOTO_STYLES.editorial}, ${LIGHTING_STYLES.natural}, ${CAMERA_STYLES.portrait}, subject in their natural environment, relaxed confident expression, not smiling directly at camera, authentic personality`;
}

/**
 * Get industry-specific visual descriptions
 */
function getIndustryVisuals(industry: string): {
  heroScene: string;
  teamScene: string;
  serviceScene: string;
} {
  const industryLower = industry.toLowerCase();
  
  if (industryLower.includes('fitness') || industryLower.includes('gym') || industryLower.includes('train')) {
    return {
      heroScene: 'athlete mid-workout in industrial gym space, sweat visible, raw determination, chalk dust in air, weight plates and barbells',
      teamScene: 'coach and client during training session, genuine encouragement moment, gym equipment in background',
      serviceScene: 'close-up of hands gripping barbell, chalk texture, focused intensity, gym atmosphere',
    };
  }
  
  if (industryLower.includes('yoga') || industryLower.includes('wellness') || industryLower.includes('meditation')) {
    return {
      heroScene: 'yoga practitioner in difficult pose, serene studio with plants, morning light streaming through windows',
      teamScene: 'instructor adjusting student pose, gentle guidance, peaceful studio environment',
      serviceScene: 'meditation moment, closed eyes, peaceful expression, soft natural light',
    };
  }
  
  if (industryLower.includes('restaurant') || industryLower.includes('food') || industryLower.includes('cafe')) {
    return {
      heroScene: 'chef plating dish in open kitchen, steam rising, intense focus, restaurant bustle behind',
      teamScene: 'kitchen team during service, coordinated movement, professional energy',
      serviceScene: 'beautifully plated dish, natural daylight, rustic table surface, appetizing composition',
    };
  }
  
  if (industryLower.includes('tech') || industryLower.includes('software') || industryLower.includes('startup')) {
    return {
      heroScene: 'developer deep in thought at minimal desk, multiple monitors with code, focused concentration',
      teamScene: 'small team whiteboarding together, collaborative energy, modern office space',
      serviceScene: 'hands typing on laptop keyboard, coffee nearby, productive atmosphere',
    };
  }
  
  if (industryLower.includes('salon') || industryLower.includes('beauty') || industryLower.includes('spa')) {
    return {
      heroScene: 'stylist working on client, artistic precision, salon mirrors and lighting',
      teamScene: 'beauty professionals in consultation, genuine client connection, elegant salon interior',
      serviceScene: 'close-up of skilled hands at work, tools of the trade, attention to detail',
    };
  }
  
  // Default professional services
  return {
    heroScene: 'professional at work in their element, modern office or workspace, focused on task',
    teamScene: 'small team in collaborative discussion, authentic workplace interaction',
    serviceScene: 'hands-on work detail shot, craftsmanship visible, professional environment',
  };
}

/**
 * Get tone-specific style modifiers
 */
function getToneStyle(tone: string): { mood: string } {
  const toneLower = tone.toLowerCase();
  
  if (toneLower.includes('luxury') || toneLower.includes('premium') || toneLower.includes('elegant')) {
    return { mood: 'sophisticated atmosphere, muted color palette, refined elegance, exclusive feel' };
  }
  
  if (toneLower.includes('energetic') || toneLower.includes('dynamic') || toneLower.includes('bold')) {
    return { mood: 'high energy atmosphere, dynamic composition, bold contrast, action and movement' };
  }
  
  if (toneLower.includes('warm') || toneLower.includes('friendly') || toneLower.includes('welcoming')) {
    return { mood: 'warm inviting atmosphere, soft golden tones, approachable and genuine feel' };
  }
  
  if (toneLower.includes('minimal') || toneLower.includes('clean') || toneLower.includes('modern')) {
    return { mood: 'minimal aesthetic, clean lines, negative space, contemporary sophistication' };
  }
  
  if (toneLower.includes('professional') || toneLower.includes('corporate')) {
    return { mood: 'polished professional atmosphere, confident competence, trustworthy presence' };
  }
  
  // Default motivational/professional
  return { mood: 'aspirational atmosphere, authentic professionalism, confident and capable' };
}

/**
 * Validate and clean a prompt to avoid AI slop
 */
export function cleanPrompt(prompt: string): string {
  let cleaned = prompt;
  
  // Remove slop keywords
  for (const keyword of AVOID_KEYWORDS) {
    const regex = new RegExp(keyword, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  
  // Clean up double spaces and commas
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Generate all website images with premium quality
 */
export function generateAllPrompts(ctx: BusinessContext): {
  hero: string;
  about: string;
  services: string[];
} {
  return {
    hero: cleanPrompt(generateHeroPrompt(ctx)),
    about: cleanPrompt(generateAboutPrompt(ctx)),
    services: [
      cleanPrompt(generateServicePrompt(ctx)),
      cleanPrompt(generateServicePrompt(ctx, `${ctx.industry} detail shot, tools and equipment`)),
      cleanPrompt(generateServicePrompt(ctx, `satisfied client moment, genuine reaction`)),
    ],
  };
}

