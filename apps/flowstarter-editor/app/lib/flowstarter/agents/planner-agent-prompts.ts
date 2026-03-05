import type { PlanRequestDTO } from './planner-agent-schemas';

export function buildPlanPrompt(request: PlanRequestDTO, templateFileSummary: string): string {
  return `Create a detailed modification plan to customize this template for the business.

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
}

export function buildReviewPrompt(
  request: PlanRequestDTO,
  fileSummary: string,
  approvalThreshold: number,
): string {
  return `Review this generated website against the business requirements.

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

4. List improvements needed for regeneration (if score < ${approvalThreshold})

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
}

export function buildEscalatePrompt(request: PlanRequestDTO, errorSummary: string): string {
  return `The automated fix process has failed after multiple attempts. Analyze the situation and provide a user-friendly escalation report.

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
}

export function buildTemplateSummary(files: Record<string, string>): string {
  const summary: string[] = [];
  const fileList = Object.keys(files);
  summary.push('File structure:');
  for (const path of fileList.slice(0, 20)) {
    summary.push(`  - ${path}`);
  }
  if (fileList.length > 20) {
    summary.push(`  ... and ${fileList.length - 20} more files`);
  }
  const keyFiles = ['src/pages/index.astro', 'src/components/Header.astro', 'src/components/Hero.astro'];
  for (const keyFile of keyFiles) {
    if (files[keyFile]) {
      summary.push(`\n=== ${keyFile} (preview) ===`);
      summary.push(files[keyFile].slice(0, 1000));
    }
  }
  return summary.join('\n');
}

export function buildFileSummary(files: Record<string, string>): string {
  const summary: string[] = [];
  for (const [path, content] of Object.entries(files)) {
    if (path.includes('node_modules') || path.endsWith('.lock')) continue;
    if (path.match(/\.(astro|tsx|jsx)$/)) {
      summary.push(`\n=== ${path} ===`);
      const lines = content.split('\n').slice(0, 100);
      summary.push(lines.join('\n').slice(0, 3000));
    } else if (path.match(/\.(json|yaml|toml)$/) && content.length < 2000) {
      summary.push(`\n=== ${path} ===`);
      summary.push(content);
    }
  }
  return summary.join('\n');
}
