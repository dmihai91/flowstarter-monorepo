/**
 * Publish API Route
 *
 * Build in sandbox → upload bundle to Supabase → deploy to Cloudflare Pages.
 */

import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { createClient } from '@supabase/supabase-js';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { projectId } = await request.json();

  if (!projectId) {
    return json({ error: 'projectId required' }, { status: 400 });
  }

  const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!cloudflareAccountId || !cloudflareApiToken) {
    return json({ error: 'Cloudflare credentials not configured' }, { status: 500 });
  }

  try {
    // Dynamic imports for server-only modules
    const { getClient } = await import('@flowstarter/editor-engine/daytona');
    const { buildProject, downloadBundle, validateBundle } = await import(
      '@flowstarter/editor-engine/publishing'
    );
    const { createPagesProject, deployToPages } = await import(
      '@flowstarter/editor-engine/publishing'
    );

    const client = getClient();

    // Find sandbox for project
    const { items: sandboxes } = await client.list({ source: 'flowstarter' });
    const sandbox = sandboxes.find((s) => s.labels?.project === projectId);

    if (!sandbox) {
      return json({ error: 'No active workspace found' }, { status: 404 });
    }

    // 1. Build in sandbox
    const buildResult = await buildProject(sandbox);
    if (!buildResult.success) {
      return json({ error: `Build failed: ${buildResult.error}` }, { status: 500 });
    }

    // 2. Download built files
    const files = await downloadBundle(sandbox, buildResult.outputDir);

    // 3. Validate bundle
    const validation = validateBundle(files);
    if (!validation.valid) {
      return json(
        { error: `Invalid bundle: ${validation.errors.join(', ')}` },
        { status: 400 },
      );
    }

    // 4. Upload bundle to Supabase storage
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const timestamp = Date.now();
      const bundlePath = `bundles/${projectId}/${timestamp}.json`;

      // Store file manifest (not the actual files - those go to CF)
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

    // 5. Create CF Pages project if needed
    const cfConfig = { accountId: cloudflareAccountId, apiToken: cloudflareApiToken };
    const projectName = `fs-${projectId}`.slice(0, 63);
    await createPagesProject(projectName, cfConfig);

    // 6. Deploy to Cloudflare Pages
    const deployment = await deployToPages(projectName, files, cfConfig);

    // 7. Return result
    return json({
      success: true,
      publishedUrl: deployment.url,
      deploymentId: deployment.id,
      environment: deployment.environment,
      fileCount: files.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publishing failed';
    return json({ error: message }, { status: 500 });
  }
}
