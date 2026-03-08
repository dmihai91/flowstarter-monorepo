/**
 * Claude Agent Service - LLM Helpers
 *
 * Prompt generation and LLM interaction utilities.
 * 
 * PREMIUM QUALITY: Explicit instructions to avoid AI slop!
 */

import { generateCompletion, generateJSON } from '../llm';
import type { SiteGenerationInput } from './types';
import { stripMarkdownCodeBlocks } from './sanitization';

/**
 * Get the system prompt for site generation
 */
export function getSystemPrompt(input: SiteGenerationInput): string {
  return `You are a skilled web developer creating a professional website. You will generate all necessary files for an Astro-based website.

## Project Details
- **Site Name**: ${input.siteName}
- **Business Name**: ${input.businessInfo.name}
- **Tagline**: ${input.businessInfo.tagline || 'Not specified'}
- **Description**: ${input.businessInfo.description || 'Not specified'}
- **Services**: ${input.businessInfo.services?.join(', ') || 'Not specified'}
- **Contact Email**: ${input.businessInfo.contact?.email || 'Not specified'}
- **Contact Phone**: ${input.businessInfo.contact?.phone || 'Not specified'}
- **Contact Address**: ${input.businessInfo.contact?.address || 'Not specified'}

## Template Foundation
Using the "${input.template.name}" template (${input.template.slug})

This template is your STARTING POINT, not a constraint. The template provides a solid foundation <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" use it as the base structure, but elevate it to create something EXCEPTIONAL.

Your goal: Transform this template into a site that makes the user say "WOW, this looks amazing!"

- Keep the template's overall structure and layout patterns <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" they're designed to work
- Enhance with the user's brand colors, fonts, and business personality
- Add polish: refined typography, subtle animations, thoughtful spacing
- Make every section feel intentionally designed, not just filled in
- The final result should feel like a custom-built site, not a template with swapped text

## CRITICAL: Design Specifications (USE EXACTLY THESE)
The user has chosen specific colors and fonts. You MUST use them <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" do not override, ignore, or substitute with defaults.

- **Primary Color**: ${input.design.primaryColor} <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" Use this as the main brand color for CTAs, links, active states, and key UI elements.
- **Secondary Color**: ${input.design.secondaryColor || 'derived from primary'} <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" Use for supporting elements, section backgrounds, secondary buttons.
- **Accent Color**: ${input.design.accentColor || 'derived from primary'} <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" Use sparingly for highlights, badges, special callouts.
- **Body Font**: ${input.design.fontFamily || 'system-ui, sans-serif'} <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" ALL body text must use this font.
- **Heading Font**: ${input.design.headingFont || input.design.fontFamily || 'system-ui, sans-serif'} <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" ALL headings (h1-h6) must use this font.

These colors are set as CSS variables (--color-primary, --color-secondary, --color-accent) in global.css.
Reference them in Tailwind classes using the custom theme tokens: bg-primary, text-primary, border-primary, etc.
For shades/tints, use opacity variants (bg-primary/80, text-primary/60) or derive from the hex values.
DO NOT replace the user's chosen colors with random Tailwind palette colors (blue-600, indigo-500, etc.).
DO NOT replace the user's chosen fonts with Inter, Arial, or system defaults.

## CRITICAL: Content Personalization
The template contains placeholder/example content. You MUST:
1. Identify ALL placeholder business names, taglines, and generic content
2. Replace them with the ACTUAL business details provided above
3. The final site should feel custom-made for "${input.businessInfo.name}", not like a template

## CRITICAL: Premium Design Quality (Avoid AI Slop)

### Color Discipline
- Do NOT default to purple/violet gradients <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" this is the #1 sign of AI-generated design. Only use purple if the brand specifically calls for it.
- Do NOT use rainbow gradients or mix 3+ unrelated colors. Gradients should be subtle: same-hue shifts or analogous colors only.
- Stick to the provided brand colors. 1 primary, 1-2 neutrals, 1 accent. Don't spray random colors.
- EVERY text element must have sufficient contrast against its background. Light text on light backgrounds is NEVER acceptable.

### Proportion & Visual Hierarchy
- The hero section should be dramatic: full-viewport height, striking typography, clear CTA. Not a small heading with a paragraph.
- Section heights should VARY <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" not every section the same height. Hero = tall. Testimonials = compact. Features = spacious. Variation creates rhythm.
- Typography scale must be intentional: headlines text-4xl to text-7xl, subheadings text-xl to text-2xl, body text-base to text-lg.
- Use max-w-3xl or max-w-4xl for text-heavy content. Full-width only for backgrounds and hero sections.
- Spacing between sections: generous (py-16 to py-24). Spacing within sections: tighter and consistent.

### Typography
- Use distinctive Google Fonts appropriate for the business type. NEVER use Inter, Roboto, or Arial as the primary font.
- Pair a characterful display/heading font with a clean body font. Max 2 font families.
- Large headings: use tracking-tight and leading-tight to feel designed, not just big.
- Body text: use leading-relaxed for readability.

### Layout
- Responsive from 320px mobile to 1920px desktop. No horizontal scroll.
- Grid layouts must degrade to single column on mobile.
- Images: use object-cover with fixed aspect ratios. Missing images should not break layout.
- Alternate section backgrounds for visual rhythm <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" light, then tinted, then darker.

### Content Quality
- NO generic patterns: "Transform your...", "Welcome to...", "We are passionate about...", "Get Started", "Learn More"
- Write specific, industry-appropriate copy that sounds human-written for a real ${input.businessInfo.services?.[0] || 'business'}.
- CTAs must be business-specific: "Book a Class", "Start Free Trial", "Reserve a Table" <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" not generic.
- Testimonials should sound human <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" different lengths, different tones, specific details.
- NO fake contact info. No "(415) 555-1234". No "123 Main Street".

## CRITICAL: No Theme Toggle
DO NOT include a theme toggle / dark mode switcher in the generated site.
The editor application handles theme switching externally <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" any in-template toggle will conflict.

## CRITICAL: Logo
${input.businessInfo.logo ? `Use the provided logo image.` : `No logo image was uploaded. Use the business name "${input.businessInfo.name}" as a TEXT LOGO in the header/navbar. Do NOT render an empty circle placeholder or a broken image <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" just the business name styled as a logo.`}

## Integration Status
${(() => {
  const booking = input.integrations?.find((i: any) => i.id === 'booking');
  const hasBooking = !!(booking?.config?.provider && booking?.config?.url);
  return hasBooking
    ? `- **Booking**: CONFIGURED (${booking!.config!.provider}). Include a "Book Now" CTA in the hero linking to the #booking section. Show the booking section.`
    : `- **Booking**: NOT configured. Do NOT show "Book Now" or "Book a Consultation" CTAs. Use "Contact Us" or service-oriented CTAs instead. Hide or omit the booking section.`;
})()}
${(() => {
  const newsletter = input.integrations?.find((i: any) => i.id === 'newsletter');
  const hasNewsletter = !!(newsletter?.config?.provider && newsletter?.config?.url);
  return hasNewsletter
    ? `- **Newsletter**: CONFIGURED. Include a newsletter signup section.`
    : `- **Newsletter**: NOT configured. Omit or minimize the newsletter section.`;
})()}

## CRITICAL: Contact Information
Use the contact details from the Project Details section above (Contact Email, Contact Phone, Contact Address).
- If contact details are provided (not "Not specified"): use them EXACTLY as written - same format, same values. Display in footer and contact section.
- If marked "Not specified": do NOT invent fake contact info. Hide contact details section or show only a contact form.

Do NOT replace provided contact details with placeholders like "hello@yourbusiness.com" or "(555) 123-4567".

## Instructions
1. Create a complete, production-ready Astro website
2. Personalize ALL content for "${input.businessInfo.name}"
3. Use the provided colors consistently throughout the design
4. Include proper meta tags and SEO optimization
5. Make the site responsive and accessible
6. Use modern, clean design patterns

## File Structure
Create these essential files using the write_file tool:
- package.json (with astro and dependencies)
- astro.config.mjs
- src/pages/index.astro (main landing page)
- src/layouts/Layout.astro (base layout)
- src/styles/global.css (global styles with CSS variables)
- public/favicon.svg

Start by creating the package.json, then the config, then the main files.
Use the write_file tool for each file.`;
}

/**
 * Generate a site plan (file manifest) using Claude
 */
export async function generateSitePlan(
  input: SiteGenerationInput,
): Promise<{ files: string[]; architecture: string }> {
  const systemPrompt = getSystemPrompt(input);
  const userPrompt = `Create a detailed file plan for this website.
Return a JSON object with a "files" array and an "architecture" description.
The "architecture" should explain the component structure, data flow, and key design decisions.
The "files" array must include ALL necessary files (package.json, astro.config.mjs, pages, components, CSS).

Respond with JSON only:
{
  "architecture": "Detailed explanation of the site structure...",
  "files": [
    "package.json",
    "src/pages/index.astro",
    ...
  ]
}`;

  const response = await generateJSON<{ files: string[]; architecture: string }>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      model: 'llama-3.3-70b-versatile',
      maxTokens: 8000,
    },
  );

  return {
    files: response.files || [],
    architecture: response.architecture || 'Standard Astro architecture',
  };
}

/**
 * Generate file content using a fast LLM
 */
export async function generateFileContent(
  input: SiteGenerationInput,
  filePath: string,
  context: string,
): Promise<string> {
  const systemPrompt = `You are an expert web developer customizing a website template.

## File: ${filePath}
## Business: ${input.businessInfo.name}
## Industry: ${input.businessInfo.services?.[0] || 'professional services'}
## Design: Primary ${input.design.primaryColor}, Font ${input.design.fontFamily}

## YOUR TASK:
This file comes from a high-quality template. Your job is to ELEVATE it <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" not just fill in blanks, but transform it into something exceptional.

1. IDENTIFY any placeholder business names, taglines, or example content
2. REPLACE all placeholders with compelling, specific content for "${input.businessInfo.name}"
3. ENHANCE the design <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" refine typography, spacing, and visual details
4. Make every element feel intentionally crafted for this specific business
5. The user should look at this and think "WOW, this looks professional and polished"

The template is your foundation. Build something amazing on top of it.

## Business Details to Use:
- Name: ${input.businessInfo.name}
- Tagline: ${input.businessInfo.tagline || 'Not provided - create something fitting'}
- Description: ${input.businessInfo.description || 'Not provided - create something fitting'}
- Services: ${input.businessInfo.services?.join(', ') || 'Not provided'}

## Quality Standards:
- NO generic CTAs ("Get Started", "Learn More") <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" use industry-specific actions
- NO clich<ï¿½ï¿½<ï¿½ï¿½ phrases ("Transform your...", "We are passionate...")
- NO purple/violet gradients unless the brand specifically uses purple
- Write copy that sounds human, specific, and confident
- Make it feel like a real ${input.businessInfo.services?.[0] || 'business'} website
- Do NOT include a theme toggle or dark mode switcher (the editor handles this)
- Text must have sufficient contrast on every background
- Section heights should vary <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" create visual rhythm, not uniform blocks
- Use tracking-tight on large headings, leading-relaxed on body text
- Alternate section background colors for visual depth
${!input.businessInfo.logo ? `- No logo image provided <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" use "${input.businessInfo.name}" as a text logo in the header. No empty placeholder circles.` : ''}
- Use the contact details from Project Details exactly as provided. If "Not specified", hide contact details or show only a form.

${context}

## Technical Rules:
- Use the user's chosen colors via CSS variables (--color-primary, --color-secondary, --color-accent) or Tailwind tokens (bg-primary, text-primary, etc.)
- For neutrals and backgrounds, use standard Tailwind grays (gray, slate, zinc, stone, neutral)
- Do NOT invent custom color names (cream, warm, cool, dark, light)
- Do NOT override the user's chosen palette with random Tailwind colors <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" the primary/secondary/accent are already defined
- Do NOT use custom font utilities in @apply
- Ensure the user's chosen fonts are applied via var(--font-body) and var(--font-heading)

Return the COMPLETE updated file content. No explanations, no markdown blocks.

CRITICAL SYNTAX RULES FOR ASTRO FILES:
- Astro files have frontmatter (---) and template sections
- ALL braces { } must be balanced - count them carefully before returning
- ALL parentheses ( ) must be balanced
- Template expressions use {expression} NOT {{expression}}
- Every import statement must end with a semicolon`;

  // Use Claude Sonnet for Astro files (needs careful syntax), Kimi for simpler files
  const isAstroFile = filePath.endsWith('.astro');
  const model = 'anthropic/claude-sonnet-4-6'; // Sonnet-4-6 for all file types
  
  const content = await generateCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Customize ${filePath} for ${input.businessInfo.name}. Replace ALL placeholder content.` },
    ],
    {
      model,
      temperature: 0.2,
      maxTokens: isAstroFile ? 12000 : 8000,
    },
  );

  return stripMarkdownCodeBlocks(content);
}

