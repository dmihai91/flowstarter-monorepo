/**
 * Design Phase - Opus generates creative design decisions
 * 
 * This phase focuses purely on DESIGN, not code.
 * Opus makes creative decisions about layout, visual hierarchy, and styling.
 */

import { generateJSON } from '../llm';
import type { SiteGenerationInput } from './types';

export interface DesignSpec {
  // Overall design direction
  designDirection: {
    mood: string;           // e.g., "bold and confident", "warm and approachable"
    visualStyle: string;    // e.g., "geometric with sharp angles", "organic with soft curves"
    uniqueElement: string;  // One distinctive design element that makes this site stand out
  };

  // Hero section design
  hero: {
    layout: 'centered' | 'split' | 'asymmetric' | 'full-bleed';
    headline: string;           // Exact headline text
    subheadline: string;        // Exact subheadline
    ctaPrimary: string;         // Primary CTA text
    ctaSecondary?: string;      // Secondary CTA text
    visualTreatment: string;    // e.g., "gradient overlay on background", "floating shapes"
    heightStyle: string;        // e.g., "full viewport", "80vh with peek of next section"
  };

  // Section designs
  sections: Array<{
    id: string;
    purpose: string;
    layout: string;             // Specific layout description
    backgroundColor: string;    // Exact color or gradient
    contentStyle: string;       // How content is presented
    uniqueTwist: string;        // What makes this section visually interesting
  }>;

  // Typography decisions
  typography: {
    heroHeadlineSize: string;   // e.g., "text-6xl md:text-8xl"
    sectionHeadlineSize: string;
    bodySize: string;
    specialTreatments: string[];  // e.g., ["tracking-tight on headlines", "uppercase on labels"]
  };

  // Color usage
  colorUsage: {
    primaryUsage: string[];     // Where primary color is used
    accentUsage: string[];      // Where accent color is used
    backgroundVariations: string[];  // Section background color sequence
  };

  // Specific styling decisions
  styling: {
    borderRadius: string;       // e.g., "rounded-2xl for cards, rounded-full for buttons"
    shadows: string;            // e.g., "subtle shadows on cards, dramatic on hero CTA"
    spacing: string;            // e.g., "generous py-24 between sections"
    animations: string[];       // Specific animations to use
  };

  // Content decisions
  content: {
    testimonialStyle: string;   // How testimonials should look/feel
    pricingPresentation: string; // How pricing is presented
    ctaStrategy: string;        // Overall CTA approach
  };
}

/**
 * Generate design specification using Opus
 */
export async function generateDesignSpec(input: SiteGenerationInput): Promise<DesignSpec> {
  const prompt = `You are a world-class web designer creating a UNIQUE, MEMORABLE design for a website.

## Business Context
- **Name**: ${input.businessInfo.name}
- **Industry**: ${input.businessInfo.services?.join(', ') || 'Service business'}
- **Value Proposition**: ${input.businessInfo.description || 'Professional services'}
- **Target Audience**: ${input.businessInfo.tagline || 'Business clients'}
- **Brand Tone**: The client wants a professional, modern feel

## Design Constraints
- **Primary Color**: ${input.design.primaryColor}
- **Secondary Color**: ${input.design.secondaryColor || 'derived from primary'}
- **Accent Color**: ${input.design.accentColor || 'derived from primary'}
- **Heading Font**: ${input.design.headingFont || input.design.fontFamily}
- **Body Font**: ${input.design.fontFamily}

## Contact Information (use exactly as provided)
- Email: ${input.businessInfo.contact?.email || 'Not provided'}
- Phone: ${input.businessInfo.contact?.phone || 'Not provided'}
- Address: ${input.businessInfo.contact?.address || 'Not provided'}

## Your Task
Create a DISTINCTIVE design that:
1. Does NOT look like every other landing page
2. Has at least ONE unique visual element that makes it memorable
3. Uses the brand colors INTENTIONALLY, not randomly
4. Creates visual rhythm through varied section heights and backgrounds
5. Makes bold typography choices

AVOID:
- Generic hero layouts with centered text and two buttons
- The same padding on every section
- Purple gradients (unless brand calls for it)
- Safe, forgettable design choices
- Stats sections with made-up numbers like "500+ clients"

BE SPECIFIC:
- Don't say "modern layout" - describe exactly what makes it modern
- Don't say "eye-catching" - describe the specific visual treatment
- Give exact headline text that's specific to THIS business
- Describe exact color placements, not just "use primary color"

Return a JSON object with this structure:
{
  "designDirection": {
    "mood": "specific mood description",
    "visualStyle": "specific visual style",
    "uniqueElement": "the ONE thing that makes this site stand out"
  },
  "hero": {
    "layout": "centered|split|asymmetric|full-bleed",
    "headline": "exact headline text specific to this business",
    "subheadline": "exact subheadline",
    "ctaPrimary": "specific CTA text",
    "ctaSecondary": "optional secondary CTA or null",
    "visualTreatment": "specific visual treatment",
    "heightStyle": "specific height approach"
  },
  "sections": [
    {
      "id": "section-name",
      "purpose": "what this section achieves",
      "layout": "specific layout description",
      "backgroundColor": "exact color/gradient",
      "contentStyle": "how content is presented",
      "uniqueTwist": "what makes this section interesting"
    }
  ],
  "typography": {
    "heroHeadlineSize": "exact Tailwind classes",
    "sectionHeadlineSize": "exact classes",
    "bodySize": "exact classes",
    "specialTreatments": ["specific treatments"]
  },
  "colorUsage": {
    "primaryUsage": ["specific places"],
    "accentUsage": ["specific places"],
    "backgroundVariations": ["color sequence for sections"]
  },
  "styling": {
    "borderRadius": "specific approach",
    "shadows": "specific approach",
    "spacing": "specific approach",
    "animations": ["specific animations"]
  },
  "content": {
    "testimonialStyle": "approach to testimonials",
    "pricingPresentation": "approach to pricing if applicable",
    "ctaStrategy": "overall CTA approach"
  }
}`;

  const messages = [
    {
      role: 'system' as const,
      content: 'You are a world-class web designer. Output valid JSON only, no markdown code blocks.',
    },
    {
      role: 'user' as const,
      content: prompt,
    },
  ];

  const result = await generateJSON<DesignSpec>(messages, {
    model: 'anthropic/claude-opus-4-6',
    temperature: 0.8,  // Higher temperature for creativity
    maxTokens: 4000,
  });

  return result;
}

