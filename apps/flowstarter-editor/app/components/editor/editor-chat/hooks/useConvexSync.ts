/**
 * useConvexSync Hook
 *
 * Comprehensive Convex syncing for session recovery:
 * - Chat messages (user + assistant)
 * - Conversation state (step, project info, templates, palette, font, logo, business info)
 * - Build state (phase, progress, errors) for recovery
 * - Project files
 *
 * Uses debouncing and hash-based change detection to prevent infinite loops
 */

import { useEffect, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '~/convex/_generated/api';
import type { Id } from '~/convex/_generated/dataModel';
import type { ChatMessage, ColorPalette, SystemFont, LogoInfo, BuildPhase } from '../types';

interface ConversationState {
  step?: string;
  projectDescription?: string;
  projectName?: string;
  selectedTemplateId?: string;
  selectedTemplateName?: string;
  selectedPalette?: ColorPalette | null;
  selectedFont?: SystemFont | null;
  selectedLogo?: LogoInfo | null;
  businessInfo?: any;
  projectUrlId?: string;
  buildPhase?: BuildPhase | string;
  orchestrationState?: 'idle' | 'running' | 'completed' | 'failed';
  orchestrationId?: string | null;
}

interface UseConvexSyncProps {
  conversationId: Id<'conversations'> | null;

  /** Project ID - can be Convex ID or string (urlId) */
  projectId?: Id<'projects'> | string | null;
  messages: ChatMessage[];
  conversationState?: ConversationState;
  files?: Record<string, string>;
  enabled?: boolean;
  debounceMs?: number;
}

export function useConvexSync({
  conversationId,
  projectId,
  messages,
  conversationState,
  files,
  enabled = true,
  debounceMs = 1000,
}: UseConvexSyncProps) {
  // Convex mutations
  const saveMessages = useMutation(api.conversations.saveMessages);
  const updateState = useMutation(api.conversations.updateState);
  const syncFiles = useMutation(api.files.syncFiles);
  const updateProject = useMutation(api.projects.update);

  // Track last synced data to prevent unnecessary syncs
  const lastSyncedMessagesRef = useRef<string>('');
  const lastSyncedStateRef = useRef<string>('');
  const lastSyncedFilesRef = useRef<string>('');
  const lastSyncedProjectNameRef = useRef<string | null>(null);
  const prevProjectIdRef = useRef<Id<'projects'> | string | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);

  /**
   * Create a stable hash of data to detect changes
   */
  const hashData = useCallback((data: any): string => {
    try {
      return JSON.stringify(data);
    } catch {
      return String(Date.now());
    }
  }, []);

  /**
   * Remove undefined values from an object (shallow)
   * Convex doesn't accept undefined - must be null or omitted
   */
  const cleanObject = useCallback(<T extends Record<string, any>>(obj: T): Partial<T> => {
    const cleaned: Partial<T> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== 'undefined') {
        cleaned[key as keyof T] = value;
      }
    }
    return cleaned;
  }, []);

  /**
   * Remove undefined values from an array
   */
  const cleanArray = useCallback(<T>(arr: T[]): T[] => {
    return arr.filter(item => item !== undefined && item !== 'undefined');
  }, []);

  /**
   * Sync messages to Convex
   */
  const syncMessagesToConvex = useCallback(async () => {
    if (!conversationId || !enabled || messages.length === 0) {
      return;
    }

    // Create lightweight hash (just IDs and content length to detect changes)
    const messagesHash = hashData(
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        len: m.content.length,
        ts: m.timestamp,
      })),
    );

    // Skip if no changes
    if (messagesHash === lastSyncedMessagesRef.current) {
      return;
    }

    try {
      await saveMessages({
        conversationId,
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.timestamp,
          component: typeof m.component === 'object' && m.component !== null ? 'component' : undefined,
        })),
      });

      lastSyncedMessagesRef.current = messagesHash;
      console.log('[useConvexSync] ✅ Synced', messages.length, 'messages');
    } catch (error) {
      console.error('[useConvexSync] ❌ Failed to sync messages:', error);
    }
  }, [conversationId, enabled, messages, hashData, saveMessages]);

  /**
   * Sync conversation state to Convex
   * Includes: palette, font, logo, business info, build state for recovery
   */
  const syncStateToConvex = useCallback(async () => {
    if (!conversationId || !enabled || !conversationState) {
      return;
    }

    const stateHash = hashData(conversationState);

    // Skip if no changes
    if (stateHash === lastSyncedStateRef.current) {
      return;
    }

    try {
      // Prepare state for Convex - clean out undefined values
      // Convex throws on undefined values, so we must filter them out
      const stateUpdate: any = cleanObject({
        id: conversationId,
        step: conversationState.step,
        projectDescription: conversationState.projectDescription,
        projectName: conversationState.projectName,
        selectedTemplateId: conversationState.selectedTemplateId,
        selectedTemplateName: conversationState.selectedTemplateName,
        projectUrlId: conversationState.projectUrlId,
        buildPhase: conversationState.buildPhase,
      });

      // Add palette if exists (with cleaned colors array)
      if (conversationState.selectedPalette) {
        stateUpdate.selectedPalette = cleanObject({
          id: conversationState.selectedPalette.id,
          name: conversationState.selectedPalette.name,
          colors: cleanArray(conversationState.selectedPalette.colors || []),
        });
      }

      // Add font if exists
      if (conversationState.selectedFont) {
        stateUpdate.selectedFont = cleanObject({
          id: conversationState.selectedFont.id,
          name: conversationState.selectedFont.name,
          heading: conversationState.selectedFont.heading,
          body: conversationState.selectedFont.body,
        });
      }

      // Add logo if exists
      if (conversationState.selectedLogo) {
        stateUpdate.selectedLogo = cleanObject({
          url: conversationState.selectedLogo.url,
          storageId: conversationState.selectedLogo.storageId,
          type: conversationState.selectedLogo.type,
          prompt: conversationState.selectedLogo.prompt,
        });
      }

      // Add business info if exists (critical for template recommendations)
      if (conversationState.businessInfo) {
        stateUpdate.businessInfo = cleanObject({
          uvp: conversationState.businessInfo.uvp,
          targetAudience: conversationState.businessInfo.targetAudience,
          businessGoals: conversationState.businessInfo.businessGoals,
          brandTone: conversationState.businessInfo.brandTone,
          sellingMethod: conversationState.businessInfo.sellingMethod,
          pricingOffers: conversationState.businessInfo.pricingOffers,
          industry: conversationState.businessInfo.industry,
        });
      }

      await updateState(stateUpdate);

      lastSyncedStateRef.current = stateHash;

      const syncDetails = {
        step: conversationState.step,
        buildPhase: conversationState.buildPhase,
        hasBusinessInfo: !!conversationState.businessInfo,
        hasPalette: !!conversationState.selectedPalette,
        hasFont: !!conversationState.selectedFont,
        hasLogo: !!conversationState.selectedLogo,
      };

      console.log('[useConvexSync] ✅ Synced state:', syncDetails);
    } catch (error) {
      console.error('[useConvexSync] ❌ Failed to sync state:', error);
    }
  }, [conversationId, enabled, conversationState, hashData, updateState, cleanObject, cleanArray]);

  /**
   * Sync project name to projects table (when name changes)
   * This also updates the urlId to be a slug of the project name
   */
  const syncProjectNameToConvex = useCallback(async () => {
    if (!projectId || !enabled || !conversationState?.projectName) {
      return;
    }

    // Check if projectId just became available (was null before)
    const projectIdJustBecameAvailable = projectId && !prevProjectIdRef.current;

    // Skip if name hasn't changed AND projectId didn't just become available
    if (conversationState.projectName === lastSyncedProjectNameRef.current && !projectIdJustBecameAvailable) {
      return;
    }

    try {
      await updateProject({
        projectId: projectId as Id<'projects'>,
        name: conversationState.projectName,
      });

      lastSyncedProjectNameRef.current = conversationState.projectName;
      prevProjectIdRef.current = projectId;
      console.log('[useConvexSync] ✅ Synced project name:', conversationState.projectName);
    } catch (error) {
      console.error('[useConvexSync] ❌ Failed to sync project name:', error);
    }
  }, [projectId, enabled, conversationState?.projectName, updateProject]);

  /**
   * Sync project files to Convex for session recovery
   */
  const syncFilesToConvex = useCallback(async () => {
    if (!projectId || !enabled || !files || Object.keys(files).length === 0) {
      return;
    }

    // Only hash file paths, not content (content can be huge)
    const filesHash = hashData(Object.keys(files).sort());

    // Skip if no changes
    if (filesHash === lastSyncedFilesRef.current) {
      return;
    }

    try {
      const fileArray = Object.entries(files).map(([path, content]) => ({
        path,
        content,
        type: path.endsWith('/') ? ('folder' as const) : ('file' as const),
      }));

      await syncFiles({
        projectId: projectId as Id<'projects'>,
        files: fileArray,
      });

      lastSyncedFilesRef.current = filesHash;
      console.log('[useConvexSync] ✅ Synced', fileArray.length, 'files');
    } catch (error) {
      console.error('[useConvexSync] ❌ Failed to sync files:', error);
    }
  }, [projectId, enabled, files, hashData, syncFiles]);

  /**
   * Immediately sync project name when projectId becomes available
   * This handles the case where name was set before project was created
   */
  useEffect(() => {
    // Check if projectId just became available and we have a pending name to sync
    if (projectId && !prevProjectIdRef.current && conversationState?.projectName) {
      /*
       * NOTE: We do NOT update prevProjectIdRef here - let syncProjectNameToConvex handle it
       * This ensures the sync function sees that projectId just became available
       */
      syncProjectNameToConvex();
    }
  }, [projectId, conversationState?.projectName, syncProjectNameToConvex]);

  /**
   * Debounced sync - combines messages, state, and files
   * Runs automatically when any data changes
   */
  useEffect(() => {
    if (!enabled || isSyncingRef.current) {
      return;
    }

    // Clear existing timer
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    // Set debounced sync
    syncTimerRef.current = setTimeout(async () => {
      isSyncingRef.current = true;

      try {
        // Sync all data types in parallel for efficiency
        await Promise.all([
          syncMessagesToConvex(),
          syncStateToConvex(),
          syncFilesToConvex(),
          syncProjectNameToConvex(),
        ]);
      } catch (error) {
        console.error('[useConvexSync] ❌ Sync error:', error);
      } finally {
        isSyncingRef.current = false;
      }
    }, debounceMs);

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [enabled, debounceMs, syncMessagesToConvex, syncStateToConvex, syncFilesToConvex, syncProjectNameToConvex]);

  /**
   * Flush sync immediately (for critical state changes)
   * Use this when:
   * - User completes a major step (template selection, personalization)
   * - Build starts/completes
   * - Before navigation away
   */
  const flushSync = useCallback(async () => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    isSyncingRef.current = true;

    try {
      await Promise.all([syncMessagesToConvex(), syncStateToConvex(), syncFilesToConvex(), syncProjectNameToConvex()]);
      console.log('[useConvexSync] 🚀 Flushed all data to Convex');
    } catch (error) {
      console.error('[useConvexSync] ❌ Flush error:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [syncMessagesToConvex, syncStateToConvex, syncFilesToConvex, syncProjectNameToConvex]);

  return {
    flushSync,
  };
}

export type { UseConvexSyncProps, ConversationState };

