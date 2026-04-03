/**
 * useOnboardingMessages Hook
 *
 * Manages chat message state for the supported handoff-backed editor flow.
 * Legacy onboarding LLM calls have been removed in favor of deterministic
 * inline copy for review/customization/build transitions.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { generateMessageId } from '~/components/editor/editor-chat/utils';
import type { ChatMessage, SuggestedReply } from '~/components/editor/editor-chat/types';
import type {
  UseOnboardingMessagesOptions,
  UseOnboardingMessagesReturn,
} from '~/components/editor/editor-chat/types/sharedState';

type MessageType = string;

function buildTransitionMessage(fromStep: string, toStep: string, context?: Record<string, unknown> | null): string {
  const templateName = typeof context?.templateName === 'string' ? context.templateName : null;
  const fontName = typeof context?.fontName === 'string' ? context.fontName : null;

  if (toStep === 'review') {
    return '**Project setup received.** Review the selected template, brand direction, and integrations below, then confirm when you want me to build the first version.';
  }

  if (fromStep === 'personalization' && toStep === 'integrations') {
    return fontName
      ? `Looks good. I'll keep the ${fontName} typography and move on to the integration review before we build.`
      : "Looks good. Let's review integrations before we build.";
  }

  if (fromStep === 'integrations' && toStep === 'creating') {
    return 'Everything is locked in. Starting the first build now.';
  }

  if (toStep === 'personalization') {
    return templateName
      ? `We'll keep the **${templateName}** template and adjust the palette, typography, and branding before the first build.`
      : "Let's adjust the palette, typography, and branding before the first build.";
  }

  return 'Updated. Continue with the next step when you are ready.';
}

function buildDeterministicMessage(messageType: MessageType, context?: Record<string, unknown> | null): string {
  switch (messageType) {
    case 'review-reminder':
      return 'Review the selected template, palette, font, and integrations below. Build only when you are ready.';
    default:
      return buildTransitionMessage('current', 'next', context);
  }
}

export function useOnboardingMessages(options: UseOnboardingMessagesOptions = {}): UseOnboardingMessagesReturn {
  const { onMessagesChange } = options;

  // ─── State ────────────────────────────────────────────────────────────────
  const [messages, setMessagesInternal] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<SuggestedReply[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track messages synchronously in a ref for immediate access (avoids async state issues)
  const messagesRef = useRef<ChatMessage[]>([]);

  // ─── Callbacks ────────────────────────────────────────────────────────────

  const setMessages = useCallback(
    (newMessages: ChatMessage[]) => {
      messagesRef.current = newMessages;
      setMessagesInternal(newMessages);
      onMessagesChange?.(newMessages);
    },
    [onMessagesChange],
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Scroll to bottom when messages change or typing state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping, suggestedReplies, scrollToBottom]);

  /**
   * Add a user message to the chat
   */
  const addUserMessage = useCallback(
    (content: string): ChatMessage => {
      const message: ChatMessage = {
        id: generateMessageId('user'),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // Update ref synchronously for immediate access
      messagesRef.current = [...messagesRef.current, message];
      setMessagesInternal((prev) => {
        const newMessages = [...prev, message];
        onMessagesChange?.(newMessages);

        return newMessages;
      });
      setSuggestedReplies([]);

      return message;
    },
    [onMessagesChange],
  );

  /**
   * Add an assistant message with typing animation
   */
  const addAssistantMessage = useCallback(
    (content: string, component?: React.ReactNode): ChatMessage => {
      const message: ChatMessage = {
        id: generateMessageId('msg'),
        role: 'assistant',
        content,
        timestamp: Date.now(),
        component,
      };

      // Update ref synchronously for immediate access
      messagesRef.current = [...messagesRef.current, message];

      setIsTyping(true);
      setTimeout(() => {
        setMessagesInternal((prev) => {
          const newMessages = [...prev, message];
          onMessagesChange?.(newMessages);

          return newMessages;
        });
        setIsTyping(false);
      }, 300);

      return message;
    },
    [onMessagesChange],
  );

  /**
   * Generate and add an LLM-powered message
   */
  const addLLMMessage = useCallback(
    async (
      messageType: MessageType,
      context?: Record<string, unknown> | null,
      component?: React.ReactNode | null,
      options?: { skipTypingIndicator?: boolean } | null,
    ): Promise<ChatMessage | null> => {
      if (!options?.skipTypingIndicator) {
        setIsTyping(true);
      }

      setIsGeneratingMessage(true);

      try {
        const content = buildDeterministicMessage(messageType, context);

        const message: ChatMessage = {
          id: generateMessageId('msg'),
          role: 'assistant',
          content,
          timestamp: Date.now(),
          component: component ?? undefined,
        };

        // Update ref synchronously for immediate access
        messagesRef.current = [...messagesRef.current, message];

        // Add message with minimal delay
        return new Promise<ChatMessage>((resolve) => {
          setTimeout(() => {
            setMessagesInternal((prev) => {
              const newMessages = [...prev, message];
              onMessagesChange?.(newMessages);

              return newMessages;
            });
            setIsTyping(false);
            setIsGeneratingMessage(false);
            resolve(message);
          }, 100);
        });
      } catch (error) {
        console.error('[useOnboardingMessages] Deterministic message failed:', error);
        setIsTyping(false);
        setIsGeneratingMessage(false);

        return null;
      }
    },
    [onMessagesChange],
  );

  /**
   * Get all messages synchronously (from ref, not state)
   * Use this when you need immediate access to messages after adding
   */
  const getMessagesSync = useCallback(() => messagesRef.current, []);

  /**
   * Add a step transition message - generates a SINGLE message for step transitions.
   * This replaces the pattern of calling addLLMMessage twice (once for acknowledgment,
   * once for next prompt) with a unified message that handles both.
   */
  const addStepTransitionMessage = useCallback(
    async (fromStep: string, toStep: string, context?: Record<string, unknown> | null): Promise<ChatMessage | null> => {
      setIsTyping(true);
      setIsGeneratingMessage(true);

      try {
        const content = buildTransitionMessage(fromStep, toStep, context);

        const message: ChatMessage = {
          id: generateMessageId('msg'),
          role: 'assistant',
          content,
          timestamp: Date.now(),
        };

        // Update ref synchronously for immediate access
        messagesRef.current = [...messagesRef.current, message];

        return new Promise<ChatMessage>((resolve) => {
          setTimeout(() => {
            setMessagesInternal((prev) => {
              const newMessages = [...prev, message];
              onMessagesChange?.(newMessages);

              return newMessages;
            });
            setIsTyping(false);
            setIsGeneratingMessage(false);
            resolve(message);
          }, 100);
        });
      } catch (error) {
        console.error('[useOnboardingMessages] Step transition message failed:', error);
        setIsTyping(false);
        setIsGeneratingMessage(false);

        return null;
      }
    },
    [onMessagesChange],
  );

  // Update an existing message by id (e.g. live agent status card)
  const updateMessage = useCallback((id: string, patch: Partial<import('../types').ChatMessage>) => {
    setMessagesInternal((prev) => prev.map((msg) => (msg.id === id ? { ...msg, ...patch } : msg)));
  }, []);

  return {
    // State
    messages,
    isTyping,
    isGeneratingMessage,
    suggestedReplies,
    messagesEndRef,

    // Actions
    setMessages,
    addUserMessage,
    addAssistantMessage,
    updateMessage,
    addLLMMessage,
    addStepTransitionMessage,
    setSuggestedReplies,
    scrollToBottom,
    setIsTyping,
    getMessagesSync,
  };
}

export type { UseOnboardingMessagesOptions, UseOnboardingMessagesReturn };
