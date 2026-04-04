/**
 * Publish API Route
 *
 * Two publish paths:
 * - Team: Build in sandbox → upload bundle to Supabase → deploy to Cloudflare Pages.
 * - Client: Load files from Convex → deploy directly to Cloudflare Pages (no sandbox).
 */

import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { getAuth } from '@clerk/remix/ssr.server';
import { createClient } from '@supabase/supabase-js';
import { api } from '~/convex/_generated/api';
import { hasServerTeamAccess } from '~/lib/auth/serverTeamAccess';
import { getConvexClient } from '~/lib/services/daytona/convexClient';

function getClientSessionToken(request: Request): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check cookie
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(/fs-client-session=([^;]+)/);
  return match ? match[1] : null;
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { projectId, customDomain } = (await request.json()) as {
    projectId?: string;
    customDomain?: string;
  };

  if (!projectId) {
    return json({ error: 'projectId required' }, { status: 400 });
  }

  const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!cloudflareAccountId || !cloudflareApiToken) {
    return json({ error: 'Cloudflare credentials not configured' }, { status: 500 });
  }

  // --- Auth: determine if team or client ---
  let publisherType: 'team' | 'client' = 'client';
  let publisherId: string | null = null;

  const auth = await getAuth(args);
  if (auth.userId && hasServerTeamAccess(auth.sessionClaims)) {
    publisherType = 'team';
    publisherId = auth.userId;
  } else {
    // Check for client session
    const sessionToken = getClientSessionToken(request);
    if (!sessionToken) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const convex = getConvexClient();
    if (!convex) {
      return json({ error: 'Service unavailable' }, { status: 503 });
    }

    const session = await convex.query(api.magicLinks.validateClientSessionToken, {
      sessionToken,
    });

    if (!session.valid) {
      return json({ error: 'Invalid client session' }, { status: 401 });
    }

    // Verify session is for the requested project and has sufficient access
    if (String(session.projectId) !== projectId) {
      return json({ error: 'Project mismatch' }, { status: 403 });
    }

    if (session.accessLevel !== 'customize' && session.accessLevel !== 'full') {
      return json({ error: 'Insufficient access level' }, { status: 403 });
    }

    publisherId = String(session.clientId);
  }

  const cfConfig = { accountId: cloudflareAccountId, apiToken: cloudflareApiToken };
  const projectName = `fs-${projectId}`.slice(0, 63);

  try {
    const { createPagesProject, deployToPages, attachCustomDomain } = await import(
      '@flowstarter/editor-engine/publishing'
    );

    let files: Array<{ path: string; content: Buffer }>;

    if (publisherType === 'team') {
      // --- Team path: build from Daytona sandbox ---
      const { getClient } = await import('@flowstarter/editor-engine/daytona');
      const { buildProject, downloadBundle, validateBundle } = await import(
        '@flowstarter/editor-engine/publishing'
      );

      const client = getClient();
      const sandboxes = await client.list();
      const sandbox = sandboxes.find(
        (s) => (s as unknown as { labels?: Record<string, string> }).labels?.project === projectId,
      );

      if (!sandbox) {
        return json({ error: 'No active workspace found' }, { status: 404 });
      }

      const buildResult = await buildProject(sandbox);
      if (!buildResult.success) {
        return json({ error: `Build failed: ${buildResult.error}` }, { status: 500 });
      }

      files = await downloadBundle(sandbox, buildResult.outputDir);

      const validation = validateBundle(files);
      if (!validation.valid) {
        return json({ error: `Invalid bundle: ${validation.errors.join(', ')}` }, { status: 400 });
      }

      // Upload manifest to Supabase
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const timestamp = Date.now();
        const bundlePath = `bundles/${projectId}/${timestamp}.json`;
        await supabase.storage.from('bundles').upload(
          bundlePath,
          JSON.stringify({
            projectId,
            timestamp,
            fileCount: files.length,
            totalSize: files.reduce((sum, f) => sum + f.content.length, 0),
            files: files.map((f) => ({ path: f.path, size: f.content.length })),
          }),
          { contentType: 'application/json' },
        );
      }
    } else {
      // --- Client path: load pre-built files from Convex ---
      const convex = getConvexClient();
      if (!convex) {
        return json({ error: 'Service unavailable' }, { status: 503 });
      }

      const projectFiles = await convex.query(api.files.list, {
        projectId: projectId as never,
      });

      if (!projectFiles || projectFiles.length === 0) {
        return json({ error: 'No files found for project' }, { status: 404 });
      }

      files = projectFiles
        .filter((f) => f.type === 'file')
        .map((f) => ({
          path: f.path,
          content: Buffer.from(f.content, 'utf-8'),
        }));

      if (files.length === 0) {
        return json({ error: 'No publishable files found' }, { status: 400 });
      }
    }

    // Deploy to Cloudflare Pages
    await createPagesProject(projectName, cfConfig);
    const deployment = await deployToPages(projectName, files, cfConfig);

    // Attach custom domain if provided
    if (customDomain) {
      await attachCustomDomain(projectName, customDomain, cfConfig);
    }

    // Update Convex project record
    const convex = getConvexClient();
    if (convex) {
      await convex.mutation(api.projects.publish, {
        projectId: projectId as never,
        publishedUrl: deployment.url,
        customDomain,
        publishedBy: publisherId,
      });
    }

    return json({
      success: true,
      publishedUrl: deployment.url,
      deploymentId: deployment.id,
      environment: deployment.environment,
      fileCount: files.length,
      publishedBy: publisherId,
      publisherType,
      customDomain: customDomain || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publishing failed';
    return json({ error: message }, { status: 500 });
  }
}
