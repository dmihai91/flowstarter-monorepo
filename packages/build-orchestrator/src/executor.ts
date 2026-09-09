// Wave executor — gretly's worker model: all ready tasks (deps satisfied) run
// in parallel under a concurrency cap; one agent failing never kills the wave;
// downstream tasks of a failed task cascade-fail.
import type { AgentAdapter, AgentRunContext, Plan, Task, TaskUpdateCallback } from './types';

export interface ExecutorEvents {
  onTaskStart?: (task: Task) => void | Promise<void>;
  onTaskDone?: (task: Task) => void | Promise<void>;
  onTaskFail?: (task: Task) => void | Promise<void>;
}

export async function executePlan(args: {
  buildId: string;
  plan: Plan;
  adapter: AgentAdapter;
  workspaceDir: string;
  concurrency: number;
  taskTimeoutMs: number;
  onTaskUpdate?: TaskUpdateCallback;
  events?: ExecutorEvents;
}): Promise<Plan> {
  const { plan, adapter } = args;
  const byId = new Map(plan.tasks.map((t) => [t.id, t]));
  const results: Record<string, string> = {};

  const publish = (t: Task) =>
    args.onTaskUpdate?.({
      buildId: args.buildId,
      taskId: t.id,
      description: t.description,
      agentRole: t.agentRole,
      capability: t.capability,
      status: t.status,
      dependsOn: t.depends_on,
      output: t.output?.slice(0, 4000),
      error: t.error,
      startedAt: t.startedAt,
      finishedAt: t.finishedAt,
    });

  plan.tasks.forEach(publish);

  const ready = () =>
    plan.tasks.filter(
      (t) => t.status === 'waiting' && t.depends_on.every((d) => byId.get(d)?.status === 'done'),
    );

  const blocked = () =>
    plan.tasks.filter(
      (t) => t.status === 'waiting' && t.depends_on.some((d) => byId.get(d)?.status === 'failed'),
    );

  async function runTask(t: Task): Promise<void> {
    t.status = 'running';
    t.startedAt = Date.now();
    publish(t);
    await args.events?.onTaskStart?.(t);
    const ctx: AgentRunContext = {
      buildId: args.buildId,
      goal: plan.goal,
      priorResults: Object.fromEntries(t.depends_on.map((d) => [d, results[d] ?? ''])),
      workspaceDir: args.workspaceDir,
    };
    try {
      const timeout = new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error(`task ${t.id} timed out`)), args.taskTimeoutMs),
      );
      const output = await Promise.race([adapter.run(t, ctx), timeout]);
      t.status = 'done';
      t.output = output;
      t.finishedAt = Date.now();
      results[t.id] = output;
      publish(t);
      await args.events?.onTaskDone?.(t);
    } catch (e) {
      t.status = 'failed';
      t.error = e instanceof Error ? e.message : String(e);
      t.finishedAt = Date.now();
      publish(t);
      await args.events?.onTaskFail?.(t);
    }
  }

  // Wave loop: run ready tasks (capped), repeat until nothing can move.
  while (true) {
    // Cascade-fail tasks whose dependencies failed.
    for (const t of blocked()) {
      t.status = 'failed';
      t.error = `dependency failed: ${t.depends_on.find((d) => byId.get(d)?.status === 'failed')}`;
      publish(t);
    }
    const wave = ready();
    if (wave.length === 0) break;
    // Concurrency cap within the wave.
    for (let i = 0; i < wave.length; i += args.concurrency) {
      await Promise.all(wave.slice(i, i + args.concurrency).map(runTask));
    }
  }

  return plan;
}
