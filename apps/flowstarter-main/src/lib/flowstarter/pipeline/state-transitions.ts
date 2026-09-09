/**
 * The one place that says which project-state moves an operator may make.
 *
 * The client-facing flow only ever moves a project forward, one step at a
 * time, in response to something real happening (a preview rendered, a deposit
 * cleared, a build finished). An operator override exists for when that chain
 * breaks — a webhook that never arrived, a build marked done by hand — so it
 * has to be able to nudge a project one step forward, and one step back when a
 * correction went too far.
 *
 * What it must NOT be able to do is jump. Skipping from INTAKE to
 * LIVE_SUBSCRIPTION would leave every intermediate side effect (deposit,
 * build, QA) unrecorded and unbilled, and there would be no audit row saying
 * which of them were skipped. So the map is deliberately narrow: neighbours
 * only. Two steps take two overrides, and both get written to project_events.
 *
 * Enforced server-side in the pipeline API. The UI reads the same map so the
 * two cannot drift, but the UI is not the guard.
 */
import { ProjectState } from '@flowstarter/agentic-codegen/src/flowstarter/types';

/** Lifecycle order. Index distance is what "one step" means. */
export const PROJECT_STATE_ORDER: readonly ProjectState[] = [
  ProjectState.INTAKE,
  ProjectState.PREVIEW_READY,
  ProjectState.DEPOSIT_PAID,
  ProjectState.AGENTS_WORKING,
  ProjectState.HUMAN_QA,
  ProjectState.LIVE_SUBSCRIPTION,
];

/**
 * Explicit, not derived. A reader should be able to see every legal move
 * without running the index arithmetic in their head, and a future exception
 * (say, allowing HUMAN_QA -> PREVIEW_READY for a rebuild) has an obvious place
 * to live.
 */
export const ALLOWED_STATE_TRANSITIONS: Readonly<
  Record<ProjectState, readonly ProjectState[]>
> = {
  [ProjectState.INTAKE]: [ProjectState.PREVIEW_READY],
  [ProjectState.PREVIEW_READY]: [
    ProjectState.DEPOSIT_PAID,
    ProjectState.INTAKE,
  ],
  [ProjectState.DEPOSIT_PAID]: [
    ProjectState.AGENTS_WORKING,
    ProjectState.PREVIEW_READY,
  ],
  [ProjectState.AGENTS_WORKING]: [
    ProjectState.HUMAN_QA,
    ProjectState.DEPOSIT_PAID,
  ],
  [ProjectState.HUMAN_QA]: [
    ProjectState.LIVE_SUBSCRIPTION,
    ProjectState.AGENTS_WORKING,
  ],
  [ProjectState.LIVE_SUBSCRIPTION]: [ProjectState.HUMAN_QA],
};

const PROJECT_STATE_VALUES = new Set<string>(Object.values(ProjectState));

/** Narrows a database string to the enum without re-declaring its members. */
export function asProjectState(
  value: string | null | undefined
): ProjectState | null {
  return value && PROJECT_STATE_VALUES.has(value)
    ? (value as ProjectState)
    : null;
}

/** The states an operator may move `from` to. Empty for an unknown state. */
export function allowedNextStates(from: ProjectState): readonly ProjectState[] {
  return ALLOWED_STATE_TRANSITIONS[from] ?? [];
}

export function isAllowedTransition(
  from: ProjectState,
  to: ProjectState
): boolean {
  return allowedNextStates(from).includes(to);
}

/**
 * Human-readable rejection, used verbatim in the 422 body so the operator is
 * told what they *can* do rather than just that they failed.
 */
export function describeRejectedTransition(
  from: ProjectState,
  to: ProjectState
): string {
  const allowed = allowedNextStates(from);
  if (from === to) {
    return `Project is already in ${from}`;
  }
  return allowed.length === 0
    ? `${from} is not a state an operator can move out of`
    : `${from} -> ${to} is not an allowed move. From ${from} you may go to: ${allowed.join(
        ', '
      )}`;
}
