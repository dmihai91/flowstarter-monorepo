import 'server-only';
/**
 * GET /api/client/site/[workspaceId]/changes — the client's change requests,
 * newest first, with the quote on each where there is one.
 */
import { NextResponse } from 'next/server';
import {
  listChangeRequests,
  toChangeRequestView,
} from '@/lib/flowstarter/change-requests';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  openSiteEditorContext,
  siteEditorFailure,
} from '../../site-editor-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const opened = await openSiteEditorContext(workspaceId);
  if (!opened.ok) return opened.response;
  try {
    const rows = await listChangeRequests(
      createSupabaseServiceRoleClient(),
      opened.context.workspaceId
    );
    return NextResponse.json(
      { requests: rows.map((row) => toChangeRequestView(row)) },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return siteEditorFailure(error);
  }
}
