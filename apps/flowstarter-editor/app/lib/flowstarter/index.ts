/**
 * Flowstarter - Application-Specific AI Agents & Tools
 *
 * This module contains application-specific agents and tools for site generation.
 * These are built on the FlowOps framework and orchestrated by GretlyEngine.
 *
 * Architecture:
 * ```
 * FlowOps (Protocol)
 *     ↓
 * Flowstarter (Agents + Tools + Service)
 *     ├── BusinessDataAgent → Data Collection
 *     ├── TemplateRecommenderAgent → Template Selection
 *     ├── CustomizerAgent → Fonts, Palettes, Themes
 *     ├── PlannerAgent (Opus 4.5) → Planning & Review
 *     ├── CodeGeneratorAgent (Kimi K2) → Code Generation
 *     ├── FixerAgent (Sonnet 4) → Error Fixing
 *     ├── SearchTool (Tavily) → Web Search
 *     └── SelfHealingTool → Auto-Fix
 *     ↓
 * Gretly (Orchestrator)
 *     ↓
 * Daytona (Builds) → Convex (Persistence)
 * ```
 *
 * Pre-Pipeline Agents:
 * - BusinessDataAgent: Interactive business information gathering
 * - TemplateRecommenderAgent: AI-powered template selection
 * - CustomizerAgent: Font, palette, and theme customization
 *
 * Pipeline Agents:
 * - PlannerAgent (Opus 4.5): Master planning, review, escalation
 * - CodeGeneratorAgent (Kimi K2): Fast code generation
 * - FixerAgent (Sonnet 4): Error fixing with fresh perspective
 *
 * Tools:
 * - SearchTool: Tavily-based web search for error solutions
 * - SelfHealingTool: Three-tier error fixing system
 *
 * Service:
 * - generateSite(): Full pipeline site generation
 * - prewarmEnvironment(): Pre-warm sandbox for faster builds
 */

// Re-export all agents
export * from './agents';

// Re-export all tools
export * from './tools';

// Re-export service (main entry point for site generation)
export * from './service';

