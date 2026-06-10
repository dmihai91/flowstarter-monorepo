// Planner — decomposes the user's prompt (business description + approved demo
// spec) into a task graph. Brain-planned when a key is configured; otherwise a
// deterministic default plan with the same shape. Ideas from gretly's planner:
// ≤8 tasks, capability routing, per-task specialist system prompts, depends_on.
import type { SiteSpec } from '@flowstarter/build-engine';
import { callBrain, parseJson } from './brain';
import type { EffortTier, Plan, Task } from './types';

const PLANNER_SYSTEM = `You are the build planner for Flowstarter. Decompose the job of building a small-business website into discrete tasks for specialist coding/content agents.

Return ONLY JSON: {"tasks":[{"id":string,"description":string,"capability":"research"|"branding"|"copywriting"|"implement"|"review","agentRole":"research"|"brand"|"copy"|"dev","system":string,"input":string,"depends_on":string[],"artifact":string|null}]}

Rules:
- Max 8 tasks. Use depends_on for ordering; independent tasks run in parallel.
- "system" is the specialist role prompt (2-4 sentences) — written as if hiring an expert for this exact step.
- "input" is the exact, self-contained instruction including all context the agent needs.
- "description" is a short user-visible line, present tense, like a teammate narrating ("Drafting a homepage hero that sells the feeling…").
- Exactly one task per artifact in: brand, positioning, copy, site, booking. The "site" task is the main implement task: it writes a complete, self-contained index.html into the workspace.
- No invented statistics, no fake testimonials in any instruction.`;

/** Triage — effort gate (ask-sage): richer descriptions get the review pass. */
export function triage(description: string): EffortTier {
  return description.length > 400 ? 'rich' : 'standard';
}

function defaultPlan(goal: string, spec: SiteSpec | null, tier: EffortTier): Task[] {
  const brand = spec?.brand.name ?? 'the business';
  const specJson = spec ? JSON.stringify(spec) : 'null';
  const base: Array<Omit<Task, 'status'>> = [
    {
      id: 'research',
      description: 'Pulling demand signals and sharpening the positioning…',
      capability: 'research',
      agentRole: 'research',
      system: 'You are a pragmatic market researcher for small local businesses. You find the wedge — the one sentence that separates this business from its competitors — from the owner’s own description, without inventing data.',
      input: `Business: ${goal}\nApproved demo spec: ${specJson}\nProduce: a one-line positioning statement and 3 bullet audience notes. Plain text.`,
      depends_on: [],
      artifact: 'positioning',
    },
    {
      id: 'brand',
      description: 'Locking the brand direction — name, palette, voice…',
      capability: 'branding',
      agentRole: 'brand',
      system: 'You are a brand designer who works in constraints: one palette, one voice, no decoration for its own sake. You respect what the client already approved in the demo.',
      input: `Business: ${goal}\nApproved demo spec (KEEP consistent with it): ${specJson}\nProduce: confirmed brand block as JSON {name, tagline, palette:[4 hex], voice:[3 words]}.`,
      depends_on: [],
      artifact: 'brand',
    },
    {
      id: 'copy',
      description: 'Writing the homepage copy in the owner’s voice…',
      capability: 'copywriting',
      agentRole: 'copy',
      system: 'You are a conversion copywriter for small businesses. You write like the owner talks — concrete, warm, zero clichés, no invented stats or testimonials.',
      input: `Business: ${goal}\nPositioning and brand come from prior tasks (see prior results). Produce: JSON {hero, sub, cta, sections:[{h,p} x3]} consistent with the approved demo.`,
      depends_on: ['research', 'brand'],
      artifact: 'copy',
    },
    {
      id: 'site',
      description: 'Assembling the site — pages, nav, mobile layout…',
      capability: 'implement',
      agentRole: 'dev',
      system: `You are a senior front-end engineer. You ship a complete, fast, accessible single-file website (index.html with inlined CSS) for ${brand}. Semantic HTML, responsive, no frameworks, no external assets.`,
      input: `Write the complete index.html for the business into the workspace. Use the brand block and copy from prior results verbatim. Sections: nav, hero, three feature sections, contact/booking section with a mailto CTA, footer. Must look polished on mobile.`,
      depends_on: ['brand', 'copy'],
      artifact: 'site',
    },
    {
      id: 'booking',
      description: 'Wiring the contact & booking flow…',
      capability: 'implement',
      agentRole: 'dev',
      system: 'You are a detail-oriented front-end engineer finishing a handoff: you verify and polish the contact/booking section of an existing index.html in the workspace.',
      input: 'Open index.html in the workspace, ensure the contact/booking section has a working mailto CTA, visible hours/location placeholders clearly marked as PLACEHOLDER, and anchors from the nav. Save the file.',
      depends_on: ['site'],
      artifact: 'booking',
    },
  ];
  if (tier === 'rich') {
    base.push({
      id: 'review',
      description: 'Reviewing everything end to end before handoff…',
      capability: 'review',
      agentRole: 'dev',
      system: 'You are a meticulous reviewer. You check the built site against the approved demo spec and the copy doc, and fix inconsistencies directly in the workspace.',
      input: 'Compare index.html against the brand/copy from prior results. Fix mismatched copy, broken anchors, or contrast problems directly in the file.',
      depends_on: ['booking'],
      artifact: undefined,
    });
  }
  return base.map((t) => ({ ...t, status: 'waiting' as const }));
}

export async function plan(goal: string, spec: SiteSpec | null): Promise<Plan> {
  const tier = triage(goal);
  const raw = await callBrain(
    PLANNER_SYSTEM,
    `Business description:\n${goal}\n\nApproved demo spec (stay consistent with it):\n${spec ? JSON.stringify(spec) : 'none'}`,
  );
  if (raw) {
    const parsed = parseJson<{ tasks: Array<Omit<Task, 'status'>> }>(raw);
    const tasks = parsed?.tasks;
    if (tasks?.length && tasks.length <= 8) {
      const ids = new Set(tasks.map((t) => t.id));
      const valid = tasks.every((t) => t.depends_on.every((d) => ids.has(d)));
      if (valid) {
        return { goal, tasks: tasks.map((t) => ({ ...t, artifact: t.artifact ?? undefined, status: 'waiting' as const })) };
      }
    }
    console.warn('[orchestrator planner] brain plan invalid — using default plan');
  }
  return { goal, tasks: defaultPlan(goal, spec, tier) };
}
