/**
 * Prompt Index - Category Detection & Selection
 * 
 * Detects the business category from a description and returns
 * the appropriate system prompt for name generation.
 */

import { THERAPIST_CATEGORY } from './therapist';
import { FITNESS_CATEGORY } from './fitness';
import { YOGA_CATEGORY } from './yoga';
import { COACHING_CATEGORY } from './coaching';
import { CREATIVE_CATEGORY } from './creative';
import { BEAUTY_CATEGORY } from './beauty';
import { FOOD_CATEGORY } from './food';
import { PROFESSIONAL_CATEGORY } from './professional';
import { REALESTATE_CATEGORY } from './realestate';
import { TECH_CATEGORY } from './tech';
import { GENERIC_CATEGORY } from './generic';
import { BASE_RULES, OUTPUT_FORMAT, OUTPUT_FORMAT_SINGLE, BANNED_WORDS } from './base';

// Re-export base utilities
export * from './base';

/**
 * User context for personalized name generation
 */
export interface UserContext {
  /** Owner's name (e.g., "Sarah Mitchell") */
  ownerName?: string;
  /** Initials to incorporate (e.g., "SM") */
  initials?: string;
  /** Preferred style/vibe (e.g., "warm", "modern", "playful", "professional") */
  preferredStyle?: string;
  /** Keywords to try to incorporate */
  keywords?: string[];
  /** What makes their business unique */
  uniqueApproach?: string;
  /** Target audience */
  targetAudience?: string;
  /** Location if relevant */
  location?: string;
  /** Any specific words to avoid */
  avoidWords?: string[];
}

/**
 * Build personalized context section for prompts
 */
export function buildPersonalizedContext(userContext?: UserContext): string {
  if (!userContext) return '';
  
  const parts: string[] = [];
  
  if (userContext.ownerName) {
    parts.push(`- Owner's name: "${userContext.ownerName}" (can incorporate into name)`);
  }
  
  if (userContext.initials) {
    parts.push(`- Initials to consider: "${userContext.initials}"`);
  }
  
  if (userContext.preferredStyle) {
    parts.push(`- Preferred style/vibe: ${userContext.preferredStyle}`);
  }
  
  if (userContext.keywords && userContext.keywords.length > 0) {
    parts.push(`- Keywords to incorporate if possible: ${userContext.keywords.join(', ')}`);
  }
  
  if (userContext.uniqueApproach) {
    parts.push(`- What makes them unique: "${userContext.uniqueApproach}"`);
  }
  
  if (userContext.targetAudience) {
    parts.push(`- Target audience: ${userContext.targetAudience}`);
  }
  
  if (userContext.location) {
    parts.push(`- Location: ${userContext.location}`);
  }
  
  if (userContext.avoidWords && userContext.avoidWords.length > 0) {
    parts.push(`- Words to AVOID: ${userContext.avoidWords.join(', ')}`);
  }
  
  if (parts.length === 0) return '';
  
  return `
═══════════════════════════════════════════════════════════════════════
PERSONALIZATION CONTEXT (IMPORTANT - use these to create a UNIQUE name):
═══════════════════════════════════════════════════════════════════════
${parts.join('\n')}

CRITICAL PERSONALIZATION RULES:
1. **If owner's name is provided**: At least ONE of the 3 names MUST incorporate it!
   - Use surname: "Mitchell Therapy", "The Mitchell Practice", "Mitchell & Associates"
   - Use first name: "Sarah's Space", "With Sarah", "The Sarah Mitchell Practice"
   - Use creatively: "Still Waters with Mitchell", "Clarity by Sarah"

2. **If keywords are provided**: At least ONE name should incorporate a keyword
   - Direct use: "Calm Space", "Clarity Practice" 
   - Metaphorical: keyword "calm" → "Still Waters", "Quiet Mind"

3. **If unique approach is provided**: Use it for inspiration
   - "mindfulness-based" → "Mindful Ground", "Present Practice"
   
4. **If preferred style is provided**: ALL names should match this vibe

5. **If initials are provided**: Consider "SM Wellness", "SMC Practice"

Generate names that feel PERSONAL and DISTINCTIVE - not generic!
═══════════════════════════════════════════════════════════════════════
`;
}

