export type EditorActorRole = 'operator' | 'client';
export type SubscriptionAccessStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'none';

export type EditorCapability =
  | 'content'
  | 'image'
  | 'color'
  | 'font'
  | 'section_visibility'
  | 'section_order'
  | 'layout'
  | 'integration'
  | 'code';

export interface EditorAuthorizationContext {
  actorId: string;
  role: EditorActorRole;
  subscriptionStatus: SubscriptionAccessStatus;
}

export type EditorPolicyDecision =
  | { action: 'inline_content_agent'; reason: string }
  | { action: 'operator_workbench'; reason: string }
  | { action: 'maintenance_request'; reason: string }
  | { action: 'deny'; reason: string };

/**
 * Server-side editor capability routing. Client UI visibility is never an
 * authorization boundary: every request is classified again before an agent
 * or workspace receives it.
 */
export function resolveEditorPolicy(
  context: EditorAuthorizationContext,
  capability: EditorCapability,
): EditorPolicyDecision {
  if (!context.actorId.trim())
    return { action: 'deny', reason: 'Missing authenticated actor' };
  if (context.role === 'operator') {
    return {
      action: 'operator_workbench',
      reason: 'Operators use the isolated full editor',
    };
  }
  if (
    context.subscriptionStatus !== 'active' &&
    context.subscriptionStatus !== 'trialing'
  ) {
    return {
      action: 'deny',
      reason: 'An active care subscription is required',
    };
  }
  if (capability === 'content') {
    return {
      action: 'inline_content_agent',
      reason:
        'Localized plain-text changes are included in client self-service',
    };
  }
  return {
    action: 'maintenance_request',
    reason: `${capability} changes require Flowstarter review under the care plan`,
  };
}
