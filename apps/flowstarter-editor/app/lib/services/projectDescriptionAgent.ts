import { generateCompletion } from './llm';

/**
 * Project Description Extraction Agent
 *
 * Extracts a concise, essence-focused summary from user project descriptions.
 * Returns a natural, human-readable summary of what the user wants to build.
 * 
 * OPTIMIZED FOR: Service-based professionals (coaches, therapists, trainers, etc.)
 */

const SYSTEM_PROMPT = `You are an expert at understanding what SERVICE PROFESSIONALS want to build and extracting the core essence of their project.

FLOWSTARTER FOCUS: We help independent service providers — coaches, therapists, trainers, consultants, stylists, photographers, tutors — create professional websites to attract clients and grow their practice.

Your task is to read a user's project description and extract ONLY the essential service type and primary purpose.

GUIDELINES:
- Focus on WHAT type of SERVICE they provide (e.g., "life coaching", "massage therapy", "personal training")
- Include the PRIMARY niche if stated (e.g., "executive coaching", "sports nutrition", "wedding photography")
- Include HOW they work with clients if mentioned (e.g., "1-on-1 sessions", "group classes", "online programs")
- Keep it between 3-8 words maximum
- Use natural, conversational language
- DO NOT include:
  * Target audience demographics
  * Business goals or metrics
  * Personal background/story
  * Secondary features
  * Marketing language

EXAMPLES:

Input: "I'm a certified life coach helping women in their 40s navigate career transitions. I offer 1-on-1 coaching sessions and group workshops."
Output: a life coaching practice website

Input: "I run a yoga studio focused on vinyasa and restorative yoga. We offer classes, workshops, and teacher training programs."
Output: a yoga studio website

Input: "I'm a licensed therapist specializing in anxiety and depression. I see clients both in-person and via telehealth."
Output: a therapy practice website

Input: "Personal trainer here! I help busy professionals get fit with online coaching and custom workout plans."
Output: a personal training website

Input: "I'm a freelance photographer specializing in portraits and headshots for professionals and small businesses."
Output: a portrait photography portfolio

Input: "I offer massage therapy and holistic wellness services. Specializing in deep tissue and sports massage."
Output: a massage therapy website

Input: "I'm a private tutor helping high school students with math and science. Both in-person and online sessions."
Output: a tutoring services website

Input: "Hair stylist and colorist with my own salon suite. I specialize in balayage and corrective color."
Output: a hair styling portfolio

Input: "Business consultant helping startups with go-to-market strategy and fundraising preparation."
Output: a business consulting website

Input: "Nutritionist and wellness coach. I help clients develop sustainable healthy eating habits through personalized meal plans."
Output: a nutrition coaching website

Remember: Extract ONLY the core service type and how they help clients. Keep it SHORT and NATURAL.`;

export interface ProjectSummary {
  summary: string;
  success: boolean;
}

/**
 * Extract a concise project summary from a user's description
 */
export async function extractProjectSummary(description: string): Promise<ProjectSummary> {
  if (!description || description.trim().length === 0) {
    return {
      summary: 'your project',
      success: false,
    };
  }

  try {
    const summary = await generateCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description },
      ],
      {
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        maxTokens: 30,
      },
    );

    // Validate the summary
    const trimmed = summary.trim();

    if (trimmed.length === 0 || trimmed.length > 100) {
      throw new Error('Invalid summary length');
    }

    // Remove quotes if present
    const cleaned = trimmed.replace(/^["']|["']$/g, '');

    return {
      summary: cleaned,
      success: true,
    };
  } catch (error) {
    console.error('[ProjectDescriptionAgent] Extraction failed:', error);

    // Fallback: use simple truncation
    const firstSentence = description.split(/[.!?]/)[0].trim();
    const fallback = firstSentence.length <= 60 ? firstSentence : firstSentence.substring(0, 60) + '...';

    return {
      summary: fallback,
      success: false,
    };
  }
}
