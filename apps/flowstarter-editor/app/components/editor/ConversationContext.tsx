/**
 * ConversationContext
 *
 * Provides conversation state and actions throughout the editor.
 * Centralizes conversation management for the EditorLayout and its children.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useConversations, type Conversation, type ConversationMessage } from '~/lib/hooks/useConversations';
import type { Id } from '~/convex/_generated/dataModel';

interface ConversationContextValue {
  // Sidebar state
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  // Session
  sessionId: string;

  // Conversations
  conversations: Conversation[];
  activeConversation: Conversation | null;
  isLoadingConversations: boolean;

  // Messages
  messages: ConversationMessage[];
  isLoadingMessages: boolean;

  // Conversation actions
  createConversation: (title?: string, projectId?: Id<'projects'>) => Promise<Id<'conversations'>>;
  selectConversation: (id: Id<'conversations'>) => Promise<void>;
  renameConversation: (id: Id<'conversations'>, title: string) => Promise<void>;
  deleteConversation: (id: Id<'conversations'>) => Promise<void>;
  linkConversationToProject: (id: Id<'conversations'>, projectId: Id<'projects'>) => Promise<void>;

  // Message actions
  addMessage: (
    role: 'user' | 'assistant' | 'system',
    content: string,
    options?: { component?: string; metadata?: string },
  ) => Promise<void>;
  syncMessages: (messages: ConversationMessage[]) => Promise<void>;
  clearMessages: () => Promise<void>;

  // State update
  updateState: (state: {
    step?: string;
    projectDescription?: string;
    selectedTemplateId?: string;
    selectedTemplateName?: string;
    selectedPalette?: { id: string; name: string; colors: string[] } | null;
    selectedFont?: { id: string; name: string; heading: string; body: string } | null;
    projectUrlId?: string;
    buildPhase?: string;
    projectName?: string;
  }) => Promise<void>;

  // Project name
  projectName: string | null;
  updateProjectName: (name: string) => Promise<void>;
  updateConversationProjectName: (id: Id<'conversations'>, name: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function useConversationContext() {
  const context = useContext(ConversationContext);

  if (!context) {
    throw new Error('useConversationContext must be used within ConversationProvider');
  }

  return context;
}

// Optional version that returns null if no provider exists (for /new route)
export function useOptionalConversationContext() {
  return useContext(ConversationContext);
}

interface ConversationProviderProps {
  children: React.ReactNode;
  initialConversationId?: Id<'conversations'>;
}

export function ConversationProvider({ children, initialConversationId }: ConversationProviderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    sessionId,
    conversations,
    activeConversation,
    isLoadingConversations,
    messages,
    isLoadingMessages,
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
  } = useConversations(initialConversationId);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);

  // Project name from active conversation state
  const projectName = activeConversation?.projectName || null;

  // Update project name via updateState
  const updateProjectName = useCallback(
    async (name: string) => {
      await updateState({ projectName: name });
    },
    [updateState],
  );

  const value = useMemo<ConversationContextValue>(
    () => ({
      isSidebarOpen,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      sessionId,
      conversations,
      activeConversation,
      isLoadingConversations,
      messages,
      isLoadingMessages,
      createConversation,
      selectConversation,
      renameConversation,
      deleteConversation,
      linkConversationToProject,
      addMessage,
      syncMessages,
      clearMessages,
      updateState,
      projectName,
      updateProjectName,
      updateConversationProjectName,
    }),
    [
      isSidebarOpen,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      sessionId,
      conversations,
      activeConversation,
      isLoadingConversations,
      messages,
      isLoadingMessages,
      createConversation,
      selectConversation,
      renameConversation,
      deleteConversation,
      linkConversationToProject,
      addMessage,
      syncMessages,
      clearMessages,
      updateState,
      projectName,
      updateProjectName,
      updateConversationProjectName,
    ],
  );

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
}
