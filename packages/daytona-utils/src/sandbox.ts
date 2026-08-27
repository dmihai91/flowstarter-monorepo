/**
 * Sandbox Service
 *
 * Handles sandbox creation, discovery, and lifecycle management.
 * Targets @daytonaio/sdk v0.150.0 API.
 */

import { Daytona, Sandbox } from '@daytonaio/sdk';
import type { ReusableSandboxResult } from './types';

/**
 * Find a reusable sandbox for the given project.
 * Prioritizes: 1) started, 2) stopped, 3) archived sandboxes.
 */
export async function findReusableSandbox(
  client: Daytona,
  projectId: string,
): Promise<ReusableSandboxResult | null> {
  try {
    const { items: sandboxes } = await client.list({ source: 'flowstarter' });

    const projectSandboxes = sandboxes.filter(
      (s) => s.labels?.project === projectId,
    );

    const startedSandbox = projectSandboxes.find(
      (s) => s.state === 'started',
    );
    if (startedSandbox) {
      return { sandbox: startedSandbox, needsStart: false };
    }

    const stoppedSandbox = projectSandboxes.find(
      (s) => s.state === 'stopped',
    );
    if (stoppedSandbox) {
      return { sandbox: stoppedSandbox, needsStart: true };
    }

    const archivedSandbox = projectSandboxes.find(
      (s) => s.state === 'archived',
    );
    if (archivedSandbox) {
      return { sandbox: archivedSandbox, needsStart: true };
    }

    // Check for any unassigned sandbox
    const anyAvailable = sandboxes.find(
      (s) =>
        !s.labels?.project &&
        (s.state === 'started' ||
          s.state === 'stopped' ||
          s.state === 'archived'),
    );

    if (anyAvailable) {
      return {
        sandbox: anyAvailable,
        needsStart: anyAvailable.state !== 'started',
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Create a new sandbox for the project.
 */
export async function createSandbox(
  client: Daytona,
  projectId: string,
): Promise<Sandbox> {
  const baseConfig = {
    envVars: {
      PROJECT_ID: projectId,
      NODE_ENV: 'development',
    },
    autoStopInterval: 30,
    public: true,
    labels: {
      project: projectId,
      source: 'flowstarter',
    },
  };

  const bunImages = [
    'oven/bun:1.1',
    'oven/bun:1.1-debian',
    'oven/bun:1',
    'oven/bun:1-debian',
  ];

  for (const bunImage of bunImages) {
    try {
      const sandbox = await client.create(
        { ...baseConfig, image: bunImage },
        { timeout: 120 },
      );
      return sandbox;
    } catch {
      // Try next image
    }
  }

  // Fallback to node
  const sandbox = await client.create(
    { ...baseConfig, language: 'javascript' },
    { timeout: 120 },
  );

  return sandbox;
}

/**
 * Ensure sandbox is running, restart if needed.
 */
export async function ensureSandboxRunning(sandbox: Sandbox): Promise<boolean> {
  try {
    await sandbox.refreshData();

    if (sandbox.state === 'started') {
      return true;
    }

    if (sandbox.state === 'stopped' || sandbox.state === 'archived') {
      await sandbox.start(60);
      await new Promise((r) => setTimeout(r, 3000));
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get a preview URL from a sandbox. Daytona returns a proxy link for ANY
 * port whether or not something listens, so we first ask the sandbox which
 * port is actually serving HTTP (curl localhost) and only return that one —
 * otherwise the caller gets a 502 (e.g. picking 5173 when `astro dev` is on
 * 4321). 4321 (astro dev default) is probed first.
 *
 * The returned URL embeds the proxy auth token as `DAYTONA_SANDBOX_AUTH_KEY`.
 * Without it, daytonaproxy01.net renders an Auth0 interstitial on first hit
 * — when loaded in an iframe, the visitor sees a generic "verifying"
 * warning instead of our demo site. The token comes back from
 * `getPreviewLink()` for every sandbox (public or private); appending it
 * here means every caller gets an iframe-ready URL transparently.
 */
export async function getPreviewUrl(
  sandbox: Sandbox,
): Promise<string | undefined> {
  // Read the dev-server log (written by startDevServer) and extract the port
  // the framework actually reported listening on. Uses only `grep` (present
  // in every image) — no curl/wget/node dependency. Returns undefined until
  // the server has logged a ready line, so waitForPreview keeps polling.
  let livePort: number | undefined;
  try {
    const probe = await sandbox.process.executeCommand(
      "grep -aoE 'localhost:[0-9]{2,5}' /tmp/dev.log | grep -oE '[0-9]{2,5}' | head -1",
      undefined,
      undefined,
      8,
    );
    const port = parseInt((probe.result || '').trim(), 10);
    if (Number.isFinite(port) && port > 0) livePort = port;
  } catch {
    // log not ready yet
  }

  if (livePort === undefined) return undefined;

  try {
    const previewLink = await sandbox.getPreviewLink(livePort);
    if (typeof previewLink === 'string') {
      return previewLink || undefined;
    }
    const baseUrl = previewLink?.url;
    if (!baseUrl) return undefined;
    const token = previewLink?.token;
    if (!token) return baseUrl;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}DAYTONA_SANDBOX_AUTH_KEY=${encodeURIComponent(token)}`;
  } catch {
    return undefined;
  }
}

/**
 * Get or create a sandbox for a project.
 * Checks for existing sandbox first, then creates new.
 */
export async function getOrCreateSandbox(
  client: Daytona,
  projectId: string,
): Promise<{ sandbox: Sandbox; isNew: boolean }> {
  const existing = await findReusableSandbox(client, projectId);
  if (existing) {
    if (existing.needsStart) {
      await ensureSandboxRunning(existing.sandbox);
    }
    return { sandbox: existing.sandbox, isNew: false };
  }

  const sandbox = await createSandbox(client, projectId);
  return { sandbox, isNew: true };
}
