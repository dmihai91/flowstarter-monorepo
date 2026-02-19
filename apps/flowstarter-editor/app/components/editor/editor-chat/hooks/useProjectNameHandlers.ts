/* eslint-disable no-restricted-imports */
/**
 * useProjectNameHandlers Hook
 *
 * Handles project name generation and submission logic.
 * Uses React Query mutations for API calls with automatic retries.
 * Tracks conversation history to avoid repeating names and respect accumulated requirements.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useMutation as useConvexMutation } from 'convex/react';
import { api } from '~/convex/_generated/api';
import { useMutation } from '@tanstack/react-query';
import { hasHandoffConnection, syncProjectToMainPlatform } from '~/lib/services/projectSyncService';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';
import type { UseBusinessInfoReturn } from './useBusinessInfo';
import type { InitialChatState } from '../types';
import { DEFAULT_PROJECT_NAME_GENERATION, SUGGESTED_REPLIES } from '../constants';
import { NAME_GENERATION_ERRORS, formatErrorForUser, getErrorSuggestions } from '../errors';

interface UseProjectNameHandlersProps {
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  businessHook: UseBusinessInfoReturn;
  onStateChange?: (state: Partial<InitialChatState>) => void;
  lastAction: { type: string; payload?: unknown } | null;
  setLastAction: (action: { type: string; payload?: unknown } | null) => void;
}

interface UseProjectNameHandlersReturn {
  generateProjectName: (description: string) => Promise<string>;
  handleNameSubmit: (name: string) => Promise<void>;
  /** Reset name conversation history (call when starting fresh) */
  resetNameHistory: () => void;
}

