import type { DiscoverySpec } from './spec';
import { RESPECT_DESIGN, WRITING_HUMANIZE } from './skills';
import { TEMPLATE_CATALOG } from './workspace';

/* ───────────────────────── Planner (Sonnet brain) ─────────────────────── */

/** The structured build plan the planner returns (parsed from its JSON). */
export interface BuildPlan {
  /** Chosen template id from TEMPLATE_CATALOG (null → caller's regex fallback). */
  templateId: string | null;
  /** One-line positioning angle that should run through all the copy. */
  angle: string;
  /** Short per-section direction, keyed by conceptual section name. */
  sectionBriefs: Record<string, string>;
}

export function buildPlanSystem(): string {
  return [
    `You are the planner for a website build. You do NOT write the site — you choose the best template and give the copywriter a tight brief. Be specific and concrete; no filler.`,
    `# Output contract
Reply with ONLY a JSON object, no markdown fences, no prose, exactly:
{
  "templateId": "<one id from the list, or null if none fits>",
  "angle": "<one sentence: the positioning that should run through every section>",
  "sectionBriefs": {
    "hero": "<what the headline + subhead must land>",
    "services": "<how to frame what they offer>",
    "about": "<what the story should convey>",
    "testimonials": "<the kind of proof that fits>",
    "cta": "<the single action to drive>"
  }
}`,
  ].join('\n\n');
}

export function buildPlanPrompt(spec: DiscoverySpec): string {
  const lines = [
    `Templates:`,
    ...TEMPLATE_CATALOG.map((t) => `- ${t.id}: ${t.bestFor}`),
    ``,
    `Business:`,
    `- Name: ${spec.businessName}`,
  ];
  if (spec.industry) lines.push(`- Industry: ${spec.industry}`);
  lines.push(`- What they do: ${spec.description}`);
  if (spec.targetAudience) lines.push(`- Audience: ${spec.targetAudience}`);
  if (spec.goal) lines.push(`- Primary goal: ${spec.goal}`);
  if (spec.brandTone) lines.push(`- Brand tone: ${spec.brandTone}`);
  lines.push(``, `Choose the template and write the brief now.`);
  return lines.join('\n');
}

/* ──────────────────────── Critique (Sonnet brain) ─────────────────────── */

export interface Critique {
  passed: boolean;
  /** 1 (generic/broken) – 5 (sharp, specific, on-brand). */
  score: number;
  /** Top-level YAML keys whose copy is weakest and should be revised. */
  weakSections: string[];
  /** Actionable, specific notes for the implementer's revision pass. */
  notes: string;
}

export function buildCritiqueSystem(): string {
  return [
    `You are a demanding editor reviewing personalized website copy for a specific business. You judge quality only — you do not rewrite. Be honest; a generic result that could belong to any business is a FAIL.`,
    `# What "passed" means
- Copy is specific to THIS business and audience (not template-generic).
- No leftover placeholder/sample text from the original template.
- Tone matches the brief; no AI tells; no fabricated facts/quotes/prices.`,
    `# Output contract
Reply with ONLY a JSON object, no fences, no prose, exactly:
{ "passed": <bool>, "score": <1-5>, "weakSections": ["<top-level yaml key>", ...], "notes": "<specific fixes for the weak sections>" }
"weakSections" must be top-level keys taken from the file you are shown.`,
  ].join('\n\n');
}

export function buildCritiquePrompt(
  spec: DiscoverySpec,
  contentAfter: string
): string {
  return [
    `Business: ${spec.businessName}${spec.industry ? ` — ${spec.industry}` : ''}`,
    `What they do: ${spec.description}`,
    spec.targetAudience ? `Audience: ${spec.targetAudience}` : '',
    spec.brandTone ? `Brand tone: ${spec.brandTone}` : '',
    ``,
    `Personalized content file to review:`,
    contentAfter,
    ``,
    `Judge it now.`,
  ]
    .filter(Boolean)
    .join('\n');
}

/* ──────────────────── Worker / wave (Kimi implementer) ─────────────────── */

/** System prompt for a wave rewrite — scoped to a subset of top-level keys. */
export function buildWaveSystem(): string {
  return [
    `You rewrite part of an Astro template's YAML content file so a finished, professionally-designed website reads as a specific business's site. Every component reads from this file through typed accessors.`,
    RESPECT_DESIGN,
    WRITING_HUMANIZE,
    `# Output contract (obey exactly)
- You are given ONLY some top-level YAML blocks. Your ENTIRE response is those same blocks rewritten — same top-level keys, same order, nothing else: no other keys, no markdown fences, no \`---\` lines, no commentary.
- Preserve the YAML contract exactly: same keys, same nesting, same number of array items, same \`href\` route paths, same image \`src\`/\`imageSrc\` paths. Change only human-readable text values.
- Keep value types identical and YAML valid (indentation; quote strings containing colons; preserve block scalars written with \`|\`).
- Never invent real contact details, prices, named people, or quotes.`,
  ].join('\n\n');
}

/**
 * Task prompt for one wave: rewrite just `blocksYaml` (the wave's top-level
 * blocks) using the plan's angle + section briefs. On a revision pass,
 * `critiqueNotes` carries the editor's specific fixes.
 */
export function buildWavePrompt(
  spec: DiscoverySpec,
  plan: BuildPlan | null,
  blocksYaml: string,
  critiqueNotes?: string
): string {
  const b: string[] = [`Rewrite the YAML blocks below for this business.`, ``, `## Business`, `- Name: ${spec.businessName}`];
  if (spec.industry) b.push(`- Industry: ${spec.industry}`);
  b.push(`- What they do: ${spec.description}`);
  if (spec.targetAudience) b.push(`- Audience: ${spec.targetAudience}`);
  if (spec.goal) b.push(`- Primary site goal: ${spec.goal}`);
  if (spec.brandTone) b.push(`- Brand tone: ${spec.brandTone}`);
  if (spec.secondaryGoals?.length) b.push(`- Also: ${spec.secondaryGoals.join('; ')}`);
  if (plan?.angle) b.push(``, `## Positioning angle`, plan.angle);
  if (plan && Object.keys(plan.sectionBriefs).length) {
    b.push(``, `## Section briefs`);
    for (const [k, v] of Object.entries(plan.sectionBriefs)) b.push(`- ${k}: ${v}`);
  }
  if (critiqueNotes) {
    b.push(``, `## Editor feedback — fix these specifically`, critiqueNotes);
  }
  b.push(
    ``,
    `## Blocks to rewrite (preserve every key and structure; rewrite only human-readable values)`,
    blocksYaml,
    ``,
    `Now output the rewritten blocks — only these blocks, nothing else.`
  );
  return b.join('\n');
}

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
