import type { GenerateRequestDTO } from './code-generator-schemas';

export function buildGenerateFilePrompt(
  modification: { path: string; instructions: string },
  request: GenerateRequestDTO,
  existingFiles: Record<string, string>,
): string {
  const originalContent = existingFiles[modification.path] || '';
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];
  const availableImages = Object.keys(existingFiles)
    .filter(path => imageExtensions.some(ext => path.toLowerCase().endsWith(ext)))
    .map(path => path.startsWith('public/') ? '/' + path.slice(7) : '/' + path);
  const availableComponents = Object.keys(existingFiles)
    .filter(path => path.endsWith('.astro') || path.endsWith('.tsx') || path.endsWith('.jsx'))
    .map(path => path.replace(/^src\//, '~/'));

  return `Apply the following modification to the file.

## FILE: ${modification.path}
${originalContent ? `\n## ORIGINAL CONTENT:\n\`\`\`\n${originalContent}\n\`\`\`` : '(New file)'}

## MODIFICATION INSTRUCTIONS:
${modification.instructions}

## BUSINESS CONTEXT:
- Business: ${request.businessInfo.name}
- Description: ${request.businessInfo.description || 'N/A'}
- Services: ${request.businessInfo.services?.join(', ') || 'N/A'}
- Target Audience: ${request.businessInfo.targetAudience || 'N/A'}
- Brand Tone: ${request.contentGuidelines?.tone || request.businessInfo.brandTone || 'Professional'}

## DESIGN:
- Primary Color: ${request.design?.primaryColor || 'Use existing'}
- Font Family: ${request.design?.fontFamily || 'Use existing'}

## CONTENT GUIDELINES:
${request.contentGuidelines?.keyMessages ? `- Key Messages: ${request.contentGuidelines.keyMessages.join(', ')}` : ''}
${request.contentGuidelines?.ctaText ? `- CTA Text: ${request.contentGuidelines.ctaText}` : ''}

## AVAILABLE COMPONENTS/LAYOUTS (only import from these!):
${availableComponents.length > 0 ? availableComponents.map(p => '- ' + p).join('\n') : '(Use standard Astro components only)'}

## AVAILABLE IMAGES IN TEMPLATE:
${availableImages.length > 0 ? availableImages.map(p => '- ' + p).join('\n') : '(No images in template - use placeholder services like https://placehold.co/800x600)'}

## OUTPUT (JSON only):
{
  "success": true,
  "content": "The complete modified file content"
}

IMPORTANT:
1. Apply modifications exactly as instructed
2. Return the COMPLETE file content, not just changes
3. Maintain proper file structure (Astro frontmatter, imports, etc.)
4. Use business-specific content (not placeholder text)
5. ONLY use image paths from AVAILABLE IMAGES list - never invent paths like /images/hero.jpg
6. ONLY import components from AVAILABLE COMPONENTS list - never invent component paths
7. PRESERVE ORIGINAL IMPORT PATHS - if the original file uses '../layouts/Layout.astro', keep that exact path
8. DO NOT change relative imports (../) to aliased imports (~/) - Astro templates use relative paths
9. When modifying a page, keep all existing imports exactly as they are unless the modification explicitly changes them

## CSS Best Practices (CRITICAL - prevents layout issues)
10. NEVER use position: absolute/fixed for decorative text that overlaps main content
11. Set proper z-index: main content z-index: 10+, decorative backgrounds z-index: -1 or 0
12. Hero backgrounds: use object-fit: cover, NOT absolute positioning that covers content
13. Decorative text/watermarks: use opacity: 0.1-0.3 AND z-index: -1, pointer-events: none

## Link Integrity (CRITICAL - prevents broken links)
14. ONLY link to pages that exist: index.astro, about.astro, services.astro, contact.astro, booking.astro
15. NEVER create links to /schedule, /instructors, /classes unless in AVAILABLE COMPONENTS
16. For non-existent pages, use href="#" or remove the link
17. Navigation menus should only include pages that exist in the template

## Theme Handling (Light/Dark Mode)
18. ALWAYS use CSS variables or Tailwind dark: classes for colors that need theme support
19. Use bg-white dark:bg-gray-900, text-gray-900 dark:text-white patterns
20. Avoid hardcoded colors like #000000 or rgb(0,0,0) - use semantic Tailwind classes
21. Images/icons should work on both light and dark backgrounds (use proper contrast)
22. If template has a theme toggle, preserve it and ensure all new content respects it
23. Test mental model: would this text be readable on both white AND dark backgrounds?

## Design Quality Principles (Good Taste, Not Hardcoded)
24. Hero sections should have visually compelling backgrounds appropriate to the brand
25. Use clear content hierarchy: supporting text/badge → main headline → explanatory subtitle
26. Include primary AND secondary CTAs where appropriate - give users options
27. Add social proof when relevant: testimonials, customer logos, ratings, or trust indicators
28. Maintain strong visual hierarchy with proper text sizing
29. Buttons should feel clickable with proper sizing, spacing, and hover feedback
30. Use subtle micro-interactions and transitions to make the UI feel polished
31. For SaaS/products, show the product in action; for services, show results or team
32. Always ensure proper contrast ratios for accessibility

## TypeScript Strict Mode (CRITICAL - prevents build failures)
33. ALL .map() callbacks MUST have typed parameters - NEVER write {items.map((item) => ...)}
34. ALWAYS type callback params: {items.map((item: ItemType) => ...)}, {times.map((time: string, i: number) => ...)}
35. For slots/bookings: {slots.map((slot: { day: string; times: string[] }) => ...)}
36. For features/benefits: {features.map((feature: { title: string; description: string }) => ...)}
37. For services: {services.map((service: { name: string; price?: string }) => ...)}
38. For testimonials: {testimonials.map((t: { name: string; text: string; rating?: number }) => ...)}
39. For navigation: {navLinks.map((link: { href: string; label: string }) => ...)}
40. When in doubt about types, use explicit inline types or 'as any' as last resort
41. NEVER use implicit any - every .map(), .filter(), .reduce() must have typed params`;
}

export function buildRefineFilePrompt(
  path: string,
  originalContent: string,
  instruction: string,
  request: GenerateRequestDTO,
): string {
  return `Refine this file based on the feedback.

## FILE: ${path}

## CURRENT CONTENT:
\`\`\`
${originalContent}
\`\`\`

## REFINEMENT INSTRUCTION:
${instruction}

## BUSINESS CONTEXT:
- Business: ${request.businessInfo.name}
- Brand Tone: ${request.contentGuidelines?.tone || request.businessInfo.brandTone || 'Professional'}

## OUTPUT (JSON only):
{
  "success": true,
  "content": "The complete refined file content"
}

IMPORTANT:
1. Apply ONLY the refinement instruction
2. Don't make unrelated changes
3. Return the COMPLETE file content
4. ALWAYS type .map() callback parameters - {items.map((item: ItemType) => ...)}
5. NEVER use implicit any types - every callback must have typed params`;
}
