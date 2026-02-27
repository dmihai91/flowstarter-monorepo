/**
 * Workspace Manager
 *
 * Manages Daytona workspace lifecycle for Claude Code execution.
 * Each workspace is a sandboxed environment where Claude Code runs
 * with full access to the project files.
 */

import { Daytona, Sandbox, SandboxState } from '@daytonaio/sdk';
import { createLogger } from '~/lib/utils/logger';
import type {
  ClaudeCodeEnv,
  CreateWorkspaceOptions,
  CreateWorkspaceResult,
  WorkspaceInfo,
  WorkspaceState,
} from './types';

const log = createLogger('ClaudeCodeWorkspace');

// Singleton Daytona client
let daytonaClient: Daytona | null = null;

// In-memory workspace registry
const workspaceRegistry = new Map<string, WorkspaceInfo>();

// Sandbox ID to workspace ID mapping
const sandboxToWorkspace = new Map<string, string>();

/**
 * Get or create the Daytona SDK client
 */
function getClient(env?: ClaudeCodeEnv): Daytona {
  const apiKey = env?.DAYTONA_API_KEY || process.env.DAYTONA_API_KEY || '';
  const apiUrl = env?.DAYTONA_API_URL || process.env.DAYTONA_API_URL || 'https://app.daytona.io/api';

  if (!apiKey) {
    throw new Error('Daytona API key not configured. Add DAYTONA_API_KEY to your .env file.');
  }

  if (!daytonaClient) {
    daytonaClient = new Daytona({ apiKey, apiUrl });
  }

  return daytonaClient;
}

/**
 * Generate a unique workspace ID
 */
function generateWorkspaceId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Map Daytona sandbox state to workspace state
 */
function mapSandboxState(sandboxState: SandboxState): WorkspaceState {
  switch (sandboxState) {
    case SandboxState.STARTED:
      return 'ready' as WorkspaceState;
    case SandboxState.STOPPED:
    case SandboxState.ARCHIVED:
      return 'stopped' as WorkspaceState;
    case SandboxState.ERROR:
      return 'error' as WorkspaceState;
    default:
      return 'creating' as WorkspaceState;
  }
}

/**
 * Create a new workspace with Claude Code installed
 */
