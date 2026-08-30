import 'server-only';
/**
 * POST /api/client/site/[workspaceId]/revert — go back to an earlier version.
 *
 * Reverting appends rather than rewinds: version 3's manifest becomes version
 * 7. Nothing a client did is deleted from the record, the version they are
 * looking at always has a number, and reverting a revert is just another
 * revert. A destructive rewind would also race badly with a concurrent apply.
 *
 * Undoing a change is not itself a change to the site's structure, so it sits
 * under the same `content` capability the edits did: a lapsed subscription
 * stops new edits, and stops undoing them too, which keeps the site in a state
 * both sides agreed to rather than one a lapsed client rolled back unilaterally.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  loadSiteVersion,
  recordSiteEditorEvent,
  saveSiteVersion,
} from '@/lib/flowstarter/site-editor';
import {
  openSiteEditorContext,
  readJsonBody,
  refuseUnlessAllowed,
  siteEditorFailure,
} from '../../site-editor-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RevertSchema = z.object({
  version: z.number().int().positive().max(100_000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const opened = await openSiteEditorContext(workspaceId);
  if (!opened.ok) return opened.response;
  const { context } = opened;

  const refusal = refuseUnlessAllowed(
    context,
    'content',
    'inline_content_agent'
  );
  if (refusal) return refusal;

  try {
    const parsed = RevertSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Send the version number to go back to.', code: 'INVALID' },
        { status: 400 }
      );
    }
    const target = parsed.data.version;
    if (target === context.site.version) {
      return NextResponse.json(
        { error: 'That is already the current version.', code: 'INVALID' },
        { status: 400 }
      );
    }

    // Scoped to the workspace, so a version number from another tenant's
    // history is simply not found.
    const files = await loadSiteVersion(context.workspaceId, target);

    const version = await saveSiteVersion({
      workspaceId: context.workspaceId,
      files,
      summary: `Reverted to version ${target}`,
      createdBy: context.access.actorId,
      baseline: context.site.files,
    });

    await recordSiteEditorEvent({
      workspaceId: context.workspaceId,
      kind: 'site_reverted',
      actor: context.access.actorId,
      payload: { revertedTo: target, version },
    });

    return NextResponse.json({ version, revertedTo: target });
  } catch (error) {
    return siteEditorFailure(error);
  }
}
