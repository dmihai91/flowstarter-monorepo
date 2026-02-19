import { z } from 'zod';
import { getProjectById, getProjectsByUserId, ProjectRecord } from '../utils/supabase.js';

export const GetProjectSchema = z.object({
  projectId: z.string().describe('The unique ID of the project to retrieve')
});

export const GetUserProjectsSchema = z.object({
  userId: z.string().describe('The user ID to retrieve projects for')
});

export interface ProjectDetailsResult {
  success: boolean;
  project?: ProjectRecord;
  error?: string;
}

export interface UserProjectsResult {
  success: boolean;
  projects: ProjectRecord[];
  count: number;
  error?: string;
}

/**
 * Get detailed information about a specific project from Supabase
 * This provides the coding agent with project context, git URLs, deployment info, etc.
 */
export async function getProjectDetails(
  args: z.infer<typeof GetProjectSchema>
): Promise<ProjectDetailsResult> {
  try {
    const project = await getProjectById(args.projectId);

    if (!project) {
      return {
        success: false,
        error: `Project not found: ${args.projectId}`
      };
    }

    return {
      success: true,
      project
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to retrieve project: ${error}`
    };
  }
}

/**
 * Get all projects for a specific user
 * Useful for listing available projects to work on
 */
export async function getUserProjects(
  args: z.infer<typeof GetUserProjectsSchema>
): Promise<UserProjectsResult> {
  try {
    const projects = await getProjectsByUserId(args.userId);

    return {
      success: true,
      projects,
      count: projects.length
    };
  } catch (error) {
    return {
      success: false,
      projects: [],
      count: 0,
      error: `Failed to retrieve projects: ${error}`
    };
  }
}
