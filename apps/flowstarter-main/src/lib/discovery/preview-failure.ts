/**
 * Which preview failures are worth one clean restart.
 *
 * The session runner inside the codegen package already retries each model
 * turn. What reaches the route is a stage that stayed down, or a publish step
 * that could not get a server up. Those are the provider's weather and a
 * restart from the top has a real chance. The operator's own ceilings (run
 * budget, configuration) and a rejected intake are not on the list: a second
 * run would hit them again at the same cost, and the visitor is better served
 * by the plainer demo now than by the same failure in ten minutes.
 */
const TRANSIENT_PREVIEW_FAILURE =
  /Pi session failed|timed out|returned no output|finish_reason|fetch failed|ECONN|socket hang up|network|did not return JSON|did not return an object|invalid JSON|personalization failed/i;

/**
 * A preview server that would not start is the workspace's fault (a file
 * that does not build) or the machine's (a port, a dependency): the same
 * again ten minutes later either way.
 */
const NOT_WORTH_RESTARTING = /did not become ready|sandbox unavailable/i;

export function isTransientPipelineFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'PiRunBudgetExceededError') return false;
  if (error.name === 'PiRunDeadlineExceededError') return false;
  if (NOT_WORTH_RESTARTING.test(error.message)) return false;
  return TRANSIENT_PREVIEW_FAILURE.test(error.message);
}