export async function createWorkspace(
  options: CreateWorkspaceOptions,
  env?: ClaudeCodeEnv
): Promise<CreateWorkspaceResult> {
  const { projectId, templateId, timeout = 180 } = options;

  log.info(`Creating workspace for project ${projectId}`);

  try {
    const client = getClient(env);
    const workspaceId = generateWorkspaceId();

    // Create sandbox with appropriate config
    const sandbox = await client.create(
      {
        image: 'node:20-slim', // Use Node.js base for Claude Code
        envVars: {
          PROJECT_ID: projectId,
          WORKSPACE_ID: workspaceId,
          TEMPLATE_ID: templateId || '',
          ANTHROPIC_API_KEY: env?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '',
          NODE_ENV: 'development',
        },
        autoStopInterval: 60, // 1 hour auto-stop
        public: true,
        labels: {
          project: projectId,
          workspace: workspaceId,
          source: 'flowstarter-claude-code',
          template: templateId || 'none',
        },
      },
      { timeout }
    );

    log.info(`Sandbox created: ${sandbox.id}`);

    // Install Claude Code CLI
    await installClaudeCode(sandbox);

    // Get preview URL
    const previewUrl = await getPreviewUrl(sandbox);

    // Create workspace info
    const workspace: WorkspaceInfo = {
      workspaceId,
      sandboxId: sandbox.id,
      projectId,
      state: 'ready' as WorkspaceState,
      createdAt: new Date(),
      previewUrl,
    };

    // Register workspace
    workspaceRegistry.set(workspaceId, workspace);
    sandboxToWorkspace.set(sandbox.id, workspaceId);

    log.info(`Workspace ready: ${workspaceId}`);

    return { success: true, workspace };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log.error(`Failed to create workspace: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Install Claude Code CLI in the sandbox
 */
async function installClaudeCode(sandbox: Sandbox): Promise<void> {
  log.debug(`Installing Claude Code CLI in sandbox ${sandbox.id}`);

  const workDir = (await sandbox.getWorkDir()) || '/home/daytona';

  // Install Claude Code via npm
  const installResult = await sandbox.process.executeCommand(
    'npm install -g @anthropic-ai/claude-code',
    workDir
  );

  if (installResult.exitCode !== 0) {
    throw new Error(`Failed to install Claude Code: ${installResult.result}`);
  }

  // Verify installation
  const verifyResult = await sandbox.process.executeCommand('claude --version', workDir);

  if (verifyResult.exitCode !== 0) {
    throw new Error('Claude Code installation verification failed');
  }

  log.debug(`Claude Code installed: ${verifyResult.result.trim()}`);
}

/**
 * Get preview URL for the sandbox
 */
async function getPreviewUrl(sandbox: Sandbox): Promise<string | undefined> {
  try {
    // Try to get URL for common development ports
    const ports = [5173, 4321, 3000, 8080];
    for (const port of ports) {
      try {
        const previewLink = await sandbox.getPreviewLink(port);
        if (previewLink) {
          // previewLink may be a PortPreviewUrl object with url property
          const url = typeof previewLink === 'string' ? previewLink : previewLink.url;
          if (url) {
            return url;
          }
        }
      } catch {
        // Port not exposed, try next
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get workspace status
 */
export async function getWorkspaceStatus(
  workspaceId: string,
  env?: ClaudeCodeEnv
): Promise<WorkspaceInfo | null> {
  const workspace = workspaceRegistry.get(workspaceId);
  if (!workspace) {
    log.debug(`Workspace ${workspaceId} not found in registry`);
    return null;
  }

  try {
    const client = getClient(env);
    const sandbox = await client.get(workspace.sandboxId);

    // Update state from sandbox
    workspace.state = mapSandboxState(sandbox.state);

    // Update preview URL if available
    const previewUrl = await getPreviewUrl(sandbox);
    if (previewUrl) {
      workspace.previewUrl = previewUrl;
    }

    return workspace;
  } catch (error) {
    log.error(`Failed to get workspace status: ${error}`);
    workspace.state = 'error' as WorkspaceState;
    return workspace;
  }
}

/**
 * Destroy a workspace and clean up resources
 */
export async function destroyWorkspace(workspaceId: string, env?: ClaudeCodeEnv): Promise<boolean> {
  const workspace = workspaceRegistry.get(workspaceId);
  if (!workspace) {
    log.debug(`Workspace ${workspaceId} not found, nothing to destroy`);
    return true;
  }

  log.info(`Destroying workspace ${workspaceId}`);

  try {
    const client = getClient(env);
    const sandbox = await client.get(workspace.sandboxId);

    // Delete the sandbox
    await sandbox.delete();

    // Clean up registry
    workspaceRegistry.delete(workspaceId);
    sandboxToWorkspace.delete(workspace.sandboxId);

    log.info(`Workspace ${workspaceId} destroyed`);
    return true;
  } catch (error) {
    log.error(`Failed to destroy workspace: ${error}`);
    return false;
  }
}

/**
 * Get the Daytona sandbox for a workspace
 */
export async function getSandbox(workspaceId: string, env?: ClaudeCodeEnv): Promise<Sandbox | null> {
  const workspace = workspaceRegistry.get(workspaceId);
  if (!workspace) {
    return null;
  }

  try {
    const client = getClient(env);
    return await client.get(workspace.sandboxId);
  } catch {
    return null;
  }
}

/**
 * Ensure workspace is running
 */
export async function ensureWorkspaceRunning(
  workspaceId: string,
  env?: ClaudeCodeEnv
): Promise<boolean> {
  const workspace = workspaceRegistry.get(workspaceId);
  if (!workspace) {
    return false;
  }

  try {
    const client = getClient(env);
    const sandbox = await client.get(workspace.sandboxId);

    await sandbox.refreshData();

    if (sandbox.state === SandboxState.STARTED) {
      return true;
    }

    if (sandbox.state === SandboxState.STOPPED || sandbox.state === SandboxState.ARCHIVED) {
      log.info(`Starting workspace ${workspaceId}...`);
      await sandbox.start(60);
      workspace.state = 'ready' as WorkspaceState;
      return true;
    }

    return false;
  } catch (error) {
    log.error(`Failed to ensure workspace running: ${error}`);
    return false;
  }
}

/**
 * List all active workspaces
 */
export function listWorkspaces(): WorkspaceInfo[] {
  return Array.from(workspaceRegistry.values());
}

/**
 * Find workspace by project ID
 */
export function findWorkspaceByProject(projectId: string): WorkspaceInfo | undefined {
  return Array.from(workspaceRegistry.values()).find((w) => w.projectId === projectId);
}

/**
 * Clear workspace registry (for testing)
 */
export function clearRegistry(): void {
  workspaceRegistry.clear();
  sandboxToWorkspace.clear();
}
