/**
 * Cloudflare Pages Integration
 *
 * Deploy built files to Cloudflare Pages via Direct Upload API.
 */

interface CloudflareConfig {
  accountId: string;
  apiToken: string;
}

interface DeployResult {
  id: string;
  url: string;
  environment: string;
}

/**
 * Create a Cloudflare Pages project if it doesn't exist.
 */
export async function createPagesProject(
  projectName: string,
  config: CloudflareConfig,
): Promise<{ name: string; subdomain: string }> {
  const sanitizedName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 63);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: sanitizedName,
        production_branch: 'main',
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    // 409 = project already exists, which is fine
    if (response.status !== 409) {
      throw new Error(`Failed to create Pages project: ${JSON.stringify(error)}`);
    }
  }

  return {
    name: sanitizedName,
    subdomain: `${sanitizedName}.pages.dev`,
  };
}

/**
 * Deploy files to Cloudflare Pages via Direct Upload.
 */
export async function deployToPages(
  projectName: string,
  files: Array<{ path: string; content: Buffer }>,
  config: CloudflareConfig,
): Promise<DeployResult> {
  // Create form data with file entries
  const formData = new FormData();

  for (const file of files) {
    const blob = new Blob([new Uint8Array(file.content)]);
    formData.append(file.path, blob, file.path);
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects/${projectName}/deployments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Deployment failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json() as { result: { id: string; url: string; environment: string } };
  const deployment = data.result;

  return {
    id: deployment.id,
    url: deployment.url,
    environment: deployment.environment,
  };
}

/**
 * Get deployment status.
 */
export async function getDeploymentStatus(
  projectName: string,
  deploymentId: string,
  config: CloudflareConfig,
): Promise<{ status: string; url?: string }> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects/${projectName}/deployments/${deploymentId}`,
    {
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to get deployment status');
  }

  const data = await response.json() as { result: Record<string, unknown> & { latest_stage?: { status?: string } } };
  return {
    status: data.result.latest_stage?.status || 'unknown',
    url: data.result.url as string | undefined,
  };
}
