import { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../../convex/_generated/api';
// eslint-disable-next-line no-restricted-imports
import type { Id } from '../../../convex/_generated/dataModel';

export type LoadingState = 'loading' | 'loaded' | 'not-found' | 'select-template';

interface Project {
  _id: Id<'projects'>;
  urlId: string;
  name: string;
  description?: string;
  palette?: {
    id: string;
    name: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
  };
  fonts?: {
    id: string;
    name: string;
    heading: { family: string; weight: number };
    body: { family: string; weight: number };
    googleFonts: string;
  };
  metadata?: {
    gitUrl?: string;
    gitBranch?: string;
    netlifySiteId?: string;
    templateId?: string;
    publishedSnapshotId?: Id<'snapshots'>;
  };
  createdAt: number;
  updatedAt: number;
}

interface ProjectFile {
  _id: Id<'files'>;
  projectId: Id<'projects'>;
  path: string;
  content: string;
  type: string;
  isBinary: boolean;
  isLocked?: boolean;
  updatedAt: number;
}

interface UseProjectLoaderOptions {
  projectId?: string;
  urlId?: string;
}

interface UseProjectLoaderResult {
  project: Project | null;
  files: ProjectFile[];
  loadingState: LoadingState;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to load a project and its files from Convex
 *
 * Usage:
 * - Pass projectId (Convex ID) to load by ID
 * - Pass urlId to load by URL-friendly ID
 * - Pass neither to show template selector
 */
export function useProjectLoader({ projectId, urlId }: UseProjectLoaderOptions = {}): UseProjectLoaderResult {
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [error, setError] = useState<string | null>(null);

  // Query project by ID or URL ID
  const projectById = useQuery(api.projects.getById, projectId ? { projectId: projectId as Id<'projects'> } : 'skip');

  const projectByUrlId = useQuery(api.projects.getByUrlId, urlId && !projectId ? { urlId } : 'skip');

  // Get the resolved project
  const project = projectById || projectByUrlId || null;

  // Query files for the project
  const files = useQuery(api.files.getProjectFiles, project ? { projectId: project._id } : 'skip') || [];

  // Check if we have any projects (for showing template selector)
  const allProjects = useQuery(api.projects.list, !projectId && !urlId ? {} : 'skip');

  // Determine loading state
  useEffect(() => {
    // If we're looking for a specific project
    if (projectId || urlId) {
      if (project === undefined) {
        setLoadingState('loading');
      } else if (project === null) {
        setLoadingState('not-found');
        setError(`Project not found: ${projectId || urlId}`);
      } else if (files) {
        setLoadingState('loaded');
        setError(null);
      }
    } else {
      // No project specified - check if user has any projects
      if (allProjects === undefined) {
        setLoadingState('loading');
      } else if (allProjects.length === 0) {
        setLoadingState('select-template');
      } else {
        /*
         * User has projects but none selected - could show project list
         * For now, default to template selector
         */
        setLoadingState('select-template');
      }
    }
  }, [projectId, urlId, project, files, allProjects]);

  const refetch = useCallback(() => {
    /*
     * Convex handles refetching automatically through subscriptions
     * This is mainly for manual refresh if needed
     */
    setLoadingState('loading');
  }, []);

  return {
    project: project as Project | null,
    files: files as ProjectFile[],
    loadingState,
    error,
    refetch,
  };
}

