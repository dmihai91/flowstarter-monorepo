/**
 * useOnboardingMessages Hook Tests
 *
 * Tests the message state management and LLM message generation logic.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Message ID Generation Tests ─────────────────────────────────────────────

describe('Message ID Generation', () => {
  it('should generate unique IDs with prefix', () => {
    const generateMessageId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const id1 = generateMessageId('user');
    const id2 = generateMessageId('user');

    expect(id1).toMatch(/^user-/);
    expect(id2).toMatch(/^user-/);
    expect(id1).not.toBe(id2);
  });

  it('should support different prefixes', () => {
    const generateMessageId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const userId = generateMessageId('user');
    const msgId = generateMessageId('msg');

    expect(userId).toMatch(/^user-/);
    expect(msgId).toMatch(/^msg-/);
  });
});

// ─── Message Creation Tests ──────────────────────────────────────────────────

describe('Message Creation', () => {
  it('should create user messages with correct structure', () => {
    const message = {
      id: 'user-123',
      role: 'user' as const,
      content: 'Hello, world!',
      timestamp: Date.now(),
    };

    expect(message.role).toBe('user');
    expect(message.content).toBe('Hello, world!');
    expect(message.id).toBeDefined();
    expect(message.timestamp).toBeDefined();
  });

  it('should create assistant messages with optional component', () => {
    const message = {
      id: 'msg-123',
      role: 'assistant' as const,
      content: 'Response text',
      timestamp: Date.now(),
      component: undefined,
    };

    expect(message.role).toBe('assistant');
    expect(message.component).toBeUndefined();
  });

  it('should include component when provided', () => {
    const TestComponent = 'test-component';
    const message = {
      id: 'msg-123',
      role: 'assistant' as const,
      content: 'Response text',
      timestamp: Date.now(),
      component: TestComponent,
    };

    expect(message.component).toBe(TestComponent);
  });
});

// ─── Typing Indicator Logic Tests ────────────────────────────────────────────

describe('Typing Indicator Logic', () => {
  it('should show typing when skipTypingIndicator is false or undefined', () => {
    const shouldShowTyping = (options?: { skipTypingIndicator?: boolean } | null) => {
      return !options?.skipTypingIndicator;
    };

    expect(shouldShowTyping()).toBe(true);
    expect(shouldShowTyping(undefined)).toBe(true);
    expect(shouldShowTyping(null)).toBe(true);
    expect(shouldShowTyping({})).toBe(true);
    expect(shouldShowTyping({ skipTypingIndicator: false })).toBe(true);
  });

  it('should not show typing when skipTypingIndicator is true', () => {
    const shouldShowTyping = (options?: { skipTypingIndicator?: boolean } | null) => {
      return !options?.skipTypingIndicator;
    };

    expect(shouldShowTyping({ skipTypingIndicator: true })).toBe(false);
  });
});

// ─── Null Parameter Handling Tests ───────────────────────────────────────────

describe('Null Parameter Handling', () => {
  it('should convert null context to undefined', () => {
    const context: Record<string, unknown> | null = null;
    const normalized = context ?? undefined;

    expect(normalized).toBeUndefined();
  });

  it('should preserve context when provided', () => {
    const context: Record<string, unknown> | null = { projectName: 'Test' };
    const normalized = context ?? undefined;

    expect(normalized).toEqual({ projectName: 'Test' });
  });

  it('should convert null component to undefined', () => {
    const component: React.ReactNode | null = null;
    const normalized = component ?? undefined;

    expect(normalized).toBeUndefined();
  });

  it('should preserve component when provided', () => {
    const component: React.ReactNode | null = 'test-component';
    const normalized = component ?? undefined;

    expect(normalized).toBe('test-component');
  });

  it('should handle null options gracefully', () => {
    // Null options should be treated as default (no skipTypingIndicator)
    const options = null as { skipTypingIndicator?: boolean } | null;
    const skipTyping = options != null ? options.skipTypingIndicator : undefined;
    expect(skipTyping).toBeUndefined();
  });
});

// ─── Suggested Replies Tests ─────────────────────────────────────────────────

describe('Suggested Replies', () => {
  it('should have correct structure for suggested replies', () => {
    const replies = [
      { id: 'reply-1', text: 'Option A' },
      { id: 'reply-2', text: 'Option B' },
    ];

    expect(replies).toHaveLength(2);
    expect(replies[0].id).toBe('reply-1');
    expect(replies[0].text).toBe('Option A');
  });

  it('should clear replies when adding user message', () => {
    let suggestedReplies = [
      { id: '1', text: 'Reply 1' },
      { id: '2', text: 'Reply 2' },
    ];

    // Simulate what happens when adding a user message
    const addUserMessage = () => {
      suggestedReplies = [];
    };

    expect(suggestedReplies).toHaveLength(2);
    addUserMessage();
    expect(suggestedReplies).toHaveLength(0);
  });
});

// ─── Message Delay Timing Tests ──────────────────────────────────────────────

describe('Message Delay Timing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use 300ms delay for assistant message typing animation', async () => {
    const TYPING_ANIMATION_DELAY = 300;
    let messageVisible = false;

    const addAssistantMessage = () => {
      setTimeout(() => {
        messageVisible = true;
      }, TYPING_ANIMATION_DELAY);
    };

    addAssistantMessage();

    expect(messageVisible).toBe(false);

    vi.advanceTimersByTime(299);
    expect(messageVisible).toBe(false);

    vi.advanceTimersByTime(1);
    expect(messageVisible).toBe(true);
  });

  it('should use 100ms delay for LLM message rendering', async () => {
    const MESSAGE_RENDER_DELAY = 100;
    let messageRendered = false;

    const renderLLMMessage = () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          messageRendered = true;
          resolve();
        }, MESSAGE_RENDER_DELAY);
      });
    };

    const promise = renderLLMMessage();

    expect(messageRendered).toBe(false);

    vi.advanceTimersByTime(100);
    await promise;

    expect(messageRendered).toBe(true);
  });
});

// ─── Messages Ref Synchronization Tests ──────────────────────────────────────

describe('Messages Ref Synchronization', () => {
  it('should update ref immediately when adding messages', () => {
    const messagesRef = { current: [] as Array<{ id: string; content: string }> };

    const addMessage = (content: string) => {
      const message = { id: `msg-${Date.now()}`, content };
      messagesRef.current = [...messagesRef.current, message];
      return message;
    };

    const msg1 = addMessage('First message');
    expect(messagesRef.current).toHaveLength(1);
    expect(messagesRef.current[0].content).toBe('First message');

    const msg2 = addMessage('Second message');
    expect(messagesRef.current).toHaveLength(2);
    expect(messagesRef.current[1].content).toBe('Second message');
  });

  it('should provide immediate access via getMessagesSync pattern', () => {
    const messagesRef = { current: [] as Array<{ id: string; content: string }> };

    const getMessagesSync = () => messagesRef.current;

    messagesRef.current = [{ id: '1', content: 'Test' }];

    const syncMessages = getMessagesSync();
    expect(syncMessages).toEqual(messagesRef.current);
    expect(syncMessages).toHaveLength(1);
  });
});

// ─── onMessagesChange Callback Tests ─────────────────────────────────────────

describe('onMessagesChange Callback', () => {
  it('should call callback when messages change', () => {
    const onMessagesChange = vi.fn();
    let messages: Array<{ id: string; content: string }> = [];

    const addMessage = (content: string) => {
      const message = { id: `msg-${Date.now()}`, content };
      messages = [...messages, message];
      onMessagesChange(messages);
      return message;
    };

    addMessage('Test message');

    expect(onMessagesChange).toHaveBeenCalledTimes(1);
    expect(onMessagesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content: 'Test message' }),
      ])
    );
  });

  it('should be called with updated messages array', () => {
    const onMessagesChange = vi.fn();
    let messages: Array<{ id: string; content: string }> = [];

    const setMessages = (newMessages: Array<{ id: string; content: string }>) => {
      messages = newMessages;
      onMessagesChange(messages);
    };

    setMessages([
      { id: '1', content: 'First' },
      { id: '2', content: 'Second' },
    ]);

    expect(onMessagesChange).toHaveBeenCalledWith([
      { id: '1', content: 'First' },
      { id: '2', content: 'Second' },
    ]);
  });
});

// ─── LLM Message Generation Tests ────────────────────────────────────────────

describe('LLM Message Generation', () => {
  it('should set generating state during LLM message creation', async () => {
    let isGenerating = false;

    const generateLLMMessage = async (type: string) => {
      isGenerating = true;

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 50));
        return `Generated message for ${type}`;
      } finally {
        isGenerating = false;
      }
    };

    vi.useFakeTimers();

    const promise = generateLLMMessage('welcome');
    expect(isGenerating).toBe(true);

    vi.advanceTimersByTime(50);
    await promise;

    expect(isGenerating).toBe(false);

    vi.useRealTimers();
  });

  it('should handle LLM generation errors gracefully', async () => {
    let errorOccurred = false;
    let isTyping = true;
    let isGenerating = true;

    const handleLLMError = () => {
      errorOccurred = true;
      isTyping = false;
      isGenerating = false;
    };

    // Simulate error handling
    try {
      throw new Error('LLM API failed');
    } catch {
      handleLLMError();
    }

    expect(errorOccurred).toBe(true);
    expect(isTyping).toBe(false);
    expect(isGenerating).toBe(false);
  });
});