/**
 * Category definition structure
 */
export interface CategoryPrompt {
  id: string;
  keywords: string[];
  systemPrompt: string;
  fallbackNames: string[];
  refinementHints: Record<string, string>;
}

/**
 * All registered categories in priority order
 * More specific categories should come before generic ones
 */
const CATEGORIES: CategoryPrompt[] = [
  // Mind/body wellness (order matters - yoga before fitness)
  THERAPIST_CATEGORY,
  YOGA_CATEGORY,
  FITNESS_CATEGORY,
  
  // Service professionals
  COACHING_CATEGORY,
  BEAUTY_CATEGORY,
  
  // Creative
  CREATIVE_CATEGORY,
  
  // Food & hospitality
  FOOD_CATEGORY,
  
  // Professional services
  PROFESSIONAL_CATEGORY,
  REALESTATE_CATEGORY,
  
  // Tech
  TECH_CATEGORY,
  
  // Generic fallback (always last)
  GENERIC_CATEGORY,
];

/**
 * Detect the business category from a description
 * Returns the best matching category or generic fallback
 */
export function detectCategory(description: string): CategoryPrompt {
  if (!description || description.trim().length === 0) {
    return GENERIC_CATEGORY;
  }

  const lowerDesc = description.toLowerCase();
  
  // Find the first category that matches any keyword
  for (const category of CATEGORIES) {
    for (const keyword of category.keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  return GENERIC_CATEGORY;
}

/**
 * Get the system prompt for name generation based on description
 * Optionally includes personalized context from user
 */
export function getGenerationPrompt(description: string, userContext?: UserContext): string {
  const category = detectCategory(description);
  const personalizedSection = buildPersonalizedContext(userContext);
  
  if (!personalizedSection) {
    return category.systemPrompt;
  }
  
  // Insert personalization before the output format
  // Find where the base rules end and add personalization
  const prompt = category.systemPrompt;
  const rulesIndex = prompt.indexOf('RULES (apply to ALL names)');
  
  if (rulesIndex > 0) {
    // Insert personalization before the rules
    return prompt.slice(0, rulesIndex) + personalizedSection + '\n' + prompt.slice(rulesIndex);
  }
  
  // Fallback: append to end (before output format)
  return prompt + '\n' + personalizedSection;
}

/**
 * Get fallback names for a category
 */
export function getFallbackNames(description: string): string[] {
  const category = detectCategory(description);
  return category.fallbackNames;
}

/**
 * Get a random fallback name for a category
 */
export function getRandomFallbackName(description: string): string {
  const names = getFallbackNames(description);
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Get refinement hints for a category
 */
export function getRefinementHints(description: string): Record<string, string> {
  const category = detectCategory(description);
  return category.refinementHints;
}

/**
 * Build a refinement prompt for a specific category
 */
export function buildRefinementPrompt(
  previousName: string,
  refinementFeedback: string,
  projectDescription?: string,
  previouslySuggested?: string[],
  accumulatedRequirements?: string[]
): string {
  const category = detectCategory(projectDescription || '');
  const hints = category.refinementHints;
  
  // Find relevant hints based on feedback
  const lowerFeedback = refinementFeedback.toLowerCase();
  let hintSection = '';
  
  for (const [key, hint] of Object.entries(hints)) {
    if (lowerFeedback.includes(key)) {
      hintSection = `\nSTYLE GUIDANCE: ${hint}\n`;
      break;
    }
  }

  const allPrevious = previouslySuggested && previouslySuggested.length > 0 
    ? previouslySuggested.join('", "') 
    : previousName;
  
  const requirementsSection = accumulatedRequirements && accumulatedRequirements.length > 0
    ? `\nACCUMULATED USER REQUIREMENTS (must respect ALL of these):\n${accumulatedRequirements.map(r => `- ${r}`).join('\n')}\n`
    : '';

  return `You are a world-class brand naming expert helping refine a business name.

CONTEXT:
- Business type: ${category.id.toUpperCase()}
- Business description: "${projectDescription || 'Not specified'}"
- Previous suggestion: "${previousName}"
- User's feedback: "${refinementFeedback}"
- Already suggested (DO NOT repeat): "${allPrevious}"
${requirementsSection}${hintSection}
YOUR TASK: Generate ONE new name that addresses the user's feedback.

${BASE_RULES}

RULES:
- Must be DIFFERENT from: "${allPrevious}"
- 1-3 words, title case, no punctuation
- Must sound like a real business name a founder would proudly use

${OUTPUT_FORMAT_SINGLE}`;
}

/**
 * Build an extraction prompt for interpreting user input
 */
export function buildExtractionPrompt(
  previousSuggestion?: string,
  projectDescription?: string,
  previouslySuggested?: string[],
  accumulatedRequirements?: string[]
): string {
  const category = detectCategory(projectDescription || '');
  const hints = category.refinementHints;
  
  const contextParts: string[] = [];
  
  if (previousSuggestion) {
    contextParts.push(`- Last suggested name: "${previousSuggestion}"`);
  }
  if (projectDescription) {
    contextParts.push(`- Project description: "${projectDescription}"`);
    contextParts.push(`- Detected category: ${category.id.toUpperCase()}`);
  }
  if (previouslySuggested && previouslySuggested.length > 0) {
    contextParts.push(`- Names already suggested (DO NOT repeat): "${previouslySuggested.join('", "')}"`);
  }
  if (accumulatedRequirements && accumulatedRequirements.length > 0) {
    contextParts.push(`- User requirements to respect: ${accumulatedRequirements.join('; ')}`);
  }
  
  const contextSection = contextParts.length > 0 
    ? `CONTEXT:\n${contextParts.join('\n')}\n\n` 
    : '';

  // Build hint examples from category
  const hintExamples = Object.entries(hints)
    .map(([key, hint]) => `- "${key}" → ${hint}`)
    .join('\n');

  return `You are a world-class brand naming expert. Analyze the user's input and respond with JSON.

${contextSection}YOUR TASK:
1. Determine: Is user confirming, providing a name, or requesting refinement?
2. If refinement: Generate a GREAT name that fits the business context
3. Extract any requirements from their message

RESPONSE TYPES:

1. USER CONFIRMS → {"type":"name","name":"${previousSuggestion || 'My Project'}"}
   Triggers: "yes", "that works", "sounds good", "I like it", "perfect", "use it", "let's go with that"

2. USER PROVIDES A NAME → {"type":"name","name":"[TheirExactName]"}
   Triggers: "Call it X", "Name it X", a short capitalized phrase, quoted text
   Copy their name EXACTLY as provided.

3. USER WANTS REFINEMENT → Generate a new name
   Triggers: "make it", "more", "different", "try another", "suggest", "include"
   
   Response format:
   {
     "type": "question",
     "name": "[NewBusinessName]",
     "message": "How about **[Name]**? [One sentence explaining why it fits].",
     "extractedRequirements": ["requirement if any"]
   }

STYLE HINTS FOR THIS CATEGORY (${category.id.toUpperCase()}):
${hintExamples}

${BASE_RULES}

RULES:
- NEVER repeat names from "already suggested" list
- If user mentions initials → incorporate them
- Names: 1-3 words, title case, no punctuation
- If unsure between name vs request, assume NAME

Respond with ONLY valid JSON.`;
}

/**
 * Get all category IDs (for debugging/testing)
 */
export function getAllCategoryIds(): string[] {
  return CATEGORIES.map(c => c.id);
}

/**
 * Get a category by ID
 */
export function getCategoryById(id: string): CategoryPrompt | undefined {
  return CATEGORIES.find(c => c.id === id);
}
