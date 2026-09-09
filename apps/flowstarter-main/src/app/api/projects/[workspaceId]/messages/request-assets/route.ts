import 'server-only';
/**
 * POST — run the sufficiency gate and ask the client for what is missing.
 *
 * Operator-only. `requireWorkspaceAccess` returns `via: 'membership'` for a
 * client and `via: 'team'` for team/admin, and only the latter may send an
 * outbound ask — otherwise a client could email themselves from our domain.
 * A client who is not a member still gets 404, not 403, so the two denials
 * cannot be told apart by probing.
 *
 * The gate decides; nothing here calls a model. The response echoes the codes
 * so an operator sees exactly what was asked for and why.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/api-auth';
import {
  MessagingError,
  collectSufficiencyInput,
  requestMissingAssets,
} from '@/lib/flowstarter/messaging';
import { evaluateSufficiency } from '@/lib/flowstarter/sufficiency';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const access = await requireWorkspaceAccess(workspaceId);
  if (!access.authorized) return access.response;
  if (access.via !== 'team') {
    return NextResponse.json(
      { error: 'Operator only', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  try {
    const input = await collectSufficiencyInput(access.workspaceId);
    const sufficiency = evaluateSufficiency(input);
    const result = await requestMissingAssets({
      workspaceId: access.workspaceId,
      missing: sufficiency.missing,
      createdBy: access.userId,
    });

    return NextResponse.json({
      ready: sufficiency.ready,
      missing: sufficiency.missing.map((item) => ({
        code: item.code,
        severity: item.severity,
        affects: item.affects,
      })),
      sent: result.sent,
      ...(result.sent
        ? { messageId: result.messageId, emailed: result.emailed }
        : { reason: result.reason }),
    });
  } catch (error) {
    if (error instanceof MessagingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[api/projects/messages/request-assets] failed', error);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
