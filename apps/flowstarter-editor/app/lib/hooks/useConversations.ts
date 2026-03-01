/**
 * useConversations Hook
 *
 * Manages multiple conversation threads with Convex sync.
 * Provides CRUD operations for conversations and real-time message sync.
 */

import { useQuery, useMutation } from 'convex/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '~/convex/_generated/api';
import type { Id } from '~/convex/_generated/dataModel';

// Session ID stored in localStorage
const SESSION_ID_KEY = 'flowstarter_session_id';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  let sessionId = localStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  return sessionId;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  component?: string;
  metadata?: string;
}

export interface Conversation {
  id: Id<'conversations'>;
  title: string;
  isActive: boolean;
  projectId?: Id<'projects'>;
  projectName?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ConversationState {
  step?: string;
  projectDescription?: string;
  selectedTemplateId?: string | null;
  selectedTemplateName?: string | null;
  selectedPalette?: { id: string; name: string; colors: string[] } | null;
  selectedFont?: { id: string; name: string; heading: string; body: string } | null;
  projectUrlId?: string | null;
  buildPhase?: string | null;
  projectName?: string | null;
  businessInfo?: unknown;
}

interface UseConversationsResult {
  // Session
  sessionId: string;

  // Conversations
  conversations: Conversation[];
  activeConversation: (Conversation & ConversationState) | null;
  isLoadingConversations: boolean;

  // Messages for active conversation
  messages: ConversationMessage[];
  isLoadingMessages: boolean;

  // Actions
  createConversation: (title?: string, projectId?: Id<'projects'>) => Promise<Id<'conversations'>>;
  selectConversation: (id: Id<'conversations'>) => Promise<void>;
  renameConversation: (id: Id<'conversations'>, title: string) => Promise<void>;
  deleteConversation: (id: Id<'conversations'>) => Promise<void>;
  linkConversationToProject: (
    id: Id<'conversations'>,
    projectId: Id<'projects'>,
    projectUrlId?: string,
  ) => Promise<void>;

  // Message actions
  addMessage: (
    role: 'user' | 'assistant' | 'system',
    content: string,
    options?: { component?: string; metadata?: string },
  ) => Promise<void>;
  syncMessages: (messages: ConversationMessage[]) => Promise<void>;
  clearMessages: () => Promise<void>;

  // State update
  updateState: (state: ConversationState) => Promise<void>;

