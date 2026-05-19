import type { DiscoverySpec } from './spec';
import { RESPECT_DESIGN, WRITING_HUMANIZE } from './skills';

/**
 * Single-shot, tool-less personalization. The model's entire reply must BE the
 * rewritten content file — no tools, no exploration, no prose. That contract
 * is what makes it ~1 min instead of ~12.
 */
export function buildSystemPrompt(): string {
  return [
    `You rewrite ONE Astro template YAML content file so a finished, professionally-designed website reads as a specific business's site. Every component reads from this file through typed accessors.`,
    RESPECT_DESIGN,
    WRITING_HUMANIZE,
    `# Output contract (obey exactly)
- Your ENTIRE response must be the complete rewritten file content and nothing else: no markdown code fences, no \`---\` lines, no preface, no explanation, no trailing notes.
- Preserve the YAML contract exactly: same keys, same nesting, same number of array items, same \`href\` route paths, same image \`src\`/\`imageSrc\` paths. Change only human-readable text values (titles, copy, labels, names, tags, FAQ questions/answers, testimonial text, stat labels, meta, button labels).
- Keep value types identical (string→string, list→same-length list) and YAML valid (correct indentation; quote strings containing colons; preserve block scalars written with \`|\`).
- Do not invent real contact details, prices, named people, or quotes — if the spec lacks a value, keep the original's placeholder character.`,
  ].join('\n\n');
}

export function buildTaskPrompt(
  spec: DiscoverySpec,
  _contentFileAbsPath: string,
  currentContent: string
): string {
  const b: string[] = [`Rewrite the YAML content file below for this business.`, ``, `## Business`, `- Name: ${spec.businessName}`];
  if (spec.industry) b.push(`- Industry: ${spec.industry}`);
  b.push(`- What they do: ${spec.description}`);
  if (spec.targetAudience) b.push(`- Audience: ${spec.targetAudience}`);
  if (spec.goal) b.push(`- Primary site goal: ${spec.goal}`);
  if (spec.brandTone) b.push(`- Brand tone: ${spec.brandTone}`);
  if (spec.secondaryGoals?.length) b.push(`- Also: ${spec.secondaryGoals.join('; ')}`);
  b.push(
    ``,
    `## Current file (preserve every key and structure; rewrite only human-readable values)`,
    currentContent,
    ``,
    `Now output the complete personalized file content — only the file, nothing else.`
  );
  return b.join('\n');
}
