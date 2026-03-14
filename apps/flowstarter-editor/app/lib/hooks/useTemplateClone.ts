/**
 * useTemplateClone Hook (Refactored)
 *
 * Hook to clone a template from the Flowstarter MCP server.
 * Uses extracted modules for better maintainability.
 */

import { useCallback, useState } from 'react';
import { useMutation } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../../convex/_generated/api';

import type { CloneOptions, CloneResult, UseTemplateCloneResult } from './templateClone';
import { fetchScaffoldData, createFileBatches, applyCustomizations } from './templateClone';

// Re-export cache clear function for external use
export { clearTemplateCache } from './templateClone';

/**
 * Hook to clone a template from the Flowstarter MCP server.
 * If an existing Convex project is provided, files are cloned into that project.
 */
export function useTemplateClone(): UseTemplateCloneResult {
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex mutations for client-side batched approach
  const createProject = useMutation(api.projects.create);
  const generateUrlId = useMutation(api.projects.generateUrlId);
  const syncFiles = useMutation(api.files.syncFiles);
  const createSnapshot = useMutation(api.snapshots.create);

  const cloneTemplate = useCallback(
    async ({ template, projectName, palette, fonts, existingProjectId, existingUrlId }: CloneOptions): Promise<CloneResult> => {
      console.log(`[cloneTemplate] Starting clone for template "${template.id}"`);

      const startTime = Date.now();
      setIsCloning(true);
      setError(null);

      try {
        // First try the direct MCP → Convex endpoint (faster for small templates)
        const result = existingProjectId
          ? null
          : await tryMcpEndpoint({ template, projectName, palette, fonts, startTime });

        if (result) {
          return result;
        }

        // Fallback: Client-side batched upload approach
        return await clientSideBatchedUpload({
          template,
          projectName,
          palette,
          fonts,
          existingProjectId,
          existingUrlId,
          startTime,
          createProject,
          generateUrlId,
          syncFiles,
          createSnapshot,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to clone template';
        console.error('[cloneTemplate] Error:', message);
        setError(message);
        throw err;
      } finally {
        setIsCloning(false);
      }
    },
    [createProject, generateUrlId, syncFiles, createSnapshot],
  );

  return {
    cloneTemplate,
    isCloning,
    error,
  };
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

interface McpEndpointParams extends CloneOptions {
  startTime: number;
}

async function tryMcpEndpoint({
  template,
  projectName,
  palette,
  fonts,
  startTime,
}: McpEndpointParams): Promise<CloneResult | null> {
  console.log('[cloneTemplate] Trying scaffold-to-convex endpoint...');

  const mcpUrl = import.meta.env.VITE_FLOWSTARTER_MCP_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${mcpUrl}/api/scaffold-to-convex`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: template.id,
        projectName,
        projectDescription: projectName,
        palette,
        fonts,
      }),
    });

    if (response.ok) {
      const result = (await response.json()) as {
        success: boolean;
        projectId?: string;
        urlId?: string;
        fileCount?: number;
        error?: string;
      };

      if (result.success && result.urlId && result.projectId) {
        console.log(`[cloneTemplate] MCP scaffold completed in ${Date.now() - startTime}ms`, {
          projectId: result.projectId,
          urlId: result.urlId,
          fileCount: result.fileCount,
        });

        return {
          urlId: result.urlId,
          projectId: result.projectId,
        };
      }
    }

    // Check if it's a size limit error
    const errorText = await response.text();

    if (errorText.includes('length limit exceeded') || errorText.includes('BadJsonBody')) {
      console.log('[cloneTemplate] MCP endpoint hit size limit, falling back to batched upload');
    } else {
      console.warn('[cloneTemplate] MCP endpoint failed:', errorText);
    }
  } catch (mcpError) {
    console.warn('[cloneTemplate] MCP endpoint error, falling back to batched upload:', mcpError);
  }

  return null;
}

interface BatchedUploadParams extends CloneOptions {
  startTime: number;

  createProject: any;

  generateUrlId: any;

  syncFiles: any;

  createSnapshot: any;
}

async function clientSideBatchedUpload({
  template,
  projectName,
  palette,
  fonts,
  existingProjectId,
  existingUrlId,
  startTime,
  createProject,
  generateUrlId,
  syncFiles,
  createSnapshot,
}: BatchedUploadParams): Promise<CloneResult> {
  console.log('[cloneTemplate] Using client-side batched upload approach...');

  // 1. Fetch scaffold data from MCP
  const scaffoldData = await fetchScaffoldData(template.id);
  const files = applyCustomizations(scaffoldData.files, palette, fonts);

  console.log(`[cloneTemplate] Fetched ${files.length} files, preparing batched upload...`);

  const urlId = existingUrlId || (await generateUrlId({ baseName: projectName }));
  if (!existingUrlId) {
    console.log(`[cloneTemplate] Generated urlId: ${urlId}`);
  }

  // 3. Create project in Convex unless this clone targets an existing project
  const projectId = existingProjectId
    ? existingProjectId
    : await createProject({
        name: projectName,
        urlId,
        description: projectName,
        palette: {
          id: palette.id,
          name: palette.name,
          colors: palette.colors,
        },
        fonts: {
          id: fonts.id,
          name: fonts.name,
          heading: fonts.heading,
          body: fonts.body,
          googleFonts: fonts.googleFonts,
        },
        metadata: {
          templateId: template.id,
        },
      });
  console.log(`[cloneTemplate] ${existingProjectId ? 'Reusing' : 'Created'} project: ${projectId}`);

  // 4. Upload files in batches
  const batches = createFileBatches(files);
  console.log(`[cloneTemplate] Uploading ${files.length} files in ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`[cloneTemplate] Uploading batch ${i + 1}/${batches.length} (${batch.length} files)`);

    await syncFiles({
      projectId,
      files: batch.map((f) => ({
        path: f.path,
        content: f.content,
        type: f.type || 'file',
        isBinary: false,
      })),
      clearExisting: i === 0, // Clear only on first batch
    });
  }

  // 5. Create snapshot from files table
  const snapshotResult = await createSnapshot({
    projectId,
    label: 'Initial template',
  });
  console.log(`[cloneTemplate] Created snapshot v${snapshotResult.version} with ${snapshotResult.fileCount} files`);

  console.log(`[cloneTemplate] Batched clone completed in ${Date.now() - startTime}ms`, {
    projectId,
    urlId,
    fileCount: files.length,
  });

  return {
    urlId,
    projectId,
  };
}
