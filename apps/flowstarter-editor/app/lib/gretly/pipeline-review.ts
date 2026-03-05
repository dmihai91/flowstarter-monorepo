/**
 * Pipeline Review — Master LLM review execution and feedback builder.
 */

import { createScopedLogger } from '~/utils/logger';
import { getAgentRegistry } from '~/lib/flowops';
import { type ReviewResultDTO, ReviewRequestSchema } from '~/lib/flowstarter/agents/reviewer-agent';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import type { BusinessInfo, TemplateInfo } from './pipeline-types';

const logger = createScopedLogger('Gretly:Pipeline:Review');

function emptyReview(summary: string): ReviewResultDTO {
  return {
    approved: false, score: 0, confidence: 0, summary,
    categoryScores: { requirementMatching: 0, completeness: 0, brandAlignment: 0, technicalQuality: 0, uxDesign: 0 },
    issues: [], improvements: [],
  };
}

export async function runReview(
  files: Record<string, string>,
  businessInfo: BusinessInfo,
  template: TemplateInfo,
): Promise<ReviewResultDTO> {
  const agentRegistry = getAgentRegistry();
  const request = { files, businessInfo, template };
  const validation = ReviewRequestSchema.safeParse(request);

  if (!validation.success) {
    logger.error('Review request validation failed:', validation.error);
    return emptyReview(t(EDITOR_LABEL_KEYS.ORCH_INVALID_REVIEW, { error: validation.error.message }));
  }

  const response = await agentRegistry.send('reviewer', JSON.stringify(request));

  try {
    return JSON.parse(response.message.content) as ReviewResultDTO;
  } catch {
    logger.error('Failed to parse review response');
    return emptyReview(t(EDITOR_LABEL_KEYS.ORCH_FAILED_PARSE_REVIEW));
  }
}

export function buildFeedback(review: ReviewResultDTO): string {
  const parts: string[] = [
    `Review Score: ${review.score}/10`,
    `Summary: ${review.summary}`,
  ];

  const mustFix = review.improvements.filter((i) => i.priority === 'must-fix');

  if (mustFix.length > 0) {
    parts.push('\nMust Fix:');

    for (const imp of mustFix) {
      parts.push(`- ${imp.file}: ${imp.instruction}`);
    }
  }

  const criticalIssues = review.issues.filter((i) => i.severity === 'critical' || i.severity === 'major');

  if (criticalIssues.length > 0) {
    parts.push('\nCritical Issues:');

    for (const issue of criticalIssues) {
      parts.push(`- [${issue.severity}] ${issue.description}`);

      if (issue.suggestedFix) {
        parts.push(`  Fix: ${issue.suggestedFix}`);
      }
    }
  }

  return parts.join('\n');
}
