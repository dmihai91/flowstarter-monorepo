/**
 * FlowOps Planner Agent (Master Orchestrator Agent)
 *
 * The master orchestrator agent that uses Claude Opus 4 (OpenRouter) for:
 * - Planning: Analyze business data + template to create modification plan
 * - Review: Judge generated output quality
 * - Exception Handling: Handle escalations when fixes fail
 *
 * This agent is orchestrated by GretlyEngine and communicates via FlowOps.
 * It is a high-cost agent that makes rare but critical decisions.
 *
 * Model: Claude Opus 4 (groq/llama-3.3-70b-versatile)
 */

import { BaseAgent, type AgentContext, type AgentResponse, getAgentRegistry } from '~/lib/flowops/agent';
import { z } from 'zod';
import { generateJSON, generateCompletion } from '~/lib/services/llm';

/*
 * ============================================================================
 * Constants
 * ============================================================================
 */

/** Master model for planning and review - Claude Opus 4 (OpenRouter) */
const MASTER_MODEL = 'anthropic/claude-opus-4';

/*
 * ============================================================================
 * Schemas
 * ============================================================================
 */

export const PlanRequestSchema = z.object({
  /** Type of request */
  type: z.enum(['plan', 'review', 'escalate']),

  /** Project ID */
  projectId: z.string(),

  /** Business information */
  businessInfo: z.object({
    name: z.string(),
    description: z.string().optional(),
    tagline: z.string().optional(),
    services: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    businessGoals: z.array(z.string()).optional(),
    brandTone: z.string().optional(),
  }),

  /** Template information */
  template: z.object({
    slug: z.string(),
    name: z.string(),
    files: z.record(z.string()).optional(),
  }),

  /** Design choices */
  design: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      fontFamily: z.string().optional(),
    })
    .optional(),

  /** For review: Generated files to review */
  generatedFiles: z.record(z.string()).optional(),

  /** For escalate: Error history */
  errorHistory: z
    .array(
      z.object({
        file: z.string(),
        error: z.string(),
        fixAttempts: z.number(),
        lastFixSummary: z.string().optional(),
      }),
    )
    .optional(),
});

export type PlanRequestDTO = z.infer<typeof PlanRequestSchema>;

export const PlanResultSchema = z.object({
  success: z.boolean(),
  modifications: z.array(
    z.object({
      path: z.string(),
      instructions: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    }),
  ),
  contentGuidelines: z
    .object({
      tone: z.string().optional(),
      keyMessages: z.array(z.string()).optional(),
      ctaText: z.string().optional(),
    })
    .optional(),
  error: z.string().optional(),
});

export type PlanResultDTO = z.infer<typeof PlanResultSchema>;

export const ReviewResultSchema = z.object({
  approved: z.boolean(),
  score: z.number().min(1).max(10),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  categoryScores: z.object({
    requirementMatching: z.number().min(1).max(10),
    completeness: z.number().min(1).max(10),
    brandAlignment: z.number().min(1).max(10),
    technicalQuality: z.number().min(1).max(10),
    uxDesign: z.number().min(1).max(10),
  }),
  issues: z.array(
    z.object({
      severity: z.enum(['critical', 'major', 'minor', 'suggestion']),
      category: z.string(),
      file: z.string().optional(),
      description: z.string(),
      suggestedFix: z.string().optional(),
    }),
  ),
  improvements: z.array(
    z.object({
      file: z.string(),
      instruction: z.string(),
      priority: z.enum(['must-fix', 'should-fix', 'nice-to-have']),
    }),
  ),
});

export type ReviewResultDTO = z.infer<typeof ReviewResultSchema>;

export const EscalateResultSchema = z.object({
  /** Type of escalation */
  escalationType: z.enum(['user-intervention', 'manual-fix', 'skip-file', 'abort']),

  /** Human-readable explanation for the user */
  explanation: z.string(),

  /** Suggested actions the user can take */
  suggestedActions: z.array(z.string()),

  /** Files that need manual attention */
  affectedFiles: z.array(z.string()),

  /** Partial success - files that were successfully processed */
  successfulFiles: z.array(z.string()).optional(),
});

export type EscalateResultDTO = z.infer<typeof EscalateResultSchema>;

// Union response type
export type PlannerResponseDTO =
  | { type: 'plan'; result: PlanResultDTO }
  | { type: 'review'; result: ReviewResultDTO }
  | { type: 'escalate'; result: EscalateResultDTO };

/*
 * ============================================================================
 * Planner Agent Implementation
 * ============================================================================
 */

