/**
 * Daytona Preview API
 *
 * POST /api/daytona/preview - Start preview with files
 * PUT /api/daytona/preview - Refresh preview with updated files
 * DELETE /api/daytona/preview - Stop preview
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { startPreview, refreshPreview, stopPreview, getCachedPreviewUrl } from '~/lib/services/daytonaService.server';

interface PreviewRequest {
  projectId: string;
  files?: Record<string, string>;
}

interface CloudflareEnv {
  DAYTONA_API_KEY?: string;
  DAYTONA_API_URL?: string;
}

export async function action({ request, context }: ActionFunctionArgs) {
  const method = request.method.toUpperCase();

  // Get environment variables from Cloudflare context
  const env = (context?.cloudflare?.env || context?.env || {}) as CloudflareEnv;

  try {
    const body = (await request.json()) as PreviewRequest;
    const { projectId, files } = body;

    if (!projectId) {
      return json({ error: 'Project ID is required' }, { status: 400 });
    }

    switch (method) {
      case 'POST': {
        // Start new preview
        if (!files || Object.keys(files).length === 0) {
          return json({ error: 'Files are required to start preview' }, { status: 400 });
        }

        console.log(`[API] Starting preview for project ${projectId} with ${Object.keys(files).length} files`);

        const result = await startPreview(projectId, files, env);

        console.log(`[API] startPreview result:`, {
          success: result.success,
          hasPreviewUrl: !!result.previewUrl,
          hasSandboxId: !!result.sandboxId,
          hasError: !!result.error,
          hasBuildError: !!result.buildError,
          buildErrorFile: result.buildError?.file,
          errorPreview: result.error?.slice(0, 150),
        });

        if (result.success) {
          return json({
            success: true,
            previewUrl: result.previewUrl,
            sandboxId: result.sandboxId,
          });
        } else {
          // Include buildError details if available for the agent to fix
          const response: Record<string, unknown> = {
            success: false,
            error: result.error,
          };

          /*
           * Add structured build error info if present
           * Use direct property access since TypeScript knows buildError is optional
           */
          if (result.buildError) {
            response.buildError = result.buildError;
            console.log(`[API] Build error detected, including buildError in response:`, {
              file: result.buildError.file,
              line: result.buildError.line,
              message: result.buildError.message,
            });
          } else {
            console.log(`[API] No buildError in result - error is not a build error`);
          }

          console.log(`[API] Returning error response with buildError: ${!!response.buildError}`);

          return json(response, { status: 500 });
        }
      }

      case 'PUT': {
        // Refresh preview with updated files
        if (!files || Object.keys(files).length === 0) {
          return json({ error: 'Files are required to refresh preview' }, { status: 400 });
        }

        console.log(`[API] Refreshing preview for project ${projectId}`);

        const result = await refreshPreview(projectId, files, env);

        if (result.success) {
          return json({
            success: true,
            previewUrl: result.previewUrl,
            sandboxId: result.sandboxId,
          });
        } else {
          return json(
            {
              success: false,
              error: result.error,
            },
            { status: 500 },
          );
        }
      }

      case 'DELETE': {
        // Stop preview
        console.log(`[API] Stopping preview for project ${projectId}`);
        await stopPreview(projectId, env);

        return json({ success: true });
      }

      default:
        return json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (e) {
    console.error('[API] Daytona preview error:', e);

    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

// GET - Check preview status
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  if (!projectId) {
    return json({ error: 'Project ID is required' }, { status: 400 });
  }

  const previewUrl = getCachedPreviewUrl(projectId);

  return json({
    hasPreview: !!previewUrl,
    previewUrl,
  });
}

