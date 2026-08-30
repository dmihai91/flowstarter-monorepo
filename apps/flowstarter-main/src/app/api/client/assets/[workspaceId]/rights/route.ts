import 'server-only';
/**
 * "These are mine, and you may publish them."
 *
 * Rights are confirmed at selection, over a named set of assets — not blanket
 * at upload time. The difference matters: a client dropping twelve photos into
 * a form has not read anything, whereas a client ticking a box beside the four
 * pictures they chose has made a specific, dated statement about specific
 * files. `asset_rights_confirmations` stores that statement verbatim (who, when,
 * from where, and which wording), and it has no update or delete policy, so it
 * cannot be rewritten afterwards.
 *
 * Two writes happen here and they are deliberately in this order: the evidence
 * row first, then the `rights_confirmed_at` stamp on the assets. If the second
 * fails we are left with a confirmation nobody acted on — recoverable. The
 * other order would leave assets marked usable with nothing on record saying
 * why, which is the failure that actually hurts.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireWorkspaceAccess } from '@/lib/api-auth';
import { withTenant } from '@/lib/tenancy';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  CURRENT_RIGHTS_STATEMENT_VERSION,
  KNOWN_RIGHTS_STATEMENT_VERSIONS,
} from '@/components/flowstarter/rights-statement';
import {
  AssetUploadError,
  listWorkspaceAssets,
  clientIp,
  readinessAfterUpload,
  recordAssetEvent,
} from '../../asset-storage';

export const dynamic = 'force-dynamic';

/** One confirmation covers the set a client just chose, not their whole library. */
const MAX_ASSETS_PER_CONFIRMATION = 100;

const BodySchema = z.object({
  assetIds: z
    .array(z.string().uuid())
    .min(1, 'Choose at least one file to confirm')
    .max(MAX_ASSETS_PER_CONFIRMATION),
  /**
   * The wording the client actually saw. Unknown versions are refused rather
   * than coerced: a confirmation is only evidence if we know what it was
   * evidence *of*.
   */
  statementVersion: z.string().min(1).max(64).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const access = await requireWorkspaceAccess(workspaceId);
  if (!access.authorized) return access.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  const statementVersion =
    parsed.data.statementVersion ?? CURRENT_RIGHTS_STATEMENT_VERSION;
  if (!KNOWN_RIGHTS_STATEMENT_VERSIONS.includes(statementVersion)) {
    return NextResponse.json(
      {
        error:
          'That confirmation wording is out of date. Reload and try again.',
      },
      { status: 400 }
    );
  }

  // Duplicates in the body would inflate the stored `asset_ids` array without
  // changing what was confirmed.
  const assetIds = Array.from(new Set(parsed.data.assetIds));

  try {
    const supabase = createSupabaseServiceRoleClient();
    const tenant = withTenant(supabase, access.workspaceId);

    // Every id must belong to THIS workspace. `withTenant` already pins
    // workspace_id on the query, so an id from another tenant simply does not
    // come back — and a partial match is refused outright rather than
    // silently confirming the subset we recognised.
    const { data: ownedRows, error: ownedError } = await tenant
      .from('assets')
      .select('id')
      .in('id', assetIds);
    if (ownedError) throw ownedError;

    const owned = new Set(
      ((ownedRows ?? []) as unknown as Array<{ id: string }>).map(
        (row) => row.id
      )
    );
    if (owned.size !== assetIds.length) {
      // 404, not 403: the response must not tell a prober that an id it does
      // not own is nonetheless real.
      return NextResponse.json(
        { error: 'Those files are not on this project', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const confirmedAt = new Date().toISOString();

    const { data: confirmation, error: confirmationError } = await tenant
      .from('asset_rights_confirmations')
      .insert({
        asset_ids: assetIds,
        // Whoever is signed in, taken from the session — never from the body.
        confirmed_by: access.userId,
        confirmed_at: confirmedAt,
        ip: clientIp(request),
        user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
        statement_version: statementVersion,
      })
      .select('id')
      .maybeSingle<{ id: string }>();
    if (confirmationError) throw confirmationError;

    // Only the listed ids are stamped. `selected` rides along because this IS
    // the selection: the client picked these files and vouched for them in the
    // same gesture, and they are the only two columns a client may ever write.
    const { error: stampError } = await tenant
      .from('assets')
      .update({ rights_confirmed_at: confirmedAt, selected: true })
      .in('id', assetIds);
    if (stampError) throw stampError;

    await recordAssetEvent(
      access.workspaceId,
      'asset_rights_confirmed',
      access.userId,
      {
        assetIds,
        statementVersion,
        confirmationId: confirmation?.id ?? null,
      }
    );

    const assets = await listWorkspaceAssets(access.workspaceId);
    const usable = new Set(
      assets.filter((asset) => asset.usable).map((asset) => asset.id)
    );

    return NextResponse.json(
      {
        confirmationId: confirmation?.id ?? null,
        confirmedAssetIds: assetIds,
        confirmedAt,
        statementVersion,
        assets,
        usableAssetIds: Array.from(usable),
        sufficiency: await readinessAfterUpload(access.workspaceId, usable),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AssetUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error('[api/client/assets/rights] failed', error);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
