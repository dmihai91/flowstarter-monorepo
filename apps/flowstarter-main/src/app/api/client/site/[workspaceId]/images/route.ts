import 'server-only';
/**
 * GET  — the picture slots the site renders, and the client's own files that
 *        may go into one.
 * POST — put asset X into slot Y.
 *
 * Two conditions decide whether an asset may be placed, and both are checked
 * against the database rather than against what the browser sent:
 *
 *   - it belongs to this workspace, and
 *   - `rights_confirmed_at` is set.
 *
 * The second is the point of the rights step. Uploading a file says "here is a
 * picture"; only the confirmation says "I own this and you may publish it". An
 * asset without one is listed as unusable and refused here, because publishing
 * a photograph nobody claimed is the client's legal problem and our fault.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  SiteEditorError,
  listManifestImageSlots,
  recordSiteEditorEvent,
  saveSiteVersion,
  swapManifestImage,
} from '@/lib/flowstarter/site-editor';
import {
  TENANT_ASSET_BUCKET,
  listWorkspaceAssets,
} from '@/app/api/client/assets/asset-storage';
import { assertTenantPath } from '@/lib/storage-paths';
import { withTenant } from '@/lib/tenancy';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  openSiteEditorContext,
  readJsonBody,
  refuseUnlessAllowed,
  siteEditorFailure,
} from '../../site-editor-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SwapSchema = z.object({
  slotId: z.string().min(1).max(300),
  assetId: z.string().uuid(),
  /** Optional new alt text; the template keeps it beside the image. */
  alt: z.string().max(160).optional(),
});

interface AssetRow {
  id: string;
  storage_path: string | null;
  mime: string | null;
  rights_confirmed_at: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const opened = await openSiteEditorContext(workspaceId);
  if (!opened.ok) return opened.response;
  const { context } = opened;

  const refusal = refuseUnlessAllowed(context, 'image', 'client_media_upload');
  if (refusal) return refusal;

  try {
    const [slots, assets] = await Promise.all([
      listManifestImageSlots(context.site.files),
      listWorkspaceAssets(context.workspaceId),
    ]);
    return NextResponse.json({
      slots,
      // Both halves are returned, with `usable` intact, so the panel can show
      // an un-confirmed photograph greyed out with the reason rather than
      // pretending the client never uploaded it.
      assets,
    });
  } catch (error) {
    return siteEditorFailure(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const opened = await openSiteEditorContext(workspaceId);
  if (!opened.ok) return opened.response;
  const { context } = opened;

  const refusal = refuseUnlessAllowed(context, 'image', 'client_media_upload');
  if (refusal) return refusal;

  try {
    const parsed = SwapSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Send a slotId and the id of one of your files.', code: 'INVALID' },
        { status: 400 }
      );
    }
    const { slotId, assetId, alt } = parsed.data;

    const supabase = createSupabaseServiceRoleClient();
    // `withTenant` pins workspace_id on the query, so an asset id from another
    // tenant is simply not found rather than found and then rejected.
    const { data: asset } = await withTenant(supabase, context.workspaceId)
      .from('assets')
      .select('id, storage_path, mime, rights_confirmed_at')
      .eq('id', assetId)
      .maybeSingle<AssetRow>();

    if (!asset) {
      return NextResponse.json(
        { error: 'That file is not in your library', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    if (!asset.rights_confirmed_at) {
      return NextResponse.json(
        {
          error:
            'Confirm you own this picture before it goes on your site. Tick the rights box beside it in your files.',
          code: 'RIGHTS_NOT_CONFIRMED',
        },
        { status: 400 }
      );
    }
    if (!asset.storage_path) {
      return NextResponse.json(
        { error: 'That file has no stored copy', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    // A row whose path points outside this tenant is a bug worth refusing on
    // the way past rather than downloading.
    assertTenantPath(asset.storage_path, context.workspaceId);

    const download = await supabase.storage
      .from(TENANT_ASSET_BUCKET)
      .download(asset.storage_path);
    if (download.error || !download.data) {
      return NextResponse.json(
        { error: 'That file could not be read', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    const bytes = Buffer.from(await download.data.arrayBuffer());

    // `swapManifestImage` re-verifies the bytes with `assertSafeUploadedImage`,
    // so a row that was written before that check existed still cannot put an
    // SVG on a client's site.
    const swapped = await swapManifestImage({
      files: context.site.files,
      slotId,
      bytes,
      ...(alt === undefined ? {} : { alt }),
    });

    const version = await saveSiteVersion({
      workspaceId: context.workspaceId,
      files: swapped.files,
      summary: `Replaced the picture in ${slotId}`,
      createdBy: context.access.actorId,
      baseline: context.site.files,
    });

    await recordSiteEditorEvent({
      workspaceId: context.workspaceId,
      kind: 'site_image_replaced',
      actor: context.access.actorId,
      payload: {
        slotId,
        assetId,
        version,
        changedPaths: swapped.changedPaths,
        previousPath: swapped.previousPath,
        publicPath: swapped.publicPath,
      },
    });

    return NextResponse.json({
      version,
      slotId: swapped.slotId,
      publicPath: swapped.publicPath,
      previousPath: swapped.previousPath,
      changedPaths: swapped.changedPaths,
    });
  } catch (error) {
    if (error instanceof SiteEditorError) return siteEditorFailure(error);
    if (error instanceof Error && /image|slot/i.test(error.message)) {
      // `assertSafeUploadedImage` and `replaceSiteImage` throw plain Errors
      // whose messages are already written for the client.
      return NextResponse.json(
        { error: error.message, code: 'IMAGE_REJECTED' },
        { status: 400 }
      );
    }
    return siteEditorFailure(error);
  }
}
