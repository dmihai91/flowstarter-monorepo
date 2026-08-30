import 'server-only';
/**
 * POST /api/client/site/[workspaceId]/apply — commit a proposed change.
 *
 * No model runs here. The browser sends back the replacement it was shown
 * along with the original it was shown beside, and `applyTargetEdit` refuses
 * unless that original still matches the site as it stands right now. Two tabs,
 * or two people, editing the same headline would otherwise end with the second
 * apply silently discarding a change its author never saw.
 *
 * The replacement is re-validated as plain text, because a caller can post
 * here without ever calling `/edit`, and the policy is re-run over the target's
 * real capability for the same reason.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  MAX_REPLACEMENT_CHARS,
  applyTargetEdit,
  classifyTargetCapability,
  latestProposalFingerprint,
  listEditableTargets,
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

const ApplySchema = z.object({
  targetId: z.string().min(1).max(300),
  originalContent: z.string().max(MAX_REPLACEMENT_CHARS),
  replacementContent: z.string().min(1).max(MAX_REPLACEMENT_CHARS),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const opened = await openSiteEditorContext(workspaceId);
  if (!opened.ok) return opened.response;
  const { context } = opened;

  try {
    const parsed = ApplySchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Send a targetId, the original text and the replacement.', code: 'INVALID' },
        { status: 400 }
      );
    }
    const { targetId, originalContent, replacementContent } = parsed.data;

    const capability = classifyTargetCapability(context.site.files, targetId);
    const refusal = refuseUnlessAllowed(
      context,
      capability,
      'inline_content_agent'
    );
    if (refusal) return refusal;

    const applied = applyTargetEdit({
      files: context.site.files,
      targetId,
      originalContent,
      replacementContent,
    });

    const version = await saveSiteVersion({
      workspaceId: context.workspaceId,
      files: applied.files,
      summary: `Edited ${applied.target.key} in ${applied.target.section}`,
      createdBy: context.access.actorId,
      baseline: context.site.files,
    });

    await recordSiteEditorEvent({
      workspaceId: context.workspaceId,
      kind: 'site_edited',
      actor: context.access.actorId,
      payload: {
        targetId,
        changedPaths: applied.changedPaths,
        version,
        instructionSha256: await latestProposalFingerprint(
          context.workspaceId,
          targetId
        ),
      },
    });

    return NextResponse.json({
      version,
      changedPaths: applied.changedPaths,
      // The panel redraws from these: line numbers below the edit may have
      // shifted if a block scalar changed length.
      targets: listEditableTargets(applied.files).map((target) => ({
        id: target.id,
        key: target.key,
        section: target.section,
        content: target.content,
        file: target.file,
        line: target.line,
      })),
    });
  } catch (error) {
    return siteEditorFailure(error);
  }
}
