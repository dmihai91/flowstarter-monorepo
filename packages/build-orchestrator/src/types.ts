// Orchestrator domain types. Task-graph model follows gretly's planner output:
// discrete tasks with capabilities, per-task specialist system prompts, and
// depends_on edges for natural parallelism.
import type { AgentId } from '@flowstarter/build-engine';

export type Capability = 'research' | 'branding' | 'copywriting' | 'implement' | 'review';

export type TaskStatus = 'waiting' | 'running' | 'done' | 'failed';

export interface Task {
  id: string;
  /** User-visible description — becomes the build-feed line. */
  description: string;
  capability: Capability;
  /** Which crew persona fronts this task in the UI. */
  agentRole: AgentId;
  /** Specialist system prompt, written by the planner "as if hiring an expert for this exact step". */
  system: string;
  /** The exact instruction for the agent. */
  input: string;
  depends_on: string[];
  /** Artifact id this task unlocks in the deliverables timeline (brand/positioning/copy/site/booking). */
  artifact?: string;
  status: TaskStatus;
  output?: string;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

export interface Plan {
  goal: string;
  tasks: Task[];
}

/** Effort tier from triage — gates how much machinery a build gets (ask-sage). */
export type EffortTier = 'standard' | 'rich';

export interface AgentRunContext {
  buildId: string;
  goal: string;
  /** Outputs of completed dependency tasks, keyed by task id. */
  priorResults: Record<string, string>;
  /** Absolute path of the build workspace (sandbox-as-truth). */
  workspaceDir: string;
}

export interface AgentAdapter {
  readonly name: string;
  run(task: Task, ctx: AgentRunContext): Promise<string>;
}

export interface TaskUpdateCallback {
  (t: {
    buildId: string;
    taskId: string;
    description: string;
    agentRole: string;
    capability: string;
    status: string;
    dependsOn: string[];
    output?: string;
    error?: string;
    startedAt?: number;
    finishedAt?: number;
  }): void;
}

export interface OrchestratorOptions {
  /** Live task-state sink (Convex in the app). */
  onTaskUpdate?: TaskUpdateCallback;
  /** Max concurrent agent runs per wave (gretly default: 4). */
  concurrency?: number;
  /** Max planner→validate→replan rounds. */
  maxPlanRounds?: number;
  /** Per-task wall-clock timeout ms (agentic-codegen discipline). */
  taskTimeoutMs?: number;
}
