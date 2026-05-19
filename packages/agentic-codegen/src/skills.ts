/**
 * Guidance injected into the personalization agent. The template is already
 * professionally designed — the agent must NOT redesign it. So we inject only
 * the copy-quality rules (the part that actually varies per business) plus a
 * hard "respect the existing design" boundary. Kept inline so the worker is
 * hermetic.
 */

export const RESPECT_DESIGN = `# Respect the existing design

This Astro template was hand-crafted by senior designers and is already
excellent. You are NOT redesigning it. Do not change layout, components,
CSS architecture, structure, or visual system. Your job is purely to make
the existing site read as THIS business's site by rewriting content.`;

export const WRITING_HUMANIZE = `# Copy — human, not AI-generated

Rewrite every human-readable string so it reads as a sharp human marketer
wrote it for this specific business and audience. Never invent facts, names,
quotes, prices, stats, phone numbers, emails or addresses — if the spec
doesn't give a value, keep the template's existing placeholder text style
rather than fabricating a real-looking one.

Ban these AI tells: "testament to", "pivotal", "crucial", "elevate",
"underscores", "stands as", "nestled", "delve", "tapestry", "robust",
"seamless", "unlock", "empower", "commitment to", "fostering", "in today's
fast-paced world"; negative parallelism ("not just X — it's Y"); rule-of-
three padding; em-dash overuse; Title Case headings; chatbot artifacts;
hollow superlatives; weak summary endings.

Voice: specific over generic, concrete nouns and plain verbs, varied
sentence length, a real point of view, industry-appropriate CTAs (never
"Get Started"/"Learn More"). Match the brand tone from the spec.`;
