import 'server-only';
import { getClient, getCachedSandbox, setCachedSandbox } from './client';

type SandboxStateValue = 'started' | 'stopped' | 'archived' | string;
type PreviewLink = string | { url?: string };

interface Sandbox {
  id: string;
  state: SandboxStateValue;
  labels?: Record<string, string>;
  refreshData: () => Promise<void>;
  start: (timeout: number) => Promise<void>;
  getWorkDir?: () => Promise<string | undefined>;
  getPreviewLink: (port: number) => Promise<PreviewLink | undefined>;
  process: {
    executeCommand?: (command: string, workDir: string) => Promise<unknown>;
  };
}

interface SandboxListResponse {
  items: Sandbox[];
}

interface DaytonaClient {
  get: (sandboxId: string) => Promise<Sandbox>;
  list: (args: { source: string }) => Promise<SandboxListResponse>;
  create: (
    config: {
      image: string;
      envVars: Record<string, string>;
      autoStopInterval: number;
      public: boolean;
      labels: Record<string, string>;
    },
    options: { timeout: number }
  ) => Promise<Sandbox>;
}

const SandboxState = { STARTED: 'started', STOPPED: 'stopped', ARCHIVED: 'archived' } as const;

export async function getOrCreateSandbox(projectId: string): Promise<{ sandbox: Sandbox; isNew: boolean }> {
  const client = getClient() as unknown as DaytonaClient;

  const cached = getCachedSandbox(projectId);
  if (cached) {
    try {
      const sandbox = await client.get(cached.sandboxId);
      await sandbox.refreshData();
      if (sandbox.state === SandboxState.STARTED) return { sandbox, isNew: false };
      if (sandbox.state === SandboxState.STOPPED || sandbox.state === SandboxState.ARCHIVED) {
        await sandbox.start(60);
        return { sandbox, isNew: false };
      }
    } catch { /* stale cache, continue */ }
  }

  try {
    const { items } = await client.list({ source: 'flowstarter-editor' });
    const match = items.find((sandbox) => sandbox.labels?.project === projectId);
    if (match) {
      await match.refreshData();
      if (match.state !== SandboxState.STARTED) await match.start(60);
      setCachedSandbox(projectId, { sandboxId: match.id });
      return { sandbox: match, isNew: false };
    }
  } catch { /* no existing sandbox */ }

  const sandbox = await client.create({
    image: 'node:20-slim',
    envVars: {
      PROJECT_ID: projectId,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
      NODE_ENV: 'development',
    },
    autoStopInterval: 60,
    public: true,
    labels: { project: projectId, source: 'flowstarter-editor' },
  }, { timeout: 120 });

  const workDir = (await sandbox.getWorkDir?.()) || '/home/daytona';
  await sandbox.process.executeCommand?.('npm install -g @anthropic-ai/claude-code', workDir);

  setCachedSandbox(projectId, { sandboxId: sandbox.id });
  return { sandbox, isNew: true };
}

export async function ensureSandboxRunning(sandbox: Sandbox): Promise<boolean> {
  try {
    await sandbox.refreshData();
    if (sandbox.state === SandboxState.STARTED) return true;
    if (sandbox.state === SandboxState.STOPPED || sandbox.state === SandboxState.ARCHIVED) {
      await sandbox.start(60);
      return true;
    }
    return false;
  } catch { return false; }
}

export async function getPreviewUrl(sandbox: Sandbox): Promise<string | undefined> {
  for (const port of [4321, 5173, 3000, 8080]) {
    try {
      const link = await sandbox.getPreviewLink(port);
      if (link) return typeof link === 'string' ? link : link.url;
    } catch { /* try next port */ }
  }
  return undefined;
}
