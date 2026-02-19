/**
 * Flowstarter Agents
 *
 * Application-specific agents for site generation, built on the FlowOps framework.
 *
 * Gretly Pipeline Agents:
 * - PlannerAgent (Opus 4.5): Master planning, review, escalation
 * - CodeGeneratorAgent (Kimi K2): Fast code generation
 * - FixerAgent (Sonnet 4): Error fixing with fresh perspective
 *
 * Pre-Pipeline Agents:
 * - BusinessDataAgent: Interactive business information gathering
 * - TemplateRecommenderAgent: AI-powered template selection
 * - CustomizerAgent: Font, palette, and theme customization
 *
 * These agents communicate via FlowOps protocol and are orchestrated by GretlyEngine.
 */

// PlannerAgent - Master orchestrator (Opus 4.5)
export {
  PlannerAgent,
  getPlannerAgent,
  resetPlannerAgent,
  type PlannerResponseDTO,

  // Schemas
  PlanRequestSchema,
  PlanResultSchema,
  ReviewResultSchema as PlannerReviewResultSchema,
  EscalateResultSchema,

  // Types
  type PlanRequestDTO,
  type PlanResultDTO,
  type ReviewResultDTO as PlannerReviewResultDTO,
  type EscalateResultDTO,
} from './planner-agent';

// CodeGeneratorAgent - Fast code generation (Kimi K2)
export {
  CodeGeneratorAgent,
  getCodeGeneratorAgent,
  resetCodeGeneratorAgent,
  GenerateRequestSchema,
  GenerateResultSchema,
  type GenerateRequestDTO,
  type GenerateResultDTO,
} from './code-generator-agent';

// FixerAgent - Error fixing (Sonnet 4 primary, K2 fallback)
export { FixerAgent, getFixerAgent, resetFixerAgent, type FixerResponseDTO } from './fixer-agent';

// ReviewerAgent - Legacy reviewer (use PlannerAgent review instead)
export {
  ReviewerAgent,
  getReviewerAgent,
  ReviewRequestSchema,
  ReviewResultSchema,
  type ReviewRequestDTO,
  type ReviewResultDTO,
} from './reviewer-agent';

// BusinessDataAgent - Business information collection
export {
  BusinessDataAgent,
  getBusinessDataAgent,
  resetBusinessDataAgent,
  type BusinessData,
  type BusinessDataRequest,
  type BusinessDataResponse,
} from './business-data-agent';

// TemplateRecommenderAgent - Template selection
export {
  TemplateRecommenderAgent,
  getTemplateRecommenderAgent,
  resetTemplateRecommenderAgent,
  type BusinessInfo as TemplateBusinessInfo,
  type TemplateRecommendation,
  type FullTemplateRecommendation,
  type RecommendRequest,
  type RecommendResponse,
} from './template-recommender-agent';

// CustomizerAgent - Font, palette, and theme customization
export {
  CustomizerAgent,
  getCustomizerAgent,
  resetCustomizerAgent,
  type FontPairing,
  type FontRecommendation,
  type ColorPalette,
  type PaletteRecommendation,
  type ThemeCustomization,
  type BusinessContext,
  type CustomizeRequest,
  type CustomizeResponse,
} from './customizer-agent';

