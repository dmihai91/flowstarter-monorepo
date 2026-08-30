import 'server-only';
/**
 * The three things every client-site route does before it does anything else,
 * in the only order that is safe:
 *
 *   1. `requireWorkspaceAccess` — a non-member gets 404 and no query runs.
 *   2. load the workspace's site, including its real subscription status.
 *   3. `resolveEditorPolicy`, over the capability the *request* actually asks
 *      for, not the one the UI thinks it offered.
 *
 * Step 3 is the reason this is shared rather than copied. The editor's panel
 * hides controls a client may not use, but hidden is not denied: a request
 * that names a stylesheet or a component is classified again here and refused
 * with the policy's own words. A route that forgot to do that would be a route
 * where the UI *was* the authorization.
 *
 * Everything below step 1 uses the service-role client, which bypasses RLS, so
 * that first check is the entire tenant boundary.
 */
import { NextResponse } from 'next/server';
import type { EditorCapability } from '@flowstarter/agentic-codegen/src/flowstarter/editor-policy';
import { requireWorkspaceAccess } from '@/lib/api-auth';
import {
  SiteEditorError,
  decideEditorAction,
  loadWorkspaceSite,
  policyStatus,
  type EditorAccess,
  type WorkspaceSite,
} from '@/lib/flowstarter/site-editor';

export interface SiteEditorContext {
  workspaceId: string;
  access: EditorAccess;
  site: WorkspaceSite;
}

export type ContextResult =
  | { ok: true; context: SiteEditorContext }
  | { ok: false; response: NextResponse };

/**
 * A team member reaching a client's editor is an `operator` to the policy,
 * which routes them to the isolated workbench rather than the client tier.
 * That refusal is deliberate and is surfaced, not worked around.
 */
export async function openSiteEditorContext(
  workspaceId: string
): Promise<ContextResult> {
  const access = await requireWorkspaceAccess(workspaceId);
  if (!access.authorized) return { ok: false, response: access.response };

  try {
    const site = await loadWorkspaceSite(access.workspaceId);
    return {
      ok: true,
      context: {
        workspaceId: access.workspaceId,
        access: {
          actorId: access.userId,
          role: access.via === 'team' ? 'operator' : 'client',
          subscriptionStatus: site.subscriptionStatus,
        },
        site,
      },
    };
  } catch (error) {
    return { ok: false, response: siteEditorFailure(error) };
  }
}

/**
 * Runs the policy and turns a refusal into a response the UI can render
 * verbatim. `action` travels with it so the panel can say "ask us to do it"
 * for a maintenance request and "your plan has lapsed" for a denial, without
 * re-deriving either from the message.
 */
export function refuseUnlessAllowed(
  context: SiteEditorContext,
  capability: EditorCapability,
  allowed: 'inline_content_agent' | 'client_media_upload'
): NextResponse | null {
  const decision = decideEditorAction(context.access, capability);
  if (decision.action === allowed) return null;
  return NextResponse.json(
    {
      error: decision.reason,
      code: 'EDITOR_POLICY',
      policy: { action: decision.action, reason: decision.reason, capability },
    },
    { status: policyStatus(decision) }
  );
}

/** One error mapping, so a stale apply is a 409 wherever it is raised. */
export function siteEditorFailure(error: unknown): NextResponse {
  if (error instanceof SiteEditorError) {
    return NextResponse.json(
      { error: error.message, code: error.code.toUpperCase() },
      { status: error.status }
    );
  }
  console.error('[api/client/site] request failed', error);
  return NextResponse.json(
    { error: 'Something went wrong on our side.', code: 'INTERNAL' },
    { status: 500 }
  );
}

/** Bodies are small JSON objects; anything else is refused before parsing. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new SiteEditorError('Send a JSON body', 'invalid', 400);
  }
}
