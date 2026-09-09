// OrchestratorEngine — the real build engine behind the same BuildEngine
// contract as the mock. Control flow (ask-sage ReAct shape + gretly graph):
//
//   triage → plan (brain) → execute waves (coding agents via Cursor SDK,
//   sandbox-as-truth) → validate (brain) → replan failed parts → outputs
//
// Task lifecycle is narrated into the build feed (the theater) and mirrored to
// the persistent agent-state sink (Convex) via onTaskUpdate.
import type {
  AgentId,
  BuildEngine,
  BuildOutputs,
  BuildRequest,
  EmitFn,
  SiteSpec,
} from '@flowstarter/build-engine';
import { mockSpecFromDescription, renderSiteHtml } from '@flowstarter/build-engine';
import { plan as makePlan } from './planner';
import { executePlan } from './executor';
import { callBrain, parseJson } from './brain';
import { createWorkspace } from './sandbox';
import { CursorAgentAdapter } from './agents/cursor';
import { MockAgentAdapter } from './agents/mock';
import type { AgentAdapter, OrchestratorOptions, Plan, Task } from './types';

function pickAdapter(timeoutMs: number): AgentAdapter {
  const mode = process.env.BUILD_AGENT_ADAPTER ?? 'mock';
  if (mode === 'cursor') return new CursorAgentAdapter(timeoutMs);
  return new MockAgentAdapter();
}

function specFromResults(goal: string, demoSpec: SiteSpec | null, plan: Plan): SiteSpec {
  const base = demoSpec ?? mockSpecFromDescription(goal);
  const out: SiteSpec = structuredClone(base);
  for (const t of plan.tasks) {
    if (t.status !== 'done' || !t.output) continue;
    if (t.capability === 'branding') {
      const brand = parseJson<SiteSpec['brand']>(t.output);
      if (brand?.name && Array.isArray(brand.palette) && brand.palette.length === 4) out.brand = brand;
    }
    if (t.capability === 'copywriting') {
      const copy = parseJson<SiteSpec['copy']>(t.output);
      if (copy?.hero && copy.sections?.length === 3) out.copy = copy;
    }
    if (t.capability === 'research') {
      const line = t.output.match(/Positioning:\s*(.+)/)?.[1];
      if (line) out.positioning = line.trim();
    }
  }
  return out;
}

const VALIDATOR_SYSTEM = `You are the build validator. Given the goal and task results, decide if the build satisfies the goal. Return ONLY JSON: {"passed":boolean,"failedTaskIds":string[],"reason":string}.`;

async function validate(plan: Plan): Promise<{ passed: boolean; failedTaskIds: string[] }> {
  const hardFailed = plan.tasks.filter((t) => t.status === 'failed').map((t) => t.id);
  if (hardFailed.length > 0) return { passed: false, failedTaskIds: hardFailed };
  const raw = await callBrain(
    VALIDATOR_SYSTEM,
    `Goal: ${plan.goal}\n\nResults:\n${plan.tasks
      .map((t) => `- ${t.id} (${t.status}): ${(t.output ?? '').slice(0, 500)}`)
      .join('\n')}`,
  );
  if (!raw) return { passed: true, failedTaskIds: [] }; // no brain → trust hard statuses
  const verdict = parseJson<{ passed: boolean; failedTaskIds?: string[] }>(raw);
  if (!verdict) return { passed: true, failedTaskIds: [] };
  return { passed: verdict.passed, failedTaskIds: verdict.failedTaskIds ?? [] };
}

export function createOrchestratorEngine(opts: OrchestratorOptions = {}): BuildEngine {
  const concurrency = opts.concurrency ?? 4;
  const maxRounds = opts.maxPlanRounds ?? 2;
  const taskTimeoutMs = opts.taskTimeoutMs ?? 150_000;

  return {
    kind: 'orchestrator',

    async run(req: BuildRequest, emit: EmitFn): Promise<BuildOutputs> {
      const adapter = pickAdapter(taskTimeoutMs);
      const workspace = await createWorkspace(req.buildId);
      const totalArtifacts = 5;
      let unlockedCount = 0;

      const feed = (agent: AgentId, text: string, artifact?: string) =>
        emit({ type: 'feed', ts: Date.now(), agent, text, artifact });
      const progress = () =>
        emit({ type: 'progress', ts: Date.now(), progress: Math.min(99, Math.round((unlockedCount / totalArtifacts) * 100)) });

      try {
        await feed('research', 'Reading your brief and planning the build…');
        let plan = await makePlan(req.businessDescription, req.demoSpec ?? null);

        for (let round = 0; round < maxRounds; round++) {
          plan = await executePlan({
            buildId: req.buildId,
            plan,
            adapter,
            workspaceDir: workspace.dir,
            concurrency,
            taskTimeoutMs,
            onTaskUpdate: opts.onTaskUpdate,
            events: {
              onTaskStart: (t: Task) => void feed(t.agentRole, t.description),
              onTaskDone: async (t: Task) => {
                if (t.artifact) {
                  unlockedCount++;
                  await feed(t.agentRole, doneLine(t), t.artifact);
                  await progress();
                }
              },
              onTaskFail: (t: Task) => void feed(t.agentRole, `Hit a snag on "${t.description}" — recovering…`),
            },
          });

          const verdict = await validate(plan);
          if (verdict.passed) break;
          if (round + 1 >= maxRounds) {
            const failed = plan.tasks.filter((t) => verdict.failedTaskIds.includes(t.id));
            throw new Error(`Build validation failed: ${failed.map((t) => `${t.id}: ${t.error ?? 'unsatisfactory'}`).join('; ')}`);
          }
          // Replan: reset failed tasks (and their dependents) for another round.
          const failedSet = new Set(verdict.failedTaskIds);
          for (const t of plan.tasks) {
            if (failedSet.has(t.id) || t.depends_on.some((d) => failedSet.has(d))) {
              t.status = 'waiting';
              t.error = undefined;
              t.output = undefined;
            }
          }
          await feed('research', 'Quality check found issues — replanning the affected steps…');
        }

        const spec = specFromResults(req.businessDescription, req.demoSpec ?? null, plan);
        // Sandbox-as-truth: prefer the file the dev agent actually shipped.
        const builtHtml = (await workspace.read('index.html')) ?? renderSiteHtml(spec);

        await feed('dev', 'Everything is wired. Ready for your review.');
        return {
          spec,
          siteHtml: builtHtml,
          previewUrl: `/site/${req.buildId}`,
        };
      } finally {
        await workspace.destroy();
      }
    },
  };
}

function doneLine(t: Task): string {
  switch (t.artifact) {
    case 'brand':
      return 'Brand direction locked.';
    case 'positioning':
      return 'Positioning locked.';
    case 'copy':
      return 'Hero + sections written in your voice.';
    case 'site':
      return 'Homepage assembled and responsive.';
    case 'booking':
      return 'Contact & booking wired.';
    default:
      return `${t.description} — done.`;
  }
}