  // Update project name for any conversation
  updateConversationProjectName: (id: Id<'conversations'>, name: string) => Promise<void>;
}

export function useConversations(initialConversationId?: Id<'conversations'>): UseConversationsResult {
  const [sessionId] = useState(getOrCreateSessionId);
  const [localMessages, setLocalMessages] = useState<ConversationMessage[]>([]);
  const syncDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMessagesRef = useRef<ConversationMessage[] | null>(null);
  const hasInitializedRef = useRef(false);

  // Queries - if initialConversationId is provided, use it directly
  const conversationsData = useQuery(api.conversations.getBySessionId, { sessionId });
  const activeConversationData = useQuery(api.conversations.getActiveBySessionId, { sessionId });

  // If we have an initial conversation ID, fetch it directly
  const specificConversation = useQuery(
    api.conversations.getById,
    initialConversationId ? { id: initialConversationId } : 'skip',
  );

  // Determine which conversation to use as active
  const effectiveActiveConversation = initialConversationId ? specificConversation : activeConversationData;

  // Get messages for active conversation
  const activeConvId = effectiveActiveConversation?._id;
  const messagesData = useQuery(
    api.conversations.getMessages,
    activeConvId ? { conversationId: activeConvId } : 'skip',
  );

  // Mutations
  const createConversationMutation = useMutation(api.conversations.create);
  const setActiveMutation = useMutation(api.conversations.setActive);
  const renameMutation = useMutation(api.conversations.rename);
  const deleteMutation = useMutation(api.conversations.remove);
  const linkToProjectMutation = useMutation(api.conversations.linkToProject);
  const addMessageMutation = useMutation(api.conversations.addMessage);
  const saveMessagesMutation = useMutation(api.conversations.saveMessages);
  const clearMessagesMutation = useMutation(api.conversations.clearMessages);
  const updateStateMutation = useMutation(api.conversations.updateState);
  const updateProjectNameMutation = useMutation(api.conversations.updateProjectName);

  // Transform conversations data
  const conversations: Conversation[] = (conversationsData || []).map((c) => ({
    id: c._id,
    title: c.title,
    isActive: c.isActive,
    projectId: c.projectId,
    projectName: c.projectName,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  const activeConversation: (Conversation & ConversationState) | null = effectiveActiveConversation
    ? {
        id: effectiveActiveConversation._id,
        title: effectiveActiveConversation.title,
        isActive: effectiveActiveConversation.isActive,
        projectId: effectiveActiveConversation.projectId,
        createdAt: effectiveActiveConversation.createdAt,
        updatedAt: effectiveActiveConversation.updatedAt,

        // State fields for restoration
        step: effectiveActiveConversation.step,
        projectDescription: effectiveActiveConversation.projectDescription,
        selectedTemplateId: effectiveActiveConversation.selectedTemplateId,
        selectedTemplateName: effectiveActiveConversation.selectedTemplateName,
        selectedPalette: effectiveActiveConversation.selectedPalette,
        selectedFont: effectiveActiveConversation.selectedFont,
        projectUrlId: effectiveActiveConversation.projectUrlId,
        buildPhase: effectiveActiveConversation.buildPhase,
        projectName: effectiveActiveConversation.projectName,
        businessInfo: effectiveActiveConversation.businessInfo,
      }
    : null;

  // Sync messages from Convex to local state when they change
  useEffect(() => {
    if (messagesData) {
      let idCounter = 0;
      const transformedMessages: ConversationMessage[] = messagesData.map((m) => ({
        // Ensure every message has a unique ID - generate one if missing
        id: m.id || `convex-${Date.now()}-${++idCounter}-${Math.random().toString(36).slice(2, 7)}`,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        timestamp: m.createdAt,
        component: m.component,
        metadata: m.metadata,
      }));
      setLocalMessages(transformedMessages);
    }
  }, [messagesData]);

  /*
   * NOTE: Auto-creation removed - conversations are now created on first user interaction
   * This ensures conversations are only created when the user actually engages
   * See: _index.tsx for initial conversation creation logic
   */

  // Create a new conversation
  const createConversation = useCallback(
    async (title?: string, projectId?: Id<'projects'>) => {
      const id = await createConversationMutation({
        sessionId,
        title: title || 'New Project',
        projectId,
      });
      await setActiveMutation({ id });

      return id;
    },
    [createConversationMutation, setActiveMutation, sessionId],
  );

  // Select active conversation
  const selectConversation = useCallback(
    async (id: Id<'conversations'>) => {
      await setActiveMutation({ id });
    },
    [setActiveMutation],
  );

  // Rename conversation
  const renameConversation = useCallback(
    async (id: Id<'conversations'>, title: string) => {
      await renameMutation({ id, title });
    },
    [renameMutation],
  );

  // Update conversation project name
  const updateConversationProjectName = useCallback(
    async (id: Id<'conversations'>, name: string) => {
      await updateProjectNameMutation({ id, projectName: name });
    },
    [updateProjectNameMutation],
  );

  // Delete conversation
  const deleteConversation = useCallback(
    async (id: Id<'conversations'>) => {
      // Look up conversation to get supabaseProjectId before deleting
      const convo = conversations?.find(c => c._id === id);
      const project = convo?.projectId ? await null : null; // project info comes from Convex mutation

      // The mutation returns any associated workspace IDs that need cleanup
      const result = await deleteMutation({ id });

      // Also delete from Supabase if linked
      if (result && typeof result === 'object' && 'supabaseProjectId' in result) {
        const supabaseId = (result as { supabaseProjectId?: string }).supabaseProjectId;
        if (supabaseId) {
          fetch('/api/project/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ supabaseProjectId: supabaseId }),
          }).catch(e => console.error('Failed to delete from Supabase:', e));
        }
      }

      /*
       * If there are associated Daytona workspaces, delete them
       * We check for the property since the return type might not be fully inferred yet
       */
      if (result && typeof result === 'object' && 'daytonaWorkspaceIds' in result) {
        const workspaceIds = (result as { daytonaWorkspaceIds: string[] }).daytonaWorkspaceIds;

        if (Array.isArray(workspaceIds) && workspaceIds.length > 0) {
          /*
           * Delete workspaces in parallel
           * We don't await this to keep the UI responsive, as the DB deletion is already done
           */
          Promise.all(
            workspaceIds.map(async (workspaceId) => {
              try {
                const response = await fetch(`/api/daytona/workspace/${workspaceId}`, {
                  method: 'DELETE',
                });

                if (!response.ok) {
                  console.error(`Failed to delete Daytona workspace ${workspaceId}: ${response.statusText}`);
                }
              } catch (error) {
                console.error(`Error deleting Daytona workspace ${workspaceId}:`, error);
              }
            }),
          ).catch((e) => console.error('Error in workspace cleanup:', e));
        }
      }
    },
    [deleteMutation],
  );

  // Link conversation to project
  const linkConversationToProject = useCallback(
    async (id: Id<'conversations'>, projectId: Id<'projects'>, projectUrlId?: string) => {
      await linkToProjectMutation({ id, projectId, projectUrlId });
    },
    [linkToProjectMutation],
  );

  // Add message to conversation
  const addMessage = useCallback(
    async (
      role: 'user' | 'assistant' | 'system',
      content: string,
      options?: { component?: string; metadata?: string },
    ) => {
      if (!activeConvId) {
        return;
      }

      await addMessageMutation({
        conversationId: activeConvId,
        role,
        content,
        component: options?.component,
        metadata: options?.metadata,
      });
    },
    [addMessageMutation, activeConvId],
  );

  // Sync messages (batched)
  const syncMessages = useCallback(
    async (messages: ConversationMessage[]) => {
      if (!activeConvId) {
        return;
      }

      // Debounce sync to avoid excessive writes
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
      }

      pendingMessagesRef.current = messages;

      syncDebounceRef.current = setTimeout(async () => {
        if (!pendingMessagesRef.current) {
          return;
        }

        await saveMessagesMutation({
          conversationId: activeConvId,
          messages: pendingMessagesRef.current.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.timestamp,
            component: m.component,
            metadata: m.metadata,
          })),
        });

        pendingMessagesRef.current = null;
      }, 300);
    },
    [saveMessagesMutation, activeConvId],
  );

  // Clear messages
  const clearMessages = useCallback(async () => {
    if (!activeConvId) {
      return;
    }

    await clearMessagesMutation({ conversationId: activeConvId });
  }, [clearMessagesMutation, activeConvId]);

  // Update state
  const updateState = useCallback(
    async (state: ConversationState) => {
      if (!activeConvId) {
        return;
      }

      // Filter out null values - Convex only accepts undefined for optional fields
      const cleanState: Record<string, unknown> = { id: activeConvId };

      for (const [key, value] of Object.entries(state)) {
        if (value !== null) {
          cleanState[key] = value;
        }
      }
      await updateStateMutation(cleanState as Parameters<typeof updateStateMutation>[0]);
    },
    [updateStateMutation, activeConvId],
  );

  return {
    sessionId,
    conversations,
    activeConversation,
    isLoadingConversations: conversationsData === undefined,
    messages: localMessages,
    isLoadingMessages: messagesData === undefined,
    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    linkConversationToProject,
    addMessage,
    syncMessages,
    clearMessages,
    updateState,
    updateConversationProjectName,
  };
}