/**
 * Convert design spec to implementation instructions for a specific file
 */
export function getImplementationInstructions(
  designSpec: DesignSpec,
  filePath: string,
  input: SiteGenerationInput
): string {
  let instructions = `## Design Specification (from Creative Director)
Follow these design decisions EXACTLY. Do not deviate or make your own design choices.

### Overall Direction
- Mood: ${designSpec.designDirection.mood}
- Visual Style: ${designSpec.designDirection.visualStyle}
- Unique Element: ${designSpec.designDirection.uniqueElement}

### Typography
- Hero headline: ${designSpec.typography.heroHeadlineSize}
- Section headlines: ${designSpec.typography.sectionHeadlineSize}
- Body text: ${designSpec.typography.bodySize}
- Special treatments: ${designSpec.typography.specialTreatments.join(', ')}

### Styling
- Border radius: ${designSpec.styling.borderRadius}
- Shadows: ${designSpec.styling.shadows}
- Spacing: ${designSpec.styling.spacing}
- Animations: ${designSpec.styling.animations.join(', ')}

### Color Usage
- Primary (${input.design.primaryColor}): ${designSpec.colorUsage.primaryUsage.join(', ')}
- Accent: ${designSpec.colorUsage.accentUsage.join(', ')}
- Backgrounds: ${designSpec.colorUsage.backgroundVariations.join(' -> ')}

`;

  // Add file-specific instructions
  if (filePath.includes('index.astro') || filePath.includes('pages/')) {
    instructions += `### Hero Section
- Layout: ${designSpec.hero.layout}
- Headline: "${designSpec.hero.headline}"
- Subheadline: "${designSpec.hero.subheadline}"
- Primary CTA: "${designSpec.hero.ctaPrimary}"
${designSpec.hero.ctaSecondary ? `- Secondary CTA: "${designSpec.hero.ctaSecondary}"` : ''}
- Visual treatment: ${designSpec.hero.visualTreatment}
- Height: ${designSpec.hero.heightStyle}

### Sections
${designSpec.sections.map(s => `
#### ${s.id}
- Purpose: ${s.purpose}
- Layout: ${s.layout}
- Background: ${s.backgroundColor}
- Content style: ${s.contentStyle}
- Unique twist: ${s.uniqueTwist}
`).join('\n')}
`;
  }

  instructions += `
### Contact Information (use EXACTLY as provided)
- Email: ${input.businessInfo.contact?.email || 'Not provided - hide email'}
- Phone: ${input.businessInfo.contact?.phone || 'Not provided - hide phone'}
- Address: ${input.businessInfo.contact?.address || 'Not provided - hide address'}

IMPORTANT: Implement this design FAITHFULLY. The creative decisions have been made - your job is to translate them into clean, working Astro code.
`;

  return instructions;
}

