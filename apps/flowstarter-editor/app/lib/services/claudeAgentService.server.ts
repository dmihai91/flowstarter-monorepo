/**
 * Claude Site Generation Service (Server-side)
 *
 * Facade module that re-exports from the modular claude-agent implementation.
 *
 * @see ./claude-agent/index.ts for the main implementation
 * @see ./claude-agent/types.ts for type definitions
 * @see ./claude-agent/templates.ts for template configuration
 * @see ./claude-agent/sanitization.ts for CSS/Astro sanitization
 * @see ./claude-agent/contentGeneration.ts for content generation
 * @see ./claude-agent/errorHealing.ts for build error healing
 * @see ./claude-agent/llmHelpers.ts for LLM utilities
 */

// Re-export everything from the modular implementation
export type { SiteGenerationInput, GeneratedFile, SiteGenerationResult, BuildError, AgentActivityEvent } from './claude-agent';

export { generateSiteFromTemplate, generateSiteHybrid, generateSiteSync, healBuildErrors } from './claude-agent';

