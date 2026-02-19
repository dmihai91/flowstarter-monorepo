import { useCallback, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '~/convex/_generated/api';
import type { Id } from '~/convex/_generated/dataModel';

/**
 * Summary of deleted resources from a project deletion.
 */
interface DeletionSummary {
  success: boolean;
}

interface UseProjectDeleteResult {
  deleteProject: (projectId: Id<'projects'>) => Promise<DeletionSummary | null>;
  isDeleting: boolean;
  error: string | null;
}

/**
 * Hook for deleting projects with cleanup
 */
export function useProjectDelete(): UseProjectDeleteResult {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeProject = useMutation(api.projects.remove);

  const deleteProject = useCallback(
    async (projectId: Id<'projects'>): Promise<DeletionSummary | null> => {
      setIsDeleting(true);
      setError(null);

      try {
        const result = await removeProject({ projectId });
        return result;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to delete project';
        setError(errorMessage);
        console.error('[useProjectDelete] Error:', e);

        return null;
      } finally {
        setIsDeleting(false);
      }
    },
    [removeProject],
  );

  return { deleteProject, isDeleting, error };
}

/**
 * Hook for deleting conversations
 */
export function useConversationDelete() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeConversation = useMutation(api.conversations.remove);

  const deleteConversation = useCallback(
    async (conversationId: Id<'conversations'>): Promise<boolean> => {
      setIsDeleting(true);
      setError(null);

      try {
        await removeConversation({ id: conversationId });
        return true;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to delete conversation';
        setError(errorMessage);
        console.error('[useConversationDelete] Error:', e);

        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [removeConversation],
  );

  return { deleteConversation, isDeleting, error };
}

