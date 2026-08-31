/**
 * Classifying a client's free-text change request — with rules, not a model.
 *
 * The editor lets a client change words and pictures themselves; everything
 * else is work we do under the care plan. When they describe what they want
 * in the "Bigger changes" box, this decides which of the three it is, so the
 * self-serviceable asks are pointed back at the editor and only the real work
 * reaches the team. Deterministic on purpose: the same sentence always routes
 * the same way, and the rules can be read, tested and tuned line by line.
 *
 * Precedence is structural > image > content: over-escalating costs us a
 * glance at a ticket; under-escalating strands a client in an editor that
 * cannot do what they asked.
 */

export type ChangeRequestCapability = 'structural' | 'image' | 'content';

export interface ChangeRequestClassification {
  capability: ChangeRequestCapability;
  /** The rule labels that fired, oldest habit in this repo: explainability. */
  matched: string[];
}

/** Building or restructuring — the coding-agent kind of work. */
const STRUCTURAL_RULES: Array<{ label: string; test: RegExp }> = [
  {
    label: 'new-thing',
    test: /\b(add|new|create|build|insert|remove|delete|drop)\b[\s\S]*\b(page|route|section|component|form|integration|api|backend|animation|carousel|slider|interactive|booking|calendar|map|gallery|video|shop|store|blog|newsletter|popup|chat)\b/i,
  },
  {
    label: 'relayout',
    test: /\b(re-?structure|re-?layout|re-?build|re-?design|rework|move|rearrange|reorder|swap)\b[\s\S]*\b(layout|structure|section|page|menu|nav|navigation|order|columns?)\b/i,
  },
  {
    label: 'theme',
    test: /\b(colou?rs?|palette|fonts?|typography|theme|dark mode|style|branding)\b/i,
  },
  {
    label: 'behaviour',
    test: /\b(link|button)\b[\s\S]*\b(go(es)? to|open|point|redirect)\b/i,
  },
  {
    label: 'platform',
    // Bare language names ("in Romanian too") are unbounded and deliberately
    // not enumerated — a miss falls to content, and the send-anyway button is
    // the safety valve for every miss this list will ever have.
    test: /\b(domain|email|seo|analytics|tracking|speed|performance|translat(?:e|ed|ion)|bilingual|(?:another|second|other) language)\b/i,
  },
];

/** Their own pictures — the Pictures tab does this. */
const IMAGE_RULES: Array<{ label: string; test: RegExp }> = [
  {
    label: 'media-swap',
    test: /\b(photos?|images?|pictures?|logo)\b/i,
  },
];

export function classifyChangeRequest(
  text: string
): ChangeRequestClassification {
  const matched: string[] = [];
  for (const rule of STRUCTURAL_RULES) {
    if (rule.test.test(text)) matched.push(`structural:${rule.label}`);
  }
  if (matched.length > 0) return { capability: 'structural', matched };

  for (const rule of IMAGE_RULES) {
    if (rule.test.test(text)) matched.push(`image:${rule.label}`);
  }
  if (matched.length > 0) return { capability: 'image', matched };

  return { capability: 'content', matched: [] };
}

/**
 * The body the request files into the project thread. Recognisable at a
 * glance in the admin thread, and stable so tooling can find these later.
 */
export function formatChangeRequestBody(input: {
  request: string;
  classification: ChangeRequestClassification;
}): string {
  return [
    'Change request from the site editor:',
    '',
    input.request.trim(),
  ].join('\n');
}