/**
 * Generate modification plan for template customization
 */
export async function generateModificationPlan(
  input: SiteGenerationInput,
  context: string,
): Promise<Array<{ path: string; instructions: string }>> {
  const planPrompt = `I have a website template with placeholder content. I need to customize it for a real business.

## Template Files:
${context}

## Target Business:
- Name: ${input.businessInfo.name}
- Description: ${input.businessInfo.description || 'Not provided'}
- Tagline: ${input.businessInfo.tagline || 'Not provided'}
- Services: ${input.businessInfo.services?.join(', ') || 'Not provided'}
- Design: Primary ${input.design.primaryColor}, Secondary ${input.design.secondaryColor || 'derived'}, Accent ${input.design.accentColor || 'derived'}
- Fonts: Body "${input.design.fontFamily || 'system-ui'}", Headings "${input.design.headingFont || input.design.fontFamily || 'system-ui'}"
- IMPORTANT: Use EXACTLY these colors and fonts. They are set as CSS variables. Do not substitute with defaults.

## Your Task:
Create a modification plan that transforms this template into an OUTSTANDING site for "${input.businessInfo.name}".

The template is your foundation <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" a solid starting point. Your plan should:
1. Identify ALL files containing placeholder content (business names, taglines, generic text)
2. Specify exactly what placeholder content to replace with compelling, specific details
3. Note opportunities to ENHANCE the design (better typography, refined spacing, polish)
4. Ensure the final site feels premium and custom-built <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" not like a template with swapped text

Goal: The user should be WOWED by the result. It should look like a professional designer spent days on it.

## Quality Requirements:
- Replace ALL generic placeholder names with "${input.businessInfo.name}"
- Replace generic taglines with business-specific messaging
- Replace "Get Started" / "Learn More" with industry-appropriate CTAs (e.g., "Book a Class", "Start Free Trial")
- Make testimonials sound real, specific, and varied in length/tone
- Do NOT include a theme toggle or dark mode switcher in the site (the editor handles this externally)
- Do NOT introduce purple/violet color schemes unless the brand specifically uses purple
- Ensure text contrast is sufficient on every background color
- Vary section heights for visual rhythm <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" hero should be dramatic, other sections proportional
- Use distinctive Google Fonts, not Inter/Roboto/Arial
${!input.businessInfo.logo ? `- No logo image was uploaded <ï¿½ï¿½<ï¿½ï¿½<ï¿½ï¿½?" use "${input.businessInfo.name}" as a text logo. Do NOT show empty circle placeholders.` : ''}
- Use contact details from Project Details exactly as provided. If "Not specified", hide contact section or show form only.

Return JSON only:
{
  "modifications": [
    { 
      "path": "src/pages/index.astro", 
      "instructions": "Replace the placeholder business name with '${input.businessInfo.name}'. Replace the generic hero tagline with something specific to their ${input.businessInfo.services?.[0] || 'business'}. Update CTA buttons to be industry-appropriate."
    }
  ]
}`;

  const plan = await generateJSON<{ modifications: Array<{ path: string; instructions: string }> }>(
    [{ role: 'user', content: planPrompt }],
    {
      model: 'llama-3.3-70b-versatile',
      maxTokens: 4000,
    },
  );

  return plan.modifications || [];
}

/**
 * Deduplicate modifications - merge instructions for the same file
 */
export function deduplicateModifications(
  modifications: Array<{ path: string; instructions: string }>,
): Array<{ path: string; instructions: string }> {
  const modMap = new Map<string, string[]>();

  for (const mod of modifications) {
    const normalizedPath = mod.path;

    if (!modMap.has(normalizedPath)) {
      modMap.set(normalizedPath, []);
    }

    modMap.get(normalizedPath)!.push(mod.instructions);
  }

  return Array.from(modMap.entries()).map(([path, instructions]) => ({
    path,
    instructions:
      instructions.length > 1 ? instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n') : instructions[0],
  }));
}

// ï¿½"?ï¿½"?ï¿½"? TWO-PHASE GENERATION: Design ï¿½ï¿½' Implementation ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?

import type { DesignSpec } from './designPhase';
import { getImplementationInstructions } from './designPhase';

/**
 * Generate file content using Kimi K2.5, guided by Opus design spec
 * PHASE 2: Implementation - faithful execution of design decisions
 */
export async function generateFileContentWithDesign(
  input: SiteGenerationInput,
  filePath: string,
  context: string,
  designSpec: DesignSpec,
): Promise<string> {
  // Get implementation instructions from design spec
  const designInstructions = getImplementationInstructions(designSpec, filePath, input);

  const systemPrompt = `You are an expert Astro/Tailwind developer implementing a design specification.

## Your Role
A creative director (using Claude Opus) has already made all the design decisions.
Your job is to IMPLEMENT these decisions faithfully in clean, working Astro code.

DO NOT make your own design choices. Follow the design spec exactly.

## File: ${filePath}
## Business: ${input.businessInfo.name}

${designInstructions}

## Technical Requirements:
- Write valid Astro syntax with proper frontmatter (---)
- Use Tailwind CSS classes exactly as specified in the design
- Ensure all imports are correct
- Make it responsive (mobile-first)
- Keep the existing template structure but apply the design spec

## Output:
Return ONLY the complete file content. No explanations, no markdown code blocks.
Start directly with the file content (--- for Astro files, or the actual code).`;

  const userPrompt = `Implement this file according to the design specification:

${context}

Remember:
- Follow the design spec EXACTLY - use the specified headline, colors, layout
- Don't add your own creative flourishes - implement what's specified
- Output ONLY the file content, nothing else`;

    const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];

  // Use Claude Sonnet for Astro files (needs careful syntax), Kimi for simpler files
  const isAstroFile = filePath.endsWith('.astro');
  const model = 'anthropic/claude-sonnet-4-6'; // Sonnet-4-6 for all file types
  const result = await generateCompletion(messages, {
    model,
    temperature: 0.1,  // Low temperature for faithful implementation
    maxTokens: isAstroFile ? 12000 : 8000,
  });

  return stripMarkdownCodeBlocks(result);
}



