import 'server-only';
/**
 * POST /api/client/site/[workspaceId]/publish — mark the current version as
 * the one that should go live, and say honestly what still has to happen.
 *
 * WHAT THIS DOES NOT DO, AND WHY. `deploySite` takes a built artifact — a
 * tarball or an HTTPS URL — and hands it to the per-host deploy agent, which
 * extracts it under /var/www/sites and reloads Caddy. What an editor produces
 * is an edited *source* manifest: Astro components and content files. Pushing
 * those to the agent would publish source, not a site, and pushing the last
 * build's `preview_artifact_url` instead would publish the client's site
 * without the change they just made and report success. Both are worse than
 * waiting, so neither happens here.
 *
 * What happens instead: the version is stamped `published_at`, an event is
 * recorded, and the response says exactly which of the three preconditions
 * (a host, a configured deploy agent, a build of this version) is missing. The
 * UI prints that rather than a spinner. When a build of the edited manifest
 * exists, this is the place that gains a `deploySite` call with the artifact
 * it produced, using `DryRunDeployAgentClient` wherever
 * `DEPLOY_AGENT_SHARED_SECRET` is unset.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  markVersionPublished,
  recordSiteEditorEvent,
  saveSiteVersion,
} from '@/lib/flowstarter/site-editor';
import { findBuiltIndex } from '@/lib/flowstarter/site-preview';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  openSiteEditorContext,
  refuseUnlessAllowed,
  siteEditorFailure,
} from '../../site-editor-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HostingRow {
  deploy_agent_url: string | null;
}

export async function POST(
  _request: NextRequest,
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
    // A site that has never been edited has no snapshot yet; publishing it
    // means recording the delivered manifest as version 1 so there is a
    // version to name.
    let version = context.site.version;
    if (version === 0) {
      version = await saveSiteVersion({
        workspaceId: context.workspaceId,
        files: context.site.files,
        summary: 'The site as it was delivered',
        createdBy: context.access.actorId,
      });
    }
    await markVersionPublished(context.workspaceId, version);

    const supabase = createSupabaseServiceRoleClient();
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('hosting_server_id, slug, deploy_status')
      .eq('id', context.workspaceId)
      .maybeSingle();

    let deployAgentUrl: string | null = null;
    if (workspace?.hosting_server_id) {
      const { data: host } = await supabase
        .from('hosting_servers')
        .select('deploy_agent_url')
        .eq('id', workspace.hosting_server_id)
        .maybeSingle<HostingRow>();
      deployAgentUrl = host?.deploy_agent_url ?? null;
    }

    const hasHost = Boolean(workspace?.hosting_server_id);
    const agentConfigured = Boolean(
      deployAgentUrl && process.env.DEPLOY_AGENT_SHARED_SECRET?.trim()
    );
    const hasBuild = Boolean(findBuiltIndex(context.site.files));

    // Named so the UI does not have to guess which sentence to print.
    const mode = !hasHost
      ? 'no_host'
      : !hasBuild
        ? 'awaiting_build'
        : agentConfigured
          ? 'agent'
          : 'dry_run';

    const detail: Record<typeof mode, string> = {
      no_host: 'This project does not have a server allocated yet, so your change is saved and marked to publish. We will put it live when the site is hosted.',
      awaiting_build:
        'Your change is saved and marked to publish. The site is rebuilt from these files before it goes live, and we run that build for you — nothing else is needed from you.',
      dry_run:
        'Your change is saved and marked to publish. This environment has no deploy agent configured, so nothing was pushed to a server (dry run).',
      agent:
        'Your change is saved and marked to publish, and this project has a live host ready to receive it.',
    };

    await recordSiteEditorEvent({
      workspaceId: context.workspaceId,
      kind: 'site_publish_requested',
      actor: context.access.actorId,
      payload: { version, mode, hasHost, agentConfigured, hasBuild },
    });

    return NextResponse.json({
      version,
      deploy: {
        mode,
        detail: detail[mode],
        hasHost,
        agentConfigured,
        hasBuild,
      },
    });
  } catch (error) {
    return siteEditorFailure(error);
  }
}
