// Build workspace provider — where agents work (sandbox-as-truth).
//   local   → tmp dir on this host (default; fine for the CLI adapter in dev)
//   daytona → per-build Daytona sandbox (production target: isolation +
//             preview URLs). TODO(daytona): wire via @flowstarter/daytona-utils
//             — create sandbox, mount workspace, run cursor-agent inside it,
//             expose the preview URL. Until then 'daytona' falls back to local
//             with a loud warning.
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface Workspace {
  dir: string;
  /** Read a produced file (e.g. index.html) from the workspace. */
  read(path: string): Promise<string | null>;
  destroy(): Promise<void>;
}

export async function createWorkspace(buildId: string): Promise<Workspace> {
  const mode = process.env.BUILD_SANDBOX ?? 'local';
  if (mode === 'daytona') {
    console.warn('[orchestrator] BUILD_SANDBOX=daytona not wired yet — falling back to local tmp dir');
  }
  const dir = await mkdtemp(join(tmpdir(), `fs-build-${buildId.slice(0, 8)}-`));
  return {
    dir,
    read: async (path: string) => readFile(join(dir, path), 'utf8').catch(() => null),
    destroy: async () => {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    },
  };
}