export class PlannerAgent extends BaseAgent {
  /** Minimum score to auto-approve */
  private readonly approvalThreshold: number;

  constructor(approvalThreshold: number = 7) {
    super({
      name: 'planner',
      description: 'Master orchestrator agent for planning, review, and exception handling (Claude Opus 4)',
      version: '1.0.0',
      systemPrompt: `You are the Planner agent, the master orchestrator for site generation.
You use Claude Opus 4 for high-quality planning, review, and decision-making.

Your responsibilities:
1. PLANNING: Analyze business data + template to create detailed modification plans
2. REVIEW: Judge generated output quality and decide approve/reject/refine
3. EXCEPTION HANDLING: When fixes fail repeatedly, create user-friendly escalation reports

You are the "brain" of the pipeline - other agents (CodeGenerator, Fixer) do the heavy lifting,
but you make the strategic decisions.`,
      allowedTools: [],
      allowedAgents: ['code-generator', 'fixer'],
    });
    this.approvalThreshold = approvalThreshold;
  }

  protected async process(message: string, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Parsing planner request...', 5);

    // Parse and validate request
    let request: PlanRequestDTO;

    try {
      const parsed = JSON.parse(message);
      const validation = PlanRequestSchema.safeParse(parsed);

      if (!validation.success) {
        return this.createErrorResponse(`Invalid request: ${validation.error.message}`);
      }

      request = validation.data;
    } catch {
      return this.createErrorResponse('Invalid JSON. Expected: { type, projectId, businessInfo, template, ... }');
    }

    this.logger.info(`Processing ${request.type} request for project ${request.projectId}`);

    // Route to appropriate handler
    switch (request.type) {
      case 'plan':
        return this.handlePlan(request, context);
      case 'review':
        return this.handleReview(request, context);
      case 'escalate':
        return this.handleEscalate(request, context);
      default:
        return this.createErrorResponse(`Unknown request type: ${request.type}`);
    }
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Plan Handler
   * ──────────────────────────────────────────────────────────────────────────
   */

  private async handlePlan(request: PlanRequestDTO, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Creating modification plan with Opus 4...', 20);

    const templateFileSummary = this.buildTemplateSummary(request.template.files || {});

    const prompt = `Create a detailed modification plan to customize this template for the business.

## BUSINESS INFORMATION
- Name: ${request.businessInfo.name}
- Description: ${request.businessInfo.description || 'Not provided'}
- Tagline: ${request.businessInfo.tagline || 'Not provided'}
- Services: ${request.businessInfo.services?.join(', ') || 'Not provided'}
- Target Audience: ${request.businessInfo.targetAudience || 'Not provided'}
- Business Goals: ${request.businessInfo.businessGoals?.join(', ') || 'Not provided'}
- Brand Tone: ${request.businessInfo.brandTone || 'Not provided'}

## TEMPLATE
- Name: ${request.template.name} (${request.template.slug})
${templateFileSummary ? `\n## TEMPLATE FILES\n${templateFileSummary}` : ''}

## DESIGN CHOICES
- Primary Color: ${request.design?.primaryColor || 'Use template default'}
- Secondary Color: ${request.design?.secondaryColor || 'Use template default'}
- Font Family: ${request.design?.fontFamily || 'Use template default'}

## TASK
Create a modification plan that:
1. Identifies ALL files that need customization
2. Provides specific instructions for each file
3. Prioritizes critical changes (hero, navigation, footer) over nice-to-haves
4. Ensures brand consistency across all pages
5. Focuses on the business's unique value proposition

## CRITICAL CONSTRAINTS
6. ONLY plan modifications for files that EXIST in TEMPLATE FILES list above
7. Navigation links must ONLY point to pages in the template - check the file list!
8. DO NOT reference /schedule, /instructors, /classes unless they appear in TEMPLATE FILES
9. If you need additional pages, include them as NEW modifications with full page content
10. Each nav link must have a corresponding page file

## DESIGN QUALITY (Principles, Not Prescriptions)
11. Hero sections should have: compelling background, clear headline hierarchy, and actionable CTAs appropriate to the business
12. Include relevant social proof: testimonials, logos, ratings, or trust elements that fit the business type
13. Use modern, polished UI patterns: proper spacing, shadows where appropriate, interactive feedback
14. Ensure clear visual hierarchy: headlines grab attention, supporting text is scannable
15. Consider theme support where the template allows it

## OUTPUT (JSON only)
{
  "success": true,
  "modifications": [
    {
      "path": "src/pages/index.astro",
      "instructions": "Detailed instructions for this file...",
      "priority": "critical|high|medium|low"
    }
  ],
  "contentGuidelines": {
    "tone": "The overall tone to use (e.g., professional but friendly)",
    "keyMessages": ["Message 1", "Message 2"],
    "ctaText": "Primary call-to-action text"
  }
}`;

    try {
      const result = await generateJSON<PlanResultDTO>([{ role: 'user', content: prompt }], {
        model: MASTER_MODEL,
        temperature: 0.3,
        maxTokens: 16000,
      });

      this.logger.info(`Plan created with ${result.modifications.length} modifications`);
      context.onProgress?.('Plan created successfully', 100);

      const response: PlannerResponseDTO = { type: 'plan', result };

      return {
        message: this.createMessage('agent', JSON.stringify(response)),
        complete: true,
      };
    } catch (error) {
      this.logger.error('Planning failed:', error);
      return this.createErrorResponse(`Planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Review Handler
   * ──────────────────────────────────────────────────────────────────────────
   */

  private async handleReview(request: PlanRequestDTO, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Reviewing generated output with Opus 4...', 20);

    if (!request.generatedFiles || Object.keys(request.generatedFiles).length === 0) {
      return this.createErrorResponse('No generated files provided for review');
    }

    const fileSummary = this.buildFileSummary(request.generatedFiles);

    const prompt = `Review this generated website against the business requirements.

## BUSINESS BRIEF
- Name: ${request.businessInfo.name}
- Description: ${request.businessInfo.description || 'Not provided'}
- Tagline: ${request.businessInfo.tagline || 'Not provided'}
- Services: ${request.businessInfo.services?.join(', ') || 'Not provided'}
- Target Audience: ${request.businessInfo.targetAudience || 'Not provided'}
- Business Goals: ${request.businessInfo.businessGoals?.join(', ') || 'Not provided'}
- Brand Tone: ${request.businessInfo.brandTone || 'Not provided'}

## TEMPLATE USED
- ${request.template.name} (${request.template.slug})

## GENERATED FILES
${fileSummary}

## REVIEW INSTRUCTIONS
1. Score each category 1-10:
   - requirementMatching: Does content match business description?
   - completeness: Are all pages/sections present?
   - brandAlignment: Do colors, fonts, tone match?
   - technicalQuality: Is code clean and well-structured?
   - uxDesign: Is navigation intuitive, CTAs clear?

2. Calculate overall score (average of categories)

3. List any issues found (critical, major, minor, suggestion)

4. List improvements needed for regeneration (if score < ${this.approvalThreshold})

## OUTPUT (JSON only)
{
  "approved": true/false,
  "score": <1-10>,
  "confidence": <0-1>,
  "summary": "Brief overall assessment",
  "categoryScores": {
    "requirementMatching": <1-10>,
    "completeness": <1-10>,
    "brandAlignment": <1-10>,
    "technicalQuality": <1-10>,
    "uxDesign": <1-10>
  },
  "issues": [
    {
      "severity": "critical|major|minor|suggestion",
      "category": "category name",
      "file": "path/to/file",
      "description": "What's wrong",
      "suggestedFix": "How to fix"
    }
  ],
  "improvements": [
    {
      "file": "path/to/file",
      "instruction": "What to change",
      "priority": "must-fix|should-fix|nice-to-have"
    }
  ]
}`;

    try {
      const result = await generateJSON<ReviewResultDTO>([{ role: 'user', content: prompt }], {
        model: MASTER_MODEL,
        temperature: 0.3,
        maxTokens: 12000,
      });

      // Override approved based on threshold and critical issues
      const hasNoCritical = !result.issues.some((i) => i.severity === 'critical');
      result.approved = result.score >= this.approvalThreshold && hasNoCritical;

      this.logger.info(`Review complete: score=${result.score}, approved=${result.approved}`);
      context.onProgress?.('Review complete', 100);

      const response: PlannerResponseDTO = { type: 'review', result };

      return {
        message: this.createMessage('agent', JSON.stringify(response)),
        complete: true,
      };
    } catch (error) {
      this.logger.error('Review failed:', error);
      return this.createErrorResponse(`Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Escalate Handler
   * ──────────────────────────────────────────────────────────────────────────
   */

  private async handleEscalate(request: PlanRequestDTO, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Analyzing escalation with Opus 4...', 20);

    if (!request.errorHistory || request.errorHistory.length === 0) {
      return this.createErrorResponse('No error history provided for escalation');
    }

    const errorSummary = request.errorHistory
      .map(
        (e) =>
          `- ${e.file}: "${e.error}" (${e.fixAttempts} fix attempts${e.lastFixSummary ? `, last fix: ${e.lastFixSummary}` : ''})`,
      )
      .join('\n');

    const prompt = `The automated fix process has failed after multiple attempts. Analyze the situation and provide a user-friendly escalation report.

## PROJECT
- Name: ${request.businessInfo.name}
- Template: ${request.template.name}

## ERROR HISTORY
${errorSummary}

## TASK
Analyze the errors and determine:
1. What went wrong (in plain language)
2. Whether the user can fix it manually
3. Whether some files can be skipped
4. What actions the user should take

## OUTPUT (JSON only)
{
  "escalationType": "user-intervention|manual-fix|skip-file|abort",
  "explanation": "Clear, non-technical explanation of what went wrong",
  "suggestedActions": [
    "Action 1 the user can take",
    "Action 2 (if applicable)"
  ],
  "affectedFiles": ["list of files with issues"],
  "successfulFiles": ["list of files that work (if any)"]
}

Guidelines:
- "user-intervention": User needs to make a decision (e.g., choose different template)
- "manual-fix": User can fix the code manually with guidance
- "skip-file": The problematic files can be skipped, site still works
- "abort": Critical failure, cannot proceed`;

    try {
      const result = await generateJSON<EscalateResultDTO>([{ role: 'user', content: prompt }], {
        model: MASTER_MODEL,
        temperature: 0.3,
        maxTokens: 2000,
      });

      this.logger.info(`Escalation type: ${result.escalationType}`);
      context.onProgress?.('Escalation report generated', 100);

      const response: PlannerResponseDTO = { type: 'escalate', result };

      return {
        message: this.createMessage('agent', JSON.stringify(response)),
        complete: true,
      };
    } catch (error) {
      this.logger.error('Escalation analysis failed:', error);
      return this.createErrorResponse(`Escalation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Helper Methods
   * ──────────────────────────────────────────────────────────────────────────
   */

  private buildTemplateSummary(files: Record<string, string>): string {
    const summary: string[] = [];
    const fileList = Object.keys(files);

    // Show file structure
    summary.push('File structure:');

    for (const path of fileList.slice(0, 20)) {
      summary.push(`  - ${path}`);
    }

    if (fileList.length > 20) {
      summary.push(`  ... and ${fileList.length - 20} more files`);
    }

    // Show key files content
    const keyFiles = ['src/pages/index.astro', 'src/components/Header.astro', 'src/components/Hero.astro'];

    for (const keyFile of keyFiles) {
      if (files[keyFile]) {
        summary.push(`\n=== ${keyFile} (preview) ===`);
        summary.push(files[keyFile].slice(0, 1000));
      }
    }

    return summary.join('\n');
  }

  private buildFileSummary(files: Record<string, string>): string {
    const summary: string[] = [];

    for (const [path, content] of Object.entries(files)) {
      // Skip non-content files
      if (path.includes('node_modules') || path.endsWith('.lock')) {
        continue;
      }

      // For Astro/React components, show structure
      if (path.match(/\.(astro|tsx|jsx)$/)) {
        summary.push(`\n=== ${path} ===`);

        // Show first 100 lines or 3000 chars
        const lines = content.split('\n').slice(0, 100);
        summary.push(lines.join('\n').slice(0, 3000));
      }
      // For config files, show full content
      else if (path.match(/\.(json|yaml|toml)$/) && content.length < 2000) {
        summary.push(`\n=== ${path} ===`);
        summary.push(content);
      }
    }

    return summary.join('\n');
  }

  private createErrorResponse(error: string): AgentResponse {
    const response: PlannerResponseDTO = {
      type: 'plan',
      result: {
        success: false,
        modifications: [],
        error,
      },
    };

    return {
      message: this.createMessage('agent', JSON.stringify(response)),
      complete: false,
      nextAction: 'Provide valid input',
    };
  }
}

/*
 * ============================================================================
 * Singleton instance
 * ============================================================================
 */

let plannerAgentInstance: PlannerAgent | null = null;

/**
 * Get the singleton PlannerAgent instance.
 */
export function getPlannerAgent(approvalThreshold?: number): PlannerAgent {
  if (!plannerAgentInstance) {
    plannerAgentInstance = new PlannerAgent(approvalThreshold);
  }

  return plannerAgentInstance;
}

/**
 * Reset the singleton (for testing).
 */
export function resetPlannerAgent(): void {
  plannerAgentInstance = null;
}


