import 'server-only';
/**
 * GET /api/client/site/[workspaceId]/preview/[...path]
 *
 * The workspace's own site, served out of its stored manifest so the editor
 * can frame it. Nothing here reads the filesystem: a path names a key of a
 * JSON document, and `resolveManifestFile` refuses `..`, backslashes, absolute
 * paths and NUL bytes before it even looks. A traversal attempt therefore
 * cannot succeed, and gets the same 404 as a typo.
 *
 * `requireWorkspaceAccess` runs first, before the manifest is read, because
 * everything below it is a service-role query that bypasses RLS.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  listEditableTargets,
  type SiteFile,
} from '@/lib/flowstarter/site-editor';
import {
  contentTypeForPath,
  findBuiltIndex,
  injectSelectionBridge,
  isUnsafePreviewPath,
  previewHeaders,
  renderContentPreview,
  resolveManifestFile,
} from '@/lib/flowstarter/site-preview';
import {
  openSiteEditorContext,
  siteEditorFailure,
} from '../../../site-editor-context';

export const dynamic = 'force-dynamic';

/** A 404 that says nothing about what the manifest does contain. */
function missing(): NextResponse {
  return new NextResponse('Not found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function serve(file: SiteFile): NextResponse {
  const contentType = contentTypeForPath(file.path);
  if (file.encoding === 'base64') {
    const bytes = Buffer.from(file.content, 'base64');
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: previewHeaders(contentType),
    });
  }
  // A stored HTML page gets the selection bridge; everything else is verbatim.
  const body = contentType.startsWith('text/html')
    ? injectSelectionBridge(file.content)
    : file.content;
  return new NextResponse(body, {
    status: 200,
    headers: previewHeaders(contentType),
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; path?: string[] }> }
) {
  const { workspaceId, path } = await params;
  const opened = await openSiteEditorContext(workspaceId);
  if (!opened.ok) return opened.response;
  const { context } = opened;

  const segments = path ?? [];
  if (isUnsafePreviewPath(segments)) return missing();

  try {
    const files = context.site.files;
    const isIndex =
      segments.length === 0 ||
      (segments.length === 1 && segments[0] === 'index.html');

    if (isIndex) {
      const built = findBuiltIndex(files);
      if (built) return serve(built);
      // Astro sources cannot be rendered without a build, so the frame shows
      // the site's content rather than a page it is not.
      return new NextResponse(
        renderContentPreview({
          files,
          targets: listEditableTargets(files),
          siteName: context.site.workspaceName,
          templateSlug: context.site.templateSlug,
          version: context.site.version,
        }),
        { status: 200, headers: previewHeaders('text/html; charset=utf-8') }
      );
    }

    const file = resolveManifestFile(files, segments);
    return file ? serve(file) : missing();
  } catch (error) {
    return siteEditorFailure(error);
  }
}
