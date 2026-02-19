/**
 * Convex HTTP Client for MCP Server
 *
 * Allows the MCP server to write directly to Convex,
 * enabling faster template cloning without browser round-trips.
 */

const CONVEX_URL = process.env.CONVEX_URL || 'http://127.0.0.1:3210';

interface ConvexResponse<T> {
  status: 'success' | 'error';
  value?: T;
  errorMessage?: string;
}

/**
 * Call a Convex mutation via HTTP
 */
async function callMutation<T>(
  functionPath: string,
  args: Record<string, unknown>
): Promise<T> {
  const url = `${CONVEX_URL}/api/mutation`;

  console.log(`[Convex] Calling mutation: ${functionPath}`);
  const startTime = Date.now();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: functionPath,
      args,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[Convex] Mutation failed: ${response.status} ${text}`);
    throw new Error(`Convex mutation failed: ${response.status} ${text}`);
  }

  const result = await response.json() as ConvexResponse<T>;
  console.log(`[Convex] Mutation completed in ${Date.now() - startTime}ms`);

  if (result.status === 'error') {
    throw new Error(result.errorMessage || 'Unknown Convex error');
  }

  return result.value as T;
}

/**
 * Call a Convex query via HTTP
 */
async function callQuery<T>(
  functionPath: string,
  args: Record<string, unknown>
): Promise<T> {
  const url = `${CONVEX_URL}/api/query`;

  console.log(`[Convex] Calling query: ${functionPath}`);
  const startTime = Date.now();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: functionPath,
      args,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[Convex] Query failed: ${response.status} ${text}`);
    throw new Error(`Convex query failed: ${response.status} ${text}`);
  }

  const result = await response.json() as ConvexResponse<T>;
  console.log(`[Convex] Query completed in ${Date.now() - startTime}ms`);

  if (result.status === 'error') {
    throw new Error(result.errorMessage || 'Unknown Convex error');
  }

  return result.value as T;
}

// ─── Typed Convex Operations ─────────────────────────────────────────────────

export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export interface FontPairing {
  id: string;
  name: string;
  heading: { family: string; weight: number };
  body: { family: string; weight: number };
  googleFonts: string;
}

export interface ProjectMetadata {
  gitUrl?: string;
  gitBranch?: string;
  netlifySiteId?: string;
  templateId?: string;
}

export interface CreateProjectArgs {
  name: string;
  urlId: string;
  description?: string;
  palette?: ColorPalette;
  fonts?: FontPairing;
  metadata?: ProjectMetadata;
}

export interface FileEntry {
  path: string;
  content: string;
  type: string;
  isBinary: boolean;
  isLocked?: boolean;
}

export interface CreateSnapshotArgs {
  projectId: string;
  files: string; // JSON stringified FileMap
  label?: string;
}

/**
 * Generate a unique URL ID for a project
 */
export async function generateUrlId(baseName: string): Promise<string> {
  return callMutation<string>('projects:generateUrlId', { baseName });
}

/**
 * Create a new project in Convex
 */
export async function createProject(args: CreateProjectArgs): Promise<string> {
  return callMutation<string>('projects:create', args as unknown as Record<string, unknown>);
}

/**
 * Sync files to a project (batch upsert)
 * Batches files to avoid Convex body size limits
 */
export async function syncFiles(
  projectId: string,
  files: FileEntry[],
  clearExisting = true
): Promise<void> {
  // Convex has a body limit, but with thumbnails excluded we can batch
  // Use batches of 10 files for reasonable performance
  const BATCH_SIZE = 10;

  // First batch clears existing if needed, subsequent batches don't
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const isFirstBatch = i === 0;

    console.log(`[Convex] Syncing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)} (${batch.length} files)`);

    await callMutation<void>('files:syncFiles', {
      projectId,
      files: batch,
      clearExisting: isFirstBatch && clearExisting,
    });
  }
}

/**
 * Create a snapshot of project files
 * If the files payload is too large, creates a minimal snapshot
 */
export async function createSnapshot(args: CreateSnapshotArgs): Promise<string> {
  // Check if the files payload is too large (approximate limit ~800KB to be safe)
  const filesSize = args.files.length;
  const MAX_PAYLOAD_SIZE = 800 * 1024; // 800KB

  if (filesSize > MAX_PAYLOAD_SIZE) {
    console.warn(`[Convex] Snapshot payload too large (${Math.round(filesSize / 1024)}KB), creating minimal snapshot`);
    // Create a snapshot with just file paths, not content
    const fileMap = JSON.parse(args.files) as Record<string, unknown>;
    const minimalFiles: Record<string, { type: string; content: string; isBinary: boolean }> = {};

    for (const [path] of Object.entries(fileMap)) {
      minimalFiles[path] = {
        type: 'file',
        content: '/* Content stored in files table */',
        isBinary: false,
      };
    }

    return callMutation<string>('snapshots:createWithFiles', {
      projectId: args.projectId,
      files: JSON.stringify(minimalFiles),
      label: args.label,
    });
  }

  return callMutation<string>('snapshots:createWithFiles', args as unknown as Record<string, unknown>);
}

/**
 * Get project by URL ID
 */
export async function getProjectByUrlId(urlId: string): Promise<unknown | null> {
  return callQuery<unknown | null>('projects:getByUrlId', { urlId });
}

/**
 * Check if Convex is available
 */
export async function checkConvexHealth(): Promise<boolean> {
  try {
    const response = await fetch(CONVEX_URL, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

export const convexClient = {
  generateUrlId,
  createProject,
  syncFiles,
  createSnapshot,
  getProjectByUrlId,
  checkConvexHealth,
};