export function useProjectNameHandlers({
  messageHook,
  flowHook,
  businessHook,
  onStateChange,
  lastAction,
  setLastAction,
}: UseProjectNameHandlersProps): UseProjectNameHandlersReturn {
  // ─── Name Availability Check ──────────────────────────────────────────────
  const checkNameAvailability = useConvexMutation(api.projects.checkNameAvailability);

  // ─── Conversation History Tracking ───────────────────────────────────────
  const [previouslySuggested, setPreviouslySuggested] = useState<string[]>([]);
  const [accumulatedRequirements, setAccumulatedRequirements] = useState<string[]>([]);
  
  // Reset function for starting fresh
  const resetNameHistory = useCallback(() => {
    setPreviouslySuggested([]);
    setAccumulatedRequirements([]);
  }, []);
  
  // Helper to add a suggested name to history
  const addToSuggestedHistory = useCallback((name: string) => {
    setPreviouslySuggested(prev => {
      if (prev.includes(name)) return prev;
      return [...prev, name];
    });
  }, []);

  // ─── Request Cancellation ────────────────────────────────────────────────
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // ─── React Query Mutation for Name Generation ────────────────────────────
  const generateNameMutation = useMutation({
    mutationFn: async (params: { 
      projectDescription: string; 
      previousName?: string; 
      refinementFeedback?: string;
      action?: string;
      previouslySuggested?: string[];
      accumulatedRequirements?: string[];
    }) => {
      const response = await fetch('/api/generate-project-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate name: ${response.status}`);
      }

      const data = (await response.json()) as { projectName: string };
      return data.projectName;
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const generateProjectName = useCallback(async (descriptionOrPrompt: string): Promise<string> => {
    console.log('[generateProjectName] Called with:', descriptionOrPrompt);

    // Use project description if available, otherwise use the prompt/input
    let contextForGeneration = descriptionOrPrompt || flowHook.projectDescription || '';

    /*
     * Fallback: If no description, try to find the first user message (initial prompt)
     * This handles cases where state might be lost but history remains, or when user refers to "initial prompt"
     */
    if (!contextForGeneration || contextForGeneration.trim().length === 0) {
      const messages = messageHook.getMessagesSync();
      const firstUserMessage = messages.find((m) => m.role === 'user' && !m.content.includes('Suggest a name'));

      if (firstUserMessage) {
        contextForGeneration = firstUserMessage.content;
        console.log('[generateProjectName] Found initial user prompt from history:', contextForGeneration);
      }
    }

    console.log('[generateProjectName] Using context:', contextForGeneration);

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      console.log('[generateProjectName] Calling API via React Query mutation...');

      const projectName = await generateNameMutation.mutateAsync({ 
        projectDescription: contextForGeneration 
      });

      console.log('[generateProjectName] API returned name:', projectName);

      // Accept any non-empty name from the API (including fallback-generated names)
      if (projectName && projectName.trim().length > 0) {
        // Track this name in history
        addToSuggestedHistory(projectName);
        return projectName;
      }
    } catch (error) {
      // Don't log aborted requests as errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[generateProjectName] Request aborted');
        throw error; // Re-throw so caller knows it was aborted
      }

      console.error('[useProjectNameHandlers] Failed to generate project name:', error);
      // Re-throw to surface the error instead of silently falling back
      throw error;
    }
    
    // If we got here, the API returned but with no valid name - throw an error
    throw new Error('API returned no valid project name');
  }, [flowHook.projectDescription, messageHook, generateNameMutation, addToSuggestedHistory]);

  const handleNameSubmit = useCallback(
    async (name: string) => {
      // Check if we are in manual name entry mode (from "I have my own" click)
      const isManualEntry = lastAction?.type === 'awaiting-manual-name';

      messageHook.addUserMessage(name);
      messageHook.setSuggestedReplies([]);
      setLastAction({ type: 'name-input', payload: name });

      // Show typing immediately after user message
      messageHook.setIsTyping(true);

      // MANUAL ENTRY FAST PATH: Bypass LLM entirely if user explicitly chose to enter a name
      if (isManualEntry) {
        // Tiny delay to simulate processing but fast
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Direct assignment
        const extractedName = name.trim();

        // Check if name is already taken
        try {
          const availability = await checkNameAvailability({ name: extractedName });
          if (!availability.available) {
            messageHook.setIsTyping(false);
            const reason = availability.reason === 'slug_taken' 
              ? `The URL slug for "${extractedName}" is already taken by another project.`
              : `A project named "${availability.existingName}" already exists.`;
            messageHook.addAssistantMessage(`${reason} Please try a different name.`);
            messageHook.setSuggestedReplies([{ id: 'suggest-name', text: 'Suggest a name' }]);
            return;
          }
        } catch (err) {
          console.warn('[handleNameSubmit] Name availability check failed, proceeding anyway:', err);
        }

        flowHook.setProjectName(extractedName);
        onStateChange?.({ projectName: extractedName });

        // Sync to main platform
        if (hasHandoffConnection()) {
          syncProjectToMainPlatform({
            name: extractedName,
            description: flowHook.projectDescription || '',
            onboardingStep: 'business-info',
          });
        }

        await messageHook.addStepTransitionMessage('name', 'quick-profile', { projectName: extractedName });

        flowHook.setStep('quick-profile');
        messageHook.setIsTyping(false);
        resetNameHistory();

        return;
      }

      /*
       * Let the LLM handle all interpretation:
       * - Is this a name confirmation?
       * - Is this a name the user is providing?
       * - Is this a refinement request?
       * - What requirements should be extracted?
       */
      try {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/generate-project-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userInput: name,
            action: 'extract',
            previousSuggestion: flowHook.lastSuggestedName,
            projectDescription: flowHook.projectDescription,
            previouslySuggested: previouslySuggested,
            accumulatedRequirements: accumulatedRequirements,
          }),
          signal: abortControllerRef.current.signal,
        });

        const result = (await response.json()) as
          | { projectName: string; needsFollowUp?: false }
          | { needsFollowUp: true; suggestedName: string; followUpMessage: string; extractedRequirements?: string[] }
          | { error: true; message: string };

        messageHook.setIsTyping(false);

        if ('error' in result && result.error) {
          messageHook.addAssistantMessage(`⚠️ ${result.message}`);
          messageHook.setSuggestedReplies(SUGGESTED_REPLIES.nameExtractionError());
          return;
        }

        if ('needsFollowUp' in result && result.needsFollowUp) {
          // This is a refinement - LLM suggested a new name
          flowHook.setLastSuggestedName(result.suggestedName);
          flowHook.setProjectName(result.suggestedName);
          onStateChange?.({ projectName: result.suggestedName });
          
          // Track this name in history
          addToSuggestedHistory(result.suggestedName);
          
          // If LLM extracted requirements, accumulate them
          if (result.extractedRequirements && result.extractedRequirements.length > 0) {
            setAccumulatedRequirements(prev => {
              const combined = [...prev];
              for (const req of result.extractedRequirements!) {
                if (!combined.includes(req)) {
                  combined.push(req);
                }
              }
              return combined;
            });
          }
          
          messageHook.addAssistantMessage(result.followUpMessage);
          messageHook.setSuggestedReplies(SUGGESTED_REPLIES.nameRefinementWithName(result.suggestedName));
          return;
        }

        // Direct name provided or confirmed
        const extractedName = (result as { projectName: string }).projectName;

        // Check if name is already taken
        try {
          const availability = await checkNameAvailability({ name: extractedName });
          if (!availability.available) {
            const reason = availability.reason === 'slug_taken'
              ? `The URL slug for "${extractedName}" is already taken by another project.`
              : `A project named "${availability.existingName}" already exists.`;
            messageHook.addAssistantMessage(`${reason} Please try a different name.`);
            messageHook.setSuggestedReplies([{ id: 'suggest-name', text: 'Suggest a name' }]);
            return;
          }
        } catch (err) {
          console.warn('[handleNameSubmit] Name availability check failed, proceeding anyway:', err);
        }

        flowHook.setProjectName(extractedName);
        onStateChange?.({ projectName: extractedName });

        // Sync to main platform
        if (hasHandoffConnection()) {
          syncProjectToMainPlatform({
            name: extractedName,
            description: flowHook.projectDescription || '',
            onboardingStep: 'business-info',
          });
        }

        await messageHook.addStepTransitionMessage('name', 'quick-profile', { projectName: extractedName });

        flowHook.setStep('quick-profile');
        resetNameHistory();
      } catch (error) {
        // Don't show error for aborted requests
        if (error instanceof Error && error.name === 'AbortError') {
          messageHook.setIsTyping(false);
          return;
        }

        console.error('[handleNameSubmit] Error:', error);
        messageHook.setIsTyping(false);
        messageHook.addAssistantMessage(formatErrorForUser(NAME_GENERATION_ERRORS.EXTRACTION_FAILED));
        messageHook.setSuggestedReplies(getErrorSuggestions('name'));
      }
    },
    [
      flowHook, 
      messageHook, 
      onStateChange, 
      setLastAction, 
      lastAction,
      previouslySuggested,
      accumulatedRequirements,
      addToSuggestedHistory,
      resetNameHistory,
      checkNameAvailability,
    ],
  );

  return {
    generateProjectName,
    handleNameSubmit,
    resetNameHistory,
  };
}

export type { UseProjectNameHandlersProps, UseProjectNameHandlersReturn };

