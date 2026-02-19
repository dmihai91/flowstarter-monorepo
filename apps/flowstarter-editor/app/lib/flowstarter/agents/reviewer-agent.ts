/**
 * FlowOps Reviewer Agent
 *
 * Master review agent that validates generated content against business requirements.
 * Uses Claude for high-quality semantic validation and scoring.
 *
 * Review Criteria:
 * 1. Requirement matching - Does the site meet the business brief?
 * 2. Completeness - Are all required pages/sections present?
 * 3. Brand alignment - Colors, tone, messaging match?
 * 4. Technical quality - Clean code, proper structure?
 * 5. UX/Design quality - Intuitive navigation, clear CTAs?
 */

import { BaseAgent, type AgentContext, type AgentResponse } from '~/lib/flowops/agent';
import { z } from 'zod';
import { generateJSON } from '~/lib/services/llm';

/*
 * ============================================================================
 * Schemas
 * ============================================================================
 */

export const ReviewRequestSchema = z.object({
  /** Generated files to review */
  files: z.record(z.string()),

  /** Original business brief */
  businessInfo: z.object({
    name: z.string(),
    description: z.string().optional(),
    tagline: z.string().optional(),
    services: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    businessGoals: z.array(z.string()).optional(),
    brandTone: z.string().optional(),
  }),

  /** Template used */
  template: z.object({
    slug: z.string(),
    name: z.string(),
  }),

  /** Optional: Specific aspects to review */
  focusAreas: z.array(z.string()).optional(),
});

export type ReviewRequestDTO = z.infer<typeof ReviewRequestSchema>;

export const ReviewResultSchema = z.object({
  /** Overall approval */
  approved: z.boolean(),

  /** Quality score 1-10 */
  score: z.number().min(1).max(10),

  /** Confidence in the review (0-1) */
  confidence: z.number().min(0).max(1),

  /** Summary of review */
  summary: z.string(),

  /** Detailed scores by category */
  categoryScores: z.object({
    requirementMatching: z.number().min(1).max(10),
    completeness: z.number().min(1).max(10),
    brandAlignment: z.number().min(1).max(10),
    technicalQuality: z.number().min(1).max(10),
    uxDesign: z.number().min(1).max(10),
  }),

  /** Issues found */
  issues: z.array(
    z.object({
      severity: z.enum(['critical', 'major', 'minor', 'suggestion']),
      category: z.string(),
      file: z.string().optional(),
      description: z.string(),
      suggestedFix: z.string().optional(),
    }),
  ),

  /** Improvements needed (for regeneration) */
  improvements: z.array(
    z.object({
      file: z.string(),
      instruction: z.string(),
      priority: z.enum(['must-fix', 'should-fix', 'nice-to-have']),
    }),
  ),
});

export type ReviewResultDTO = z.infer<typeof ReviewResultSchema>;

/*
 * ============================================================================
 * Reviewer Agent Implementation
 * ============================================================================
 */

export class ReviewerAgent extends BaseAgent {
  /** Minimum score to auto-approve */
  private readonly approvalThreshold: number;

  constructor(approvalThreshold: number = 7) {
    super({
      name: 'reviewer',
      description: 'Master review agent that validates generated sites against business requirements',
      version: '1.0.0',
      systemPrompt: `You are a senior QA reviewer for generated websites.
Your job is to validate that a generated site meets the original business requirements.

Review Criteria (score 1-10 each):
1. REQUIREMENT MATCHING: Does the site content match the business description and services?
2. COMPLETENESS: Are all expected pages, sections, and components present?
3. BRAND ALIGNMENT: Do colors, fonts, and tone match the brand?
4. TECHNICAL QUALITY: Is the code clean, well-structured, and following best practices?
5. UX/DESIGN: Is the site intuitive, accessible, and visually appealing?

Be thorough but fair. A score of 7+ means acceptable, 8+ means good, 9+ means excellent.`,
      allowedTools: [],
    });
    this.approvalThreshold = approvalThreshold;
  }

  protected async process(message: string, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Parsing review request...', 5);

    // Parse and validate request
    let request: ReviewRequestDTO;

    try {
      const parsed = JSON.parse(message);
      const validation = ReviewRequestSchema.safeParse(parsed);

      if (!validation.success) {
        return this.createErrorResponse(`Invalid request: ${validation.error.message}`);
      }

      request = validation.data;
    } catch {
      return this.createErrorResponse('Invalid JSON. Expected: { files, businessInfo, template }');
    }

    this.logger.info(`Reviewing site for ${request.businessInfo.name}`);
    context.onProgress?.('Analyzing generated files...', 20);

    // Build file summary for review
    const fileSummary = this.buildFileSummary(request.files);

    context.onProgress?.('Running master review...', 40);

    // Call master LLM for review
    const reviewResult = await this.runMasterReview(request, fileSummary);

    context.onProgress?.('Processing review results...', 90);

    // Determine if approved based on threshold
    const approved =
      reviewResult.score >= this.approvalThreshold && !reviewResult.issues.some((i) => i.severity === 'critical');

    const finalResult: ReviewResultDTO = {
      ...reviewResult,
      approved,
    };

    // Validate result against schema
    const resultValidation = ReviewResultSchema.safeParse(finalResult);

    if (!resultValidation.success) {
      this.logger.warn('Review result failed schema validation:', resultValidation.error);
    }

    this.logger.info(`Review complete: score=${finalResult.score}, approved=${approved}`);

    return {
      message: this.createMessage('agent', JSON.stringify(finalResult)),
      complete: true,
    };
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Private helpers
   * ──────────────────────────────────────────────────────────────────────────
   */

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

  private async runMasterReview(
    request: ReviewRequestDTO,
    fileSummary: string,
  ): Promise<Omit<ReviewResultDTO, 'approved'>> {
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

4. List improvements needed for regeneration

## OUTPUT (JSON only)
{
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
      // Use Claude for high-quality review
      const result = await generateJSON<Omit<ReviewResultDTO, 'approved'>>([{ role: 'user', content: prompt }], {
        model: 'anthropic/claude-3.5-sonnet', // Use Claude for master review
        temperature: 0.3, // Low temp for consistent scoring
        maxTokens: 4000,
      });

      return result;
    } catch (error) {
      this.logger.error('Master review failed:', error);

      // Return a default failed review
      return {
        score: 0,
        confidence: 0,
        summary: 'Review failed due to an error',
        categoryScores: {
          requirementMatching: 0,
          completeness: 0,
          brandAlignment: 0,
          technicalQuality: 0,
          uxDesign: 0,
        },
        issues: [
          {
            severity: 'critical',
            category: 'system',
            description: `Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        improvements: [],
      };
    }
  }

  private createErrorResponse(error: string): AgentResponse {
    const result: ReviewResultDTO = {
      approved: false,
      score: 0,
      confidence: 0,
      summary: error,
      categoryScores: {
        requirementMatching: 0,
        completeness: 0,
        brandAlignment: 0,
        technicalQuality: 0,
        uxDesign: 0,
      },
      issues: [
        {
          severity: 'critical',
          category: 'input',
          description: error,
        },
      ],
      improvements: [],
    };

    return {
      message: this.createMessage('agent', JSON.stringify(result)),
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

let reviewerAgentInstance: ReviewerAgent | null = null;

/**
 * Get the singleton ReviewerAgent instance.
 */
export function getReviewerAgent(approvalThreshold?: number): ReviewerAgent {
  if (!reviewerAgentInstance) {
    reviewerAgentInstance = new ReviewerAgent(approvalThreshold);
  }

  return reviewerAgentInstance;
}

